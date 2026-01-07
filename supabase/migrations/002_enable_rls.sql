-- =====================================================
-- MIGRACIÓN: Habilitar Row Level Security (RLS)
-- =====================================================
-- Autor: Security Phase 1
-- Fecha: 2026-01-06
-- Descripción: Habilita RLS en todas las tablas y define
--              políticas de seguridad por restaurante
-- =====================================================

-- IMPORTANTE: Este script debe ejecutarse con permisos de superadmin
-- Asegúrese de tener el rol service_role o similar

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNCIÓN AUXILIAR: Obtener restaurant_id del usuario actual
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_restaurant_id()
RETURNS UUID AS $$
DECLARE
    user_restaurant_id UUID;
BEGIN
    SELECT restaurant_id INTO user_restaurant_id
    FROM users
    WHERE id = auth.uid();
    
    RETURN user_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLÍTICAS PARA: restaurants
-- =====================================================

-- Usuarios pueden ver solo su restaurante
CREATE POLICY "Users can view their own restaurant"
    ON restaurants FOR SELECT
    USING (id = get_user_restaurant_id());

-- Solo admins pueden modificar datos del restaurante
CREATE POLICY "Admins can update their restaurant"
    ON restaurants FOR UPDATE
    USING (
        id = get_user_restaurant_id() 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- POLÍTICAS PARA: users
-- =====================================================

-- Usuarios pueden ver usuarios de su restaurante
CREATE POLICY "Users can view users in their restaurant"
    ON users FOR SELECT
    USING (restaurant_id = get_user_restaurant_id());

-- Solo admins pueden crear/modificar usuarios
CREATE POLICY "Admins can insert users in their restaurant"
    ON users FOR INSERT
    WITH CHECK (
        restaurant_id = get_user_restaurant_id()
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can update users in their restaurant"
    ON users FOR UPDATE
    USING (
        restaurant_id = get_user_restaurant_id()
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- POLÍTICAS PARA: categories
-- =====================================================

CREATE POLICY "Users can view categories in their restaurant"
    ON categories FOR SELECT
    USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Managers can manage categories"
    ON categories FOR ALL
    USING (
        restaurant_id = get_user_restaurant_id()
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- POLÍTICAS PARA: products
-- =====================================================

CREATE POLICY "Users can view products in their restaurant"
    ON products FOR SELECT
    USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Managers can manage products"
    ON products FOR ALL
    USING (
        restaurant_id = get_user_restaurant_id()
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- POLÍTICAS PARA: tables
-- =====================================================

CREATE POLICY "Users can view tables in their restaurant"
    ON tables FOR SELECT
    USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Users can update table status"
    ON tables FOR UPDATE
    USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Managers can manage tables"
    ON tables FOR INSERT
    WITH CHECK (
        restaurant_id = get_user_restaurant_id()
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Managers can delete tables"
    ON tables FOR DELETE
    USING (
        restaurant_id = get_user_restaurant_id()
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- POLÍTICAS PARA: orders
-- =====================================================

CREATE POLICY "Users can view orders in their restaurant"
    ON orders FOR SELECT
    USING (restaurant_id = get_user_restaurant_id());

-- Todos los usuarios pueden crear órdenes
CREATE POLICY "Users can create orders in their restaurant"
    ON orders FOR INSERT
    WITH CHECK (restaurant_id = get_user_restaurant_id());

-- Todos los usuarios pueden actualizar órdenes (cambiar status, etc)
CREATE POLICY "Users can update orders in their restaurant"
    ON orders FOR UPDATE
    USING (restaurant_id = get_user_restaurant_id());

-- Solo managers pueden eliminar órdenes
CREATE POLICY "Managers can delete orders"
    ON orders FOR DELETE
    USING (
        restaurant_id = get_user_restaurant_id()
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- POLÍTICAS PARA: order_items
-- =====================================================

CREATE POLICY "Users can view order items in their restaurant"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id 
            AND o.restaurant_id = get_user_restaurant_id()
        )
    );

CREATE POLICY "Users can manage order items in their restaurant"
    ON order_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id 
            AND o.restaurant_id = get_user_restaurant_id()
        )
    );

-- =====================================================
-- POLÍTICAS PARA: invoices
-- =====================================================

CREATE POLICY "Users can view invoices in their restaurant"
    ON invoices FOR SELECT
    USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Users can create invoices in their restaurant"
    ON invoices FOR INSERT
    WITH CHECK (restaurant_id = get_user_restaurant_id());

-- Solo managers pueden modificar/anular facturas
CREATE POLICY "Managers can update invoices"
    ON invoices FOR UPDATE
    USING (
        restaurant_id = get_user_restaurant_id()
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- POLÍTICAS PARA: sync_queue
-- =====================================================

CREATE POLICY "Users can manage sync queue for their restaurant"
    ON sync_queue FOR ALL
    USING (restaurant_id = get_user_restaurant_id());

-- =====================================================
-- PERMITIR ACCESO A SERVICE ROLE (bypass RLS)
-- =====================================================
-- El backend usa service_role key que bypassa RLS automáticamente
-- Esto es por diseño para operaciones administrativas

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- NOTA: Para aplicar esta migración:
-- 1. Ir a Supabase Dashboard -> SQL Editor
-- 2. Copiar y ejecutar este script
-- 3. Verificar que las políticas se crearon correctamente en:
--    Authentication -> Policies
