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
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import { useBarcodeScanner } from "@/pages/inventory/modals/BarcodeScanner/hooks/useBarcodeScanner";
import { ScannerPane } from "./ScannerPane";
import { ManualPane } from "./ManualPane";

export interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (barcode: string) => void;
}

/**
 * Displays a modal dialog for barcode scanning, allowing users to scan via camera or enter a barcode manually.
 *
 * When opened, users can switch between scanning with a camera or manual input. On successful scan or manual submission, the provided callback is invoked with the scanned barcode value, and the modal closes.
 */
export function BarcodeScanner({
  isOpen,
  onClose,
  onScanComplete,
}: BarcodeScannerProps) {
  const toast = useToast();
  const {
    videoRef,
    devices,
    deviceId,
    setDeviceId,
    scanning,
    error,
    manual,
    submitManual,
    reset,
  } = useBarcodeScanner(onScanComplete, toast);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Barcode Scanner</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs
            index={manual.mode === "scan" ? 0 : 1}
            onChange={(i) => {
              const newMode = i === 0 ? "scan" : "manual";
              if (manual.mode !== newMode) manual.setMode(newMode);
            }}
          >
            <TabList>
              <Tab>Scan</Tab>
              <Tab>Manual</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <ScannerPane
                  videoRef={videoRef}
                  devices={devices}
                  deviceId={deviceId}
                  setDeviceId={setDeviceId}
                  scanning={scanning}
                  error={error}
                />
              </TabPanel>
              <TabPanel>
                <ManualPane
                  manual={manual.value}
                  setManual={manual.setValue}
                  submitManual={submitManual}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            mr={3}
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          {manual.mode === "manual" && (
            <Button
              colorScheme="blue"
              onClick={() => {
                submitManual();
                reset();
                onClose();
              }}
              isDisabled={!manual.value.trim()}
            >
              Submit
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
