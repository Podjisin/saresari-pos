export type WhereClause = {
  clause: string;
  params: unknown[];
};

/**
 * Builds a SQL WHERE clause and parameter array for filtering inventory batches by search term, category, and expiration status.
 *
 * @param debouncedSearchTerm - Search term applied to product name, barcode, or batch number
 * @param categoryFilter - Category name to filter by, or "all" for no category filter
 * @param expiryFilter - Expiry status filter: "expired", "expiring", or "valid"
 * @returns An object containing the SQL WHERE clause string and its associated parameters
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
 * Returns a SQL SELECT query string to retrieve inventory batch details joined with product, unit, and category information, applying the specified WHERE clause and supporting pagination.
 *
 * @param clause - The SQL WHERE clause to filter inventory batches
 * @returns The complete SQL SELECT query string with joins and ordering
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
 * Returns a SQL COUNT query string to count inventory batches matching the provided WHERE clause.
 *
 * The query joins inventory batches with products and categories, and applies the given filter conditions.
 *
 * @param clause - The SQL WHERE clause to filter inventory batches
 * @returns A SQL query string that counts the number of matching inventory batches
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
