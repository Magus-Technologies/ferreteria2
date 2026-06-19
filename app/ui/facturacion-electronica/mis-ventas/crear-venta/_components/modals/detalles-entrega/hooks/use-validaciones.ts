import { Form, type FormInstance } from 'antd'
import { TipoPedido } from '~/lib/api/entrega-producto'
import { useDetallesEntrega } from '../context'
import type { TipoDespachoUI } from '../types'

/**
 * Validaciones derivadas del estado del modal — usadas para deshabilitar el
 * botón "Confirmar" cuando faltan campos obligatorios.
 *
 * - `domicilioInvalido`: en Domicilio falta slot, dirección, vehículo o
 *   (despachador interno | cargo externo).
 * - `restoInvalido`: en Parcial con switch "programar resto" activo y algo
 *   que programar, faltan los mismos datos pero de la sección Resto.
 */
export function useValidaciones({
  tipoDespacho,
  form,
  totalAProgramar,
}: {
  tipoDespacho: TipoDespachoUI
  form: FormInstance
  totalAProgramar: number
}) {
  // Watchers reactivos del form — recalculan al instante cuando cambian.
  const despachadorId = Form.useWatch('despachador_id', form) as string | undefined
  const restoDespachadorId = Form.useWatch('_resto_despachador_id', form) as string | undefined
  const vehiculoId = Form.useWatch('vehiculo_id', form) as number | undefined
  const restoVehiculoId = Form.useWatch('_resto_vehiculo_id', form) as number | undefined
  const direccionEntrega = Form.useWatch('direccion_entrega', form) as string | undefined
  const latitud = Form.useWatch('latitud', form) as number | undefined
  const longitud = Form.useWatch('longitud', form) as number | undefined
  const cargoDestino = Form.useWatch('cargo_destino', form) as string | undefined
  const restoCargoDestino = Form.useWatch('_resto_cargo_destino', form) as string | undefined
  const restoDireccionEntrega = Form.useWatch('_resto_direccion_entrega', form) as string | undefined
  const restoLatitud = Form.useWatch('_resto_latitud', form) as number | undefined
  const restoLongitud = Form.useWatch('_resto_longitud', form) as number | undefined

  const { slotDomicilio, slotResto, tipoPedido, tipoPedidoResto, programarResto } = useDetallesEntrega()

  // La dirección no es obligatoria si hay coordenadas GPS — el mapa
  // muestra la ubicación y la referencia puede guiar al despachador.
  const tieneDireccionOGps = !!direccionEntrega?.trim() || (latitud != null && longitud != null)
  const restoTieneDireccionOGps = !!restoDireccionEntrega?.trim() || (restoLatitud != null && restoLongitud != null)

  const domicilioInvalido =
    tipoDespacho === 'Domicilio' &&
    (
      !slotDomicilio ||
      !tieneDireccionOGps ||
      !vehiculoId ||
      (tipoPedido === TipoPedido.INTERNO && !despachadorId) ||
      (tipoPedido === TipoPedido.EXTERNO && !cargoDestino)
    )

  const restoInvalido =
    tipoDespacho === 'Parcial' &&
    programarResto &&
    totalAProgramar > 0 &&
    (
      !slotResto ||
      !restoTieneDireccionOGps ||
      (tipoPedidoResto === TipoPedido.EXTERNO && !restoCargoDestino)
    )

  return {
    domicilioInvalido,
    restoInvalido,
    // Watchers expuestos por si el caller los usa fuera de la validación.
    despachadorId,
    restoDespachadorId,
    vehiculoId,
    restoVehiculoId,
    direccionEntrega,
    latitud,
    longitud,
    cargoDestino,
    restoCargoDestino,
    restoDireccionEntrega,
    restoLatitud,
    restoLongitud,
  }
}
