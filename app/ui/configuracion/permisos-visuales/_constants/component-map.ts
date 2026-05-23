import { lazy } from 'react';

// Lazy load de vistas reales
const DashboardFE = lazy(() => import('~/app/ui/facturacion-electronica/page'));
const MisVentas = lazy(() => import('~/app/ui/facturacion-electronica/mis-ventas/page'));
const CrearVenta = lazy(() => import('~/app/ui/facturacion-electronica/mis-ventas/crear-venta/page'));
const MisGuias = lazy(() => import('~/app/ui/facturacion-electronica/mis-guias/page'));
const MisCotizaciones = lazy(() => import('~/app/ui/facturacion-electronica/mis-cotizaciones/page'));
const CrearCotizacion = lazy(() => import('~/app/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion/page'));
const CrearPrestamo = lazy(() => import('~/app/ui/facturacion-electronica/mis-prestamos/crear-prestamo/page'));
const MisPrestamos = lazy(() => import('~/app/ui/facturacion-electronica/mis-prestamos/page'));
const MisEntregas = lazy(() => import('~/app/ui/facturacion-electronica/mis-entregas/page'));
const DashboardGestionComercial = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/page'));
const CrearCompraGestionComercial = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/mis-compras/crear-compra/page'));
const MisComprasGestionComercial = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/mis-compras/page'));

export const COMPONENT_MAP: Partial<Record<string, React.LazyExoticComponent<any>>> = {
  'facturacion-electronica.dashboard.index': DashboardFE,
  'facturacion-electronica.mis-ventas.index': MisVentas,
  'facturacion-electronica.crear-venta.index': CrearVenta,
  'facturacion-electronica.mis-entregas.index': MisEntregas,
  'facturacion-electronica.mis-guias.index': MisGuias,
  'facturacion-electronica.mis-cotizaciones.index': MisCotizaciones,
  'facturacion-electronica.crear-cotizacion.index': CrearCotizacion,
  'facturacion-electronica.crear-prestamo.index': CrearPrestamo,
  'facturacion-electronica.mis-prestamos.index': MisPrestamos,
  'gestion-comercial-e-inventario.dashboard.index': DashboardGestionComercial,
  'gestion-comercial-e-inventario.crear-compra.index': CrearCompraGestionComercial,
  'gestion-comercial-e-inventario.mis-compras.index': MisComprasGestionComercial,
};