import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../useDatabase";
import { useToast } from "@chakra-ui/react";

// Type definitions
type QueryOptions<T = any> = {
  params?: any[];
  skip?: boolean;
  initialData?: T[];
};

type InventoryChangeReason =
  | "initial_stock"
  | "restock"
  | "sale"
  | "adjustment"
  | "damaged"
  | "expired"
  | "transfer"
  | "delete"
  | "edit"
  | "merge"
  | "split"
  | "other";

interface InventoryBatch {
  product_id: number;
  quantity: number;
  cost_price: number;
  expiration_date?: string | null;
  batch_number?: string | null;
}

interface BatchUpdate {
  cost_price?: number;
  expiration_date?: string | null;
  batch_number?: string | null;
}

interface SaleItem {
  batchId: number;
  quantity: number;
  priceAtSale: number;
}

interface ProductUpsert {
  name: string;
  barcode: string | null;
  selling_price: number;
  unit_id?: number;
  category_id?: number;
}

export function useInventory() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const { db, isInitializing, error: dbError } = useDatabase();

  // Sync database error with local error state
  useEffect(() => {
    if (dbError) setError(dbError);
  }, [dbError]);

  /**
   * Records inventory changes in the history table
   */
  const recordInventoryChange = useCallback(
    async (
      batchId: number,
      change: number,
      reason: InventoryChangeReason,
      note?: string,
    ) => {
      if (!db) throw new Error("Database not initialized");

      try {
        await db.execute(
          `INSERT INTO inventory_history (
            batch_id, change, reason, note, created_at
          ) VALUES (?, ?, ?, ?, datetime('now'))`,
          [batchId, change, reason, note ?? null],
        );
      } catch (err) {
        console.error("Error recording inventory history:", err);
        throw new Error("Failed to log inventory change");
      }
    },
    [db],
  );

  /**
   * Adds a new inventory batch and records the initial stock
   */
  const addInventoryBatch = useCallback(
    async (batch: InventoryBatch) => {
      try {
        setIsLoading(true);
        setError(null);

        if (!db) throw new Error("Database not initialized");

        const result = await db.execute(
          `INSERT INTO inventory_batches (
            product_id, quantity, cost_price, 
            expiration_date, batch_number, date_added
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [
            batch.product_id,
            batch.quantity,
            batch.cost_price,
            batch.expiration_date || null,
            batch.batch_number || null,
          ],
        );

        const batchId = result.lastInsertId;
        if (typeof batchId !== "number") {
          throw new Error("Failed to retrieve batch ID after insertion");
        }

        await recordInventoryChange(
          batchId,
          batch.quantity,
          "initial_stock",
          "Initial stock entry",
        );

        return batchId;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add inventory batch";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, recordInventoryChange],
  );

  /**
   * Updates inventory batch quantity and records the change
   */
  const updateInventoryBatchQuantity = useCallback(
    async (
      batchId: number,
      newQuantity: number,
      reason: InventoryChangeReason,
      note?: string,
    ) => {
      try {
        setIsLoading(true);
        setError(null);
        if (!db) throw new Error("Database not initialized");

        // Get current quantity
        const [current] = await db.select<{ quantity: number }[]>(
          "SELECT quantity FROM inventory_batches WHERE id = ? LIMIT 1",
          [batchId],
        );

        if (!current) throw new Error("Batch not found");

        const change = newQuantity - current.quantity;

        // Update the batch quantity
        await db.execute(
          "UPDATE inventory_batches SET quantity = ? WHERE id = ?",
          [newQuantity, batchId],
        );

        // Record the change if there's a difference
        if (change !== 0) {
          await recordInventoryChange(batchId, change, reason, note);
        }

        return change;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Database error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, recordInventoryChange],
  );

  /**
   * Deletes an inventory batch and records the removal
   */
  const deleteInventoryBatch = useCallback(
    async (batchId: number, note?: string) => {
      try {
        setIsLoading(true);
        setError(null);
        if (!db) throw new Error("Database not initialized");

        // Get current quantity before deletion
        const [current] = await db.select<{ quantity: number }[]>(
          "SELECT quantity FROM inventory_batches WHERE id = ? LIMIT 1",
          [batchId],
        );

        if (!current) throw new Error("Batch not found");

        // Record deletion in history before actually deleting
        await recordInventoryChange(
          batchId,
          -current.quantity,
          "delete",
          note || "Batch deleted",
        );

        // Delete the batch
        await db.execute("DELETE FROM inventory_batches WHERE id = ?", [
          batchId,
        ]);

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Database error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, recordInventoryChange],
  );

  /**
   * Edits inventory batch details and records the changes
   */
  const editInventoryBatch = useCallback(
    async (batchId: number, updates: BatchUpdate, note?: string) => {
      try {
        setIsLoading(true);
        setError(null);
        if (!db) throw new Error("Database not initialized");

        // Get current batch data
        const [current] = await db.select<
          {
            cost_price: number;
            expiration_date: string | null;
            batch_number: string | null;
          }[]
        >(
          "SELECT cost_price, expiration_date, batch_number FROM inventory_batches WHERE id = ? LIMIT 1",
          [batchId],
        );

        if (!current) throw new Error("Batch not found");

        const changes: string[] = [];
        const updateFields: string[] = [];
        const updateParams: any[] = [];

        // Check each field for changes
        if (
          updates.cost_price !== undefined &&
          updates.cost_price !== current.cost_price
        ) {
          updateFields.push("cost_price = ?");
          updateParams.push(updates.cost_price);
          changes.push(
            `Cost price changed from ${current.cost_price} to ${updates.cost_price}`,
          );
        }

        if (updates.expiration_date !== undefined) {
          const newExpDate = updates.expiration_date;
          const currentExpDate = current.expiration_date;
          if (newExpDate !== currentExpDate) {
            updateFields.push("expiration_date = ?");
            updateParams.push(newExpDate);
            changes.push(
              `Expiration date changed from ${currentExpDate} to ${newExpDate}`,
            );
          }
        }

        if (updates.batch_number !== undefined) {
          const newBatchNum = updates.batch_number;
          const currentBatchNum = current.batch_number;
          if (newBatchNum !== currentBatchNum) {
            updateFields.push("batch_number = ?");
            updateParams.push(newBatchNum);
            changes.push(
              `Batch number changed from ${currentBatchNum} to ${newBatchNum}`,
            );
          }
        }

        // Only proceed if there are changes
        if (updateFields.length === 0) return false;

        // Update the batch
        await db.execute(
          `UPDATE inventory_batches SET ${updateFields.join(", ")} WHERE id = ?`,
          [...updateParams, batchId],
        );

        // Record the edit in history
        if (changes.length > 0) {
          await recordInventoryChange(
            batchId,
            0,
            "edit",
            note || changes.join(", "),
          );
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Database error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, recordInventoryChange],
  );

  /**
   * Transfers inventory between batches with transaction safety
   */
  const transferInventory = useCallback(
    async (
      fromBatchId: number,
      toBatchId: number,
      quantity: number,
      note?: string,
    ) => {
      try {
        setIsLoading(true);
        setError(null);
        if (!db) throw new Error("Database not initialized");

        await db.execute("BEGIN TRANSACTION");

        try {
          // Verify both batches exist and have enough quantity
          const batches = await db.select<
            { id: number; quantity: number; product_id: number }[]
          >(
            "SELECT id, quantity, product_id FROM inventory_batches WHERE id IN (?, ?)",
            [fromBatchId, toBatchId],
          );

          if (batches.length !== 2) {
            throw new Error("One or both batches not found");
          }

          const fromBatch = batches.find((b) => b.id === fromBatchId);
          const toBatch = batches.find((b) => b.id === toBatchId);

          if (!fromBatch || !toBatch) {
            throw new Error("Batch lookup failed");
          }

          if (fromBatch.product_id !== toBatch.product_id) {
            throw new Error("Cannot transfer between different products");
          }

          if (fromBatch.quantity < quantity) {
            throw new Error("Insufficient quantity in source batch");
          }

          // Update quantities
          await db.execute(
            "UPDATE inventory_batches SET quantity = quantity - ? WHERE id = ?",
            [quantity, fromBatchId],
          );

          await db.execute(
            "UPDATE inventory_batches SET quantity = quantity + ? WHERE id = ?",
            [quantity, toBatchId],
          );

          // Record the transfers
          await recordInventoryChange(
            fromBatchId,
            -quantity,
            "transfer",
            note || `Transferred to batch ${toBatchId}`,
          );

          await recordInventoryChange(
            toBatchId,
            quantity,
            "transfer",
            note || `Transferred from batch ${fromBatchId}`,
          );

          await db.execute("COMMIT");
          return true;
        } catch (err) {
          await db.execute("ROLLBACK");
          throw err;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Database error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, recordInventoryChange],
  );

  /**
   * Creates a sale with multiple items and updates inventory
   */
  const createSale = useCallback(
    async (
      items: SaleItem[],
      cashReceived: number,
      total: number,
      change: number,
    ) => {
      try {
        setIsLoading(true);
        setError(null);
        if (!db) throw new Error("Database not initialized");

        await db.execute("BEGIN TRANSACTION");

        try {
          // Create sale record
          const saleResult = await db.execute(
            `INSERT INTO sales (total, cash_received, change, created_at)
             VALUES (?, ?, ?, datetime('now'))`,
            [total, cashReceived, change],
          );

          const saleId = saleResult.lastInsertId;
          if (typeof saleId !== "number") {
            throw new Error("Failed to create sale record");
          }

          // Process each sale item
          for (const item of items) {
            // Add sale item
            await db.execute(
              `INSERT INTO sale_items (
                sale_id, batch_id, quantity, price_at_sale
              ) VALUES (?, ?, ?, ?)`,
              [saleId, item.batchId, item.quantity, item.priceAtSale],
            );

            // Update inventory and record change
            await recordInventoryChange(
              item.batchId,
              -item.quantity,
              "sale",
              `Sold in sale #${saleId}`,
            );

            await db.execute(
              "UPDATE inventory_batches SET quantity = quantity - ? WHERE id = ?",
              [item.quantity, item.batchId],
            );
          }

          await db.execute("COMMIT");
          return saleId;
        } catch (err) {
          await db.execute("ROLLBACK");
          throw err;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Database error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, recordInventoryChange],
  );

  /**
   * Records a change in product details
   */
  const recordProductChange = useCallback(
    async (
      productId: number,
      field: string,
      oldValue: any,
      newValue: any,
      note?: string,
    ) => {
      if (!db) throw new Error("Database not initialized");

      await db.execute(
        `INSERT INTO product_history (
           product_id, field, old_value, new_value, note
         ) VALUES (?, ?, ?, ?, ?)`,
        [productId, field, String(oldValue), String(newValue), note || null],
      );
    },
    [db],
  );

  /**
   * Upserts a product (create or update)
   */
  const upsertProduct = useCallback(
    async (product: ProductUpsert) => {
      try {
        setIsLoading(true);
        setError(null);
        if (!db) throw new Error("Database not initialized");

        const [existing] = await db.select<
          {
            id: number;
            name: string;
            selling_price: number;
            unit_id: number | null;
            category_id: number | null;
          }[]
        >(
          "SELECT id, name, selling_price, unit_id, category_id FROM products WHERE barcode = ? LIMIT 1",
          [product.barcode],
        );

        if (existing) {
          // Collect changes to create a note
          const changes: string[] = [];

          if (product.name !== existing.name) {
            await recordProductChange(
              existing.id,
              "name",
              existing.name,
              product.name,
            );
            changes.push(
              `Name changed from "${existing.name}" to "${product.name}"`,
            );
          }
          if (product.selling_price !== existing.selling_price) {
            await recordProductChange(
              existing.id,
              "selling_price",
              existing.selling_price,
              product.selling_price,
            );
            changes.push(
              `Selling price changed from ${existing.selling_price} to ${product.selling_price}`,
            );
          }
          if (product.unit_id !== existing.unit_id) {
            await recordProductChange(
              existing.id,
              "unit_id",
              existing.unit_id,
              product.unit_id,
            );
            changes.push(
              `Unit ID changed from ${existing.unit_id ?? "null"} to ${product.unit_id ?? "null"}`,
            );
          }
          if (product.category_id !== existing.category_id) {
            await recordProductChange(
              existing.id,
              "category_id",
              existing.category_id,
              product.category_id,
            );
            changes.push(
              `Category ID changed from ${existing.category_id ?? "null"} to ${product.category_id ?? "null"}`,
            );
          }

          // Update existing product
          await db.execute(
            `UPDATE products SET 
                name = ?, selling_price = ?, unit_id = ?, category_id = ?,
                updated_at = datetime('now')
             WHERE id = ?`,
            [
              product.name,
              product.selling_price,
              product.unit_id || null,
              product.category_id || null,
              existing.id,
            ],
          );

          // Add a combined note for all changes
          if (changes.length > 0) {
            await db.execute(
              `INSERT INTO product_history (
                 product_id, field, old_value, new_value, note
               ) VALUES (?, ?, ?, ?, ?)`,
              [existing.id, "multiple", "", "", changes.join("; ")],
            );
          }

          return { id: existing.id, action: "updated" as const };
        }

        // Insert new product
        const result = await db.execute(
          `INSERT INTO products (
              name, barcode, selling_price, 
              unit_id, category_id, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            product.name,
            product.barcode,
            product.selling_price,
            product.unit_id || null,
            product.category_id || null,
          ],
        );

        return { id: result.lastInsertId, action: "created" as const };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Database error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, recordProductChange],
  );

  /**
   * Generic query function
   */
  const query = useCallback(
    async <T = any,>(
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
    },
    [db, isInitializing, toast],
  );

  /**
   * Generic mutation function
   */
  const mutate = useCallback(
    async (sql: string, params: any[] = []): Promise<number> => {
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
    },
    [db, isInitializing, toast],
  );

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
