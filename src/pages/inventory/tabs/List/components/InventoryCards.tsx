import {
  Box,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  Stack,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiEdit2 } from "react-icons/fi";
import { format } from "date-fns";
import { InventoryBatch } from "@/types/Inventory";

type InventoryCardsProps = {
  batches: InventoryBatch[];
  onEditBatch: (batch: InventoryBatch) => void;
};

/**
 * Displays a list of inventory batch cards with product, stock, pricing, and expiration details.
 *
 * Each card presents information about an inventory batch, including product name, barcode, batch number, expiration status, stock quantity, category, cost price, selling price, and calculated profit. The expiration status is visually indicated as "Expired," "Expiring Soon," or "Valid" based on the batch's expiration date. An edit button on each card triggers the provided callback with the corresponding batch data.
 *
 * @param batches - Array of inventory batch objects to display
 * @param onEditBatch - Callback invoked when the edit button is clicked for a batch
 * @returns A stack of styled inventory batch cards
 */
export function InventoryCards({ batches, onEditBatch }: InventoryCardsProps) {
  const tableBg = useColorModeValue("white", "gray.800");

  return (
    <Stack spacing={4}>
      {batches.map((batch) => {
        const isExpired = batch.expiration_date
          ? new Date(batch.expiration_date) < new Date()
          : false;
        const isExpiringSoon = batch.expiration_date
          ? new Date(batch.expiration_date) <
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && !isExpired
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
                        isExpired ? "red" : isExpiringSoon ? "orange" : "green"
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
                      {format(new Date(batch.expiration_date), "MMM dd, yyyy")}
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
                    <Text color="red.500">₱{batch.cost_price.toFixed(2)}</Text>
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
                    {(() => {
                      const profit = batch.selling_price - batch.cost_price;
                      return (
                        <Text
                          color={profit >= 0 ? "green.500" : "red.500"}
                          fontWeight="bold"
                        >
                          ₱{profit.toFixed(2)}
                        </Text>
                      );
                    })()}
                  </Box>
                </HStack>

                <Button
                  size="sm"
                  leftIcon={<FiEdit2 />}
                  onClick={() => onEditBatch(batch)}
                >
                  Edit
                </Button>
              </Stack>
            </CardBody>
          </Card>
        );
      })}
    </Stack>
  );
}
