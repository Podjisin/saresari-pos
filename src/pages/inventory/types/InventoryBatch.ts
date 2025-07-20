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
