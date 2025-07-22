import { useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import type {
  InventoryBatchInput,
  InventoryChangeReason,
  BatchUpdate,
} from "@/types/Inventory";

type BatchesDeps = {
  db: Database | null;
  setError: (err: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  recordInventoryChange: (
    batchId: number,
    change: number,
    reason: InventoryChangeReason,
    note?: string,
  ) => Promise<void>;
};

export function useInventoryBatches({
  db,
  setError,
  setIsLoading,
  recordInventoryChange,
}: BatchesDeps) {
  const addInventoryBatch = useCallback(
    async (batch: InventoryBatchInput) => {
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
    [db, setError, setIsLoading, recordInventoryChange],
  );

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

        const [current] = await db.select<{ quantity: number }[]>(
          "SELECT quantity FROM inventory_batches WHERE id = ? LIMIT 1",
          [batchId],
        );

        if (!current) throw new Error("Batch not found");

        const change = newQuantity - current.quantity;

        await db.execute(
          "UPDATE inventory_batches SET quantity = ? WHERE id = ?",
          [newQuantity, batchId],
        );

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
    [db, setError, setIsLoading, recordInventoryChange],
  );

  const deleteInventoryBatch = useCallback(
    async (batchId: number, note?: string) => {
      try {
        setIsLoading(true);
        setError(null);
        if (!db) throw new Error("Database not initialized");

        const [current] = await db.select<{ quantity: number }[]>(
          "SELECT quantity FROM inventory_batches WHERE id = ? LIMIT 1",
          [batchId],
        );

        if (!current) throw new Error("Batch not found");

        await recordInventoryChange(
          batchId,
          -current.quantity,
          "delete",
          note || "Batch deleted",
        );

        await db.execute(
          "UPDATE inventory_batches SET is_deleted = 1, deleted_at = datetime('now') WHERE id = ?",
          [batchId],
        );

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Database error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, setError, setIsLoading, recordInventoryChange],
  );

  const editInventoryBatch = useCallback(
    async (batchId: number, updates: BatchUpdate, note?: string) => {
      try {
        setIsLoading(true);
        setError(null);
        if (!db) throw new Error("Database not initialized");

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
        const updateParams: unknown[] = [];

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

        if (updateFields.length === 0) return false;

        await db.execute(
          `UPDATE inventory_batches SET ${updateFields.join(", ")} WHERE id = ?`,
          [...updateParams, batchId],
        );

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
    [db, setError, setIsLoading, recordInventoryChange],
  );

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

          await db.execute(
            "UPDATE inventory_batches SET quantity = quantity - ? WHERE id = ?",
            [quantity, fromBatchId],
          );

          await db.execute(
            "UPDATE inventory_batches SET quantity = quantity + ? WHERE id = ?",
            [quantity, toBatchId],
          );

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
    [db, setError, setIsLoading, recordInventoryChange],
  );

  return {
    addInventoryBatch,
    updateInventoryBatchQuantity,
    deleteInventoryBatch,
    editInventoryBatch,
    transferInventory,
  };
}
