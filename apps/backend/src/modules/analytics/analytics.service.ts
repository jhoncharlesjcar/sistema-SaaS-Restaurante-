import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';

@Injectable()
export class AnalyticsService {
    constructor(
        @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    ) { }

    // Obtener resumen del día
    async getDailySummary(restaurantId: string, date?: string) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const startOfDay = `${targetDate}T00:00:00`;
        const endOfDay = `${targetDate}T23:59:59`;

        // Órdenes del día
        const { data: orders, error } = await this.supabase
            .from('orders')
            .select('id, total, subtotal, tax_amount, status, created_at')
            .eq('restaurant_id', restaurantId)
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay);

        if (error) throw new Error(error.message);

        const paidOrders = orders?.filter(o => o.status === 'paid') || [];
        const totalSales = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalTax = paidOrders.reduce((sum, o) => sum + (o.tax_amount || 0), 0);
        const averageTicket = paidOrders.length > 0 ? totalSales / paidOrders.length : 0;

        return {
            date: targetDate,
            totalOrders: orders?.length || 0,
            paidOrders: paidOrders.length,
            cancelledOrders: orders?.filter(o => o.status === 'cancelled').length || 0,
            activeOrders: orders?.filter(o => !['paid', 'cancelled'].includes(o.status)).length || 0,
            totalSales,
            totalTax,
            averageTicket,
        };
    }

    // Obtener ventas por hora
    async getSalesByHour(restaurantId: string, date?: string) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const startOfDay = `${targetDate}T00:00:00`;
        const endOfDay = `${targetDate}T23:59:59`;

        const { data: orders } = await this.supabase
            .from('orders')
            .select('total, created_at')
            .eq('restaurant_id', restaurantId)
            .eq('status', 'paid')
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay);

        // Agrupar por hora
        const hourlyData: Record<number, number> = {};
        for (let i = 0; i < 24; i++) {
            hourlyData[i] = 0;
        }

        orders?.forEach(order => {
            const hour = new Date(order.created_at).getHours();
            hourlyData[hour] += order.total || 0;
        });

        return Object.entries(hourlyData).map(([hour, total]) => ({
            hour: parseInt(hour),
            total,
        }));
    }

    // Top productos vendidos
    async getTopProducts(restaurantId: string, limit: number = 10, days: number = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: items } = await this.supabase
            .from('order_items')
            .select(`
        product_id,
        product_name,
        quantity,
        subtotal,
        orders!inner(restaurant_id, status, created_at)
      `)
            .eq('orders.restaurant_id', restaurantId)
            .eq('orders.status', 'paid')
            .gte('orders.created_at', startDate.toISOString());

        // Agrupar por producto
        const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

        items?.forEach(item => {
            if (!productSales[item.product_id]) {
                productSales[item.product_id] = {
                    name: item.product_name,
                    quantity: 0,
                    revenue: 0,
                };
            }
            productSales[item.product_id].quantity += item.quantity;
            productSales[item.product_id].revenue += item.subtotal;
        });

        return Object.entries(productSales)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }

    // Ventas por período
    async getSalesByPeriod(restaurantId: string, startDate: string, endDate: string) {
        const { data: orders } = await this.supabase
            .from('orders')
            .select('total, created_at')
            .eq('restaurant_id', restaurantId)
            .eq('status', 'paid')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        // Agrupar por día
        const dailySales: Record<string, number> = {};

        orders?.forEach(order => {
            const date = order.created_at.split('T')[0];
            dailySales[date] = (dailySales[date] || 0) + (order.total || 0);
        });

        return Object.entries(dailySales)
            .map(([date, total]) => ({ date, total }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    // Métricas de mesas
    async getTableMetrics(restaurantId: string) {
        const { data: tables } = await this.supabase
            .from('tables')
            .select('id, status')
            .eq('restaurant_id', restaurantId);

        const total = tables?.length || 0;
        const occupied = tables?.filter(t => t.status === 'occupied').length || 0;
        const available = tables?.filter(t => t.status === 'available').length || 0;
        const reserved = tables?.filter(t => t.status === 'reserved').length || 0;

        return {
            total,
            occupied,
            available,
            reserved,
            occupancyRate: total > 0 ? (occupied / total) * 100 : 0,
        };
    }
}
