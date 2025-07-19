import { Box, Select, Stack, Text, Button } from "@chakra-ui/react";

export interface ScannerPaneProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  devices: MediaDeviceInfo[];
  deviceId: string;
  setDeviceId: (id: string) => void;
  scanning: boolean;
  supportsTorch: boolean;
  torchOn: boolean;
  toggleTorch: () => void;
  error: string | null;
}

export function ScannerPane({
  videoRef,
  devices,
  deviceId,
  setDeviceId,
  scanning,
  supportsTorch,
  torchOn,
  toggleTorch,
  error,
}: ScannerPaneProps) {
  return (
    <Stack spacing={4}>
      {devices.length > 0 && (
        <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
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
  );
}
