import Database from "@tauri-apps/plugin-sql";

export type TopProduct = {
  product_id: number;
  name: string;
  total_sold: number;
};

export const getTotalSales = async (
  db: Database,
  startDate?: string,
  endDate?: string,
): Promise<number> => {
  let query = "SELECT SUM(total) as total FROM sales";
  const params: string[] = [];

  if (startDate && endDate) {
    query += " WHERE date(created_at) BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  const res = await db.select<{ total: number }[]>(query, params);
  return res[0]?.total ?? 0;
};

export const getTransactionCount = async (
  db: Database,
  startDate?: string,
  endDate?: string,
): Promise<number> => {
  let query = "SELECT COUNT(*) as count FROM sales";
  const params: string[] = [];

  if (startDate && endDate) {
    query += " WHERE date(created_at) BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  const res = await db.select<{ count: number }[]>(query, params);
  return res[0]?.count ?? 0;
};

export const getLowStockCount = async (db: Database): Promise<number> => {
  const thresholdRes = await db.select<{ value: string }[]>(
    "SELECT value FROM settings WHERE key = 'inventory_warning_threshold'",
  );
  const threshold = parseInt(thresholdRes[0]?.value ?? "5") || 5;

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
    `SELECT strftime('%w', created_at, 'localtime') as weekday, SUM(total) as total
     FROM sales
     WHERE date(created_at, 'localtime') >= date('now', 'localtime', '-6 days')
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
     WHERE date(created_at, 'localtime') BETWEEN date('now', 'localtime', '-13 days') AND date('now', 'localtime', '-7 days')`,
  );
  return res[0]?.total ?? 0;
};

export const getLastWeekTransactionCount = async (
  db: Database,
): Promise<number> => {
  const res = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count 
     FROM sales
     WHERE date(created_at, 'localtime') BETWEEN date('now', 'localtime', '-13 days') AND date('now', 'localtime', '-7 days')`,
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
     FROM sale_items si
     JOIN inventory_batches b ON b.id = si.batch_id
     JOIN products p ON p.id = b.product_id
     GROUP BY p.id
     ORDER BY total_sold DESC
     LIMIT 5`,
  );
  return result;
};
