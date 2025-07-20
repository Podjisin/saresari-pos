import { useCallback, useEffect, useState } from "react";
import { useDatabase } from "./useDatabase";
import {
  getTotalSales,
  getTransactionCount,
  getLowStockCount,
  getDailySales,
  getLastWeekSales,
  getLastWeekTransactionCount,
} from "../services/statistics";
import { determineTrendDirection } from "@/utils/trend";

export type AnalyticsData = {
  totalSales: number;
  transactionCount: number;
  lowStockCount: number;
  dailySales: number[];
  totalSalesChangePercent: number;
  transactionCountChangePercent: number;
  trendDirection: "up" | "down" | "flat";
};

export const useDashboardAnalytics = (): {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} => {
  const { db, isConnected } = useDatabase();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!db) return;

    setIsLoading(true);
    setError(null);

    try {
      const [
        totalSales,
        transactionCount,
        lowStockCount,
        dailySales,
        lastWeekSales,
        lastWeekTransactionCount,
      ] = await Promise.all([
        getTotalSales(db),
        getTransactionCount(db),
        getLowStockCount(db),
        getDailySales(db),
        getLastWeekSales(db),
        getLastWeekTransactionCount(db),
      ]);

      const totalSalesChangePercent = lastWeekSales
        ? ((totalSales - lastWeekSales) / lastWeekSales) * 100
        : 0;

      const transactionCountChangePercent = lastWeekTransactionCount
        ? ((transactionCount - lastWeekTransactionCount) /
            lastWeekTransactionCount) *
          100
        : 0;

      const trendDirection = determineTrendDirection(dailySales);

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
    if (isConnected) fetchStatistics();
  }, [isConnected, fetchStatistics]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchStatistics,
  };
};
