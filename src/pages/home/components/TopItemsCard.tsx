import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { useTopSellingProducts } from "@/hooks/useTopSellingProducts";

/**
 * Displays a card listing the top-selling products with their sales counts.
 *
 * Fetches product data using a custom hook and adapts its appearance based on the current color mode. Shows a loading spinner, error message, or a placeholder if no data is available.
 *
 * @returns A styled card component with a list of top-selling products or relevant status messages.
 */
export function TopItemsCard() {
  const { data, isLoading, error } = useTopSellingProducts();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const elseBg = useColorModeValue("gray.50", "gray.700");

  return (
    <Box
      bg={cardBg}
      p={6}
      borderRadius="xl"
      shadow="md"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <Heading size="md" mb={4}>
        Top Selling Products
      </Heading>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Text color="red.500">Failed to load: {error}</Text>
      ) : !data || data.length === 0 ? (
        <Text>No top products found.</Text>
      ) : (
        <VStack align="stretch" spacing={3}>
          {data.map((product) => (
            <HStack
              key={product.product_id}
              justifyContent="space-between"
              p={3}
              borderRadius="md"
              bg={elseBg}
            >
              <Text fontWeight="medium">{product.name}</Text>
              <Badge colorScheme="green">Sold: {product.total_sold}</Badge>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}
