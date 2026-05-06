'use client'

import { Radio, Form, type FormInstance } from 'antd'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import {
  TIPOS_DIRECCION_EMPRESA,
  buildSlotsDireccionEmpresa,
  type TipoDireccionEmpresa,
} from '~/lib/utils/empresa-direcciones-form'

interface RadioDireccionEmpresaProps {
  form: FormInstance
  fieldName?: string
  selectionFieldName?: string
}

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
    form.setFieldValue(selectionFieldName, tipo)
    const slot = slots.find((s) => s.tipo === tipo)
    form.setFieldValue(fieldName, slot?.direccion?.direccion ?? '')
  }

  return (
    <Radio.Group
      value={seleccionActual ?? TIPOS_DIRECCION_EMPRESA[0]}
      onChange={(e) => cambiarDireccion(e.target.value as TipoDireccionEmpresa)}
      className="whitespace-nowrap flex items-center h-8"
    >
      {slots.map((slot) => (
        <Radio key={slot.tipo} value={slot.tipo}>
          {slot.tipo}
        </Radio>
      ))}
    </Radio.Group>
  )
}
