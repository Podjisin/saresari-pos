import {
  Box,
  Heading,
  Button,
  Stack,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  Hide,
  Show,
} from "@chakra-ui/react";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import { useState } from "react";
import { AddInventoryItemModal } from "@/pages/inventory/modals/Additem";
import { InventoryDetailsModal } from "@/pages/inventory/modals/ItemDetails";
import { BarcodeScanner } from "@/pages/inventory/modals/BarcodeScanner";
import { Pagination } from "@/components";
import { InventoryCards, InventoryFilters, InventoryTable } from "./components";
import { InventoryBatch } from "@/types/Inventory";
import { useInventoryList } from "./hooks/useInventoryList";

/**
 * Displays and manages a paginated, filterable inventory list with support for adding, editing, and viewing inventory batches.
 *
 * Integrates filtering by search term, category, and expiration status, and provides pagination controls. Includes modals for barcode scanning, adding new inventory items, and viewing or editing batch details. Handles asynchronous data fetching and error notifications.
 *
 * @returns The rendered inventory list tab component.
 */
export function InventoryList() {
  const {
    batches,
    pagination,
    setPagination,
    categories,
    filters,
    fetchBatches,
    refreshData,
    handleItemAdded,
    resetFilters,
    localLoading,
    totalPages,
    isInitializing,
    isLoading,
    error,
  } = useInventoryList();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(
    null,
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
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
          searchTerm={filters.searchTerm}
          setSearchTerm={filters.setSearchTerm}
          categoryFilter={filters.categoryFilter}
          setCategoryFilter={filters.setCategoryFilter}
          expiryFilter={filters.expiryFilter}
          setExpiryFilter={filters.setExpiryFilter}
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
        onItemUpdated={refreshData}
        onItemDeleted={refreshData}
      />
    </Box>
  );
}
