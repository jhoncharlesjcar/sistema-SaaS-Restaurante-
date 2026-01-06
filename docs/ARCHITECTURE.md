# 🏗️ Arquitectura del Sistema POS Offline-First

## Visión General

Este documento describe la arquitectura técnica del sistema POS offline-first, enfocándose especialmente en el mecanismo de sincronización bidireccional.

## Principios Arquitectónicos

### 1. **Offline-First**
- El frontend SIEMPRE escribe primero en IndexedDB (Dexie.js)
- La aplicación debe funcionar completamente sin conexión
- La sincronización es un proceso en segundo plano, no bloqueante

### 2. **Optimistic UI**
- Las operaciones se reflejan inmediatamente en la UI
- Si falla la sincronización, se marca para retry
- El usuario nunca espera por la red

### 3. **Event Sourcing Ligero**
- Cada cambio genera un evento en la cola de sincronización
- Los eventos se procesan en orden de prioridad
- Posibilidad de replay en caso de errores

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                     │
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   UI Layer   │◄────────│  TanStack    │                  │
│  │  (Shadcn/ui) │         │    Query     │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                        │                           │
│         │                        ▼                           │
│         │                 ┌──────────────┐                  │
│         └────────────────►│  Dexie.js    │                  │
│                           │  (IndexedDB) │                  │
│                           └──────┬───────┘                  │
│                                  │                           │
│                                  ▼                           │
│                           ┌──────────────┐                  │
│                           │ Sync Worker  │                  │
│                           │ (Background) │                  │
│                           └──────┬───────┘                  │
└──────────────────────────────────┼───────────────────────────┘
                                   │
                              HTTP/WebSocket
                                   │
┌──────────────────────────────────▼───────────────────────────┐
│                       BACKEND (NestJS)                        │
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ API Gateway  │────────►│   Business   │                  │
│  │   (REST)     │         │    Logic     │                  │
│  └──────────────┘         └──────┬───────┘                  │
│                                  │                           │
│                                  ▼                           │
│                           ┌──────────────┐                  │
│                           │  Supabase    │                  │
│                           │  Client      │                  │
│                           └──────┬───────┘                  │
└──────────────────────────────────┼───────────────────────────┘
                                   │
                                   ▼
                           ┌──────────────┐
                           │  PostgreSQL  │
                           │  (Supabase)  │
                           └──────────────┘
```

## Estrategia de Sincronización

### Fase 1: Escritura Local

```javascript
// 1. Usuario crea una orden
const newOrder = {
  id: uuid(),
  table_id: '...',
  items: [...],
  status: 'draft',
  created_at: new Date(),
  synced_at: null // ⚠️ Marca como NO sincronizado
};

// 2. Escribir en Dexie.js (INSTANTÁNEO)
await db.orders.add(newOrder);

// 3. UI se actualiza inmediatamente (Optimistic UI)
// El usuario puede seguir trabajando

// 4. Agregar a cola de sincronización
await db.syncQueue.add({
  table_name: 'orders',
  record_id: newOrder.id,
  operation: 'INSERT',
  data: newOrder,
  status: 'pending',
  priority: 50
});
```

### Fase 2: Sincronización en Background

```javascript
// Sync Worker (ejecuta cada X segundos o cuando vuelve conexión)
class SyncWorker {
  async syncPendingChanges() {
    // 1. Verificar conexión
    if (!navigator.onLine) return;

    // 2. Obtener cambios pendientes (ordenados por prioridad)
    const pendingChanges = await db.syncQueue
      .where('status').equals('pending')
      .sortBy('priority');

    // 3. Procesar en batch
    for (const change of pendingChanges) {
      try {
        // Enviar al backend
        const response = await apiClient.post('/sync', {
          table: change.table_name,
          operation: change.operation,
          data: change.data
        });

        // Marcar como sincronizado
        await db[change.table_name].update(change.record_id, {
          synced_at: new Date(),
          updated_at: response.data.updated_at
        });

        // Eliminar de la cola
        await db.syncQueue.delete(change.id);

      } catch (error) {
        // Incrementar retry counter
        await db.syncQueue.update(change.id, {
          retry_count: change.retry_count + 1,
          error_message: error.message,
          status: change.retry_count >= 3 ? 'failed' : 'pending'
        });
      }
    }
  }
}
```

### Fase 3: Resolución de Conflictos

```javascript
// Estrategia: Last Write Wins (LWW) con timestamps
async function resolveConflict(localRecord, serverRecord) {
  const localTimestamp = new Date(localRecord.updated_at);
  const serverTimestamp = new Date(serverRecord.updated_at);

  if (localTimestamp > serverTimestamp) {
    // Cambio local es más reciente → enviar al servidor
    return { action: 'PUSH', data: localRecord };
  } else if (serverTimestamp > localTimestamp) {
    // Cambio del servidor es más reciente → actualizar local
    return { action: 'PULL', data: serverRecord };
  } else {
    // Timestamps iguales → comparar checksum o marcar para revisión manual
    return { action: 'CONFLICT', localData: localRecord, serverData: serverRecord };
  }
}
```

## Schema de Dexie.js (IndexedDB)

```javascript
// db/schema.js
import Dexie from 'dexie';

export const db = new Dexie('POSDatabase');

db.version(1).stores({
  // Tablas principales (réplicas de Supabase)
  restaurants: 'id, name',
  users: 'id, email, restaurant_id',
  categories: 'id, restaurant_id, name',
  products: 'id, restaurant_id, category_id, name, is_available',
  tables: 'id, restaurant_id, table_number, status',
  orders: 'id, restaurant_id, table_id, status, created_at, synced_at',
  order_items: 'id, order_id, product_id, kitchen_status',
  invoices: 'id, restaurant_id, order_id, invoice_number',
  
  // Cola de sincronización
  syncQueue: '++id, status, priority, created_at, [status+priority]',
  
  // Metadatos
  syncMetadata: 'key'
});
```

## Endpoints del Backend

### Sincronización

```
POST /api/sync
Body: {
  table: "orders",
  operation: "INSERT" | "UPDATE" | "DELETE",
  data: { ... }
}
Response: {
  success: true,
  updated_at: "2026-01-04T20:00:00Z",
  conflicts: []
}
```

### Descarga Inicial (Primera Sincronización)

```
GET /api/sync/initial?restaurant_id=xxx&last_sync=2026-01-01T00:00:00Z
Response: {
  restaurants: [...],
  users: [...],
  products: [...],
  tables: [...],
  orders: [...],
  // Solo registros creados/modificados después de last_sync
}
```

### Check de Cambios

```
GET /api/sync/changes?restaurant_id=xxx&since=2026-01-04T19:00:00Z
Response: {
  changes: [
    { table: 'products', operation: 'UPDATE', record_id: '...', data: {...} },
    { table: 'orders', operation: 'INSERT', record_id: '...', data: {...} }
  ]
}
```

## Prioridades de Sincronización

```javascript
const SYNC_PRIORITIES = {
  // Alta prioridad (enviar primero)
  INVOICES: 10,        // Facturas deben ir a SUNAT cuanto antes
  PAYMENTS: 20,        // Pagos son críticos
  
  // Prioridad media
  ORDERS: 50,          // Órdenes son importantes pero pueden esperar
  ORDER_ITEMS: 60,
  
  // Baja prioridad
  PRODUCTS: 100,       // Cambios de menú pueden esperar
  TABLES: 110,
  CATEGORIES: 120
};
```

## Manejo de Estados Offline

```javascript
// Hook personalizado para detectar estado online/offline
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sincronización inmediata
      syncWorker.syncPendingChanges();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}
```

## Indicadores en UI

```jsx
function SyncStatus() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    // Contar items pendientes de sincronizar
    db.syncQueue.where('status').equals('pending').count()
      .then(setPendingCount);
  }, []);
  
  return (
    <div className="sync-indicator">
      {isOnline ? (
        <Badge variant="success">
          🟢 Conectado {pendingCount > 0 && `(${pendingCount} pendientes)`}
        </Badge>
      ) : (
        <Badge variant="warning">
          🔴 Modo Offline {pendingCount > 0 && `(${pendingCount} cambios)`}
        </Badge>
      )}
    </div>
  );
}
```

## Seguridad

### Autenticación
- JWT tokens almacenados en IndexedDB (encriptados)
- Refresh tokens para renovación automática
- Logout automático después de X tiempo offline

### Autorización
- Row Level Security (RLS) en Supabase para cada restaurante
- Los usuarios solo pueden acceder a datos de su restaurante
- Validación de permisos en el backend

### Encriptación
- Datos sensibles (contraseñas SUNAT) encriptados en Supabase
- Comunicación HTTPS/WSS obligatoria
- Sanitización de inputs para prevenir XSS/SQL Injection

## Performance

### Optimizaciones Clave
1. **Índices en IndexedDB**: Queries rápidas por restaurante, estado, fechas
2. **Lazy Loading**: Cargar productos/categorías bajo demanda
3. **Virtual Scrolling**: Para listados largos de órdenes
4. **Debouncing**: En búsquedas y filtros
5. **Service Worker**: Cache de assets estáticos (PWA)

## Próximos Pasos (Post-MVP)

1. **WebSockets**: Para actualizaciones en tiempo real (KDS)
2. **Delta Sync**: Solo enviar campos modificados, no todo el registro
3. **Compresión**: GZIP/Brotli para payloads grandes
4. **Multi-dispositivo**: Sincronización entre tablets/móviles del mismo restaurante
5. **Audit Log**: Historial de cambios para compliance

---

**Última actualización**: 2026-01-04  
**Versión**: 1.0.0
