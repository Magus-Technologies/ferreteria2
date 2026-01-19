# Mis Aperturas y Cierres de Caja

## Descripción
Vista para que los vendedores puedan consultar su historial de aperturas y cierres de caja.

## Características

### Historial de Aperturas
- Lista todas las aperturas de caja del usuario
- Muestra fecha, caja, monto de apertura y estado
- Paginación automática
- Filtros por fecha (próximamente)

### Historial de Cierres
- Lista todos los cierres de caja del usuario
- Muestra fecha de cierre, montos y estado
- Botón para ver detalles completos de cada cierre
- Modal con información detallada:
  - Totales por método de pago (efectivo, tarjeta, yape, etc.)
  - Cantidad de ventas, ingresos y egresos
  - Fechas de apertura y cierre
  - Montos de apertura y cierre

## Acceso
- Ruta: `/ui/facturacion-electronica/mis-aperturas-cierres`
- Accesible desde el dashboard de facturación electrónica mediante botón desplegable en la parte inferior
- Requiere permiso: `FACTURACION_ELECTRONICA_INDEX`

## Componentes
- `historial-aperturas.tsx` - Tabla de aperturas
- `historial-cierres.tsx` - Tabla de cierres con modal de detalles
- `page.tsx` - Página principal con tabs

## API Endpoints Utilizados
- `GET /cajas/historial` - Obtiene el historial de aperturas/cierres
- `GET /cajas/{id}/resumen-movimientos` - Obtiene detalles de movimientos de un cierre
