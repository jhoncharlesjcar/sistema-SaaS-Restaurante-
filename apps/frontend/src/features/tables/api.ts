import { supabase } from '@/lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

export interface RestaurantTable {
    id: string;
    restaurant_id: string;
    table_number: string;
    table_name?: string;
    capacity: number;
    location?: string;
    status: 'available' | 'occupied' | 'reserved' | 'maintenance';
    created_at: string;
    updated_at: string;
}

export interface CreateTableInput {
    restaurant_id: string;
    table_number: string;
    table_name?: string;
    capacity: number;
    location?: string;
    status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
}

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    };
}

export async function getTables(restaurantId: string) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ restaurant_id: restaurantId });

    const response = await fetch(`${API_URL}/tables?${params}`, { headers });
    if (!response.ok) throw new Error('Error al obtener mesas');
    return response.json();
}

export async function getTableById(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/tables/${id}`, { headers });
    if (!response.ok) throw new Error('Error al obtener mesa');
    return response.json();
}

export async function createTable(table: CreateTableInput) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/tables`, {
        method: 'POST',
        headers,
        body: JSON.stringify(table),
    });
    if (!response.ok) throw new Error('Error al crear mesa');
    return response.json();
}

export async function updateTable(id: string, table: Partial<CreateTableInput>) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/tables/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(table),
    });
    if (!response.ok) throw new Error('Error al actualizar mesa');
    return response.json();
}

export async function updateTableStatus(id: string, status: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/tables/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Error al actualizar estado');
    return response.json();
}

export async function deleteTable(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/tables/${id}`, {
        method: 'DELETE',
        headers,
    });
    if (!response.ok) throw new Error('Error al eliminar mesa');
    return response.json();
}
