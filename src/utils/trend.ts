export const determineTrendDirection = (
  dailySales: number[],
): "up" | "down" | "flat" => {
  const firstHalf = dailySales.slice(0, 3).reduce((a, b) => a + b, 0);
  const secondHalf = dailySales.slice(4).reduce((a, b) => a + b, 0);

  if (secondHalf > firstHalf) return "up";
  if (secondHalf < firstHalf) return "down";
  return "flat";
};
