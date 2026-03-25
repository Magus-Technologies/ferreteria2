'use client'

import { DescuentoTipo, TipoMoneda } from '~/lib/api/venta'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Form, FormInstance, FormListFieldData, Tooltip } from 'antd'
import { useRef } from 'react'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { VentaConUnidadDerivadaNormal } from '../others/header-crear-venta'
import SelectDescuentoTipo from '~/app/_components/form/selects/select-descuento-tipo'
import { MdDelete } from 'react-icons/md'
import SelectUnidadDerivadaVenta from '../form/select-unidad-derivada-venta'
import SelectTipoPrecioVenta from '../form/select-tipo-precio-venta'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'

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
  const recalcDebounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const productosVentaStore = useStoreProductoAgregadoVenta((store) => store.productos)

  const monedaPrefix = tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'

  /** Recalcular sub-productos de un paquete cuando cambia cantidad_paquete */
  function recalcularSubProductosPaquete(paqueteId: number, nuevaCantidadPaquete: number) {
    const allProductos = form.getFieldValue('productos') || []
    const updates = [...allProductos]
    let precioPaqueteUnitario = 0

    // Primero calcular totales por unidad de paquete
    for (let i = 0; i < updates.length; i++) {
      if (updates[i]?.paquete_id === paqueteId && updates[i]?._tipo_fila === 'paquete_producto') {
        const cantidadBase = Number(updates[i].cantidad_base || 0)
        const precio = Number(updates[i].precio_venta || 0)
        const descuento = Number(updates[i].descuento || 0)
        precioPaqueteUnitario += (precio - descuento) * cantidadBase
      }
    }

    // Actualizar sub-productos y cabecera
    for (let i = 0; i < updates.length; i++) {
      if (updates[i]?.paquete_id === paqueteId) {
        if (updates[i]._tipo_fila === 'paquete_producto') {
          const cantidadBase = Number(updates[i].cantidad_base || 0)
          const nuevaCantidad = cantidadBase * nuevaCantidadPaquete
          updates[i] = {
            ...updates[i],
            cantidad: nuevaCantidad,
            subtotal: calcularSubtotalVenta({
              precio_venta: Number(updates[i].precio_venta || 0),
              recargo: Number(updates[i].recargo || 0),
              descuento_tipo: updates[i].descuento_tipo || DescuentoTipo.MONTO,
              descuento: Number(updates[i].descuento || 0),
              cantidad: nuevaCantidad,
            }),
          }
        } else if (updates[i]._tipo_fila === 'paquete_cabecera') {
          updates[i] = {
            ...updates[i],
            cantidad_paquete: nuevaCantidadPaquete,
            cantidad: nuevaCantidadPaquete,
            precio_venta: precioPaqueteUnitario,
            subtotal: precioPaqueteUnitario * nuevaCantidadPaquete,
          }
        }
      }
    }

    form.setFieldValue('productos', updates)
  }

  /** Obtener totales de sub-productos de un paquete */
  function getPaqueteSubtotales(paqueteId: number) {
    const allProductos = form.getFieldValue('productos') || []
    let total = 0
    for (const p of allProductos) {
      if (p?.paquete_id === paqueteId && p?._tipo_fila === 'paquete_producto') {
        total += Number(p.subtotal || 0)
      }
    }
    return total
  }

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
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        // Sub-productos de paquete no muestran número
        if (tipoFila === 'paquete_producto') {
          return <div className='flex items-center h-full justify-center'><span className='text-gray-300'>┗</span></div>
        }

        // Vale promocional
        if (tipoFila === 'vale_promocional') {
          return <div className='flex items-center h-full justify-center'><span className='text-green-600 font-bold'>🎟️</span></div>
        }

        // Contar número de grupo (cabeceras de paquete y productos normales, no vales)
        let numeroGrupo = 0
        for (let i = 0; i <= value; i++) {
          const tipo = form.getFieldValue(['productos', i, '_tipo_fila'])
          if (tipo !== 'paquete_producto' && tipo !== 'vale_promocional') {
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
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              {tipoFila === 'vale_promocional' && (
                <span className='text-green-600 text-xs font-medium'>{form.getFieldValue(['productos', value, 'producto_codigo'])}</span>
              )}
              <InputBase propsForm={{ name: [value, 'producto_codigo'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        const codigo = form.getFieldValue(['productos', value, 'producto_codigo'])

        return (
          <div className='flex items-center h-full'>
            <Tooltip classNames={{ body: 'text-center!' }} title={codigo}>
              <div className={`overflow-hidden text-ellipsis whitespace-nowrap ${tipoFila === 'paquete_producto' ? 'text-gray-600 text-xs' : ''}`}>
                {codigo}
              </div>
            </Tooltip>
            <InputBase
              propsForm={{
                name: [value, 'producto_codigo'],
                rules: tipoFila ? undefined : [{ required: true, message: '' }],
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
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])
        const paqueteNombre = form.getFieldValue(['productos', value, 'paquete_nombre'])
        const productoName = form.getFieldValue(['productos', value, 'producto_name'])
        const tipo = form.getFieldValue(['productos', value, '_tipo'])
        const servicioNombre = form.getFieldValue(['productos', value, 'servicio_nombre'])
        const servicioReferencia = form.getFieldValue(['productos', value, 'servicio_referencia'])

        // Hidden fields comunes
        const hiddenFields = (
          <>
            <InputNumberBase propsForm={{ name: [value, 'producto_id'], rules: tipoFila === 'paquete_cabecera' ? undefined : [{ required: true, message: '' }], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'stock_fraccion'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'paquete_id'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, 'paquete_nombre'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, '_tipo'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, '_tipo_fila'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'servicio_id'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, 'servicio_nombre'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, 'servicio_codigo_sunat'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, 'servicio_referencia'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'cantidad_paquete'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'cantidad_base'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, 'producto_name'], rules: tipoFila === 'paquete_cabecera' ? undefined : [{ required: true, message: '' }], hidden: true }} readOnly variant='borderless' formWithMessage={false} />
          </>
        )

        // Paquete cabecera - fondo amarillo/ámbar
        if (tipoFila === 'paquete_cabecera') {
          return (
            <div className='flex flex-col h-full justify-center gap-0.5'>
              {hiddenFields}
              <div className='flex items-center gap-2'>
                <span className='text-amber-700 font-bold text-sm'>📦 {paqueteNombre}</span>
              </div>
            </div>
          )
        }

        // Sub-producto de paquete - estilo atenuado
        if (tipoFila === 'paquete_producto') {
          return (
            <div className='flex flex-col h-full justify-center gap-0.5'>
              {hiddenFields}
              <div className='text-gray-500 text-[13px] overflow-hidden text-ellipsis whitespace-nowrap pl-2'>
                ↳ {productoName}
              </div>
            </div>
          )
        }

        // Vale promocional - texto verde
        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex flex-col h-full justify-center gap-0.5'>
              {hiddenFields}
              <div className='text-green-700 font-semibold text-sm'>
                🎟️ {productoName}
              </div>
              <div className='text-green-500 text-[10px]'>
                Se aplicará automáticamente al crear la venta
              </div>
            </div>
          )
        }

        // Producto normal o servicio
        return (
          <div className='flex flex-col h-full justify-center gap-1'>
            {hiddenFields}
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
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
              <InputBase propsForm={{ name: [value, 'marca_name'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        if (tipoFila === 'paquete_producto') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-600 text-xs'>{form.getFieldValue(['productos', value, 'marca_name']) || '-'}</span>
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
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
              <InputNumberBase propsForm={{ name: [value, 'unidad_derivada_id'], hidden: true }} formWithMessage={false} />
              <InputNumberBase propsForm={{ name: [value, 'unidad_derivada_factor'], hidden: true }} formWithMessage={false} />
              <InputBase propsForm={{ name: [value, 'unidad_derivada_name'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        if (tipoFila === 'paquete_producto') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-600 text-xs'>{form.getFieldValue(['productos', value, 'unidad_derivada_name'])}</span>
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
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])
        const paqueteId = form.getFieldValue(['productos', value, 'paquete_id'])

        // Vale promocional - sin cantidad
        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full justify-center'>
              <span className='text-green-600 text-xs font-medium'>Auto</span>
              <InputNumberBase propsForm={{ name: [value, 'cantidad'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        // Cabecera de paquete - cantidad editable (cantidad de paquetes)
        if (tipoFila === 'paquete_cabecera') {
          return (
            <div className='flex flex-col justify-center w-full py-2'>
              <InputNumberBase
                size='small'
                propsForm={{
                  name: [value, 'cantidad'],
                  rules: [{ required: true, message: '' }],
                }}
                precision={0}
                min={1}
                formWithMessage={false}
                onChange={(newVal) => {
                  if (paqueteId && newVal) {
                    if (recalcDebounceRef.current) clearTimeout(recalcDebounceRef.current)
                    recalcDebounceRef.current = setTimeout(() => {
                      recalcularSubProductosPaquete(paqueteId, Number(newVal))
                    }, 150)
                  }
                }}
              />
            </div>
          )
        }

        // Sub-producto de paquete - cantidad solo lectura (calculada)
        if (tipoFila === 'paquete_producto') {
          const cantidad = form.getFieldValue(['productos', value, 'cantidad'])
          return (
            <div className='flex items-center h-full justify-center'>
              <span className='text-gray-600 text-xs'>{Number(cantidad || 0).toFixed(2)}</span>
              <InputNumberBase propsForm={{ name: [value, 'cantidad'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        // Producto normal
        const cantidad = form.getFieldValue(['productos', value, 'cantidad'])
        const unidad_derivada_factor = form.getFieldValue(['productos', value, 'unidad_derivada_factor'])
        const stock_fraccion = form.getFieldValue(['productos', value, 'stock_fraccion'])
        const tipo = form.getFieldValue(['productos', value, '_tipo'])

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
              onChange={() => {
                calcularSubtotalForm({ form, value })
                autoSeleccionarMejorPrecio({ form, fieldIndex: value, productosVentaStore })
              }}
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
      headerName: 'T. Precio',
      field: 'name',
      minWidth: 130,
      width: 130,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])
        const tipo = form.getFieldValue(['productos', value, '_tipo'])

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'paquete_producto' || tipoFila === 'vale_promocional' || tipo === 'servicio') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
              <InputBase propsForm={{ name: [value, 'tipo_precio'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        const productoId = form.getFieldValue(['productos', value, 'producto_id'])

        return (
          <div className='flex items-center h-full'>
            <SelectTipoPrecioVenta
              form={form}
              fieldIndex={value}
              productoId={productoId}
            />
            <InputBase propsForm={{ name: [value, 'tipo_precio'], hidden: true }} formWithMessage={false} />
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
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])
        const paqueteId = form.getFieldValue(['productos', value, 'paquete_id'])

        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
              <InputNumberBase propsForm={{ name: [value, 'precio_venta'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        if (tipoFila === 'paquete_cabecera') {
          const precioUnitario = Number(form.getFieldValue(['productos', value, 'precio_venta']) || 0)
          return (
            <div className='flex items-center h-full'>
              <span className='text-sm font-medium text-amber-700'>{monedaPrefix} {precioUnitario.toFixed(2)}</span>
              <InputNumberBase propsForm={{ name: [value, 'precio_venta'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        if (tipoFila === 'paquete_producto') {
          const precio = Number(form.getFieldValue(['productos', value, 'precio_venta']) || 0)
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-600 text-xs'>{monedaPrefix} {precio.toFixed(2)}</span>
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
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'paquete_producto' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
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
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'paquete_producto' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
              <SelectDescuentoTipo
                tipoMoneda={tipo_moneda}
                formWithMessage={false}
                size='small'
                propsForm={{ name: [value, 'descuento_tipo'], hidden: true }}
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
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])
        const paqueteId = form.getFieldValue(['productos', value, 'paquete_id'])

        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-green-600 text-xs font-medium'>Automático</span>
              <InputNumberBase propsForm={{ name: [value, 'subtotal'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        if (tipoFila === 'paquete_cabecera') {
          const subtotalPaquete = getPaqueteSubtotales(paqueteId!)
          return (
            <div className='flex items-center h-full'>
              <span className='text-sm font-bold text-amber-700'>{monedaPrefix} {subtotalPaquete.toFixed(2)}</span>
              <InputNumberBase propsForm={{ name: [value, 'subtotal'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        if (tipoFila === 'paquete_producto') {
          const subtotal = Number(form.getFieldValue(['productos', value, 'subtotal']) || 0)
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-600 text-xs'>{monedaPrefix} {subtotal.toFixed(2)}</span>
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
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])
        const paqueteId = form.getFieldValue(['productos', value, 'paquete_id'])

        // Sub-productos de paquete y vales no tienen botón de eliminar
        if (tipoFila === 'paquete_producto' || tipoFila === 'vale_promocional') {
          return <div className='flex items-center h-full' />
        }

        const handleEliminar = () => {
          if (tipoFila === 'paquete_cabecera' && paqueteId) {
            // Eliminar cabecera + todos los sub-productos del mismo paquete
            const indices: number[] = []
            const allProductos = form.getFieldValue('productos') || []
            allProductos.forEach((_: any, i: number) => {
              if (form.getFieldValue(['productos', i, 'paquete_id']) === paqueteId) {
                indices.push(i)
              }
            })
            remove(indices.reverse())
          } else {
            remove(value!)
          }
        }

        return (
          <div className='flex items-center gap-2 h-full'>
            <Tooltip title={tipoFila === 'paquete_cabecera' ? 'Eliminar paquete completo' : 'Eliminar'}>
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

  return { columns }
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

type TipoPrecio = 'publico' | 'especial' | 'minimo' | 'ultimo'

const activadorMap: Record<TipoPrecio, string | null> = {
  publico: null,
  especial: 'activador_especial',
  minimo: 'activador_minimo',
  ultimo: 'activador_ultimo',
}

/**
 * Auto-selecciona el mejor precio disponible según la cantidad.
 * Prioridad: ultimo > minimo > especial > publico (de menor a mayor precio).
 * Solo cambia si la cantidad activa un precio mejor que el actual.
 * Si la cantidad baja y el precio actual ya no es válido, revierte a público.
 */
function autoSeleccionarMejorPrecio({
  form,
  fieldIndex,
  productosVentaStore,
}: {
  form: FormInstance
  fieldIndex: number
  productosVentaStore: ReturnType<typeof useStoreProductoAgregadoVenta.getState>['productos']
}) {
  const productoId = form.getFieldValue(['productos', fieldIndex, 'producto_id'])
  const unidadDerivadaId = form.getFieldValue(['productos', fieldIndex, 'unidad_derivada_id'])
  const cantidad = Number(form.getFieldValue(['productos', fieldIndex, 'cantidad']) ?? 0)
  const tipoPrecioActual = (form.getFieldValue(['productos', fieldIndex, 'tipo_precio']) || 'publico') as TipoPrecio

  const productoEnStore = productosVentaStore.find((p) => p.producto_id === productoId)
  const unidadesDerivadas = productoEnStore?.unidades_derivadas_disponibles || []
  const ud = unidadesDerivadas.find((u) => u.unidad_derivada.id === unidadDerivadaId)
  if (!ud) return

  // Determinar qué precios están habilitados con la cantidad actual
  const tiposOrdenados: TipoPrecio[] = ['ultimo', 'minimo', 'especial', 'publico']

  function estaHabilitado(tipo: TipoPrecio): boolean {
    const activadorKey = activadorMap[tipo]
    if (!activadorKey) return true // público siempre habilitado
    const activador = Number((ud as any)[activadorKey] ?? 0)
    return activador <= 0 || cantidad >= activador
  }

  // Si el precio actual ya no es válido, revertir a público
  if (!estaHabilitado(tipoPrecioActual)) {
    aplicarPrecio(form, fieldIndex, 'publico', ud, cantidad)
    return
  }

  // Buscar el mejor precio habilitado (prioridad: ultimo > minimo > especial > publico)
  const mejorPrecio = tiposOrdenados.find((tipo) => estaHabilitado(tipo)) || 'publico'

  // Solo cambiar si el mejor precio es "mejor" que el actual
  const prioridad: Record<TipoPrecio, number> = { ultimo: 3, minimo: 2, especial: 1, publico: 0 }
  if (prioridad[mejorPrecio] > prioridad[tipoPrecioActual]) {
    aplicarPrecio(form, fieldIndex, mejorPrecio, ud, cantidad)
  }
}

function aplicarPrecio(
  form: FormInstance,
  fieldIndex: number,
  tipo: TipoPrecio,
  ud: any,
  cantidad: number,
) {
  const preciosMap: Record<TipoPrecio, { precio: string; comision: string }> = {
    publico: { precio: 'precio_publico', comision: 'comision_publico' },
    especial: { precio: 'precio_especial', comision: 'comision_especial' },
    minimo: { precio: 'precio_minimo', comision: 'comision_minimo' },
    ultimo: { precio: 'precio_ultimo', comision: 'comision_ultimo' },
  }

  const { precio: precioKey, comision: comisionKey } = preciosMap[tipo]
  const precio = Number(ud[precioKey] ?? 0)
  const comision = Number(ud[comisionKey] ?? 0)

  form.setFieldValue(['productos', fieldIndex, 'tipo_precio'], tipo)
  form.setFieldValue(['productos', fieldIndex, 'precio_venta'], precio)
  form.setFieldValue(['productos', fieldIndex, 'comision'], comision)

  // Recalcular subtotal con el nuevo precio
  const recargo = Number(form.getFieldValue(['productos', fieldIndex, 'recargo']) ?? 0)
  const descuento_tipo = form.getFieldValue(['productos', fieldIndex, 'descuento_tipo']) as DescuentoTipo
  const descuento = Number(form.getFieldValue(['productos', fieldIndex, 'descuento']) ?? 0)

  form.setFieldValue(
    ['productos', fieldIndex, 'subtotal'],
    calcularSubtotalVenta({ precio_venta: precio, recargo, descuento_tipo, descuento, cantidad })
  )
}
