'use client'

import { Radio, Form, Tooltip, type FormInstance } from 'antd'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import {
  TIPOS_DIRECCION_EMPRESA,
  buildSlotsDireccionEmpresa,
  type TipoDireccionEmpresa,
} from '~/lib/utils/empresa-direcciones-form'

interface RadioDireccionEmpresaProps {
  form: FormInstance
  /**
   * Nombre del campo del form que se actualiza al cambiar la dirección.
   * Por defecto `punto_partida` (uso típico en guías de remisión), pero
   * cualquier vista futura puede usarlo con su propio nombre, ej:
   * `direccion_origen` o `direccion_facturacion_empresa`.
   */
  fieldName?: string
  /**
   * Nombre del campo que guarda la selección actual (`'D1'..'D4'`).
   * Permite tener varias instancias en el mismo form — útil si una vista
   * tiene "punto de partida" + "dirección de facturación" simultáneamente.
   */
  selectionFieldName?: string
}

/**
 * Selector D1/D2/D3/D4 de direcciones de la EMPRESA. Espejo de
 * `<RadioDireccionCliente>` pero leyendo `direcciones[]` de la empresa
 * pública (`useEmpresaPublica`). Los slots vacíos se deshabilitan con
 * tooltip explicativo.
 *
 * Cuando el usuario cambia de slot, escribe el valor en el campo del form
 * indicado por `fieldName`. La selección actual se guarda en
 * `selectionFieldName` para que el form la mantenga al re-renderizar.
 */
export default function RadioDireccionEmpresa({
  form,
  fieldName = 'punto_partida',
  selectionFieldName = 'empresa_direccion_seleccionada',
}: RadioDireccionEmpresaProps) {
  const { data: empresa } = useEmpresaPublica()
  const seleccionActual = Form.useWatch(selectionFieldName, form) as
    | TipoDireccionEmpresa
    | undefined

  const slots = buildSlotsDireccionEmpresa(empresa?.direcciones)

  const cambiarDireccion = (tipo: TipoDireccionEmpresa) => {
    const slot = slots.find((s) => s.tipo === tipo)
    if (!slot?.direccion) return
    form.setFieldValue(selectionFieldName, tipo)
    form.setFieldValue(fieldName, slot.direccion.direccion)
  }

  return (
    <Radio.Group
      value={seleccionActual ?? TIPOS_DIRECCION_EMPRESA[0]}
      onChange={(e) => cambiarDireccion(e.target.value as TipoDireccionEmpresa)}
      className="whitespace-nowrap flex items-center h-8"
    >
      {slots.map((slot) => {
        const disabled = !slot.direccion
        const radio = (
          <Radio
            key={slot.tipo}
            value={slot.tipo}
            disabled={disabled}
          >
            {slot.tipo}
          </Radio>
        )
        return disabled ? (
          <Tooltip
            key={slot.tipo}
            title="Esta dirección no está registrada en Mi Empresa."
          >
            {radio}
          </Tooltip>
        ) : (
          radio
        )
      })}
    </Radio.Group>
  )
}
