# Database Schema Documentation for Sari-Sari Store App

This document describes the SQLite database schema used in the Sari-Sari Store application.

---

## Tables

### 1. `inventory`

Tracks all products currently available in the store.

| Column           | Type    | Description                              |
| ---------------- | ------- | ---------------------------------------- |
| id               | INTEGER | Primary key (auto-increment)             |
| name             | TEXT    | Product name                             |
| barcode          | TEXT    | Optional unique barcode                  |
| amount           | INTEGER | Quantity in stock                        |
| cost\_price      | REAL    | Purchase cost per unit                   |
| selling\_price   | REAL    | Selling price per unit                   |
| unit\_id         | INTEGER | Foreign key to `inventory_unit`          |
| category\_id     | INTEGER | Foreign key to `inventory_category`      |
| expiration\_date | TEXT    | Expiration date (ISO 8601 format)        |
| note             | TEXT    | Optional notes or description            |
| created\_at      | TEXT    | Timestamp when the item was added        |
| updated\_at      | TEXT    | Timestamp when the item was last updated |

**Relationships:**

* `unit_id` → `inventory_unit.id`
* `category_id` → `inventory_category.id`

---

### 2. `inventory_category`

Defines categories for organizing inventory items.

| Column | Type    | Description            |
| ------ | ------- | ---------------------- |
| id     | INTEGER | Primary key            |
| name   | TEXT    | Category name (unique) |

**Seeded values:** Snacks, Drinks, Canned Goods, Instant Noodles, Toiletries, Household Items

---

### 3. `inventory_unit`

Defines standard units of measurement.

| Column | Type    | Description        |
| ------ | ------- | ------------------ |
| id     | INTEGER | Primary key        |
| name   | TEXT    | Unit name (unique) |

**Seeded values:** Piece, Pack, Bottle, Can, Box, Sachet

---

### 4. `sales`

Represents a complete sales transaction.

| Column         | Type    | Description              |
| -------------- | ------- | ------------------------ |
| id             | INTEGER | Primary key              |
| total          | REAL    | Total sale amount        |
| cash\_received | REAL    | Amount of cash received  |
| change         | REAL    | Change given to customer |
| created\_at    | TEXT    | Timestamp of sale        |

---

### 5. `sale_items`

Stores individual items sold in a transaction.

| Column          | Type    | Description                       |
| --------------- | ------- | --------------------------------- |
| id              | INTEGER | Primary key                       |
| sale\_id        | INTEGER | Foreign key to `sales`            |
| inventory\_id   | INTEGER | Foreign key to `inventory`        |
| quantity        | INTEGER | Quantity sold                     |
| price\_at\_sale | REAL    | Price of the item at time of sale |

**Relationships:**

* `sale_id` → `sales.id`
* `inventory_id` → `inventory.id`

---

### 6. `inventory_history`

Records every change made to inventory stock levels.

| Column        | Type    | Description                                   |
| ------------- | ------- | --------------------------------------------- |
| id            | INTEGER | Primary key                                   |
| inventory\_id | INTEGER | Foreign key to `inventory`                    |
| change        | INTEGER | Positive for stock-in, negative for stock-out |
| reason        | TEXT    | Reason for the change (e.g., restock, sale)   |
| note          | TEXT    | Optional description or note                  |
| created\_at   | TEXT    | Timestamp of the stock change                 |

**Relationships:**

* `inventory_id` → `inventory.id`

---

## Notes

* All timestamp fields use ISO 8601 text format (e.g., `2025-07-05T14:00:00`).
* Foreign keys enforce relational integrity across tables.
* Default categories and units are automatically seeded.

---

## Future Considerations

* Add reporting tables or views for daily/weekly summaries.
* Optionally add `supplier` table for sourcing data.
* Index frequently queried fields (e.g., `barcode`, `name`).
