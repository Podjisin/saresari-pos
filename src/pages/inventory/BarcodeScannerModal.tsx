import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import {
  DecodeHintType,
  BarcodeFormat,
  Result,
  Exception,
} from "@zxing/library";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Text,
  useToast,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Tabs,
  IconButton,
  Select,
} from "@chakra-ui/react";
import { FiMaximize2 } from "react-icons/fi";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (barcode: string) => void;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanComplete,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>();
  const [scanning, setScanning] = useState(false);
  const [supportsTorch, setSupportsTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [tab, setTab] = useState<"scan" | "manual">("scan");
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const codeReader = useRef(
    new BrowserMultiFormatReader(
      new Map<DecodeHintType, unknown>([
        [
          DecodeHintType.POSSIBLE_FORMATS,
          [
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.ITF,
            BarcodeFormat.QR_CODE,
          ],
        ],
        [DecodeHintType.TRY_HARDER, true],
      ]),
    ),
  );

  const controlsRef = useRef<IScannerControls | null>(null);

  const listDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const cams = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(cams);
      if (!deviceId && cams.length) {
        setDeviceId(cams[0].deviceId);
      }
    } catch (e) {
      const error = e as Error;
      setError(error.message);
    }
  };

  const startScan = async () => {
    if (!deviceId || !videoRef.current) return;
    setError(null);
    setScanning(true);
    try {
      const controls = await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result: Result | undefined, err: Exception | undefined, ctrls) => {
          if (ctrls) controlsRef.current = ctrls;
          if (result) {
            onScanComplete(result.getText());
            stopScan();
            onClose();
          } else if (err && err.name !== "NotFoundException") {
            setError(err.message);
          }
        },
      );
      // detect torch support
      setSupportsTorch(typeof controls.switchTorch === "function");
    } catch (e: unknown) {
      setScanning(false);
      const error = e as Error;
      setError(error.message);
    }
  };

  const stopScan = () => {
    controlsRef.current?.stop();
    setScanning(false);
    setTorchOn(false);
  };

  const toggleTorch = () => {
    if (
      !controlsRef.current ||
      typeof controlsRef.current.switchTorch !== "function"
    ) {
      return;
    }
    try {
      controlsRef.current.switchTorch(!torchOn);
      setTorchOn((prev) => !prev);
    } catch (e) {
      console.error("Torch toggle failed", e);
    }
  };

  const submitManual = () => {
    const text = manual.trim();
    if (text) {
      onScanComplete(text);
      onClose();
    } else {
      toast({
        title: "Invalid barcode",
        description: "Enter a valid code",
        status: "error",
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    if (isOpen) listDevices();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && tab === "scan") startScan();
    return () => stopScan();
  }, [isOpen, deviceId, tab]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopScan();
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
            index={tab === "scan" ? 0 : 1}
            onChange={(i) => {
              setTab(i === 0 ? "scan" : "manual");
              setError(null);
            }}
          >
            <TabList>
              <Tab>Scan</Tab>
              <Tab>Manual</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Stack spacing={4}>
                  {devices.length > 0 && (
                    <Select
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                    >
                      {devices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || d.deviceId}
                        </option>
                      ))}
                    </Select>
                  )}
                  <Box
                    as="video"
                    ref={videoRef}
                    w="100%"
                    h="300px"
                    bg="black"
                    rounded="md"
                    autoPlay
                    playsInline
                    muted
                    border={scanning ? "3px solid green" : undefined}
                  />
                  {scanning && (
                    <Stack direction="row" justify="space-between">
                      <Text color="gray.500">Scanning...</Text>
                      {supportsTorch && (
                        <Button size="sm" onClick={toggleTorch}>
                          {torchOn ? "Flash Off" : "Flash On"}
                        </Button>
                      )}
                    </Stack>
                  )}
                  {error && <Text color="red.500">{error}</Text>}
                </Stack>
              </TabPanel>
              <TabPanel>
                <Stack spacing={4}>
                  <InputGroup>
                    <Input
                      placeholder="Barcode"
                      value={manual}
                      onChange={(e) => setManual(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && submitManual()}
                      autoFocus
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label="Switch"
                        icon={<FiMaximize2 />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setTab("scan")}
                      />
                    </InputRightElement>
                  </InputGroup>
                </Stack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            mr={3}
            onClick={() => {
              stopScan();
              onClose();
            }}
          >
            Cancel
          </Button>
          {tab === "manual" && (
            <Button
              colorScheme="blue"
              onClick={submitManual}
              isDisabled={!manual.trim()}
            >
              Submit
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
