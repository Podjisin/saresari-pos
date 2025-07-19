import {
  HStack,
  Button,
  IconButton,
  Text,
  Select,
  Box,
} from "@chakra-ui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@chakra-ui/icons";
import { useState } from "react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  siblingCount?: number;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize: propPageSize,
  onPageSizeChange,
  siblingCount = 1,
}: PaginationProps) => {
  const [internalPageSize, setInternalPageSize] = useState(5); // Default fallback
  const [pageSizeOptions] = useState([5, 10, 20, 50, 100]);

  const activePageSize = propPageSize ?? internalPageSize;

  const handlePageSizeChange = (size: number) => {
    setInternalPageSize(size);
    if (onPageSizeChange) {
      onPageSizeChange(size);
    }
  };

  // Don't render if there's only 1 page and no page size selector
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  const getPageNumbers = () => {
    const totalPageNumbers = siblingCount + 5;

    if (totalPages <= totalPageNumbers) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return [];
  };

  const handlePrevious = () => currentPage > 1 && onPageChange(currentPage - 1);
  const handleNext = () =>
    currentPage < totalPages && onPageChange(currentPage + 1);

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      width="100%"
      p={4}
      flexWrap="wrap"
      gap={4}
    >
      {totalPages > 1 && (
        <HStack spacing={2}>
          <IconButton
            aria-label="First page"
            icon={<ArrowLeftIcon />}
            onClick={() => onPageChange(1)}
            isDisabled={currentPage === 1}
            size="sm"
            variant="ghost"
          />
          <IconButton
            aria-label="Previous page"
            icon={<ChevronLeftIcon />}
            onClick={handlePrevious}
            isDisabled={currentPage === 1}
            size="sm"
            variant="ghost"
          />

          {getPageNumbers().map((page, index) =>
            typeof page === "number" ? (
              <Button
                key={page}
                size="sm"
                variant={currentPage === page ? "solid" : "outline"}
                colorScheme="blue"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ) : (
              <Text key={`dots-${index}`} mx={1}>
                ...
              </Text>
            ),
          )}

          <IconButton
            aria-label="Next page"
            icon={<ChevronRightIcon />}
            onClick={handleNext}
            isDisabled={currentPage === totalPages}
            size="sm"
            variant="ghost"
          />
          <IconButton
            aria-label="Last page"
            icon={<ArrowRightIcon />}
            onClick={() => onPageChange(totalPages)}
            isDisabled={currentPage === totalPages}
            size="sm"
            variant="ghost"
          />
        </HStack>
      )}

      {onPageSizeChange && (
        <HStack spacing={2}>
          <Text fontSize="sm" whiteSpace="nowrap">
            Rows per page:
          </Text>
          <Select
            size="sm"
            width="90px"
            value={activePageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            variant="outline"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </HStack>
      )}
    </Box>
  );
};
