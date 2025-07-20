use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        // 1. Categories
        Migration {
            version: 1,
            description: "Creates inventory_category table",
            sql: "
                CREATE TABLE IF NOT EXISTS inventory_category (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE
                );
                INSERT OR IGNORE INTO inventory_category (name) VALUES
                    ('Snacks'), ('Drinks'), ('Canned Goods'),
                    ('Instant Noodles'), ('Toiletries'), ('Household Items');
            ",
            kind: MigrationKind::Up,
        },
        // 2. Units
        Migration {
            version: 2,
            description: "Creates inventory_unit table",
            sql: "
                CREATE TABLE IF NOT EXISTS inventory_unit (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE
                );
                INSERT OR IGNORE INTO inventory_unit (name) VALUES
                    ('Piece'), ('Pack'), ('Bottle'),
                    ('Can'), ('Box'), ('Sachet');
            ",
            kind: MigrationKind::Up,
        },
        // 3. Products table (master product info)
        Migration {
            version: 3,
            description: "Creates products table",
            sql: "
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    barcode TEXT UNIQUE,
                    selling_price REAL NOT NULL,
                    unit_id INTEGER,
                    category_id INTEGER,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (unit_id) REFERENCES inventory_unit(id),
                    FOREIGN KEY (category_id) REFERENCES inventory_category(id)
                );
            ",
            kind: MigrationKind::Up,
        },
        // 4. Inventory batches (for expiration tracking)
        Migration {
            version: 4,
            description: "Creates inventory_batches table",
            sql: "
                CREATE TABLE IF NOT EXISTS inventory_batches (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    batch_number TEXT,
                    cost_price REAL NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 0,
                    expiration_date TEXT,
                    date_added TEXT DEFAULT CURRENT_TIMESTAMP,
                    is_deleted INTEGER DEFAULT 0,
                    deleted_at TEXT,
                    FOREIGN KEY (product_id) REFERENCES products(id)
                );
                CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiration 
                ON inventory_batches(expiration_date);
            ",
            kind: MigrationKind::Up,
        },
        // 5. Sales table
        Migration {
            version: 5,
            description: "Creates sales table",
            sql: "
                CREATE TABLE IF NOT EXISTS sales (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    total REAL NOT NULL,
                    cash_received REAL NOT NULL,
                    change REAL NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            ",
            kind: MigrationKind::Up,
        },
        // 6. Sale items (now references batches)
        Migration {
            version: 6,
            description: "Creates sale_items table",
            sql: "
                CREATE TABLE IF NOT EXISTS sale_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sale_id INTEGER NOT NULL,
                    batch_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    price_at_sale REAL NOT NULL,
                    FOREIGN KEY (sale_id) REFERENCES sales(id),
                    FOREIGN KEY (batch_id) REFERENCES inventory_batches(id)
                );
            ",
            kind: MigrationKind::Up,
        },
        // 7. Inventory movement history
        Migration {
            version: 7,
            description: "Creates inventory_history table",
            sql: "
                CREATE TABLE IF NOT EXISTS inventory_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    batch_id INTEGER NOT NULL,
                    change INTEGER NOT NULL,
                    reason TEXT NOT NULL,
                    note TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (batch_id) REFERENCES inventory_batches(id)
                );
            ",
            kind: MigrationKind::Up,
        },
        // 8. Sample inventory data with batch tracking
        Migration {
            version: 8,
            description: "Seeds sample inventory with batch tracking",
            sql: "
                -- Sample products
                INSERT OR IGNORE INTO products (
                    name, barcode, selling_price, unit_id, category_id
                ) VALUES
                    ('Coca-Cola 1L', '1234567890123', 25.00,
                        (SELECT id FROM inventory_unit WHERE name = 'Bottle'),
                        (SELECT id FROM inventory_category WHERE name = 'Drinks')
                    ),
                    ('Lucky Me Pancit Canton', '2345678901234', 10.00,
                        (SELECT id FROM inventory_unit WHERE name = 'Pack'),
                        (SELECT id FROM inventory_category WHERE name = 'Instant Noodles')
                    ),
                    ('Pringles Original', '3456789012345', 55.00,
                        (SELECT id FROM inventory_unit WHERE name = 'Can'),
                        (SELECT id FROM inventory_category WHERE name = 'Snacks')
                    ),
                    ('Nescafe Classic 50g', '4567890123456', 65.00,
                        (SELECT id FROM inventory_unit WHERE name = 'Sachet'),
                        (SELECT id FROM inventory_category WHERE name = 'Snacks')
                    ),
                    ('Century Tuna Flakes', '5678901234567', 35.00,
                        (SELECT id FROM inventory_unit WHERE name = 'Can'),
                        (SELECT id FROM inventory_category WHERE name = 'Canned Goods')
                    ),
                    ('Safeguard Soap', '6789012345678', 28.00,
                        (SELECT id FROM inventory_unit WHERE name = 'Piece'),
                        (SELECT id FROM inventory_category WHERE name = 'Toiletries')
                    ),
                    ('Ariel Powder 1kg', '7890123456789', 120.00,
                        (SELECT id FROM inventory_unit WHERE name = 'Box'),
                        (SELECT id FROM inventory_category WHERE name = 'Household Items')
                    ),
                    ('Sprite 1.5L', '8901234567890', 35.00,
                        (SELECT id FROM inventory_unit WHERE name = 'Bottle'),
                        (SELECT id FROM inventory_category WHERE name = 'Drinks')
                    );
                
                -- Sample batches with different expiration dates
                INSERT OR IGNORE INTO inventory_batches (
                    product_id, cost_price, quantity, expiration_date, batch_number
                ) VALUES
                    -- Coca-Cola batches
                    ((SELECT id FROM products WHERE barcode = '1234567890123'), 
                    20.00, 12, '2024-12-31', 'COKE-2024-01'),
                    
                    ((SELECT id FROM products WHERE barcode = '1234567890123'), 
                    21.00, 12, '2025-06-30', 'COKE-2024-02'),
                    
                    -- Lucky Me batches
                    ((SELECT id FROM products WHERE barcode = '2345678901234'), 
                    7.00, 30, '2025-03-31', 'LUCKY-2024-01'),
                    
                    ((SELECT id FROM products WHERE barcode = '2345678901234'), 
                    7.50, 20, '2025-06-30', 'LUCKY-2024-02'),
                    
                    -- Pringles batches
                    ((SELECT id FROM products WHERE barcode = '3456789012345'), 
                    45.00, 15, '2025-09-30', 'PRINGLES-2024-01'),
                    
                    ((SELECT id FROM products WHERE barcode = '3456789012345'), 
                    48.00, 10, '2025-12-31', 'PRINGLES-2024-02'),
                    
                    -- Nescafe batches
                    ((SELECT id FROM products WHERE barcode = '4567890123456'), 
                    55.00, 25, '2026-01-31', 'NESCAFE-2024-01'),
                    
                    -- Century Tuna batches
                    ((SELECT id FROM products WHERE barcode = '5678901234567'), 
                    28.00, 18, '2025-08-31', 'TUNA-2024-01'),
                    
                    -- Safeguard batches
                    ((SELECT id FROM products WHERE barcode = '6789012345678'), 
                    22.00, 40, '2026-03-31', 'SAFEGUARD-2024-01'),
                    
                    -- Ariel batches
                    ((SELECT id FROM products WHERE barcode = '7890123456789'), 
                    100.00, 8, '2025-11-30', 'ARIEL-2024-01'),
                    
                    -- Sprite batches
                    ((SELECT id FROM products WHERE barcode = '8901234567890'), 
                    28.00, 15, '2025-07-31', 'SPRITE-2024-01'),
                    
                    ((SELECT id FROM products WHERE barcode = '8901234567890'), 
                    30.00, 10, '2025-10-31', 'SPRITE-2024-02');
                
                -- Sample sales data
                INSERT OR IGNORE INTO sales (total, cash_received, change) VALUES
                    (85.00, 100.00, 15.00),
                    (120.00, 150.00, 30.00),
                    (45.00, 50.00, 5.00);
                
                -- Sample sale items
                INSERT OR IGNORE INTO sale_items (sale_id, batch_id, quantity, price_at_sale) VALUES
                    (1, 1, 2, 25.00),  -- 2 Coca-Colas
                    (1, 3, 3, 10.00),  -- 3 Lucky Me
                    (2, 5, 1, 55.00),  -- 1 Pringles
                    (2, 8, 2, 35.00),  -- 2 Century Tuna
                    (3, 10, 1, 120.00); -- 1 Ariel
            ",
            kind: MigrationKind::Up,
        },
        // 9. Settings table for application configuration
        Migration {
            version: 9,
            description: "Creates settings table for application configuration",
            sql: "
                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT NOT NULL UNIQUE,
                    value TEXT,
                    value_type TEXT NOT NULL CHECK(value_type IN ('string', 'number', 'boolean', 'json')),
                    description TEXT,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
        
                -- Insert default settings
                INSERT OR IGNORE INTO settings (key, value, value_type, description) VALUES
                    ('shop_name', '\"My Retail Store\"', 'string', 'Name of the shop/business'),
                    ('shop_address', '\"123 Main Street\"', 'string', 'Shop physical address'),
                    ('shop_contact', '\"09123456789\"', 'string', 'Shop contact number'),
                    ('receipt_footer', '\"Thank you for shopping with us!\"', 'string', 'Text to show at receipt bottom'),
                    ('currency_symbol', '\"₱\"', 'string', 'Currency symbol to use'),
                    ('tax_rate', '0.12', 'number', 'VAT/sales tax rate (as decimal)'),
                    ('enable_barcode_scanner', 'true', 'boolean', 'Whether to enable barcode scanner'),
                    ('inventory_warning_threshold', '5', 'number', 'Low stock warning level'),
                    ('default_print_receipt', 'true', 'boolean', 'Whether to print receipts by default'),
                    ('theme', '\"light\"', 'string', 'UI theme (light/dark/system)'),
                    ('backup_auto', 'true', 'boolean', 'Enable automatic backups'),
                    ('backup_frequency', '7', 'number', 'Days between automatic backups'),
                    ('pagination_enabled', 'true', 'boolean', 'Whether pagination is enabled'),
                    ('default_page_size', '5', 'number', 'Default number of items per page'),
                    ('page_size_options', '[5, 10, 20, 50, 100]', 'json', 'Available page size options'),
                    ('remember_page_size', 'true', 'boolean', 'Remember last used page size per view');
            ",
            kind: MigrationKind::Up,
        },
        // 10. Returns and exchanges
        Migration {
            version: 10,
            description: "Creates returns and exchanges table",
            sql: "
                CREATE TABLE returns (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sale_id INTEGER NOT NULL,
                    refund_amount REAL NOT NULL,
                    return_type TEXT NOT NULL CHECK(return_type IN ('refund', 'exchange', 'store_credit')),
                    reason TEXT NOT NULL,
                    note TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sale_id) REFERENCES sales(id)
                );
            ",
            kind: MigrationKind::Up,
        },
        // 11. return items table
        Migration {
            version: 11,
            description: "Creates return_items table",
            sql: "
                CREATE TABLE IF NOT EXISTS return_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    return_id INTEGER NOT NULL,
                    sale_item_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    FOREIGN KEY (return_id) REFERENCES returns(id),
                    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id)
                );
            ",
            kind: MigrationKind::Up,
        },
        // 12. product history table
        Migration {
            version: 12,
            description: "Creates product_history table",
            sql: "
                CREATE TABLE IF NOT EXISTS product_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    field TEXT NOT NULL,
                    note TEXT,
                    old_value TEXT,
                    new_value TEXT,
                    changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id)
                );
            ",
            kind: MigrationKind::Up,
        },
    ]
}
