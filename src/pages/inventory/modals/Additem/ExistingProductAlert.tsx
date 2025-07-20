import { Alert, AlertIcon, Box, Text } from "@chakra-ui/react";
import { ProductInfo } from "@/hooks/inventory/useAddInventoryForm";

interface ExistingProductAlertProps {
  product: ProductInfo;
}

export function ExistingProductAlert({ product }: ExistingProductAlertProps) {
  return (
    <Alert status="info" mb={4}>
      <AlertIcon />
      <Box>
        <Text fontWeight="bold">Existing product found</Text>
        <Text>
          {product.name} (₱{product.selling_price.toFixed(2)})
        </Text>
        <Text fontSize="sm">
          Category: {product.category_name ?? "None"} | Unit:{" "}
          {product.unit_name ?? "None"}
        </Text>
      </Box>
    </Alert>
  );
}
