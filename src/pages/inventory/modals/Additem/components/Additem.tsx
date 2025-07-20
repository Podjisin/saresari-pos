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
 * Displays a modal dialog for adding an inventory item, allowing users to add a new product or an additional batch to an existing product.
 *
 * The modal manages form state, handles submission, and provides feedback via toast notifications. The UI adapts based on whether the scanned or entered barcode matches an existing product.
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
