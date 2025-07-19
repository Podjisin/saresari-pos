import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  useColorModeValue,
  Stack,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  Badge,
  Tag,
  TagLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  CardHeader,
  Hide,
  Show,
  SimpleGrid,
  Select,
  Flex,
} from "@chakra-ui/react";
import {
  FiPlus,
  FiEdit2,
  FiRefreshCw,
  FiSearch,
  FiFilter,
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { useInventory } from "../../../hooks/inventory/useInventory";
import { AddInventoryItemModal } from "../modals/Additem";
import { InventoryDetailsModal } from "../modals/ItemDetails";
import { BarcodeScanner } from "../modals/BarcodeScanner";
import { Pagination } from "../../../components/Pagination";
import { useDebounce } from "../../../hooks/useDebounce";
import { format } from "date-fns";
import { InventoryBatch } from "@/types/index";

export default function InventoryList() {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const { query, isLoading, error, isInitializing, resetError } =
    useInventory();
  const [localLoading, setLocalLoading] = useState(false);
  const toast = useToast();
  const tableBg = useColorModeValue("white", "gray.800");

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

  const fetchBatches = async () => {
    try {
      setLocalLoading(true);
      resetError();
      const offset = (pagination.currentPage - 1) * pagination.pageSize;

      let queryStr = `
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
        WHERE (p.name LIKE ? OR p.barcode LIKE ? OR ib.batch_number LIKE ?)
      `;

      const params: unknown[] = [
        `%${debouncedSearchTerm}%`,
        `%${debouncedSearchTerm}%`,
        `%${debouncedSearchTerm}%`,
      ];

      // Add category filter if not "all"
      if (categoryFilter !== "all") {
        queryStr += " AND c.name = ?";
        params.push(categoryFilter);
      }

      // Add expiry filter
      if (expiryFilter === "expired") {
        queryStr += " AND ib.expiration_date < date('now')";
      } else if (expiryFilter === "expiring") {
        queryStr +=
          " AND ib.expiration_date BETWEEN date('now') AND date('now', '+30 days')";
      } else if (expiryFilter === "valid") {
        queryStr +=
          " AND (ib.expiration_date IS NULL OR ib.expiration_date >= date('now'))";
      }

      queryStr +=
        " ORDER BY ib.expiration_date ASC, p.name ASC LIMIT ? OFFSET ?";
      params.push(pagination.pageSize, offset);

      const result = await query<InventoryBatch>(queryStr, { params });
      setBatches(result || []);
    } catch (err) {
      console.error("Database error:", err);
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
      let countQuery = `
        SELECT COUNT(*) as count 
        FROM inventory_batches ib
        JOIN products p ON ib.product_id = p.id
        LEFT JOIN inventory_category c ON p.category_id = c.id
        WHERE (p.name LIKE ? OR p.barcode LIKE ? OR ib.batch_number LIKE ?)
      `;

      const params: unknown[] = [
        `%${debouncedSearchTerm}%`,
        `%${debouncedSearchTerm}%`,
        `%${debouncedSearchTerm}%`,
      ];

      if (categoryFilter !== "all") {
        countQuery += " AND c.name = ?";
        params.push(categoryFilter);
      }

      if (expiryFilter === "expired") {
        countQuery += " AND ib.expiration_date < date('now')";
      } else if (expiryFilter === "expiring") {
        countQuery +=
          " AND ib.expiration_date BETWEEN date('now') AND date('now', '+30 days')";
      } else if (expiryFilter === "valid") {
        countQuery +=
          " AND (ib.expiration_date IS NULL OR ib.expiration_date >= date('now'))";
      }

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
  };

  const fetchCategories = async () => {
    try {
      const result = await query<{ name: string }>(
        "SELECT name FROM inventory_category ORDER BY name",
      );
      setCategories(result?.map((c) => c.name) || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setCategories([]);
    }
  };

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
    if (!isInitializing) {
      fetchTotalCount();
      fetchBatches();
      fetchCategories();
    }
  }, [
    isInitializing,
    pagination.currentPage,
    pagination.pageSize,
    debouncedSearchTerm,
    categoryFilter,
    expiryFilter,
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
              onClick={() => {
                fetchTotalCount();
                fetchBatches();
              }}
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
        <Card>
          <CardBody>
            <Stack spacing={4}>
              <Flex
                direction={{ base: "column", md: "row" }}
                gap={4}
                alignItems={{ base: "stretch", md: "flex-end" }}
              >
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Search Products
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiSearch color="gray.300" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search by name, barcode, or batch..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Box>

                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Filter by Category
                  </Text>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Filter by Expiry
                  </Text>
                  <Select
                    value={expiryFilter}
                    onChange={(e) => setExpiryFilter(e.target.value)}
                  >
                    <option value="all">All Items</option>
                    <option value="expired">Expired</option>
                    <option value="expiring">Expiring Soon (30 days)</option>
                    <option value="valid">Not Expired</option>
                  </Select>
                </Box>

                <Button
                  leftIcon={<FiFilter />}
                  onClick={resetFilters}
                  variant="outline"
                >
                  Reset
                </Button>
              </Flex>
            </Stack>
          </CardBody>
        </Card>

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
              {/* Desktop table view */}
              <Box
                borderWidth="1px"
                borderRadius="lg"
                overflowX="auto"
                bg={tableBg}
              >
                <Table variant="striped" colorScheme="gray">
                  <Thead>
                    <Tr>
                      <Th>Product</Th>
                      <Th>Batch/Expiry</Th>
                      <Th isNumeric>Stock</Th>
                      <Th>Unit</Th>
                      <Th>Category</Th>
                      <Th isNumeric>Cost (₱)</Th>
                      <Th isNumeric>Price (₱)</Th>
                      <Th textAlign="center">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {batches.map((batch) => {
                      const isExpired = batch.expiration_date
                        ? new Date(batch.expiration_date) < new Date()
                        : false;
                      const isExpiringSoon = batch.expiration_date
                        ? new Date(batch.expiration_date) <
                            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                          !isExpired
                        : false;

                      return (
                        <Tr key={batch.id}>
                          <Td>
                            <Stack spacing={1}>
                              <Text fontWeight="semibold">
                                {batch.product_name}
                              </Text>
                              {batch.barcode && (
                                <Tag
                                  size="sm"
                                  colorScheme="green"
                                  borderRadius="md"
                                  variant="solid"
                                  width="fit-content"
                                >
                                  <TagLabel>{batch.barcode}</TagLabel>
                                </Tag>
                              )}
                            </Stack>
                          </Td>
                          <Td>
                            <Stack spacing={1}>
                              {batch.batch_number && (
                                <Text fontSize="sm">{batch.batch_number}</Text>
                              )}
                              {batch.expiration_date && (
                                <Badge
                                  colorScheme={
                                    isExpired
                                      ? "red"
                                      : isExpiringSoon
                                        ? "orange"
                                        : "green"
                                  }
                                  variant="outline"
                                >
                                  {isExpired
                                    ? "Expired"
                                    : isExpiringSoon
                                      ? "Expiring Soon"
                                      : "Valid"}
                                  :{" "}
                                  {format(
                                    new Date(batch.expiration_date),
                                    "MMM dd, yyyy",
                                  )}
                                </Badge>
                              )}
                            </Stack>
                          </Td>
                          <Td isNumeric>
                            <Text fontWeight="bold">{batch.quantity}</Text>
                          </Td>
                          <Td>
                            <Tag colorScheme="teal" size="sm">
                              <TagLabel>{batch.unit_name || "-"}</TagLabel>
                            </Tag>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {batch.category_name || "-"}
                            </Text>
                          </Td>
                          <Td isNumeric>{batch.cost_price.toFixed(2)}</Td>
                          <Td isNumeric fontWeight="bold" color="green.500">
                            {batch.selling_price.toFixed(2)}
                          </Td>
                          <Td textAlign="center">
                            <HStack justify="center" spacing={2}>
                              <IconButton
                                icon={<FiEdit2 />}
                                aria-label="Edit batch"
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => {
                                  setSelectedBatch(batch);
                                  setIsDetailsModalOpen(true);
                                }}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            </Hide>

            <Show below="md">
              {/* Mobile card view */}
              <SimpleGrid columns={1} spacing={4}>
                {batches.map((batch) => {
                  const isExpired = batch.expiration_date
                    ? new Date(batch.expiration_date) < new Date()
                    : false;
                  const isExpiringSoon = batch.expiration_date
                    ? new Date(batch.expiration_date) <
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                      !isExpired
                    : false;

                  return (
                    <Card key={batch.id} bg={tableBg}>
                      <CardHeader>
                        <Heading size="sm">{batch.product_name}</Heading>
                        {batch.barcode && (
                          <Tag size="sm" colorScheme="green" mt={1}>
                            {batch.barcode}
                          </Tag>
                        )}
                      </CardHeader>
                      <CardBody>
                        <Stack spacing={3}>
                          <Box>
                            <Text fontSize="sm" fontWeight="bold">
                              Batch Info
                            </Text>
                            {batch.batch_number && (
                              <Text fontSize="sm">{batch.batch_number}</Text>
                            )}
                            {batch.expiration_date && (
                              <Badge
                                colorScheme={
                                  isExpired
                                    ? "red"
                                    : isExpiringSoon
                                      ? "orange"
                                      : "green"
                                }
                                variant="outline"
                                mr={2}
                              >
                                {isExpired
                                  ? "Expired"
                                  : isExpiringSoon
                                    ? "Expiring Soon"
                                    : "Valid"}
                                :{" "}
                                {format(
                                  new Date(batch.expiration_date),
                                  "MMM dd, yyyy",
                                )}
                              </Badge>
                            )}
                          </Box>
                          <HStack justify="space-between" spacing={4}>
                            <Box flex="1">
                              <Text fontSize="sm" fontWeight="bold">
                                Stock
                              </Text>
                              <Text>
                                {batch.quantity} {batch.unit_name || ""}
                              </Text>
                            </Box>
                            <Box flex="1">
                              <Text fontSize="sm" fontWeight="bold">
                                Category
                              </Text>
                              <Text>{batch.category_name || "-"}</Text>
                            </Box>
                          </HStack>
                          <HStack justify="space-between" spacing={4}>
                            <Box flex="1">
                              <Text fontSize="sm" fontWeight="bold">
                                Cost Price
                              </Text>
                              <Text color="red.500">
                                ₱{batch.cost_price.toFixed(2)}
                              </Text>
                            </Box>
                            <Box flex="1">
                              <Text fontSize="sm" fontWeight="bold">
                                Selling Price
                              </Text>
                              <Text color="green.500" fontWeight="bold">
                                ₱{batch.selling_price.toFixed(2)}
                              </Text>
                            </Box>
                            <Box flex="1">
                              <Text fontSize="sm" fontWeight="bold">
                                Profit
                              </Text>
                              <Text color="green.500" fontWeight="bold">
                                ₱
                                {(
                                  batch.selling_price - batch.cost_price
                                ).toFixed(2)}
                              </Text>
                            </Box>
                          </HStack>
                          <Button
                            size="sm"
                            leftIcon={<FiEdit2 />}
                            onClick={() => {
                              setSelectedBatch(batch);
                              setIsDetailsModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </Stack>
                      </CardBody>
                    </Card>
                  );
                })}
              </SimpleGrid>
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
