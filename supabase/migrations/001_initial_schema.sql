-- =====================================================
-- SISTEMA POS OFFLINE-FIRST - SCHEMA INICIAL
-- =====================================================
-- Autor: Jcar Labs
-- Fecha: 2026-01-05
-- Descripción: Schema inicial con soporte para sincronización offline
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- FUNCIÓN: Actualizar timestamp automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TABLA: users (Usuarios del sistema)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'waiter', -- admin, manager, waiter, chef
    is_active BOOLEAN DEFAULT true,
    restaurant_id UUID, -- Relación con restaurante (se crea después)
    
    -- Auditoría y sincronización
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- TABLA: restaurants (Datos del restaurante)
-- =====================================================
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    ruc VARCHAR(11) UNIQUE NOT NULL, -- RUC para Perú
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    
    -- Configuración
    timezone VARCHAR(50) DEFAULT 'America/Lima',
    currency VARCHAR(3) DEFAULT 'PEN',
    tax_rate DECIMAL(5,2) DEFAULT 0.18, -- IGV 18% en Perú
    
    -- Integración SUNAT
    sunat_enabled BOOLEAN DEFAULT false,
    sunat_username VARCHAR(255),
    sunat_password_encrypted TEXT,
    sunat_certificate TEXT,
    
    -- Auditoría y sincronización
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Agregar relación después de crear la tabla restaurants
ALTER TABLE users 
ADD CONSTRAINT fk_users_restaurant 
FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

-- =====================================================
-- TABLA: categories (Categorías de productos)
-- =====================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Código hex para UI (#FF5733)
    icon VARCHAR(50), -- Nombre del icono
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Auditoría y sincronización
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(restaurant_id, name)
);

-- =====================================================
-- TABLA: products (Productos/Platos del menú)
-- =====================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Información básica
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(50),
    image_url TEXT,
    
    -- Precio y stock
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2), -- Costo para calcular margen
    is_available BOOLEAN DEFAULT true,
    track_inventory BOOLEAN DEFAULT false,
    stock_quantity INTEGER DEFAULT 0,
    
    -- Clasificación
    is_taxable BOOLEAN DEFAULT true,
    preparation_time INTEGER, -- minutos
    
    -- Auditoría y sincronización
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ,
    
    -- Metadatos (variantes, modificadores, etc.)
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- TABLA: tables (Mesas del restaurante)
-- =====================================================
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Información de la mesa
    table_number VARCHAR(10) NOT NULL,
    table_name VARCHAR(100), -- Ej: "Mesa VIP 1", "Terraza A"
    capacity INTEGER NOT NULL DEFAULT 4,
    location VARCHAR(100), -- Sala, terraza, segundo piso, etc.
    
    -- Estado
    status VARCHAR(20) DEFAULT 'available', -- available, occupied, reserved, maintenance
    
    -- Auditoría y sincronización
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(restaurant_id, table_number)
);

-- =====================================================
-- TABLA: orders (Órdenes/Comandas)
-- =====================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Mesero que tomó la orden
    
    -- Información de la orden
    order_number VARCHAR(20) UNIQUE NOT NULL, -- Número secuencial: ORD-20260104-001
    customer_name VARCHAR(255),
    customer_count INTEGER DEFAULT 1, -- Número de comensales
    
    -- Estado
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent_to_kitchen, in_preparation, ready, delivered, paid, cancelled
    
    -- Montos
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    
    -- Fechas importantes
    sent_to_kitchen_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Notas
    notes TEXT,
    cancellation_reason TEXT,
    
    -- Auditoría y sincronización
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ,
    
    -- Metadatos (descuentos aplicados, promociones, etc.)
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- TABLA: order_items (Items de cada orden)
-- =====================================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Información del item (snapshot del producto en el momento de la orden)
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    -- Estado en cocina
    kitchen_status VARCHAR(20) DEFAULT 'pending', -- pending, preparing, ready, delivered
    prepared_at TIMESTAMPTZ,
    
    -- Modificaciones
    notes TEXT, -- "Sin cebolla", "Término 3/4", etc.
    modifiers JSONB DEFAULT '[]'::jsonb, -- Array de modificadores aplicados
    
    -- Auditoría y sincronización
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- TABLA: invoices (Facturas electrónicas)
-- =====================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Información fiscal
    invoice_type VARCHAR(10) NOT NULL, -- BOLETA, FACTURA
    invoice_number VARCHAR(20) UNIQUE NOT NULL, -- B001-00000123, F001-00000045
    serie VARCHAR(4) NOT NULL, -- B001, F001
    correlative INTEGER NOT NULL,
    
    -- Cliente
    customer_doc_type VARCHAR(3), -- DNI, RUC
    customer_doc_number VARCHAR(11),
    customer_name VARCHAR(255) NOT NULL,
    customer_address TEXT,
    
    -- Montos
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    
    -- SUNAT
    sunat_status VARCHAR(20) DEFAULT 'pending', -- pending, sent, accepted, rejected
    sunat_response_code VARCHAR(10),
    sunat_response_description TEXT,
    cdr_url TEXT, -- URL del CDR (respuesta SUNAT)
    xml_url TEXT,
    pdf_url TEXT,
    sent_to_sunat_at TIMESTAMPTZ,
    
    -- Estado
    is_voided BOOLEAN DEFAULT false,
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    
    -- Auditoría y sincronización
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- TABLA: sync_queue (Cola de sincronización)
-- =====================================================
-- Esta tabla almacena operaciones pendientes de sincronizar
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Información de la operación
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    
    -- Datos
    data JSONB NOT NULL,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,
    
    -- Prioridad (menor número = mayor prioridad)
    priority INTEGER DEFAULT 100
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Users
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Products
CREATE INDEX idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_products_name ON products(name);

-- Categories
CREATE INDEX idx_categories_restaurant_id ON categories(restaurant_id);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Tables
CREATE INDEX idx_tables_restaurant_id ON tables(restaurant_id);
CREATE INDEX idx_tables_status ON tables(status);

-- Orders
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_kitchen_status ON order_items(kitchen_status);

-- Invoices
CREATE INDEX idx_invoices_restaurant_id ON invoices(restaurant_id);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_sunat_status ON invoices(sunat_status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);

-- Sync Queue
CREATE INDEX idx_sync_queue_restaurant_id ON sync_queue(restaurant_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_priority ON sync_queue(priority ASC, created_at ASC);

-- =====================================================
-- TRIGGERS PARA updated_at
-- =====================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Nota: Configurar según los requerimientos de seguridad
-- Por ahora, se deja comentado para desarrollo

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- etc...

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Generar número de orden secuencial
CREATE OR REPLACE FUNCTION generate_order_number(p_restaurant_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_date VARCHAR(8);
    v_count INTEGER;
    v_order_number VARCHAR(20);
BEGIN
    v_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM orders
    WHERE restaurant_id = p_restaurant_id
    AND order_number LIKE 'ORD-' || v_date || '%';
    
    v_order_number := 'ORD-' || v_date || '-' || LPAD(v_count::TEXT, 3, '0');
    
    RETURN v_order_number;
END;
$$ LANGUAGE plpgsql;

-- Generar número de factura
CREATE OR REPLACE FUNCTION generate_invoice_number(
    p_restaurant_id UUID,
    p_invoice_type VARCHAR,
    p_serie VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
    v_correlative INTEGER;
    v_invoice_number VARCHAR(20);
BEGIN
    SELECT COALESCE(MAX(correlative), 0) + 1 INTO v_correlative
    FROM invoices
    WHERE restaurant_id = p_restaurant_id
    AND invoice_type = p_invoice_type
    AND serie = p_serie;
    
    v_invoice_number := p_serie || '-' || LPAD(v_correlative::TEXT, 8, '0');
    
    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE users IS 'Usuarios del sistema (meseros, administradores, chefs)';
COMMENT ON TABLE restaurants IS 'Información de los restaurantes';
COMMENT ON TABLE categories IS 'Categorías de productos del menú';
COMMENT ON TABLE products IS 'Productos/platos del menú';
COMMENT ON TABLE tables IS 'Mesas del restaurante';
COMMENT ON TABLE orders IS 'Órdenes/comandas de los clientes';
COMMENT ON TABLE order_items IS 'Detalle de items por orden';
COMMENT ON TABLE invoices IS 'Facturas electrónicas emitidas';
COMMENT ON TABLE sync_queue IS 'Cola de operaciones pendientes de sincronización offline';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
