'use client'

import { TipoMoneda } from '@prisma/client'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Form, FormInstance, FormListFieldData, Tooltip } from 'antd'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { VentaConUnidadDerivadaNormal } from '../others/header-crear-venta'

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
      minWidth: 90,
      width: 90,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <Tooltip
            classNames={{ body: 'text-center!' }}
            title={form.getFieldValue([
              'productos',
              value,
              'unidad_derivada_name',
            ])}
          >
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
              {form.getFieldValue(['productos', value, 'unidad_derivada_name'])}
            </div>
          </Tooltip>
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
      ),
    },
    {
      headerName: 'Cantidad',
      field: 'name',
      minWidth: 85,
      width: 85,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            size='small'
            propsForm={{
              name: [value, 'cantidad'],
              rules: [{ required: true, message: '' }],
            }}
            precision={2}
            min={0}
            formWithMessage={false}
            onChange={(val) => {
              form.setFieldValue(
                ['productos', value, 'subtotal'],
                Number(val ?? 0) *
                  Number(
                    form.getFieldValue(['productos', value, 'precio_venta']) ??
                      0
                  )
              )
            }}
          />
        </div>
      ),
    },
    {
      headerName: 'Precio',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            prefix={tipo_moneda === TipoMoneda.Soles ? 'S/. ' : '$. '}
            size='small'
            propsForm={{
              name: [value, 'precio_venta'],
              rules: [{ required: true, message: '' }],
            }}
            precision={4}
            min={0}
            formWithMessage={false}
            onChange={(val) => {
              form.setFieldValue(
                ['productos', value, 'subtotal'],
                Number(val ?? 0) *
                  Number(
                    form.getFieldValue(['productos', value, 'cantidad']) ?? 0
                  )
              )
            }}
          />
        </div>
      ),
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
            prefix={tipo_moneda === TipoMoneda.Soles ? 'S/. ' : '$. '}
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
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center gap-2 h-full'>
          <button className='text-rose-700' onClick={() => remove(data!.name!)}>
            x
          </button>
        </div>
      ),
    },
  ]

  return columns
}
