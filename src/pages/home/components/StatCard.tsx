import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  Badge,
  Icon,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

export type StatCardProps = {
  label: string;
  value: string;
  icon: React.ElementType;
  trendData: number[];
  trend?: "up" | "down" | "flat";
  change?: string;
  colorScheme?: string;
};

export function StatCard({
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

  if (trendData.length !== 7) {
    console.warn(
      `[StatCard]: Trend data should have exactly 7 values, got ${trendData.length}`,
    );
  }

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
