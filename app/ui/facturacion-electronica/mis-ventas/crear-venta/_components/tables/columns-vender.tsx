'use client'

import { DescuentoTipo, TipoMoneda } from '~/lib/api/venta'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Form, FormInstance, FormListFieldData, Tooltip } from 'antd'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { VentaConUnidadDerivadaNormal } from '../others/header-crear-venta'
import SelectDescuentoTipo from '~/app/_components/form/selects/select-descuento-tipo'
import { MdDelete } from 'react-icons/md'
import SelectUnidadDerivadaVenta from '../form/select-unidad-derivada-venta'

export function useColumnsVender({
  form,
  remove,
  cantidad_pendiente = false,
  venta,
}: {
  form: FormInstance
  remove: (index: number | number[]) => void
  cantidad_pendiente?: boolean
  venta?: VentaConUnidadDerivadaNormal
}) {
  console.log('🚀 ~ useColumnsVender ~ venta:', venta)
  console.log('🚀 ~ useColumnsVender ~ cantidad_pendiente:', cantidad_pendiente)
  const tipo_moneda = Form.useWatch('tipo_moneda', form)

  const columns: ColDef<FormListFieldData>[] = [
    {
      headerName: 'Código',
      field: 'name',
      minWidth: 70,
      width: 70,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
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
        </div>
      ),
    },
    {
      headerName: 'Producto',
      field: 'name',
      minWidth: 250,
      width: 250,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            propsForm={{
              name: [value, 'producto_id'],
              rules: [{ required: true, message: '' }],
              hidden: true,
            }}
            formWithMessage={false}
          />
          <InputNumberBase
            propsForm={{
              name: [value, 'stock_fraccion'],
              hidden: true,
            }}
            formWithMessage={false}
          />
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
      flex: 1,
    },
    {
      headerName: 'Marca',
      field: 'name',
      minWidth: 120,
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
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
      headerName: 'Unidad Derivada',
      field: 'name',
      minWidth: 150,
      width: 150,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const productoId = form.getFieldValue(['productos', value, 'producto_id']);
        
        return (
          <div className='flex items-center h-full'>
            <SelectUnidadDerivadaVenta
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
        );
      },
    },
    {
      headerName: 'Cantidad',
      field: 'name',
      minWidth: 120,
      width: 120,
      wrapText: true,
      autoHeight: true,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const cantidad = form.getFieldValue(['productos', value, 'cantidad'])
        const unidad_derivada_factor = form.getFieldValue(['productos', value, 'unidad_derivada_factor'])
        const stock_fraccion = form.getFieldValue(['productos', value, 'stock_fraccion'])
        const unidad_derivada_name = form.getFieldValue(['productos', value, 'unidad_derivada_name'])

        // Calcular si hay stock insuficiente
        const cantidadEnFraccion = Number(cantidad || 0) * Number(unidad_derivada_factor || 1)
        const stockDisponible = Number(stock_fraccion || 0)
        const stockEnUnidad = stockDisponible / Number(unidad_derivada_factor || 1)
        const stockInsuficiente = cantidadEnFraccion > stockDisponible

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
                ⚠️ Stock insuficiente. Disponible: {stockEnUnidad.toFixed(2)} {unidad_derivada_name}
              </div>
            )}
          </div>
        )
      },
    },
    {
      headerName: 'Precio',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            prefix={tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. '}
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
      headerName: 'Recargo',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            prefix={tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. '}
            size='small'
            propsForm={{
              name: [value, 'recargo'],
            }}
            precision={4}
            min={0}
            formWithMessage={false}
            onChange={() => calcularSubtotalForm({ form, value })}
          />
        </div>
      ),
    },
    {
      headerName: 'Descuento',
      field: 'name',
      minWidth: 160,
      width: 160,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const descuento_tipo = form.getFieldValue(['productos', value, 'descuento_tipo'])
        const isPorcentaje = descuento_tipo === DescuentoTipo.PORCENTAJE
        
        return (
          <div className='flex items-center h-full gap-1'>
            <SelectDescuentoTipo
              formWithMessage={false}
              size='small'
              propsForm={{
                name: [value, 'descuento_tipo'],
                hasFeedback: false,
              }}
              onChange={() => calcularSubtotalForm({ form, value })}
            />
            <InputNumberBase
              prefix={isPorcentaje ? '' : (tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. ')}
              suffix={isPorcentaje ? '%' : ''}
              size='small'
              className='w-full'
              propsForm={{
                name: [value, 'descuento'],
              }}
              precision={isPorcentaje ? 2 : 4}
              min={0}
              max={isPorcentaje ? 100 : undefined}
              formWithMessage={false}
              onChange={() => calcularSubtotalForm({ form, value })}
            />
          </div>
        )
      },
    },
    {
      headerName: 'SubTotal',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            size='small'
            propsForm={{
              name: [value, 'subtotal'],
              rules: [{ required: true, message: '' }],
            }}
            prefix={tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. '}
            precision={2}
            formWithMessage={false}
            readOnly
            variant='borderless'
          />
        </div>
      ),
    },
    {
      headerName: 'Acciones',
      field: 'name',
      width: 40,
      minWidth: 40,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          // (compra?._count?.recepciones_almacen ?? 0) > 0 ||
          // (compra?._count?.pagos_de_compras ?? 0) > 0 ? null : (
          <div className='flex items-center gap-2 h-full'>
            <Tooltip title='Eliminar'>
              <MdDelete
                onClick={() => remove(value!)}
                size={15}
                className='cursor-pointer text-rose-700 hover:scale-105 transition-all active:scale-95'
              />
            </Tooltip>
          </div>
        )
      },
    },
  ]

  return columns
}

function calcularSubtotalForm({
  form,
  value,
}: {
  form: FormInstance
  value: number
}) {
  form.setFieldValue(
    ['productos', value, 'subtotal'],
    calcularSubtotalVenta({
      precio_venta: Number(
        form.getFieldValue(['productos', value, 'precio_venta']) ?? 0
      ),
      recargo: Number(form.getFieldValue(['productos', value, 'recargo']) ?? 0),
      descuento_tipo: form.getFieldValue([
        'productos',
        value,
        'descuento_tipo',
      ]) as DescuentoTipo,
      descuento: Number(
        form.getFieldValue(['productos', value, 'descuento']) ?? 0
      ),
      cantidad: Number(
        form.getFieldValue(['productos', value, 'cantidad']) ?? 0
      ),
    })
  )
}

export function calcularSubtotalVenta({
  precio_venta,
  recargo,
  descuento_tipo,
  descuento,
  cantidad,
}: {
  precio_venta: number
  recargo: number
  descuento_tipo: DescuentoTipo
  descuento: number
  cantidad: number
}) {
  return (
    (Number(precio_venta) + Number(recargo)) * Number(cantidad) -
    (descuento_tipo === DescuentoTipo.PORCENTAJE
      ? ((Number(precio_venta) + Number(recargo)) *
          Number(descuento) *
          Number(cantidad)) /
        100
      : Number(descuento))
  )
}
