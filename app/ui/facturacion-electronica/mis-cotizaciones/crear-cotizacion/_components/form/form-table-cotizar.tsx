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
      {/* Form.Item oculto para que Ant Design rastree el campo productos */}
      <Form.Item name="productos" hidden initialValue={[]}>
        <input type="hidden" />
      </Form.Item>
      <TableCotizar form={form} />
    </div>
  )
}
