'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { FormInstance, FormListFieldData, Tooltip } from 'antd'
import { useState } from 'react'
import { MdDelete } from 'react-icons/md'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectUnidadDerivada from '~/app/_components/form/selects/select-unidad-derivada'
import { FormCreateProductoProps } from '../modals/modal-create-producto'
import { Prisma, ProductoAlmacenUnidadDerivadaPrecio } from '@prisma/client'

export function useColumnsDetalleDePreciosEdicion({
  form,
  remove,
}: {
  form: FormInstance
  remove: (index: number | number[]) => void
}) {
  const [precios] = useState<
    Omit<
      ProductoAlmacenUnidadDerivadaPrecio,
      'id' | 'producto_almacen_unidad_derivada_id'
    >[]
  >([
    {
      name: 'Precio Especial',
      precio: new Prisma.Decimal('0'),
      activador: new Prisma.Decimal('0'),
      comision: null,
    },
    {
      name: 'Precio Mínimo',
      precio: new Prisma.Decimal('0'),
      activador: new Prisma.Decimal('0'),
      comision: null,
    },
    {
      name: 'Precio Último',
      precio: new Prisma.Decimal('0'),
      activador: new Prisma.Decimal('0'),
      comision: null,
    },
  ])

  const columns: ColDef<FormListFieldData>[] = [
    {
      headerName: 'Formato de Venta',
      field: 'name',
      minWidth: 150,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <SelectUnidadDerivada
            propsForm={{
              name: [value, 'unidad_derivada_id'],
              rules: [
                {
                  required: true,
                  message: '',
                },
                {
                  validator: (_, valInput) => {
                    const existsSameValue = (
                      form.getFieldsValue() as FormCreateProductoProps
                    ).unidades_derivadas.some(
                      (field, index) =>
                        index !== value &&
                        field?.unidad_derivada_id === valInput
                    )

                    if (existsSameValue) return Promise.reject('')

                    return Promise.resolve()
                  },
                },
              ],
            }}
            classNameIcon='hidden'
            formWithMessage={false}
          />
        </div>
      ),
      flex: 2,
    },
    {
      headerName: 'Factor',
      field: 'name',
      minWidth: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            propsForm={{
              name: [value, 'factor'],
              rules: [
                {
                  required: true,
                  message: '',
                },
                {
                  validator: (_, valInput) => {
                    const existsSameValue = (
                      form.getFieldsValue() as FormCreateProductoProps
                    ).unidades_derivadas.some(
                      (field, index) =>
                        index !== value && field?.factor === valInput
                    )

                    if (existsSameValue) return Promise.reject('')

                    return Promise.resolve()
                  },
                },
              ],
            }}
            formWithMessage={false}
            placeholder='Factor'
          />
        </div>
      ),
      flex: 1,
    },
    {
      headerName: 'P. Compra',
      field: 'name',
      minWidth: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            propsForm={{
              name: [value, 'costo'],
              rules: [
                {
                  required: true,
                  message: '',
                },
              ],
            }}
            formWithMessage={false}
            placeholder='P. Compra'
          />
        </div>
      ),
      flex: 1,
    },
    {
      headerName: 'P. Público',
      field: 'name',
      minWidth: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            propsForm={{
              name: [value, 'precio_principal'],
              rules: [
                {
                  required: true,
                  message: '',
                },
              ],
            }}
            formWithMessage={false}
            placeholder='P. Público'
          />
        </div>
      ),
      flex: 1,
    },
    {
      headerName: 'Comisión P. Público',
      field: 'name',
      minWidth: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            propsForm={{
              name: [value, 'comision_principal'],
            }}
            formWithMessage={false}
            placeholder='Comisión P. Público'
          />
        </div>
      ),
      flex: 1,
    },
  ]

  const precioNames = new Set<string>()
  precios.forEach(p => {
    precioNames.add(p.name)
  })

  const dynamicColumns: ColDef<FormListFieldData>[] = Array.from(precioNames)
    .map(
      (name, index) =>
        [
          {
            headerName: name,
            field: 'name',
            minWidth: 110,
            flex: 1,
            cellRenderer: ({
              value,
            }: ICellRendererParams<FormListFieldData>) => (
              <div className='flex items-center h-full'>
                <InputBase
                  propsForm={{
                    name: [value, 'precios', index, 'name'],
                    rules: [
                      {
                        required: true,
                        message: '',
                      },
                    ],
                    initialValue: name,
                    hidden: true,
                  }}
                />
                <InputNumberBase
                  propsForm={{
                    name: [value, 'precios', index, 'precio'],
                    rules: [
                      {
                        required: true,
                        message: '',
                      },
                    ],
                  }}
                  formWithMessage={false}
                  placeholder='Precio'
                />
              </div>
            ),
          },
          {
            headerName: `Comisión ${name}`,
            field: 'name',
            minWidth: 110,
            flex: 1,
            cellRenderer: ({
              value,
            }: ICellRendererParams<FormListFieldData>) => (
              <div className='flex items-center h-full'>
                <InputNumberBase
                  propsForm={{
                    name: [value, 'precios', index, 'comision'],
                  }}
                  formWithMessage={false}
                  placeholder={`Comisión ${name}`}
                />
              </div>
            ),
          },
          {
            headerName: `Activador ${name}`,
            field: 'name',
            minWidth: 110,
            flex: 1,
            cellRenderer: ({
              value,
            }: ICellRendererParams<FormListFieldData>) => (
              <div className='flex items-center h-full'>
                <InputNumberBase
                  propsForm={{
                    name: [value, 'precios', index, 'activador'],
                  }}
                  formWithMessage={false}
                  placeholder={`Activador ${name}`}
                />
              </div>
            ),
          },
        ] as ColDef<FormListFieldData>[]
    )
    .flatMap(item => item)

  const actions: ColDef<FormListFieldData>[] = [
    {
      headerName: 'Acciones',
      field: 'name',
      width: 40,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
          <div className='flex items-center gap-2 h-full'>
            <Tooltip title='Eliminar'>
              <MdDelete
                onClick={() => remove(value)}
                size={15}
                className='cursor-pointer text-rose-700 hover:scale-105 transition-all active:scale-95'
              />
            </Tooltip>
          </div>
        )
      },
    },
  ]

  return [...actions, ...columns, ...dynamicColumns]
}
