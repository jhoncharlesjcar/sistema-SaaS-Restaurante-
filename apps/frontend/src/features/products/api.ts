import { supabase } from '@/lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

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
    created_at: string;
    updated_at: string;
    categories?: {
        id: string;
        name: string;
        color?: string;
    };
}

export interface CreateProductInput {
    restaurant_id: string;
    category_id?: string;
    name: string;
    description?: string;
    sku?: string;
    image_url?: string;
    price: number;
    cost?: number;
    is_available?: boolean;
    track_inventory?: boolean;
    stock_quantity?: number;
    is_taxable?: boolean;
    preparation_time?: number;
}

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    };
}

export async function getProducts(restaurantId: string, categoryId?: string) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ restaurant_id: restaurantId });
    if (categoryId) params.append('category_id', categoryId);

    const response = await fetch(`${API_URL}/products?${params}`, { headers });
    if (!response.ok) throw new Error('Error al obtener productos');
    return response.json();
}

export async function getProductById(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/products/${id}`, { headers });
    if (!response.ok) throw new Error('Error al obtener producto');
    return response.json();
}

export async function createProduct(product: CreateProductInput) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Error al crear producto');
    return response.json();
}

export async function updateProduct(id: string, product: Partial<CreateProductInput>) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Error al actualizar producto');
    return response.json();
}

export async function deleteProduct(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers,
    });
    if (!response.ok) throw new Error('Error al eliminar producto');
    return response.json();
}
