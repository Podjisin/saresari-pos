import { useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import type { SaleItem, InventoryChangeReason } from "@/types/Inventory";

type SalesDeps = {
  db: Database | null;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  recordInventoryChange: (
    batchId: number,
    change: number,
    reason: InventoryChangeReason,
    note?: string,
  ) => Promise<void>;
};

export function useInventorySales({
  db,
  setError,
  setIsLoading,
  recordInventoryChange,
}: SalesDeps) {
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
          const saleResult = await db.execute(
            `INSERT INTO sales (total, cash_received, change, created_at)
             VALUES (?, ?, ?, datetime('now'))`,
            [total, cashReceived, change],
          );

          const saleId = saleResult.lastInsertId;
          if (typeof saleId !== "number") {
            throw new Error("Failed to create sale record");
          }

          for (const item of items) {
            // Insert sale item
            await db.execute(
              `INSERT INTO sale_items (
                sale_id, batch_id, quantity, price_at_sale
              ) VALUES (?, ?, ?, ?)`,
              [saleId, item.batchId, item.quantity, item.priceAtSale],
            );

            // Record inventory change
            await recordInventoryChange(
              item.batchId,
              -item.quantity,
              "sale",
              `Sold in sale #${saleId}`,
            );

            // Update batch quantity
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
    [db, setError, setIsLoading, recordInventoryChange],
  );

  return { createSale };
}
