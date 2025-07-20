import { useState, useRef, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { useInventory } from "./useInventory";
import type { InventoryBatch } from "@/pages/inventory/types/index";

export interface Unit {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface FormData {
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  batchNumber: string;
  expirationDate: string | null;
  unitId: number | null;
  categoryId: number | null;
}

interface UseArgs {
  batch: InventoryBatch | null;
  onItemUpdated: () => void;
  onItemDeleted: () => void;
  onClose: () => void;
}

interface UseReturn {
  formData: FormData & {
    set: (update: Partial<FormData>) => void;
  };
  units: Unit[];
  categories: Category[];
  isEditing: boolean;
  isLoading: boolean;
  error: string | null;
  isDeleteDialogOpen: boolean;
  cancelRef: React.RefObject<HTMLButtonElement>;
  startEdit: () => void;
  cancelEdit: () => void;
  updateBatch: () => Promise<void>;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  deleteBatch: () => Promise<void>;
}

export function useInventoryDetailForm({
  batch,
  onItemUpdated,
  onItemDeleted,
  onClose,
}: UseArgs): UseReturn {
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const {
    query,
    updateInventoryBatchQuantity,
    editInventoryBatch,
    deleteInventoryBatch,
    upsertProduct,
    isLoading,
    error,
  } = useInventory();

  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formDataState, setFormDataState] = useState<FormData>({
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    batchNumber: "",
    expirationDate: null,
    unitId: null,
    categoryId: null,
  });

  const updateFormData = useCallback((update: Partial<FormData>) => {
    setFormDataState((prev) => ({ ...prev, ...update }));
  }, []);

  const formData = {
    ...formDataState,
    set: updateFormData,
  };

  // Load initial data (unit, category, populate form) when editing starts
  const loadData = useCallback(async () => {
    if (!batch) return;
    try {
      const [unitResults, categoryResults] = await Promise.all([
        query<Unit>("SELECT id, name FROM inventory_unit"),
        query<Category>("SELECT id, name FROM inventory_category"),
      ]);
      setUnits(unitResults || []);
      setCategories(categoryResults || []);

      const productInfo = await query<{
        unit_id: number | null;
        category_id: number | null;
      }>("SELECT unit_id, category_id FROM products WHERE id = ? LIMIT 1", {
        params: [batch.product_id],
      });

      const unitId = productInfo[0]?.unit_id ?? null;
      const categoryId = productInfo[0]?.category_id ?? null;

      setFormDataState({
        quantity: batch.quantity,
        costPrice: batch.cost_price,
        sellingPrice: batch.selling_price,
        batchNumber: batch.batch_number ?? "",
        expirationDate: batch.expiration_date,
        unitId,
        categoryId,
      });
    } catch (err) {
      console.error("Failed to load form data:", err);
      toast({
        title: "Loading failed",
        description: "Could not load form data",
        status: "error",
        duration: 3000,
      });
    }
  }, [batch, query, toast]);

  // Start editing: load categories/units + form data
  const startEdit = useCallback(() => {
    if (!batch) return;
    setIsEditing(true);
    loadData();
  }, [batch, loadData]);

  const cancelEdit = useCallback(() => {
    if (!batch) return;
    setIsEditing(false);
    loadData();
  }, [batch, loadData]);

  const updateBatch = useCallback(async () => {
    if (!batch) return;

    try {
      // Sync product details first
      await upsertProduct({
        name: batch.product_name,
        barcode: batch.barcode,
        selling_price: formData.sellingPrice,
        unit_id: formData.unitId || undefined,
        category_id: formData.categoryId || undefined,
      });

      await editInventoryBatch(batch.id, {
        cost_price: formData.costPrice,
        expiration_date: formData.expirationDate,
        batch_number: formData.batchNumber || null,
      });

      if (formData.quantity !== batch.quantity) {
        await updateInventoryBatchQuantity(
          batch.id,
          formData.quantity,
          "adjustment",
          "Quantity adjusted during edit",
        );
      }

      toast({
        title: "Update successful",
        status: "success",
        duration: 2000,
      });
      setIsEditing(false);
      onItemUpdated();
    } catch (err) {
      console.error("Update failed:", err);
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    }
  }, [
    batch,
    formData,
    upsertProduct,
    editInventoryBatch,
    updateInventoryBatchQuantity,
    toast,
    onItemUpdated,
  ]);

  const openDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  const deleteBatch = useCallback(async () => {
    if (!batch) return;
    try {
      await deleteInventoryBatch(batch.id, "Batch manually deleted");
      toast({
        title: "Batch deleted",
        status: "success",
        duration: 2000,
      });
      onItemDeleted();
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      closeDeleteDialog();
    }
  }, [
    batch,
    deleteInventoryBatch,
    toast,
    onItemDeleted,
    onClose,
    closeDeleteDialog,
  ]);

  return {
    formData,
    units,
    categories,
    isEditing,
    isLoading,
    error,
    isDeleteDialogOpen,
    cancelRef,
    startEdit,
    cancelEdit,
    updateBatch,
    openDeleteDialog,
    closeDeleteDialog,
    deleteBatch,
  };
}
