/**
 * METADATA DE PERMISOS PARA CONFIGURACIÓN VISUAL
 *
 * Este archivo mapea cada elemento visual de la UI a su permiso correspondiente.
 * Permite configurar visualmente qué roles pueden ver/usar cada componente.
 */

import { permissions } from './permissions'

export type ComponentType =
  | 'page'           // Página completa
  | 'button'         // Botón de acción
  | 'field'          // Campo de formulario
  | 'column'         // Columna de tabla
  | 'modal'          // Modal completo
  | 'section'        // Sección de página

export interface UIComponent {
  id: string                    // ID único del componente
  tipo: ComponentType           // Tipo de componente
  label: string                 // Nombre visible
  descripcion?: string          // Descripción adicional
  permiso: string               // Permiso asociado
  ubicacion: string             // Dónde se encuentra en la UI
  parent?: string               // ID del componente padre (si aplica)
  dependeDe?: string[]          // IDs de otros componentes necesarios
  icono?: string                // Nombre del icono (opcional)
}

export interface UIModule {
  id: string
  nombre: string
  icono: string
  descripcion: string
  componentes: Record<string, UIComponent>
}

/**
 * ========================================
 * MÓDULO: FACTURACIÓN ELECTRÓNICA - VENTAS
 * ========================================
 */
export const facturacionElectronicaVentas: UIModule = {
  id: 'facturacion-electronica-ventas',
  nombre: '💰 Facturación Electrónica - Ventas',
  icono: '📄',
  descripcion: 'Gestión de ventas, cotizaciones, guías de remisión y notas electrónicas',

  componentes: {
    // =======================================
    // PÁGINAS
    // =======================================
    'page-mis-ventas': {
      id: 'page-mis-ventas',
      tipo: 'page',
      label: 'Página Mis Ventas',
      descripcion: 'Acceso al listado completo de ventas',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: '/facturacion-electronica/mis-ventas',
      icono: 'FaFileInvoice'
    },

    'page-crear-venta': {
      id: 'page-crear-venta',
      tipo: 'page',
      label: 'Página Crear Venta',
      descripcion: 'Acceso al formulario de creación de ventas',
      permiso: permissions.VENTA_CREATE,
      ubicacion: '/facturacion-electronica/mis-ventas/crear-venta',
      icono: 'FaPlus',
      dependeDe: ['page-mis-ventas']
    },

    // =======================================
    // BOTONES - MIS VENTAS
    // =======================================
    'btn-buscar-ventas': {
      id: 'btn-buscar-ventas',
      tipo: 'button',
      label: 'Botón Buscar',
      descripcion: 'Aplicar filtros de búsqueda en ventas',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Toolbar de filtros - Mis Ventas',
      parent: 'page-mis-ventas',
      icono: 'FaSearch'
    },

    'btn-ver-pdf-venta': {
      id: 'btn-ver-pdf-venta',
      tipo: 'button',
      label: 'Botón Ver PDF',
      descripcion: 'Visualizar PDF de la venta',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Columna Acciones - Tabla Ventas',
      parent: 'page-mis-ventas',
      icono: 'FaFilePdf'
    },

    'btn-entregar-venta': {
      id: 'btn-entregar-venta',
      tipo: 'button',
      label: 'Botón Entregar',
      descripcion: 'Registrar entrega de productos vendidos',
      permiso: permissions.VENTA_UPDATE,
      ubicacion: 'Toolbar de filtros - Mis Ventas',
      parent: 'page-mis-ventas',
      icono: 'FaTruckFast'
    },

    'btn-ver-entregas': {
      id: 'btn-ver-entregas',
      tipo: 'button',
      label: 'Botón Ver Entregas',
      descripcion: 'Visualizar historial de entregas',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Toolbar de filtros - Mis Ventas',
      parent: 'page-mis-ventas',
      icono: 'FaTruckFast'
    },

    'btn-ver-calendario-entregas': {
      id: 'btn-ver-calendario-entregas',
      tipo: 'button',
      label: 'Botón Ver Calendario',
      descripcion: 'Calendario de entregas programadas',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Toolbar de filtros - Mis Ventas',
      parent: 'page-mis-ventas',
      icono: 'FaCalendar'
    },

    // =======================================
    // CAMPOS - FILTROS MIS VENTAS
    // =======================================
    'field-filtro-fecha': {
      id: 'field-filtro-fecha',
      tipo: 'field',
      label: 'Campo Filtro Fecha',
      descripcion: 'Filtrar ventas por rango de fechas',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Filtros - Mis Ventas',
      parent: 'page-mis-ventas'
    },

    'field-filtro-cliente': {
      id: 'field-filtro-cliente',
      tipo: 'field',
      label: 'Campo Filtro Cliente',
      descripcion: 'Buscar ventas por cliente',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Filtros - Mis Ventas',
      parent: 'page-mis-ventas'
    },

    'field-filtro-almacen': {
      id: 'field-filtro-almacen',
      tipo: 'field',
      label: 'Campo Filtro Almacén',
      descripcion: 'Filtrar ventas por almacén',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Filtros - Mis Ventas',
      parent: 'page-mis-ventas'
    },

    'field-filtro-tipo-documento': {
      id: 'field-filtro-tipo-documento',
      tipo: 'field',
      label: 'Campo Filtro Tipo Documento',
      descripcion: 'Filtrar por tipo de comprobante (Factura/Boleta)',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Filtros - Mis Ventas',
      parent: 'page-mis-ventas'
    },

    'field-filtro-forma-pago': {
      id: 'field-filtro-forma-pago',
      tipo: 'field',
      label: 'Campo Filtro Forma de Pago',
      descripcion: 'Filtrar por forma de pago (Contado/Crédito)',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Filtros - Mis Ventas',
      parent: 'page-mis-ventas'
    },

    'field-filtro-estado': {
      id: 'field-filtro-estado',
      tipo: 'field',
      label: 'Campo Filtro Estado',
      descripcion: 'Filtrar por estado de venta',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Filtros - Mis Ventas',
      parent: 'page-mis-ventas'
    },

    // =======================================
    // COLUMNAS - TABLA MIS VENTAS
    // =======================================
    'col-tipo-documento': {
      id: 'col-tipo-documento',
      tipo: 'column',
      label: 'Columna Tipo Documento',
      descripcion: 'Tipo de comprobante (01-Factura, 03-Boleta)',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Tabla Ventas',
      parent: 'page-mis-ventas'
    },

    'col-fecha': {
      id: 'col-fecha',
      tipo: 'column',
      label: 'Columna Fecha',
      descripcion: 'Fecha de emisión de la venta',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Tabla Ventas',
      parent: 'page-mis-ventas'
    },

    'col-serie-numero': {
      id: 'col-serie-numero',
      tipo: 'column',
      label: 'Columna Serie-Número',
      descripcion: 'Serie y número del comprobante',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Tabla Ventas',
      parent: 'page-mis-ventas'
    },

    'col-cliente': {
      id: 'col-cliente',
      tipo: 'column',
      label: 'Columna Cliente',
      descripcion: 'Documento y nombre del cliente',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Tabla Ventas',
      parent: 'page-mis-ventas'
    },

    'col-subtotal': {
      id: 'col-subtotal',
      tipo: 'column',
      label: 'Columna Subtotal',
      descripcion: 'Subtotal de la venta sin IGV',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Tabla Ventas',
      parent: 'page-mis-ventas'
    },

    'col-igv': {
      id: 'col-igv',
      tipo: 'column',
      label: 'Columna IGV',
      descripcion: 'Monto del IGV (18%)',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Tabla Ventas',
      parent: 'page-mis-ventas'
    },

    'col-total': {
      id: 'col-total',
      tipo: 'column',
      label: 'Columna Total',
      descripcion: 'Total de la venta con IGV',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Tabla Ventas',
      parent: 'page-mis-ventas'
    },

    'col-forma-pago': {
      id: 'col-forma-pago',
      tipo: 'column',
      label: 'Columna Forma de Pago',
      descripcion: 'Contado o Crédito',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Tabla Ventas',
      parent: 'page-mis-ventas'
    },

    'col-estado': {
      id: 'col-estado',
      tipo: 'column',
      label: 'Columna Estado',
      descripcion: 'Estado de la venta (Creado/Procesado)',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Tabla Ventas',
      parent: 'page-mis-ventas'
    },

    'col-usuario': {
      id: 'col-usuario',
      tipo: 'column',
      label: 'Columna Usuario',
      descripcion: 'Usuario que registró la venta',
      permiso: permissions.VENTA_LISTADO,
      ubicacion: 'Tabla Ventas',
      parent: 'page-mis-ventas'
    },

    // =======================================
    // CAMPOS - FORMULARIO CREAR VENTA
    // =======================================
    'field-fecha-venta': {
      id: 'field-fecha-venta',
      tipo: 'field',
      label: 'Campo Fecha',
      descripcion: 'Fecha de emisión de la venta',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta - Fila 1',
      parent: 'page-crear-venta'
    },

    'field-tipo-moneda': {
      id: 'field-tipo-moneda',
      tipo: 'field',
      label: 'Campo Tipo Moneda',
      descripcion: 'Moneda de la venta (PEN/USD)',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta - Fila 1',
      parent: 'page-crear-venta'
    },

    'field-tipo-cambio': {
      id: 'field-tipo-cambio',
      tipo: 'field',
      label: 'Campo Tipo de Cambio',
      descripcion: 'Tipo de cambio del día',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta - Fila 1',
      parent: 'page-crear-venta'
    },

    'field-tipo-documento-venta': {
      id: 'field-tipo-documento-venta',
      tipo: 'field',
      label: 'Campo Tipo Documento',
      descripcion: 'Tipo de comprobante (Factura/Boleta)',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta - Fila 1',
      parent: 'page-crear-venta'
    },

    'field-forma-pago-venta': {
      id: 'field-forma-pago-venta',
      tipo: 'field',
      label: 'Campo Forma de Pago',
      descripcion: 'Forma de pago (Contado/Crédito)',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta - Fila 2',
      parent: 'page-crear-venta'
    },

    'field-dni-ruc-cliente': {
      id: 'field-dni-ruc-cliente',
      tipo: 'field',
      label: 'Campo DNI/RUC Cliente',
      descripcion: 'Documento del cliente',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta - Fila 3',
      parent: 'page-crear-venta',
      dependeDe: ['page-mis-ventas'] // Requiere poder listar clientes
    },

    'field-nombre-cliente': {
      id: 'field-nombre-cliente',
      tipo: 'field',
      label: 'Campo Cliente',
      descripcion: 'Nombre o razón social del cliente',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta - Fila 3',
      parent: 'page-crear-venta'
    },

    'field-direccion-cliente': {
      id: 'field-direccion-cliente',
      tipo: 'field',
      label: 'Campo Dirección',
      descripcion: 'Dirección de envío',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta - Fila 3',
      parent: 'page-crear-venta'
    },

    'field-telefono-cliente': {
      id: 'field-telefono-cliente',
      tipo: 'field',
      label: 'Campo Teléfono',
      descripcion: 'Teléfono de contacto',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta - Fila 4',
      parent: 'page-crear-venta'
    },

    'field-email-cliente': {
      id: 'field-email-cliente',
      tipo: 'field',
      label: 'Campo Email',
      descripcion: 'Email del cliente',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta - Fila 4',
      parent: 'page-crear-venta'
    },

    'field-recomendado-por': {
      id: 'field-recomendado-por',
      tipo: 'field',
      label: 'Campo Recomendado Por',
      descripcion: 'Cliente que recomendó',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta - Fila 4',
      parent: 'page-crear-venta'
    },

    // =======================================
    // BOTONES - CREAR VENTA
    // =======================================
    'btn-guardar-venta': {
      id: 'btn-guardar-venta',
      tipo: 'button',
      label: 'Botón Guardar Venta',
      descripcion: 'Guardar y procesar la venta',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Footer Formulario - Crear Venta',
      parent: 'page-crear-venta',
      icono: 'FaSave'
    },

    'btn-limpiar-formulario': {
      id: 'btn-limpiar-formulario',
      tipo: 'button',
      label: 'Botón Limpiar',
      descripcion: 'Limpiar todos los campos del formulario',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Footer Formulario - Crear Venta',
      parent: 'page-crear-venta',
      icono: 'FaBroom'
    },

    // =======================================
    // SECCIONES - CREAR VENTA
    // =======================================
    'section-productos-venta': {
      id: 'section-productos-venta',
      tipo: 'section',
      label: 'Sección Productos',
      descripcion: 'Tabla de productos agregados a la venta',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta',
      parent: 'page-crear-venta'
    },

    'section-metodos-pago': {
      id: 'section-metodos-pago',
      tipo: 'section',
      label: 'Sección Métodos de Pago',
      descripcion: 'Desglose de pagos por método',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta',
      parent: 'page-crear-venta'
    },

    'section-resumen-venta': {
      id: 'section-resumen-venta',
      tipo: 'section',
      label: 'Sección Resumen',
      descripcion: 'Totales de la venta (Subtotal, IGV, Total)',
      permiso: permissions.VENTA_CREATE,
      ubicacion: 'Formulario Crear Venta',
      parent: 'page-crear-venta'
    },
  }
}

/**
 * EXPORTACIÓN PRINCIPAL
 * Todos los módulos disponibles para configuración visual
 */
export const uiPermissionsMetadata: Record<string, UIModule> = {
  'facturacion-electronica-ventas': facturacionElectronicaVentas,
  // Aquí se agregarán más módulos en el futuro:
  // 'facturacion-electronica-cotizaciones': facturacionElectronicaCotizaciones,
  // 'gestion-comercial-inventario': gestionComercialInventario,
  // etc.
}

/**
 * HELPER: Obtener todos los componentes de un módulo por tipo
 */
export function getComponentsByType(
  moduleId: string,
  tipo: ComponentType
): UIComponent[] {
  const module = uiPermissionsMetadata[moduleId]
  if (!module) return []

  return Object.values(module.componentes).filter(c => c.tipo === tipo)
}

/**
 * HELPER: Obtener árbol jerárquico de componentes
 */
export function getComponentsTree(moduleId: string) {
  const module = uiPermissionsMetadata[moduleId]
  if (!module) return []

  const componentes = Object.values(module.componentes)

  // Raíz: componentes sin padre
  const root = componentes.filter(c => !c.parent)

  // Función recursiva para construir árbol
  const buildTree = (parentId: string): UIComponent[] => {
    return componentes
      .filter(c => c.parent === parentId)
      .map(c => ({
        ...c,
        children: buildTree(c.id)
      }))
  }

  return root.map(c => ({
    ...c,
    children: buildTree(c.id)
  }))
}

/**
 * HELPER: Obtener permisos únicos de un módulo
 */
export function getUniquePermissions(moduleId: string): string[] {
  const module = uiPermissionsMetadata[moduleId]
  if (!module) return []

  const permisos = Object.values(module.componentes).map(c => c.permiso)
  return Array.from(new Set(permisos))
}
