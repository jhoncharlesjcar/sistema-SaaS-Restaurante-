import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import * as api from './api';
import type { CreateTableInput } from './api';

export function useTables() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['tables', user?.restaurant_id],
        queryFn: () => api.getTables(user!.restaurant_id),
        enabled: !!user?.restaurant_id,
    });
}

export function useTable(id: string) {
    return useQuery({
        queryKey: ['tables', id],
        queryFn: () => api.getTableById(id),
        enabled: !!id,
    });
}

export function useCreateTable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (table: CreateTableInput) => api.createTable(table),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        },
    });
}

export function useUpdateTable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, table }: { id: string; table: Partial<CreateTableInput> }) =>
            api.updateTable(id, table),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        },
    });
}

export function useUpdateTableStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            api.updateTableStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        },
    });
}

export function useDeleteTable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.deleteTable(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        },
    });
}
