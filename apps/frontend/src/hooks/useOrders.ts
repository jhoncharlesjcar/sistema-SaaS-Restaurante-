import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

// Types
interface OrderItem {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    notes?: string;
}

interface Order {
    id: string;
    restaurant_id: string;
    table_id?: string;
    order_number: string;
    customer_name?: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    created_at: string;
    order_items?: OrderItem[];
    tables?: { table_number: string };
}

interface CreateOrderData {
    table_id?: string;
    customer_name?: string;
    customer_count?: number;
    items?: OrderItem[];
}

// Query keys
export const orderKeys = {
    all: ['orders'] as const,
    lists: () => [...orderKeys.all, 'list'] as const,
    list: (restaurantId: string, filters?: { status?: string; tableId?: string }) =>
        [...orderKeys.lists(), restaurantId, filters] as const,
    details: () => [...orderKeys.all, 'detail'] as const,
    detail: (id: string) => [...orderKeys.details(), id] as const,
};

// Fetch all orders
export function useOrders(filters?: { status?: string; tableId?: string }) {
    const restaurant = useAuthStore((state) => state.restaurant);
    const restaurantId = restaurant?.id;

    return useQuery({
        queryKey: orderKeys.list(restaurantId || '', filters),
        queryFn: async () => {
            if (!restaurantId) throw new Error('No restaurant');

            let query = supabase
                .from('orders')
                .select('*, order_items(*), tables(*)')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false });

            if (filters?.status) {
                query = query.eq('status', filters.status);
            }

            if (filters?.tableId) {
                query = query.eq('table_id', filters.tableId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as Order[];
        },
        enabled: !!restaurantId,
        staleTime: 30 * 1000, // 30 seconds - orders change frequently
        refetchInterval: 60 * 1000, // Refetch every minute
    });
}

// Fetch single order
export function useOrder(orderId: string) {
    return useQuery({
        queryKey: orderKeys.detail(orderId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*), tables(*), users(*)')
                .eq('id', orderId)
                .single();

            if (error) throw error;
            return data as Order;
        },
        enabled: !!orderId,
    });
}

// Fetch active orders (for KDS and dashboard)
export function useActiveOrders() {
    const restaurant = useAuthStore((state) => state.restaurant);
    const restaurantId = restaurant?.id;

    return useQuery({
        queryKey: [...orderKeys.lists(), restaurantId, 'active'],
        queryFn: async () => {
            if (!restaurantId) throw new Error('No restaurant');

            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*), tables(*)')
                .eq('restaurant_id', restaurantId)
                .in('status', ['sent_to_kitchen', 'in_preparation', 'ready'])
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as Order[];
        },
        enabled: !!restaurantId,
        staleTime: 10 * 1000, // 10 seconds
        refetchInterval: 30 * 1000, // Refetch every 30 seconds
    });
}

// Create order mutation
export function useCreateOrder() {
    const queryClient = useQueryClient();
    const restaurant = useAuthStore((state) => state.restaurant);
    const user = useAuthStore((state) => state.user);

    return useMutation({
        mutationFn: async (data: CreateOrderData) => {
            if (!restaurant?.id || !user?.id) throw new Error('Not authenticated');

            // Calculate totals
            const subtotal = data.items?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
            const taxRate = restaurant.tax_rate || 0.18;
            const tax_amount = subtotal * taxRate;
            const total = subtotal + tax_amount;

            const orderData = {
                restaurant_id: restaurant.id,
                user_id: user.id,
                table_id: data.table_id,
                customer_name: data.customer_name,
                customer_count: data.customer_count || 1,
                status: 'draft',
                subtotal,
                tax_amount,
                total,
            };

            // Create order via API (which handles order number generation)
            const API_URL = import.meta.env.VITE_API_URL || '/api';
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Token will be added by interceptor
                },
                body: JSON.stringify({ ...orderData, items: data.items }),
            });

            if (!response.ok) {
                throw new Error('Error al crear la orden');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            toast.success('Orden creada exitosamente');
        },
        onError: (error: Error) => {
            toast.error(`Error: ${error.message}`);
        },
    });
}

// Update order status mutation
export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
            const { data, error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;
            return data as Order;
        },
        onSuccess: (order) => {
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
            toast.success(`Estado actualizado a: ${order.status}`);
        },
        onError: (error: Error) => {
            toast.error(`Error: ${error.message}`);
        },
    });
}
