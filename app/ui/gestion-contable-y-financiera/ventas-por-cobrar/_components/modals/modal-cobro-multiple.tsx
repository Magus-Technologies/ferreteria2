import { Modal, Form, InputNumber, DatePicker, Input, App, Checkbox } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '~/lib/api'
import { ventaApi, type VentaCompleta } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useAuth } from '~/lib/auth-context'
import dayjs from 'dayjs'
import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import SelectClientes from '~/app/_components/form/selects/select-clientes'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { extractDesplieguePagoId } from '~/lib/utils/despliegue-pago-utils'
import LabelBase from '~/components/form/label-base'
import { FaMoneyBillWave } from 'react-icons/fa'
import TableBase from '~/components/tables/table-base'
import type { ColDef, ICellRendererParams, RowStyle } from 'ag-grid-community'

interface ModalCobroMultipleProps {
  open: boolean
  setOpen: (open: boolean) => void
}

interface VentaConDistribucion extends VentaCompleta {
  _totalVenta: number
  _totalCobrado: number
  _saldoPendiente: number
  _montoAPagar: number
  _seleccionada: boolean
  _desplieguePagoId: string | undefined
}

function calcularTotalVenta(venta: VentaCompleta): number {
  return (venta.productos_por_almacen || []).reduce((acc, item: any) => {
    for (const u of item.unidades_derivadas ?? []) {
      const precio = Number(u.precio ?? 0)
      const cantidad = Number(u.cantidad ?? 0)
      const descuento = Number(u.descuento ?? 0)
      const bonificacion = Boolean(u.bonificacion)
      acc += bonificacion ? 0 : (precio * cantidad) - descuento
    }
    return acc
  }, 0)
}

export default function ModalCobroMultiple({ open, setOpen }: ModalCobroMultipleProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const gridRef = useRef<any>(null)

  const [clienteId, setClienteId] = useState<number | undefined>()
  const [ventasDistribucion, setVentasDistribucion] = useState<VentaConDistribucion[]>([])
  const [montoTotal, setMontoTotal] = useState<number>(0)

  // Query para obtener despliegues de pago (mismo endpoint que SelectDespliegueDePago para consistencia)
  const { data: desplieguesData } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'metodos-para-ventas'],
    queryFn: async () => {
      const result = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      return result.data?.data || []
    },
    enabled: open,
  })

  // Sincronizar estados cuando cambia la data de ventas
  const handleGlobalPagoChange = useCallback((value: string | undefined) => {
    // No extraer el ID aquí para que el Select pueda mostrar el label correctamente
    setVentasDistribucion(prev => prev.map(v => ({ ...v, _desplieguePagoId: value })))
  }, [])

  useEffect(() => {
    if (open) {
      // Establecer fecha de hoy
      form.setFieldValue('fecha', dayjs())
      
      // Setear Efectivo por defecto cuando los datos estén disponibles
      if (desplieguesData && desplieguesData.length > 0) {
        // Buscar el método que sea Efectivo (generalmente tiene tipo 'efectivo' o el label contiene 'EFECTIVO')
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

  const { data: ventasData, isLoading } = useQuery({
    queryKey: [QueryKeys.VENTAS_POR_COBRAR, 'cobro-multiple', clienteId],
    queryFn: async () => {
      const result = await ventaApi.getVentasPorCobrar({ cliente_id: clienteId, per_page: -1 })
      if (result.error) throw new Error(result.error.message)
      return result.data?.data || []
    },
    enabled: open && !!clienteId,
  })

  useEffect(() => {
    if (!ventasData?.length) {
      setVentasDistribucion([])
      return
    }
    const defaultPagoValue = form.getFieldValue('despliegue_de_pago_id') as string | undefined
    const defaultPago = defaultPagoValue
    const ventas: VentaConDistribucion[] = ventasData.map((v: VentaCompleta) => {
      const total = calcularTotalVenta(v)
      const cobrado = Number(v.total_cobrado || 0)
      return {
        ...v,
        _totalVenta: total,
        _totalCobrado: cobrado,
        _saldoPendiente: total - cobrado,
        _montoAPagar: 0,
        _seleccionada: true,
        _desplieguePagoId: defaultPago,
      }
    })
    ventas.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    setVentasDistribucion(ventas)
  }, [ventasData]) // eslint-disable-line react-hooks/exhaustive-deps

  const distribuirMonto = useCallback((monto: number, ventas: VentaConDistribucion[]) => {
    let restante = monto
    const nuevas = ventas.map(v => {
      if (!v._seleccionada || restante <= 0) return { ...v, _montoAPagar: 0 }
      const pagar = Math.min(restante, v._saldoPendiente)
      restante -= pagar
      return { ...v, _montoAPagar: Number(pagar.toFixed(2)) }
    })
    setVentasDistribucion(nuevas)
  }, [])

  const handleMontoChange = useCallback((value: number | null) => {
    const monto = value || 0
    setMontoTotal(monto)
    distribuirMonto(monto, ventasDistribucion)
  }, [ventasDistribucion, distribuirMonto])

  const toggleVenta = useCallback((ventaId: string) => {
    setVentasDistribucion(prev => {
      const nuevas = prev.map(v =>
        v.id === ventaId ? { ...v, _seleccionada: !v._seleccionada } : v
      )
      let restante = montoTotal
      return nuevas.map(v => {
        if (!v._seleccionada || restante <= 0) return { ...v, _montoAPagar: 0 }
        const pagar = Math.min(restante, v._saldoPendiente)
        restante -= pagar
        return { ...v, _montoAPagar: Number(pagar.toFixed(2)) }
      })
    })
  }, [montoTotal])

  const handleMontoManual = useCallback((ventaId: string, monto: number) => {
    setVentasDistribucion(prev => prev.map(v =>
      v.id === ventaId ? { ...v, _montoAPagar: Math.min(monto, v._saldoPendiente) } : v
    ))
  }, [])

  const handlePagoRow = useCallback((ventaId: string, value: string | undefined) => {
    setVentasDistribucion(prev => prev.map(v =>
      v.id === ventaId ? { ...v, _desplieguePagoId: value } : v
    ))
  }, [])

  // Observar el modo de pago seleccionado para mostrar/ocultar N° Operación
  const selectedPagoId = Form.useWatch('despliegue_de_pago_id', form)
  const isEfectivo = useMemo(() => {
    if (!selectedPagoId || !desplieguesData) return true // Por defecto asumimos efectivo si no hay nada o está cargando
    const pago = desplieguesData.find((d: any) => d.value === selectedPagoId)
    if (!pago) return false
    return pago.tipo?.toLowerCase() === 'efectivo' || 
           pago.label?.toUpperCase().includes('EFECTIVO') || 
           pago.label?.toUpperCase().includes('CCH')
  }, [selectedPagoId, desplieguesData])

  const totalDeudaCliente = useMemo(() =>
    ventasDistribucion.filter(v => v._seleccionada).reduce((sum, v) => sum + v._saldoPendiente, 0), [ventasDistribucion])

  const totalDistribuido = useMemo(() =>
    ventasDistribucion.reduce((sum, v) => sum + v._montoAPagar, 0), [ventasDistribucion])

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
      if (!clienteId || !user?.id) throw new Error('Datos incompletos')
      const values = await form.validateFields()

      const distribucion = ventasDistribucion.filter(v => v._montoAPagar > 0)

      if (distribucion.length === 0) throw new Error('No hay montos asignados')

      // Validar que cada fila con monto tenga modo de pago
      const sinPago = distribucion.filter(v => !v._desplieguePagoId)
      if (sinPago.length > 0) {
        throw new Error(`Falta modo de pago en: ${sinPago.map(v => `${v.serie}-${v.numero}`).join(', ')}`)
      }

      return ventaApi.storeCobroMultiple({
        cliente_id: clienteId,
        monto_total: montoTotal,
        fecha: dayjs(values.fecha).format('YYYY-MM-DD'),
        observacion: values.observacion || undefined,
        numero_operacion: isEfectivo ? undefined : values.numero_operacion || undefined,
        user_id: user.id,
        distribucion: distribucion.map(v => ({
          venta_id: v.id,
          monto: v._montoAPagar,
          despliegue_de_pago_id: v._desplieguePagoId ? String(extractDesplieguePagoId(v._desplieguePagoId) ?? v._desplieguePagoId) : undefined,
        })),
      })
    },
    onSuccess: async (result) => {
      if (result.error) {
        message.error(result.error.message)
        return
      }
      message.success(result.data?.message || 'Cobro múltiple registrado')
      
      // Invalidar queries para actualizar datos
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR_STATS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR, 'cobro-multiple', clienteId] })
      
      const cobrosIds = result.data?.cobros_ids
      if (cobrosIds && cobrosIds.length > 0) {
        // Generar PDF masivo
        const API_URL = process.env.NEXT_PUBLIC_API_URL
        const { getAuthToken } = await import('~/lib/api')
        const token = getAuthToken()
        setTicketModalOpen(true)
        setTicketLoading(true)
        try {
          const idsParam = cobrosIds.join(',')
          const res = await fetch(`${API_URL}/pdf/cobro-venta-multiple?ids=${idsParam}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/pdf',
            },
          })
          if (!res.ok) throw new Error(`Error PDF: ${res.status}`)
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          setTicketPdfUrl(url)
        } catch (err) {
          console.error('Error al obtener tickets masivos:', err)
          message.error('Error al generar los tickets')
        } finally {
          setTicketLoading(false)
        }
      }

      // Resetear formulario pero mantener cliente y fecha
      const currentClienteId = clienteId
      const currentFecha = form.getFieldValue('fecha')
      const currentDesplieguePago = form.getFieldValue('despliegue_de_pago_id')
      
      // Resetear campos
      form.setFieldsValue({
        observacion: undefined,
        numero_operacion: undefined,
        fecha: currentFecha,
        despliegue_de_pago_id: currentDesplieguePago,
      })
      
      // Resetear montos
      setMontoTotal(0)
      setVentasDistribucion([])
      
      // NO cerrar el modal - el usuario puede seguir registrando pagos
      // handleClose() <- REMOVIDO
    },
    onError: (error: any) => {
      message.error(error?.message || 'Error al registrar cobro múltiple')
    },
  })

  const handleClose = useCallback(() => {
    form.resetFields()
    setClienteId(undefined)
    setVentasDistribucion([])
    setMontoTotal(0)
    setOpen(false)
  }, [form, setOpen])

  const tipoDocMap: Record<string, string> = { '01': 'FAC', '03': 'BOL', 'nv': 'NV' }

  // Definir columnas para AG Grid
  const columnDefs = useMemo<ColDef<VentaConDistribucion>[]>(() => [
    {
      headerName: '',
      field: '_seleccionada',
      width: 60,
      cellRenderer: (params: ICellRendererParams<VentaConDistribucion>) => {
        return (
          <div className="flex items-center justify-center h-full">
            <Checkbox
              checked={params.data?._seleccionada}
              onChange={() => params.data && toggleVenta(params.data.id)}
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
      cellRenderer: (params: ICellRendererParams<VentaConDistribucion>) => {
        if (!params.data) return null
        const tipo = tipoDocMap[params.data.tipo_documento] || params.data.tipo_documento
        return (
          <div className="flex items-center gap-1">
            <span className='text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold'>
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
      cellRenderer: (params: ICellRendererParams<VentaConDistribucion>) => {
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
      field: '_totalVenta',
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
      cellRenderer: (params: ICellRendererParams<VentaConDistribucion>) => {
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
      cellRenderer: (params: ICellRendererParams<VentaConDistribucion>) => {
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

  // ¿Todas las filas con monto tienen modo de pago?
  const filasConMonto = ventasDistribucion.filter(v => v._montoAPagar > 0)
  const faltaPago = filasConMonto.some(v => !v._desplieguePagoId)
  const okDisabled = totalDistribuido <= 0 || Math.abs(montoSinDistribuir) > 0.01 || faltaPago

  return (
    <>
      <Modal
      title={
        <div className='flex items-center gap-2'>
          <FaMoneyBillWave className='text-rose-600' size={20} />
          <span>Cobro Múltiple por Cliente</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      onOk={() => mutation.mutate()}
      okText='Registrar Cobro'
      cancelText='Cerrar'
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: okDisabled }}
      width={1200}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        {/* Cabecera: cliente, modo pago global, fecha, operación */}
        <div className='grid grid-cols-5 gap-3 mb-4'>
          <div className='col-span-2'>
            <LabelBase label='Cliente:' orientation='column'>
              <SelectClientes
                propsForm={{ name: 'cliente_id', rules: [{ required: true, message: 'Requerido' }] }}
                placeholder='Buscar cliente...'
                form={form}
                onChange={(value) => {
                  setClienteId(value)
                  setMontoTotal(0)
                  setVentasDistribucion([])
                }}
                onSelect={(value) => {
                  setClienteId(value as number)
                  setMontoTotal(0)
                  setVentasDistribucion([])
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
          
          <div className={isEfectivo ? 'invisible' : 'visible'}>
            <LabelBase label='N° Operación:' orientation='column'>
              <Form.Item name='numero_operacion' noStyle>
                <Input placeholder='Opcional' />
              </Form.Item>
            </LabelBase>
          </div>
        </div>

        {clienteId && (
          <>
            {/* Resumen de montos */}
            <div className='flex items-center gap-4 mb-4 bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg border border-rose-200'>
              <div className='flex-1'>
                <span className='text-xs font-bold text-gray-500 uppercase block mb-1'>Deuda Total del Cliente</span>
                <span className='text-2xl font-bold text-red-600'>S/. {totalDeudaCliente.toFixed(2)}</span>
              </div>
              <div className='flex-1'>
                <span className='text-xs font-bold text-gray-500 uppercase block mb-1'>Monto que Paga</span>
                <InputNumber
                  className='w-full !text-xl !font-bold'
                  prefix='S/.'
                  precision={2}
                  min={0.01}
                  max={totalDeudaCliente}
                  placeholder='0.00'
                  size='large'
                  value={montoTotal || undefined}
                  onChange={handleMontoChange}
                />
              </div>
              <div className='flex-1 text-center'>
                <span className='text-xs font-bold text-gray-500 uppercase block mb-1'>Distribuido</span>
                <span className={`text-2xl font-bold ${Math.abs(montoSinDistribuir) < 0.01 ? 'text-rose-600' : 'text-orange-500'}`}>
                  S/. {totalDistribuido.toFixed(2)}
                </span>
                {Math.abs(montoSinDistribuir) >= 0.01 && (
                  <span className='text-xs text-orange-500 block'>Sin asignar: S/. {montoSinDistribuir.toFixed(2)}</span>
                )}
              </div>
            </div>

            {/* Tabla de ventas pendientes con AG Grid */}
            <div className='h-[400px] w-full'>
              <TableBase<VentaConDistribucion>
                ref={gridRef}
                columnDefs={columnDefs}
                rowData={ventasDistribucion}
                rowSelection={false}
                withNumberColumn={false}
                selectionColor="transparent"
                persistColumnState={true}
                tableKey="modal-cobro-multiple-ventas"
                isVisible={open}
                getRowStyle={(params): RowStyle | undefined => {
                  if (!params.data) return undefined
                  const necesitaPago = params.data._montoAPagar > 0 && !params.data._desplieguePagoId
                  if (necesitaPago) return { background: '#fef2f2' } as RowStyle
                  if (params.data._montoAPagar > 0) return { background: '#fff1f2' } as RowStyle
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
              <span>Ventas Seleccionadas: <span className='text-blue-700'>{ventasDistribucion.filter(v => v._seleccionada).length}</span></span>
              <span>Total Deuda Pendiente: <span className='text-red-600'>S/. {totalDeudaCliente.toFixed(2)}</span></span>
              <span>Monto a Pagar: <span className='text-rose-600 text-lg'>S/. {totalDistribuido.toFixed(2)}</span></span>
              <span>Saldo Restante: <span className='text-orange-600'>S/. {(totalDeudaCliente - totalDistribuido).toFixed(2)}</span></span>
            </div>
          </>
        )}
      </Form>
      </Modal>

      <ModalShowDoc
        open={ticketModalOpen}
        setOpen={handleCloseTicketModal}
        nro_doc='Comprobantes de Cobro'
        esTicket
        tipoDocumento='venta'
        backendPdfUrl={ticketPdfUrl}
        backendPdfLoading={ticketLoading}
      >
        <></>
      </ModalShowDoc>
    </>
  )
}
