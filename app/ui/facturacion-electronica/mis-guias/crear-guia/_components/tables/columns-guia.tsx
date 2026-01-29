'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { FormInstance, FormListFieldData, Tooltip } from 'antd'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { MdDelete } from 'react-icons/md'

export function useColumnsGuia({
  form,
  remove,
}: {
  form: FormInstance
  remove: (index: number | number[]) => void
}) {
  const columns: ColDef<FormListFieldData>[] = [
    {
      headerName: 'Código',
      field: 'name',
      minWidth: 100,
      width: 100,
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
      headerName: 'U. Medida',
      field: 'name',
      minWidth: 100,
      width: 100,
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
      minWidth: 100,
      width: 100,
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
          />
        </div>
      ),
    },
    {
      headerName: 'Costo',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            prefix='S/. '
            size='small'
            propsForm={{
              name: [value, 'costo'],
              rules: [{ required: true, message: '' }],
            }}
            precision={4}
            min={0}
            formWithMessage={false}
          />
        </div>
      ),
    },
    {
      headerName: 'P. Venta',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
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
      headerName: 'Acciones',
      field: 'name',
      width: 80,
      minWidth: 80,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
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
