import { Stack, Box, Text, Alert, AlertIcon } from "@chakra-ui/react";
import { InventoryBatch } from "@/types/InventoryBatch";

interface InventoryDisplayProps {
  batch: InventoryBatch;
  error: string | null;
}

export function InventoryDisplay({ batch, error }: InventoryDisplayProps) {
  const isExpired = batch.expiration_date
    ? new Date(batch.expiration_date) < new Date()
    : false;

  return (
    <Stack spacing={4} mb={4}>
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Box>
        <Text fontSize="xl" fontWeight="bold">
          {batch.product_name}
        </Text>
        {batch.barcode && (
          <Text color="gray.500">Barcode: {batch.barcode}</Text>
        )}
      </Box>

      <Stack direction="row" spacing={8}>
        <Box>
          <Text fontSize="sm" color="gray.500">
            Date Added
          </Text>
          <Text fontSize="md">
            {new Date(batch.date_added).toLocaleDateString()}
          </Text>
        </Box>

        {batch.expiration_date && (
          <Box>
            <Text fontSize="sm" color="gray.500">
              Expiration Date
            </Text>
            <Text fontSize="md" color={isExpired ? "red.500" : "inherit"}>
              {new Date(batch.expiration_date).toLocaleDateString()}
              {isExpired && " (Expired)"}
            </Text>
          </Box>
        )}
      </Stack>

      <Stack direction="row" spacing={8}>
        <Box>
          <Text fontSize="sm" color="gray.500">
            Batch Number
          </Text>
          <Text fontSize="md">{batch.batch_number || "-"}</Text>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500">
            Quantity
          </Text>
          <Text fontSize="md">{batch.quantity}</Text>
        </Box>
      </Stack>

      <Stack direction="row" spacing={8}>
        <Box>
          <Text fontSize="sm" color="gray.500">
            Cost Price
          </Text>
          <Text fontSize="md">₱{batch.cost_price.toFixed(2)}</Text>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500">
            Selling Price
          </Text>
          <Text fontSize="md" fontWeight="bold" color="green.500">
            ₱{batch.selling_price.toFixed(2)}
          </Text>
        </Box>
      </Stack>

      <Stack direction="row" spacing={8}>
        <Box>
          <Text fontSize="sm" color="gray.500">
            Unit
          </Text>
          <Text fontSize="md">{batch.unit_name || "-"}</Text>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500">
            Category
          </Text>
          <Text fontSize="md">{batch.category_name || "-"}</Text>
        </Box>
      </Stack>
    </Stack>
  );
}
