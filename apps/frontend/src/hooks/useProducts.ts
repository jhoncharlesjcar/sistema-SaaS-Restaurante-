import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

// Types
interface Product {
    id: string;
    restaurant_id: string;
    category_id?: string;
    name: string;
    description?: string;
    price: number;
    is_available: boolean;
    image_url?: string;
    categories?: {
        id: string;
        name: string;
        color?: string;
    };
}

interface CreateProductData {
    name: string;
    price: number;
    category_id?: string;
    description?: string;
    image_url?: string;
    is_available?: boolean;
}

// Query keys
export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (restaurantId: string, categoryId?: string) =>
        [...productKeys.lists(), restaurantId, categoryId] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (id: string) => [...productKeys.details(), id] as const,
};

// Fetch all products
export function useProducts(categoryId?: string) {
    const restaurant = useAuthStore((state) => state.restaurant);
    const restaurantId = restaurant?.id;

    return useQuery({
        queryKey: productKeys.list(restaurantId || '', categoryId),
        queryFn: async () => {
            if (!restaurantId) throw new Error('No restaurant');

            let query = supabase
                .from('products')
                .select('*, categories(*)')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false });

            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as Product[];
        },
        enabled: !!restaurantId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Fetch single product
export function useProduct(productId: string) {
    return useQuery({
        queryKey: productKeys.detail(productId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*, categories(*)')
                .eq('id', productId)
                .single();

            if (error) throw error;
            return data as Product;
        },
        enabled: !!productId,
    });
}

// Create product mutation
export function useCreateProduct() {
    const queryClient = useQueryClient();
    const restaurant = useAuthStore((state) => state.restaurant);

    return useMutation({
        mutationFn: async (data: CreateProductData) => {
            if (!restaurant?.id) throw new Error('No restaurant');

            const { data: product, error } = await supabase
                .from('products')
                .insert([{ ...data, restaurant_id: restaurant.id }])
                .select('*, categories(*)')
                .single();

            if (error) throw error;
            return product as Product;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            toast.success('Producto creado exitosamente');
        },
        onError: (error: Error) => {
            toast.error(`Error al crear producto: ${error.message}`);
        },
    });
}

// Update product mutation
export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProductData> }) => {
            const { data: product, error } = await supabase
                .from('products')
                .update(data)
                .eq('id', id)
                .select('*, categories(*)')
                .single();

            if (error) throw error;
            return product as Product;
        },
        onSuccess: (product) => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            queryClient.invalidateQueries({ queryKey: productKeys.detail(product.id) });
            toast.success('Producto actualizado');
        },
        onError: (error: Error) => {
            toast.error(`Error al actualizar: ${error.message}`);
        },
    });
}

// Delete product mutation
export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productId: string) => {
            // Soft delete
            const { error } = await supabase
                .from('products')
                .update({ is_available: false })
                .eq('id', productId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            toast.success('Producto eliminado');
        },
        onError: (error: Error) => {
            toast.error(`Error al eliminar: ${error.message}`);
        },
    });
}
