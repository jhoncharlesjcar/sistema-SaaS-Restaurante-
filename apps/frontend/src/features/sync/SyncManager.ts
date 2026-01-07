import { db, SyncQueueItem } from '@/db/schema';
import { toast } from 'sonner';

type QueueOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export class SyncManager {
    private static instance: SyncManager;
    private isSyncing = false;
    private online = navigator.onLine;

    private constructor() {
        this.setupListeners();
    }

    public static getInstance(): SyncManager {
        if (!SyncManager.instance) {
            SyncManager.instance = new SyncManager();
        }
        return SyncManager.instance;
    }

    private setupListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Conexión restaurada. Iniciando sincronización...');
            this.online = true;
            toast.success('Conexión restaurada. Sincronizando datos...');
            this.processQueue();
        });

        window.addEventListener('offline', () => {
            console.log('🔌 Conexión perdida. Modo Offline activado.');
            this.online = false;
            toast.warning('Sin conexión. Los cambios se guardarán localmente.');
        });
    }

    public async enqueueOperation(
        tableName: string,
        operation: QueueOperation,
        data: any,
        recordId: string = crypto.randomUUID()
    ) {
        try {
            // 1. Guardar en tabla local (optimistic UI)
            // Esto asume que el llamador ya guardó en la tabla local correspondiente
            // si no, deberíamos hacerlo aquí también.
            // Por ahora, asumimos que el llamador maneja la persistencia local de datos
            // y solo usamos esto para la cola de sincronización.

            // 2. Agregar a cola de sincronización
            await db.syncQueue.add({
                restaurant_id: data.restaurant_id || 'unknown',
                table_name: tableName,
                record_id: recordId,
                operation,
                data,
                status: 'pending',
                retry_count: 0,
                created_at: new Date(),
                priority: 1 // Default priority
            });

            console.log(`📝 Operación encolada: ${operation} ${tableName}`);

            // 3. Intentar sincronizar si hay conexión
            if (this.online) {
                this.processQueue();
            }
        } catch (error) {
            console.error('Error al encolar operación:', error);
            toast.error('Error al guardar datos localmente');
        }
    }

    public async processQueue() {
        if (this.isSyncing || !this.online) return;

        this.isSyncing = true;
        let processedCount = 0;
        let errorCount = 0;

        try {
            // Obtener items pendientes ordenados por prioridad y fecha
            const pendingItems = await db.syncQueue
                .where('status')
                .equals('pending')
                .sortBy('created_at');

            if (pendingItems.length === 0) {
                this.isSyncing = false;
                return;
            }

            console.log(`🔄 Iniciando sincronización de ${pendingItems.length} items...`);

            for (const item of pendingItems) {
                try {
                    await this.syncItem(item);
                    processedCount++;

                    // Marcar como procesado
                    await db.syncQueue.update(item.id!, {
                        status: 'completed',
                        processed_at: new Date()
                    });

                    // Opcional: Eliminar items completados para no llenar la BD
                    // await db.syncQueue.delete(item.id!);

                } catch (error) {
                    console.error(`❌ Error sincronizando item ${item.id}:`, error);
                    errorCount++;

                    // Actualizar retry count o marcar como fallido
                    if (item.retry_count >= 3) {
                        await db.syncQueue.update(item.id!, {
                            status: 'failed',
                            error_message: String(error)
                        });
                    } else {
                        await db.syncQueue.update(item.id!, {
                            retry_count: item.retry_count + 1
                        });
                    }
                }
            }

            if (processedCount > 0) {
                toast.success(`${processedCount} cambios sincronizados correctamente`);
            }
            if (errorCount > 0) {
                toast.error(`${errorCount} cambios no se pudieron sincronizar`);
            }

        } catch (error) {
            console.error('Error fatal en proceso de sincronización:', error);
        } finally {
            this.isSyncing = false;
            // Si quedaron pendientes (por error transitorio), reintentar en un momento?
            // Por ahora dejamos que el próximo evento online o llamada manual lo trigger
        }
    }

    private async syncItem(item: SyncQueueItem) {
        const API_URL = import.meta.env.VITE_API_URL;
        const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());

        if (!session?.access_token) {
            throw new Error('No hay sesión activa para sincronizar');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };

        let endpoint = '';
        let method = '';

        // Mapeo básico de tablas a endpoints
        switch (item.table_name) {
            case 'orders':
                endpoint = `${API_URL}/orders`;
                break;
            case 'products':
                endpoint = `${API_URL}/products`;
                break;
            // Agregar otros casos según sea necesario
            default:
                throw new Error(`Tabla no soportada para sincronización: ${item.table_name}`);
        }

        // Ajustar endpoint y método según operación
        if (item.operation === 'INSERT') {
            method = 'POST';
        } else if (item.operation === 'UPDATE') {
            method = 'PATCH';
            endpoint += `/${item.record_id}`;
        } else if (item.operation === 'DELETE') {
            method = 'DELETE';
            endpoint += `/${item.record_id}`;
        }

        console.log(`📡 Enviando ${method} a ${endpoint}`);

        const response = await fetch(endpoint, {
            method,
            headers,
            body: item.operation !== 'DELETE' ? JSON.stringify(item.data) : undefined
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error del servidor (${response.status}): ${errorText}`);
        }

        return response.json();
    }
}

export const syncManager = SyncManager.getInstance();
