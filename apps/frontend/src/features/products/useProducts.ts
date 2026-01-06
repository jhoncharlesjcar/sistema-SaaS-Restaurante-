import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import * as api from './api';
import type { CreateProductInput } from './api';

export function useProducts(categoryId?: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['products', user?.restaurant_id, categoryId],
        queryFn: () => api.getProducts(user!.restaurant_id, categoryId),
        enabled: !!user?.restaurant_id,
    });
}

export function useProduct(id: string) {
    return useQuery({
        queryKey: ['products', id],
        queryFn: () => api.getProductById(id),
        enabled: !!id,
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (product: CreateProductInput) => api.createProduct(product),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, product }: { id: string; product: Partial<CreateProductInput> }) =>
            api.updateProduct(id, product),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
