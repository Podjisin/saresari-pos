import {
  Box,
  Heading,
  Button,
  Stack,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  Hide,
  Show,
} from "@chakra-ui/react";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import { useState, useEffect, useCallback } from "react";
import { useInventory } from "@/pages/inventory/hooks/useInventory";
import { AddInventoryItemModal } from "@/pages/inventory/modals/Additem";
import { InventoryDetailsModal } from "@/pages/inventory/modals/ItemDetails";
import { BarcodeScanner } from "@/pages/inventory/modals/BarcodeScanner";
import { Pagination } from "@/components/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { InventoryBatch } from "@/pages/inventory/types/index";

import { InventoryCards, InventoryFilters, InventoryTable } from "./components";

/**
 * Displays and manages a paginated, filterable inventory list with support for adding, editing, and viewing inventory batches.
 *
 * Integrates filtering by search term, category, and expiration status, and provides pagination controls. Includes modals for barcode scanning, adding new inventory items, and viewing or editing batch details. Handles asynchronous data fetching and error notifications.
 *
 * @returns The rendered inventory list tab component.
 */
export default function InventoryListTab() {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const { query, isLoading, error, isInitializing, resetError } =
    useInventory();
  const [localLoading, setLocalLoading] = useState(false);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
  const toast = useToast();
  // Modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(
    null,
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all");

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    totalItems: 0,
  });
  const totalPages = Math.ceil(pagination.totalItems / pagination.pageSize);

  // Helper function to build the WHERE clause
  const buildWhereClause = (
    debouncedSearchTerm: string,
    categoryFilter: string,
    expiryFilter: string,
  ): {
    clause: string;
    params: unknown[];
  } => {
    let clause = `
        (p.name LIKE ? OR p.barcode LIKE ? OR ib.batch_number LIKE ?)
      AND ib.is_deleted = 0
    `;
    const params: unknown[] = [
      `%${debouncedSearchTerm}%`,
      `%${debouncedSearchTerm}%`,
      `%${debouncedSearchTerm}%`,
    ];

    if (categoryFilter !== "all") {
      clause += " AND c.name = ?";
      params.push(categoryFilter);
    }

    if (expiryFilter === "expired") {
      clause += " AND ib.expiration_date < date('now')";
    } else if (expiryFilter === "expiring") {
      clause +=
        " AND ib.expiration_date BETWEEN date('now') AND date('now', '+30 days')";
    } else if (expiryFilter === "valid") {
      clause +=
        " AND (ib.expiration_date IS NULL OR ib.expiration_date >= date('now'))";
    }

    return { clause, params };
  };

  const fetchBatches = useCallback(async () => {
    try {
      setLocalLoading(true);
      resetError();
      const offset = (pagination.currentPage - 1) * pagination.pageSize;

      const { clause, params } = buildWhereClause(
        debouncedSearchTerm,
        categoryFilter,
        expiryFilter,
      );

      const queryStr = `
      SELECT 
        ib.id,
        ib.product_id,
        p.name as product_name,
        p.barcode,
        ib.batch_number,
        ib.quantity,
        ib.cost_price,
        p.selling_price,
        ib.expiration_date,
        ib.date_added,
        u.name as unit_name,
        c.name as category_name
      FROM inventory_batches ib
      JOIN products p ON ib.product_id = p.id
      LEFT JOIN inventory_unit u ON p.unit_id = u.id
      LEFT JOIN inventory_category c ON p.category_id = c.id
      WHERE ${clause}
      ORDER BY ib.expiration_date ASC, p.name ASC LIMIT ? OFFSET ?
    `;

      params.push(pagination.pageSize, offset);

      const result = await query<InventoryBatch>(queryStr, { params });
      setBatches(result || []);
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to fetch batches:", error);
      toast({
        title: "Failed to load inventory",
        description: error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLocalLoading(false);
    }
  }, [
    debouncedSearchTerm,
    categoryFilter,
    expiryFilter,
    pagination.currentPage,
    pagination.pageSize,
    query,
    toast,
    resetError,
  ]);

  const fetchTotalCount = useCallback(async () => {
    try {
      const { clause, params } = buildWhereClause(
        debouncedSearchTerm,
        categoryFilter,
        expiryFilter,
      );

      const countQuery = `
      SELECT COUNT(*) as count 
      FROM inventory_batches ib
      JOIN products p ON ib.product_id = p.id
      LEFT JOIN inventory_category c ON p.category_id = c.id
      WHERE ${clause}
    `;

      const result = await query<{ count: number }>(countQuery, { params });
      setPagination((prev) => ({
        ...prev,
        totalItems: result?.[0]?.count || 0,
      }));
    } catch (err) {
      console.error("Failed to fetch total count:", err);
      toast({
        title: "Count query failed",
        status: "error",
        duration: 3000,
      });
    }
  }, [debouncedSearchTerm, categoryFilter, expiryFilter, query, toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const result = await query<{ name: string }>(
        "SELECT name FROM inventory_category ORDER BY name",
      );
      setCategories(result?.map((c) => c.name) || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setCategories([]);
      toast({
        title: "Failed to load categories",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [query, toast]);

  const refreshData = useCallback(() => {
    const offset = (pagination.currentPage - 1) * pagination.pageSize;

    const { clause, params } = buildWhereClause(
      debouncedSearchTerm,
      categoryFilter,
      expiryFilter,
    );

    const run = async () => {
      try {
        setLocalLoading(true);
        resetError();

        // COUNT
        const countQuery = `
        SELECT COUNT(*) as count 
        FROM inventory_batches ib
        JOIN products p ON ib.product_id = p.id
        LEFT JOIN inventory_category c ON p.category_id = c.id
        WHERE ${clause}
      `;
        const countResult = await query<{ count: number }>(countQuery, {
          params,
        });

        setPagination((prev) => ({
          ...prev,
          totalItems: countResult?.[0]?.count || 0,
        }));

        // BATCHES
        const queryStr = `
        SELECT 
          ib.id,
          ib.product_id,
          p.name as product_name,
          p.barcode,
          ib.batch_number,
          ib.quantity,
          ib.cost_price,
          p.selling_price,
          ib.expiration_date,
          ib.date_added,
          u.name as unit_name,
          c.name as category_name
        FROM inventory_batches ib
        JOIN products p ON ib.product_id = p.id
        LEFT JOIN inventory_unit u ON p.unit_id = u.id
        LEFT JOIN inventory_category c ON p.category_id = c.id
        WHERE ${clause}
        ORDER BY ib.expiration_date ASC, p.name ASC
        LIMIT ? OFFSET ?
      `;

        const fullParams = [...params, pagination.pageSize, offset];
        const batchResult = await query<InventoryBatch>(queryStr, {
          params: fullParams,
        });

        setBatches(batchResult || []);
      } catch (err) {
        toast({
          title: "Refresh failed",
          description: err instanceof Error ? err.message : "Unknown error",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLocalLoading(false);
      }
    };

    run();
  }, [
    pagination.currentPage,
    pagination.pageSize,
    debouncedSearchTerm,
    categoryFilter,
    expiryFilter,
    query,
    toast,
    resetError,
  ]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({
      currentPage: 1,
      pageSize: size,
      totalItems: prev.totalItems,
    }));
  };

  const handleScanComplete = (barcode: string) => {
    setScannedBarcode(barcode);
    setIsScannerOpen(false);
    setIsAddModalOpen(true);
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
  }, [
    isInitializing,
    hasFetchedInitial,
    fetchCategories,
    fetchTotalCount,
    fetchBatches,
  ]);

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

  if (isInitializing) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Initializing database...</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Stack spacing={6}>
        {/* Header and Actions */}
        <Stack
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          spacing={4}
        >
          <Heading size="lg">Inventory List</Heading>

          <Stack
            direction={{ base: "column", sm: "row" }}
            spacing={2}
            width={{ base: "100%", md: "auto" }}
          >
            <Button
              leftIcon={<FiRefreshCw />}
              onClick={refreshData}
              isLoading={localLoading || isLoading}
            >
              Refresh
            </Button>

            <Button
              colorScheme="green"
              leftIcon={<FiPlus />}
              onClick={() => setIsScannerOpen(true)}
            >
              Add Item
            </Button>
          </Stack>
        </Stack>

        {/* Filter Controls */}
        <InventoryFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          expiryFilter={expiryFilter}
          setExpiryFilter={setExpiryFilter}
          categories={categories}
          onReset={resetFilters}
        />

        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {localLoading && batches.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
            <Text mt={4}>Loading inventory...</Text>
          </Box>
        ) : batches.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Text fontSize="xl">No inventory batches found</Text>
            <Button mt={4} onClick={fetchBatches} isLoading={localLoading}>
              Try Again
            </Button>
          </Box>
        ) : (
          <>
            <Hide below="md">
              <InventoryTable
                batches={batches}
                onEditBatch={(batch) => {
                  setSelectedBatch(batch);
                  setIsDetailsModalOpen(true);
                }}
              />
            </Hide>

            <Show below="md">
              <InventoryCards
                batches={batches}
                onEditBatch={(batch) => {
                  setSelectedBatch(batch);
                  setIsDetailsModalOpen(true);
                }}
              />
            </Show>

            <Box mt={4}>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pagination.pageSize}
                onPageSizeChange={handlePageSizeChange}
              />
            </Box>
          </>
        )}
      </Stack>

      {/* Modals */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanComplete={handleScanComplete}
      />

      <AddInventoryItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        barcode={scannedBarcode}
        onItemAdded={handleItemAdded}
      />

      <InventoryDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        batch={selectedBatch}
        onItemUpdated={() => {
          fetchTotalCount();
          fetchBatches();
        }}
        onItemDeleted={() => {
          fetchTotalCount();
          fetchBatches();
        }}
      />
    </Box>
  );
}
