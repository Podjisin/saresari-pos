import {
  Stack,
  InputGroup,
  Input,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { FiMaximize2 } from "react-icons/fi";

export interface ManualPaneProps {
  manual: string;
  setManual: (val: string) => void;
  submitManual: () => void;
}

export function ManualPane({
  manual,
  setManual,
  submitManual,
}: ManualPaneProps) {
  return (
    <Stack spacing={4}>
      <InputGroup>
        <Input
          placeholder="Barcode"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitManual()}
          autoFocus
        />
        <InputRightElement>
          <IconButton
            aria-label="Switch"
            icon={<FiMaximize2 />}
            size="sm"
            variant="ghost"
            onClick={submitManual}
          />
        </InputRightElement>
      </InputGroup>
    </Stack>
  );
}
