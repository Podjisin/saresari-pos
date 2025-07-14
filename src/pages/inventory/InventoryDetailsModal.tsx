import { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  useToast,
  Stack,
  Text,
  Tag,
  TagLabel,
  Box,
  Alert,
  AlertIcon,
  Badge,
  HStack,
  useDisclosure,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { useInventory } from "../../hooks/inventory/useInventory";
import { DatePicker } from "../../components/DatePicker";
import { FiTrash2, FiEdit, FiSave } from "react-icons/fi";

interface InventoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: InventoryBatch | null;
  onItemUpdated: () => void;
  onItemDeleted: () => void;
}

interface InventoryBatch {
  id: number;
  product_id: number;
  product_name: string;
  barcode: string | null;
  batch_number: string | null;
  quantity: number;
  cost_price: number;
  selling_price: number;
  expiration_date: string | null;
  date_added: string;
  unit_name: string | null;
  category_name: string | null;
}

interface Unit {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

export function InventoryDetailsModal({
  isOpen,
  onClose,
  batch,
  onItemUpdated,
  onItemDeleted,
}: InventoryDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState({
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    batchNumber: "",
    expirationDate: null as string | null,
    unitId: null as number | null,
    categoryId: null as number | null,
  });
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const {
    query,
    updateInventoryBatchQuantity,
    editInventoryBatch,
    deleteInventoryBatch,
    upsertProduct,
    isLoading,
    error,
  } = useInventory();
  const toast = useToast();
  const {
    isOpen: isDeleteDialogOpen,
    onOpen: onDeleteDialogOpen,
    onClose: onDeleteDialogClose,
  } = useDisclosure();

  const resetForm = useCallback(() => {
    if (batch) {
      setFormData({
        quantity: batch.quantity,
        costPrice: batch.cost_price,
        sellingPrice: batch.selling_price,
        batchNumber: batch.batch_number || "",
        expirationDate: batch.expiration_date,
        unitId: null,
        categoryId: null,
      });
    }
  }, [batch]);

  useEffect(() => {
    if (isOpen && batch) {
      setIsEditing(false);
      resetForm();

      const loadData = async () => {
        try {
          const [unitResults, categoryResults] = await Promise.all([
            query<Unit>("SELECT id, name FROM inventory_unit"),
            query<Category>("SELECT id, name FROM inventory_category"),
          ]);

          setUnits(unitResults || []);
          setCategories(categoryResults || []);

          const productInfo = await query<{
            unit_id: number | null;
            category_id: number | null;
          }>("SELECT unit_id, category_id FROM products WHERE id = ? LIMIT 1", {
            params: [batch.product_id],
          });

          if (productInfo && productInfo.length > 0) {
            setFormData((prev) => ({
              ...prev,
              unitId: productInfo[0].unit_id,
              categoryId: productInfo[0].category_id,
            }));
          }
        } catch (err) {
          console.error("Failed to load form data:", err);
          toast({
            title: "Loading failed",
            description: "Could not load required data",
            status: "error",
            duration: 3000,
          });
        }
      };

      loadData();
    }
  }, [isOpen, batch, query, resetForm, toast]);

  const handleInputChange = (field: keyof typeof formData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    try {
      if (!batch) return;

      await upsertProduct({
        name: batch.product_name,
        barcode: batch.barcode,
        selling_price: formData.sellingPrice,
        unit_id: formData.unitId || undefined,
        category_id: formData.categoryId || undefined,
      });

      await editInventoryBatch(batch.id, {
        cost_price: formData.costPrice,
        expiration_date: formData.expirationDate,
        batch_number: formData.batchNumber || null,
      });

      if (formData.quantity !== batch.quantity) {
        await updateInventoryBatchQuantity(
          batch.id,
          formData.quantity,
          "adjustment",
          "Quantity adjusted during edit",
        );
      }

      toast({
        title: "Update successful",
        status: "success",
        duration: 2000,
      });

      onItemUpdated();
      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (!batch) return;

      await deleteInventoryBatch(
        batch.id,
        "Batch manually deleted from inventory",
      );

      toast({
        title: "Batch deleted",
        status: "success",
        duration: 2000,
      });

      onItemDeleted();
      onClose();
    } catch (err) {
      console.error("Delete error:", err);
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      onDeleteDialogClose();
    }
  };

  if (!batch) return null;

  const isExpired = batch.expiration_date
    ? new Date(batch.expiration_date) < new Date()
    : false;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack justify="space-between">
              <Text>Inventory Details</Text>
              <Badge colorScheme="blue" variant="outline">
                ID: {batch.id}
              </Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              {error && (
                <Alert status="error" mb={4}>
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <Box>
                <Text fontSize="xl" fontWeight="bold">
                  {batch.product_name}
                </Text>
                {batch.barcode && (
                  <Tag colorScheme="green" mt={1}>
                    <TagLabel>{batch.barcode}</TagLabel>
                  </Tag>
                )}
              </Box>

              <Stack direction="row" spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Date Added
                  </Text>
                  <Text>{new Date(batch.date_added).toLocaleDateString()}</Text>
                </Box>

                {batch.expiration_date && (
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Expiration Date
                    </Text>
                    <Text color={isExpired ? "red.500" : "inherit"}>
                      {new Date(batch.expiration_date).toLocaleDateString()}
                      {isExpired && " (Expired)"}
                    </Text>
                  </Box>
                )}

                {batch.batch_number && (
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Batch Number
                    </Text>
                    <Text>{batch.batch_number}</Text>
                  </Box>
                )}
              </Stack>

              {isEditing ? (
                <>
                  <Stack direction="row" spacing={4}>
                    <FormControl>
                      <FormLabel>Quantity</FormLabel>
                      <NumberInput
                        min={0}
                        value={formData.quantity}
                        onChange={(_, val) =>
                          handleInputChange("quantity", val)
                        }
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Cost Price (₱)</FormLabel>
                      <NumberInput
                        min={0.01}
                        step={0.01}
                        precision={2}
                        value={formData.costPrice}
                        onChange={(_, val) =>
                          handleInputChange("costPrice", val)
                        }
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Selling Price (₱)</FormLabel>
                      <NumberInput
                        min={0.01}
                        step={0.01}
                        precision={2}
                        value={formData.sellingPrice}
                        onChange={(_, val) =>
                          handleInputChange("sellingPrice", val)
                        }
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                  </Stack>

                  <Stack direction="row" spacing={4}>
                    <FormControl>
                      <FormLabel>Unit</FormLabel>
                      <Select
                        placeholder="Select unit"
                        value={formData.unitId || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "unitId",
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                      >
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Category</FormLabel>
                      <Select
                        placeholder="Select category"
                        value={formData.categoryId || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "categoryId",
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  <Stack direction="row" spacing={4}>
                    <FormControl>
                      <FormLabel>Batch Number</FormLabel>
                      <Input
                        value={formData.batchNumber}
                        onChange={(e) =>
                          handleInputChange("batchNumber", e.target.value)
                        }
                        placeholder="Optional"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Expiration Date</FormLabel>
                      <DatePicker
                        selectedDate={formData.expirationDate}
                        onChange={(date) =>
                          handleInputChange("expirationDate", date)
                        }
                        placeholderText="Select date"
                      />
                    </FormControl>
                  </Stack>
                </>
              ) : (
                <>
                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.500">
                        Quantity
                      </Text>
                      <Text fontSize="lg" fontWeight="bold">
                        {batch.quantity}
                      </Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color="gray.500">
                        Cost Price
                      </Text>
                      <Text fontSize="lg">₱{batch.cost_price.toFixed(2)}</Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color="gray.500">
                        Selling Price
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="green.500">
                        ₱{batch.selling_price.toFixed(2)}
                      </Text>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.500">
                        Unit
                      </Text>
                      <Text>{batch.unit_name || "None"}</Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color="gray.500">
                        Category
                      </Text>
                      <Text>{batch.category_name || "None"}</Text>
                    </Box>
                  </Stack>
                </>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsEditing(false);
                    }}
                    isDisabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="blue"
                    leftIcon={<FiSave />}
                    onClick={handleUpdate}
                    isLoading={isLoading}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    colorScheme="red"
                    leftIcon={<FiTrash2 />}
                    onClick={onDeleteDialogOpen}
                    variant="outline"
                  >
                    Delete
                  </Button>
                  <Button
                    colorScheme="blue"
                    leftIcon={<FiEdit />}
                    onClick={() => setIsEditing(true)}
                    isDisabled={isLoading}
                  >
                    Edit
                  </Button>
                </>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete confirmation dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteDialogClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Inventory Batch
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this batch of{" "}
              <strong>{batch.product_name}</strong>? This action cannot be
              undone.
              {batch.quantity > 0 && (
                <Alert status="warning" mt={2}>
                  <AlertIcon />
                  This batch still has {batch.quantity} items in stock!
                </Alert>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteDialogClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={isLoading}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
