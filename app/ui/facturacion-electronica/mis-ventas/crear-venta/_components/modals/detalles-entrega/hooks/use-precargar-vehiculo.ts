import { useEffect } from 'react'
import type { FormInstance } from 'antd'
import { useAuth } from '~/lib/auth-context'
import { useDetallesEntrega } from '../context'
import type { TipoDespachoUI } from '../types'

/**
 * Precarga el vehículo asignado al usuario logueado en el formulario:
 *  - En **Domicilio**: campo `vehiculo_id`.
 *  - En **Parcial** (cuando el switch "programar resto" está activo): campo
 *    `_resto_vehiculo_id`.
 *
 * Solo precarga si:
 *   - El modal está abierto.
 *   - El usuario tiene un vehículo asignado.
 *   - No hay vehículo ni despachador ya seleccionado en el formulario
 *     (evita pisar la elección manual del usuario).
 *
 * Además expone los setters al state del context para que las secciones
 * muestren el badge "Vehículo asignado: NOMBRE (placa)".
 */
export function usePrecargarVehiculo({
  open,
  tipoDespacho,
  form,
}: {
  open: boolean
  tipoDespacho: TipoDespachoUI
  form: FormInstance
}) {
  const { user } = useAuth()
  const {
    setVehiculoPreseleccionadoDomicilio,
    setVehiculoPreseleccionadoResto,
    programarResto,
  } = useDetallesEntrega()

  // Domicilio
  useEffect(() => {
    if (!open || tipoDespacho !== 'Domicilio') return
    if (!user?.vehiculo || !user.vehiculo.id) return
    if (form.getFieldValue('vehiculo_id')) return
    if (form.getFieldValue('despachador_id')) return

    form.setFieldValue('vehiculo_id', user.vehiculo.id)
    setVehiculoPreseleccionadoDomicilio({
      id: user.vehiculo.id,
      name: user.vehiculo.name,
      tipo: user.vehiculo.tipo,
      placa: user.vehiculo.placa,
    })
  }, [open, tipoDespacho, user, form, setVehiculoPreseleccionadoDomicilio])

  // Resto Parcial
  useEffect(() => {
    if (!open || tipoDespacho !== 'Parcial' || !programarResto) return
    if (!user?.vehiculo || !user.vehiculo.id) return
    if (form.getFieldValue('_resto_vehiculo_id')) return
    if (form.getFieldValue('_resto_despachador_id')) return

    form.setFieldValue('_resto_vehiculo_id', user.vehiculo.id)
    setVehiculoPreseleccionadoResto({
      id: user.vehiculo.id,
      name: user.vehiculo.name,
      tipo: user.vehiculo.tipo,
      placa: user.vehiculo.placa,
    })
  }, [
    open,
    tipoDespacho,
    programarResto,
    user,
    form,
    setVehiculoPreseleccionadoResto,
  ])
}
