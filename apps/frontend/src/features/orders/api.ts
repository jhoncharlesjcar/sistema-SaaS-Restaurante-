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
    if (!response.ok) throw new Error('Error al obtener órdenes');
    return response.json();
}

export async function getOrderById(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/orders/${id}`, { headers });
    if (!response.ok) throw new Error('Error al obtener orden');
    return response.json();
}

export async function createOrder(order: CreateOrderInput) {
    const headers = await getAuthHeaders();
    console.log('API createOrder - Sending:', JSON.stringify(order, null, 2));

    try {
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
    } catch (error) {
        // Si estamos offline, guardar en cola de sincronización
        if (!navigator.onLine) {
            console.log('API createOrder - Offline, queuing order');
            const { addToSyncQueue } = await import('@/lib/syncManager');

            // Generar ID temporal para la orden offline
            const tempId = `offline-${Date.now()}`;
            const offlineOrder = {
                ...order,
                id: tempId,
                order_number: `OFFLINE-${Date.now()}`,
                created_at: new Date().toISOString(),
                status: order.status || 'draft',
            };

            await addToSyncQueue({
                table: 'orders',
                operation: 'CREATE',
                data: order,
                endpoint: `${API_URL}/orders`,
                method: 'POST',
            });

            // Retornar orden offline para que la UI la muestre
            return offlineOrder;
        }
        throw error;
    }
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
