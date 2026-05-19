'use client'

import { Modal, Form, message } from 'antd'
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
  total: number
  entregado: number
  pendiente: number
  devolver: number
  factor: number
}

interface FormValues {
  fecha_devolucion: dayjs.Dayjs
  observaciones?: string
}

interface DevolverCellProps {
  id: number
  initialValue: number
  max: number
  onCommit: (id: number, value: number) => void
}

const DevolverCell = memo(function DevolverCell({
  id,
  initialValue,
  max,
  onCommit,
}: DevolverCellProps) {
  const [value, setValue] = useState<string>(initialValue === 0 ? '' : String(initialValue))

  useEffect(() => {
    setValue(initialValue === 0 ? '' : String(initialValue))
  }, [initialValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números enteros (sin decimales ni signos negativos)
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setValue(raw)
  }

  const handleBlur = () => {
    let num = Number(value) || 0
    if (num > max) num = max
    if (num < 0) num = 0
    setValue(num === 0 ? '' : String(num))
    onCommit(id, num)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      let num = Number(value) || 0
      if (num > max) num = max
      if (num < 0) num = 0
      setValue(num === 0 ? '' : String(num))
      onCommit(id, num)
    }
  }

  return (
    <div className='flex justify-center items-center h-full w-full py-1 pr-2'>
      <input
        type='text'
        inputMode='numeric'
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder='0'
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
    </div>
  )
})

export default function ModalRegistrarDevolucion({
  open,
  setOpen,
  prestamo,
}: ModalRegistrarDevolucionProps) {
  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(false)
  const [productos, setProductos] = useState<ProductoDevolucion[]>([])
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

    const getReturnedQty = (id: number) => {
      let sum = 0
      devoluciones.forEach((d: any) => {
        if (!isDevolucionActiva(d)) return
        const pdList = d.productos_devueltos ?? d.productosDevueltos ?? []
        pdList.forEach((pd: any) => {
          if (Number(pd.producto_almacen_prestamo_id) === Number(id)) {
            sum += Number(pd.cantidad || 0)
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

        const total = unidad ? Number(unidad.cantidad) : Number(prestamo?.monto_total || 0)
        const entregado = getReturnedQty(pa.id)
        const pendiente = Math.max(0, total - entregado)

        return {
          producto_almacen_prestamo_id: pa.id,
          producto_name: prod ? prod.name : 'N/A',
          producto_codigo: prod ? prod.cod_producto : '',
          unidad_name: unidad ? unidad.name : 'UNIDAD',
          total,
          entregado,
          pendiente,
          devolver: pendiente,
          factor: unidad ? Number(unidad.factor) : 1,
        }
      })
      setProductos(initialProductos)
    } else {
      setProductos([])
    }
  }, [open, prestamoActual])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!prestamo) throw new Error('No hay préstamo seleccionado')

      const selectedProductos = productos
        .filter(p => p.devolver > 0)
        .map(p => ({
          producto_almacen_prestamo_id: p.producto_almacen_prestamo_id,
          cantidad: p.devolver,
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

  const handleProductoChange = useCallback((id: number, value: number) => {
    setProductos(prev =>
      prev.map(p => {
        if (p.producto_almacen_prestamo_id === id) {
          return {
            ...p,
            devolver: value
          }
        }
        return p
      })
    )
  }, [])

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
      field: 'total',
      width: 100,
      valueFormatter: (params) => Number(params.value || 0).toFixed(2),
      cellStyle: { fontWeight: 'bold' },
    },
    {
      headerName: 'Entregado',
      colId: 'entregado',
      field: 'entregado',
      width: 110,
      valueFormatter: (params) => Number(params.value || 0).toFixed(2),
      cellStyle: { color: '#059669', fontWeight: 'bold' },
    },
    {
      headerName: 'Pendiente',
      colId: 'pendiente',
      field: 'pendiente',
      width: 110,
      valueFormatter: (params) => Number(params.value || 0).toFixed(2),
      cellStyle: { color: '#ef4444', fontWeight: 'bold' },
    },
    {
      headerName: 'Devolver',
      colId: 'devolver',
      field: 'devolver',
      width: 130,
      cellRenderer: (params: any) => {
        const data = params.data as ProductoDevolucion
        if (!data) return null
        return (
          <DevolverCell
            id={data.producto_almacen_prestamo_id}
            initialValue={data.devolver}
            max={data.pendiente}
            onCommit={handleProductoChange}
          />
        )
      },
      cellStyle: {
        backgroundColor: '#f0fdf4',
      },
    },
  ]

  const totalSelected = productos
    .reduce((sum, p) => sum + (p.devolver * p.factor), 0)

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
      width={800}
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
              <span className='font-semibold text-gray-800'>{Number(prestamoActual.monto_total).toFixed(0)} u.</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>Devuelto:</span>
              <span className='text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded'>{Number(prestamoActual.monto_pagado).toFixed(0)} u.</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 font-medium'>Pendiente:</span>
              <span className='text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded'>{Number(prestamoActual.monto_pendiente).toFixed(0)} u.</span>
            </div>
          </div>
        </div>
      )}

      <div className='w-full h-[220px] mb-6'>
        <TableWithTitle<ProductoDevolucion>
          id='productos-devolucion-prestamo'
          title='PRODUCTOS A DEVOLVER'
          selectionColor={orangeColors[10]}
          columnDefs={columns}
          rowData={productos}
        />
      </div>

      <div className='flex justify-between items-center bg-orange-50/50 border border-orange-100/60 rounded-xl px-4 py-2.5 mb-6'>
        <span className='text-orange-850 text-sm font-semibold'>Total Seleccionado:</span>
        <span className='font-bold text-lg text-orange-950'>{totalSelected.toFixed(0)} <span className='text-xs font-normal text-orange-800'>unidades</span></span>
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
              disabled={loading || totalSelected === 0}
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
