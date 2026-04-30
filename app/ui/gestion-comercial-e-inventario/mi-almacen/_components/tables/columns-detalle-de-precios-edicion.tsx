'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { FormInstance, FormListFieldData, Tooltip } from 'antd'
import { useMemo } from 'react'
import { MdDelete } from 'react-icons/md'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectUnidadDerivada from '~/app/_components/form/selects/select-unidad-derivada'
import SelectProductoComplementario from '~/app/_components/form/selects/select-producto-complementario'
import { FormCreateProductoProps } from '../modals/modal-create-producto'

export function useColumnsDetalleDePreciosEdicion({
  form,
  remove,
}: {
  form: FormInstance
  remove: (index: number | number[]) => void
}) {
  return useMemo(() => {
  const columns: ColDef<FormListFieldData>[] = [
    {
      headerName: 'Formato de Venta',
      colId: 'formato_venta',
      field: 'name',
      minWidth: 180,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <SelectUnidadDerivada
              showButtonCreate
              propsForm={{
                name: [value, 'unidad_derivada_id'],
                prefix_array_name: ['unidades_derivadas'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                  {
                    validator: (_, valInput) => {
                      const unidades_derivadas = form.getFieldValue(
                        'unidades_derivadas'
                      ) as FormCreateProductoProps['unidades_derivadas']
                      const existsSameValue = unidades_derivadas.some(
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
              form={form}
            />
          </div>
        )
      },
      flex: 2,
    },
    {
      headerName: 'Factor',
      colId: 'factor',
      field: 'name',
      minWidth: 110,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
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
              precision={3}
              onChange={() => {
                onChangeCosto({
                  form,
                  value,
                })
                setTimeout(() => {
                  form.focusField(['unidades_derivadas', value, 'factor'])
                }, 100)
              }}
            />
          </div>
        )
      },
      width: 160,
    },
    {
      headerName: 'Peso (kg)',
      colId: 'peso',
      field: 'name',
      minWidth: 110,
      width: 130,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'peso'],
              }}
              formWithMessage={false}
              placeholder='Peso (kg)'
              precision={3}
              min={0}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Prod. Complementario',
      colId: 'producto_complementario',
      field: 'name',
      width: 280,
      minWidth: 220,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        const complementario = form.getFieldValue([
          'unidades_derivadas',
          value,
          'producto_complementario',
        ])
        const initialOption = complementario
          ? {
              value: complementario.id,
              label: `${complementario.cod_producto} - ${complementario.name}`,
            }
          : undefined
        return (
          <div className='flex items-center h-full'>
            <SelectProductoComplementario
              propsForm={{
                name: [value, 'producto_complementario_id'],
              }}
              form={form}
              formWithMessage={false}
              placeholder='Buscar producto complementario...'
              initialOption={initialOption}
              onChange={(val, producto) => {
                // Establecer explícitamente el ID en el form (necesario para evitar conflictos con Form.Items duplicados)
                form.setFieldValue(
                  ['unidades_derivadas', value, 'producto_complementario_id'],
                  val ?? undefined
                )
                if (!val) {
                  form.setFieldValue(
                    ['unidades_derivadas', value, 'producto_complementario_cantidad'],
                    undefined
                  )
                  form.setFieldValue(
                    ['unidades_derivadas', value, 'producto_complementario'],
                    undefined
                  )
                } else {
                  // Guardar el objeto completo para que initialOption se restaure si el cellRenderer se remonta
                  // (por ejemplo, al editar una comisión que dispara re-render del form)
                  if (producto) {
                    form.setFieldValue(
                      ['unidades_derivadas', value, 'producto_complementario'],
                      {
                        id: producto.id,
                        cod_producto: producto.cod_producto,
                        name: producto.name,
                      }
                    )
                  }
                  const currentCant = form.getFieldValue([
                    'unidades_derivadas',
                    value,
                    'producto_complementario_cantidad',
                  ])
                  if (!currentCant) {
                    form.setFieldValue(
                      ['unidades_derivadas', value, 'producto_complementario_cantidad'],
                      1
                    )
                  }
                }
              }}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Cant. Compl.',
      colId: 'cantidad_complementario',
      field: 'name',
      minWidth: 100,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'producto_complementario_cantidad'],
              }}
              formWithMessage={false}
              placeholder='Cant.'
              precision={3}
              min={0.001}
            />
          </div>
        )
      },
      width: 160,
    },
    {
      headerName: 'P. Compra',
      colId: 'p_compra',
      field: 'name',
      minWidth: 140,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
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
              precision={4}
              prefix='S/. '
              onChange={val => {
                onChangeCosto({
                  form,
                  value,
                  costo: val ? Number(val) : undefined,
                })

                const precio_publico = form.getFieldValue([
                  'unidades_derivadas',
                  value,
                  'precio_publico',
                ])
                if (!precio_publico) return

                const costo = val ? Number(val) : 0

                if (isNaN(costo) || costo === 0) {
                  form.setFields([
                    { name: ['unidades_derivadas', value, 'p_venta'], value: 0 },
                    { name: ['unidades_derivadas', value, 'ganancia'], value: precio_publico },
                  ])
                  return
                }

                const ganancia = precio_publico - costo
                const p_venta = (ganancia * 100) / costo
                form.setFields([
                  { name: ['unidades_derivadas', value, 'p_venta'], value: p_venta },
                  { name: ['unidades_derivadas', value, 'ganancia'], value: ganancia },
                ])
              }}
            />
          </div>
        )
      },
      width: 160,
    },
    {
      headerName: '% Venta',
      colId: 'p_venta',
      field: 'name',
      minWidth: 140,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'p_venta'],
                hasFeedback: false,
              }}
              formWithMessage={false}
              placeholder='% venta'
              suffix='%'
              precision={2}
              onChange={val => {
                const costo = form.getFieldValue([
                  'unidades_derivadas',
                  value,
                  'costo',
                ])
                const costoNum = Number(costo)
                if (!costo || isNaN(costoNum) || costoNum === 0) return

                const p_venta = val ? Number(val) : 0
                const precio_publico = costoNum + costoNum * (p_venta / 100)
                const ganancia = precio_publico - costoNum
                form.setFields([
                  { name: ['unidades_derivadas', value, 'precio_publico'], value: precio_publico },
                  { name: ['unidades_derivadas', value, 'ganancia'], value: ganancia },
                ])
              }}
            />
          </div>
        )
      },
      width: 160,
    },
    {
      headerName: 'Ganancia',
      colId: 'ganancia',
      field: 'name',
      minWidth: 140,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'ganancia'],
                hasFeedback: false,
              }}
              formWithMessage={false}
              placeholder='Ganancia'
              prefix='S/. '
              precision={2}
              onChange={val => {
                const costo = form.getFieldValue([
                  'unidades_derivadas',
                  value,
                  'costo',
                ])
                const costoNum = Number(costo)
                if (!costo || isNaN(costoNum) || costoNum === 0) return

                const ganancia = val ? Number(val) : 0
                const precio_publico = costoNum + ganancia
                const p_venta = (ganancia * 100) / costoNum
                form.setFields([
                  { name: ['unidades_derivadas', value, 'precio_publico'], value: precio_publico },
                  { name: ['unidades_derivadas', value, 'p_venta'], value: p_venta },
                ])
              }}
            />
          </div>
        )
      },
      width: 160,
    },
    {
      headerName: 'PRECIO PUBLICO',
      colId: 'precio_publico',
      field: 'name',
      minWidth: 140,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'precio_publico'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
              }}
              formWithMessage={false}
              placeholder='Precio Público'
              precision={2}
              prefix='S/. '
              onChange={val => {
                const costo = form.getFieldValue([
                  'unidades_derivadas',
                  value,
                  'costo',
                ])
                const costoNum = Number(costo)

                const idx = value as number
                const fields: { name: (string | number)[]; value: unknown }[] = [
                  { name: ['unidades_derivadas', idx, 'precio_especial'], value: val },
                  { name: ['unidades_derivadas', idx, 'precio_minimo'], value: val },
                  { name: ['unidades_derivadas', idx, 'precio_ultimo'], value: val },
                ]

                if (costo && !isNaN(costoNum) && costoNum !== 0) {
                  const precio_publico = val ? Number(val) : 0
                  const ganancia = precio_publico - costoNum
                  const p_venta = (ganancia * 100) / costoNum
                  fields.push(
                    { name: ['unidades_derivadas', idx, 'p_venta'], value: p_venta },
                    { name: ['unidades_derivadas', idx, 'ganancia'], value: ganancia }
                  )
                }

                form.setFields(fields)
              }}
            />
          </div>
        )
      },
      width: 160,
    },
    {
      headerName: 'PRECIO FERRETERÍA',
      colId: 'precio_especial',
      field: 'name',
      minWidth: 140,
      width: 160,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'precio_especial'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
              }}
              prefix='S/. '
              formWithMessage={false}
              placeholder='Precio Ferretería'
              precision={2}
              onChange={() =>
                onChangeComisiones({
                  form,
                  value,
                  suffix: 'especial',
                })
              }
            />
          </div>
        )
      },
    },
    {
      headerName: 'PRECIO MÍNIMO',
      colId: 'precio_minimo',
      field: 'name',
      minWidth: 140,
      width: 160,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'precio_minimo'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
              }}
              prefix='S/. '
              formWithMessage={false}
              placeholder='Precio Mínimo'
              precision={2}
              onChange={() =>
                onChangeComisiones({
                  form,
                  value,
                  suffix: 'minimo',
                })
              }
            />
          </div>
        )
      },
    },
    {
      headerName: 'PRECIO FINAL',
      colId: 'precio_ultimo',
      field: 'name',
      minWidth: 140,
      width: 160,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'precio_ultimo'],
                rules: [
                  {
                    required: true,
                    message: '',
                  },
                ],
              }}
              prefix='S/. '
              formWithMessage={false}
              placeholder='Precio Final'
              precision={2}
              onChange={() =>
                onChangeComisiones({
                  form,
                  value,
                  suffix: 'ultimo',
                })
              }
            />
          </div>
        )
      },
    },
    {
      headerName: 'Comisión Público',
      colId: 'comision_publico',
      field: 'name',
      minWidth: 140,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'comision_publico'],
              }}
              formWithMessage={false}
              placeholder='Comisión Público'
              precision={2}
              prefix='S/. '
              onChange={val => {
                onChangeComisiones({
                  form,
                  value,
                  comision_publica: Number(val),
                  suffix: 'especial',
                })

                onChangeComisiones({
                  form,
                  value,
                  comision_publica: Number(val),
                  suffix: 'minimo',
                })

                onChangeComisiones({
                  form,
                  value,
                  comision_publica: Number(val),
                  suffix: 'ultimo',
                })
              }}
            />
          </div>
        )
      },
      width: 160,
    },
    {
      headerName: 'Comisión Ferretería',
      colId: 'comision_especial',
      field: 'name',
      minWidth: 140,
      width: 160,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'comision_especial'],
              }}
              prefix='S/. '
              formWithMessage={false}
              placeholder='Comisión Especial'
              precision={2}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Comisión Mínimo',
      colId: 'comision_minimo',
      field: 'name',
      minWidth: 140,
      width: 160,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'comision_minimo'],
              }}
              prefix='S/. '
              formWithMessage={false}
              placeholder='Comisión Mínimo'
              precision={2}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Comisión Final',
      colId: 'comision_ultimo',
      field: 'name',
      minWidth: 140,
      width: 160,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'comision_ultimo'],
              }}
              prefix='S/. '
              formWithMessage={false}
              placeholder='Comisión Final'
              precision={2}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Activador Ferretería',
      colId: 'activador_especial',
      field: 'name',
      minWidth: 140,
      width: 160,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'activador_especial'],
              }}
              formWithMessage={false}
              placeholder='Activador Ferretería'
              precision={2}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Activador Mínimo',
      colId: 'activador_minimo',
      field: 'name',
      minWidth: 140,
      width: 160,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'activador_minimo'],
              }}
              formWithMessage={false}
              placeholder='Activador Mínimo'
              precision={2}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Activador Final',
      colId: 'activador_ultimo',
      field: 'name',
      minWidth: 140,
      width: 160,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'activador_ultimo'],
              }}
              formWithMessage={false}
              placeholder='Activador Final'
              precision={2}
            />
          </div>
        )
      },
    },
  ]

  const actions: ColDef<FormListFieldData>[] = [
    {
      headerName: 'Acciones',
      colId: 'acciones',
      field: 'name',
      width: 40,
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

  return [...actions, ...columns]
  }, [form, remove])
}

function onChangeComisiones({
  form,
  value,
  comision_publica,
  suffix,
}: {
  form: FormInstance
  value?: number
  comision_publica?: number
  suffix: string
}) {
  const precio_publico = form.getFieldValue([
    'unidades_derivadas',
    value,
    'precio_publico',
  ])

  const precio_suffix = form.getFieldValue([
    'unidades_derivadas',
    value,
    `precio_${suffix}`,
  ])

  const comision_publica_formated =
    comision_publica ??
    form.getFieldValue(['unidades_derivadas', value, 'comision_publico'])

  const precioPublicoNum = Number(precio_publico)
  const precioSuffixNum = Number(precio_suffix)
  const comisionPublicaNum = Number(comision_publica_formated)

  if (isNaN(precioPublicoNum) || isNaN(precioSuffixNum) || isNaN(comisionPublicaNum)) {
    form.setFieldValue(
      ['unidades_derivadas', value, `comision_${suffix}`],
      0
    )
    return
  }

  const comision_suffix = comisionPublicaNum - (precioPublicoNum - precioSuffixNum)
  form.setFieldValue(
    ['unidades_derivadas', value, `comision_${suffix}`],
    comision_suffix > 0 ? comision_suffix : 0
  )
}

function onChangeCosto({
  form,
  value,
  costo,
}: {
  form: FormInstance
  value?: number
  costo?: number
}) {
  const unidades_derivadas = form.getFieldValue(
    'unidades_derivadas'
  ) as FormCreateProductoProps['unidades_derivadas']
  const factores = (unidades_derivadas ?? []).map(item => item.factor)
  const costos = (unidades_derivadas ?? []).map(item => item.costo)

  const factor = form.getFieldValue(['unidades_derivadas', value, 'factor'])
  let factor_disponible = Number(factor)
  let costo_disponible = costo
  if (!costo) {
    const index_factor_and_costo = factores.findIndex((factor, index) => {
      return (
        factor &&
        Number(factor) !== 0 &&
        costos[index] &&
        Number(costos[index]) !== 0 &&
        index !== value
      )
    })
    if (index_factor_and_costo !== -1) {
      costo_disponible = costos[index_factor_and_costo]
      factor_disponible = Number(factores[index_factor_and_costo])
    }
  }

  const costo_unidad = (costo_disponible ?? 0) / Number(factor_disponible)

  const fields = unidades_derivadas
    .map((item, index) => {
      if (costo && index === value) return null
      // Si el usuario editó explícitamente un costo (costo definido) y esta fila YA tiene
      // un costo asignado (no vacío ni cero), NO sobrescribir. Solo se autocompletan filas
      // que están sin costo (recién agregadas).
      if (costo) {
        const costoExistente = item?.costo
        const costoExistenteNum = Number(costoExistente)
        const yaTieneCosto =
          costoExistente !== undefined &&
          costoExistente !== null &&
          !isNaN(costoExistenteNum) &&
          costoExistenteNum !== 0
        if (yaTieneCosto) return null
      }
      const factor = Number(item.factor)
      const costoCalculado = costo_disponible ? factor * costo_unidad : 0
      return { name: ['unidades_derivadas', index, 'costo'] as (string | number)[], value: costoCalculado }
    })
    .filter((f): f is { name: (string | number)[]; value: number } => f !== null)

  if (fields.length > 0) form.setFields(fields)
}
