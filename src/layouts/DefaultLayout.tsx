import React, { ReactNode, useEffect } from "react";
import {
  Box,
  Drawer,
  DrawerContent,
  useDisclosure,
  useColorModeValue,
  DrawerOverlay,
  useBreakpointValue,
} from "@chakra-ui/react";
import SidebarContent from "./SidebarContent";
import Header from "./Header";

type Props = { children: ReactNode };

export default function DefaultLayout({ children }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bg = useColorModeValue("gray.50", "gray.900");
  const isDesktop = useBreakpointValue({ base: false, md: true });

  useEffect(() => {
    if (isDesktop && isOpen) {
      onClose();
    }
  }, [isDesktop, isOpen, onClose]);

  return (
    <Box minH="100vh" bg={bg}>
      {/* Header (fixed) */}
      <Header onOpen={onOpen} />

      {/* Desktop sidebar (fixed) */}
      <Box
        as="nav"
        display={{ base: "none", md: "block" }}
        position="fixed"
        left="0"
        top="var(--header-height)"
        w="60"
        h={`calc(100vh - var(--header-height))`}
        overflowY="auto"
        bg={bg}
        borderRightWidth="1px"
      >
        <SidebarContent onClose={onClose} />
      </Box>

      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent mt="var(--header-height)" border="none">
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <br />
      <Box
        ml={{ base: 0, md: 60 }}
        pt="var(--header-height)"
        p="4"
        transition="margin-left 0.2s ease"
      >
        {children}
      </Box>
    </Box>
  );
}
