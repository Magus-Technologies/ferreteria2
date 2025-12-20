'use client'

import { Form, FormInstance } from 'antd'
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
  const setProductoAgregado = useStoreProductoAgregadoCotizacion(
    (store) => store.setProductoAgregado
  )

  useEffect(() => {
    if (productoAgregado) {
      const productos = form.getFieldValue('productos') || []
      const nuevosProductos = [...productos, productoAgregado];
      form.setFieldValue('productos', nuevosProductos)
      setProductoAgregado(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoAgregado])

  // Usar Form.useWatch para que se re-renderice cuando cambien los productos
  const productos = Form.useWatch('productos', form) || []

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
