import { useCallback, useEffect, useState } from "react";
import { useDatabase } from "./useDatabase";

export type StatisticData = {
  totalSales: number;
  transactionCount: number;
  lowStockCount: number;
  dailySales: number[]; // Index 0 = Sunday, 6 = Saturday
  totalSalesChangePercent: number; // % change from last week
  transactionCountChangePercent: number;
  trendDirection: "up" | "down" | "flat";
};

export const useStatistics = (): {
  data: StatisticData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} => {
  const { db, isConnected } = useDatabase();
  const [data, setData] = useState<StatisticData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!db) return;
    setIsLoading(true);
    setError(null);

    try {
      // Total Sales
      const salesResult = await db.select<{ total: number }[]>(
        "SELECT SUM(total) as total FROM sales",
      );
      const totalSales = salesResult[0]?.total ?? 0;

      // Transaction Count
      const txResult = await db.select<{ count: number }[]>(
        "SELECT COUNT(*) as count FROM sales",
      );
      const transactionCount = txResult[0]?.count ?? 0;

      // Inventory Warning Threshold
      const thresholdResult = await db.select<{ value: string }[]>(
        "SELECT value FROM settings WHERE key = 'inventory_warning_threshold'",
      );
      const threshold = parseInt(thresholdResult[0]?.value ?? "5");

      // Low Stock Count
      const lowStockResult = await db.select<{ count: number }[]>(
        `SELECT COUNT(*) as count
         FROM (
           SELECT product_id, SUM(quantity) as total_quantity
           FROM inventory_batches
           GROUP BY product_id
           HAVING total_quantity < ?
         )`,
        [threshold],
      );
      const lowStockCount = lowStockResult[0]?.count ?? 0;

      // Daily Sales
      const dailySalesResult = await db.select<
        { weekday: number; total: number }[]
      >(
        `SELECT strftime('%w', created_at) as weekday, SUM(total) as total
         FROM sales
         WHERE date(created_at) >= date('now', '-6 days')
         GROUP BY weekday`,
      );

      const dailySales: number[] = Array(7).fill(0);
      for (const row of dailySalesResult) {
        const day = row.weekday;
        dailySales[day] = row.total;
      }

      // Total Sales Last Week (for percent change)
      const lastWeekSalesResult = await db.select<{ total: number }[]>(
        `SELECT SUM(total) as total 
         FROM sales
         WHERE date(created_at) BETWEEN date('now', '-13 days') AND date('now', '-7 days')`,
      );
      const lastWeekSales = lastWeekSalesResult[0]?.total ?? 0;
      const totalSalesChangePercent = lastWeekSales
        ? ((totalSales - lastWeekSales) / lastWeekSales) * 100
        : 0;

      // Transaction Count Last Week
      const lastWeekTxResult = await db.select<{ count: number }[]>(
        `SELECT COUNT(*) as count 
         FROM sales
         WHERE date(created_at) BETWEEN date('now', '-13 days') AND date('now', '-7 days')`,
      );
      const lastWeekTransactionCount = lastWeekTxResult[0]?.count ?? 0;
      const transactionCountChangePercent = lastWeekTransactionCount
        ? ((transactionCount - lastWeekTransactionCount) /
            lastWeekTransactionCount) *
          100
        : 0;

      // Determine sales trend direction from dailySales
      // We'll compare the last 3 days with the 3 before that
      const firstHalf = dailySales.slice(0, 3).reduce((a, b) => a + b, 0);
      const secondHalf = dailySales.slice(4).reduce((a, b) => a + b, 0);
      let trendDirection: "up" | "down" | "flat" = "flat";
      if (secondHalf > firstHalf) trendDirection = "up";
      else if (secondHalf < firstHalf) trendDirection = "down";

      setData({
        totalSales,
        transactionCount,
        lowStockCount,
        dailySales,
        totalSalesChangePercent,
        transactionCountChangePercent,
        trendDirection,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load statistics.";
      setError(message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (isConnected) {
      fetchStatistics();
    }
  }, [isConnected, fetchStatistics]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchStatistics,
  };
};
