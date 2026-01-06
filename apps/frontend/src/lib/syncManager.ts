import Dexie from 'dexie';

// Base de datos para cola de sincronización
class SyncQueueDB extends Dexie {
    pendingOperations!: Dexie.Table<PendingOperation, number>;

    constructor() {
        super('POSSyncQueue');
        this.version(1).stores({
            pendingOperations: '++id, table, operation, createdAt, status',
        });
    }
}

export interface PendingOperation {
    id?: number;
    table: string; // 'orders', 'order_items', etc.
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    data: any;
    endpoint: string;
    method: string;
    createdAt: Date;
    status: 'pending' | 'syncing' | 'failed';
    retryCount: number;
    lastError?: string;
}

const syncDB = new SyncQueueDB();

// Agregar operación a la cola
export async function addToSyncQueue(operation: Omit<PendingOperation, 'id' | 'createdAt' | 'status' | 'retryCount'>): Promise<number> {
    const id = await syncDB.pendingOperations.add({
        ...operation,
        createdAt: new Date(),
        status: 'pending',
        retryCount: 0,
    });

    console.log('[SyncQueue] Operation added:', id);

    // Intentar registrar sync si está disponible
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        try {
            await (registration as any).sync.register('sync-orders');
            console.log('[SyncQueue] Background sync registered');
        } catch (error) {
            console.log('[SyncQueue] Background sync not available');
        }
    }

    return id;
}

// Obtener operaciones pendientes
export async function getPendingOperations(): Promise<PendingOperation[]> {
    return syncDB.pendingOperations
        .where('status')
        .equals('pending')
        .toArray();
}

// Obtener todas las operaciones (para debug)
export async function getAllOperations(): Promise<PendingOperation[]> {
    return syncDB.pendingOperations.toArray();
}

// Marcar operación como completada
export async function markOperationComplete(id: number): Promise<void> {
    await syncDB.pendingOperations.delete(id);
    console.log('[SyncQueue] Operation completed:', id);
}

// Marcar operación como fallida
export async function markOperationFailed(id: number, error: string): Promise<void> {
    const operation = await syncDB.pendingOperations.get(id);
    if (operation) {
        await syncDB.pendingOperations.update(id, {
            status: operation.retryCount >= 3 ? 'failed' : 'pending',
            retryCount: operation.retryCount + 1,
            lastError: error,
        });
        console.log('[SyncQueue] Operation failed:', id, error);
    }
}

// Procesar cola de sincronización
export async function processSyncQueue(): Promise<{ success: number; failed: number }> {
    console.log('[SyncQueue] Processing queue...');

    const pendingOps = await getPendingOperations();
    let success = 0;
    let failed = 0;

    for (const op of pendingOps) {
        if (!op.id) continue;

        try {
            // Marcar como syncing
            await syncDB.pendingOperations.update(op.id, { status: 'syncing' });

            const response = await fetch(op.endpoint, {
                method: op.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: op.method !== 'GET' ? JSON.stringify(op.data) : undefined,
            });

            if (response.ok) {
                await markOperationComplete(op.id);
                success++;
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                await markOperationFailed(op.id, errorData.message || `HTTP ${response.status}`);
                failed++;
            }
        } catch (error) {
            await markOperationFailed(op.id, (error as Error).message);
            failed++;
        }
    }

    console.log(`[SyncQueue] Processed: ${success} success, ${failed} failed`);
    return { success, failed };
}

// Limpiar operaciones fallidas (después de X días)
export async function cleanupFailedOperations(daysOld: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await syncDB.pendingOperations
        .where('status')
        .equals('failed')
        .and((op) => op.createdAt < cutoffDate)
        .delete();
}

// Contar operaciones pendientes
export async function getPendingCount(): Promise<number> {
    return syncDB.pendingOperations
        .where('status')
        .equals('pending')
        .count();
}

export { syncDB };
