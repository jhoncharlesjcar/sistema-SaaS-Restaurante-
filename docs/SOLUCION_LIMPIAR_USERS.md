# 🔧 SOLUCIÓN: Limpiar Supabase para Login Correcto

## El Problema Real

El error "Fallo en la auto-provisión" ocurre porque:

```
Supabase Auth UUID: f229806d-d851-45e0-a55b-9859778714c4  (aleatorio generado)
    ≠
Tabla users UUID:  00000000-0000-0000-0000-000000000001   (fijo en seed)
```

El seed.sql insertó usuarios con IDs fijos, pero Supabase Auth genera IDs propios. El backend intenta actualizar/crear con el ID incorrecto.

---

## ✅ SOLUCIÓN RÁPIDA: Limpiar la tabla users

### Paso 1: Ir a Supabase SQL Editor

1. Abre https://supabase.com/dashboard
2. Selecciona tu proyecto `pos-offline-first`
3. Ve a **SQL Editor** (menú izquierdo)

### Paso 2: Ejecutar Query para Limpiar

Copia y pega esto en el SQL Editor:

```sql
-- Limpiar tabla users (sin borrar la estructura)
TRUNCATE users CASCADE;

-- Si prefieres ser más específico:
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM invoices;
DELETE FROM users;
DELETE FROM restaurants;
```

### Paso 3: Ejecutar

- Haz clic en el botón **"Run"** o presiona **F5**

Espera a que se complete (debería decir "Rows affected: X")

---

## 🧪 Probar Login Nuevamente

Una vez limpiada la tabla:

1. Abre http://localhost:5173
2. Login con:
   - Email: `admin@demo.com`
   - Contraseña: `DemoPass123!@#`

### Qué sucederá:

```
1. Supabase Auth valida credenciales ✅
2. Retorna UUID: f229806d-d851-45e0-a55b-9859778714c4
3. Backend busca usuario en tabla users → NO EXISTE
4. Backend crea automáticamente:
   - ID: f229806d-d851-45e0-a55b-9859778714c4 (correcto)
   - Email: admin@demo.com
   - Restaurante: Demo Restaurant
5. ✅ LOGIN EXITOSO
```

---

## 📌 Por Qué Pasó Esto

El proyeccto usa JIT (Just-In-Time) Provisioning:
- Los usuarios se crean automáticamente al primer login
- Pero el seed.sql pre-creó usuarios con IDs fijos que no coinciden
- Generó conflicto

**La solución correcta**: Limpiar y dejar que JIT cree los usuarios con los IDs correctos de Auth.

---

## ⚠️ Alternativa (Sin Limpiar)

Si NO quieres limpiar:

1. Obtener el UUID real de `admin@demo.com` en Supabase Auth
2. Actualizar manualmente en SQL:

```sql
UPDATE users 
SET id = '[UUID_REAL_DE_AUTH]'
WHERE email = 'admin@demo.com';
```

Pero **recomendamos limpiar** - es más simple.

---

## 🎯 Resumen

- **Problema**: IDs no coinciden
- **Solución**: `TRUNCATE users CASCADE;`
- **Tiempo**: 1 minuto
- **Resultado**: Login funcional
