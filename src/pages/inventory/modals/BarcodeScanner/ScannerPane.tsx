import { Box, Select, Stack, Text } from "@chakra-ui/react";

export interface ScannerPaneProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  devices: MediaDeviceInfo[];
  deviceId: string;
  setDeviceId: (id: string) => void;
  scanning: boolean;
  error: string | null;
}

export function ScannerPane({
  videoRef,
  devices,
  deviceId,
  setDeviceId,
  scanning,
  error,
}: ScannerPaneProps) {
  return (
    <Stack spacing={4}>
      {devices.length > 0 && (
        <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Camera ${d.deviceId.slice(-4)}`}
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
        </Stack>
      )}
      {error && <Text color="red.500">{error}</Text>}
    </Stack>
  );
}
