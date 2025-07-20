import {
  Box,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  Flex,
  Stack,
  Card,
  CardBody,
} from "@chakra-ui/react";
import { FiSearch, FiFilter } from "react-icons/fi";

interface InventoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  expiryFilter: string;
  setExpiryFilter: (value: string) => void;
  categories: string[];
  onReset: () => void;
}

/**
 * Renders a responsive filter panel for inventory items, including search, category, and expiry filters.
 *
 * Provides input controls for searching products by name, barcode, or batch, selecting a category from available options, and filtering by expiry status. Includes a reset button to clear all filters.
 *
 * @param categories - List of available categories to display in the category filter dropdown.
 */
export function InventoryFilters({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  expiryFilter,
  setExpiryFilter,
  categories,
  onReset,
}: InventoryFiltersProps) {
  return (
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

            <Button leftIcon={<FiFilter />} onClick={onReset} variant="outline">
              Reset
            </Button>
          </Flex>
        </Stack>
      </CardBody>
    </Card>
  );
}
