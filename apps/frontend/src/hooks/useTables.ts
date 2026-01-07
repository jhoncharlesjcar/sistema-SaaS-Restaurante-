import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

// Types
interface Table {
    id: string;
    restaurant_id: string;
    table_number: string;
    table_name?: string;
    capacity: number;
    location?: string;
    status: 'available' | 'occupied' | 'reserved' | 'maintenance';
}

// Query keys
export const tableKeys = {
    all: ['tables'] as const,
    lists: () => [...tableKeys.all, 'list'] as const,
    list: (restaurantId: string) => [...tableKeys.lists(), restaurantId] as const,
    details: () => [...tableKeys.all, 'detail'] as const,
    detail: (id: string) => [...tableKeys.details(), id] as const,
};

// Fetch all tables
export function useTables() {
    const restaurant = useAuthStore((state) => state.restaurant);
    const restaurantId = restaurant?.id;

    return useQuery({
        queryKey: tableKeys.list(restaurantId || ''),
        queryFn: async () => {
            if (!restaurantId) throw new Error('No restaurant');

            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('table_number', { ascending: true });

            if (error) throw error;
            return data as Table[];
        },
        enabled: !!restaurantId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

// Fetch available tables
export function useAvailableTables() {
    const restaurant = useAuthStore((state) => state.restaurant);
    const restaurantId = restaurant?.id;

    return useQuery({
        queryKey: [...tableKeys.list(restaurantId || ''), 'available'],
        queryFn: async () => {
            if (!restaurantId) throw new Error('No restaurant');

            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('status', 'available')
                .order('table_number', { ascending: true });

            if (error) throw error;
            return data as Table[];
        },
        enabled: !!restaurantId,
        staleTime: 30 * 1000, // 30 seconds - availability changes frequently
    });
}

// Fetch single table
export function useTable(tableId: string) {
    return useQuery({
        queryKey: tableKeys.detail(tableId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .eq('id', tableId)
                .single();

            if (error) throw error;
            return data as Table;
        },
        enabled: !!tableId,
    });
}

// Update table status mutation
export function useUpdateTableStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ tableId, status }: { tableId: string; status: Table['status'] }) => {
            const { data, error } = await supabase
                .from('tables')
                .update({ status })
                .eq('id', tableId)
                .select()
                .single();

            if (error) throw error;
            return data as Table;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tableKeys.lists() });
            toast.success('Estado de mesa actualizado');
        },
        onError: (error: Error) => {
            toast.error(`Error: ${error.message}`);
        },
    });
}

// Create table mutation
export function useCreateTable() {
    const queryClient = useQueryClient();
    const restaurant = useAuthStore((state) => state.restaurant);

    return useMutation({
        mutationFn: async (data: Omit<Table, 'id' | 'restaurant_id'>) => {
            if (!restaurant?.id) throw new Error('No restaurant');

            const { data: table, error } = await supabase
                .from('tables')
                .insert([{ ...data, restaurant_id: restaurant.id }])
                .select()
                .single();

            if (error) throw error;
            return table as Table;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tableKeys.lists() });
            toast.success('Mesa creada exitosamente');
        },
        onError: (error: Error) => {
            toast.error(`Error: ${error.message}`);
        },
    });
}
