'use client'

import { FormInstance } from 'antd'
import { FormCreateCotizacion } from '../others/body-cotizar'
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
