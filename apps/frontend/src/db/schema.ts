import Dexie, { Table } from 'dexie';

// =====================================================
// TIPOS (Réplicas de las tablas de Supabase)
// =====================================================

export interface Restaurant {
    id: string;
    name: string;
    ruc: string;
    address?: string;
    phone?: string;
    email?: string;
    timezone: string;
    currency: string;
    tax_rate: number;
    created_at: Date;
    updated_at: Date;
    synced_at?: Date;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    role: string;
    is_active: boolean;
    restaurant_id: string;
    created_at: Date;
    updated_at: Date;
    synced_at?: Date;
}

export interface Category {
    id: string;
    restaurant_id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    sort_order: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    synced_at?: Date;
}

export interface Product {
    id: string;
    restaurant_id: string;
    category_id?: string;
    name: string;
    description?: string;
    sku?: string;
    image_url?: string;
    price: number;
    cost?: number;
    is_available: boolean;
    track_inventory: boolean;
    stock_quantity: number;
    is_taxable: boolean;
    preparation_time?: number;
    created_at: Date;
    updated_at: Date;
    synced_at?: Date;
}

export interface RestaurantTable {
    id: string;
    restaurant_id: string;
    table_number: string;
    table_name?: string;
    capacity: number;
    location?: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    synced_at?: Date;
}

export interface Order {
    id: string;
    restaurant_id: string;
    table_id?: string;
    user_id?: string;
    order_number: string;
    customer_name?: string;
    customer_count: number;
    status: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    tip_amount: number;
    total: number;
    sent_to_kitchen_at?: Date;
    ready_at?: Date;
    delivered_at?: Date;
    paid_at?: Date;
    cancelled_at?: Date;
    notes?: string;
    cancellation_reason?: string;
    created_at: Date;
    updated_at: Date;
    synced_at?: Date;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id?: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    kitchen_status: string;
    prepared_at?: Date;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    synced_at?: Date;
}

export interface Invoice {
    id: string;
    restaurant_id: string;
    order_id?: string;
    invoice_type: string;
    invoice_number: string;
    serie: string;
    correlative: number;
    customer_doc_type?: string;
    customer_doc_number?: string;
    customer_name: string;
    customer_address?: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    sunat_status: string;
    is_voided: boolean;
    created_at: Date;
    updated_at: Date;
    synced_at?: Date;
}

export interface SyncQueueItem {
    id?: number;
    restaurant_id: string;
    user_id?: string;
    table_name: string;
    record_id: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    data: any;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    retry_count: number;
    error_message?: string;
    created_at: Date;
    processed_at?: Date;
    priority: number;
}

export interface SyncMetadata {
    key: string;
    value: any;
    updated_at: Date;
}

// =====================================================
// BASE DE DATOS DEXIE
// =====================================================

export class POSDatabase extends Dexie {
    // Tablas principales
    restaurants!: Table<Restaurant, string>;
    users!: Table<User, string>;
    categories!: Table<Category, string>;
    products!: Table<Product, string>;
    restaurantTables!: Table<RestaurantTable, string>; // Renamed from 'tables' to avoid Dexie conflict
    orders!: Table<Order, string>;
    orderItems!: Table<OrderItem, string>;
    invoices!: Table<Invoice, string>;

    // Sincronización
    syncQueue!: Table<SyncQueueItem, number>;
    syncMetadata!: Table<SyncMetadata, string>;

    constructor() {
        super('POSDatabase');

        this.version(1).stores({
            // Tablas principales (con índices)
            restaurants: 'id, name',
            users: 'id, email, restaurant_id, role',
            categories: 'id, restaurant_id, name, is_active',
            products: 'id, restaurant_id, category_id, name, is_available',
            restaurantTables: 'id, restaurant_id, table_number, status', // Renamed from 'tables'
            orders: 'id, restaurant_id, table_id, status, created_at, synced_at',
            orderItems: 'id, order_id, product_id, kitchen_status',
            invoices: 'id, restaurant_id, order_id, invoice_number',

            // Cola de sincronización
            syncQueue: '++id, status, priority, created_at, [status+priority]',

            // Metadatos
            syncMetadata: 'key',
        });
    }
}

// Instancia global de la base de datos
export const db = new POSDatabase();

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Verifica si hay items pendientes de sincronizar
 */
export async function hasPendingSync(): Promise<boolean> {
    const count = await db.syncQueue.where('status').equals('pending').count();
    return count > 0;
}

/**
 * Obtiene el conteo de items pendientes
 */
export async function getPendingSyncCount(): Promise<number> {
    return db.syncQueue.where('status').equals('pending').count();
}

/**
 * Limpia datos locales (útil para logout)
 */
export async function clearLocalData(): Promise<void> {
    await db.delete();
    await db.open();
}
