import { useQuery } from '@tanstack/react-query';
import { getDailySummary, getSalesByHour, getTopProducts, getTableMetrics } from './api';

export function useDailySummary(restaurantId: string, date?: string) {
    return useQuery({
        queryKey: ['analytics', 'daily-summary', restaurantId, date],
        queryFn: () => getDailySummary(restaurantId, date),
        enabled: !!restaurantId,
    });
}

export function useSalesByHour(restaurantId: string, date?: string) {
    return useQuery({
        queryKey: ['analytics', 'sales-by-hour', restaurantId, date],
        queryFn: () => getSalesByHour(restaurantId, date),
        enabled: !!restaurantId,
    });
}

export function useTopProducts(restaurantId: string, limit?: number, days?: number) {
    return useQuery({
        queryKey: ['analytics', 'top-products', restaurantId, limit, days],
        queryFn: () => getTopProducts(restaurantId, limit, days),
        enabled: !!restaurantId,
    });
}

export function useTableMetrics(restaurantId: string) {
    return useQuery({
        queryKey: ['analytics', 'table-metrics', restaurantId],
        queryFn: () => getTableMetrics(restaurantId),
        enabled: !!restaurantId,
        refetchInterval: 30000, // Refrescar cada 30 segundos
    });
}
