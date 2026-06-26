import type { Accion } from '../_types';

export const ACCIONES: Accion[] = ['crear', 'editar', 'eliminar'];

export const ACCION_COLORS: Record<Accion, string> = {
  crear: 'text-green-600',
  editar: 'text-blue-600',
  eliminar: 'text-red-600',
};

export const ACCION_LABELS: Record<Accion, string> = {
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
};

export const MODULE_LABELS: Record<string, string> = {
  'facturacion-electronica': '💰 Facturación Electrónica',
  'gestion-comercial-e-inventario': '📦 Gestión Comercial e Inventario',
  'gestion-contable-y-financiera': '📊 Gestión Contable y Financiera',
  'reportes': '📈 Reportes',
  'configuracion': '⚙️ Configuración',
};

export const ICON_MAP: Record<string, string> = {
  'facturacion-electronica.dashboard.index': '📊',
  'facturacion-electronica.crear-venta.index': '🏷️',
  'facturacion-electronica.crear-cotizacion.index': '📝',
  'facturacion-electronica.crear-prestamo.index': '🤝',
  'facturacion-electronica.crear-nota-credito.index': '📑',
  'facturacion-electronica.crear-nota-debito.index': '🧾',
  'facturacion-electronica.crear-guia.index': '📋',
  'facturacion-electronica.mis-ventas.index': '🛒',
  'facturacion-electronica.historial-ventas.index': '📜',
  'facturacion-electronica.mis-entregas.index': '🚚',
  'facturacion-electronica.calendario-entregas.index': '📅',
  'facturacion-electronica.mis-cotizaciones.index': '💰',
  'facturacion-electronica.mis-guias.index': '📄',
  'facturacion-electronica.mis-prestamos.index': '💸',
  'facturacion-electronica.mis-notas.index': '📑',
  'facturacion-electronica.mis-contactos.index': '👥',
  'facturacion-electronica.mis-aperturas-cierres.index': '🔐',
  'facturacion-electronica.arqueos-diarios.index': '⚖️',
  'facturacion-electronica.movimientos-caja.index': '💳',
  'gestion-comercial-e-inventario.mi-almacen.index': '📦',
  'gestion-comercial-e-inventario.dashboard.index': '📊',
  'gestion-comercial-e-inventario.mis-compras.index': '🛒',
  'gestion-comercial-e-inventario.mis-recepciones.index': '📥',
  'gestion-comercial-e-inventario.crear-compra.index': '📝',
  'producto.create': '📦',
  'proveedor.create': '🏢',
  'proveedor.listado': '🏢',
  'cliente.create': '👤',
  'caja.create': '🏦',
  'egreso-dinero.create': '💵',
};

export const PERMISSION_TO_AUTH_MODULO: Record<string, string> = {
  'facturacion-electronica.crear-venta.index': 'ventas',
  'facturacion-electronica.mis-ventas.index': 'ventas',
  'facturacion-electronica.historial-ventas.index': 'ventas',
  'facturacion-electronica.crear-cotizacion.index': 'cotizaciones',
  'facturacion-electronica.mis-cotizaciones.index': 'cotizaciones',
  'facturacion-electronica.crear-prestamo.index': 'prestamos',
  'facturacion-electronica.mis-prestamos.index': 'prestamos',
  'facturacion-electronica.mis-guias.index': 'guias',
  'facturacion-electronica.crear-guia.index': 'guias',
  'facturacion-electronica.mis-entregas.index': 'entregas',
  'facturacion-electronica.calendario-entregas.index': 'entregas',
  'facturacion-electronica.mis-contactos.index': 'clientes',
  'facturacion-electronica.mis-aperturas-cierres.index': 'caja',
  'facturacion-electronica.arqueos-diarios.index': 'caja',
  'facturacion-electronica.movimientos-caja.index': 'caja',
  'gestion-comercial-e-inventario.mi-almacen.index': 'productos',
  'gestion-comercial-e-inventario.crear-compra.index': 'compras',
  'gestion-comercial-e-inventario.mis-compras.index': 'compras',
  'gestion-comercial-e-inventario.mis-recepciones.index': 'compras',
  'producto.create': 'productos',
  'proveedor.create': 'proveedores',
  'proveedor.listado': 'proveedores',
  'cliente.create': 'clientes',
  'caja.create': 'caja',
  'egreso-dinero.create': 'caja',
};

export const AREAS_DISPONIBLES = [
  { label: 'Facturación Electrónica', value: 'facturacion-electronica' },
  { label: 'Gestión Comercial e Inventario', value: 'gestion-comercial-e-inventario' },
  { label: 'Gestión Contable y Financiera', value: 'gestion-contable-y-financiera' },
  { label: 'Reportes', value: 'reportes' },
  { label: 'Configuración', value: 'configuracion' },
];
