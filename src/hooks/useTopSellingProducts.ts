import { useState, useEffect } from "react";
import { useDatabase } from "@/hooks/useDatabase";
import { getTopSellingProducts, TopProduct } from "../services/statistics";

export const useTopSellingProducts = (): {
  data: TopProduct[] | null;
  isLoading: boolean;
  error: string | null;
} => {
  const { db, isConnected } = useDatabase();
  const [data, setData] = useState<TopProduct[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !db) return;

    setIsLoading(true);
    setError(null);

    getTopSellingProducts(db)
      .then(setData)
      .catch((err) => {
        console.error("[TopProducts] Failed:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load top products.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [isConnected, db]);

  return { data, isLoading, error };
};
