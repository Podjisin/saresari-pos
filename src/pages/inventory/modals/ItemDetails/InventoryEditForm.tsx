import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Select,
} from "@chakra-ui/react";
import type {
  Unit,
  Category,
  FormData,
} from "@/hooks/inventory/useInventoryDetailForm";

interface InventoryEditFormProps {
  formData: FormData & { set: (update: Partial<FormData>) => void };
  units: Unit[];
  categories: Category[];
  onChange: (update: Partial<FormData>) => void;
}

export function InventoryEditForm({
  formData,
  units,
  categories,
  onChange,
}: InventoryEditFormProps) {
  return (
    <Stack spacing={4} mb={4}>
      <Stack direction="row" spacing={4}>
        <FormControl>
          <FormLabel>Quantity</FormLabel>
          <NumberInput
            min={0}
            value={formData.quantity}
            onChange={(_, val) => onChange({ quantity: val })}
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
            onChange={(_, val) => onChange({ costPrice: val })}
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
            onChange={(_, val) => onChange({ sellingPrice: val })}
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
            value={formData.unitId ?? ""}
            onChange={(e) =>
              onChange({
                unitId: e.target.value ? parseInt(e.target.value, 10) : null,
              })
            }
          >
            {units.map((u) => (
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
            value={formData.categoryId ?? ""}
            onChange={(e) =>
              onChange({
                categoryId: e.target.value
                  ? parseInt(e.target.value, 10)
                  : null,
              })
            }
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
            onChange={(e) => onChange({ batchNumber: e.target.value })}
            placeholder="Optional"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Expiration Date</FormLabel>
          <Input
            type="date"
            value={formData.expirationDate ?? ""}
            onChange={(e) =>
              onChange({
                expirationDate: e.target.value || null,
              })
            }
          />
        </FormControl>
      </Stack>
    </Stack>
  );
}
