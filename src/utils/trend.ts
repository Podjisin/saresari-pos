export const determineTrendDirection = (
  dailySales: number[],
): "up" | "down" | "flat" => {
  if (dailySales.length < 5) {
    return "flat";
  }

  const midpoint = Math.floor(dailySales.length / 2);
  const firstHalf = dailySales.slice(0, midpoint).reduce((a, b) => a + b, 0);
  const secondHalf = dailySales.slice(midpoint).reduce((a, b) => a + b, 0);

  if (secondHalf > firstHalf) return "up";
  if (secondHalf < firstHalf) return "down";
  return "flat";
};
