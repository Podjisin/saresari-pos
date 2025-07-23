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

/**
 * Helper function to validate sale inputs.
 * Throws descriptive errors if invalid data is found.
 */
function validateSaleInputs(
  items: SaleItem[],
  cashReceived: number,
  total: number,
  change: number,
) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No sale items provided.");
  }

  const batchIds = new Set<number>();

  for (const item of items) {
    if (typeof item.batchId !== "number" || item.batchId <= 0) {
      throw new Error(`Invalid batch ID: ${item.batchId}`);
    }
    if (batchIds.has(item.batchId)) {
      throw new Error(`Duplicate batch ID: ${item.batchId}`);
    }
    batchIds.add(item.batchId);

    if (typeof item.quantity !== "number" || item.quantity <= 0) {
      throw new Error(`Invalid quantity for batch ${item.batchId}`);
    }

    if (typeof item.priceAtSale !== "number" || item.priceAtSale < 0) {
      throw new Error(`Invalid price for batch ${item.batchId}`);
    }
  }

  if (typeof cashReceived !== "number" || cashReceived < 0) {
    throw new Error("Invalid cash received amount.");
  }

  if (typeof total !== "number" || total < 0) {
    throw new Error("Invalid total amount.");
  }

  if (cashReceived < total) {
    throw new Error("Insufficient cash received.");
  }

  const expectedChange = parseFloat((cashReceived - total).toFixed(2));
  const actualChange = parseFloat(change.toFixed(2));
  if (Math.abs(expectedChange - actualChange) > 0.01) {
    throw new Error("Change amount does not match calculation.");
  }
}

/**
 * Provides inventory sales management by exposing a function to create sales records and update inventory in a single transaction.
 *
 * Returns an object containing the `createSale` function, which processes a sale by recording it in the database, updating inventory quantities, and logging inventory changes. Ensures atomicity and error handling throughout the operation.
 */
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

        // Validate inputs
        validateSaleInputs(items, cashReceived, total, change);

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
            // Check inventory level
            const result = await db.select<{ quantity: number }[]>(
              "SELECT quantity FROM inventory_batches WHERE id = ?",
              [item.batchId],
            );

            if (!result || result.length === 0) {
              throw new Error(`Batch ${item.batchId} does not exist.`);
            }

            const availableQuantity = result[0].quantity;

            if (item.quantity > availableQuantity) {
              throw new Error(
                `Not enough stock for batch ${item.batchId}. Available: ${availableQuantity}, requested: ${item.quantity}`,
              );
            }

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
