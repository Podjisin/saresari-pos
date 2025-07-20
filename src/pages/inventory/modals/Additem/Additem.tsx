import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useAddInventoryForm } from "@/pages/inventory/hooks/useAddInventoryForm";
import { AddInventoryForm } from "./AddInventoryForm";
import { ExistingProductAlert } from "./ExistingProductAlert";

export interface AddInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  barcode?: string;
  onItemAdded: () => void;
}

export function AddInventoryItemModal({
  isOpen,
  onClose,
  barcode = "",
  onItemAdded,
}: AddInventoryItemModalProps) {
  const toast = useToast();

  const { formState, handlers, submit, resetForm, isLoading } =
    useAddInventoryForm({ barcode, toast, onItemAdded, onClose });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      size="lg"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {formState.existingProduct
            ? "Add Inventory Batch"
            : "Add New Product"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {formState.showExistingAlert && formState.existingProduct && (
            <ExistingProductAlert product={formState.existingProduct} />
          )}
          <AddInventoryForm
            key={barcode}
            state={formState}
            handlers={handlers}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={submit} isLoading={isLoading}>
            {formState.existingProduct ? "Add Batch" : "Add Product & Batch"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
