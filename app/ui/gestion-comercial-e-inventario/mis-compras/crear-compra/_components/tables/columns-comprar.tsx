'use client'

import { Prisma, TipoMoneda } from '@prisma/client'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Form, FormInstance, FormListFieldData, Tooltip } from 'antd'
import { MdDelete } from 'react-icons/md'
import CheckboxBase from '~/app/_components/form/checkbox/checkbox-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { FormCreateCompra } from '../others/body-comprar'
import { CompraConUnidadDerivadaNormal } from '../others/header'

export function useColumnsComprar({
  form,
  remove,
  incluye_precios = true,
  cantidad_pendiente = false,
  compra,
}: {
  form: FormInstance
  remove: (index: number | number[]) => void
  incluye_precios?: boolean
  cantidad_pendiente?: boolean
  compra?: CompraConUnidadDerivadaNormal
}) {
  const tipo_moneda = Form.useWatch('tipo_moneda', form)

  const columns: ColDef<FormListFieldData>[] = [
    {
      headerName: 'Código',
      field: 'name',
      minWidth: 70,
      width: 70,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
          <div className='flex items-center h-full'>
            <Tooltip
              classNames={{ body: 'text-center!' }}
              title={form.getFieldValue([
                'productos',
                value,
                'producto_codigo',
              ])}
            >
              <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
                {form.getFieldValue(['productos', value, 'producto_codigo'])}
              </div>
            </Tooltip>
            <InputBase
              propsForm={{
                name: [value, 'producto_codigo'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
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
      headerName: 'Producto',
      field: 'name',
      minWidth: 250,
      width: 250,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'producto_id'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
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
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
                hidden: true,
              }}
              readOnly
              variant='borderless'
              formWithMessage={false}
            />
            <CheckboxBase
              propsForm={{
                name: [value, 'bonificacion'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
                hidden: true,
              }}
              formWithMessage={false}
            />
          </div>
        )
      },
      flex: 1,
    },
    {
      headerName: 'Marca',
      field: 'name',
      minWidth: 120,
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
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
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
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
      headerName: 'Unidad Derivada',
      field: 'name',
      minWidth: 90,
      width: 90,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
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
                {form.getFieldValue([
                  'productos',
                  value,
                  'unidad_derivada_name',
                ])}
              </div>
            </Tooltip>
            <InputNumberBase
              propsForm={{
                name: [value, 'unidad_derivada_id'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputNumberBase
              propsForm={{
                name: [value, 'unidad_derivada_factor'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputBase
              propsForm={{
                name: [value, 'unidad_derivada_name'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
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
    ...((cantidad_pendiente
      ? [
          {
            headerName: 'Total',
            field: 'name',
            minWidth: 85,
            width: 85,
            cellRenderer: ({
              value,
            }: ICellRendererParams<FormListFieldData>) => {
              return (
                <div className='flex items-center h-full'>
                  {(
                    Number(
                      form.getFieldValue([
                        'productos',
                        value,
                        'cantidad_recepcionada',
                      ])
                    ) +
                    Number(
                      form.getFieldValue([
                        'productos',
                        value,
                        'cantidad_pendiente',
                      ])
                    )
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )
            },
          },
          {
            headerName: 'Entregado',
            field: 'name',
            minWidth: 85,
            width: 85,
            cellRenderer: ({
              value,
            }: ICellRendererParams<FormListFieldData>) => {
              return (
                <div className='flex items-center h-full'>
                  {Number(
                    form.getFieldValue([
                      'productos',
                      value,
                      'cantidad_recepcionada',
                    ])
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )
            },
          },
          {
            headerName: 'Pendiente',
            field: 'name',
            minWidth: 85,
            width: 85,
            cellRenderer: ({
              value,
            }: ICellRendererParams<FormListFieldData>) => {
              return (
                <div className='flex items-center h-full'>
                  {Number(
                    form.getFieldValue([
                      'productos',
                      value,
                      'cantidad_pendiente',
                    ])
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )
            },
          },
        ]
      : []) as ColDef<FormListFieldData>[]),
    {
      headerName: 'Cantidad',
      field: 'name',
      minWidth: 85,
      width: 85,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              size='small'
              propsForm={{
                name: [value, 'cantidad'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
              }}
              precision={2}
              min={0}
              max={
                cantidad_pendiente
                  ? Number(
                      form.getFieldValue([
                        'productos',
                        value,
                        'cantidad_pendiente',
                      ])
                    )
                  : undefined
              }
              formWithMessage={false}
              onChange={val => {
                form.setFieldValue(
                  ['productos', value, 'subtotal'],
                  Number(val ?? 0) *
                    Number(
                      form.getFieldValue([
                        'productos',
                        value,
                        'precio_compra',
                      ]) ?? 0
                    )
                )
              }}
              disabled={(compra?._count?.recepciones_almacen ?? 0) > 0}
              readOnly={(compra?._count?.recepciones_almacen ?? 0) > 0}
              variant={
                (compra?._count?.recepciones_almacen ?? 0) > 0
                  ? 'borderless'
                  : undefined
              }
            />
          </div>
        )
      },
    },
    {
      headerName: 'Precio',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              prefix={tipo_moneda === TipoMoneda.Soles ? 'S/. ' : '$. '}
              size='small'
              propsForm={{
                name: [value, 'precio_compra'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
                hidden: form.getFieldValue([
                  'productos',
                  value,
                  'bonificacion',
                ]),
              }}
              precision={4}
              min={0}
              formWithMessage={false}
              onChange={val => {
                form.setFieldValue(
                  ['productos', value, 'subtotal'],
                  Number(val ?? 0) *
                    Number(
                      form.getFieldValue(['productos', value, 'cantidad']) ?? 0
                    )
                )
                onChangeCostoTablaCompras({
                  form,
                  value,
                  costo: Number(val ?? 0),
                  producto_id: Number(
                    form.getFieldValue(['productos', value, 'producto_id'])
                  ),
                })
              }}
              disabled={(compra?._count?.recepciones_almacen ?? 0) > 0}
              readOnly={(compra?._count?.recepciones_almacen ?? 0) > 0}
              variant={
                (compra?._count?.recepciones_almacen ?? 0) > 0
                  ? 'borderless'
                  : undefined
              }
            />
          </div>
        )
      },
      hide: !incluye_precios,
    },
    {
      headerName: 'SubTotal',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              size='small'
              propsForm={{
                name: [value, 'subtotal'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
                hidden: form.getFieldValue([
                  'productos',
                  value,
                  'bonificacion',
                ]),
              }}
              prefix={tipo_moneda === TipoMoneda.Soles ? 'S/. ' : '$. '}
              precision={2}
              formWithMessage={false}
              readOnly
              variant='borderless'
            />
          </div>
        )
      },
      hide: !incluye_precios,
    },
    {
      headerName: 'Flete',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              size='small'
              propsForm={{
                name: [value, 'flete'],
              }}
              prefix='S/. '
              precision={4}
              min={0}
              formWithMessage={false}
              disabled={(compra?._count?.recepciones_almacen ?? 0) > 0}
              readOnly={(compra?._count?.recepciones_almacen ?? 0) > 0}
              variant={
                (compra?._count?.recepciones_almacen ?? 0) > 0
                  ? 'borderless'
                  : undefined
              }
            />
          </div>
        )
      },
      hide: !incluye_precios,
    },
    {
      headerName: 'F. Vencimiento',
      field: 'name',
      minWidth: 150,
      width: 150,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
          <div className='flex items-center h-full'>
            <DatePickerBase
              propsForm={{
                name: [value, 'vencimiento'],
              }}
              placeholder='Vencimiento'
              formWithMessage={false}
              size='small'
              disabled={(compra?._count?.recepciones_almacen ?? 0) > 0}
              readOnly={(compra?._count?.recepciones_almacen ?? 0) > 0}
              variant={
                (compra?._count?.recepciones_almacen ?? 0) > 0
                  ? 'borderless'
                  : undefined
              }
            />
          </div>
        )
      },
    },
    {
      headerName: 'Lote',
      field: 'name',
      minWidth: 120,
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
          <div className='flex items-center h-full'>
            <InputBase
              propsForm={{
                name: [value, 'lote'],
              }}
              size='small'
              formWithMessage={false}
              disabled={(compra?._count?.recepciones_almacen ?? 0) > 0}
              readOnly={(compra?._count?.recepciones_almacen ?? 0) > 0}
              variant={
                (compra?._count?.recepciones_almacen ?? 0) > 0
                  ? 'borderless'
                  : undefined
              }
            />
          </div>
        )
      },
    },
    {
      headerName: 'Acciones',
      field: 'name',
      width: 40,
      minWidth: 40,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (compra?._count?.recepciones_almacen ?? 0) > 0 ? null : (
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

export function onChangeCostoTablaCompras({
  form,
  value,
  costo,
  producto_id,
}: {
  form: FormInstance
  value?: number
  costo?: number
  producto_id: number
}) {
  const productos = form.getFieldValue(
    'productos'
  ) as FormCreateCompra['productos']
  const unidades_derivadas = (productos ?? []).map(
    item => item.unidad_derivada_factor ?? 1
  )

  const factor =
    form.getFieldValue(['productos', value, 'unidad_derivada_factor']) ?? 1
  const factor_disponible = Number(factor)
  const costo_disponible = costo ?? 0

  const costo_unidad = (costo_disponible ?? 0) / Number(factor_disponible)

  unidades_derivadas.forEach((factor, index) => {
    if (costo && index === value) return
    if (productos[index].producto_id !== producto_id) return

    const nuevo_precio_compra = Prisma.Decimal(factor).mul(costo_unidad)
    form.setFieldValue(
      ['productos', index, 'precio_compra'],
      costo_disponible ? Number(nuevo_precio_compra) : undefined
    )
    const cantidad = form.getFieldValue(['productos', index, 'cantidad']) ?? 0
    form.setFieldValue(
      ['productos', index, 'subtotal'],
      Number(Prisma.Decimal(cantidad).mul(nuevo_precio_compra))
    )
  })
}
