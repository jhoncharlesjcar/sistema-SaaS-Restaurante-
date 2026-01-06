import { useState, useEffect, useCallback } from 'react';
import {
    processSyncQueue,
    getPendingCount,
    addToSyncQueue,
    getAllOperations,
    type PendingOperation
} from '../lib/syncManager';

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSyncResult, setLastSyncResult] = useState<{ success: number; failed: number } | null>(null);

    // Monitorear estado de conexión
    useEffect(() => {
        const handleOnline = () => {
            console.log('[Sync] Online');
            setIsOnline(true);
            // Auto-sincronizar al reconectarse
            syncNow();
        };

        const handleOffline = () => {
            console.log('[Sync] Offline');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Actualizar conteo inicial
        updatePendingCount();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Escuchar mensajes del Service Worker
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'SYNC_ORDERS') {
                    console.log('[Sync] SW triggered sync');
                    syncNow();
                }
            });
        }
    }, []);

    // Actualizar conteo de pendientes
    const updatePendingCount = useCallback(async () => {
        const count = await getPendingCount();
        setPendingCount(count);
    }, []);

    // Sincronizar ahora
    const syncNow = useCallback(async () => {
        if (!navigator.onLine) {
            console.log('[Sync] Cannot sync: offline');
            return;
        }

        if (isSyncing) {
            console.log('[Sync] Already syncing');
            return;
        }

        setIsSyncing(true);
        try {
            const result = await processSyncQueue();
            setLastSyncResult(result);
            await updatePendingCount();
            console.log('[Sync] Sync complete:', result);
        } catch (error) {
            console.error('[Sync] Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, updatePendingCount]);

    // Agregar operación a la cola
    const queueOperation = useCallback(async (
        table: string,
        operation: 'CREATE' | 'UPDATE' | 'DELETE',
        data: any,
        endpoint: string,
        method: string
    ) => {
        await addToSyncQueue({
            table,
            operation,
            data,
            endpoint,
            method,
        });
        await updatePendingCount();
    }, [updatePendingCount]);

    // Obtener todas las operaciones (para debug)
    const getOperations = useCallback(async (): Promise<PendingOperation[]> => {
        return getAllOperations();
    }, []);

    return {
        isOnline,
        isSyncing,
        pendingCount,
        lastSyncResult,
        syncNow,
        queueOperation,
        getOperations,
        updatePendingCount,
    };
}
