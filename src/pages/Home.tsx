import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Button,
  Stack,
  Icon,
  Flex,
  Badge,
  Spinner,
  Center,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiShoppingCart,
  FiClipboard,
  FiPlusCircle,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, LabelList } from "recharts";
import { useStatistics } from "../hooks/useStatistics";

// Props for individual statistic cards
type StatCardProps = {
  label: string;
  value: string;
  icon: React.ElementType;
  trendData: number[];
  trend?: "up" | "down" | "flat";
  change?: string;
  colorScheme?: string;
};

function StatCard({
  label,
  value,
  icon,
  trendData,
  trend = "flat",
  change,
  colorScheme = "gray",
}: StatCardProps) {
  const bgColor = useColorModeValue(`${colorScheme}.100`, `${colorScheme}.700`);
  const textColor = useColorModeValue(
    `${colorScheme}.800`,
    `${colorScheme}.100`,
  );
  const iconBg = useColorModeValue(`${colorScheme}.200`, `${colorScheme}.600`);
  const iconColor = useColorModeValue(
    `${colorScheme}.600`,
    `${colorScheme}.200`,
  );

  const chartData = trendData.map((val, i) => ({
    name: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
    value: val,
  }));

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="xl"
      shadow="md"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        height="40%"
        opacity={0.2}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <Area
              type="monotone"
              dataKey="value"
              stroke={iconColor}
              fill={iconColor}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>

      <Stat position="relative" zIndex={1} color={textColor}>
        <Flex justifyContent="space-between" alignItems="flex-start">
          <Box>
            <StatLabel fontWeight="medium" fontSize="sm">
              {label}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" mt={1}>
              {value}
            </StatNumber>
            {change && trend !== "flat" && (
              <Badge
                colorScheme={trend === "up" ? "green" : "red"}
                fontSize="xs"
                mt={1}
                display="flex"
                alignItems="center"
                gap={1}
              >
                {trend === "up" ? (
                  <FiTrendingUp size={12} />
                ) : (
                  <FiTrendingDown size={12} />
                )}
                {change}
              </Badge>
            )}
          </Box>
          <Box p={2} bg={iconBg} borderRadius="lg">
            <Icon as={icon} boxSize={5} color={iconColor} />
          </Box>
        </Flex>
      </Stat>
    </Box>
  );
}

export default function Home() {
  const cardBg = useColorModeValue("white", "gray.800");
  const navigate = useNavigate();
  const { data, isLoading, error } = useStatistics();

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
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Box>
          <Heading size="lg">Welcome to your Sari-Sari POS</Heading>
          <Text color="gray.500" mt={1}>
            Here&apos;s your summary for today
          </Text>
        </Box>
        <Badge colorScheme="green" px={3} py={1} borderRadius="full">
          Live Data
        </Badge>
      </Flex>

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

      <Box
        bg={cardBg}
        p={6}
        borderRadius="xl"
        shadow="md"
        borderWidth="1px"
        borderColor={useColorModeValue("gray.200", "gray.600")}
      >
        <Heading size="md" mb={4}>
          Weekly Sales Overview
        </Heading>
        <Box height="300px">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailySales.map((val, i) => ({
                name: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
                value: val,
              }))}
            >
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
    </Box>
  );
}
