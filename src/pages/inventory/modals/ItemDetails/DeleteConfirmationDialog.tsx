import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  cancelRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  onDelete: () => void;
  batch: {
    product_name: string;
    quantity: number;
  };
  isLoading: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  cancelRef,
  onClose,
  onDelete,
  batch,
  isLoading,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader>Delete Inventory Batch</AlertDialogHeader>
          <AlertDialogBody>
            Are you sure you want to delete this batch of{" "}
            <strong>{batch.product_name}</strong>?
            {batch.quantity > 0 && (
              <Alert status="warning" mt={2}>
                <AlertIcon />
                This batch still has {batch.quantity} items!
              </Alert>
            )}
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              ml={3}
              onClick={onDelete}
              isLoading={isLoading}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
