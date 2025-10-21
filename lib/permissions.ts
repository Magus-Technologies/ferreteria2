export enum permissions {
  // Gestion Comercial e Inventario
  GESTION_COMERCIAL_E_INVENTARIO_INDEX = 'gestion-comercial-e-inventario.index',
  GESTION_COMERCIAL_E_INVENTARIO_MI_ALMACEN_INDEX = 'gestion-comercial-e-inventario.mi-almacen.index',
  GESTION_COMERCIAL_E_INVENTARIO_MIS_COMPRAS_INDEX = 'gestion-comercial-e-inventario.mis-compras.index',
  GESTION_COMERCIAL_E_INVENTARIO_MIS_RECEPCIONES_INDEX = 'gestion-comercial-e-inventario.mis-recepciones.index',

  // Gestion Comercial e Inventario - Mi Almacén
  PRODUCTO_BASE = 'producto',
  PRODUCTO_LISTADO = 'producto.listado',
  PRODUCTO_CREATE = 'producto.create',
  PRODUCTO_UPDATE = 'producto.update',
  PRODUCTO_DUPLICAR = 'producto.duplicar',
  PRODUCTO_DELETE = 'producto.delete',
  PRODUCTO_INGRESO_CREATE = 'producto.ingreso.create',
  PRODUCTO_SALIDA_CREATE = 'producto.salida.create',
  PRODUCTO_IMPORT = 'producto.import',

  DETALLES_DE_PRECIOS_IMPORT = 'detalle-de-precios.import',

  // Facturacion Electronica
  FACTURACION_ELECTRONICA_INDEX = 'facturacion-electronica.index',

  // Gestion Contable y Financiera
  GESTION_CONTABLE_Y_FINANCIERA_INDEX = 'gestion-contable-y-financiera.index',

  // Marcas
  MARCA_BASE = 'marca',
  MARCA_LISTADO = 'marca.listado',
  MARCA_CREATE = 'marca.create',
  MARCA_UPDATE = 'marca.update',
  MARCA_DELETE = 'marca.delete',

  // Almacenes
  ALMACEN_BASE = 'almacen',
  ALMACEN_LISTADO = 'almacen.listado',
  ALMACEN_CREATE = 'almacen.create',
  ALMACEN_UPDATE = 'almacen.update',
  ALMACEN_DELETE = 'almacen.delete',

  // Unidades de Medida
  UNIDAD_MEDIDA_BASE = 'unidad-medida',
  UNIDAD_MEDIDA_LISTADO = 'unidad-medida.listado',
  UNIDAD_MEDIDA_CREATE = 'unidad-medida.create',
  UNIDAD_MEDIDA_UPDATE = 'unidad-medida.update',
  UNIDAD_MEDIDA_DELETE = 'unidad-medida.delete',

  // Categorias
  CATEGORIA_BASE = 'categoria',
  CATEGORIA_LISTADO = 'categoria.listado',
  CATEGORIA_CREATE = 'categoria.create',
  CATEGORIA_UPDATE = 'categoria.update',
  CATEGORIA_DELETE = 'categoria.delete',

  // Ubicaciones
  UBICACION_BASE = 'ubicacion',
  UBICACION_LISTADO = 'ubicacion.listado',
  UBICACION_CREATE = 'ubicacion.create',
  UBICACION_UPDATE = 'ubicacion.update',
  UBICACION_DELETE = 'ubicacion.delete',

  // Unidades Derivadas
  UNIDAD_DERIVADA_BASE = 'unidad-derivada',
  UNIDAD_DERIVADA_LISTADO = 'unidad-derivada.listado',
  UNIDAD_DERIVADA_CREATE = 'unidad-derivada.create',
  UNIDAD_DERIVADA_UPDATE = 'unidad-derivada.update',
  UNIDAD_DERIVADA_DELETE = 'unidad-derivada.delete',

  // Proveedores
  PROVEEDOR_BASE = 'proveedor',
  PROVEEDOR_LISTADO = 'proveedor.listado',
  PROVEEDOR_CREATE = 'proveedor.create',
  PROVEEDOR_UPDATE = 'proveedor.update',
  PROVEEDOR_DELETE = 'proveedor.delete',

  // Ingresos y salidas
  INGRESO_SALIDA_BASE = 'ingreso-salida',
  INGRESO_SALIDA_LISTADO = 'ingreso-salida.listado',
  INGRESO_SALIDA_CREATE = 'ingreso-salida.create',
  INGRESO_SALIDA_UPDATE = 'ingreso-salida.update',
  INGRESO_SALIDA_DELETE = 'ingreso-salida.delete',

  // Tipos de ingresos y salidas
  TIPO_INGRESO_SALIDA_BASE = 'tipo-ingreso-salida',
  TIPO_INGRESO_SALIDA_LISTADO = 'tipo-ingreso-salida.listado',
  TIPO_INGRESO_SALIDA_CREATE = 'tipo-ingreso-salida.create',
  TIPO_INGRESO_SALIDA_UPDATE = 'tipo-ingreso-salida.update',
  TIPO_INGRESO_SALIDA_DELETE = 'tipo-ingreso-salida.delete',

  // Usuarios
  USUARIO_BASE = 'usuario',
  USUARIO_LISTADO = 'usuario.listado',
  USUARIO_CREATE = 'usuario.create',
  USUARIO_UPDATE = 'usuario.update',
  USUARIO_DELETE = 'usuario.delete',

  // Compras
  COMPRAS_BASE = 'compras',
  COMPRAS_LISTADO = 'compras.listado',
  COMPRAS_CREATE = 'compras.create',
  COMPRAS_UPDATE = 'compras.update',
  COMPRAS_DELETE = 'compras.delete',

  // Recepción Almacén
  RECEPCION_ALMACEN_BASE = 'recepcion-almacen',
  RECEPCION_ALMACEN_LISTADO = 'recepcion-almacen.listado',
  RECEPCION_ALMACEN_CREATE = 'recepcion-almacen.create',
  RECEPCION_ALMACEN_UPDATE = 'recepcion-almacen.update',
  RECEPCION_ALMACEN_DELETE = 'recepcion-almacen.delete',
}

type PermisosValidos = Exclude<
  permissions,
  | permissions.PRODUCTO_BASE
  | permissions.MARCA_BASE
  | permissions.ALMACEN_BASE
  | permissions.UNIDAD_MEDIDA_BASE
  | permissions.CATEGORIA_BASE
  | permissions.UBICACION_BASE
  | permissions.UNIDAD_DERIVADA_BASE
  | permissions.PROVEEDOR_BASE
  | permissions.INGRESO_SALIDA_BASE
  | permissions.TIPO_INGRESO_SALIDA_BASE
  | permissions.USUARIO_BASE
  | permissions.COMPRAS_BASE
  | permissions.RECEPCION_ALMACEN_BASE
>
const permissionstoDescripcion: Record<PermisosValidos, string> = {
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_INDEX]:
    'Ver Página Gestion Comercial e Inventario',
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_MI_ALMACEN_INDEX]:
    'Ver Página Mi Almacén',
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_MIS_COMPRAS_INDEX]:
    'Ver Página Mis Compras',
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_MIS_RECEPCIONES_INDEX]:
    'Ver Página Mis Recepciones',

  [permissions.PRODUCTO_LISTADO]: 'Ver Listado de Productos',
  [permissions.PRODUCTO_CREATE]: 'Crear Producto',
  [permissions.PRODUCTO_UPDATE]: 'Actualizar Producto',
  [permissions.PRODUCTO_DUPLICAR]: 'Duplicar Producto',
  [permissions.PRODUCTO_DELETE]: 'Eliminar Producto',
  [permissions.PRODUCTO_INGRESO_CREATE]: 'Crear Ingreso de Producto',
  [permissions.PRODUCTO_SALIDA_CREATE]: 'Crear Salida de Producto',
  [permissions.PRODUCTO_IMPORT]: 'Importar Productos',

  [permissions.DETALLES_DE_PRECIOS_IMPORT]: 'Importar Detalles de Precios',

  [permissions.FACTURACION_ELECTRONICA_INDEX]:
    'Ver Página Facturación Electronica',
  [permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX]:
    'Ver Página Gestion Contable y Financiera',

  [permissions.MARCA_LISTADO]: 'Ver Listado de Marcas',
  [permissions.MARCA_CREATE]: 'Crear Marca',
  [permissions.MARCA_UPDATE]: 'Actualizar Marca',
  [permissions.MARCA_DELETE]: 'Eliminar Marca',

  [permissions.ALMACEN_LISTADO]: 'Ver Listado de Almacenes',
  [permissions.ALMACEN_CREATE]: 'Crear Almacén',
  [permissions.ALMACEN_UPDATE]: 'Actualizar Almacén',
  [permissions.ALMACEN_DELETE]: 'Eliminar Almacén',

  [permissions.UNIDAD_MEDIDA_LISTADO]: 'Ver Listado de Unidades de Medida',
  [permissions.UNIDAD_MEDIDA_CREATE]: 'Crear Unidad de Medida',
  [permissions.UNIDAD_MEDIDA_UPDATE]: 'Actualizar Unidad de Medida',
  [permissions.UNIDAD_MEDIDA_DELETE]: 'Eliminar Unidad de Medida',

  [permissions.CATEGORIA_LISTADO]: 'Ver Listado de Categorias',
  [permissions.CATEGORIA_CREATE]: 'Crear Categoria',
  [permissions.CATEGORIA_UPDATE]: 'Actualizar Categoria',
  [permissions.CATEGORIA_DELETE]: 'Eliminar Categoria',

  [permissions.UBICACION_LISTADO]: 'Ver Listado de Ubicaciones',
  [permissions.UBICACION_CREATE]: 'Crear Ubicación',
  [permissions.UBICACION_UPDATE]: 'Actualizar Ubicación',
  [permissions.UBICACION_DELETE]: 'Eliminar Ubicación',

  [permissions.UNIDAD_DERIVADA_LISTADO]: 'Ver Listado de Unidades Derivadas',
  [permissions.UNIDAD_DERIVADA_CREATE]: 'Crear Unidad Derivada',
  [permissions.UNIDAD_DERIVADA_UPDATE]: 'Actualizar Unidad Derivada',
  [permissions.UNIDAD_DERIVADA_DELETE]: 'Eliminar Unidad Derivada',

  [permissions.PROVEEDOR_LISTADO]: 'Ver Listado de Proveedores',
  [permissions.PROVEEDOR_CREATE]: 'Crear Proveedor',
  [permissions.PROVEEDOR_UPDATE]: 'Actualizar Proveedor',
  [permissions.PROVEEDOR_DELETE]: 'Eliminar Proveedor',

  [permissions.INGRESO_SALIDA_LISTADO]: 'Ver Listado de Ingresos y Salidas',
  [permissions.INGRESO_SALIDA_CREATE]: 'Crear Ingreso y Salida',
  [permissions.INGRESO_SALIDA_UPDATE]: 'Actualizar Ingreso y Salida',
  [permissions.INGRESO_SALIDA_DELETE]: 'Eliminar Ingreso y Salida',

  [permissions.TIPO_INGRESO_SALIDA_LISTADO]:
    'Ver Listado de Tipos de Ingresos y Salidas',
  [permissions.TIPO_INGRESO_SALIDA_CREATE]: 'Crear Tipo de Ingreso y Salida',
  [permissions.TIPO_INGRESO_SALIDA_UPDATE]:
    'Actualizar Tipo de Ingreso y Salida',
  [permissions.TIPO_INGRESO_SALIDA_DELETE]: 'Eliminar Tipo de Ingreso y Salida',

  [permissions.USUARIO_LISTADO]: 'Ver Listado de Usuarios',
  [permissions.USUARIO_CREATE]: 'Crear Usuario',
  [permissions.USUARIO_UPDATE]: 'Actualizar Usuario',
  [permissions.USUARIO_DELETE]: 'Eliminar Usuario',

  [permissions.COMPRAS_LISTADO]: 'Ver Listado de Compras',
  [permissions.COMPRAS_CREATE]: 'Crear Compra',
  [permissions.COMPRAS_UPDATE]: 'Actualizar Compra',
  [permissions.COMPRAS_DELETE]: 'Eliminar Compra',

  [permissions.RECEPCION_ALMACEN_LISTADO]:
    'Ver Listado de Recepciones de Almacén',
  [permissions.RECEPCION_ALMACEN_CREATE]: 'Crear Recepción de Almacén',
  [permissions.RECEPCION_ALMACEN_UPDATE]: 'Actualizar Recepción de Almacén',
  [permissions.RECEPCION_ALMACEN_DELETE]: 'Eliminar Recepción de Almacén',
}

export function getAllPermissions() {
  return Object.entries(permissionstoDescripcion).map(([key, value]) => ({
    name: key,
    descripcion: value,
  }))
}
