import { supabase } from '@/lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

export interface DailySummary {
    date: string;
    totalOrders: number;
    paidOrders: number;
    cancelledOrders: number;
    activeOrders: number;
    totalSales: number;
    totalTax: number;
    averageTicket: number;
}

export interface HourlySales {
    hour: number;
    total: number;
}

export interface TopProduct {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
}

export interface TableMetrics {
    total: number;
    occupied: number;
    available: number;
    reserved: number;
    occupancyRate: number;
}

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    };
}

export async function getDailySummary(restaurantId: string, date?: string): Promise<DailySummary> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ restaurant_id: restaurantId });
    if (date) params.append('date', date);

    const response = await fetch(`${API_URL}/analytics/daily-summary?${params}`, { headers });
    if (!response.ok) throw new Error('Error al obtener resumen diario');
    return response.json();
}

export async function getSalesByHour(restaurantId: string, date?: string): Promise<HourlySales[]> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ restaurant_id: restaurantId });
    if (date) params.append('date', date);

    const response = await fetch(`${API_URL}/analytics/sales-by-hour?${params}`, { headers });
    if (!response.ok) throw new Error('Error al obtener ventas por hora');
    return response.json();
}

export async function getTopProducts(restaurantId: string, limit?: number, days?: number): Promise<TopProduct[]> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ restaurant_id: restaurantId });
    if (limit) params.append('limit', limit.toString());
    if (days) params.append('days', days.toString());

    const response = await fetch(`${API_URL}/analytics/top-products?${params}`, { headers });
    if (!response.ok) throw new Error('Error al obtener top productos');
    return response.json();
}

export async function getTableMetrics(restaurantId: string): Promise<TableMetrics> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ restaurant_id: restaurantId });

    const response = await fetch(`${API_URL}/analytics/table-metrics?${params}`, { headers });
    if (!response.ok) throw new Error('Error al obtener métricas de mesas');
    return response.json();
}
