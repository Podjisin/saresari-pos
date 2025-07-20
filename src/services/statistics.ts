import Database from "@tauri-apps/plugin-sql";

export type TopProduct = {
  product_id: number;
  name: string;
  total_sold: number;
};

export const getTotalSales = async (db: Database): Promise<number> => {
  const res = await db.select<{ total: number }[]>(
    "SELECT SUM(total) as total FROM sales",
  );
  return res[0]?.total ?? 0;
};

export const getTransactionCount = async (db: Database): Promise<number> => {
  const res = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM sales",
  );
  return res[0]?.count ?? 0;
};

export const getLowStockCount = async (db: Database): Promise<number> => {
  const thresholdRes = await db.select<{ value: string }[]>(
    "SELECT value FROM settings WHERE key = 'inventory_warning_threshold'",
  );
  const threshold = parseInt(thresholdRes[0]?.value ?? "5");

  const res = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count
     FROM (
       SELECT product_id, SUM(quantity) as total_quantity
       FROM inventory_batches
       GROUP BY product_id
       HAVING total_quantity < ?
     )`,
    [threshold],
  );
  return res[0]?.count ?? 0;
};

export const getDailySales = async (db: Database): Promise<number[]> => {
  const res = await db.select<{ weekday: number; total: number }[]>(
    `SELECT strftime('%w', created_at) as weekday, SUM(total) as total
     FROM sales
     WHERE date(created_at) >= date('now', '-6 days')
     GROUP BY weekday`,
  );

  const sales: number[] = Array(7).fill(0);
  for (const row of res) {
    sales[row.weekday] = row.total;
  }
  return sales;
};

export const getLastWeekSales = async (db: Database): Promise<number> => {
  const res = await db.select<{ total: number }[]>(
    `SELECT SUM(total) as total 
     FROM sales
     WHERE date(created_at) BETWEEN date('now', '-13 days') AND date('now', '-7 days')`,
  );
  return res[0]?.total ?? 0;
};

export const getLastWeekTransactionCount = async (
  db: Database,
): Promise<number> => {
  const res = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count 
     FROM sales
     WHERE date(created_at) BETWEEN date('now', '-13 days') AND date('now', '-7 days')`,
  );
  return res[0]?.count ?? 0;
};

export const getTopSellingProducts = async (
  db: Database,
): Promise<TopProduct[]> => {
  const result = await db.select<TopProduct[]>(
    `SELECT 
       p.id as product_id, 
       p.name, 
       SUM(si.quantity) as total_sold
     FROM sales_items si
     JOIN products p ON p.id = si.product_id
     GROUP BY si.product_id
     ORDER BY total_sold DESC
     LIMIT 5`,
  );
  return result;
};
