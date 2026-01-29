'use client'

import { Form, FormInstance } from 'antd'
import type { FormCreateCotizacion } from '../../_types/cotizacion.types'
import TableCotizar from '../tables/table-cotizar'

export default function FormTableCotizar({
  form,
}: {
  form: FormInstance<FormCreateCotizacion>
}) {
  return (
    <Form.List name="productos">
      {(fields, { add, remove }) => (
        <TableCotizar form={form} fields={fields} remove={remove} add={add} />
      )}
    </Form.List>
  )
}
