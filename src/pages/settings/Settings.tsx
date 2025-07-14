import {
  Box,
  Heading,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Button,
  useToast,
  Text,
  Select,
  NumberInput,
  NumberInputField,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  SimpleGrid,
  Textarea,
  Tag,
  TagCloseButton,
  TagLabel,
  HStack,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useSettings } from "../../hooks/useSettings";

export default function Settings() {
  const {
    getSetting,
    setSetting,
    resetSetting,
    getPaginationConfig,
    isLoading,
    error,
    resetError,
    isInitializing,
  } = useSettings();
  const toast = useToast();

  // Form states
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [theme, setTheme] = useState("light");
  const [paginationEnabled, setPaginationEnabled] = useState(true);
  const [defaultPageSize, setDefaultPageSize] = useState(20);
  const [pageSizeOptions, setPageSizeOptions] = useState<number[]>([]);
  const [newPageSizeOption, setNewPageSizeOption] = useState("");
  const [rememberPerView, setRememberPerView] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (!isInitializing) {
      loadSettings();
    }
  }, [isInitializing]);

  const loadSettings = async () => {
    try {
      const [name, address, footer, themePref, paginationConfig] =
        await Promise.all([
          getSetting<string>("shop_name"),
          getSetting<string>("shop_address"),
          getSetting<string>("receipt_footer"),
          getSetting<string>("theme"),
          getPaginationConfig(),
        ]);

      setShopName(name);
      setShopAddress(address);
      setReceiptFooter(footer);
      setTheme(themePref);
      setPaginationEnabled(paginationConfig.enabled);
      setDefaultPageSize(paginationConfig.defaultSize);
      setPageSizeOptions(paginationConfig.options);
      setRememberPerView(paginationConfig.rememberPerView);
    } catch (err) {
      console.error("Failed to load settings:", err);
      toast({
        title: "Failed to load settings",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleAddPageSizeOption = () => {
    const size = parseInt(newPageSizeOption);
    if (!isNaN(size) && size > 0 && !pageSizeOptions.includes(size)) {
      setPageSizeOptions([...pageSizeOptions, size].sort((a, b) => a - b));
      setNewPageSizeOption("");
    }
  };

  const handleRemovePageSizeOption = (sizeToRemove: number) => {
    setPageSizeOptions(pageSizeOptions.filter((size) => size !== sizeToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First validate that default page size is in the options
      if (paginationEnabled && !pageSizeOptions.includes(defaultPageSize)) {
        throw new Error(
          "Default page size must be one of the available options",
        );
      }

      await Promise.all([
        setSetting("shop_name", shopName),
        setSetting("shop_address", shopAddress),
        setSetting("receipt_footer", receiptFooter),
        setSetting("theme", theme),
        setSetting("pagination_enabled", paginationEnabled),
        setSetting("default_page_size", defaultPageSize),
        setSetting("page_size_options", pageSizeOptions),
        setSetting("remember_page_size", rememberPerView),
      ]);

      toast({
        title: "Settings saved",
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast({
        title: "Failed to save settings",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async (key: string) => {
    try {
      await resetSetting(key);
      toast({
        title: "Setting reset",
        description: `${key} has been reset to default`,
        status: "success",
        duration: 3000,
      });
      await loadSettings(); // Refresh all settings
    } catch (err) {
      console.error("Failed to reset setting:", err);
      toast({
        title: "Failed to reset setting",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    }
  };

  if (isInitializing) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading settings...</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>
        Application Settings
      </Heading>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
          <Button ml="auto" size="sm" onClick={resetError}>
            Dismiss
          </Button>
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Shop Information */}
        <Box
          borderWidth="1px"
          borderRadius="lg"
          p={4}
          bg="white"
          _dark={{ bg: "gray.800" }}
        >
          <Heading size="md" mb={4}>
            Shop Information
          </Heading>

          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Shop Name</FormLabel>
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Enter shop name"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Shop Address</FormLabel>
              <Input
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Enter shop address"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Receipt Footer Message</FormLabel>
              <Textarea
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Thank you for shopping with us!"
              />
            </FormControl>
          </Stack>
        </Box>

        {/* UI Preferences */}
        <Box
          borderWidth="1px"
          borderRadius="lg"
          p={4}
          bg="white"
          _dark={{ bg: "gray.800" }}
        >
          <Heading size="md" mb={4}>
            UI Preferences
          </Heading>

          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Theme</FormLabel>
              <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </Select>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <Switch
                id="pagination-enabled"
                isChecked={paginationEnabled}
                onChange={(e) => setPaginationEnabled(e.target.checked)}
                mr={3}
              />
              <FormLabel htmlFor="pagination-enabled" mb="0">
                Enable Pagination
              </FormLabel>
            </FormControl>

            {paginationEnabled && (
              <>
                <FormControl>
                  <FormLabel>Default Page Size</FormLabel>
                  <Select
                    value={defaultPageSize}
                    onChange={(e) => setDefaultPageSize(Number(e.target.value))}
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Page Size Options</FormLabel>
                  <HStack spacing={2} mb={2} wrap="wrap">
                    {pageSizeOptions.map((size) => (
                      <Tag
                        key={size}
                        size="lg"
                        variant="subtle"
                        colorScheme="blue"
                      >
                        <TagLabel>{size}</TagLabel>
                        {pageSizeOptions.length > 1 && (
                          <TagCloseButton
                            onClick={() => handleRemovePageSizeOption(size)}
                          />
                        )}
                      </Tag>
                    ))}
                  </HStack>
                  <HStack>
                    <NumberInput
                      value={newPageSizeOption}
                      onChange={(value) => setNewPageSizeOption(value)}
                      min={1}
                      max={200}
                      width="100px"
                    >
                      <NumberInputField placeholder="Add size" />
                    </NumberInput>
                    <Button
                      onClick={handleAddPageSizeOption}
                      isDisabled={!newPageSizeOption}
                    >
                      Add
                    </Button>
                  </HStack>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <Switch
                    id="remember-per-view"
                    isChecked={rememberPerView}
                    onChange={(e) => setRememberPerView(e.target.checked)}
                    mr={3}
                  />
                  <FormLabel htmlFor="remember-per-view" mb="0">
                    Remember Page Size Per View
                  </FormLabel>
                </FormControl>
              </>
            )}
          </Stack>
        </Box>
      </SimpleGrid>

      <Divider my={6} />

      <Stack direction="row" spacing={4} justifyContent="flex-end" mt={6}>
        <Button
          colorScheme="red"
          variant="outline"
          onClick={() => handleReset("shop_name")}
          isLoading={isLoading}
        >
          Reset Shop Info
        </Button>
        <Button
          colorScheme="red"
          variant="outline"
          onClick={() => handleReset("theme")}
          isLoading={isLoading}
        >
          Reset UI Settings
        </Button>
        <Button
          colorScheme="blue"
          onClick={handleSave}
          isLoading={isSaving || isLoading}
          loadingText="Saving..."
        >
          Save All Settings
        </Button>
      </Stack>
    </Box>
  );
}
