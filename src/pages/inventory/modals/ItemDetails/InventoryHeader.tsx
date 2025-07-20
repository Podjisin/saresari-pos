import { HStack, Text, Badge } from "@chakra-ui/react";
import { InventoryBatch } from "@/pages/inventory/types";

export function InventoryHeader({ batch }: { batch: InventoryBatch }) {
  return (
    <HStack justify="space-between">
      <Text fontSize="lg">{batch.product_name}</Text>
      <Badge variant="outline" colorScheme="blue">
        ID: {batch.id}
      </Badge>
    </HStack>
  );
}
