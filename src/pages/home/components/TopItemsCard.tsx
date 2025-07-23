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
import { useTopSellingProducts } from "@/pages/home/hooks/useTopSellingProducts";

/**
 * Renders a card displaying the top selling products and their sales counts.
 *
 * Fetches product data using a custom hook and conditionally displays a loading spinner, error message, placeholder, or a styled list of products with their total units sold. The card's appearance adapts to the current color mode.
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
