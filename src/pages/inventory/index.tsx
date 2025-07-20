import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@chakra-ui/react";
import InventoryListTab from "./tabs/List/InventoryListTab";
import InventoryHistory from "./tabs/History";

/**
 * Renders the inventory management page with tabs for viewing the inventory list and history.
 *
 * Displays a tabbed interface allowing users to switch between the current inventory and its change history.
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
          <InventoryListTab />
        </TabPanel>
        <TabPanel px={0}>
          <InventoryHistory />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
