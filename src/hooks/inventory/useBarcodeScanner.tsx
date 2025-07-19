import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import {
  DecodeHintType,
  BarcodeFormat,
  Result,
  Exception,
} from "@zxing/library";
import { useToast, UseToastOptions, ToastId } from "@chakra-ui/react";

type ManualState = {
  mode: "scan" | "manual";
  value: string;
  setMode: (m: "scan" | "manual") => void;
  setValue: (v: string) => void;
};

export function useBarcodeScanner(
  onScanComplete: (barcode: string) => void,
  toast: (options: UseToastOptions) => ToastId | undefined = useToast(),
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
  const [supportsTorch, setSupportsTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [manual, setManualState] = useState<ManualState>({
    mode: "scan",
    value: "",
    setMode: (m) => setManualState((ms) => ({ ...ms, mode: m })),
    setValue: (v) => setManualState((ms) => ({ ...ms, value: v })),
  });

  const listDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const cams = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(cams);
      if (!deviceId && cams.length) setDeviceId(cams[0].deviceId);
    } catch (e) {
      setError((e as Error).message);
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
          } else if (err && err.name !== "NotFoundException") {
            setError(err.message);
          }
        },
      );
      setSupportsTorch(typeof controls.switchTorch === "function");
    } catch (e) {
      setScanning(false);
      setError((e as Error).message);
    }
  };

  const stopScan = () => {
    controlsRef.current?.stop();
    setScanning(false);
    setTorchOn(false);
  };

  const toggleTorch = () => {
    if (!controlsRef.current?.switchTorch) return;
    controlsRef.current.switchTorch(!torchOn);
    setTorchOn((prev) => !prev);
  };

  const submitManual = () => {
    const text = manual.value.trim();
    if (text) onScanComplete(text);
    else
      toast({
        title: "Invalid barcode",
        description: "Enter a valid code",
        status: "error",
        duration: 3000,
      });
  };

  const reset = () => {
    stopScan();
    setError(null);
    setManualState((ms) => ({ ...ms, mode: "scan", value: "" }));
  };

  useEffect(() => {
    listDevices();
  }, []);
  useEffect(() => {
    if (manual.mode === "scan") startScan();
    return stopScan;
  }, [deviceId, manual.mode]);

  return {
    videoRef,
    devices,
    deviceId,
    setDeviceId,
    scanning,
    supportsTorch,
    torchOn,
    toggleTorch,
    error,
    manual,
    setManual: manual.setValue,
    submitManual,
    reset,
  };
}
