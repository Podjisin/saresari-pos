import { useState, useEffect } from "react";
import { UseToastOptions } from "@chakra-ui/react";
import { useInventory } from "@/pages/inventory/hooks/";

export interface ProductInfo {
  id: number;
  barcode?: string | null;
  name: string;
  selling_price: number;
  unit_id: number | null;
  category_id: number | null;
  unit_name: string | null;
  category_name: string | null;
}

export interface FormState {
  barcode?: string;
  name: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  unitId: number | null;
  categoryId: number | null;
  batchNumber: string;
  expirationDate: string | null;
  units: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  existingProduct: ProductInfo | null;
  showExistingAlert: boolean;
}

export interface Handlers {
  setBarcode: (v: string) => void;
  setName: (v: string) => void;
  setQuantity: (v: number) => void;
  setCostPrice: (v: number) => void;
  setSellingPrice: (v: number) => void;
  setUnitId: (v: number | null) => void;
  setCategoryId: (v: number | null) => void;
  setBatchNumber: (v: string) => void;
  setExpirationDate: (v: string | null) => void;
}

interface UseAddInventoryFormArgs {
  barcode?: string;
  toast: (opts: UseToastOptions) => unknown;
  onItemAdded: () => void;
  onClose: () => void;
}

/**
 * React hook for managing the state and logic of an add-inventory form, including product details, batch information, and integration with inventory data sources.
 *
 * Initializes form state, provides handlers for updating fields, loads units and categories, checks for existing products by barcode, and handles form submission with validation and inventory updates. Displays notifications for success or error events.
 *
 * @returns An object containing the current form state, field handlers, a submit function, a reset function, and a loading indicator.
 */
export function useAddInventoryForm({
  barcode,
  toast,
  onItemAdded,
  onClose,
}: UseAddInventoryFormArgs) {
  const { query, upsertProduct, addInventoryBatch, isLoading } = useInventory();

  const [formState, setFormState] = useState<FormState>({
    barcode: barcode || "",
    name: "",
    quantity: 1,
    costPrice: 0,
    sellingPrice: 0,
    unitId: null,
    categoryId: null,
    batchNumber: "",
    expirationDate: null,
    units: [],
    categories: [],
    existingProduct: null,
    showExistingAlert: false,
  });

  const handlers: Handlers = {
    setBarcode: (barcode) => setFormState((s) => ({ ...s, barcode })),
    setName: (name) => setFormState((s) => ({ ...s, name })),
    setQuantity: (quantity) => setFormState((s) => ({ ...s, quantity })),
    setCostPrice: (costPrice) => setFormState((s) => ({ ...s, costPrice })),
    setSellingPrice: (sellingPrice) =>
      setFormState((s) => ({ ...s, sellingPrice })),
    setUnitId: (unitId) => setFormState((s) => ({ ...s, unitId })),
    setCategoryId: (categoryId) => setFormState((s) => ({ ...s, categoryId })),
    setBatchNumber: (batchNumber) =>
      setFormState((s) => ({ ...s, batchNumber })),
    setExpirationDate: (expirationDate) =>
      setFormState((s) => ({ ...s, expirationDate })),
  };

  const resetForm = () => {
    setFormState((s) => ({
      ...s,
      barcode: barcode || "",
      name: "",
      quantity: 1,
      costPrice: 0,
      sellingPrice: 0,
      unitId: null,
      categoryId: null,
      batchNumber: "",
      expirationDate: null,
      existingProduct: null,
      showExistingAlert: false,
    }));
  };

  useEffect(() => {
    if (barcode == null) return;

    let mounted = true;

    const loadData = async () => {
      try {
        const units = await query<{ id: number; name: string }>(
          "SELECT id, name FROM inventory_unit",
        );
        const categories = await query<{ id: number; name: string }>(
          "SELECT id, name FROM inventory_category",
        );

        if (!mounted) return;
        setFormState((s) => ({
          ...s,
          barcode,
          units,
          categories,
        }));

        let existing: ProductInfo[] = [];
        if (barcode) {
          existing = await query<ProductInfo>(
            `
            SELECT p.id, p.name, p.selling_price, p.unit_id, p.category_id,
              u.name as unit_name, c.name as category_name
            FROM products p
              LEFT JOIN inventory_unit u ON p.unit_id = u.id
              LEFT JOIN inventory_category c ON p.category_id = c.id
            WHERE p.barcode = ? LIMIT 1
          `,
            {
              params: [barcode],
            },
          );
        }
        if (!mounted) return;

        if (existing.length) {
          const product = existing[0];
          setFormState((s) => ({
            ...s,
            barcode,
            existingProduct: product,
            name: product.name,
            sellingPrice: product.selling_price,
            unitId: product.unit_id,
            categoryId: product.category_id,
            showExistingAlert: true,
          }));
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        console.error("Failed to load inventory data:", error);
        if (!mounted) return;
        toast({
          title: "Loading failed",
          description: "Could not load required data",
          status: "error",
          duration: 3000,
        });
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [barcode, query, toast]);

  const submit = async () => {
    try {
      const {
        name,
        quantity,
        costPrice,
        sellingPrice,
        unitId,
        categoryId,
        batchNumber,
        expirationDate,
      } = formState;

      if (!name) throw new Error("Item name is required");
      if (quantity <= 0) throw new Error("Quantity must be positive");
      if (costPrice < 0) throw new Error("Cost price cannot be negative");
      if (sellingPrice < 0) throw new Error("Selling price cannot be negative");

      const productResult = await upsertProduct({
        name,
        barcode: formState.barcode || null,
        selling_price: sellingPrice,
        unit_id: unitId || undefined,
        category_id: categoryId || undefined,
      });

      if (!productResult?.id)
        throw new Error("Failed to create/update product");

      await addInventoryBatch({
        product_id: productResult.id,
        quantity,
        cost_price: costPrice,
        expiration_date: expirationDate || undefined,
        batch_number: batchNumber || undefined,
      });

      toast({
        title: "Inventory added",
        description: `${quantity} units of ${name} added`,
        status: "success",
        duration: 3000,
      });

      onItemAdded();
      onClose();
    } catch (err) {
      toast({
        title: "Operation failed",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    }
  };

  return { formState, handlers, submit, resetForm, isLoading };
}
