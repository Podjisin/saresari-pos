import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  HStack,
} from "@chakra-ui/react";
import { FiEdit, FiTrash2, FiSave } from "react-icons/fi";
import { useInventoryDetailForm } from "@/pages/inventory/modals/ItemDetails/hooks/useInventoryDetailForm";
import { InventoryHeader } from "./InventoryHeader";
import { InventoryDisplay } from "./InventoryDisplay";
import { InventoryEditForm } from "./InventoryEditForm";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { InventoryBatch } from "@/types/Inventory";

export interface InventoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: InventoryBatch | null;
  onItemUpdated: () => void;
  onItemDeleted: () => void;
}

export function InventoryDetailsModal({
  isOpen,
  onClose,
  batch,
  onItemUpdated,
  onItemDeleted,
}: InventoryDetailsModalProps) {
  const {
    formData,
    units,
    categories,
    isEditing,
    isLoading,
    error,
    isDeleteDialogOpen,
    cancelRef,
    startEdit,
    cancelEdit,
    updateBatch,
    openDeleteDialog,
    closeDeleteDialog,
    deleteBatch,
  } = useInventoryDetailForm({ batch, onItemUpdated, onItemDeleted, onClose });

  if (!batch) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <InventoryHeader batch={batch} />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <InventoryDisplay error={error} batch={batch} />
            {isEditing && (
              <InventoryEditForm
                formData={formData}
                units={units}
                categories={categories}
                onChange={formData.set}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    isDisabled={isLoading}
                    onClick={cancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="blue"
                    leftIcon={<FiSave />}
                    isLoading={isLoading}
                    onClick={updateBatch}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    leftIcon={<FiTrash2 />}
                    variant="outline"
                    onClick={openDeleteDialog}
                  >
                    Delete
                  </Button>
                  <Button
                    colorScheme="blue"
                    leftIcon={<FiEdit />}
                    isDisabled={isLoading}
                    onClick={startEdit}
                  >
                    Edit
                  </Button>
                </>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        cancelRef={cancelRef}
        onClose={closeDeleteDialog}
        onDelete={deleteBatch}
        batch={batch}
        isLoading={isLoading}
      />
    </>
  );
}
