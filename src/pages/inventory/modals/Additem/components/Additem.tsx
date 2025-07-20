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
import { useAddInventoryForm } from "@/pages/inventory/modals/Additem/hooks/useAddInventoryForm";
import { AddInventoryForm } from "./AddInventoryForm";
import { ExistingProductAlert } from "./ExistingProductAlert";

export interface AddInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  barcode?: string;
  onItemAdded: () => void;
}

/**
 * Displays a modal dialog for adding a new inventory item or batch, supporting both new products and additional batches for existing products.
 *
 * The modal manages form state, conditional UI for existing products, and submission flow. It invokes provided callbacks when the modal is closed or an item is successfully added.
 */
export function AddInventoryItemModal({
  isOpen,
  onClose,
  barcode = "",
  onItemAdded,
}: AddInventoryItemModalProps) {
  const toast = useToast();

  const { formState, handlers, submit, resetForm, isLoading } =
    useAddInventoryForm({ barcode, toast, onItemAdded, onClose });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleClose();
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
          <Button
            variant="ghost"
            mr={3}
            onClick={() => {
              handleClose();
            }}
          >
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
