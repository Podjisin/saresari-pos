# Pagination Component

## Overview

The `Pagination` component is a reusable UI element built with Chakra UI that provides paginated navigation and optional page size selection for datasets split across multiple pages. It supports:

- Navigation buttons (first, previous, numbered, next, last)
- Ellipsis for compact pagination
- Customizable sibling count (number of page buttons shown adjacent to the current page)
- Dynamic page size selection and persistence via a settings hook

---

## Props

### Required Props

| Name           | Type                     | Description                                        |
| -------------- | ------------------------ | -------------------------------------------------- |
| `currentPage`  | `number`                 | The currently active page (1-based index).         |
| `totalPages`   | `number`                 | Total number of pages available.                   |
| `onPageChange` | `(page: number) => void` | Callback triggered when a page number is selected. |

### Optional Props

| Name               | Type                     | Description                                                                         |
| ------------------ | ------------------------ | ----------------------------------------------------------------------------------- |
| `pageSize`         | `number`                 | Current page size. If omitted, uses internal or stored settings.                    |
| `onPageSizeChange` | `(size: number) => void` | Callback triggered when page size changes. Enables the page size dropdown.          |
| `siblingCount`     | `number`                 | Number of page buttons to show on either side of the current page. Defaults to `1`. |
| `viewKey`          | `string`                 | Optional key to remember page size per view context.                                |

---

## Features

### Page Navigation

- Navigation includes first, previous, specific page numbers, next, and last buttons.
- Ellipses (`...`) are used to condense long lists of pages.
- Uses sibling count to determine how many pages are visible around the current page.

### Page Size Selection

- When `onPageSizeChange` is provided, a dropdown appears with selectable page sizes.
- Supported sizes are fetched from settings via `useSettings().getPaginationConfig()`.
- If `viewKey` is provided, page size is saved and loaded based on view context.

### Dynamic Initialization

- On mount, the component initializes available page sizes and current size using `useSettings()`.
- If fetching settings fails, a warning toast is shown.

---

## Usage Example

```tsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={(newPage) => setPage(newPage)}
  pageSize={pageSize}
  onPageSizeChange={(newSize) => setPageSize(newSize)}
  siblingCount={1}
  viewKey="userList"
/>
```

---

## Behavior Notes

- If `totalPages <= 1` and `onPageSizeChange` is not set, the component renders nothing.
- If `propPageSize` is passed, internal management of page size is skipped.
- `useSettings()` manages state persistence and fetching of default pagination behavior.

---

## Dependencies

- `@chakra-ui/react`: UI components (Box, Button, Select, etc.)
- `@chakra-ui/icons`: Navigation icons
- `useSettings`: Custom hook to retrieve and store pagination-related settings
- `useToast`: For displaying toast notifications

---

## Customization

- You can extend or override default styles and behavior by wrapping or replacing component parts.
- Modify `pageSizeOptions` or logic inside `initializePagination` for different default behavior.

---

## Error Handling

- If loading settings fails, a warning toast notifies the user.
- If updating page size fails, an error toast is displayed.
