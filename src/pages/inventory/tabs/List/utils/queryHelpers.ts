export type WhereClause = {
  clause: string;
  params: unknown[];
};

/**
 * Constructs a SQL WHERE clause and parameter array based on filters.
 */
export function buildWhereClause(
  debouncedSearchTerm: string,
  categoryFilter: string,
  expiryFilter: string,
): WhereClause {
  let clause = `
    (p.name LIKE ? OR p.barcode LIKE ? OR ib.batch_number LIKE ?)
    AND ib.is_deleted = 0
  `;
  const params: unknown[] = [
    `%${debouncedSearchTerm}%`,
    `%${debouncedSearchTerm}%`,
    `%${debouncedSearchTerm}%`,
  ];

  if (categoryFilter !== "all") {
    clause += " AND c.name = ?";
    params.push(categoryFilter);
  }

  if (expiryFilter === "expired") {
    clause += " AND ib.expiration_date < date('now')";
  } else if (expiryFilter === "expiring") {
    clause +=
      " AND ib.expiration_date BETWEEN date('now') AND date('now', '+30 days')";
  } else if (expiryFilter === "valid") {
    clause +=
      " AND (ib.expiration_date IS NULL OR ib.expiration_date >= date('now'))";
  }

  return { clause, params };
}

/**
 * SQL SELECT statement for fetching inventory batches.
 */
export function getInventoryQuery(clause: string): string {
  return `
    SELECT 
      ib.id,
      ib.product_id,
      p.name as product_name,
      p.barcode,
      ib.batch_number,
      ib.quantity,
      ib.cost_price,
      p.selling_price,
      ib.expiration_date,
      ib.date_added,
      u.name as unit_name,
      c.name as category_name
    FROM inventory_batches ib
    JOIN products p ON ib.product_id = p.id
    LEFT JOIN inventory_unit u ON p.unit_id = u.id
    LEFT JOIN inventory_category c ON p.category_id = c.id
    WHERE ${clause}
    ORDER BY ib.expiration_date ASC, p.name ASC
    LIMIT ? OFFSET ?
  `;
}

/**
 * SQL COUNT statement to get total inventory items.
 */
export function getCountQuery(clause: string): string {
  return `
    SELECT COUNT(*) as count 
    FROM inventory_batches ib
    JOIN products p ON ib.product_id = p.id
    LEFT JOIN inventory_category c ON p.category_id = c.id
    WHERE ${clause}
  `;
}
