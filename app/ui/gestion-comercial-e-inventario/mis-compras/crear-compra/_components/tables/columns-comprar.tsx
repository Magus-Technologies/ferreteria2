'use client'

import { useRef } from 'react'
import { TipoMoneda } from '~/types'
import { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community'
import { Form, FormInstance, FormListFieldData, Tooltip } from 'antd'
import { MdDelete } from 'react-icons/md'
import { TbAlertTriangleFilled } from 'react-icons/tb'
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
  const tipo_de_cambio = Form.useWatch('tipo_de_cambio', form) || 1
  // Captura el valor dólar mientras el usuario escribe sin disparar re-renders
  const dollarValueRefs = useRef<Map<number, number>>(new Map())

  const columns: ColDef<FormListFieldData>[] = [
    {
      colId: 'codigo',
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
      colId: 'producto',
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
          </div>
        )
      },
    },
    {
      colId: 'marca',
      headerName: 'Marca',
      field: 'name',
      minWidth: 100,
      width: 100,
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
      colId: 'unidad',
      headerName: 'Unidad',
      field: 'name',
      minWidth: 100,
      width: 100,
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
                {form.getFieldValue(['productos', value, 'unidad_derivada_name'])}
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
            colId: 'total',
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
            colId: 'entregado',
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
            colId: 'pendiente',
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
      colId: 'cantidad',
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
              disabled={(compra?.recepciones_almacen_count ?? 0) > 0 ||
              (compra?.pagos_de_compras_count ?? 0) > 0}
              readOnly={(compra?.recepciones_almacen_count ?? 0) > 0 ||
              (compra?.pagos_de_compras_count ?? 0) > 0}
              variant={
                (compra?.recepciones_almacen_count ?? 0) > 0 ||
                (compra?.pagos_de_compras_count ?? 0) > 0
                  ? 'borderless'
                  : undefined
              }
            />
          </div>
        )
      },
    },
    {
      colId: 'precio_conversion',
      headerName: 'Precio ($)',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const precioSoles = Number(form.getFieldValue(['productos', value, 'precio_compra']) ?? 0)
        const precioUsd = tipo_de_cambio > 0 ? precioSoles / tipo_de_cambio : 0
        const isReadOnly = (compra?.recepciones_almacen_count ?? 0) > 0 || (compra?.pagos_de_compras_count ?? 0) > 0
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              prefix='$ '
              size='small'
              defaultValue={precioUsd}
              precision={4}
              min={0}
              formWithMessage={false}
              onChange={(val) => {
                // Solo guardar en ref, sin tocar el form → no re-render → no pierde el foco
                if (val !== null && val !== undefined) {
                  dollarValueRefs.current.set(value, Number(val))
                }
              }}
              onBlur={() => {
                const dolares = dollarValueRefs.current.get(value)
                if (dolares === undefined) return
                const soles = dolares * tipo_de_cambio
                form.setFieldValue(['productos', value, 'precio_compra'], soles)
                form.setFieldValue(
                  ['productos', value, 'subtotal'],
                  soles * Number(form.getFieldValue(['productos', value, 'cantidad']) ?? 0)
                )
                onChangeCostoTablaCompras({
                  form,
                  value,
                  costo: soles,
                  producto_id: Number(form.getFieldValue(['productos', value, 'producto_id'])),
                })
                dollarValueRefs.current.delete(value)
              }}
              disabled={isReadOnly}
              readOnly={isReadOnly}
              variant={isReadOnly ? 'borderless' : undefined}
            />
          </div>
        )
      },
      hide: !incluye_precios || tipo_moneda !== TipoMoneda.d,
    },
    {
      colId: 'subtotal_conversion',
      headerName: 'SubTotal ($)',
      field: 'name',
      minWidth: 110,
      width: 110,
      valueGetter: (params: ValueGetterParams<FormListFieldData>) => {
        const value = params.data?.name
        if (value === undefined) return 0
        const allValues = form.getFieldsValue(true)
        const currentTipoDeCambio = Number(allValues.tipo_de_cambio) || 1
        const precioCompraSoles = Number(form.getFieldValue(['productos', value, 'precio_compra']) ?? 0)
        const cantidad = Number(form.getFieldValue(['productos', value, 'cantidad']) ?? 0)
        
        const conversionPrecioDolares = precioCompraSoles / currentTipoDeCambio
        return conversionPrecioDolares * cantidad
      },
      cellRenderer: (params: ICellRendererParams) => {
        return (
          <div className='flex items-center h-full font-semibold text-slate-500 italic'>
            $ 
            {Number(params.value || 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        )
      },
      hide: !incluye_precios || tipo_moneda !== TipoMoneda.d,
    },
    {
      colId: 'precio',
      headerName: 'Precio',
      field: 'name',
      minWidth: 125,
      width: 125,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const precioCompra = Number(form.getFieldValue(['productos', value, 'precio_compra']) ?? 0)
        const costoActual = Number(form.getFieldValue(['productos', value, 'costo_actual']) ?? 0)
        const factor = Number(form.getFieldValue(['productos', value, 'unidad_derivada_factor']) ?? 1)
        const bonificacion = form.getFieldValue(['productos', value, 'bonificacion'])
        const costoEnUnidad = costoActual * factor
        // El costo anterior siempre se compara en soles para la alerta
        const costoCambio = !bonificacion && costoActual > 0 && precioCompra > 0 && Math.abs(precioCompra - costoEnUnidad) > 0.0001

        const productoId = form.getFieldValue(['productos', value, 'producto_id'])
        const unidadDerivadaId = form.getFieldValue(['productos', value, 'unidad_derivada_id'])

        return (
          <div className='flex items-center gap-1 h-full'>
            {costoCambio && (
              <Tooltip title={`Costo anterior: S/. ${costoEnUnidad.toFixed(4)} - Click para ajustar precios de venta`}>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    const event = new CustomEvent('openEditarPreciosModal', {
                      detail: { 
                        productoId, 
                        unidadDerivadaId,
                        costoActual: costoEnUnidad / factor,
                        productoNombre: form.getFieldValue(['productos', value, 'producto_name']),
                        unidadNombre: form.getFieldValue(['productos', value, 'unidad_derivada_name']),
                        factor: factor,
                      }
                    })
                    window.dispatchEvent(event)
                  }}
                  className='flex items-center cursor-pointer hover:scale-110 transition-transform'
                >
                  <TbAlertTriangleFilled size={16} className='text-amber-500 shrink-0' />
                </button>
              </Tooltip>
            )}
            <InputNumberBase
              prefix="S/. "
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
                dollarValueRefs.current.delete(value)
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
              disabled={(compra?.recepciones_almacen_count ?? 0) > 0 ||
              (compra?.pagos_de_compras_count ?? 0) > 0}
              readOnly={(compra?.recepciones_almacen_count ?? 0) > 0 ||
              (compra?.pagos_de_compras_count ?? 0) > 0}
              variant={
                (compra?.recepciones_almacen_count ?? 0) > 0 ||
                (compra?.pagos_de_compras_count ?? 0) > 0
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
      colId: 'subtotal',
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
              prefix="S/. "
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
      colId: 'flete',
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
              prefix="S/. "
              precision={2}
              min={0}
              formWithMessage={false}
              onChange={val => {
                form.setFieldValue(
                  ['productos', value, 'subtotal'],
                  Number(val ?? 0) +
                    Number(
                      form.getFieldValue(['productos', value, 'cantidad']) ?? 0
                    ) *
                      Number(
                        form.getFieldValue([
                          'productos',
                          value,
                          'precio_compra',
                        ]) ?? 0
                      )
                )
              }}
              disabled={(compra?.recepciones_almacen_count ?? 0) > 0 ||
              (compra?.pagos_de_compras_count ?? 0) > 0}
              readOnly={(compra?.recepciones_almacen_count ?? 0) > 0 ||
              (compra?.pagos_de_compras_count ?? 0) > 0}
              variant={
                (compra?.recepciones_almacen_count ?? 0) > 0 ||
                (compra?.pagos_de_compras_count ?? 0) > 0
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
      colId: 'bonificacion',
      headerName: 'Bon.',
      field: 'name',
      minWidth: 40,
      width: 40,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
          <div className='flex items-center h-full'>
            <CheckboxBase
              propsForm={{
                name: [value, 'bonificacion'],
                valuePropName: 'checked',
              }}
              onChange={val => {
                if (val.target.checked) {
                  form.setFieldValue(['productos', value, 'subtotal'], 0)
                  form.setFieldValue(['productos', value, 'precio_compra'], 0)
                  form.setFieldValue(['productos', value, 'flete'], 0)
                }
              }}
              disabled={(compra?.recepciones_almacen_count ?? 0) > 0 ||
              (compra?.pagos_de_compras_count ?? 0) > 0}
            />
          </div>
        )
      },
      hide: !incluye_precios,
    },
    {
      colId: 'vencimiento',
      headerName: 'Vencimiento',
      field: 'name',
      minWidth: 120,
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        return (
          <div className='flex items-center h-full'>
            <DatePickerBase
              propsForm={{
                name: [value, 'vencimiento'],
              }}
              size='small'
              formWithMessage={false}
              disabled={(compra?.recepciones_almacen_count ?? 0) > 0 ||
              (compra?.pagos_de_compras_count ?? 0) > 0}
              readOnly={(compra?.recepciones_almacen_count ?? 0) > 0 ||
              (compra?.pagos_de_compras_count ?? 0) > 0}
              variant={
                (compra?.recepciones_almacen_count ?? 0) > 0 ||
                (compra?.pagos_de_compras_count ?? 0) > 0
                  ? 'borderless'
                  : undefined
              }
            />
          </div>
        )
      },
    },
    {
      colId: 'lote',
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
              disabled={(compra?.recepciones_almacen_count ?? 0) > 0 ||
              (compra?.pagos_de_compras_count ?? 0) > 0}
              readOnly={(compra?.recepciones_almacen_count ?? 0) > 0 ||
              (compra?.pagos_de_compras_count ?? 0) > 0}
              variant={
                (compra?.recepciones_almacen_count ?? 0) > 0 ||
                (compra?.pagos_de_compras_count ?? 0) > 0
                  ? 'borderless'
                  : undefined
              }
            />
          </div>
        )
      },
    },
    {
      colId: 'acciones',
      headerName: 'Acciones',
      field: 'name',
      width: 40,
      minWidth: 40,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (compra?.recepciones_almacen_count ?? 0) > 0 ||
        (compra?.pagos_de_compras_count ?? 0) > 0 ? null : (
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

    const nuevo_precio_compra = factor * costo_unidad
    form.setFieldValue(
      ['productos', index, 'precio_compra'],
      costo_disponible ? nuevo_precio_compra : undefined
    )
    const cantidad = form.getFieldValue(['productos', index, 'cantidad']) ?? 0
    form.setFieldValue(
      ['productos', index, 'subtotal'],
      cantidad * nuevo_precio_compra
    )
  })
}
