# 🔔 Integración de Notificaciones de Préstamos Pendientes

## Componentes Creados

1. **NotificacionPrestamosPendientes** - Icono de campana con badge de notificaciones
2. **ModalAprobarPrestamo** - Modal para aprobar/rechazar préstamos
3. **Hooks**:
   - `usePrestamosPendientes()` - Obtiene préstamos pendientes (auto-refresh cada 30s)
   - `useAprobarPrestamo()` - Aprueba un préstamo
   - `useRechazarPrestamo()` - Rechaza un préstamo

## Cómo Integrar

### Opción 1: En el Navbar/Header

Agrega el componente en tu navbar o header principal:

```tsx
import { NotificacionPrestamosPendientes } from '~/app/ui/facturacion-electronica/gestion-cajas/_components/notificacion-prestamos-pendientes'

export function Navbar() {
  return (
    <nav className="flex items-center justify-between">
      {/* ... otros elementos del navbar ... */}
      
      <div className="flex items-center gap-2">
        {/* Notificaciones de préstamos */}
        <NotificacionPrestamosPendientes />
        
        {/* ... otros iconos/botones ... */}
      </div>
    </nav>
  )
}
```

### Opción 2: En el Layout de Facturación Electrónica

Si tienes un layout específico para facturación electrónica:

```tsx
// app/ui/facturacion-electronica/layout.tsx
import { NotificacionPrestamosPendientes } from './gestion-cajas/_components/notificacion-prestamos-pendientes'

export default function FacturacionElectronicaLayout({ children }) {
  return (
    <div>
      <header className="flex items-center justify-between p-4">
        <h1>Facturación Electrónica</h1>
        <NotificacionPrestamosPendientes />
      </header>
      {children}
    </div>
  )
}
```

### Opción 3: En la Página de Gestión de Cajas

```tsx
// app/ui/facturacion-electronica/gestion-cajas/page.tsx
import { NotificacionPrestamosPendientes } from './_components/notificacion-prestamos-pendientes'

export default function GestionCajasPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1>Gestión de Cajas</h1>
        <NotificacionPrestamosPendientes />
      </div>
      {/* ... resto del contenido ... */}
    </div>
  )
}
```

## Flujo de Usuario

1. **Vendedor A** solicita préstamo de la caja de **Vendedor B**
2. **Vendedor B** ve una notificación en el icono de campana (badge rojo con número)
3. **Vendedor B** hace clic en la campana y ve la lista de solicitudes pendientes
4. **Vendedor B** hace clic en una solicitud para ver los detalles
5. **Vendedor B** puede:
   - ✅ **Aprobar** → El dinero se transfiere inmediatamente
   - ❌ **Rechazar** → Puede agregar un motivo opcional

## Características

- ✅ Auto-refresh cada 30 segundos
- ✅ Badge con contador de notificaciones
- ✅ Lista de préstamos pendientes en popover
- ✅ Modal con detalles completos del préstamo
- ✅ Botones de aprobar/rechazar con confirmación
- ✅ Campo opcional para motivo de rechazo
- ✅ Toasts de éxito/error
- ✅ Invalidación automática de queries después de aprobar/rechazar

## Estilos

El componente usa los componentes de shadcn/ui:
- `Button`
- `Badge`
- `Popover`
- `Dialog`
- `Textarea`
- `Label`

Todos los estilos son consistentes con el diseño existente de la aplicación.
