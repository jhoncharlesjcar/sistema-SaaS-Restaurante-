import { supabase } from '@/lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

export interface OrderItem {
    id?: string;
    order_id?: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    special_instructions?: string;
    kitchen_status?: string;
}

export interface Order {
    id: string;
    restaurant_id: string;
    table_id?: string;
    user_id: string;
    order_number: string;
    customer_name?: string;
    customer_count?: number;
    status: string;
    subtotal: number;
    discount_amount?: number;
    tax_amount: number;
    total: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    order_items?: OrderItem[];
    tables?: any;
    users?: any;
}

export interface CreateOrderInput {
    restaurant_id: string;
    table_id?: string;
    user_id: string;
    customer_name?: string;
    customer_count?: number;
    items?: OrderItem[];
    subtotal: number;
    discount_amount?: number;
    tax_amount: number;
    total: number;
    status?: string;
}

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    };
}

export async function getOrders(restaurantId: string, status?: string, tableId?: string) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ restaurant_id: restaurantId });
    if (status) params.append('status', status);
    if (tableId) params.append('table_id', tableId);

    const response = await fetch(`${API_URL}/orders?${params}`, { headers });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error al obtener órdenes (${response.status}): ${error}`);
    }
    return response.json();
}

export async function getOrderById(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/orders/${id}`, { headers });
    if (!response.ok) throw new Error('Error al obtener orden');
    return response.json();
}

import { syncManager } from '../sync/SyncManager';

export async function createOrder(order: CreateOrderInput) {
    // Modo Offline
    if (!navigator.onLine) {
        console.log('📴 Modo Offline: Guardando orden localmente');
        const localId = crypto.randomUUID();
        const now = new Date().toISOString();

        // Simular respuesta del servidor
        const localOrder = {
            ...order,
            id: localId,
            order_number: 'PENDIENTE-SYNC',
            created_at: now,
            updated_at: now,
            status: 'draft',
            order_items: order.items?.map(item => ({
                ...item,
                id: crypto.randomUUID(),
                order_id: localId,
                created_at: now,
                updated_at: now
            }))
        };

        // Encolar para sincronización
        await syncManager.enqueueOperation('orders', 'INSERT', order, localId);

        return localOrder;
    }

    const headers = await getAuthHeaders();
    console.log('API createOrder - Sending:', JSON.stringify(order, null, 2));

    const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(order),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API createOrder - Error response:', errorData);
        throw new Error(errorData.message || JSON.stringify(errorData) || 'Error al crear orden');
    }
    return response.json();
}

export async function updateOrder(id: string, order: Partial<CreateOrderInput>) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/orders/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Error al actualizar orden');
    return response.json();
}

export async function updateOrderStatus(id: string, status: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/orders/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Error al actualizar estado');
    return response.json();
}

export async function deleteOrder(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/orders/${id}`, {
        method: 'DELETE',
        headers,
    });
    if (!response.ok) throw new Error('Error al eliminar orden');
    return response.json();
}

export async function addOrderItem(orderId: string, item: OrderItem) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/orders/${orderId}/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Error al agregar item');
    return response.json();
}

export async function updateOrderItem(itemId: string, updates: Partial<OrderItem>) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/orders/items/${itemId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Error al actualizar item');
    return response.json();
}

export async function deleteOrderItem(itemId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/orders/items/${itemId}`, {
        method: 'DELETE',
        headers,
    });
    if (!response.ok) throw new Error('Error al eliminar item');
    return response.json();
}
