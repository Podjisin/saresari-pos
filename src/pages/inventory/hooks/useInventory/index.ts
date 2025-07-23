import { useState, useEffect } from "react";
import { useDatabase } from "@/hooks/useDatabase";
import { useToast } from "@chakra-ui/react";
import { useInventoryBatches } from "./batches";
import { useInventorySales } from "./sales";
import { useInventoryProducts } from "./products";
import { useInventoryUtils } from "./utils";
import { QueryOptions } from "@/types/Inventory";

/**
 * React hook that provides inventory and product management operations with integrated database access, error handling, and UI feedback.
 *
 * Returns an object containing generic query and mutation functions, inventory batch operations, sales and product utilities, loading and error states, and a method to reset errors.
 */
export function useInventory() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { db, isInitializing, error: dbError } = useDatabase();

  // Sync database error with local error state
  useEffect(() => {
    if (dbError && error !== dbError) {
      setError(dbError);
    }
  }, [dbError, error]);

  // Shared utilities
  const { recordInventoryChange, recordProductChange } = useInventoryUtils({
    db,
    setError,
  });

  // Inventory batch operations
  const {
    addInventoryBatch,
    updateInventoryBatchQuantity,
    deleteInventoryBatch,
    editInventoryBatch,
    transferInventory,
  } = useInventoryBatches({
    db,
    setError,
    setIsLoading,
    recordInventoryChange,
  });

  // Sales logic
  const { createSale } = useInventorySales({
    db,
    setError,
    setIsLoading,
    recordInventoryChange,
  });

  // Product logic
  const { upsertProduct } = useInventoryProducts({
    db,
    setError,
    setIsLoading,
    recordProductChange,
  });

  // Generic query
  const query = async <T = unknown>(
    sql: string,
    { params = [], skip = false, initialData = [] }: QueryOptions<T> = {},
  ): Promise<T[]> => {
    if (skip || isInitializing) return initialData;

    try {
      setIsLoading(true);
      setError(null);
      if (!db) throw new Error("Database not initialized");

      const results = await db.select<T[]>(sql, params);
      return results ?? [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Database error";
      setError(message);
      toast({
        title: "Query failed",
        description: message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Generic mutation
  const mutate = async (
    sql: string,
    params: unknown[] = [],
  ): Promise<number> => {
    try {
      if (isInitializing) throw new Error("Database not initialized");
      setIsLoading(true);
      setError(null);

      if (!db) throw new Error("Database not initialized");
      const result = await db.execute(sql, params);

      toast({
        title: "Operation successful",
        status: "success",
        duration: 3000,
      });
      return result.rowsAffected;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Mutation failed";
      setError(message);
      toast({
        title: "Operation failed",
        description: message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    query,
    mutate,
    addInventoryBatch,
    updateInventoryBatchQuantity,
    deleteInventoryBatch,
    editInventoryBatch,
    transferInventory,
    createSale,
    recordInventoryChange,
    upsertProduct,
    isLoading: isLoading || isInitializing,
    error,
    isInitializing,
    resetError: () => setError(null),
  };
}
