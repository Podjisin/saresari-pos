import {
  Box,
  VStack,
  Button,
  CloseButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { navItems, NavItem } from "../../nav";

export type SidebarProps = {
  onClose: () => void;
  display?:
    | "block"
    | "flex"
    | "none"
    | "inline"
    | "inline-block"
    | Record<string, string>;
};
export const SidebarComponent = ({ onClose, display }: SidebarProps) => {
  const bg = useColorModeValue("white", "gray.800");
  const navigate = useNavigate();

  return (
    <Box
      bg={bg}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
      display={display}
      borderRight="1px"
      borderColor="gray.200"
    >
      <VStack align="start" p="5" spacing="4" pt="4rem">
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
        {navItems.map((item: NavItem) => (
          <Button
            key={item.name}
            w="full"
            justifyContent="start"
            variant="ghost"
            leftIcon={<item.icon size={18} />}
            colorScheme={"green"}
            onClick={() => {
              navigate(item.path);
              onClose(); // closes drawer on mobile
            }}
          >
            {item.name}
          </Button>
        ))}
      </VStack>
    </Box>
  );
};
