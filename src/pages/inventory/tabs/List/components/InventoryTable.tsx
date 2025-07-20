import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Stack,
  Tag,
  TagLabel,
  Badge,
  IconButton,
  useColorModeValue,
  HStack,
} from "@chakra-ui/react";
import { FiEdit2 } from "react-icons/fi";
import { InventoryBatch } from "@/pages/inventory/types/index";
import { format } from "date-fns";
import { getExpirationStatus } from "@/utils/expirationStatus";

type InventoryTableProps = {
  batches: InventoryBatch[];
  onEditBatch: (batch: InventoryBatch) => void;
};

export function InventoryTable({ batches, onEditBatch }: InventoryTableProps) {
  const tableBg = useColorModeValue("white", "gray.800");

  return (
    <Box borderWidth="1px" borderRadius="lg" overflowX="auto" bg={tableBg}>
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
            const status = getExpirationStatus(batch.expiration_date);
            const isExpired = status?.isExpired || false;
            const isExpiringSoon = status?.isExpiringSoon || false;

            return (
              <Tr key={batch.id}>
                <Td>
                  <Stack spacing={1}>
                    <Text fontWeight="semibold">{batch.product_name}</Text>
                    {batch.barcode && (
                      <Tag size="sm" colorScheme="green" borderRadius="md">
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
                        {(() => {
                          try {
                            return format(
                              new Date(batch.expiration_date || ""),
                              "MMM dd, yyyy",
                            );
                          } catch (err) {
                            console.error("Invalid date format:", err);
                            return "Invalid Date";
                          }
                        })()}
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
                  <Text fontSize="sm">{batch.category_name || "-"}</Text>
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
                      onClick={() => onEditBatch(batch)}
                    />
                  </HStack>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
