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
    <div className='w-full'>
      <Form.List name="productos">
        {(fields) => (
          <TableCotizar form={form} fields={fields} />
        )}
      </Form.List>
    </div>
  )
}
