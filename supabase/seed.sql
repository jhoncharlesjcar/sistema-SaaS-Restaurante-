-- =====================================================
-- DATOS DE PRUEBA (SCRIPT CORREGIDO)
-- =====================================================

-- 1. Insertar restaurante (con validación de conflicto)
INSERT INTO restaurants (id, name, ruc, address, phone, email, timezone, currency, tax_rate)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Restaurante Demo',
    '20123456789',
    'Av. Principal 123, Lima, Perú',
    '+51 987654321',
    'demo@restaurant.com',
    'America/Lima',
    'PEN',
    0.18
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar usuarios
INSERT INTO users (id, email, full_name, role, restaurant_id, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@demo.com', 'Administrador Demo', 'admin', '00000000-0000-0000-0000-000000000001', true),
    ('00000000-0000-0000-0000-000000000002', 'mesero@demo.com', 'Juan Pérez', 'waiter', '00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insertar categorías
INSERT INTO categories (id, restaurant_id, name, description, color, sort_order)
VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Entradas', 'Platos de entrada', '#FF6B6B', 1),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Platos de Fondo', 'Platos principales', '#4ECDC4', 2),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Bebidas', 'Bebidas frías y calientes', '#45B7D1', 3),
    ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Postres', 'Postres y dulces', '#FFA07A', 4)
ON CONFLICT (id) DO NOTHING;

-- 4. Insertar productos
INSERT INTO products (id, restaurant_id, category_id, name, description, price, cost, is_available)
VALUES
    -- Entradas
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Causa Limeña', 'Papa amarilla con relleno de pollo', 15.00, 6.00, true),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ceviche Clásico', 'Pescado fresco marinado en limón', 28.00, 12.00, true),
    -- Platos de fondo
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Lomo Saltado', 'Carne salteada con verduras y papas fritas', 32.00, 14.00, true),
    ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Arroz con Pollo', 'Arroz verde con pollo y ensalada', 25.00, 10.00, true),
    -- Bebidas
    ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Chicha Morada', 'Bebida tradicional peruana', 8.00, 2.00, true),
    ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Inca Kola', 'Gaseosa nacional', 5.00, 2.00, true),
    -- Postres
    ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Suspiro Limeño', 'Postre tradicional de manjar blanco', 12.00, 4.00, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Insertar mesas
-- Nota: Corregí el ID de la Mesa 5 que tenía un dígito menos en tu código original
INSERT INTO tables (id, restaurant_id, table_number, table_name, capacity, location, status)
VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '1', 'Mesa 1', 4, 'Sala Principal', 'available'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2', 'Mesa 2', 4, 'Sala Principal', 'available'),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '3', 'Mesa 3', 6, 'Sala Principal', 'available'),
    ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '4', 'Mesa VIP 1', 8, 'Sala VIP', 'available'),
    ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '5', 'Terraza A', 4, 'Terraza', 'available')
ON CONFLICT (id) DO NOTHING;

-- 6. Insertar orden de ejemplo
INSERT INTO orders (id, restaurant_id, table_id, user_id, order_number, customer_name, customer_count, status, subtotal, tax_amount, total)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    generate_order_number('00000000-0000-0000-0000-000000000001'),
    'Cliente Demo',
    4,
    'delivered',
    85.00,
    15.30,
    100.30
)
ON CONFLICT (id) DO NOTHING;

-- 7. Insertar items de la orden
-- Nota: La tabla order_items suele tener una clave compuesta (order_id, product_id) o un ID propio.
-- Si tiene clave primaria 'id', necesitas especificarla.
-- Si la clave primaria es compuesta (order_id, product_id), usa esa en el ON CONFLICT.
-- Asumiremos clave compuesta para este ejemplo:
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, kitchen_status)
VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Ceviche Clásico', 2, 28.00, 56.00, 'delivered'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Chicha Morada', 2, 8.00, 16.00, 'delivered'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'Suspiro Limeño', 1, 12.00, 12.00, 'delivered')
ON CONFLICT DO NOTHING;