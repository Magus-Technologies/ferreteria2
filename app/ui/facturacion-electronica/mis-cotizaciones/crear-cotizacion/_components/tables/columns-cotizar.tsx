'use client'

import { FormInstance, Tooltip } from 'antd'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import type { FormCreateCotizacion, DescuentoTipo } from '../../_types/cotizacion.types'
import { FaTrash } from 'react-icons/fa'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectUnidadDerivadaCotizacion from '../form/select-unidad-derivada-cotizacion'
import SelectTipoPrecioCotizacion from '../form/select-tipo-precio-cotizacion'

export function calcularSubtotalCotizacion({
  precio_venta,
  recargo = 0,
  cantidad,
  descuento = 0,
  descuento_tipo,
}: {
  precio_venta: number
  recargo?: number
  cantidad: number
  descuento?: number
  descuento_tipo: DescuentoTipo
}) {
  const precioConRecargo = precio_venta + recargo
  const subtotalSinDescuento = precioConRecargo * cantidad

  if (descuento_tipo === 'Monto') {
    return (subtotalSinDescuento - descuento).toFixed(2)
  } else {
    const descuentoCalculado = (subtotalSinDescuento * descuento) / 100
    return (subtotalSinDescuento - descuentoCalculado).toFixed(2)
  }
}

function calcularSubtotalForm({
  form,
  value,
}: {
  form: FormInstance
  value: number
}) {
  const precio_venta = Number(
    form.getFieldValue(['productos', value, 'precio_venta']) ?? 0
  )
  const recargo = Number(form.getFieldValue(['productos', value, 'recargo']) ?? 0)
  const cantidad = Number(
    form.getFieldValue(['productos', value, 'cantidad']) ?? 0
  )
  const descuento = Number(
    form.getFieldValue(['productos', value, 'descuento']) ?? 0
  )
  const descuento_tipo = form.getFieldValue([
    'productos',
    value,
    'descuento_tipo',
  ]) as DescuentoTipo

  const subtotal = calcularSubtotalCotizacion({
    precio_venta,
    recargo,
    cantidad,
    descuento,
    descuento_tipo: descuento_tipo || 'Monto',
  })

  form.setFieldValue(['productos', value, 'subtotal'], Number(subtotal))
}

export function useColumnsCotizar({
  form,
}: {
  form: FormInstance<FormCreateCotizacion>
}): ColDef[] {
  return [
    // {
    //   headerName: '#',
    //   valueGetter: 'node.rowIndex + 1',
    //   width: 50,
    //   pinned: 'left',
    // },
    {
      colId: 'codigo',
      headerName: 'Código',
      field: 'name',
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <Tooltip
            classNames={{ body: 'text-center!' }}
            title={form.getFieldValue(['productos', value, 'producto_codigo'])}
          >
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
              {form.getFieldValue(['productos', value, 'producto_codigo'])}
            </div>
          </Tooltip>
          <InputBase
            propsForm={{
              name: [value, 'producto_codigo'],
              rules: [{ required: true, message: '' }],
              hidden: true,
            }}
            readOnly
            variant='borderless'
            formWithMessage={false}
          />
          <InputNumberBase
            propsForm={{
              name: [value, 'producto_id'],
              rules: [{ required: true, message: '' }],
              hidden: true,
            }}
            formWithMessage={false}
          />
        </div>
      ),
    },
    {
      colId: 'descripcion',
      headerName: 'Descripción',
      field: 'name',
      flex: 1,
      minWidth: 200,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <Tooltip
            classNames={{ body: 'text-center!' }}
            title={form.getFieldValue(['productos', value, 'producto_name'])}
          >
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
              {form.getFieldValue(['productos', value, 'producto_name'])}
            </div>
          </Tooltip>
          <InputBase
            propsForm={{
              name: [value, 'producto_name'],
              rules: [{ required: true, message: '' }],
              hidden: true,
            }}
            readOnly
            variant='borderless'
            formWithMessage={false}
          />
        </div>
      ),
    },
    {
      colId: 'marca',
      headerName: 'Marca',
      field: 'name',
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <Tooltip
            classNames={{ body: 'text-center!' }}
            title={form.getFieldValue(['productos', value, 'marca_name'])}
          >
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
              {form.getFieldValue(['productos', value, 'marca_name'])}
            </div>
          </Tooltip>
          <InputBase
            propsForm={{
              name: [value, 'marca_name'],
              rules: [{ required: true, message: '' }],
              hidden: true,
            }}
            readOnly
            variant='borderless'
            formWithMessage={false}
          />
        </div>
      ),
    },
    {
      colId: 'unidad_medida',
      headerName: 'U.Medida',
      field: 'name',
      width: 150,
      cellRenderer: ({ value }: ICellRendererParams) => {
        const productoId = form.getFieldValue(['productos', value, 'producto_id'])
        
        return (
          <div className='flex items-center h-full'>
            <SelectUnidadDerivadaCotizacion
              form={form}
              fieldIndex={value}
              productoId={productoId}
            />
            <InputNumberBase
              propsForm={{
                name: [value, 'unidad_derivada_id'],
                rules: [{ required: true, message: '' }],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputNumberBase
              propsForm={{
                name: [value, 'unidad_derivada_factor'],
                rules: [{ required: true, message: '' }],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputBase
              propsForm={{
                name: [value, 'unidad_derivada_name'],
                rules: [{ required: true, message: '' }],
                hidden: true,
              }}
              readOnly
              variant='borderless'
              formWithMessage={false}
            />
          </div>
        )
      },
    },
    {
      colId: 'tipo_precio',
      headerName: 'Tipo Precio',
      field: 'name',
      width: 130,
      cellRenderer: ({ value }: ICellRendererParams) => {
        const productoId = form.getFieldValue(['productos', value, 'producto_id'])

        return (
          <div className='flex items-center h-full'>
            <SelectTipoPrecioCotizacion
              form={form}
              fieldIndex={value}
              productoId={productoId}
            />
            <InputBase
              propsForm={{
                name: [value, 'tipo_precio'],
                hidden: true,
              }}
              readOnly
              variant='borderless'
              formWithMessage={false}
            />
          </div>
        )
      },
    },
    {
      colId: 'cantidad',
      headerName: 'Cant.',
      field: 'name',
      width: 120,
      wrapText: true,
      autoHeight: true,
      cellRenderer: ({ value }: ICellRendererParams) => {
        const cantidad = form.getFieldValue(['productos', value, 'cantidad']);
        const unidad_derivada_factor = form.getFieldValue(['productos', value, 'unidad_derivada_factor']);
        const stock_fraccion = form.getFieldValue(['productos', value, 'stock_fraccion']);

        const cantidadEnFraccion = Number(cantidad || 0) * Number(unidad_derivada_factor || 1);
        const stockDisponible = Number(stock_fraccion || 0);
        const stockEnUnidad = stockDisponible / Number(unidad_derivada_factor || 1);
        const stockInsuficiente = cantidadEnFraccion > stockDisponible;

        return (
          <div className='flex flex-col justify-center w-full py-2'>
            <InputNumberBase
              size='small'
              propsForm={{
                name: [value, 'cantidad'],
                rules: [{ required: true, message: '' }],
              }}
              precision={2}
              min={0}
              formWithMessage={false}
              onChange={() => calcularSubtotalForm({ form, value })}
            />
            {stockInsuficiente && cantidad && (
              <div className='text-red-600 text-[11px] mt-1 font-medium leading-tight'>
                ⚠️ Stock: {stockEnUnidad.toFixed(2)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      colId: 'precio',
      headerName: 'Precio',
      field: 'name',
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            prefix='S/. '
            size='small'
            propsForm={{
              name: [value, 'precio_venta'],
              rules: [{ required: true, message: '' }],
            }}
            precision={4}
            min={0}
            formWithMessage={false}
            readOnly
            variant='borderless'
          />
        </div>
      ),
    },
    {
      colId: 'subtotal',
      headerName: 'Subtotal',
      field: 'name',
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            size='small'
            propsForm={{
              name: [value, 'subtotal'],
              rules: [{ required: true, message: '' }],
            }}
            prefix='S/. '
            precision={2}
            formWithMessage={false}
            readOnly
            variant='borderless'
          />
        </div>
      ),
    },
    {
      colId: 'acciones',
      headerName: 'Acciones',
      field: 'name',
      width: 100,
      pinned: 'right',
      cellRenderer: ({ value }: ICellRendererParams) => {
        return (
          <button
            onClick={() => {
              const productos = (form.getFieldValue('productos') || []) as FormCreateCotizacion['productos']
              const newProductos = productos.filter(
                (_, index: number) => index !== value
              )
              form.setFieldValue('productos', newProductos)
            }}
            className='text-red-600 hover:text-red-800 p-2'
          >
            <FaTrash />
          </button>
        )
      },
    },
  ]
}
