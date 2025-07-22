import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "@/hooks/useDatabase";
import { useToast } from "@chakra-ui/react";
import {
  InventoryChangeReason,
  InventoryHistoryRecord,
  HistoryQueryParams,
  PaginatedHistoryResult,
  HistoryStats,
} from "@/types/Inventory";

export function useInventoryHistory() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const { db, isInitializing, error: dbError } = useDatabase();

  // Sync database error with local error state
  useEffect(() => {
    if (dbError) setError(dbError);
  }, [dbError]);

  /**
   * Get inventory history records with filtering and pagination
   */
  const getInventoryHistory = useCallback(
    async (
      params: HistoryQueryParams = {},
    ): Promise<PaginatedHistoryResult> => {
      try {
        setIsLoading(true);
        setError(null);
        if (!db) throw new Error("Database not initialized");

        // Build the base query
        let query = `
          SELECT 
            ih.*,
            p.name as product_name,
            ib.batch_number
          FROM inventory_history ih
          JOIN inventory_batches ib ON ih.batch_id = ib.id
          JOIN products p ON ib.product_id = p.id
        `;

        const conditions: string[] = [];
        const queryParams: unknown[] = [];

        // Add filters
        if (params.batchId !== undefined) {
          conditions.push("ih.batch_id = ?");
          queryParams.push(params.batchId);
        }

        if (params.productId !== undefined) {
          conditions.push("ib.product_id = ?");
          queryParams.push(params.productId);
        }

        if (params.reason !== undefined) {
          conditions.push("ih.reason = ?");
          queryParams.push(params.reason);
        }

        if (params.dateFrom !== undefined) {
          conditions.push("ih.created_at >= ?");
          queryParams.push(params.dateFrom);
        }

        if (params.dateTo !== undefined) {
          conditions.push("ih.created_at <= ?");
          queryParams.push(params.dateTo);
        }

        // Add WHERE clause if there are conditions
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(" AND ")}`;
        }

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
        const [countResult] = await db.select<{ total: number }[]>(
          countQuery,
          queryParams,
        );
        const total = countResult?.total || 0;

        // Add sorting
        const orderBy = params.orderBy || "created_at";
        const orderDirection = params.orderDirection || "DESC";
        query += ` ORDER BY ${orderBy} ${orderDirection}`;

        // Add pagination
        if (params.limit !== undefined) {
          query += " LIMIT ?";
          queryParams.push(params.limit);

          if (params.offset !== undefined) {
            query += " OFFSET ?";
            queryParams.push(params.offset);
          }
        }

        // Execute the query
        const records = await db.select<InventoryHistoryRecord[]>(
          query,
          queryParams,
        );

        return {
          records: records || [],
          total,
          limit: params.limit || total,
          offset: params.offset || 0,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch inventory history";
        setError(message);
        toast({
          title: "Error",
          description: message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, toast],
  );

  /**
   * Get statistics about inventory changes
   */
  const getHistoryStatistics = useCallback(
    async (
      params: Omit<HistoryQueryParams, "limit" | "offset"> = {},
    ): Promise<HistoryStats> => {
      try {
        setIsLoading(true);
        setError(null);
        if (!db) throw new Error("Database not initialized");

        // Base query for stats
        let query = `
          SELECT 
            SUM(CASE WHEN change > 0 THEN change ELSE 0 END) as total_added,
            SUM(CASE WHEN change < 0 THEN ABS(change) ELSE 0 END) as total_removed,
            reason as most_common_reason
          FROM inventory_history ih
          JOIN inventory_batches ib ON ih.batch_id = ib.id
        `;

        const conditions: string[] = [];
        const queryParams: unknown[] = [];

        // Add filters
        if (params.batchId !== undefined) {
          conditions.push("ih.batch_id = ?");
          queryParams.push(params.batchId);
        }

        if (params.productId !== undefined) {
          conditions.push("ib.product_id = ?");
          queryParams.push(params.productId);
        }

        if (params.reason !== undefined) {
          conditions.push("ih.reason = ?");
          queryParams.push(params.reason);
        }

        if (params.dateFrom !== undefined) {
          conditions.push("ih.created_at >= ?");
          queryParams.push(params.dateFrom);
        }

        if (params.dateTo !== undefined) {
          conditions.push("ih.created_at <= ?");
          queryParams.push(params.dateTo);
        }

        // Add WHERE clause if there are conditions
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(" AND ")}`;
        }

        // Group by reason to find the most common one
        query += `
          GROUP BY reason
          ORDER BY COUNT(*) DESC
          LIMIT 1
        `;

        // Execute the stats query
        const [stats] = await db.select<
          {
            total_added: number;
            total_removed: number;
            most_common_reason: InventoryChangeReason;
          }[]
        >(query, queryParams);

        // Get recent activity
        const { records: recentActivity } = await getInventoryHistory({
          ...params,
          limit: 5,
          orderBy: "created_at",
          orderDirection: "DESC",
        });

        return {
          total_added: stats?.total_added || 0,
          total_removed: stats?.total_removed || 0,
          most_common_reason: stats?.most_common_reason || "other",
          recent_activity: recentActivity,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch history statistics";
        setError(message);
        toast({
          title: "Error",
          description: message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, getInventoryHistory, toast],
  );

  /**
   * Add a new inventory history record
   */
  const addHistoryRecord = useCallback(
    async (
      batchId: number,
      change: number,
      reason: InventoryChangeReason,
      note?: string,
    ): Promise<number> => {
      try {
        setIsLoading(true);
        setError(null);
        if (!db) throw new Error("Database not initialized");

        const result = await db.execute(
          `INSERT INTO inventory_history (
            batch_id, change, reason, note, created_at
          ) VALUES (?, ?, ?, ?, datetime('now'))`,
          [batchId, change, reason, note || null],
        );

        if (typeof result.lastInsertId !== "number") {
          throw new Error("Failed to retrieve record ID after insertion");
        }

        toast({
          title: "Record added",
          status: "success",
          duration: 3000,
        });

        return result.lastInsertId;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add history record";
        setError(message);
        toast({
          title: "Error",
          description: message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, toast],
  );

  /**
   * Delete a history record (admin function)
   */
  const deleteHistoryRecord = useCallback(
    async (recordId: number): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);
        if (!db) throw new Error("Database not initialized");

        const result = await db.execute(
          "DELETE FROM inventory_history WHERE id = ?",
          [recordId],
        );

        if (result.rowsAffected === 0) {
          throw new Error("Record not found or already deleted");
        }

        toast({
          title: "Record deleted",
          status: "success",
          duration: 3000,
        });

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete record";
        setError(message);
        toast({
          title: "Error",
          description: message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, toast],
  );

  /**
   * Get all possible change reasons
   */
  const getChangeReasons = useCallback((): InventoryChangeReason[] => {
    return [
      "initial_stock",
      "restock",
      "sale",
      "adjustment",
      "damaged",
      "expired",
      "transfer",
      "delete",
      "edit",
      "merge",
      "split",
      "other",
    ];
  }, []);

  return {
    getInventoryHistory,
    getHistoryStatistics,
    addHistoryRecord,
    deleteHistoryRecord,
    getChangeReasons,
    isLoading: isLoading || isInitializing,
    error,
    isInitializing,
    resetError: () => setError(null),
  };
}
