# 🍽️ Sistema POS Offline-First para Restaurantes

Sistema de gestión para restaurantes (POS/Comandas) con soporte **100% offline** y sincronización inteligente.

## 🎯 Características Principales

- ✅ **Offline-First**: Funciona completamente sin conexión a internet
- 🔄 **Sincronización Automática**: Manejo inteligente de conflictos
- 🧾 **Facturación Electrónica**: Integración con SUNAT (Perú)
- 👨‍🍳 **KDS**: Kitchen Display System en tiempo real
- 📱 **PWA**: Instalable como app nativa

## 🏗️ Stack Tecnológico

### Backend
- **NestJS** - Framework Node.js para lógica de negocio
- **Supabase** - Base de datos PostgreSQL + Auth

### Frontend
- **React 18** - Librería UI
- **Vite** - Build tool y dev server
- **TanStack Query** - Gestión de estado del servidor
- **Dexie.js** - Wrapper de IndexedDB para almacenamiento local
- **Tailwind CSS** - Estilos utilitarios
- **Shadcn/ui** - Componentes UI

## 📁 Estructura del Proyecto

```
pos-offline-first/
├── apps/
│   ├── backend/          # API NestJS
│   │   ├── src/
│   │   │   ├── modules/  # Módulos de negocio
│   │   │   ├── common/   # Utilidades compartidas
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── frontend/         # App React + Vite
│       ├── src/
│       │   ├── components/  # Componentes UI
│       │   ├── features/    # Módulos por funcionalidad
│       │   ├── lib/         # Utilidades
│       │   ├── db/          # Dexie.js config
│       │   └── App.tsx
│       └── package.json
│
├── supabase/
│   ├── migrations/       # Scripts SQL
│   └── seed.sql         # Datos de prueba
│
├── docs/                # Documentación
└── package.json         # Workspace root
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js >= 18
- npm >= 9
- Cuenta en Supabase

### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>

# Instalar dependencias (en la raíz del monorepo)
npm install

# Configurar variables de entorno
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Ejecutar migraciones en Supabase
# (Copiar el contenido de supabase/migrations/001_initial_schema.sql)

# Iniciar en modo desarrollo
npm run dev
```

Esto iniciará:
- Backend en `http://localhost:3000`
- Frontend en `http://localhost:5173`

## 🗄️ Base de Datos

El sistema utiliza PostgreSQL (Supabase) con las siguientes tablas principales:

- `users` - Usuarios del sistema
- `restaurants` - Datos del restaurante
- `tables` - Mesas del restaurante
- `products` - Productos/platos del menú
- `categories` - Categorías de productos
- `orders` - Órdenes/comandas
- `order_items` - Detalle de items por orden
- `invoices` - Facturas electrónicas

Cada tabla incluye campos de auditoría:
- `created_at` - Fecha de creación
- `updated_at` - Última modificación  
- `synced_at` - Última sincronización offline

## 📱 Arquitectura Offline-First

1. **Escritura Local**: Todas las operaciones se escriben primero en Dexie.js (IndexedDB)
2. **Optimistic UI**: La UI se actualiza inmediatamente
3. **Cola de Sincronización**: Un worker en segundo plano sincroniza con el backend
4. **Resolución de Conflictos**: Timestamps + estrategia "last-write-wins" con fallback manual

## 📝 Licencia

Propietario - Todos los derechos reservados
