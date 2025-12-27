import { FormInstance } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'

export default function useInitGuia({
  guia,
  form,
}: {
  guia?: any
  form: FormInstance
}) {
  useEffect(() => {
    if (guia) {
      // TODO: Inicializar formulario con datos de guía existente
      form.setFieldsValue({
        ...guia,
        fecha_emision: dayjs(guia.fecha_emision),
        fecha_traslado: dayjs(guia.fecha_traslado),
      })
    } else {
      // Valores por defecto para nueva guía
      form.setFieldsValue({
        fecha_emision: dayjs(),
        fecha_traslado: dayjs(),
        afecta_stock: 'true',
        validar_modalidad: true,
        validar_costo: true,
        tipo_guia: 'ELECTRONICA_REMITENTE',
      })
    }
  }, [guia, form])
}
