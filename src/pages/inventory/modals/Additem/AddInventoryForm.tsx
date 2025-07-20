import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Text,
  Box,
} from "@chakra-ui/react";
import { DatePicker } from "@/components/DatePicker";
import type {
  FormState,
  Handlers,
} from "@/hooks/inventory/useAddInventoryForm";

interface AddInventoryFormProps {
  state: FormState;
  handlers: Handlers;
}

export function AddInventoryForm({ state, handlers }: AddInventoryFormProps) {
  return (
    <Stack spacing={4}>
      {state.existingProduct && (
        <Box mb={4}>
          <Text fontStyle="italic">Pre-filled from existing product</Text>
        </Box>
      )}

      <FormControl isRequired>
        <FormLabel>Barcode</FormLabel>
        <Input
          value={state.barcode || ""}
          onChange={(e) => handlers.setBarcode(e.target.value)}
          placeholder="Enter product barcode"
          isDisabled={!!state.existingProduct}
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Product Name</FormLabel>
        <Input
          value={state.name}
          onChange={(e) => handlers.setName(e.target.value)}
        />
      </FormControl>

      <Stack direction="row" spacing={4}>
        <FormControl isRequired>
          <FormLabel>Quantity</FormLabel>
          <NumberInput
            min={1}
            value={state.quantity}
            onChange={(_, val) => handlers.setQuantity(val)}
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
            value={state.costPrice}
            onChange={(_, val) => handlers.setCostPrice(val)}
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
            value={state.sellingPrice}
            onChange={(_, val) => handlers.setSellingPrice(val)}
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
            value={state.unitId ?? ""}
            onChange={(e) =>
              handlers.setUnitId(parseInt(e.target.value, 10) || null)
            }
          >
            {state.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Category</FormLabel>
          <Select
            placeholder="Select category"
            value={state.categoryId ?? ""}
            onChange={(e) =>
              handlers.setCategoryId(parseInt(e.target.value, 10) || null)
            }
          >
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack direction="row" spacing={4}>
        <FormControl>
          <FormLabel>Batch Number (Optional)</FormLabel>
          <Input
            value={state.batchNumber}
            onChange={(e) => handlers.setBatchNumber(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Expiration Date (Optional)</FormLabel>
          <DatePicker
            selectedDate={state.expirationDate}
            onChange={handlers.setExpirationDate}
            placeholderText="Select date"
          />
        </FormControl>
      </Stack>
    </Stack>
  );
}
