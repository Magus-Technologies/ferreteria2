'use client'

import { useState } from 'react'
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
  const productos = Form.useWatch('productos', form) || []

  /** Obtener todos los productos de un paquete dado el index del primer producto */
  function getPaqueteProductos(firstIndex: number) {
    const paqueteId = productos[firstIndex]?.paquete_id
    if (!paqueteId) return null
    const items: { index: number; data: any }[] = []
    productos.forEach((p: any, i: number) => {
      if (p.paquete_id === paqueteId) items.push({ index: i, data: p })
    })
    return items
  }

  /** Calcular totales de un paquete */
  function getPaqueteTotales(firstIndex: number) {
    const items = getPaqueteProductos(firstIndex)
    if (!items) return null
    let totalPrecio = 0, totalDescuento = 0, totalRecargo = 0, totalSubtotal = 0
    for (const item of items) {
      totalPrecio += Number(item.data.precio_venta || 0) * Number(item.data.cantidad || 0)
      totalDescuento += Number(item.data.descuento || 0) * Number(item.data.cantidad || 0)
      totalRecargo += Number(item.data.recargo || 0) * Number(item.data.cantidad || 0)
      totalSubtotal += Number(item.data.subtotal || 0)
    }
    return { items, totalPrecio, totalDescuento, totalRecargo, totalSubtotal }
  }

  const [paqueteDetalle, setPaqueteDetalle] = useState<{ nombre: string; productos: any[] } | null>(null)

  const columns: ColDef<FormListFieldData>[] = [
    {
      headerName: '#',
      field: 'name',
      colId: '#',
      width: 50,
      minWidth: 50,
      suppressNavigable: true,
      lockPosition: 'left',
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        // Count group number (paquetes count as 1)
        let numeroGrupo = 0
        const paquetesVistos = new Set<number>()

        for (let i = 0; i <= value; i++) {
          const itemPaqueteId = productos[i]?.paquete_id
          if (itemPaqueteId) {
            if (!paquetesVistos.has(itemPaqueteId)) {
              paquetesVistos.add(itemPaqueteId)
              numeroGrupo++
            }
          } else {
            numeroGrupo++
          }
        }

        return (
          <div className='flex items-center h-full justify-center'>
            <span className='font-semibold text-gray-700'>{numeroGrupo}</span>
          </div>
        )
      },
      type: 'numberColumn',
    },
    {
      headerName: 'Código',
      field: 'name',
      minWidth: 70,
      width: 70,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const paqueteId = productos[value]?.paquete_id
        if (paqueteId) {
          return (
            <div className='flex items-center h-full'>
              <InputBase propsForm={{ name: [value, 'producto_codigo'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }
        return (
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
        )
      },
    },
    {
      headerName: 'Producto',
      field: 'name',
      minWidth: 250,
      width: 250,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const paqueteId = productos[value]?.paquete_id
        const paqueteNombre = productos[value]?.paquete_nombre
        const productoName = productos[value]?.producto_name
        const tipo = productos[value]?._tipo
        const servicioNombre = productos[value]?.servicio_nombre
        const servicioReferencia = productos[value]?.servicio_referencia

        return (
          <div className='flex flex-col h-full justify-center gap-1'>
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
            {/* Campos hidden para información del paquete */}
            <InputNumberBase
              propsForm={{
                name: [value, 'paquete_id'],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputBase
              propsForm={{
                name: [value, 'paquete_nombre'],
                hidden: true,
              }}
              formWithMessage={false}
            />
            {/* Campos hidden para servicios */}
            <InputBase
              propsForm={{
                name: [value, '_tipo'],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputNumberBase
              propsForm={{
                name: [value, 'servicio_id'],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputBase
              propsForm={{
                name: [value, 'servicio_nombre'],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputBase
              propsForm={{
                name: [value, 'servicio_codigo_sunat'],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputBase
              propsForm={{
                name: [value, 'servicio_referencia'],
                hidden: true,
              }}
              formWithMessage={false}
            />

            {paqueteId ? (
              <>
                <div
                  className='px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded text-xs font-bold w-fit cursor-pointer hover:bg-cyan-200 transition-colors'
                  onClick={() => {
                    const items = getPaqueteProductos(value)
                    if (items) {
                      setPaqueteDetalle({
                        nombre: paqueteNombre || '',
                        productos: items.map(item => item.data),
                      })
                    }
                  }}
                >
                  📦 {paqueteNombre}
                </div>
                <div className='text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap'>
                  {(() => {
                    const items = getPaqueteProductos(value)
                    if (!items) return ''
                    const names = items.map(item => item.data.producto_name).join(', ')
                    return `${items.length} prod: ${names}`
                  })()}
                </div>
              </>
            ) : (
              <>
                {tipo === 'servicio' && (
                  <div className='px-2 py-0.5 bg-violet-100 text-violet-800 rounded text-xs font-bold w-fit'>
                    SERVICIO
                  </div>
                )}
                <Tooltip classNames={{ body: 'text-center!' }} title={tipo === 'servicio' ? servicioNombre : productoName}>
                  <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
                    {tipo === 'servicio' ? servicioNombre : productoName}
                  </div>
                </Tooltip>
                {tipo === 'servicio' && servicioReferencia && (
                  <div className='text-xs text-gray-400 italic overflow-hidden text-ellipsis whitespace-nowrap'>
                    {servicioReferencia}
                  </div>
                )}
              </>
            )}
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
        )
      },
      flex: 1,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: 'Marca',
      field: 'name',
      minWidth: 120,
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const paqueteId = productos[value]?.paquete_id
        if (paqueteId) {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-400'>-</span>
              <InputBase propsForm={{ name: [value, 'marca_name'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }
        const tipo = form.getFieldValue(['productos', value, '_tipo'])
        return (
          <div className='flex items-center h-full'>
            {tipo === 'servicio' ? (
              <span className='text-gray-400'>-</span>
            ) : (
              <Tooltip
                classNames={{ body: 'text-center!' }}
                title={form.getFieldValue(['productos', value, 'marca_name'])}
              >
                <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
                  {form.getFieldValue(['productos', value, 'marca_name'])}
                </div>
              </Tooltip>
            )}
            <InputBase
              propsForm={{
                name: [value, 'marca_name'],
                rules: tipo === 'servicio' ? undefined : [{ required: true, message: '' }],
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
      minWidth: 150,
      width: 150,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const paqueteId = productos[value]?.paquete_id
        if (paqueteId) {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-400'>-</span>
              <InputNumberBase propsForm={{ name: [value, 'unidad_derivada_id'], hidden: true }} formWithMessage={false} />
              <InputNumberBase propsForm={{ name: [value, 'unidad_derivada_factor'], hidden: true }} formWithMessage={false} />
              <InputBase propsForm={{ name: [value, 'unidad_derivada_name'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }
        const productoId = form.getFieldValue(['productos', value, 'producto_id']);
        const tipo = form.getFieldValue(['productos', value, '_tipo']);

        return (
          <div className='flex items-center h-full'>
            {tipo === 'servicio' ? (
              <span className='text-violet-600 text-xs font-medium'>SERVICIO</span>
            ) : (
              <SelectUnidadDerivadaVenta
                form={form}
                fieldIndex={value}
                productoId={productoId}
              />
            )}
            <InputNumberBase
              propsForm={{
                name: [value, 'unidad_derivada_id'],
                rules: tipo === 'servicio' ? undefined : [{ required: true, message: '' }],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputNumberBase
              propsForm={{
                name: [value, 'unidad_derivada_factor'],
                rules: tipo === 'servicio' ? undefined : [{ required: true, message: '' }],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputBase
              propsForm={{
                name: [value, 'unidad_derivada_name'],
                rules: tipo === 'servicio' ? undefined : [{ required: true, message: '' }],
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
        const paqueteId = productos[value]?.paquete_id
        if (paqueteId) {
          const items = getPaqueteProductos(value)
          return (
            <div className='flex items-center h-full justify-center'>
              <span className='text-sm font-medium text-cyan-700'>{items?.length || 0} prod.</span>
              <InputNumberBase propsForm={{ name: [value, 'cantidad'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }
        const cantidad = form.getFieldValue(['productos', value, 'cantidad'])
        const unidad_derivada_factor = form.getFieldValue(['productos', value, 'unidad_derivada_factor'])
        const stock_fraccion = form.getFieldValue(['productos', value, 'stock_fraccion'])
        const tipo = form.getFieldValue(['productos', value, '_tipo'])

        // Calcular si hay stock insuficiente (solo para productos)
        const cantidadEnFraccion = Number(cantidad || 0) * Number(unidad_derivada_factor || 1)
        const stockDisponible = Number(stock_fraccion || 0)
        const stockEnUnidad = stockDisponible / Number(unidad_derivada_factor || 1)
        const stockInsuficiente = tipo !== 'servicio' && cantidadEnFraccion > stockDisponible

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
        )
      },
    },
    {
      headerName: 'Precio',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const paqueteId = productos[value]?.paquete_id
        if (paqueteId) {
          const totales = getPaqueteTotales(value)
          return (
            <div className='flex items-center h-full'>
              <span className='text-sm'>{tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'} {(totales?.totalPrecio || 0).toFixed(2)}</span>
              <InputNumberBase propsForm={{ name: [value, 'precio_venta'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }
        return (
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
        )
      },
    },
    {
      headerName: 'Recargo',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const paqueteId = productos[value]?.paquete_id
        if (paqueteId) {
          const totales = getPaqueteTotales(value)
          return (
            <div className='flex items-center h-full'>
              <span className='text-sm'>{tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'} {(totales?.totalRecargo || 0).toFixed(2)}</span>
              <InputNumberBase propsForm={{ name: [value, 'recargo'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }
        return (
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
        )
      },
    },
    {
      headerName: 'Descuento',
      field: 'name',
      minWidth: 160,
      width: 160,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const paqueteId = productos[value]?.paquete_id
        if (paqueteId) {
          const totales = getPaqueteTotales(value)
          return (
            <div className='flex items-center h-full'>
              <span className='text-sm'>{tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'} {(totales?.totalDescuento || 0).toFixed(2)}</span>
              <SelectDescuentoTipo
                tipoMoneda={tipo_moneda}
                formWithMessage={false}
                size='small'
                propsForm={{
                  name: [value, 'descuento_tipo'],
                  hidden: true,
                }}
              />
              <InputNumberBase propsForm={{ name: [value, 'descuento'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }
        return (
          <div className='flex items-center h-full gap-1'>
            <SelectDescuentoTipo
              tipoMoneda={tipo_moneda}
              formWithMessage={false}
              size='small'
              propsForm={{
                name: [value, 'descuento_tipo'],
                hasFeedback: false,
              }}
              onChange={() => {
                calcularSubtotalForm({ form, value })
                // Forzar re-render de la fila para actualizar el prefix del input
                form.setFieldValue(['productos', value, '_refresh'], Date.now())
              }}
            />
            <Form.Item noStyle shouldUpdate={(prev, curr) => {
              return prev.productos?.[value]?.descuento_tipo !== curr.productos?.[value]?.descuento_tipo
            }}>
              {() => {
                const descuento_tipo = form.getFieldValue(['productos', value, 'descuento_tipo'])
                const isPorcentaje = descuento_tipo === DescuentoTipo.PORCENTAJE
                
                return (
                  <InputNumberBase
                    prefix={isPorcentaje ? undefined : (tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. ')}
                    suffix={isPorcentaje ? '%' : undefined}
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
                )
              }}
            </Form.Item>
          </div>
        )
      },
    },
    {
      headerName: 'SubTotal',
      field: 'name',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const paqueteId = productos[value]?.paquete_id
        if (paqueteId) {
          const totales = getPaqueteTotales(value)
          return (
            <div className='flex items-center h-full'>
              <span className='text-sm font-semibold'>{tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'} {(totales?.totalSubtotal || 0).toFixed(2)}</span>
              <InputNumberBase propsForm={{ name: [value, 'subtotal'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }
        return (
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
        const paqueteId = form.getFieldValue(['productos', value, 'paquete_id'])

        const handleEliminar = () => {
          if (paqueteId) {
            // Eliminar todos los productos del mismo paquete
            const indices: number[] = []
            const allProductos = form.getFieldValue('productos') || []
            allProductos.forEach((_: any, i: number) => {
              if (form.getFieldValue(['productos', i, 'paquete_id']) === paqueteId) {
                indices.push(i)
              }
            })
            // Eliminar en orden inverso para no afectar los índices
            remove(indices.reverse())
          } else {
            remove(value!)
          }
        }

        return (
          <div className='flex items-center gap-2 h-full'>
            <Tooltip title={paqueteId ? 'Eliminar paquete completo' : 'Eliminar'}>
              <MdDelete
                onClick={handleEliminar}
                size={15}
                className='cursor-pointer text-rose-700 hover:scale-105 transition-all active:scale-95'
              />
            </Tooltip>
          </div>
        )
      },
    },
  ]

  return { columns, paqueteDetalle, setPaqueteDetalle }
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
