export enum permissions {
  // Gestion Comercial e Inventario
  GESTION_COMERCIAL_E_INVENTARIO_INDEX = 'gestion-comercial-e-inventario.index',
  GESTION_COMERCIAL_E_INVENTARIO_MI_ALMACEN_INDEX = 'gestion-comercial-e-inventario.mi-almacen.index',
  // Gestion Comercial e Inventario - Mi Almacén
  PRODUCTO_BASE = 'producto',
  PRODUCTO_CREATE = 'producto.create',
  PRODUCTO_UPDATE = 'producto.update',
  PRODUCTO_DUPLICAR = 'producto.duplicar',
  PRODUCTO_DELETE = 'producto.delete',
  PRODUCTO_INGRESO_CREATE = 'producto.ingreso.create',
  PRODUCTO_SALIDA_CREATE = 'producto.salida.create',

  // Facturacion Electronica
  FACTURACION_ELECTRONICA_INDEX = 'facturacion-electronica.index',

  // Gestion Contable y Financiera
  GESTION_CONTABLE_Y_FINANCIERA_INDEX = 'gestion-contable-y-financiera.index',
}
