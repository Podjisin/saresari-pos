import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@chakra-ui/react";
import InventoryList from "./InventoryList";
import InventoryHistory from "./InventoryHistory";

export default function Inventory() {
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
