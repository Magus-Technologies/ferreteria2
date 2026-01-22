# 🔒 Sistema de Aprobación de Préstamos Entre Cajas

## 📋 Resumen

Se implementó un sistema de aprobación para préstamos entre cajas que soluciona el problema de seguridad donde un vendedor podía hacer préstamos falsos de otras cajas sin autorización.

## 🔐 Problema Resuelto

**Antes (Inseguro):**
- Vendedor A podía solicitar préstamo de la caja de Vendedor B
- El préstamo se ejecutaba inmediatamente sin confirmación
- Vendedor B no sabía que le habían sacado dinero de su caja

**Ahora (Seguro):**
- Vendedor A solicita préstamo → Queda en estado "pendiente_aprobacion"
- Vendedor B recibe notificación en tiempo real
- Vendedor B puede aprobar ✅ o rechazar ❌ la solicitud
- Solo si aprueba, el dinero se transfiere

## 🎯 Implementación

### Backend (Laravel)

#### 1. Migración
```php
// database/migrations/2026_01_21_015329_add_aprobacion_fields_to_prestamos_entre_cajas_table.php
- estado_aprobacion: 'pendiente_aprobacion' | 'aprobado' | 'rechazado'
- aprobado_por_id: Usuario que aprueba/rechaza
- fecha_aprobacion: Timestamp de aprobación/rechazo
- motivo_rechazo: Razón del rechazo (opcional)
```

#### 2. Modelo Actualizado
```php
// app/Models/PrestamoEntreCajas.php
- Agregados campos fillable
- Nueva relación: aprobadoPor()
- Cast de fecha_aprobacion
```

#### 3. Controlador
```php
// app/Http/Controllers/Cajas/PrestamoEntreCajasController.php

store()      → Crea solicitud (NO mueve dinero)
aprobar()    → Aprueba y ejecuta préstamo (mueve dinero)
rechazar()   → Rechaza solicitud
pendientes() → Lista solicitudes pendientes del usuario
devolver()   → Devuelve préstamo (solo si está aprobado)
```

#### 4. Rutas API
```php
GET  /api/cajas/prestamos              → Listar todos
GET  /api/cajas/prestamos/pendientes   → Pendientes de aprobación
POST /api/cajas/prestamos              → Crear solicitud
POST /api/cajas/prestamos/{id}/aprobar → Aprobar
POST /api/cajas/prestamos/{id}/rechazar → Rechazar
POST /api/cajas/prestamos/{id}/devolver → Devolver
```

### Frontend (Next.js + React)

#### 1. API Client
```typescript
// lib/api/transacciones-caja.ts
- Actualizada interfaz Prestamo con campos de aprobación
- Nuevos métodos:
  - getPrestamosPendientes()
  - aprobarPrestamo()
  - rechazarPrestamo()
```

#### 2. Hooks Personalizados
```typescript
// app/ui/facturacion-electronica/gestion-cajas/_hooks/

usePrestamosPendientes()  → Query con auto-refresh cada 30s
useAprobarPrestamo()      → Mutation para aprobar
useRechazarPrestamo()     → Mutation para rechazar
```

#### 3. Componentes UI

**NotificacionPrestamosPendientes**
- Icono de campana con badge de contador
- Popover con lista de solicitudes pendientes
- Auto-refresh cada 30 segundos
- Click en solicitud abre modal de detalles

**ModalAprobarPrestamo**
- Muestra detalles completos del préstamo
- Botones de aprobar/rechazar
- Campo opcional para motivo de rechazo
- Confirmaciones y toasts de éxito/error

**HistorialPrestamos (Actualizado)**
- Nueva columna "Aprobación" con estados
- Solo permite devolver préstamos aprobados
- Muestra estados: Pendiente Aprobación, Aprobado, Rechazado

## 🔄 Flujo Completo

### 1. Solicitud de Préstamo
```
Vendedor A (necesita dinero):
1. Va a "Gestión de Cajas"
2. Selecciona "Solicitar Préstamo"
3. Elige:
   - Caja origen (de otro vendedor)
   - Caja destino (su caja)
   - Monto
   - Motivo (opcional)
4. Envía solicitud
5. Estado: "pendiente_aprobacion"
6. ⚠️ El dinero NO se mueve aún
```

### 2. Notificación
```
Vendedor B (dueño de la caja origen):
1. Ve badge rojo en icono de campana (🔔 1)
2. Recibe notificación en tiempo real
3. Auto-refresh cada 30 segundos
```

### 3. Revisión y Decisión
```
Vendedor B:
1. Click en campana → Ve lista de solicitudes
2. Click en solicitud → Abre modal con detalles:
   - Monto solicitado
   - Quién solicita
   - De qué caja / Para qué caja
   - Motivo
   - Fecha y hora
3. Decide:
   
   OPCIÓN A - APROBAR:
   - Click en "Aprobar Préstamo"
   - ✅ Dinero se transfiere inmediatamente
   - Estado: "aprobado"
   - Vendedor A recibe el dinero
   
   OPCIÓN B - RECHAZAR:
   - Click en "Rechazar"
   - Puede agregar motivo (opcional)
   - Click en "Confirmar Rechazo"
   - ❌ No se mueve dinero
   - Estado: "rechazado"
   - Vendedor A ve que fue rechazado
```

### 4. Devolución (Solo si fue aprobado)
```
Vendedor A (cuando tenga el dinero):
1. Va a "Historial de Préstamos"
2. Encuentra el préstamo aprobado
3. Click en "Devolver"
4. Confirma devolución
5. Dinero regresa a la caja origen
6. Estado: "devuelto"
```

## 📊 Estados del Préstamo

| Estado Préstamo | Estado Aprobación | Descripción | Acciones Disponibles |
|----------------|-------------------|-------------|---------------------|
| pendiente | pendiente_aprobacion | Esperando aprobación | Aprobar / Rechazar |
| pendiente | aprobado | Aprobado, dinero transferido | Devolver |
| devuelto | aprobado | Ya fue devuelto | Ninguna |
| cancelado | rechazado | Fue rechazado | Ninguna |

## 🎨 Integración en la UI

### Opción 1: Navbar Global
```tsx
import { NotificacionPrestamosPendientes } from '~/app/ui/facturacion-electronica/gestion-cajas/_components/notificacion-prestamos-pendientes'

<nav>
  <NotificacionPrestamosPendientes />
</nav>
```

### Opción 2: Layout de Facturación
```tsx
<header>
  <h1>Facturación Electrónica</h1>
  <NotificacionPrestamosPendientes />
</header>
```

### Opción 3: Página de Gestión de Cajas
```tsx
<div className="flex justify-between">
  <h1>Gestión de Cajas</h1>
  <NotificacionPrestamosPendientes />
</div>
```

## ✅ Características Implementadas

- ✅ Sistema de aprobación de dos pasos
- ✅ Notificaciones en tiempo real (auto-refresh 30s)
- ✅ Badge con contador de solicitudes pendientes
- ✅ Modal con detalles completos del préstamo
- ✅ Botones de aprobar/rechazar con confirmación
- ✅ Campo opcional para motivo de rechazo
- ✅ Validación de permisos (solo el dueño puede aprobar)
- ✅ Validación de saldo antes de aprobar
- ✅ Toasts de éxito/error
- ✅ Invalidación automática de queries
- ✅ Historial actualizado con estados de aprobación
- ✅ Solo permite devolver préstamos aprobados

## 🔒 Seguridad

1. **Validación de Permisos**: Solo el dueño de la caja origen puede aprobar/rechazar
2. **Validación de Saldo**: Se verifica saldo antes de aprobar
3. **Estados Inmutables**: Una vez aprobado/rechazado, no se puede cambiar
4. **Transacciones Atómicas**: Todo se ejecuta en transacciones de BD
5. **Auditoría Completa**: Se registra quién aprobó/rechazó y cuándo

## 📝 Notas Importantes

- El dinero NO se mueve hasta que el préstamo sea aprobado
- Las notificaciones se actualizan automáticamente cada 30 segundos
- Solo el dueño de la caja origen puede aprobar/rechazar
- Una vez aprobado/rechazado, no se puede cambiar la decisión
- Solo se pueden devolver préstamos que estén aprobados
- El motivo de rechazo es opcional pero recomendado

## 🚀 Próximos Pasos (Opcional)

- [ ] Notificaciones push en tiempo real (WebSockets)
- [ ] Email/SMS cuando se solicita un préstamo
- [ ] Historial de notificaciones leídas/no leídas
- [ ] Filtros en historial por estado de aprobación
- [ ] Dashboard con estadísticas de préstamos
- [ ] Límites de monto para préstamos sin aprobación
