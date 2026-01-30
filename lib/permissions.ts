/**
 * SISTEMA DE RESTRICCIONES (Lista Negra)
 *
 * Este enum define las funcionalidades que pueden ser RESTRINGIDAS.
 * Por defecto, todos los usuarios tienen acceso a todas las funcionalidades.
 * Solo se guardan restricciones en la base de datos para BLOQUEAR acceso.
 *
 * Uso:
 * - usePermission(permissions.VENTA_CREATE) → retorna true si NO está restringido
 * - usePermission(permissions.VENTA_CREATE) → retorna false si está restringido
 */
export enum permissions {
  // ============================================
  // MÓDULOS PRINCIPALES
  // ============================================
  GESTION_COMERCIAL_E_INVENTARIO_INDEX = "gestion-comercial-e-inventario.index",
  FACTURACION_ELECTRONICA_INDEX = "facturacion-electronica.index",
  GESTION_CONTABLE_Y_FINANCIERA_INDEX = "gestion-contable-y-financiera.index",
  REPORTES_INDEX = "reportes.index",
  CONFIGURACION_INDEX = "configuracion.index",

  // ============================================
  // SUBMÓDULOS - GESTIÓN COMERCIAL E INVENTARIO
  // ============================================
  GESTION_COMERCIAL_E_INVENTARIO_DASHBOARD_INDEX = "gestion-comercial-e-inventario.dashboard.index",
  GESTION_COMERCIAL_E_INVENTARIO_MI_ALMACEN_INDEX = "gestion-comercial-e-inventario.mi-almacen.index",
  GESTION_COMERCIAL_E_INVENTARIO_MIS_COMPRAS_INDEX = "gestion-comercial-e-inventario.mis-compras.index",
  GESTION_COMERCIAL_E_INVENTARIO_MIS_RECEPCIONES_INDEX = "gestion-comercial-e-inventario.mis-recepciones.index",
  GESTION_COMERCIAL_E_INVENTARIO_CREAR_COMPRA_INDEX = "gestion-comercial-e-inventario.crear-compra.index",
  GESTION_COMERCIAL_E_INVENTARIO_CREAR_RECEPCION_INDEX = "gestion-comercial-e-inventario.crear-recepcion.index",
  GESTION_COMERCIAL_E_INVENTARIO_CONFIGURACION_INDEX = "gestion-comercial-e-inventario.configuracion.index",

  // ============================================
  // SUBMÓDULOS - FACTURACIÓN ELECTRÓNICA
  // ============================================
  FACTURACION_ELECTRONICA_DASHBOARD_INDEX = "facturacion-electronica.dashboard.index",
  FACTURACION_ELECTRONICA_MIS_VENTAS_INDEX = "facturacion-electronica.mis-ventas.index",
  FACTURACION_ELECTRONICA_MIS_ENTREGAS_INDEX = "facturacion-electronica.mis-entregas.index",
  FACTURACION_ELECTRONICA_MIS_COTIZACIONES_INDEX = "facturacion-electronica.mis-cotizaciones.index",
  FACTURACION_ELECTRONICA_MIS_GUIAS_INDEX = "facturacion-electronica.mis-guias.index",
  FACTURACION_ELECTRONICA_MIS_PRESTAMOS_INDEX = "facturacion-electronica.mis-prestamos.index",
  FACTURACION_ELECTRONICA_MIS_NOTAS_INDEX = "facturacion-electronica.mis-notas.index",
  FACTURACION_ELECTRONICA_MIS_CONTACTOS_INDEX = "facturacion-electronica.mis-contactos.index",
  FACTURACION_ELECTRONICA_MIS_APERTURAS_CIERRES_INDEX = "facturacion-electronica.mis-aperturas-cierres.index",
  FACTURACION_ELECTRONICA_MOVIMIENTOS_CAJA_INDEX = "facturacion-electronica.movimientos-caja.index",
  FACTURACION_ELECTRONICA_CREAR_VENTA_INDEX = "facturacion-electronica.crear-venta.index",
  FACTURACION_ELECTRONICA_CREAR_COTIZACION_INDEX = "facturacion-electronica.crear-cotizacion.index",
  FACTURACION_ELECTRONICA_CREAR_GUIA_INDEX = "facturacion-electronica.crear-guia.index",
  FACTURACION_ELECTRONICA_CREAR_PRESTAMO_INDEX = "facturacion-electronica.crear-prestamo.index",

  // ============================================
  // SUBMÓDULOS - GESTIÓN CONTABLE Y FINANCIERA
  // ============================================
  GESTION_CONTABLE_Y_FINANCIERA_DASHBOARD_INDEX = "gestion-contable-y-financiera.dashboard.index",
  GESTION_CONTABLE_Y_FINANCIERA_CUENTAS_POR_COBRAR_INDEX = "gestion-contable-y-financiera.cuentas-por-cobrar.index",
  GESTION_CONTABLE_Y_FINANCIERA_CUENTAS_POR_PAGAR_INDEX = "gestion-contable-y-financiera.cuentas-por-pagar.index",
  GESTION_CONTABLE_Y_FINANCIERA_LIBRO_DIARIO_INDEX = "gestion-contable-y-financiera.libro-diario.index",
  GESTION_CONTABLE_Y_FINANCIERA_BALANCE_GENERAL_INDEX = "gestion-contable-y-financiera.balance-general.index",

  // ============================================
  // SUBMÓDULOS - REPORTES
  // ============================================
  REPORTES_VENTAS_INDEX = "reportes.ventas.index",
  REPORTES_COMPRAS_INDEX = "reportes.compras.index",
  REPORTES_INVENTARIO_INDEX = "reportes.inventario.index",
  REPORTES_FINANCIEROS_INDEX = "reportes.financieros.index",
  REPORTES_CLIENTES_INDEX = "reportes.clientes.index",
  REPORTES_PROVEEDORES_INDEX = "reportes.proveedores.index",

  // ============================================
  // SUBMÓDULOS - CONFIGURACIÓN
  // ============================================
  CONFIGURACION_USUARIOS_INDEX = "configuracion.usuarios.index",
  CONFIGURACION_ROLES_INDEX = "configuracion.roles.index",
  CONFIGURACION_PERMISOS_INDEX = "configuracion.permisos.index",
  CONFIGURACION_EMPRESA_INDEX = "configuracion.empresa.index",
  CONFIGURACION_ALMACENES_INDEX = "configuracion.almacenes.index",
  CONFIGURACION_CAJAS_INDEX = "configuracion.cajas.index",
  CONFIGURACION_SERIES_INDEX = "configuracion.series.index",
  CONFIGURACION_IMPRESION_INDEX = "configuracion.impresion.index",

  // Gestion Comercial e Inventario - Mi Almacén
  PRODUCTO_BASE = "producto",
  PRODUCTO_LISTADO = "producto.listado",
  PRODUCTO_CREATE = "producto.create",
  PRODUCTO_UPDATE = "producto.update",
  PRODUCTO_DUPLICAR = "producto.duplicar",
  PRODUCTO_DELETE = "producto.delete",
  PRODUCTO_INGRESO_CREATE = "producto.ingreso.create",
  PRODUCTO_SALIDA_CREATE = "producto.salida.create",
  PRODUCTO_IMPORT = "producto.import",

  DETALLES_DE_PRECIOS_IMPORT = "detalle-de-precios.import",

  // Marcas
  MARCA_BASE = "marca",
  MARCA_LISTADO = "marca.listado",
  MARCA_CREATE = "marca.create",
  MARCA_UPDATE = "marca.update",
  MARCA_DELETE = "marca.delete",

  // Almacenes
  ALMACEN_BASE = "almacen",
  ALMACEN_LISTADO = "almacen.listado",
  ALMACEN_CREATE = "almacen.create",
  ALMACEN_UPDATE = "almacen.update",
  ALMACEN_DELETE = "almacen.delete",

  // Unidades de Medida
  UNIDAD_MEDIDA_BASE = "unidad-medida",
  UNIDAD_MEDIDA_LISTADO = "unidad-medida.listado",
  UNIDAD_MEDIDA_CREATE = "unidad-medida.create",
  UNIDAD_MEDIDA_UPDATE = "unidad-medida.update",
  UNIDAD_MEDIDA_DELETE = "unidad-medida.delete",

  // Categorias
  CATEGORIA_BASE = "categoria",
  CATEGORIA_LISTADO = "categoria.listado",
  CATEGORIA_CREATE = "categoria.create",
  CATEGORIA_UPDATE = "categoria.update",
  CATEGORIA_DELETE = "categoria.delete",

  // Ubicaciones
  UBICACION_BASE = "ubicacion",
  UBICACION_LISTADO = "ubicacion.listado",
  UBICACION_CREATE = "ubicacion.create",
  UBICACION_UPDATE = "ubicacion.update",
  UBICACION_DELETE = "ubicacion.delete",

  // Unidades Derivadas
  UNIDAD_DERIVADA_BASE = "unidad-derivada",
  UNIDAD_DERIVADA_LISTADO = "unidad-derivada.listado",
  UNIDAD_DERIVADA_CREATE = "unidad-derivada.create",
  UNIDAD_DERIVADA_UPDATE = "unidad-derivada.update",
  UNIDAD_DERIVADA_DELETE = "unidad-derivada.delete",

  // Proveedores
  PROVEEDOR_BASE = "proveedor",
  PROVEEDOR_LISTADO = "proveedor.listado",
  PROVEEDOR_CREATE = "proveedor.create",
  PROVEEDOR_UPDATE = "proveedor.update",
  PROVEEDOR_DELETE = "proveedor.delete",

  // Ingresos y salidas
  INGRESO_SALIDA_BASE = "ingreso-salida",
  INGRESO_SALIDA_LISTADO = "ingreso-salida.listado",
  INGRESO_SALIDA_CREATE = "ingreso-salida.create",
  INGRESO_SALIDA_UPDATE = "ingreso-salida.update",
  INGRESO_SALIDA_DELETE = "ingreso-salida.delete",

  // Tipos de ingresos y salidas
  TIPO_INGRESO_SALIDA_BASE = "tipo-ingreso-salida",
  TIPO_INGRESO_SALIDA_LISTADO = "tipo-ingreso-salida.listado",
  TIPO_INGRESO_SALIDA_CREATE = "tipo-ingreso-salida.create",
  TIPO_INGRESO_SALIDA_UPDATE = "tipo-ingreso-salida.update",
  TIPO_INGRESO_SALIDA_DELETE = "tipo-ingreso-salida.delete",

  // Usuarios
  USUARIO_BASE = "usuario",
  USUARIO_LISTADO = "usuario.listado",
  USUARIO_CREATE = "usuario.create",
  USUARIO_UPDATE = "usuario.update",
  USUARIO_DELETE = "usuario.delete",

  // Compras
  COMPRAS_BASE = "compras",
  COMPRAS_LISTADO = "compras.listado",
  COMPRAS_CREATE = "compras.create",
  COMPRAS_UPDATE = "compras.update",
  COMPRAS_DELETE = "compras.delete",

  // Recepción Almacén
  RECEPCION_ALMACEN_BASE = "recepcion-almacen",
  RECEPCION_ALMACEN_LISTADO = "recepcion-almacen.listado",
  RECEPCION_ALMACEN_CREATE = "recepcion-almacen.create",
  RECEPCION_ALMACEN_UPDATE = "recepcion-almacen.update",
  RECEPCION_ALMACEN_DELETE = "recepcion-almacen.delete",
  RECEPCION_ALMACEN_FINALIZAR = "recepcion-almacen.finalizar",

  // Caja
  CAJA_BASE = "caja",
  CAJA_LISTADO = "caja.listado",
  CAJA_CREATE = "caja.create",
  CAJA_UPDATE = "caja.update",
  CAJA_DELETE = "caja.delete",

  // Caja Principal
  CAJA_PRINCIPAL_BASE = "caja-principal",
  CAJA_PRINCIPAL_LISTADO = "caja-principal.listado",
  CAJA_PRINCIPAL_CREATE = "caja-principal.create",
  CAJA_PRINCIPAL_UPDATE = "caja-principal.update",
  CAJA_PRINCIPAL_DELETE = "caja-principal.delete",

  // Sub Caja
  SUB_CAJA_BASE = "sub-caja",
  SUB_CAJA_LISTADO = "sub-caja.listado",
  SUB_CAJA_CREATE = "sub-caja.create",
  SUB_CAJA_UPDATE = "sub-caja.update",
  SUB_CAJA_DELETE = "sub-caja.delete",

  // Transacción Caja
  TRANSACCION_CAJA_BASE = "transaccion-caja",
  TRANSACCION_CAJA_LISTADO = "transaccion-caja.listado",
  TRANSACCION_CAJA_CREATE = "transaccion-caja.create",

  // Egresos Dinero
  EGRESO_DINERO_BASE = "egreso-dinero",
  EGRESO_DINERO_LISTADO = "egreso-dinero.listado",
  EGRESO_DINERO_CREATE = "egreso-dinero.create",
  EGRESO_DINERO_UPDATE = "egreso-dinero.update",
  EGRESO_DINERO_DELETE = "egreso-dinero.delete",

  // Despliegue de Pago
  DESPLIEGUE_DE_PAGO_BASE = "despliegue-de-pago",
  DESPLIEGUE_DE_PAGO_LISTADO = "despliegue-de-pago.listado",
  DESPLIEGUE_DE_PAGO_CREATE = "despliegue-de-pago.create",
  DESPLIEGUE_DE_PAGO_UPDATE = "despliegue-de-pago.update",
  DESPLIEGUE_DE_PAGO_DELETE = "despliegue-de-pago.delete",

  // Ventas
  VENTA_BASE = "venta",
  VENTA_LISTADO = "venta.listado",
  VENTA_CREATE = "venta.create",
  VENTA_UPDATE = "venta.update",
  VENTA_DELETE = "venta.delete",

  // Clientes
  CLIENTE_BASE = "cliente",
  CLIENTE_LISTADO = "cliente.listado",
  CLIENTE_CREATE = "cliente.create",
  CLIENTE_UPDATE = "cliente.update",
  CLIENTE_DELETE = "cliente.delete",

  // cotizaciones

  COTIZACION_BASE = "cotizacion",
  COTIZACION_LISTADO = "cotizacion.listado",
  COTIZACION_CREATE = "cotizacion.create",
  COTIZACION_UPDATE = "cotizacion.update",
  COTIZACION_DELETE = "cotizacion.delete",
  // COTIZACION_CONVERTIR_A_VENTA = 'cotizacion.convertir-a-venta',

  // Guías de Remisión
  GUIA_BASE = "guia",
  GUIA_LISTADO = "guia.listado",
  GUIA_CREATE = "guia.create",
  GUIA_UPDATE = "guia.update",
  GUIA_DELETE = "guia.delete",

  // Entregas
  ENTREGA_BASE = "entrega",
  ENTREGA_LISTADO = "entrega.listado",
  ENTREGA_UPDATE = "entrega.update",
  ENTREGA_FINALIZAR = "entrega.finalizar",

  // Mis Entregas - Elementos Configurables
  MIS_ENTREGAS_FILTRO_FECHA_DESDE = "mis-entregas.filtro-fecha-desde",
  MIS_ENTREGAS_FILTRO_FECHA_HASTA = "mis-entregas.filtro-fecha-hasta",
  MIS_ENTREGAS_FILTRO_ESTADO = "mis-entregas.filtro-estado",
  MIS_ENTREGAS_FILTRO_TIPO_DESPACHO = "mis-entregas.filtro-tipo-despacho",
  MIS_ENTREGAS_FILTRO_BUSCAR = "mis-entregas.filtro-buscar",
  MIS_ENTREGAS_BOTON_BUSCAR = "mis-entregas.boton-buscar",
  MIS_ENTREGAS_TABLA = "mis-entregas.tabla",
  MIS_ENTREGAS_CARD_TOTAL = "mis-entregas.card-total",
  MIS_ENTREGAS_CARD_PENDIENTES = "mis-entregas.card-pendientes",
  MIS_ENTREGAS_CARD_EN_CAMINO = "mis-entregas.card-en-camino",
  MIS_ENTREGAS_CARD_COMPLETADAS = "mis-entregas.card-completadas",
  MIS_ENTREGAS_BOTON_VER_MAPA = "mis-entregas.boton-ver-mapa",
  MIS_ENTREGAS_BOTON_EN_CAMINO = "mis-entregas.boton-en-camino",
  MIS_ENTREGAS_BOTON_ENTREGAR = "mis-entregas.boton-entregar",
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
  | permissions.CAJA_BASE
  | permissions.CAJA_PRINCIPAL_BASE
  | permissions.SUB_CAJA_BASE
  | permissions.TRANSACCION_CAJA_BASE
  | permissions.EGRESO_DINERO_BASE
  | permissions.DESPLIEGUE_DE_PAGO_BASE
  | permissions.VENTA_BASE
  | permissions.CLIENTE_BASE
  | permissions.COTIZACION_BASE
  | permissions.GUIA_BASE
  | permissions.ENTREGA_BASE
>;
const permissionstoDescripcion: Record<PermisosValidos, string> = {
  // MÓDULOS PRINCIPALES
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_INDEX]:
    "Ver Página Gestion Comercial e Inventario",
  [permissions.FACTURACION_ELECTRONICA_INDEX]:
    "Ver Página Facturación Electronica",
  [permissions.GESTION_CONTABLE_Y_FINANCIERA_INDEX]:
    "Ver Página Gestion Contable y Financiera",
  [permissions.REPORTES_INDEX]: "Ver Página Reportes",
  [permissions.CONFIGURACION_INDEX]: "Ver Página Configuración",

  // SUBMÓDULOS - GESTIÓN COMERCIAL E INVENTARIO
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_DASHBOARD_INDEX]:
    "Ver Dashboard Gestión Comercial e Inventario",
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_MI_ALMACEN_INDEX]:
    "Ver Página Mi Almacén",
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_MIS_COMPRAS_INDEX]:
    "Ver Página Mis Compras",
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_MIS_RECEPCIONES_INDEX]:
    "Ver Página Mis Recepciones",
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_CREAR_COMPRA_INDEX]:
    "Ver Página Crear Compra",
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_CREAR_RECEPCION_INDEX]:
    "Ver Página Crear Recepción",
  [permissions.GESTION_COMERCIAL_E_INVENTARIO_CONFIGURACION_INDEX]:
    "Ver Configuración Gestión Comercial e Inventario",

  // SUBMÓDULOS - FACTURACIÓN ELECTRÓNICA
  [permissions.FACTURACION_ELECTRONICA_DASHBOARD_INDEX]:
    "Ver Dashboard Facturación Electrónica",
  [permissions.FACTURACION_ELECTRONICA_MIS_VENTAS_INDEX]:
    "Ver Página Mis Ventas",
  [permissions.FACTURACION_ELECTRONICA_MIS_ENTREGAS_INDEX]:
    "Ver Página Mis Entregas",
  [permissions.FACTURACION_ELECTRONICA_MIS_COTIZACIONES_INDEX]:
    "Ver Página Mis Cotizaciones",
  [permissions.FACTURACION_ELECTRONICA_MIS_GUIAS_INDEX]: "Ver Página Mis Guías",
  [permissions.FACTURACION_ELECTRONICA_MIS_PRESTAMOS_INDEX]:
    "Ver Página Mis Préstamos",
  [permissions.FACTURACION_ELECTRONICA_MIS_NOTAS_INDEX]: "Ver Página Mis Notas",
  [permissions.FACTURACION_ELECTRONICA_MIS_CONTACTOS_INDEX]:
    "Ver Página Mis Contactos",
  [permissions.FACTURACION_ELECTRONICA_MIS_APERTURAS_CIERRES_INDEX]:
    "Ver Página Aperturas y Cierres",
  [permissions.FACTURACION_ELECTRONICA_MOVIMIENTOS_CAJA_INDEX]:
    "Ver Página Movimientos de Caja",
  [permissions.FACTURACION_ELECTRONICA_CREAR_VENTA_INDEX]:
    "Ver Página Crear Venta",
  [permissions.FACTURACION_ELECTRONICA_CREAR_COTIZACION_INDEX]:
    "Ver Página Crear Cotización",
  [permissions.FACTURACION_ELECTRONICA_CREAR_GUIA_INDEX]:
    "Ver Página Crear Guía",
  [permissions.FACTURACION_ELECTRONICA_CREAR_PRESTAMO_INDEX]:
    "Ver Página Crear Préstamo",

  // SUBMÓDULOS - GESTIÓN CONTABLE Y FINANCIERA
  [permissions.GESTION_CONTABLE_Y_FINANCIERA_DASHBOARD_INDEX]:
    "Ver Dashboard Gestión Contable y Financiera",
  [permissions.GESTION_CONTABLE_Y_FINANCIERA_CUENTAS_POR_COBRAR_INDEX]:
    "Ver Página Cuentas por Cobrar",
  [permissions.GESTION_CONTABLE_Y_FINANCIERA_CUENTAS_POR_PAGAR_INDEX]:
    "Ver Página Cuentas por Pagar",
  [permissions.GESTION_CONTABLE_Y_FINANCIERA_LIBRO_DIARIO_INDEX]:
    "Ver Página Libro Diario",
  [permissions.GESTION_CONTABLE_Y_FINANCIERA_BALANCE_GENERAL_INDEX]:
    "Ver Página Balance General",

  // SUBMÓDULOS - REPORTES
  [permissions.REPORTES_VENTAS_INDEX]: "Ver Reportes de Ventas",
  [permissions.REPORTES_COMPRAS_INDEX]: "Ver Reportes de Compras",
  [permissions.REPORTES_INVENTARIO_INDEX]: "Ver Reportes de Inventario",
  [permissions.REPORTES_FINANCIEROS_INDEX]: "Ver Reportes Financieros",
  [permissions.REPORTES_CLIENTES_INDEX]: "Ver Reportes de Clientes",
  [permissions.REPORTES_PROVEEDORES_INDEX]: "Ver Reportes de Proveedores",

  // SUBMÓDULOS - CONFIGURACIÓN
  [permissions.CONFIGURACION_USUARIOS_INDEX]: "Ver Página Usuarios",
  [permissions.CONFIGURACION_ROLES_INDEX]: "Ver Página Roles",
  [permissions.CONFIGURACION_PERMISOS_INDEX]: "Ver Página Permisos",
  [permissions.CONFIGURACION_EMPRESA_INDEX]: "Ver Página Mi Empresa",
  [permissions.CONFIGURACION_ALMACENES_INDEX]: "Ver Página Almacenes",
  [permissions.CONFIGURACION_CAJAS_INDEX]: "Ver Página Cajas",
  [permissions.CONFIGURACION_SERIES_INDEX]: "Ver Página Series",
  [permissions.CONFIGURACION_IMPRESION_INDEX]: "Ver Página Impresión",

  // PRODUCTOS

  // PRODUCTOS
  [permissions.PRODUCTO_LISTADO]: "Ver Listado de Productos",
  [permissions.PRODUCTO_CREATE]: "Crear Producto",
  [permissions.PRODUCTO_UPDATE]: "Actualizar Producto",
  [permissions.PRODUCTO_DUPLICAR]: "Duplicar Producto",
  [permissions.PRODUCTO_DELETE]: "Eliminar Producto",
  [permissions.PRODUCTO_INGRESO_CREATE]: "Crear Ingreso de Producto",
  [permissions.PRODUCTO_SALIDA_CREATE]: "Crear Salida de Producto",
  [permissions.PRODUCTO_IMPORT]: "Importar Productos",

  [permissions.DETALLES_DE_PRECIOS_IMPORT]: "Importar Detalles de Precios",

  // MARCAS

  // MARCAS
  [permissions.MARCA_LISTADO]: "Ver Listado de Marcas",
  [permissions.MARCA_CREATE]: "Crear Marca",
  [permissions.MARCA_UPDATE]: "Actualizar Marca",
  [permissions.MARCA_DELETE]: "Eliminar Marca",

  // ALMACENES

  [permissions.ALMACEN_LISTADO]: "Ver Listado de Almacenes",
  [permissions.ALMACEN_CREATE]: "Crear Almacén",
  [permissions.ALMACEN_UPDATE]: "Actualizar Almacén",
  [permissions.ALMACEN_DELETE]: "Eliminar Almacén",

  [permissions.UNIDAD_MEDIDA_LISTADO]: "Ver Listado de Unidades de Medida",
  [permissions.UNIDAD_MEDIDA_CREATE]: "Crear Unidad de Medida",
  [permissions.UNIDAD_MEDIDA_UPDATE]: "Actualizar Unidad de Medida",
  [permissions.UNIDAD_MEDIDA_DELETE]: "Eliminar Unidad de Medida",

  [permissions.CATEGORIA_LISTADO]: "Ver Listado de Categorias",
  [permissions.CATEGORIA_CREATE]: "Crear Categoria",
  [permissions.CATEGORIA_UPDATE]: "Actualizar Categoria",
  [permissions.CATEGORIA_DELETE]: "Eliminar Categoria",

  [permissions.UBICACION_LISTADO]: "Ver Listado de Ubicaciones",
  [permissions.UBICACION_CREATE]: "Crear Ubicación",
  [permissions.UBICACION_UPDATE]: "Actualizar Ubicación",
  [permissions.UBICACION_DELETE]: "Eliminar Ubicación",

  [permissions.UNIDAD_DERIVADA_LISTADO]: "Ver Listado de Unidades Derivadas",
  [permissions.UNIDAD_DERIVADA_CREATE]: "Crear Unidad Derivada",
  [permissions.UNIDAD_DERIVADA_UPDATE]: "Actualizar Unidad Derivada",
  [permissions.UNIDAD_DERIVADA_DELETE]: "Eliminar Unidad Derivada",

  [permissions.PROVEEDOR_LISTADO]: "Ver Listado de Proveedores",
  [permissions.PROVEEDOR_CREATE]: "Crear Proveedor",
  [permissions.PROVEEDOR_UPDATE]: "Actualizar Proveedor",
  [permissions.PROVEEDOR_DELETE]: "Eliminar Proveedor",

  [permissions.INGRESO_SALIDA_LISTADO]: "Ver Listado de Ingresos y Salidas",
  [permissions.INGRESO_SALIDA_CREATE]: "Crear Ingreso y Salida",
  [permissions.INGRESO_SALIDA_UPDATE]: "Actualizar Ingreso y Salida",
  [permissions.INGRESO_SALIDA_DELETE]: "Eliminar Ingreso y Salida",

  [permissions.TIPO_INGRESO_SALIDA_LISTADO]:
    "Ver Listado de Tipos de Ingresos y Salidas",
  [permissions.TIPO_INGRESO_SALIDA_CREATE]: "Crear Tipo de Ingreso y Salida",
  [permissions.TIPO_INGRESO_SALIDA_UPDATE]:
    "Actualizar Tipo de Ingreso y Salida",
  [permissions.TIPO_INGRESO_SALIDA_DELETE]: "Eliminar Tipo de Ingreso y Salida",

  [permissions.USUARIO_LISTADO]: "Ver Listado de Usuarios",
  [permissions.USUARIO_CREATE]: "Crear Usuario",
  [permissions.USUARIO_UPDATE]: "Actualizar Usuario",
  [permissions.USUARIO_DELETE]: "Eliminar Usuario",

  [permissions.COMPRAS_LISTADO]: "Ver Listado de Compras",
  [permissions.COMPRAS_CREATE]: "Crear Compra",
  [permissions.COMPRAS_UPDATE]: "Actualizar Compra",
  [permissions.COMPRAS_DELETE]: "Eliminar Compra",

  [permissions.RECEPCION_ALMACEN_LISTADO]:
    "Ver Listado de Recepciones de Almacén",
  [permissions.RECEPCION_ALMACEN_CREATE]: "Crear Recepción de Almacén",
  [permissions.RECEPCION_ALMACEN_UPDATE]: "Actualizar Recepción de Almacén",
  [permissions.RECEPCION_ALMACEN_DELETE]: "Eliminar Recepción de Almacén",
  [permissions.RECEPCION_ALMACEN_FINALIZAR]: "Finalizar Recepción de Almacén",

  [permissions.CAJA_LISTADO]: "Ver Listado de Cajas",
  [permissions.CAJA_CREATE]: "Aperturar Caja",
  [permissions.CAJA_UPDATE]: "Cerrar Caja",
  [permissions.CAJA_DELETE]: "Eliminar Caja",

  [permissions.CAJA_PRINCIPAL_LISTADO]: "Ver Listado de Cajas Principales",
  [permissions.CAJA_PRINCIPAL_CREATE]: "Crear Caja Principal",
  [permissions.CAJA_PRINCIPAL_UPDATE]: "Actualizar Caja Principal",
  [permissions.CAJA_PRINCIPAL_DELETE]: "Eliminar Caja Principal",

  [permissions.SUB_CAJA_LISTADO]: "Ver Listado de Sub-Cajas",
  [permissions.SUB_CAJA_CREATE]: "Crear Sub-Caja",
  [permissions.SUB_CAJA_UPDATE]: "Actualizar Sub-Caja",
  [permissions.SUB_CAJA_DELETE]: "Eliminar Sub-Caja",

  [permissions.TRANSACCION_CAJA_LISTADO]:
    "Ver Listado de Transacciones de Caja",
  [permissions.TRANSACCION_CAJA_CREATE]: "Crear Transacción de Caja",

  [permissions.EGRESO_DINERO_LISTADO]: "Ver Listado de Egresos Dinero",
  [permissions.EGRESO_DINERO_CREATE]: "Crear Egreso Dinero",
  [permissions.EGRESO_DINERO_UPDATE]: "Actualizar Egreso Dinero",
  [permissions.EGRESO_DINERO_DELETE]: "Eliminar Egreso Dinero",

  [permissions.DESPLIEGUE_DE_PAGO_LISTADO]: "Ver Listado de Despliegue de Pago",
  [permissions.DESPLIEGUE_DE_PAGO_CREATE]: "Crear Despliegue de Pago",
  [permissions.DESPLIEGUE_DE_PAGO_UPDATE]: "Actualizar Despliegue de Pago",
  [permissions.DESPLIEGUE_DE_PAGO_DELETE]: "Eliminar Despliegue de Pago",

  // Ventas
  [permissions.VENTA_LISTADO]: "Ver Listado de Ventas",
  [permissions.VENTA_CREATE]: "Crear Venta",
  [permissions.VENTA_UPDATE]: "Actualizar Venta",
  [permissions.VENTA_DELETE]: "Eliminar Venta",

  // Clientes
  [permissions.CLIENTE_LISTADO]: "Ver Listado de Clientes",
  [permissions.CLIENTE_CREATE]: "Crear Cliente",
  [permissions.CLIENTE_UPDATE]: "Actualizar Cliente",
  [permissions.CLIENTE_DELETE]: "Eliminar Cliente",

  // cotizaciones

  [permissions.COTIZACION_LISTADO]: "Ver Listado de Cotizaciones",
  [permissions.COTIZACION_CREATE]: "Crear Cotizacion",
  [permissions.COTIZACION_UPDATE]: "Actualizar Cotizacion",
  [permissions.COTIZACION_DELETE]: "Eliminar Cotizacion",

  // Guías de Remisión
  [permissions.GUIA_LISTADO]: "Ver Listado de Guías de Remisión",
  [permissions.GUIA_CREATE]: "Crear Guía de Remisión",
  [permissions.GUIA_UPDATE]: "Actualizar Guía de Remisión",
  [permissions.GUIA_DELETE]: "Eliminar Guía de Remisión",

  // Entregas
  [permissions.ENTREGA_LISTADO]: "Ver Listado de Entregas",
  [permissions.ENTREGA_UPDATE]: "Actualizar Estado de Entrega",
  [permissions.ENTREGA_FINALIZAR]: "Finalizar Entrega",

  // Mis Entregas - Elementos Configurables
  [permissions.MIS_ENTREGAS_FILTRO_FECHA_DESDE]: "Filtro Fecha Desde",
  [permissions.MIS_ENTREGAS_FILTRO_FECHA_HASTA]: "Filtro Fecha Hasta",
  [permissions.MIS_ENTREGAS_FILTRO_ESTADO]: "Filtro Estado",
  [permissions.MIS_ENTREGAS_FILTRO_TIPO_DESPACHO]: "Filtro Tipo Despacho",
  [permissions.MIS_ENTREGAS_FILTRO_BUSCAR]: "Filtro Buscar",
  [permissions.MIS_ENTREGAS_BOTON_BUSCAR]: "Botón Buscar",
  [permissions.MIS_ENTREGAS_TABLA]: "Tabla de Entregas",
  [permissions.MIS_ENTREGAS_CARD_TOTAL]: "Card Total Entregas",
  [permissions.MIS_ENTREGAS_CARD_PENDIENTES]: "Card Pendientes",
  [permissions.MIS_ENTREGAS_CARD_EN_CAMINO]: "Card En Camino",
  [permissions.MIS_ENTREGAS_CARD_COMPLETADAS]: "Card Completadas",
  [permissions.MIS_ENTREGAS_BOTON_VER_MAPA]: "Botón Ver Mapa",
  [permissions.MIS_ENTREGAS_BOTON_EN_CAMINO]: "Botón En Camino",
  [permissions.MIS_ENTREGAS_BOTON_ENTREGAR]: "Botón Entregar",
};

export function getAllPermissions() {
  return Object.entries(permissionstoDescripcion).map(([key, value]) => ({
    name: key,
    descripcion: value,
  }));
}
