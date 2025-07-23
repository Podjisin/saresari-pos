import { useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import type { ProductUpsert, InventoryChangeReason } from "@/types/Inventory";

type ProductsDeps = {
  db: Database | null;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  recordProductChange: (
    productId: number,
    field: string,
    oldValue: unknown,
    newValue: unknown,
    note?: string,
  ) => Promise<void>;
};

/**
 * Provides functions to insert or update products and record product change events in the inventory database.
 *
 * Returns two asynchronous functions:
 * - `upsertProduct`: Inserts a new product or updates an existing one based on barcode, recording field changes and updating product history as needed.
 * - `upsertProductChange`: Records a product change event with a specified reason and optional note.
 *
 * @returns An object containing `upsertProduct` and `upsertProductChange` functions for managing inventory products and their change history.
 */
export function useInventoryProducts({
  db,
  setError,
  setIsLoading,
  recordProductChange,
}: ProductsDeps) {
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

  const upsertProductChange = useCallback(
    async (productId: number, reason: InventoryChangeReason, note?: string) => {
      try {
        if (!db) throw new Error("Database not initialized");

        await db.execute(
          `INSERT INTO product_change_history (product_id, reason, note, changed_at)
           VALUES (?, ?, ?, datetime('now'))`,
          [productId, reason, note || ""],
        );
      } catch (err) {
        console.warn("Failed to record product change:", err);
      }
    },
    [db],
  );

  return {
    upsertProduct,
    upsertProductChange,
  };
}
