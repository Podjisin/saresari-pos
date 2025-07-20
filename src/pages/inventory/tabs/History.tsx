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
  useColorModeValue,
  Stack,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  Badge,
  Tag,
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
import { FiRefreshCw, FiSearch, FiFilter, FiCalendar } from "react-icons/fi";
import { useState, useEffect } from "react";
import {
  useInventoryHistory,
  InventoryHistoryRecord,
  HistoryQueryParams,
  InventoryChangeReason,
  HistoryStats,
} from "@/pages/inventory/hooks/useInventoryHistory";
import { Pagination } from "@/components/Pagination/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";

export default function InventoryHistory() {
  const [historyRecords, setHistoryRecords] = useState<
    InventoryHistoryRecord[]
  >([]);
  const {
    getInventoryHistory,
    getHistoryStatistics,
    getChangeReasons,
    isLoading,
    error,
    isInitializing,
    resetError,
  } = useInventoryHistory();
  const [localLoading, setLocalLoading] = useState(false);
  const toast = useToast();
  const tableBg = useColorModeValue("white", "gray.800");
  const totalAddCardBg = useColorModeValue("blue.50", "blue.900");
  const totalRemoveCardBg = useColorModeValue("red.50", "red.900");
  const mostCommonReasonCardBg = useColorModeValue("green.50", "green.900");
  const totalAddTextColor = useColorModeValue("blue.600", "blue.200");
  const totalRemoveTextColor = useColorModeValue("red.600", "red.200");
  const mostCommonReasonTextColor = useColorModeValue("green.600", "green.200");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>(
    {},
  );

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    totalItems: 0,
  });
  const totalPages = Math.ceil(pagination.totalItems / pagination.pageSize);

  // Stats state
  const [stats, setStats] = useState<HistoryStats | null>(null);

  const fetchHistory = async () => {
    try {
      setLocalLoading(true);
      resetError();

      const params: HistoryQueryParams = {
        limit: pagination.pageSize,
        offset: (pagination.currentPage - 1) * pagination.pageSize,
        orderBy: "created_at",
        orderDirection: "DESC",
      };

      if (debouncedSearchTerm) {
        params.productId = parseInt(debouncedSearchTerm, 10) || undefined;
      }

      if (reasonFilter !== "all") {
        params.reason = reasonFilter as InventoryChangeReason;
      }

      if (dateRange.start) {
        params.dateFrom = dateRange.start;
      }

      if (dateRange.end) {
        params.dateTo = dateRange.end;
      }

      const result = await getInventoryHistory(params);
      setHistoryRecords(result.records);
      setPagination((prev) => ({
        ...prev,
        totalItems: result.total,
      }));
    } catch (err) {
      console.error("Failed to fetch history:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to load history",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params: Omit<HistoryQueryParams, "limit" | "offset"> = {};

      if (dateRange.start) {
        params.dateFrom = dateRange.start;
      }

      if (dateRange.end) {
        params.dateTo = dateRange.end;
      }

      const statsData = await getHistoryStatistics(params);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
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

  const handleDateRangeChange = (type: "start" | "end", value: string) => {
    setDateRange((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const resetFilters = () => {
    setSearchTerm("");
    setReasonFilter("all");
    setDateRange({});
  };

  useEffect(() => {
    if (!isInitializing) {
      fetchHistory();
      fetchStats();
    }
  }, [
    isInitializing,
    pagination.currentPage,
    pagination.pageSize,
    debouncedSearchTerm,
    reasonFilter,
    dateRange,
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
        {/* Header and Filters */}
        <Stack
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          spacing={4}
        >
          <Heading size="lg">Inventory History</Heading>

          <Stack
            direction={{ base: "column", sm: "row" }}
            spacing={2}
            width={{ base: "100%", md: "auto" }}
          >
            <Button
              leftIcon={<FiRefreshCw />}
              onClick={() => {
                fetchHistory();
                fetchStats();
              }}
              isLoading={localLoading || isLoading}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        {/* Stats Cards */}
        {stats && (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Card bg={totalAddCardBg}>
              <CardBody>
                <Stack spacing={1}>
                  <Text fontSize="sm" color={totalAddTextColor}>
                    Total Added
                  </Text>
                  <Heading size="lg">{stats.total_added}</Heading>
                </Stack>
              </CardBody>
            </Card>

            <Card bg={totalRemoveCardBg}>
              <CardBody>
                <Stack spacing={1}>
                  <Text fontSize="sm" color={totalRemoveTextColor}>
                    Total Removed
                  </Text>
                  <Heading size="lg">{stats.total_removed}</Heading>
                </Stack>
              </CardBody>
            </Card>

            <Card bg={mostCommonReasonCardBg}>
              <CardBody>
                <Stack spacing={1}>
                  <Text fontSize="sm" color={mostCommonReasonTextColor}>
                    Most Common Reason
                  </Text>
                  <Heading size="lg" textTransform="capitalize">
                    {stats.most_common_reason.replace("_", " ")}
                  </Heading>
                </Stack>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

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
                    Search Product ID
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiSearch color="gray.300" />
                    </InputLeftElement>
                    <Input
                      placeholder="Product ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Box>

                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Filter by Reason
                  </Text>
                  <Select
                    value={reasonFilter}
                    onChange={(e) => setReasonFilter(e.target.value)}
                  >
                    <option value="all">All Reasons</option>
                    {getChangeReasons().map((reason) => (
                      <option key={reason} value={reason}>
                        {reason.replace("_", " ")}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Date Range
                  </Text>
                  <Stack
                    direction={{ base: "column", md: "row" }}
                    spacing={3}
                    alignItems={{ base: "stretch", md: "center" }}
                  >
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FiCalendar color="gray.300" />
                      </InputLeftElement>
                      <Input
                        type="date"
                        placeholder="Start date"
                        value={dateRange.start || ""}
                        onChange={(e) =>
                          handleDateRangeChange("start", e.target.value)
                        }
                      />
                    </InputGroup>

                    <Text
                      textAlign={{ base: "center", md: "inherit" }}
                      px={{ base: 0, md: 2 }}
                    >
                      to
                    </Text>

                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FiCalendar color="gray.300" />
                      </InputLeftElement>
                      <Input
                        type="date"
                        placeholder="End date"
                        value={dateRange.end || ""}
                        onChange={(e) =>
                          handleDateRangeChange("end", e.target.value)
                        }
                      />
                    </InputGroup>
                  </Stack>
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

        {localLoading && historyRecords.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
            <Text mt={4}>Loading history...</Text>
          </Box>
        ) : historyRecords.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Text fontSize="xl">No history records found</Text>
            <Button mt={4} onClick={fetchHistory} isLoading={localLoading}>
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
                      <Th>Date</Th>
                      <Th>Product</Th>
                      <Th>Batch</Th>
                      <Th>Change</Th>
                      <Th>Reason</Th>
                      <Th>Note</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {historyRecords.map((record) => {
                      const changeColor =
                        record.change > 0 ? "green.500" : "red.500";
                      const changeSymbol = record.change > 0 ? "+" : "";

                      return (
                        <Tr key={record.id}>
                          <Td>
                            {format(
                              new Date(record.created_at),
                              "MMM dd, yyyy HH:mm",
                            )}
                          </Td>
                          <Td>
                            <Text fontWeight="semibold">
                              {record.product_name}
                            </Text>
                          </Td>
                          <Td>
                            {record.batch_number ? (
                              <Tag size="sm" colorScheme="blue">
                                {record.batch_number}
                              </Tag>
                            ) : (
                              <Text fontSize="sm">-</Text>
                            )}
                          </Td>
                          <Td>
                            <Text color={changeColor} fontWeight="bold">
                              {changeSymbol}
                              {record.change}
                            </Text>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={record.change > 0 ? "green" : "red"}
                              variant="subtle"
                              textTransform="capitalize"
                            >
                              {record.reason.replace("_", " ")}
                            </Badge>
                          </Td>
                          <Td>
                            <Text fontSize="sm" noOfLines={1}>
                              {record.note || "-"}
                            </Text>
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
                {historyRecords.map((record) => {
                  const changeColor =
                    record.change > 0 ? "green.500" : "red.500";
                  const changeSymbol = record.change > 0 ? "+" : "";

                  return (
                    <Card key={record.id} bg={tableBg}>
                      <CardHeader>
                        <Heading size="sm">{record.product_name}</Heading>
                        <Text fontSize="sm" color="gray.500">
                          {format(
                            new Date(record.created_at),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </Text>
                      </CardHeader>
                      <CardBody>
                        <Stack spacing={3}>
                          <HStack justify="space-between">
                            <Box>
                              <Text fontSize="sm" fontWeight="bold">
                                Change
                              </Text>
                              <Text color={changeColor} fontWeight="bold">
                                {changeSymbol}
                                {record.change}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" fontWeight="bold">
                                Reason
                              </Text>
                              <Badge
                                colorScheme={
                                  record.change > 0 ? "green" : "red"
                                }
                                variant="subtle"
                                textTransform="capitalize"
                              >
                                {record.reason.replace("_", " ")}
                              </Badge>
                            </Box>
                          </HStack>

                          {record.batch_number && (
                            <Box>
                              <Text fontSize="sm" fontWeight="bold">
                                Batch
                              </Text>
                              <Tag size="sm" colorScheme="blue">
                                {record.batch_number}
                              </Tag>
                            </Box>
                          )}

                          {record.note && (
                            <Box>
                              <Text fontSize="sm" fontWeight="bold">
                                Note
                              </Text>
                              <Text fontSize="sm">{record.note}</Text>
                            </Box>
                          )}
                        </Stack>
                      </CardBody>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </Show>

            <Box>
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
    </Box>
  );
}
