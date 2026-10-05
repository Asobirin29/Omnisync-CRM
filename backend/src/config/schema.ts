import { db } from './database.js';

export const SCHEMA_SQL = `
-- Drop existing tables if reset is needed
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customer_tags CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS inventory_channels CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 1. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(50) NOT NULL,
    size VARCHAR(20) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. INVENTORY CHANNELS
CREATE TABLE IF NOT EXISTS inventory_channels (
    id SERIAL PRIMARY KEY,
    variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    platform VARCHAR(30) NOT NULL CHECK (platform IN ('shopee', 'tokopedia', 'lazada', 'blibli', 'whatsapp')),
    platform_item_id VARCHAR(100),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_variant_platform UNIQUE (variant_id, platform)
);

-- 4. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    loyalty_tier VARCHAR(50) NOT NULL DEFAULT 'Bronze' CHECK (loyalty_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
    purchase_history_count INT NOT NULL DEFAULT 0 CHECK (purchase_history_count >= 0),
    lifetime_value NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (lifetime_value >= 0),
    preferred_platform VARCHAR(30) NOT NULL CHECK (preferred_platform IN ('shopee', 'tokopedia', 'lazada', 'blibli', 'whatsapp')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CUSTOMER TAGS
CREATE TABLE IF NOT EXISTS customer_tags (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_tag UNIQUE (customer_id, tag)
);

-- 6. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    platform VARCHAR(30) NOT NULL CHECK (platform IN ('shopee', 'tokopedia', 'lazada', 'blibli', 'whatsapp')),
    external_order_id VARCHAR(100) NOT NULL,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    status VARCHAR(30) NOT NULL CHECK (status IN ('pending_payment', 'paid', 'shipped', 'completed', 'returned', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_platform_external_order UNIQUE (platform, external_order_id)
);

-- 7. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    qty INT NOT NULL CHECK (qty > 0),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0)
);

-- 8. CHAT SESSIONS
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    platform VARCHAR(30) NOT NULL CHECK (platform IN ('shopee', 'tokopedia', 'lazada', 'blibli', 'whatsapp')),
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unread_count INT NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    urgency VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high'))
);

-- 9. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('customer', 'cs')),
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    first_response_ms INT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

CREATE INDEX IF NOT EXISTS idx_inventory_channels_variant_id ON inventory_channels(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_channels_platform ON inventory_channels(platform);
CREATE INDEX IF NOT EXISTS idx_inventory_channels_stock ON inventory_channels(stock);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_preferred_platform ON customers(preferred_platform);

CREATE INDEX IF NOT EXISTS idx_customer_tags_customer_id ON customer_tags(customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders(platform);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer_id ON chat_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_platform ON chat_sessions(platform);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at ASC);
`;

export async function createSchema(): Promise<void> {
  console.log('[Schema] Initializing database tables and indexes...');
  await db.exec(SCHEMA_SQL);
  console.log('[Schema] All tables, constraints, and indexes initialized successfully.');
}
