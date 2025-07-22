import { useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { useInventory } from "@/pages/inventory/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { InventoryBatch } from "@/types/Inventory";
import { buildWhereClause, getInventoryQuery, getCountQuery } from "../utils";

export function useInventoryList() {
  const toast = useToast();
  const { query, error, isLoading, isInitializing, resetError } =
    useInventory();

  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all");

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    totalItems: 0,
  });

  const totalPages = Math.ceil(pagination.totalItems / pagination.pageSize);

  const fetchBatches = async () => {
    try {
      setLocalLoading(true);
      resetError();

      const offset = (pagination.currentPage - 1) * pagination.pageSize;
      const { clause, params } = buildWhereClause(
        debouncedSearchTerm,
        categoryFilter,
        expiryFilter,
      );
      const queryStr = getInventoryQuery(clause);

      params.push(pagination.pageSize, offset);
      const result = await query<InventoryBatch>(queryStr, { params });
      setBatches(result || []);
    } catch (err) {
      toast({
        title: "Failed to load inventory",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const fetchTotalCount = async () => {
    try {
      const { clause, params } = buildWhereClause(
        debouncedSearchTerm,
        categoryFilter,
        expiryFilter,
      );
      const countQuery = getCountQuery(clause);

      const result = await query<{ count: number }>(countQuery, { params });
      setPagination((prev) => ({
        ...prev,
        totalItems: result?.[0]?.count || 0,
      }));
    } catch (err) {
      toast({
        title: "Count query failed",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 3000,
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await query<{ name: string }>(
        "SELECT name FROM inventory_category ORDER BY name",
      );
      setCategories(result?.map((c) => c.name) || []);
    } catch (err) {
      setCategories([]);
      toast({
        title: "Failed to load categories",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchTotalCount(), fetchBatches()]);
  };

  const handleItemAdded = () => {
    fetchTotalCount();
    fetchBatches();
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setExpiryFilter("all");
  };

  useEffect(() => {
    if (!isInitializing && !hasFetchedInitial) {
      fetchCategories();
      fetchTotalCount();
      fetchBatches();
      setHasFetchedInitial(true);
    }
  }, [isInitializing, hasFetchedInitial]);

  useEffect(() => {
    if (hasFetchedInitial) {
      fetchTotalCount();
      fetchBatches();
    }
  }, [
    debouncedSearchTerm,
    categoryFilter,
    expiryFilter,
    pagination.currentPage,
    pagination.pageSize,
  ]);

  return {
    batches,
    pagination,
    setPagination,
    categories,
    filters: {
      searchTerm,
      setSearchTerm,
      categoryFilter,
      setCategoryFilter,
      expiryFilter,
      setExpiryFilter,
    },
    fetchBatches,
    fetchTotalCount,
    fetchCategories,
    refreshData,
    handleItemAdded,
    resetFilters,
    localLoading,
    totalPages,
    isInitializing,
    isLoading,
    error,
  };
}
