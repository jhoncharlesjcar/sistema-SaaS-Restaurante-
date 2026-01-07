import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { IOrdersRepository, Order, OrderItem, OrderWithRelations } from './interfaces/orders.interface';

@Injectable()
export class OrdersRepository implements IOrdersRepository {
    constructor(
        @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    ) { }

    async findAll(restaurantId: string, status?: string, tableId?: string): Promise<OrderWithRelations[]> {
        let query = this.supabase
            .from('orders')
            .select('*, order_items(*), tables(*), users(*)')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (tableId) {
            query = query.eq('table_id', tableId);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Error al obtener órdenes: ${error.message}`);
        }

        return data || [];
    }

    async findOne(id: string): Promise<OrderWithRelations | null> {
        const { data, error } = await this.supabase
            .from('orders')
            .select('*, order_items(*), tables(*), users(*)')
            .eq('id', id)
            .single();

        if (error) {
            return null;
        }

        return data;
    }

    async create(orderData: Partial<Order>): Promise<Order> {
        const { data, error } = await this.supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (error || !data) {
            throw new Error(`Error al crear orden: ${error?.message}`);
        }

        return data;
    }

    async update(id: string, orderData: Partial<Order>): Promise<Order | null> {
        const { data, error } = await this.supabase
            .from('orders')
            .update(orderData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return null;
        }

        return data;
    }

    async delete(id: string): Promise<Order | null> {
        const { data, error } = await this.supabase
            .from('orders')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return null;
        }

        return data;
    }

    async createItems(items: Partial<OrderItem>[]): Promise<void> {
        const { error } = await this.supabase
            .from('order_items')
            .insert(items);

        if (error) {
            throw new Error(`Error al crear items: ${error.message}`);
        }
    }

    async findItems(orderId: string): Promise<OrderItem[]> {
        const { data, error } = await this.supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

        if (error) {
            throw new Error(`Error al obtener items: ${error.message}`);
        }

        return data || [];
    }

    async updateItem(itemId: string, data: Partial<OrderItem>): Promise<OrderItem | null> {
        const { data: item, error } = await this.supabase
            .from('order_items')
            .update(data)
            .eq('id', itemId)
            .select()
            .single();

        if (error) {
            return null;
        }

        return item;
    }

    async deleteItem(itemId: string): Promise<OrderItem | null> {
        const { data, error } = await this.supabase
            .from('order_items')
            .delete()
            .eq('id', itemId)
            .select()
            .single();

        if (error) {
            return null;
        }

        return data;
    }

    async generateOrderNumber(restaurantId: string): Promise<string> {
        const { data, error } = await this.supabase
            .rpc('generate_order_number', { p_restaurant_id: restaurantId });

        if (error || !data) {
            // Fallback: generate order number manually
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `ORD-${dateStr}-${randomNum}`;
        }

        return data;
    }

    async updateTableStatus(tableId: string, status: string): Promise<void> {
        await this.supabase
            .from('tables')
            .update({ status })
            .eq('id', tableId);
    }

    async getOrderWithRestaurant(orderId: string) {
        const { data } = await this.supabase
            .from('orders')
            .select('*, restaurants(tax_rate)')
            .eq('id', orderId)
            .single();

        return data;
    }

    async updateOrderTotals(orderId: string, subtotal: number, tax_amount: number, total: number): Promise<void> {
        await this.supabase
            .from('orders')
            .update({ subtotal, tax_amount, total })
            .eq('id', orderId);
    }
}
