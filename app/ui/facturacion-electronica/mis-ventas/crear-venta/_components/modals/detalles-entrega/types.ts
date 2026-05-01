/**
 * Tipos del modal "Detalles de Entrega".
 *
 * Se extrajeron del archivo monolítico (`../modal-detalles-entrega.tsx`)
 * como primer paso del refactor. Otros archivos de esta carpeta los
 * importan desde aquí.
 */

import type { FormInstance } from 'antd'
import type { ReactNode } from 'react'
import type { ModoConfirmar } from './hooks/use-confirmar-entrega'
import type { ProductoEntrega } from '../../../../_hooks/use-productos-entrega'

/**
 * Coordenadas geográficas — usadas para el mapa de Mapbox y la tabla.
 */
export interface Coordenadas {
  lat: number
  lng: number
}

/**
 * Tipo de despacho a nivel de UI del modal — distinto del enum del API.
 * Aquí los 3 modos son los que el usuario elige al "Cobrar / Crear venta a crédito":
 *   - EnTienda: el cliente recoge en tienda inmediatamente.
 *   - Domicilio: el chofer entrega a domicilio (programado).
 *   - Parcial: una parte se entrega ahora, el resto se programa.
 */
export type TipoDespachoUI = 'EnTienda' | 'Domicilio' | 'Parcial'

/**
 * Snapshot del vehículo asignado al usuario logueado — usado para precargar
 * el campo "vehículo" en las secciones de Domicilio y Resto Parcial.
 *
 * No usamos `Vehiculo` del API porque solo necesitamos estos 4 campos para
 * mostrar el badge "Vehículo asignado: NOMBRE (placa)".
 */
export interface VehiculoPreseleccionado {
  id: number
  name: string
  tipo: string
  placa: string | null
}

/**
 * Llaves de secciones del modal que pueden ocultarse vía el prop `ocultar`.
 * Útil para reusar el modal en `mis-entregas`, donde algunas piezas ya no
 * aplican (la venta ya existe, los productos ya están fijados, etc.).
 *
 * - `quien-entrega`: selector "¿Quién entrega?" (EnTienda + Parcial).
 * - `omitir`: botón "Omitir" del footer.
 * - `tabla-productos`: tabla AG Grid de productos (Domicilio + Parcial).
 * - `tipo-pedido`: selector Interno/Externo (Domicilio + Resto Parcial).
 * - `programar-resto`: switch "Programar entrega del resto" (Parcial).
 */
export type SeccionOcultable =
  | 'quien-entrega'
  | 'omitir'
  | 'tabla-productos'
  | 'tipo-pedido'
  | 'programar-resto'

/**
 * Props públicas del componente `<ModalDetallesEntrega>`.
 * Lo que recibe desde fuera (cards-info-venta, etc.).
 */
export interface ModalDetallesEntregaProps {
  open: boolean
  setOpen: (open: boolean) => void
  form: FormInstance
  ventaId?: string
  tipoDespacho: TipoDespachoUI
  onConfirmar: () => void
  onEditarCliente: () => void
  direccion?: string
  clienteNombre?: string
  clienteId?: number
  /**
   * Lista de secciones a ocultar — vacío por defecto (modo `crear-venta`).
   * Cuando se reusa el modal desde `mis-entregas`, se pasan claves como
   * `['quien-entrega','omitir','tabla-productos','programar-resto']` para
   * que el modal solo muestre los campos editables de la entrega existente.
   */
  ocultar?: SeccionOcultable[]
  /**
   * Modo del botón "Confirmar".
   *
   * - `{ kind: 'crear-venta', ventaId? }` (default): crea o edita una venta
   *   con su entrega (uso en `mis-ventas/crear-venta`).
   * - `{ kind: 'actualizar-entrega', entregaId }`: actualiza una entrega
   *   existente (uso en `mis-entregas`).
   *
   * Si se omite, se infiere `crear-venta` con el `ventaId` recibido por prop.
   */
  mode?: ModoConfirmar
  /**
   * Productos iniciales para poblar la tabla de la sección Parcial/Domicilio.
   * Útil al reusar el modal en `mis-entregas`, donde la entrega ya existe
   * y los productos vienen del backend (no del form de la venta).
   */
  productosIniciales?: ProductoEntrega[]
  /**
   * Override del subtítulo bajo "CONFIGURAR ENTREGA". Por defecto se deriva
   * de `tipoDespacho` ("Despacho en Tienda" / "Despacho a Domicilio" /
   * "Despacho Parcial"). Útil cuando se reusa el modal y el `tipoDespacho`
   * lógico no coincide con lo que el usuario ve (ej: forzar Parcial-UI con
   * header de "Despacho en Tienda" en mis-entregas).
   */
  tituloOverride?: string
  /**
   * Info adicional a mostrar bajo el subtítulo (quien_entrega, despachador,
   * etc.). Pensado para `mis-entregas` donde algunos datos son read-only.
   * Acepta ReactNode para incluir texto + acciones (botones) inline.
   */
  infoExtra?: ReactNode
  /**
   * Acciones a mostrar al lado del título "CONFIGURAR ENTREGA". Pensado
   * para botones contextuales como "Cambiar tipo de entrega".
   */
  accionesHeader?: ReactNode
}
