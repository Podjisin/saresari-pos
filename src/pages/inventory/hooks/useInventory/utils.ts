import { useCallback } from "react";
import type Database from "@tauri-apps/plugin-sql";
import type { InventoryChangeReason } from "@/types/Inventory";

export type UtilsDeps = {
  db: Database | null;
  setError: (error: string | null) => void;
};

export type RecordInventoryChange = {
  batchId: number;
  change: number;
  reason: InventoryChangeReason;
  note?: string;
};

export type RecordProductChange = {
  productId: number;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  note?: string;
};

/**
 * Provides utility functions for recording inventory and product changes in the database.
 *
 * Returns two asynchronous functions:
 * - `recordInventoryChange`: Records a change in the inventory history table and sets an error message if the operation fails.
 * - `recordProductChange`: Records a change in the product history table and logs a warning if the operation fails.
 *
 * Both functions require the database to be initialized.
 *
 * @returns An object containing `recordInventoryChange` and `recordProductChange` functions.
 */
export function useInventoryUtils({ db, setError }: UtilsDeps) {
  /**
   * Records a change in inventory history table.
   */
  const recordInventoryChange = useCallback(
    async (
      batchId: number,
      change: number,
      reason: InventoryChangeReason,
      note?: string,
    ) => {
      try {
        if (!db) throw new Error("Database not initialized");

        await db.execute(
          `INSERT INTO inventory_history (
            batch_id, change, reason, note, created_at
          ) VALUES (?, ?, ?, ?, datetime('now'))`,
          [batchId, change, reason, note ?? null],
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to record inventory change";
        setError(message);
        throw err;
      }
    },
    [db, setError],
  );

  /**
   * Records a change in product history table.
   */
  const recordProductChange = useCallback(
    async (
      productId: number,
      field: string,
      oldValue: unknown,
      newValue: unknown,
      note?: string,
    ) => {
      try {
        if (!db) throw new Error("Database not initialized");

        await db.execute(
          `INSERT INTO product_history (
            product_id, field, old_value, new_value, note, changed_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [productId, field, String(oldValue), String(newValue), note ?? null],
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to record product change";
        console.warn(message);
        throw err;
      }
    },
    [db],
  );

  return {
    recordInventoryChange,
    recordProductChange,
  };
}
