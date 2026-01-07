# ⚡ Quick Start - Sistema de Productos

## 🚀 Iniciar en 3 pasos

### Paso 1: Variables de Entorno

Crear `apps/frontend/.env`:
```env
VITE_SUPABASE_URL=https://zmtkoxgzqzqxvwdlfhhz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3000/api
```

Crear `apps/backend/.env`:
```env
SUPABASE_URL=https://zmtkoxgzqzqxvwdlfhhz.supabase.co
SUPABASE_SERVICE_KEY=...
CORS_ORIGIN=http://localhost:5173
PORT=3000
```

### Paso 2: Ejecutar Backend y Frontend

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm install
npm run dev
```

### Paso 3: Testing

1. Ir a http://localhost:5173/login
2. Ingresar credenciales válidas
3. Navegar a http://localhost:5173/productos
4. Abrir Console (F12) - Buscar logs "ProductList Debug"

## ✅ Verificación

Si ves esto en Console, todo funciona:

```javascript
📦 ProductList Debug: {
  isAuthenticated: true,
  user: { id: "...", restaurant_id: "..." },
  isLoading: false,
  isFetching: false,
  productsCount: 0 or n,
  error: null
}
```

## 📊 Si no hay productos

1. Ir a Supabase Dashboard → SQL Editor
2. Ejecutar el SQL en `docs/TESTING_PRODUCTS.md` sección "Test 4"
3. Recargar página (F5)

## 🐛 Debugging

**Console Logs Útiles:**
- `Auth:` - Mensajes de autenticación
- `ProductList Debug:` - Estado del componente
- `[REQUEST]` - Llamadas HTTP desde backend

**Network Tab:**
- Filtrar por "XHR"
- Ver requests a `/api/products`

## 📞 Errores Comunes

| Problema | Solución |
|----------|----------|
| "No autenticado" | Hacer logout y volver a login |
| "VITE_API_URL undefined" | Crear archivo .env |
| "CORS error" | Verificar CORS_ORIGIN en backend |
| "404 Not Found" | Backend no está corriendo |

## 🎯 Qué ver en la pantalla

✅ **En /productos:**
- Título: "Productos"
- Subtítulo: "Gestiona tu menú y precios"
- Si hay productos: Grid de tarjetas (cards)
- Si no hay: Mensaje "No hay productos"

## 🔗 URLs

| URL | Descripción |
|-----|-------------|
| http://localhost:5173 | Frontend main |
| http://localhost:5173/login | Login page |
| http://localhost:5173/productos | Products page |
| http://localhost:3000/api | Backend API |
| http://localhost:3000/api/products | API Products |

## 📚 Documentación Completa

- `docs/STATUS_PRODUCTS.md` - Estado técnico detallado
- `docs/TESTING_PRODUCTS.md` - Checklist completo
- `docs/IMPLEMENTATION_SUMMARY.md` - Resumen de cambios

---

**¿Todo funcionando?** ✅ Listo para desarrollo
