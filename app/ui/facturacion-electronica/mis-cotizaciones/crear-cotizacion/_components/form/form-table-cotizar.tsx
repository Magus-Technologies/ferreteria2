'use client'

import { FormInstance } from 'antd'
import type { FormCreateCotizacion } from '../../_types/cotizacion.types'
import TableCotizar from '../tables/table-cotizar'

export default function FormTableCotizar({
  form,
}: {
  form: FormInstance<FormCreateCotizacion>
}) {
  return (
    <div className='w-full'>
      <TableCotizar form={form} />
    </div>
  )
}
