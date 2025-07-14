/**
 * Generates a default batch number based on product name and optional date
 * @param productName - The name of the product
 * @param date - Optional date to use (defaults to current date)
 * @returns Generated batch number string
 */
export const generateDefaultBatchNumber = (
  productName: string,
  date: Date = new Date(),
): string => {
  // Format date as YYYYMMDD
  const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, "");

  // Get first letters of first 3 words (or all letters if fewer than 3 words)
  const initials = productName
    .split(" ")
    .filter((word) => word.length > 0) // Filter out empty strings
    .map((word) => word[0].toUpperCase())
    .join("")
    .slice(0, 3)
    .padEnd(3, "X"); // Pad with X if less than 3 characters

  return `BATCH-${initials}-${formattedDate}`;
};

/**
 * Generates a batch number with product ID and timestamp
 * Alternative format if needed
 */
export const generateBatchNumberWithId = (productId: number): string => {
  const timestamp = Date.now().toString().slice(-6);
  return `BATCH-${productId}-${timestamp}`;
};
