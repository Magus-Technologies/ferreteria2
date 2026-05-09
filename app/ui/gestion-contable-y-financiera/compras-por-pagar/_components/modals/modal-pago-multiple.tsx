'use client'

import { Modal, Form, InputNumber, DatePicker, Input, App, Checkbox } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '~/lib/api'
import { compraApi, type Compra } from '~/lib/api/compra'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useAuth } from '~/lib/auth-context'
import dayjs from 'dayjs'
import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { extractDesplieguePagoId } from '~/lib/utils/despliegue-pago-utils'
import LabelBase from '~/components/form/label-base'
import { FaMoneyBillWave } from 'react-icons/fa'
import TableBase from '~/components/tables/table-base'
import type { ColDef, ICellRendererParams, RowStyle } from 'ag-grid-community'

interface ModalPagoMultipleProps {
  open: boolean
  setOpen: (open: boolean) => void
}

interface CompraConDistribucion extends Compra {
  _totalCompra: number
  _totalPagado: number
  _saldoPendiente: number
  _montoAPagar: number
  _seleccionada: boolean
  _desplieguePagoId: string | undefined
}

function calcularTotalCompra(compra: Compra): number {
  return (compra.productos_por_almacen || []).reduce((acc, item: any) => {
    for (const u of item.unidades_derivadas ?? []) {
      const costo = Number(item.costo ?? 0)
      const cantidad = Number(u.cantidad ?? 0)
      const flete = Number(u.flete ?? 0)
      const bonificacion = Boolean(u.bonificacion)
      acc += bonificacion ? 0 : (costo * cantidad) + flete
    }
    return acc
  }, 0) + Number(compra.percepcion ?? 0)
}

export default function ModalPagoMultiple({ open, setOpen }: ModalPagoMultipleProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const gridRef = useRef<any>(null)

  const [proveedorId, setProveedorId] = useState<number | undefined>()
  const [comprasDistribucion, setComprasDistribucion] = useState<CompraConDistribucion[]>([])
  const [montoTotal, setMontoTotal] = useState<number>(0)

  // Query para obtener despliegues de pago
  const { data: desplieguesData } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'metodos-para-ventas'],
    queryFn: async () => {
      const result = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      return result.data?.data || []
    },
    enabled: open,
  })

  // Sincronizar estados cuando cambia la data de compras
  const handleGlobalPagoChange = useCallback((value: string | undefined) => {
    const id = value ? String(extractDesplieguePagoId(value) ?? value) : undefined
    setComprasDistribucion(prev => prev.map(c => ({ ...c, _desplieguePagoId: id })))
  }, [])

  useEffect(() => {
    if (open) {
      form.setFieldValue('fecha', dayjs())
      
      if (desplieguesData && desplieguesData.length > 0) {
        const efectivo = desplieguesData.find((d: any) =>
          d.tipo?.toLowerCase() === 'efectivo' || 
          d.label?.toUpperCase().includes('EFECTIVO') || 
          d.label?.toUpperCase().includes('CCH')
        )
        if (efectivo) {
          form.setFieldValue('despliegue_de_pago_id', efectivo.value)
          handleGlobalPagoChange(efectivo.value)
        }
      }
    }
  }, [open, desplieguesData, handleGlobalPagoChange])

  const { data: comprasData, isLoading } = useQuery({
    queryKey: [QueryKeys.COMPRAS_POR_PAGAR, 'pago-multiple', proveedorId],
    queryFn: async () => {
      const result = await compraApi.getComprasPorPagar({ proveedor_id: proveedorId, per_page: -1 })
      if (result.error) throw new Error(result.error.message)
      return result.data?.data || []
    },
    enabled: open && !!proveedorId,
  })

  useEffect(() => {
    if (!comprasData?.length) {
      setComprasDistribucion([])
      return
    }
    const defaultPagoValue = form.getFieldValue('despliegue_de_pago_id') as string | undefined
    const defaultPago = defaultPagoValue ? String(extractDesplieguePagoId(defaultPagoValue) ?? defaultPagoValue) : undefined
    const compras: CompraConDistribucion[] = comprasData.map((c: Compra) => {
      const total = calcularTotalCompra(c)
      const pagado = Number(c.total_pagado || 0)
      return {
        ...c,
        _totalCompra: total,
        _totalPagado: pagado,
        _saldoPendiente: total - pagado,
        _montoAPagar: 0,
        _seleccionada: true,
        _desplieguePagoId: defaultPago,
      }
    })
    compras.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    setComprasDistribucion(compras)
  }, [comprasData]) // eslint-disable-line react-hooks/exhaustive-deps

  const distribuirMonto = useCallback((monto: number, compras: CompraConDistribucion[]) => {
    let restante = monto
    const nuevas = compras.map(c => {
      if (!c._seleccionada || restante <= 0) return { ...c, _montoAPagar: 0 }
      const pagar = Math.min(restante, c._saldoPendiente)
      restante -= pagar
      return { ...c, _montoAPagar: Number(pagar.toFixed(2)) }
    })
    setComprasDistribucion(nuevas)
  }, [])

  const handleMontoChange = useCallback((value: number | null) => {
    const monto = value || 0
    setMontoTotal(monto)
    distribuirMonto(monto, comprasDistribucion)
  }, [comprasDistribucion, distribuirMonto])

  const toggleCompra = useCallback((compraId: string) => {
    setComprasDistribucion(prev => {
      const nuevas = prev.map(c =>
        c.id === compraId ? { ...c, _seleccionada: !c._seleccionada } : c
      )
      let restante = montoTotal
      return nuevas.map(c => {
        if (!c._seleccionada || restante <= 0) return { ...c, _montoAPagar: 0 }
        const pagar = Math.min(restante, c._saldoPendiente)
        restante -= pagar
        return { ...c, _montoAPagar: Number(pagar.toFixed(2)) }
      })
    })
  }, [montoTotal])

  const handleMontoManual = useCallback((compraId: string, monto: number) => {
    setComprasDistribucion(prev => prev.map(c =>
      c.id === compraId ? { ...c, _montoAPagar: Math.min(monto, c._saldoPendiente) } : c
    ))
  }, [])

  const handlePagoRow = useCallback((compraId: string, value: string | undefined) => {
    const id = value ? String(extractDesplieguePagoId(value) ?? value) : undefined
    setComprasDistribucion(prev => prev.map(c =>
      c.id === compraId ? { ...c, _desplieguePagoId: id } : c
    ))
  }, [])

  // Observar el modo de pago seleccionado
  const selectedPagoId = Form.useWatch('despliegue_de_pago_id', form)
  const isEfectivo = useMemo(() => {
    if (!selectedPagoId || !desplieguesData) return true
    const pago = desplieguesData.find((d: any) => d.value === selectedPagoId)
    if (!pago) return false
    return pago.tipo?.toLowerCase() === 'efectivo' || 
           pago.label?.toUpperCase().includes('EFECTIVO') || 
           pago.label?.toUpperCase().includes('CCH')
  }, [selectedPagoId, desplieguesData])

  const totalDeudaProveedor = useMemo(() =>
    comprasDistribucion.reduce((sum, c) => sum + c._saldoPendiente, 0), [comprasDistribucion])

  const totalDistribuido = useMemo(() =>
    comprasDistribucion.reduce((sum, c) => sum + c._montoAPagar, 0), [comprasDistribucion])

  const montoSinDistribuir = montoTotal - totalDistribuido

  // Estado para modal de tickets masivos
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [ticketPdfUrl, setTicketPdfUrl] = useState<string | null>(null)
  const [ticketLoading, setTicketLoading] = useState(false)

  const handleCloseTicketModal = useCallback((v: boolean) => {
    setTicketModalOpen(v)
    if (!v && ticketPdfUrl) {
      URL.revokeObjectURL(ticketPdfUrl)
      setTicketPdfUrl(null)
    }
  }, [ticketPdfUrl])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!proveedorId || !user?.id) throw new Error('Datos incompletos')
      const values = await form.validateFields()

      const distribucion = comprasDistribucion.filter(c => c._montoAPagar > 0)

      if (distribucion.length === 0) throw new Error('No hay montos asignados')

      const sinPago = distribucion.filter(c => !c._desplieguePagoId)
      if (sinPago.length > 0) {
        throw new Error(`Falta modo de pago en: ${sinPago.map(c => `${c.serie}-${c.numero}`).join(', ')}`)
      }

      // Registrar cada pago individualmente
      const pagosPromises = distribucion.map(c =>
        compraApi.storePago(c.id, {
          despliegue_de_pago_id: c._desplieguePagoId!,
          monto: c._montoAPagar,
          tipo_de_cambio: values.tipo_de_cambio || undefined,
          fecha: dayjs(values.fecha).format('YYYY-MM-DD'),
          observacion: values.observacion || undefined,
          numero_operacion: isEfectivo ? undefined : values.numero_operacion || undefined,
          afecta_caja: true,
        })
      )

      const results = await Promise.all(pagosPromises)
      const errors = results.filter((r: any) => r.error)
      if (errors.length > 0) {
        throw new Error(`Errores en ${errors.length} pagos`)
      }

      return { success: true, count: results.length }
    },
    onSuccess: async (result) => {
      message.success(`${result.count} pagos registrados correctamente`)
      
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COMPRAS_POR_PAGAR] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COMPRAS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COMPRAS_POR_PAGAR, 'pago-multiple', proveedorId] })
      
      // Resetear campos
      const currentProveedorId = proveedorId
      const currentFecha = form.getFieldValue('fecha')
      const currentDesplieguePago = form.getFieldValue('despliegue_de_pago_id')
      
      form.setFieldsValue({
        observacion: undefined,
        numero_operacion: undefined,
        fecha: currentFecha,
        despliegue_de_pago_id: currentDesplieguePago,
      })
      
      setMontoTotal(0)
      setComprasDistribucion([])
    },
    onError: (error: any) => {
      message.error(error?.message || 'Error al registrar pagos múltiples')
    },
  })

  const handleClose = useCallback(() => {
    form.resetFields()
    setProveedorId(undefined)
    setComprasDistribucion([])
    setMontoTotal(0)
    setOpen(false)
  }, [form, setOpen])

  const tipoDocMap: Record<string, string> = { '01': 'FAC', '03': 'BOL', 'gr': 'GR' }

  // Definir columnas para AG Grid
  const columnDefs = useMemo<ColDef<CompraConDistribucion>[]>(() => [
    {
      headerName: '',
      field: '_seleccionada',
      width: 60,
      cellRenderer: (params: ICellRendererParams<CompraConDistribucion>) => {
        return (
          <div className="flex items-center justify-center h-full">
            <Checkbox
              checked={params.data?._seleccionada}
              onChange={() => params.data && toggleCompra(params.data.id)}
            />
          </div>
        )
      },
      suppressMovable: true,
      lockPosition: 'left',
    },
    {
      headerName: 'Documento',
      field: 'serie',
      width: 150,
      cellRenderer: (params: ICellRendererParams<CompraConDistribucion>) => {
        if (!params.data) return null
        const tipo = tipoDocMap[params.data.tipo_documento] || params.data.tipo_documento
        return (
          <div className="flex items-center gap-1">
            <span className='text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-bold'>
              {tipo}
            </span>
            <span className='font-semibold text-xs'>{params.data.serie}-{params.data.numero}</span>
          </div>
        )
      },
    },
    {
      headerName: 'Fecha',
      field: 'created_at',
      width: 180,
      cellRenderer: (params: ICellRendererParams<CompraConDistribucion>) => {
        if (!params.data) return null
        const vencida = params.data.fecha_vencimiento && dayjs(params.data.fecha_vencimiento).isBefore(dayjs())
        return (
          <div className="text-gray-500 text-xs">
            {dayjs(params.data.created_at || params.data.fecha).format('DD/MM/YYYY hh:mm A')}
            {params.data.fecha_vencimiento && (
              <span className={`ml-1 text-[10px] ${vencida ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                (Venc: {dayjs(params.data.fecha_vencimiento).format('DD/MM')})
              </span>
            )}
          </div>
        )
      },
    },
    {
      headerName: 'Total',
      field: '_totalCompra',
      width: 100,
      type: 'numericColumn',
      valueFormatter: (params) => params.value?.toFixed(2) || '0.00',
      cellClass: 'text-xs font-medium',
    },
    {
      headerName: 'Saldo',
      field: '_saldoPendiente',
      width: 100,
      type: 'numericColumn',
      valueFormatter: (params) => params.value?.toFixed(2) || '0.00',
      cellClass: 'text-xs font-bold text-red-600',
    },
    {
      headerName: 'Monto a Pagar',
      field: '_montoAPagar',
      width: 150,
      cellRenderer: (params: ICellRendererParams<CompraConDistribucion>) => {
        if (!params.data) return null
        return (
          <div className="py-1">
            <InputNumber
              className='w-full'
              prefix='S/.'
              precision={2}
              min={0}
              max={params.data._saldoPendiente}
              value={params.data._montoAPagar}
              onChange={(val) => handleMontoManual(params.data!.id, val || 0)}
              disabled={!params.data._seleccionada}
              size='small'
            />
          </div>
        )
      },
    },
    {
      headerName: 'Modo de Pago',
      field: '_desplieguePagoId',
      width: 200,
      cellRenderer: (params: ICellRendererParams<CompraConDistribucion>) => {
        if (!params.data) return null
        const necesitaPago = params.data._montoAPagar > 0 && !params.data._desplieguePagoId
        return (
          <div className="py-1">
            <SelectDespliegueDePago
              placeholder={necesitaPago ? '⚠ Requerido' : 'Modo pago'}
              value={params.data._desplieguePagoId}
              onChange={(val: any) => handlePagoRow(params.data!.id, val || undefined)}
              disabled={!params.data._seleccionada || params.data._montoAPagar <= 0}
              size='small'
              variant='outlined'
              formWithMessage={false}
            />
          </div>
        )
      },
    },
  ], [])

  const filasConMonto = comprasDistribucion.filter(c => c._montoAPagar > 0)
  const faltaPago = filasConMonto.some(c => !c._desplieguePagoId)
  const okDisabled = totalDistribuido <= 0 || Math.abs(montoSinDistribuir) > 0.01 || faltaPago

  return (
    <>
      <Modal
      title={
        <div className='flex items-center gap-2'>
          <FaMoneyBillWave className='text-red-600' size={20} />
          <span>Pago Múltiple por Proveedor</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      onOk={() => mutation.mutate()}
      okText='Registrar Pago'
      cancelText='Cerrar'
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: okDisabled }}
      width={1200}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        {/* Cabecera: proveedor, modo pago global, fecha, operación */}
        <div className='grid grid-cols-6 gap-3 mb-4'>
          <div className='col-span-2'>
            <LabelBase label='Proveedor:' orientation='column'>
              <SelectProveedores
                propsForm={{ name: 'proveedor_id', rules: [{ required: true, message: 'Requerido' }] }}
                placeholder='Buscar proveedor...'
                form={form}
                onChange={(value) => {
                  setProveedorId(value)
                  setMontoTotal(0)
                  setComprasDistribucion([])
                }}
                onSelect={(value) => {
                  setProveedorId(value as number)
                  setMontoTotal(0)
                  setComprasDistribucion([])
                }}
              />
            </LabelBase>
          </div>
          <LabelBase label='Modo Pago (todos):' orientation='column'>
            <SelectDespliegueDePago
              propsForm={{ name: 'despliegue_de_pago_id' }}
              placeholder='Aplica a todas'
              onChange={(val: any) => handleGlobalPagoChange(val || undefined)}
            />
          </LabelBase>
          <LabelBase label='Fecha:' orientation='column'>
            <Form.Item name='fecha' rules={[{ required: true, message: 'Requerido' }]} noStyle>
              <DatePicker className='w-full' format='DD/MM/YYYY' />
            </Form.Item>
          </LabelBase>
          <LabelBase label='TC Pago (S/$):' orientation='column'>
            <Form.Item name='tipo_de_cambio' noStyle>
              <InputNumber className='w-full' precision={4} step={0.01} min={0.0001} placeholder='Ej: 3.75' />
            </Form.Item>
          </LabelBase>
          <div className={isEfectivo ? 'invisible' : 'visible'}>
            <LabelBase label='N° Operación:' orientation='column'>
              <Form.Item name='numero_operacion' noStyle>
                <Input placeholder='Opcional' />
              </Form.Item>
            </LabelBase>
          </div>
        </div>

        {proveedorId && (
          <>
            {/* Resumen de montos */}
            <div className='flex items-center gap-4 mb-4 bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200'>
              <div className='flex-1'>
                <span className='text-xs font-bold text-gray-500 uppercase block mb-1'>Deuda Total del Proveedor</span>
                <span className='text-2xl font-bold text-red-600'>S/. {totalDeudaProveedor.toFixed(2)}</span>
              </div>
              <div className='flex-1'>
                <span className='text-xs font-bold text-gray-500 uppercase block mb-1'>Monto que Paga</span>
                <InputNumber
                  className='w-full !text-xl !font-bold'
                  prefix='S/.'
                  precision={2}
                  min={0.01}
                  max={totalDeudaProveedor}
                  placeholder='0.00'
                  size='large'
                  value={montoTotal || undefined}
                  onChange={handleMontoChange}
                />
              </div>
              <div className='flex-1 text-center'>
                <span className='text-xs font-bold text-gray-500 uppercase block mb-1'>Distribuido</span>
                <span className={`text-2xl font-bold ${Math.abs(montoSinDistribuir) < 0.01 ? 'text-red-600' : 'text-rose-500'}`}>
                  S/. {totalDistribuido.toFixed(2)}
                </span>
                {Math.abs(montoSinDistribuir) >= 0.01 && (
                  <span className='text-xs text-rose-500 block'>Sin asignar: S/. {montoSinDistribuir.toFixed(2)}</span>
                )}
              </div>
            </div>

            {/* Tabla de compras pendientes con AG Grid */}
            <div className='h-[400px] w-full'>
              <TableBase<CompraConDistribucion>
                ref={gridRef}
                columnDefs={columnDefs}
                rowData={comprasDistribucion}
                rowSelection={false}
                withNumberColumn={false}
                selectionColor="transparent"
                persistColumnState={true}
                tableKey="modal-pago-multiple-compras"
                isVisible={open}
                getRowStyle={(params): RowStyle | undefined => {
                  if (!params.data) return undefined
                  const necesitaPago = params.data._montoAPagar > 0 && !params.data._desplieguePagoId
                  if (necesitaPago) return { background: '#fef2f2' } as RowStyle
                  if (params.data._montoAPagar > 0) return { background: '#fff7ed' } as RowStyle
                  if (!params.data._seleccionada) return { background: '#f9fafb', opacity: '0.6' } as RowStyle
                  return undefined
                }}
                domLayout="normal"
                suppressHorizontalScroll={false}
              />
            </div>

            {faltaPago && (
              <div className='mt-2 text-xs text-red-500 font-medium'>
                ⚠ Selecciona el modo de pago en cada fila con monto asignado
              </div>
            )}

            {/* Observación */}
            <div className='mt-3'>
              <LabelBase label='Observación:' orientation='column'>
                <Form.Item name='observacion' noStyle>
                  <Input placeholder='Observaciones (opcional)' maxLength={500} />
                </Form.Item>
              </LabelBase>
            </div>

            {/* Resumen final */}
            <div className='flex justify-between mt-4 bg-gray-50 rounded-lg p-3 text-sm font-bold border border-gray-200'>
              <span>Compras: <span className='text-blue-700'>{filasConMonto.length}</span></span>
              <span>Total Deuda: <span className='text-red-600'>S/. {totalDeudaProveedor.toFixed(2)}</span></span>
              <span>Pagando: <span className='text-red-600 text-lg'>S/. {totalDistribuido.toFixed(2)}</span></span>
              <span>Resta: <span className='text-rose-600'>S/. {(totalDeudaProveedor - totalDistribuido).toFixed(2)}</span></span>
            </div>
          </>
        )}
      </Form>
      </Modal>

      <ModalShowDoc
        open={ticketModalOpen}
        setOpen={handleCloseTicketModal}
        nro_doc='Comprobantes de Pago'
        esTicket
        tipoDocumento='compra'
        backendPdfUrl={ticketPdfUrl}
        backendPdfLoading={ticketLoading}
      >
        <></>
      </ModalShowDoc>
    </>
  )
}
