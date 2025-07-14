import { useState, useEffect } from "react";
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
  Box,
  useDisclosure,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useInventory } from "../../hooks/inventory/useInventory";
import { DatePicker } from "../../components/DatePicker";

interface AddInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  barcode?: string;
  onItemAdded: () => void;
}

interface ProductInfo {
  id: number;
  name: string;
  selling_price: number;
  unit_id: number | null;
  category_id: number | null;
  unit_name: string | null;
  category_name: string | null;
}

export function AddInventoryItemModal({
  isOpen,
  onClose,
  barcode = "",
  onItemAdded,
}: AddInventoryItemModalProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [units, setUnits] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [existingProduct, setExistingProduct] = useState<ProductInfo | null>(
    null,
  );
  const { query, upsertProduct, addInventoryBatch, isLoading } = useInventory();
  const toast = useToast();
  const {
    isOpen: showExistingAlert,
    onOpen: onShowExistingAlert,
    onClose: onHideExistingAlert,
  } = useDisclosure();

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setName("");
      setQuantity(1);
      setCostPrice(0);
      setSellingPrice(0);
      setUnitId(null);
      setCategoryId(null);
      setBatchNumber("");
      setExpirationDate(null);
      setExistingProduct(null);
      onHideExistingAlert();

      // Load units and categories
      const loadData = async () => {
        try {
          const [unitResults, categoryResults] = await Promise.all([
            query<{ id: number; name: string }>(
              "SELECT id, name FROM inventory_unit",
            ),
            query<{ id: number; name: string }>(
              "SELECT id, name FROM inventory_category",
            ),
          ]);

          setUnits(unitResults);
          setCategories(categoryResults);

          // Check if product exists
          if (barcode) {
            const existing = await query<ProductInfo>(
              `SELECT 
                p.id, p.name, p.selling_price, 
                p.unit_id, p.category_id,
                u.name as unit_name,
                c.name as category_name
              FROM products p
              LEFT JOIN inventory_unit u ON p.unit_id = u.id
              LEFT JOIN inventory_category c ON p.category_id = c.id
              WHERE p.barcode = ? LIMIT 1`,
              { params: [barcode] },
            );

            if (existing.length > 0) {
              const product = existing[0];
              setExistingProduct(product);
              setName(product.name);
              setSellingPrice(product.selling_price);
              setUnitId(product.unit_id);
              setCategoryId(product.category_id);
              onShowExistingAlert();
            }
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
  }, [isOpen, barcode]);

  const handleSubmit = async () => {
    try {
      if (!name) throw new Error("Item name is required");
      if (quantity <= 0) throw new Error("Quantity must be positive");
      if (costPrice <= 0) throw new Error("Cost price must be positive");
      if (sellingPrice <= 0) throw new Error("Selling price must be positive");

      // First create/update the product
      const productResult = await upsertProduct({
        name,
        barcode: barcode || null,
        selling_price: sellingPrice,
        unit_id: unitId || undefined,
        category_id: categoryId || undefined,
      });

      // Add check for product ID
      if (!productResult?.id) {
        throw new Error("Failed to create/update product");
      }

      // Then add the inventory batch
      await addInventoryBatch({
        product_id: productResult.id,
        quantity,
        cost_price: costPrice,
        expiration_date: expirationDate || undefined,
        batch_number: batchNumber || undefined,
      });

      toast({
        title: "Inventory added",
        description: `${quantity} units of ${name} added to inventory`,
        status: "success",
        duration: 3000,
      });

      onItemAdded();
      onClose();
    } catch (err) {
      toast({
        title: "Operation failed",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {existingProduct ? "Add Inventory Batch" : "Add New Product"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            {showExistingAlert && existingProduct && (
              <Alert status="info" mb={4}>
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Existing product found</Text>
                  <Text>
                    {existingProduct.name} (₱
                    {existingProduct.selling_price.toFixed(2)})
                  </Text>
                  <Text fontSize="sm">
                    Category: {existingProduct.category_name || "None"} | Unit:{" "}
                    {existingProduct.unit_name || "None"}
                  </Text>
                </Box>
              </Alert>
            )}

            {barcode && (
              <FormControl>
                <FormLabel>Barcode</FormLabel>
                <Input value={barcode} readOnly />
              </FormControl>
            )}

            <FormControl isRequired>
              <FormLabel>Product Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
              />
            </FormControl>

            <Stack direction="row" spacing={4}>
              <FormControl isRequired>
                <FormLabel>Quantity</FormLabel>
                <NumberInput
                  min={1}
                  value={quantity}
                  onChange={(_, val) => {
                    if (!isNaN(val)) setQuantity(val);
                  }}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Cost Price (₱)</FormLabel>
                <NumberInput
                  min={0.01}
                  step={0.01}
                  precision={2}
                  value={costPrice}
                  onChange={(_, val) => {
                    if (!isNaN(val)) setCostPrice(val);
                  }}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Selling Price (₱)</FormLabel>
                <NumberInput
                  min={0.01}
                  step={0.01}
                  precision={2}
                  value={sellingPrice}
                  onChange={(_, val) => {
                    if (!isNaN(val)) setSellingPrice(val);
                  }}
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
                  value={unitId !== null ? unitId : ""}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setUnitId(isNaN(parsed) ? null : parsed);
                  }}
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
                  value={categoryId !== null ? categoryId : ""}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setCategoryId(isNaN(parsed) ? null : parsed);
                  }}
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
                <FormLabel>Batch Number (Optional)</FormLabel>
                <Input
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g., BATCH-001"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Expiration Date (Optional)</FormLabel>
                <DatePicker
                  selectedDate={expirationDate}
                  onChange={setExpirationDate}
                  placeholderText="Select date"
                />
              </FormControl>
            </Stack>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {existingProduct ? "Add Batch" : "Add Product & Batch"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
