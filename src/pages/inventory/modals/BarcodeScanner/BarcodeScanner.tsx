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
import { useBarcodeScanner } from "@/hooks/inventory/useBarcodeScanner";
import { ScannerPane } from "./ScannerPane";
import { ManualPane } from "./ManualPane";

export interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (barcode: string) => void;
}

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
              onClick={submitManual}
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
