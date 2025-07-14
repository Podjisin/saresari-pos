// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect, useState } from "react";
import {
  Flex,
  IconButton,
  useColorModeValue,
  Spacer,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { HamburgerIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";

type Props = { onOpen: () => void };

export default function Header({ onOpen }: Props) {
  const bg = useColorModeValue("white", "gray.800");
  const [currentTime, setCurrentTime] = useState(new Date());
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval); // Clean up on unmount
  }, []);

  const formattedTime = new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(currentTime);

  return (
    <Flex
      as="header"
      position="fixed"
      top="0"
      left="0"
      right="0"
      height="4rem"
      align="center"
      px="4"
      bg={bg}
      borderBottom="1px"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      zIndex="sticky"
      style={{ height: "var(--header-height)" }}
    >
      <IconButton
        icon={<HamburgerIcon />}
        aria-label="Open Menu"
        variant="ghost"
        onClick={onOpen}
        display={{ base: "inline-flex", md: "none" }}
      />
      <Spacer />
      <Text fontSize="sm" color="gray.500" mr={4}>
        {formattedTime}
      </Text>
      <IconButton
        padding={2}
        aria-label="Toggle dark mode"
        icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
        onClick={toggleColorMode}
        variant="ghost"
      />
    </Flex>
  );
}
