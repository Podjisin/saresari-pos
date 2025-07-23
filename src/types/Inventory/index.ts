export interface InventoryBatch {
  id: number;
  product_id: number;
  product_name: string;
  barcode: string | null;
  batch_number: string | null;
  quantity: number;
  cost_price: number;
  selling_price: number;
  expiration_date: string | null;
  date_added: string;
  unit_name: string | null;
  category_name: string | null;
}

export type InventoryChangeReason =
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

export interface InventoryBatchInput {
  product_id: number;
  quantity: number;
  cost_price: number;
  expiration_date?: string | null;
  batch_number?: string | null;
}

export interface BatchUpdate {
  cost_price?: number;
  expiration_date?: string | null;
  batch_number?: string | null;
}

export interface SaleItem {
  batchId: number;
  quantity: number;
  priceAtSale: number;
}

export interface ProductUpsert {
  name: string;
  barcode: string | null;
  selling_price: number;
  unit_id?: number;
  category_id?: number;
}

export type QueryOptions<T = unknown> = {
  params?: unknown[];
  skip?: boolean;
  initialData?: T[];
};

// History Record Type

export interface InventoryHistoryRecord {
  id: number;
  batch_id: number;
  change: number;
  reason: InventoryChangeReason;
  note: string | null;
  created_at: string;
  product_name?: string;
  batch_number?: string | null;
}

export interface HistoryQueryParams {
  batchId?: number;
  productId?: number;
  reason?: InventoryChangeReason;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "change";
  orderDirection?: "ASC" | "DESC";
}

export interface HistoryStats {
  total_added: number;
  total_removed: number;
  most_common_reason: InventoryChangeReason;
  recent_activity: InventoryHistoryRecord[];
}

export interface PaginatedHistoryResult {
  records: InventoryHistoryRecord[];
  total: number;
  limit: number;
  offset: number;
}
