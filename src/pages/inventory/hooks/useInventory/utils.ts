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
 * Hook providing utility functions to record inventory and product history changes.
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
            product_id, field, old_value, new_value, note, created_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [productId, field, String(oldValue), String(newValue), note ?? null],
        );
      } catch (err) {
        // Log but don’t throw to avoid blocking main flow
        console.warn("Failed to record product change:", err);
      }
    },
    [db],
  );

  return {
    recordInventoryChange,
    recordProductChange,
  };
}
