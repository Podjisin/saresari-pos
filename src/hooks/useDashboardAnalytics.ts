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
import { format, subDays } from "date-fns";

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

    const endDateCurrentWeek = format(new Date(), "yyyy-MM-dd");
    const startDateCurrentWeek = format(subDays(new Date(), 6), "yyyy-MM-dd");
    const endDateLastWeek = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const startDateLastWeek = format(subDays(new Date(), 13), "yyyy-MM-dd");

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
        getTotalSales(db, startDateCurrentWeek, endDateCurrentWeek),
        getTransactionCount(db, startDateCurrentWeek, endDateCurrentWeek),
        getLowStockCount(db),
        getDailySales(db),
        getLastWeekSales(db),
        getLastWeekTransactionCount(db),
        getTotalSales(db, startDateLastWeek, endDateLastWeek),
        getTransactionCount(db, startDateLastWeek, endDateLastWeek),
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
