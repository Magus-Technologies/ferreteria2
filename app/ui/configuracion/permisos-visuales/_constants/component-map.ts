import { lazy } from 'react';

// Lazy load de vistas reales
const DashboardFE = lazy(() => import('~/app/ui/facturacion-electronica/page'));
const MisVentas = lazy(() => import('~/app/ui/facturacion-electronica/mis-ventas/page'));
const CrearVenta = lazy(() => import('~/app/ui/facturacion-electronica/mis-ventas/crear-venta/page'));
const MisGuias = lazy(() => import('~/app/ui/facturacion-electronica/mis-guias/page'));
const CrearGuia = lazy(() => import('~/app/ui/facturacion-electronica/mis-guias/crear-guia/page'));
const MisCotizaciones = lazy(() => import('~/app/ui/facturacion-electronica/mis-cotizaciones/page'));
const CrearCotizacion = lazy(() => import('~/app/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion/page'));
const CrearPrestamo = lazy(() => import('~/app/ui/facturacion-electronica/mis-prestamos/crear-prestamo/page'));
const MisPrestamos = lazy(() => import('~/app/ui/facturacion-electronica/mis-prestamos/page'));
const MisEntregas = lazy(() => import('~/app/ui/facturacion-electronica/mis-entregas/page'));
const MisNotasCredito = lazy(() => import('~/app/ui/facturacion-electronica/mis-notas-credito/page'));
const MisNotasDebito = lazy(() => import('~/app/ui/facturacion-electronica/mis-notas-debito/page'));
const CrearNotaCredito = lazy(() => import('~/app/ui/facturacion-electronica/crear-notas-electronicas/nota-credito/page'));
const CrearNotaDebito = lazy(() => import('~/app/ui/facturacion-electronica/crear-notas-electronicas/nota-debito/page'));
const MisContactos = lazy(() => import('~/app/ui/facturacion-electronica/mis-contactos/page'));
const MisAperturasCierres = lazy(() => import('~/app/ui/facturacion-electronica/mis-aperturas-cierres/page'));
const MovimientosCaja = lazy(() => import('~/app/ui/facturacion-electronica/movimientos-caja/page'));
const MisVales = lazy(() => import('~/app/ui/facturacion-electronica/vales-compra/page'));
const CrearVale = lazy(() => import('~/app/ui/facturacion-electronica/vales-compra/crear-vale/page'));
const HistorialVentas = lazy(() => import('~/app/ui/facturacion-electronica/mis-ventas/historial/page'));
const CalendarioEntregas = lazy(() => import('~/app/ui/facturacion-electronica/mis-ventas/calendario/page'));
const ArqueosDiarios = lazy(() => import('~/app/ui/facturacion-electronica/arqueos-diarios/page'));
const KardexFacturacion = lazy(() => import('~/app/ui/facturacion-electronica/mi-almacen/page'));
const DashboardGestionComercial = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/page'));
const CrearCompraGestionComercial = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/mis-compras/crear-compra/page'));
const MisComprasGestionComercial = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/mis-compras/page'));
const MiAlmacen = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/mi-almacen/page'));
const KardexInventario = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/kardex/page'));
const MisRecepciones = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/mis-recepciones/page'));
const MisTransferencias = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/mis-transferencias/page'));
const Cuadres = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/cuadres/page'));
const MisOrdenesDeCompra = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/mis-ordenes-de-compra/page'));
const CrearOrdenCompra = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/mis-ordenes-de-compra/crear-orden-compra/page'));
const MisOrdenesDeServicio = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/mis-ordenes-de-servicio/page'));
const SolicitudOrdenCompra = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/solicitud-orden-compra/page'));
const MisRequerimientosInternos = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/mis-requerimientos-internos/page'));
const MisProveedores = lazy(() => import('~/app/ui/gestion-comercial-e-inventario/mis-proveedores/page'));

// Gestión Contable y Financiera (solo vistas client; kardex-finanzas es server component
// y no se puede previsualizar aquí). cierre-caja: la PÁGINA es server component, pero su
// vista interna (CierreCajaView) sí es client, así que registramos la vista directamente.
const DashboardFinanzas = lazy(() => import('~/app/ui/gestion-contable-y-financiera/page'));
const CierreCajaView = lazy(() => import('~/app/ui/gestion-contable-y-financiera/cierre-caja/_components/cierre-caja-view'));
const KardexFinanzasView = lazy(() => import('~/app/ui/gestion-contable-y-financiera/kardex-finanzas/_components/kardex-finanzas-view'));
const MisIngresos = lazy(() => import('~/app/ui/gestion-contable-y-financiera/mis-ingresos/page'));
const MisGastos = lazy(() => import('~/app/ui/gestion-contable-y-financiera/mis-gastos/page'));
const MisGanancias = lazy(() => import('~/app/ui/gestion-contable-y-financiera/mis-ganancias/page'));
const VentasPorCobrar = lazy(() => import('~/app/ui/gestion-contable-y-financiera/ventas-por-cobrar/page'));
const ComprasPorPagar = lazy(() => import('~/app/ui/gestion-contable-y-financiera/compras-por-pagar/page'));
const Comisiones = lazy(() => import('~/app/ui/gestion-contable-y-financiera/comisiones/page'));
const GestionCajas = lazy(() => import('~/app/ui/gestion-contable-y-financiera/gestion-cajas/page'));
const MetodosPago = lazy(() => import('~/app/ui/gestion-contable-y-financiera/metodos-pago/page'));

// Reportes
const ReportesCategorias = lazy(() => import('~/app/ui/reportes/page'));
const ReportesVentas = lazy(() => import('~/app/ui/reportes/ventas/page'));
const ReportesCompras = lazy(() => import('~/app/ui/reportes/compras/page'));
const ReportesInventario = lazy(() => import('~/app/ui/reportes/inventario/page'));
const ReportesClientes = lazy(() => import('~/app/ui/reportes/clientes/page'));
const ReportesFinancieros = lazy(() => import('~/app/ui/reportes/financieros/page'));
const ReportesContables = lazy(() => import('~/app/ui/reportes/contables/page'));
const ReportesEntregas = lazy(() => import('~/app/ui/reportes/entregas/page'));
const ReportesGuias = lazy(() => import('~/app/ui/reportes/guias/page'));

// Configuración (permisos se omite: es esta misma página)
const ConfigUsuarios = lazy(() => import('~/app/ui/configuracion/usuarios/page'));
const ConfigMiEmpresa = lazy(() => import('~/app/ui/configuracion/mi-empresa/page'));
const ConfigRegistros = lazy(() => import('~/app/ui/configuracion/registros/page'));
const ConfigSeries = lazy(() => import('~/app/ui/configuracion/series/page'));
const ConfigImpresion = lazy(() => import('~/app/ui/configuracion/plantilla-impresion/page'));

export const COMPONENT_MAP: Partial<Record<string, React.LazyExoticComponent<any>>> = {
  'facturacion-electronica.dashboard.index': DashboardFE,
  'facturacion-electronica.mis-ventas.index': MisVentas,
  'facturacion-electronica.historial-ventas.index': HistorialVentas,
  'facturacion-electronica.crear-venta.index': CrearVenta,
  'facturacion-electronica.mis-entregas.index': MisEntregas,
  'facturacion-electronica.calendario-entregas.index': CalendarioEntregas,
  'facturacion-electronica.mis-guias.index': MisGuias,
  'facturacion-electronica.crear-guia.index': CrearGuia,
  'facturacion-electronica.mis-cotizaciones.index': MisCotizaciones,
  'facturacion-electronica.crear-cotizacion.index': CrearCotizacion,
  'facturacion-electronica.crear-prestamo.index': CrearPrestamo,
  'facturacion-electronica.crear-nota-credito.index': CrearNotaCredito,
  'facturacion-electronica.crear-nota-debito.index': CrearNotaDebito,
  'facturacion-electronica.mis-prestamos.index': MisPrestamos,
  'facturacion-electronica.mis-notas-credito.index': MisNotasCredito,
  'facturacion-electronica.mis-notas-debito.index': MisNotasDebito,
  'facturacion-electronica.mis-contactos.index': MisContactos,
  'facturacion-electronica.mis-aperturas-cierres.index': MisAperturasCierres,
  'facturacion-electronica.arqueos-diarios.index': ArqueosDiarios,
  'facturacion-electronica.movimientos-caja.index': MovimientosCaja,
  'facturacion-electronica.mis-vales.index': MisVales,
  'facturacion-electronica.crear-vale.index': CrearVale,
  'facturacion-electronica.mi-almacen.index': KardexFacturacion,
  'gestion-comercial-e-inventario.dashboard.index': DashboardGestionComercial,
  'gestion-comercial-e-inventario.crear-compra.index': CrearCompraGestionComercial,
  'gestion-comercial-e-inventario.mis-compras.index': MisComprasGestionComercial,
  'gestion-comercial-e-inventario.mi-almacen.index': MiAlmacen,
  'gestion-comercial-e-inventario.kardex.index': KardexInventario,
  'gestion-comercial-e-inventario.mis-recepciones.index': MisRecepciones,
  'gestion-comercial-e-inventario.mis-transferencias.index': MisTransferencias,
  'gestion-comercial-e-inventario.cuadres.index': Cuadres,
  'gestion-comercial-e-inventario.mis-ordenes-de-compra.index': MisOrdenesDeCompra,
  'gestion-comercial-e-inventario.crear-orden-compra.index': CrearOrdenCompra,
  'gestion-comercial-e-inventario.mis-ordenes-de-servicio.index': MisOrdenesDeServicio,
  'gestion-comercial-e-inventario.solicitud-orden-compra.index': SolicitudOrdenCompra,
  'gestion-comercial-e-inventario.mis-requerimientos-internos.index': MisRequerimientosInternos,
  // "Mis Proveedores" y el atajo "Crear Proveedor" navegan a la misma página de proveedores.
  // (producto.create se omite a propósito: abre un modal, no una página.)
  'proveedor.listado': MisProveedores,
  'proveedor.create': MisProveedores,
  // Gestión Contable y Financiera
  'gestion-contable-y-financiera.dashboard.index': DashboardFinanzas,
  'gestion-contable-y-financiera.mis-ingresos.index': MisIngresos,
  'gestion-contable-y-financiera.mis-gastos.index': MisGastos,
  'gestion-contable-y-financiera.mis-ganancias.index': MisGanancias,
  'gestion-contable-y-financiera.ventas-por-cobrar.index': VentasPorCobrar,
  'gestion-contable-y-financiera.compras-por-pagar.index': ComprasPorPagar,
  'gestion-contable-y-financiera.comisiones.index': Comisiones,
  'gestion-contable-y-financiera.gestion-cajas.index': GestionCajas,
  'gestion-contable-y-financiera.metodos-pago.index': MetodosPago,
  'gestion-contable-y-financiera.cierre-caja.index': CierreCajaView,
  'gestion-contable-y-financiera.kardex-finanzas.index': KardexFinanzasView,
  // "Cerrar Caja" en el nav de Facturación usa el permiso caja.update y apunta a la
  // misma vista de cierre de caja.
  'caja.update': CierreCajaView,
  // Reportes
  'reportes.index': ReportesCategorias,
  'reportes.ventas.index': ReportesVentas,
  'reportes.compras.index': ReportesCompras,
  'reportes.inventario.index': ReportesInventario,
  'reportes.clientes.index': ReportesClientes,
  'reportes.financieros.index': ReportesFinancieros,
  'reportes.contables.index': ReportesContables,
  'reportes.entregas.index': ReportesEntregas,
  'reportes.guias.index': ReportesGuias,
  // Configuración
  'configuracion.usuarios.index': ConfigUsuarios,
  'configuracion.empresa.index': ConfigMiEmpresa,
  'configuracion.registros.index': ConfigRegistros,
  'configuracion.series.index': ConfigSeries,
  'configuracion.impresion.index': ConfigImpresion,
};

/**
 * Fallback por ruta para vistas históricas que antes compartían permiso con otra
 * del nav. Se conserva para compatibilidad si llega un item antiguo.
 */
export const COMPONENT_MAP_BY_ROUTE: Partial<Record<string, React.LazyExoticComponent<any>>> = {
  '/ui/facturacion-electronica/mis-ventas/historial': HistorialVentas,
  '/ui/facturacion-electronica/mis-ventas/calendario': CalendarioEntregas,
  '/ui/facturacion-electronica/arqueos-diarios': ArqueosDiarios,
};

/**
 * Resuelve el componente de previsualización de un ítem del nav: primero por ruta
 * (vistas que comparten permiso) y, si no, por permiso (caso general).
 */
export function resolveVistaComponent(item: { permission?: string | null; route?: string | null }) {
  if (item.route && COMPONENT_MAP_BY_ROUTE[item.route]) return COMPONENT_MAP_BY_ROUTE[item.route];
  if (item.permission && COMPONENT_MAP[item.permission]) return COMPONENT_MAP[item.permission];
  return undefined;
}
