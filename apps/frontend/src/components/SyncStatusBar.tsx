import { useEffect, useRef } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useNotifications } from '../hooks/useNotifications';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function SyncStatusBar() {
    const {
        isOnline,
        isSyncing,
        pendingCount,
        lastSyncResult,
        syncNow
    } = useOfflineSync();

    const { success, error, warning } = useNotifications();
    const prevOnline = useRef(isOnline);
    const prevSyncResult = useRef(lastSyncResult);

    // Notify on connection change
    useEffect(() => {
        if (prevOnline.current !== isOnline) {
            if (isOnline) {
                success('Conexión restaurada', 'Ahora estás online');
            } else {
                warning('Sin conexión', 'Trabajando en modo offline');
            }
            prevOnline.current = isOnline;
        }
    }, [isOnline, success, warning]);

    // Notify on sync completion
    useEffect(() => {
        if (lastSyncResult && lastSyncResult !== prevSyncResult.current) {
            if (lastSyncResult.success > 0) {
                success(`${lastSyncResult.success} elementos sincronizados`);
            }
            if (lastSyncResult.failed > 0) {
                error(`${lastSyncResult.failed} errores en la sincronización`);
            }
            prevSyncResult.current = lastSyncResult;
        }
    }, [lastSyncResult, success, error]);

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-lg px-4 py-2 border">
            {/* Estado de conexión */}
            <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                <span className="text-sm font-medium">
                    {isOnline ? 'Conectado' : 'Sin conexión'}
                </span>
            </div>

            {/* Operaciones pendientes */}
            {pendingCount > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                </Badge>
            )}

            {/* Botón de sincronización */}
            {pendingCount > 0 && isOnline && (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={syncNow}
                    disabled={isSyncing}
                    className="text-xs"
                >
                    {isSyncing ? (
                        <>
                            <span className="animate-spin mr-1">⟳</span> Sincronizando...
                        </>
                    ) : (
                        <>🔄 Sincronizar</>
                    )}
                </Button>
            )}

            {/* Resultado de última sincronización */}
            {lastSyncResult && lastSyncResult.success > 0 && (
                <span className="text-xs text-green-600">
                    ✓ {lastSyncResult.success} sincronizado{lastSyncResult.success > 1 ? 's' : ''}
                </span>
            )}
        </div>
    );
}
