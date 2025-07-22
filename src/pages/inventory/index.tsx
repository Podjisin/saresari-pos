import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@chakra-ui/react";
import { InventoryList, InventoryHistory } from "./tabs";

/**
 * Displays a tabbed interface for viewing the inventory list and inventory history.
 *
 * Renders two tabs: one for the inventory list and another for inventory history, allowing users to switch between these views.
 */
export default function InventoryPage() {
  return (
    <Tabs variant="soft-rounded" colorScheme="blue" size="md" mt={4} px={0}>
      <TabList>
        <Tab>Inventory List</Tab>
        <Tab>History</Tab>
      </TabList>

      <TabPanels>
        <TabPanel px={0}>
          <InventoryList />
        </TabPanel>
        <TabPanel px={0}>
          <InventoryHistory />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
