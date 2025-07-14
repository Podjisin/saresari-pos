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
  useColorModeValue,
  Icon,
  Flex,
  Badge,
} from "@chakra-ui/react";
import {
  FiShoppingCart,
  FiClipboard,
  FiPlusCircle,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

type StatCardProps = {
  label: string;
  value: string;
  icon: React.ElementType;
  trendData: number[];
  trend?: "up" | "down" | "neutral";
  change?: string;
};

const data = [
  { name: "Mon", value: 10 },
  { name: "Tue", value: 15 },
  { name: "Wed", value: 20 },
  { name: "Thu", value: 25 },
  { name: "Fri", value: 30 },
  { name: "Sat", value: 35 },
  { name: "Sun", value: 40 },
];

function StatCard({
  label,
  value,
  icon,
  trendData,
  trend = "neutral",
  change,
}: StatCardProps) {
  const bg = useColorModeValue("white", "gray.700");
  const border = useColorModeValue("gray.200", "gray.600");
  const trendColor =
    trend === "up" ? "green.400" : trend === "down" ? "red.400" : "gray.400";

  const chartData = trendData.map((val, i) => ({
    name: data[i].name,
    value: val,
  }));

  return (
    <Box
      p={4}
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="xl"
      shadow="md"
      position="relative"
      overflow="hidden"
    >
      {/* Background chart */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        height="40%"
        opacity={0.3}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <Area
              type="monotone"
              dataKey="value"
              stroke={trendColor}
              fill={trendColor}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>

      <Stat position="relative" zIndex={1}>
        <Flex justifyContent="space-between" alignItems="flex-start">
          <Box>
            <StatLabel color="gray.500" fontWeight="medium" fontSize="sm">
              {label}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" mt={1}>
              {value}
            </StatNumber>
            {change && (
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
          <Box
            p={2}
            bg={useColorModeValue(
              `${trendColor.replace(".400", ".100")}`,
              `${trendColor.replace(".400", ".900")}`,
            )}
            borderRadius="lg"
          >
            <Icon as={icon} boxSize={5} color={trendColor} />
          </Box>
        </Flex>
      </Stat>
    </Box>
  );
}

export default function Home() {
  const cardBg = useColorModeValue("white", "gray.800");
  const navigate = useNavigate();

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

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <StatCard
          label="Total Sales"
          value="$1,230"
          icon={FiShoppingCart}
          trendData={[200, 400, 600, 800, 1000, 1200, 1230]}
          trend="up"
          change="12% from yesterday"
        />
        <StatCard
          label="Transactions"
          value="16"
          icon={FiClipboard}
          trendData={[5, 8, 10, 12, 14, 15, 16]}
          trend="neutral"
        />
        <StatCard
          label="Low Stock Items"
          value="3"
          icon={FiPlusCircle}
          trendData={[8, 6, 10, 4, 4, 3, 3]}
          trend="down"
          change="5% from yesterday"
        />
      </SimpleGrid>

      {/* Quick Actions */}
      <Stack direction={{ base: "column", md: "row" }} spacing={4} mb={8}>
        <Button
          colorScheme="green"
          leftIcon={<FiPlusCircle />}
          size="lg"
          flex={1}
          shadow="md"
        >
          Start New Sale
        </Button>
        <Button
          colorScheme="blue"
          leftIcon={<FiClipboard />}
          size="lg"
          flex={1}
          shadow="md"
        >
          View Transactions
        </Button>
        <Button
          colorScheme="orange"
          leftIcon={<FiShoppingCart />}
          size="lg"
          flex={1}
          shadow="md"
          onClick={() => {
            navigate("/inventory");
          }}
        >
          Manage Inventory
        </Button>
      </Stack>

      {/* Additional content can go here */}
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
            <AreaChart data={data}>
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
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
}
