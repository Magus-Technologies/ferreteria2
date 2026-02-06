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
  const productos = Form.useWatch('productos', form) || []

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
        const paqueteId = form.getFieldValue(['productos', value, 'paquete_id'])
        
        if (!paqueteId) {
          // Producto sin paquete - contar solo productos individuales y primeros de paquetes
          let numeroGrupo = 0
          const paquetesVistos = new Set<number>()
          
          for (let i = 0; i <= value; i++) {
            const itemPaqueteId = form.getFieldValue(['productos', i, 'paquete_id'])
            
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
        }

        // Producto de paquete - verificar si es el primero del grupo
        let esPrimeroDelGrupo = true
        for (let i = 0; i < value; i++) {
          const prevPaqueteId = form.getFieldValue(['productos', i, 'paquete_id'])
          if (prevPaqueteId === paqueteId) {
            esPrimeroDelGrupo = false
            break
          }
        }

        if (esPrimeroDelGrupo) {
          // Es el primero del paquete - mostrar número
          let numeroGrupo = 0
          const paquetesVistos = new Set<number>()
          
          for (let i = 0; i <= value; i++) {
            const itemPaqueteId = form.getFieldValue(['productos', i, 'paquete_id'])
            
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
        }

        // No es el primero del paquete - NO mostrar número
        return (
          <div className='flex items-center h-full justify-center'>
            <span className='text-gray-400 text-xs'>↳</span>
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
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const paqueteId = form.getFieldValue(['productos', value, 'paquete_id'])
        const paqueteNombre = form.getFieldValue(['productos', value, 'paquete_nombre'])
        const productoName = form.getFieldValue(['productos', value, 'producto_name'])
        
        // Verificar si es el primero del paquete
        let esPrimeroDelGrupo = true
        if (paqueteId) {
          for (let i = 0; i < value; i++) {
            const prevPaqueteId = form.getFieldValue(['productos', i, 'paquete_id'])
            if (prevPaqueteId === paqueteId) {
              esPrimeroDelGrupo = false
              break
            }
          }
        }
        
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
            
            {/* Mostrar nombre del paquete solo en el primer producto del grupo */}
            {paqueteId && esPrimeroDelGrupo && (
              <div className='px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded text-xs font-bold w-fit'>
                📦 {paqueteNombre}
              </div>
            )}
            
            {/* Nombre del producto */}
            <Tooltip
              classNames={{ body: 'text-center!' }}
              title={productoName}
            >
              <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
                {productoName}
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
