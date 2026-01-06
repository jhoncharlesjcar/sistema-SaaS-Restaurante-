import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
    constructor(
        @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    ) { }

    async findAll(restaurantId: string, status?: string, tableId?: string) {
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

        return data;
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase
            .from('orders')
            .select('*, order_items(*), tables(*), users(*)')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Orden con ID ${id} no encontrada`);
        }

        return data;
    }

    async create(createOrderDto: CreateOrderDto) {
        const { items, ...orderData } = createOrderDto;

        // Generar número de orden usando la función de la base de datos
        const { data: orderNumberData, error: orderNumberError } = await this.supabase
            .rpc('generate_order_number', { p_restaurant_id: orderData.restaurant_id });

        if (orderNumberError) {
            // Fallback: generar número de orden manualmente
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            orderData['order_number'] = `ORD-${dateStr}-${randomNum}`;
        } else {
            orderData['order_number'] = orderNumberData;
        }

        console.log('Creating order with data:', orderData);

        // Crear la orden
        const { data: order, error: orderError } = await this.supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (orderError || !order) {
            console.error('Order creation error:', orderError);
            throw new Error(`Error al crear orden: ${orderError?.message}`);
        }

        // Si hay mesas, marcarla como ocupada
        if (order.table_id) {
            await this.supabase
                .from('tables')
                .update({ status: 'occupied' })
                .eq('id', order.table_id);
        }

        // Crear items si existen
        if (items && items.length > 0) {
            const orderItems = items.map(item => ({
                ...item,
                order_id: order.id,
            }));

            const { error: itemsError } = await this.supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) {
                console.error('Items creation error:', itemsError);
                throw new Error(`Error al crear items: ${itemsError.message}`);
            }
        }

        return this.findOne(order.id);
    }

    async update(id: string, updateOrderDto: UpdateOrderDto) {
        const { items, ...orderData } = updateOrderDto;

        const { data, error } = await this.supabase
            .from('orders')
            .update(orderData)
            .eq('id', id)
            .select()
            .single();

        if (error || !data) {
            throw new NotFoundException(`Orden con ID ${id} no encontrada`);
        }

        return this.findOne(id);
    }

    async updateStatus(id: string, status: string) {
        // Si se marca como paid, liberar la mesa
        if (status === 'paid') {
            const order = await this.findOne(id);
            if (order.table_id) {
                await this.supabase
                    .from('tables')
                    .update({ status: 'available' })
                    .eq('id', order.table_id);
            }
        }

        return this.update(id, { status });
    }

    async remove(id: string) {
        const { data, error } = await this.supabase
            .from('orders')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error || !data) {
            throw new NotFoundException(`Orden con ID ${id} no encontrada`);
        }

        // Liberar mesa si estaba ocupada
        if (data.table_id) {
            await this.supabase
                .from('tables')
                .update({ status: 'available' })
                .eq('id', data.table_id);
        }

        return { message: 'Orden eliminada exitosamente', data };
    }

    async addItem(orderId: string, item: any) {
        const orderItem = {
            ...item,
            order_id: orderId,
        };

        const { data, error } = await this.supabase
            .from('order_items')
            .insert([orderItem])
            .select()
            .single();

        if (error) {
            throw new Error(`Error al agregar item: ${error.message}`);
        }

        // Recalcular totales de la orden
        await this.recalculateOrderTotals(orderId);

        return data;
    }

    async updateItem(itemId: string, updates: any) {
        const { data, error } = await this.supabase
            .from('order_items')
            .update(updates)
            .eq('id', itemId)
            .select()
            .single();

        if (error || !data) {
            throw new NotFoundException(`Item con ID ${itemId} no encontrado`);
        }

        // Recalcular totales
        await this.recalculateOrderTotals(data.order_id);

        return data;
    }

    async removeItem(itemId: string) {
        const { data, error } = await this.supabase
            .from('order_items')
            .delete()
            .eq('id', itemId)
            .select()
            .single();

        if (error || !data) {
            throw new NotFoundException(`Item con ID ${itemId} no encontrado`);
        }

        // Recalcular totales
        await this.recalculateOrderTotals(data.order_id);

        return { message: 'Item eliminado exitosamente', data };
    }

    private async recalculateOrderTotals(orderId: string) {
        // Obtener todos los items
        const { data: items } = await this.supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

        if (!items) return;

        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

        // Obtener la orden para saber el tax_rate
        const { data: order } = await this.supabase
            .from('orders')
            .select('*, restaurants(tax_rate)')
            .eq('id', orderId)
            .single();

        const taxRate = order?.restaurants?.tax_rate || 0.18;
        const tax_amount = subtotal * taxRate;
        const total = subtotal + tax_amount;

        // Actualizar orden
        await this.supabase
            .from('orders')
            .update({ subtotal, tax_amount, total })
            .eq('id', orderId);
    }
}
