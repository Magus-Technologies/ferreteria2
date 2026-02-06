'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { FormInstance, FormListFieldData, Tooltip } from 'antd'
import { MdDelete } from 'react-icons/md'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectUnidadDerivada from '~/app/_components/form/selects/select-unidad-derivada'
import { FormCreateProductoProps } from '../modals/modal-create-producto'
import { Prisma } from '@prisma/client'

export function useColumnsDetalleDePreciosEdicion({
  form,
  remove,
}: {
  form: FormInstance
  remove: (index: number | number[]) => void
}) {
  const columns: ColDef<FormListFieldData>[] = [
    {
      headerName: 'Formato de Venta',
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
      flex: 1,
    },
    {
      headerName: 'P. Compra',
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
                
                // Validar que el costo sea un número válido
                if (isNaN(costo) || costo === 0) {
                  // Si el costo es 0 o NaN, limpiar los campos calculados
                  form.setFieldValue(
                    ['unidades_derivadas', value, 'p_venta'],
                    0
                  )
                  form.setFieldValue(
                    ['unidades_derivadas', value, 'ganancia'],
                    precio_publico
                  )
                  return
                }
                
                const ganancia = precio_publico - costo
                const p_venta = (ganancia * 100) / costo
                form.setFieldValue(
                  ['unidades_derivadas', value, 'p_venta'],
                  p_venta
                )
                form.setFieldValue(
                  ['unidades_derivadas', value, 'ganancia'],
                  ganancia
                )
              }}
            />
          </div>
        )
      },
      flex: 1,
    },
    {
      headerName: '% Venta',
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
                
                // Validar que el costo sea un número válido y mayor que 0
                const costoNum = Number(costo)
                if (!costo || isNaN(costoNum) || costoNum === 0) return

                const p_venta = val ? Number(val) : 0
                const precio_publico = costoNum + costoNum * (p_venta / 100)
                form.setFieldValue(
                  ['unidades_derivadas', value, 'precio_publico'],
                  precio_publico
                )
                const ganancia = precio_publico - costoNum
                form.setFieldValue(
                  ['unidades_derivadas', value, 'ganancia'],
                  ganancia
                )
              }}
            />
          </div>
        )
      },
      flex: 1,
    },
    {
      headerName: 'P. Público',
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
              placeholder='P. Público'
              precision={2}
              prefix='S/. '
              onChange={val => {
                console.log('🔵 P. Público onChange - value:', value, 'val:', val)
                
                form.setFieldValue(
                  ['unidades_derivadas', value, 'precio_especial'],
                  val
                )
                form.setFieldValue(
                  ['unidades_derivadas', value, 'precio_minimo'],
                  val
                )
                form.setFieldValue(
                  ['unidades_derivadas', value, 'precio_ultimo'],
                  val
                )

                const costo = form.getFieldValue([
                  'unidades_derivadas',
                  value,
                  'costo',
                ])
                
                console.log('🔵 P. Público - costo:', costo)
                
                // Validar que el costo sea un número válido y mayor que 0
                const costoNum = Number(costo)
                if (!costo || isNaN(costoNum) || costoNum === 0) {
                  console.log('🔴 P. Público - costo inválido, retornando')
                  return
                }

                const precio_publico = val ? Number(val) : 0
                const ganancia = precio_publico - costoNum
                const p_venta = (ganancia * 100) / costoNum
                
                console.log('🔵 P. Público - calculando p_venta:', p_venta, 'ganancia:', ganancia)
                
                form.setFieldValue(
                  ['unidades_derivadas', value, 'p_venta'],
                  p_venta
                )
                form.setFieldValue(
                  ['unidades_derivadas', value, 'ganancia'],
                  ganancia
                )
              }}
            />
          </div>
        )
      },
      flex: 1,
    },
    {
      headerName: 'Ganancia',
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
                
                // Validar que el costo sea un número válido y mayor que 0
                const costoNum = Number(costo)
                if (!costo || isNaN(costoNum) || costoNum === 0) return

                const ganancia = val ? Number(val) : 0
                const precio_publico = costoNum + ganancia
                const p_venta = (ganancia * 100) / costoNum
                form.setFieldValue(
                  ['unidades_derivadas', value, 'precio_publico'],
                  precio_publico
                )
                form.setFieldValue(
                  ['unidades_derivadas', value, 'p_venta'],
                  p_venta
                )
              }}
            />
          </div>
        )
      },
      flex: 1,
    },
    {
      headerName: 'Precio Especial',
      field: 'name',
      minWidth: 140,
      flex: 1,
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
              placeholder='Precio Especial'
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
      headerName: 'Precio Mínimo',
      field: 'name',
      minWidth: 140,
      flex: 1,
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
      headerName: 'Precio Último',
      field: 'name',
      minWidth: 140,
      flex: 1,
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
              placeholder='Precio Último'
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
      headerName: 'Comisión P. Público',
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
              placeholder='Comisión P. Público'
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
      flex: 1,
    },
    {
      headerName: 'Comisión Especial',
      field: 'name',
      minWidth: 140,
      flex: 1,
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
      field: 'name',
      minWidth: 140,
      flex: 1,
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
      headerName: 'Comisión Último',
      field: 'name',
      minWidth: 140,
      flex: 1,
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
              placeholder='Comisión Último'
              precision={2}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Activador Especial',
      field: 'name',
      minWidth: 140,
      flex: 1,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'activador_especial'],
              }}
              formWithMessage={false}
              placeholder='Activador Especial'
              precision={2}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Activador Mínimo',
      field: 'name',
      minWidth: 140,
      flex: 1,
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
      headerName: 'Activador Último',
      field: 'name',
      minWidth: 140,
      flex: 1,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              propsForm={{
                name: [value, 'activador_ultimo'],
              }}
              formWithMessage={false}
              placeholder='Activador Último'
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
  console.log('🟡 onChangeComisiones - value:', value, 'suffix:', suffix, 'comision_publica:', comision_publica)
  
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

  console.log('🟡 onChangeComisiones - precio_publico:', precio_publico, 'precio_suffix:', precio_suffix, 'comision_publica_formated:', comision_publica_formated)

  // Validar que todos los valores sean números válidos
  const precioPublicoNum = Number(precio_publico)
  const precioSuffixNum = Number(precio_suffix)
  const comisionPublicaNum = Number(comision_publica_formated)

  // Si algún valor es NaN o undefined, establecer comisión en 0
  if (isNaN(precioPublicoNum) || isNaN(precioSuffixNum) || isNaN(comisionPublicaNum)) {
    console.log('🔴 onChangeComisiones - valores inválidos, estableciendo comisión en 0')
    form.setFieldValue(
      ['unidades_derivadas', value, `comision_${suffix}`],
      0
    )
    return
  }

  const comision_suffix = comisionPublicaNum - (precioPublicoNum - precioSuffixNum)
  console.log('🟡 onChangeComisiones - comision_suffix calculada:', comision_suffix)
  
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

  unidades_derivadas.forEach((item, index) => {
    const factor = Number(item.factor)
    if (costo && index === value) return
    
    // Si no hay costo disponible, establecer en 0 en lugar de undefined
    const costoCalculado = costo_disponible 
      ? Number(Prisma.Decimal(factor).mul(costo_unidad))
      : 0
    
    form.setFieldValue(
      ['unidades_derivadas', index, 'costo'],
      costoCalculado
    )
  })
}
