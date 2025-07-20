import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Stack,
  Spinner,
  Center,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiShoppingCart, FiClipboard, FiPlusCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  LabelList,
  XAxis,
} from "recharts";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { StatCard, TopItemsCard } from "./components";

export default function HomePage() {
  const cardBg = useColorModeValue("white", "gray.800");
  const weeklyOverviewBorderBg = useColorModeValue("gray.200", "gray.600");
  const navigate = useNavigate();
  const { data, isLoading, error } = useDashboardAnalytics();

  if (isLoading) {
    return (
      <Center minH="60vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error || !data) {
    return (
      <Center minH="60vh">
        <Text color="red.500">Failed to load statistics: {error}</Text>
      </Center>
    );
  }

  const {
    totalSales,
    transactionCount,
    lowStockCount,
    dailySales,
    totalSalesChangePercent,
    transactionCountChangePercent,
    trendDirection,
  } = data;

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <Heading size="lg" mb={1}>
        Welcome to your Sari-Sari POS
      </Heading>
      <Text color="gray.500" mb={6}>
        Here&apos;s your summary for today
      </Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <StatCard
          label="Total Sales"
          value={`₱${totalSales.toFixed(2)}`}
          icon={FiShoppingCart}
          trendData={dailySales}
          trend={trendDirection}
          change={`${totalSalesChangePercent.toFixed(2)}% from last week`}
          colorScheme="green"
        />
        <StatCard
          label="Transactions"
          value={transactionCount.toString()}
          icon={FiClipboard}
          trendData={dailySales.map((x) => (x > 0 ? 1 : 0))}
          trend={
            transactionCountChangePercent > 0
              ? "up"
              : transactionCountChangePercent < 0
                ? "down"
                : "flat"
          }
          change={`${transactionCountChangePercent.toFixed(2)}% from last week`}
          colorScheme="blue"
        />
        <StatCard
          label="Low Stock Items"
          value={lowStockCount.toString()}
          icon={FiPlusCircle}
          trendData={Array(7).fill(lowStockCount)}
          trend="down"
          colorScheme="orange"
        />
      </SimpleGrid>

      <Stack direction={{ base: "column", md: "row" }} spacing={4} mb={8}>
        <Button colorScheme="green" leftIcon={<FiPlusCircle />} shadow="md">
          Start New Sale
        </Button>
        <Button colorScheme="blue" leftIcon={<FiClipboard />} shadow="md">
          View Transactions
        </Button>
        <Button
          colorScheme="orange"
          leftIcon={<FiShoppingCart />} // using this icon for visual balance
          shadow="md"
          onClick={() => navigate("/inventory")}
        >
          Manage Inventory
        </Button>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 12 }} spacing={6}>
        <Box
          gridColumn={{ base: "1", md: "span 8" }}
          bg={cardBg}
          p={6}
          borderRadius="xl"
          shadow="md"
          borderWidth="1px"
          borderColor={weeklyOverviewBorderBg}
        >
          <Heading size="md" mb={4}>
            Weekly Sales Overview
          </Heading>
          <Box height="290px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailySales.map((val, i) => ({
                  name: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
                  value: val,
                }))}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <XAxis dataKey="name" />
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38B2AC" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#38B2AC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#38B2AC"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                >
                  <LabelList
                    dataKey="value"
                    position="top"
                    fill="#319795"
                    fontSize={12}
                  />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Box gridColumn={{ base: "1", md: "span 4" }}>
          <TopItemsCard />
        </Box>
      </SimpleGrid>
    </Box>
  );
}
