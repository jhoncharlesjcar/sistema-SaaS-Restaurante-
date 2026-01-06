# 🚀 Guía de Configuración - Instalación Completada

## ✅ Estado Actual

La estructura del proyecto y las dependencias han sido instaladas exitosamente.

## 📋 Próximos Pasos para Completar la Configuración

### 1. Configurar Supabase

#### A. Crear Proyecto en Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto:
   - **Organization**: Elige o crea una organización
   - **Project Name**: `pos-offline-first` (o el nombre que prefieras)
   - **Database Password**: Guarda esta contraseña de forma segura
   - **Region**: Selecciona la región más cercana a Perú (ej: `South America (São Paulo)`)

#### B. Ejecutar Migraciones SQL
1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Crea una nueva query
3. Copia y pega el contenido completo de:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
4. Ejecuta el script (botón "Run" o F5)
5. Verifica que se crearon las 9 tablas en **Table Editor**:
   - users
   - restaurants
   - categories
   - products
   - tables
   - orders
   - order_items
   - invoices
   - sync_queue

#### C. (Opcional) Cargar Datos de Prueba
1. En **SQL Editor**, crea otra query
2. Copia y pega el contenido de:
   ```
   supabase/seed.sql
   ```
3. Ejecuta el script
4. Verifica en **Table Editor** que hay datos de prueba

#### D. Obtener Credenciales
1. Ve a **Settings** → **API**
2. Copia las siguientes credenciales:
   - **Project URL** (ejemplo: `https://abcdefgh.supabase.co`)
   - **anon/public key** (comienza con `eyJ...`)
   - **service_role key** (comienza con `eyJ...`) ⚠️ **NUNCA la expongas en el frontend**

### 2. Configurar Variables de Entorno

Los archivos `.env` ya han sido creados a partir de los ejemplos. Ahora debes editarlos:

#### Backend: `apps/backend/.env`
```bash
# Environment
NODE_ENV=development

# Server
PORT=3000

# Supabase
SUPABASE_URL=https://TU-PROJECT-ID.supabase.co
SUPABASE_ANON_KEY=eyJ...tu-anon-key-aqui...
SUPABASE_SERVICE_ROLE_KEY=eyJ...tu-service-role-key-aqui...

# JWT (para auth personalizada si la necesitas)
JWT_SECRET=cambia-esto-por-un-secret-aleatorio

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### Frontend: `apps/frontend/.env`
```bash
# Supabase
VITE_SUPABASE_URL=https://TU-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu-anon-key-aqui...

# Backend API
VITE_API_URL=http://localhost:3000/api
```

### 3. Instalar Dependencia Faltante (Tailwind Animate)

El frontend requiere el plugin `tailwindcss-animate` para Shadcn/ui:

```bash
cd apps/frontend
npm install -D tailwindcss-animate
cd ../..
```

### 4. Iniciar el Proyecto

Una vez configuradas las variables de entorno, puedes iniciar el proyecto:

#### Opción A: Iniciar Backend y Frontend Simultáneamente
```bash
npm run dev
```

Esto iniciará:
- **Backend**: http://localhost:3000/api
- **Frontend**: http://localhost:5173

#### Opción B: Iniciar por Separado

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

### 5. Verificar la Instalación

#### Backend
1. Abre http://localhost:3000/api
2. No debería mostrar errores de conexión a Supabase

#### Frontend
1. Abre http://localhost:5173
2. Deberías ver el mensaje de "Bienvenido al sistema POS"
3. El indicador de conexión (esquina superior derecha) debe mostrar "🟢 Conectado"
4. Abre **DevTools** → **Application** → **IndexedDB**
5. Verifica que se creó la base de datos `POSDatabase`

### 6. Probar Modo Offline

1. Con el frontend abierto, abre DevTools
2. Ve a la pestaña **Network**
3. Activa el modo **Offline**
4. El indicador debe cambiar a "🔴 Modo Offline"
5. La aplicación debe seguir funcionando sin errores JavaScript

## 🔧 Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que los archivos `.env` existen y tienen las credenciales correctas
- Las variables del frontend deben tener prefijo `VITE_`
- Reinicia el servidor después de modificar variables de entorno

### Error: "Cannot find module '@nestjs/core'"
- Ejecuta `npm install` en la raíz del proyecto nuevamente
- Si persiste, elimina `node_modules` y `package-lock.json`, luego ejecuta `npm install`

### Frontend no carga / Pantalla blanca
- Verifica la consola del navegador (F12)
- Asegúrate de que las variables de entorno en `apps/frontend/.env` estén correctas
- Verifica que el plugin `tailwindcss-animate` esté instalado

### Error de CORS en el Frontend
- Verifica que `CORS_ORIGIN` en `apps/backend/.env` coincida con la URL del frontend
- Por defecto debe ser `http://localhost:5173`

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Vite Documentation](https://vitejs.dev)
- [Dexie.js Guide](https://dexie.org)
- [Arquitectura del Proyecto](./ARCHITECTURE.md)

## ✨ ¡Listo para Desarrollar!

Una vez completados estos pasos, tendrás:
- ✅ Base de datos PostgreSQL en Supabase
- ✅ Backend NestJS conectado a Supabase
- ✅ Frontend React con PWA habilitado
- ✅ Almacenamiento offline con IndexedDB
- ✅ Sincronización automática configurada

Ahora puedes comenzar a desarrollar los módulos de negocio (productos, órdenes, mesas, etc.).
