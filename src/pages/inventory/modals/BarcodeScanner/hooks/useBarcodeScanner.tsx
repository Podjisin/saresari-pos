import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import {
  DecodeHintType,
  BarcodeFormat,
  Result,
  Exception,
} from "@zxing/library";
import { useToast } from "@chakra-ui/react";
import { delay } from "@/utils/delay";

type ManualState = {
  mode: "scan" | "manual";
  value: string;
  setMode: (m: "scan" | "manual") => void;
  setValue: (v: string) => void;
};

/**
 * React hook that manages barcode scanning via device camera or manual input, including device selection, scanning state, error handling, and integration with Chakra UI toast notifications.
 *
 * Invokes the provided callback when a barcode is successfully scanned or manually entered. Exposes references, state, and functions for controlling scanning and manual entry.
 *
 * @param onScanComplete - Callback called with the scanned or manually entered barcode string.
 * @returns An object with video element reference, available devices, selected device ID and setter, scanning state, error message, manual entry state and setter, manual submission, and reset functionality.
 */
export function useBarcodeScanner(
  onScanComplete: (barcode: string) => void,
  toast: ReturnType<typeof useToast>,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
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

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [scanning, setScanning] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [manualMode, setManualMode] = useState<"scan" | "manual">("scan");
  const [manualValue, setManualValue] = useState("");

  const manual: ManualState = {
    mode: manualMode,
    value: manualValue,
    setMode: setManualMode,
    setValue: setManualValue,
  };

  const listDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const cams = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(cams);
      if (cams.length && !cams.find((c) => c.deviceId === deviceId)) {
        setDeviceId(cams[0].deviceId);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const stopScan = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (controlsRef.current) {
      controlsRef.current.stop();
    }
    setScanning(false);
  }, []);

  const startScan = useCallback(async () => {
    if (!deviceId || !videoRef.current || scanning) return;

    await delay({ ms: 5000 }); // Ensure video is ready
    stopScan();

    setError(null);
    setScanning(true);
    try {
      await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result: Result | undefined, err: Exception | undefined, ctrls) => {
          if (ctrls) controlsRef.current = ctrls;
          if (result) {
            onScanComplete(result.getText());
            stopScan();
          } else if (err && err.name !== "NotFoundException") {
            setError(err.message);
          }
        },
      );
    } catch (e) {
      setScanning(false);
      setError((e as Error).message);
    }
  }, [deviceId, scanning, onScanComplete, stopScan]);

  const submitManual = () => {
    const text = manual.value.trim();
    if (!text) {
      toast({
        title: "Invalid barcode",
        description: "Enter a valid code",
        status: "error",
        duration: 3000,
      });
      return;
    }

    onScanComplete(text);
  };

  const reset = useCallback(() => {
    stopScan();
    setError(null);
    setManualMode("scan");
    setManualValue("");
  }, [stopScan]);

  useEffect(() => {
    listDevices();
  }, []);

  useEffect(() => {
    if (!scanning && manual.mode === "scan") startScan();
    return stopScan;
  }, [deviceId, manual.mode, startScan, stopScan]);

  return {
    videoRef,
    devices,
    deviceId,
    setDeviceId,
    scanning,
    error,
    manual,
    setManual: manual.setValue,
    submitManual,
    reset,
  };
}
