import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import * as api from './api';
import type { CreateOrderInput, OrderItem } from './api';

export function useOrders(status?: string, tableId?: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['orders', user?.restaurant_id, status, tableId],
        queryFn: () => api.getOrders(user!.restaurant_id, status, tableId),
        enabled: !!user?.restaurant_id,
    });
}

export function useOrder(id: string) {
    return useQuery({
        queryKey: ['orders', id],
        queryFn: () => api.getOrderById(id),
        enabled: !!id,
    });
}

export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (order: CreateOrderInput) => api.createOrder(order),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        },
    });
}

export function useUpdateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, order }: { id: string; order: Partial<CreateOrderInput> }) =>
            api.updateOrder(id, order),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}

export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            api.updateOrderStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        },
    });
}

export function useDeleteOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.deleteOrder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        },
    });
}

export function useAddOrderItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ orderId, item }: { orderId: string; item: OrderItem }) =>
            api.addOrderItem(orderId, item),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}

export function useUpdateOrderItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<OrderItem> }) =>
            api.updateOrderItem(itemId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}

export function useDeleteOrderItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (itemId: string) => api.deleteOrderItem(itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}
