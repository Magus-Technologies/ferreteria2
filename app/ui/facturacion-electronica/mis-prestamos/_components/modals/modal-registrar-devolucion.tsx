'use client'

import { Modal, Form, message } from 'antd'
import { formatCantidadPlana } from '~/app/_utils/get-stock'
import { useState, useEffect, memo, useCallback } from 'react'
import FormBase from '~/components/form/form-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import ButtonBase from '~/components/buttons/button-base'
import LabelBase from '~/components/form/label-base'
import { FaSave } from 'react-icons/fa'
import { Prestamo, prestamoApi } from '~/lib/api/prestamo'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import dayjs from 'dayjs'
import { FaCalendar } from 'react-icons/fa6'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { orangeColors } from '~/lib/colors'

interface ModalRegistrarDevolucionProps {
  open: boolean
  setOpen: (open: boolean) => void
  prestamo?: Prestamo
}

interface ProductoDevolucion {
  producto_almacen_prestamo_id: number
  producto_name: string
  producto_codigo: string
  unidad_name: string
  base_name: string
  factor: number
  total_base: number
  entregado_base: number
  pendiente_base: number
  devolver_unidad: number
  devolver_base: number
}

interface FormValues {
  fecha_devolucion: dayjs.Dayjs
  observaciones?: string
}

// Formatea una fracción base como "X unidad + Y base" (ej. "1 unidad + 4 metros").
function formatMixto(base: number, factor: number, unidadName: string, baseName: string): string {
  const f = Number(factor) || 0
  const b = Number(base) || 0
  if (f <= 0) return `${formatCantidadPlana(b)} ${baseName}`
  const unidades = Math.floor(b / f)
  const resto = b - unidades * f
  const partes: string[] = []
  if (unidades > 0) partes.push(`${unidades} ${unidadName.toLowerCase()}`)
  if (resto > 0.0001) partes.push(`${formatCantidadPlana(resto)} ${baseName.toLowerCase()}`)
  if (partes.length === 0) partes.push(`0 ${unidadName.toLowerCase()}`)
  return partes.join(' + ')
}

interface DevolverCellProps {
  id: number
  value: number
  max: number
  allowDecimal: boolean
  placeholder: string
  onCommit: (id: number, value: number) => void
}

// Input numérico para "unidad" (entero) o "base" (decimal).
const DevolverCell = memo(function DevolverCell({
  id,
  value,
  max,
  allowDecimal,
  placeholder,
  onCommit,
}: DevolverCellProps) {
  const [local, setLocal] = useState<string>(value === 0 ? '' : String(value))

  useEffect(() => {
    setLocal(value === 0 ? '' : String(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = allowDecimal
      ? e.target.value.replace(/[^0-9.]/g, '')
      : e.target.value.replace(/[^0-9]/g, '')
    setLocal(raw)
  }

  const commit = () => {
    const num = Number(local) || 0
    const clamped = Math.min(Math.max(num, 0), max)
    setLocal(clamped === 0 ? '' : String(clamped))
    onCommit(id, clamped)
  }

  return (
    <input
      type='text'
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={local}
      onChange={handleChange}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
      placeholder={placeholder}
      style={{
        width: '100%',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        padding: '2px 8px',
        fontSize: '13px',
        outline: 'none',
        textAlign: 'right',
      }}
    />
  )
})

const invalidateStockQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS] })
  queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS_BY_ALMACEN] })
  queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS_SEARCH] })
  queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTOS_TABLE_SEARCH] })
  queryClient.invalidateQueries({ queryKey: [QueryKeys.KARDEX] })
  queryClient.invalidateQueries({ queryKey: [QueryKeys.KARDEX_INVENTARIO] })
  queryClient.invalidateQueries({ queryKey: ['productos-search'] })
  queryClient.invalidateQueries({ queryKey: ['productos-infinite'] })
  queryClient.invalidateQueries({ queryKey: ['vencimientos-proximos'] })
}

export default function ModalRegistrarDevolucion({
  open,
  setOpen,
  prestamo,
}: ModalRegistrarDevolucionProps) {
  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(false)
  const [productos, setProductos] = useState<ProductoDevolucion[]>([])
  const [ocultos, setOcultos] = useState<Set<number>>(new Set())
  const queryClient = useQueryClient()

  const { data: prestamoDetalle } = useQuery({
    queryKey: [QueryKeys.PRESTAMOS, 'detalle-registrar-devolucion', prestamo?.id],
    queryFn: async () => {
      if (!prestamo) return null
      const result = await prestamoApi.getById(prestamo.id)
      return result.data?.data ?? null
    },
    enabled: open && !!prestamo?.id,
  })

  const prestamoActual = prestamoDetalle ?? prestamo

  useEffect(() => {
    if (!open || !prestamoActual) {
      setProductos([])
      return
    }

    const pAny = prestamoActual as any
    const productosPorAlmacen = pAny?.productos_por_almacen ?? pAny?.productosPorAlmacen
    const devoluciones = pAny?.devoluciones || []
    const pagos = pAny?.pagos || []

    const isFalse = (value: unknown) => value === false || value === 0 || value === '0'
    const getNumeroDevolucionFromObs = (observaciones?: string | null) =>
      observaciones?.match(/Devoluci[oó]n\s+(\S+?)[.\s]/i)?.[1]

    const pagosPorNumeroDevolucion = new Map<string, any>()
    pagos.forEach((pago: any) => {
      const numero = getNumeroDevolucionFromObs(pago?.observaciones)
      if (numero) pagosPorNumeroDevolucion.set(String(numero), pago)
    })

    const isDevolucionActiva = (devolucion: any) => {
      const ingresoSalida = devolucion?.ingreso_salida ?? devolucion?.ingresoSalida
      if (ingresoSalida && isFalse(ingresoSalida.estado)) return false

      const numero = devolucion?.numero_devolucion
      const pago = numero ? pagosPorNumeroDevolucion.get(String(numero)) : null
      if (pago && isFalse(pago.estado)) return false

      return true
    }

    // Suma lo devuelto en FRACCIÓN BASE (cantidad_fraccion), para mezclarlo bien.
    const getReturnedBase = (id: number) => {
      let sum = 0
      devoluciones.forEach((d: any) => {
        if (!isDevolucionActiva(d)) return
        const pdList = d.productos_devueltos ?? d.productosDevueltos ?? []
        pdList.forEach((pd: any) => {
          if (Number(pd.producto_almacen_prestamo_id) === Number(id)) {
            sum += Number(pd.cantidad_fraccion || 0)
          }
        })
      })
      return sum
    }

    if (productosPorAlmacen) {
      const initialProductos = productosPorAlmacen.map((pa: any) => {
        const unidadesDerivadas = pa.unidades_derivadas ?? pa.unidadesDerivadas
        const unidad = unidadesDerivadas?.[0]
        const prodAlmacen = pa.producto_almacen ?? pa.productoAlmacen
        const prod = prodAlmacen?.producto

        const factor = unidad ? Number(unidad.factor || 1) : 1
        const unidadName = unidad?.name ?? 'UNIDAD'
        const baseName = (prod as any)?.unidad_medida?.name ?? 'UNIDAD'
        const totalBase = (unidad ? Number(unidad.cantidad || 0) : 0) * factor
        const entregadoBase = getReturnedBase(pa.id)
        const pendienteBase = Math.max(0, totalBase - entregadoBase)

        return {
          producto_almacen_prestamo_id: pa.id,
          producto_name: prod?.name ?? 'N/A',
          producto_codigo: prod?.cod_producto ?? '',
          unidad_name: unidadName,
          base_name: baseName,
          factor,
          total_base: totalBase,
          entregado_base: entregadoBase,
          pendiente_base: pendienteBase,
          devolver_unidad: 0,
          devolver_base: 0,
        }
      })
      setProductos(initialProductos)
    } else {
      setProductos([])
    }
    setOcultos(new Set())
  }, [open, prestamoActual])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!prestamo) throw new Error('No hay préstamo seleccionado')

      const selectedProductos = productos
        .filter(p => !ocultos.has(p.producto_almacen_prestamo_id) && (p.devolver_unidad > 0 || p.devolver_base > 0))
        .map(p => ({
          producto_almacen_prestamo_id: p.producto_almacen_prestamo_id,
          cantidad: p.devolver_unidad,
          cantidad_base: p.devolver_base,
          factor: p.factor,
        }))

      if (selectedProductos.length === 0) {
        throw new Error('Debe especificar cantidades a devolver mayores a 0')
      }

      const data = {
        productos: selectedProductos,
        fecha_devolucion: values.fecha_devolucion.format('YYYY-MM-DD'),
        observaciones: values.observaciones,
      }

      return prestamoApi.registrarDevolucion(prestamo.id, data)
    },
    onSuccess: () => {
      message.success('Devolución registrada exitosamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS, 'detalle-registrar-devolucion', prestamo?.id] })
      invalidateStockQueries(queryClient)
      form.resetFields()
      setOpen(false)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      message.error(err?.response?.data?.message || err?.message || 'Error al registrar la devolución')
    },
  })

  const handleSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(values)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setOpen(false)
  }

  const handleUnidadChange = useCallback((id: number, value: number) => {
    setProductos(prev => prev.map(p =>
      p.producto_almacen_prestamo_id === id ? { ...p, devolver_unidad: value } : p
    ))
  }, [])

  const handleBaseChange = useCallback((id: number, value: number) => {
    setProductos(prev => prev.map(p =>
      p.producto_almacen_prestamo_id === id ? { ...p, devolver_base: value } : p
    ))
  }, [])

  const handleQuitarProducto = useCallback((id: number) => {
    setOcultos(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const handleRestaurarProductos = useCallback(() => setOcultos(new Set()), [])

  const columns: ColDef<ProductoDevolucion>[] = [
    {
      headerName: 'Producto',
      colId: 'producto',
      valueGetter: (params: any) => {
        const data = params.data as ProductoDevolucion
        return data ? `${data.producto_name} (${data.producto_codigo})` : 'N/A'
      },
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: 'Total',
      colId: 'total',
      width: 140,
      valueGetter: (params: any) => {
        const d = params.data as ProductoDevolucion
        return d ? formatMixto(d.total_base, d.factor, d.unidad_name, d.base_name) : ''
      },
      cellStyle: { fontWeight: 'bold' },
    },
    {
      headerName: 'Entregado',
      colId: 'entregado',
      width: 140,
      valueGetter: (params: any) => {
        const d = params.data as ProductoDevolucion
        return d ? formatMixto(d.entregado_base, d.factor, d.unidad_name, d.base_name) : ''
      },
      cellStyle: { color: '#059669', fontWeight: 'bold' },
    },
    {
      headerName: 'Pendiente',
      colId: 'pendiente',
      width: 140,
      valueGetter: (params: any) => {
        const d = params.data as ProductoDevolucion
        return d ? formatMixto(d.pendiente_base, d.factor, d.unidad_name, d.base_name) : ''
      },
      cellStyle: { color: '#ef4444', fontWeight: 'bold' },
    },
    {
      headerName: 'Dev. Unidad',
      colId: 'devolver_unidad',
      width: 110,
      cellRenderer: (params: any) => {
        const data = params.data as ProductoDevolucion
        if (!data) return null
        return (
          <DevolverCell
            id={data.producto_almacen_prestamo_id}
            value={data.devolver_unidad}
            max={Math.floor(data.pendiente_base / (data.factor || 1))}
            allowDecimal={false}
            placeholder='0'
            onCommit={handleUnidadChange}
          />
        )
      },
      cellStyle: { backgroundColor: '#f0fdf4' },
    },
    {
      headerName: 'Dev. Base',
      colId: 'devolver_base',
      width: 110,
      headerTooltip: 'Cantidad en la unidad base (ej. metros)',
      cellRenderer: (params: any) => {
        const data = params.data as ProductoDevolucion
        if (!data) return null
        return (
          <DevolverCell
            id={data.producto_almacen_prestamo_id}
            value={data.devolver_base}
            max={data.pendiente_base}
            allowDecimal
            placeholder='0'
            onCommit={handleBaseChange}
          />
        )
      },
      cellStyle: { backgroundColor: '#fefce8' },
    },
    {
      headerName: '',
      colId: 'excluir',
      width: 50,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const data = params.data as ProductoDevolucion
        if (!data) return null
        return (
          <span
            style={{ cursor: 'pointer' }}
            title='Quitar (no devolver este producto)'
            onClick={() => handleQuitarProducto(data.producto_almacen_prestamo_id)}
          >
            ❌
          </span>
        )
      },
      cellStyle: { textAlign: 'center' } as Record<string, string>,
    },
  ]

  const productosVisibles = productos.filter(
    p => !ocultos.has(p.producto_almacen_prestamo_id)
  )

  const totalSelectedBase = productosVisibles
    .reduce((sum, p) => sum + (p.devolver_unidad * p.factor + p.devolver_base), 0)

  const totalSelectedText = formatCantidadPlana(totalSelectedBase)

  return (
    <Modal
      title={
        <div className='flex items-center gap-2 border-b border-gray-100 pb-3 mr-6'>
          <div className='p-2 bg-orange-50 rounded-lg text-orange-600'>
            <FaSave size={18} />
          </div>
          <div>
            <h3 className='text-base font-bold text-gray-900 leading-none'>Registrar Devolución</h3>
            <span className='text-xs font-normal text-gray-500'>Procesa el retorno de los productos en préstamo</span>
          </div>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      {prestamoActual && (
        <div className='mb-6 mt-3 p-5 bg-gradient-to-r from-orange-50 to-amber-50/50 border border-orange-100 rounded-xl shadow-sm'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>N° Préstamo:</span>
              <span className='font-bold text-gray-800 bg-orange-100/60 px-2 py-0.5 rounded text-xs'>{prestamoActual.numero}</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>Cliente/Proveedor:</span>
              <span className='font-semibold text-gray-800 truncate max-w-[240px]' title={prestamoActual.cliente?.razon_social || `${prestamoActual.cliente?.nombres || ''} ${prestamoActual.cliente?.apellidos || ''}`.trim() || prestamoActual.proveedor?.razon_social}>
                {prestamoActual.cliente?.razon_social ||
                  `${prestamoActual.cliente?.nombres || ''} ${prestamoActual.cliente?.apellidos || ''}`.trim() ||
                  prestamoActual.proveedor?.razon_social ||
                  'N/A'}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>Tipo:</span>
              <span className={`font-semibold px-2.5 py-0.5 rounded-full text-xs ${
                prestamoActual.tipo_operacion === 'PRESTAR' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
              }`}>
                {prestamoActual.tipo_operacion === 'PRESTAR' ? 'Préstamo' : 'Pedir Prestado'}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>Cantidad Total:</span>
              <span className='font-semibold text-gray-800'>{formatCantidadPlana(Number(prestamoActual.monto_total))} u.</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>Devuelto:</span>
              <span className='text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded'>{formatCantidadPlana(Number(prestamoActual.monto_pagado))} u.</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>Pendiente:</span>
              <span className='text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded'>{formatCantidadPlana(Number(prestamoActual.monto_pendiente))} u.</span>
            </div>
          </div>
        </div>
      )}

      {ocultos.size > 0 && (
        <div className='flex items-center justify-end gap-2 mb-1.5'>
          <span className='text-xs text-gray-500'>
            {ocultos.size} producto{ocultos.size !== 1 ? 's' : ''} quitado{ocultos.size !== 1 ? 's' : ''}
          </span>
          <button
            type='button'
            onClick={handleRestaurarProductos}
            className='text-xs font-semibold text-orange-600 hover:text-orange-800 underline'
          >
            Restaurar todos
          </button>
        </div>
      )}

      <div className='w-full h-[220px] mb-6'>
        <TableWithTitle<ProductoDevolucion>
          id='productos-devolucion-prestamo'
          title='PRODUCTOS A DEVOLVER'
          selectionColor={orangeColors[10]}
          columnDefs={columns}
          rowData={productosVisibles}
        />
      </div>

      <div className='flex justify-between items-center bg-orange-50/50 border border-orange-100/60 rounded-xl px-4 py-2.5 mb-6'>
        <span className='text-orange-850 text-sm font-semibold'>Total Seleccionado:</span>
        <span className='font-bold text-lg text-orange-950'>{totalSelectedText} <span className='text-xs font-normal text-orange-800'>unidades</span></span>
      </div>

      <FormBase
        form={form}
        name='form-registrar-devolucion'
        onFinish={handleSubmit}
        initialValues={{
          fecha_devolucion: dayjs(),
        }}
      >
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 items-start'>
            <div className='col-span-1'>
              <LabelBase label='Fecha de Devolución' orientation='column'>
                <DatePickerBase
                  propsForm={{
                    name: 'fecha_devolucion',
                    rules: [{ required: true, message: 'Seleccione la fecha' }],
                  }}
                  placeholder='Seleccione la fecha'
                  prefix={<FaCalendar size={15} className='text-orange-600 mx-1' />}
                />
              </LabelBase>
            </div>

            <div className='col-span-2'>
              <LabelBase label='Observaciones (Opcional)' orientation='column'>
                <TextareaBase
                  propsForm={{
                    name: 'observaciones',
                  }}
                  placeholder='Ingrese observaciones sobre la devolución'
                  rows={2}
                />
              </LabelBase>
            </div>
          </div>

          <div className='flex gap-2 justify-end pt-4 border-t border-gray-100'>
            <ButtonBase color='default' size='md' type='button' onClick={handleCancel}>
              Cancelar
            </ButtonBase>
            <ButtonBase
              color='success'
              size='md'
              type='submit'
              disabled={loading || totalSelectedBase === 0}
              className='flex items-center gap-2'
            >
              <FaSave />
              {loading ? 'Registrando...' : 'Registrar Devolución'}
            </ButtonBase>
          </div>
        </div>
      </FormBase>
    </Modal>
  )
}
