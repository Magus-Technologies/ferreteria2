'use client'

import { FormInstance } from 'antd'
import type { FormCreateCotizacion } from '../../_types/cotizacion.types'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsCotizar } from './columns-cotizar'
import { useStoreProductoAgregadoCotizacion } from '../../_store/store-producto-agregado-cotizacion'
import { useEffect } from 'react'

export default function TableCotizar({
  form,
}: {
  form: FormInstance<FormCreateCotizacion>
}) {
  const productoAgregado = useStoreProductoAgregadoCotizacion(
    (store) => store.productoAgregado
  )

  useEffect(() => {
    if (productoAgregado) {
      const productos = form.getFieldValue('productos') || []
      form.setFieldValue('productos', [...productos, productoAgregado])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoAgregado])

  const productos = form.getFieldValue('productos') || []

  return (
    <div className='w-full' style={{ height: '300px' }}>
      <TableWithTitle
        id='cotizar'
        title='PRODUCTOS'
        columnDefs={useColumnsCotizar({ form })}
        rowData={productos}
      />
    </div>
  )
}
