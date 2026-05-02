'use client'

import { Modal, Form, InputNumber, DatePicker, Input, App } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ventaApi, type VentaCompleta, type CobroVenta } from '~/lib/api/venta'
import { apiRequest } from '~/lib/api'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useAuth } from '~/lib/auth-context'
import dayjs from 'dayjs'
import { useMemo, useCallback, useState, useEffect } from 'react'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import { extractDesplieguePagoId } from '~/lib/utils/despliegue-pago-utils'
import LabelBase from '~/components/form/label-base'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { greenColors } from '~/lib/colors'
import { getAuthToken } from '~/lib/api'
import { FaFileAlt, FaTrash } from 'react-icons/fa'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'

interface ModalRegistrarCobroProps {
  open: boolean
  setOpen: (open: boolean) => void
  venta: VentaCompleta | undefined
}

export default function ModalRegistrarCobro({ open, setOpen, venta }: ModalRegistrarCobroProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Congelar la venta cuando el modal abre para evitar que la tabla
  // al refrescar cambie la selección y actualice el modal con otro cliente
  const [localVenta, setLocalVenta] = useState<VentaCompleta | undefined>()
  useEffect(() => {
    if (open && venta) setLocalVenta(venta)
    if (!open) setLocalVenta(undefined)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Calcular total de la venta
  const totalVenta = useMemo(() => {
    if (!localVenta) return 0
    return (localVenta.productos_por_almacen || []).reduce((acc, item: any) => {
      for (const u of item.unidades_derivadas ?? []) {
        const precio = Number(u.precio ?? 0)
        const cantidad = Number(u.cantidad ?? 0)
        const descuento = Number(u.descuento ?? 0)
        const bonificacion = Boolean(u.bonificacion)
        const montoLinea = bonificacion ? 0 : (precio * cantidad) - descuento
        acc += montoLinea
      }
      return acc
    }, 0)
  }, [localVenta])

  const totalPagado = Number(localVenta?.total_cobrado || 0)
  const saldoPendiente = totalVenta - totalPagado

  // Obtener cobros previos
  const { data: cobrosData } = useQuery({
    queryKey: [QueryKeys.COBROS_VENTA, localVenta?.id],
    queryFn: async () => {
      if (!localVenta?.id) return { data: [] }
      const result = await ventaApi.getCobros(localVenta.id)
      return result.data ?? { data: [] }
    },
    enabled: open && !!localVenta?.id,
  })

  const cobros = cobrosData?.data ?? []

  // Query para obtener despliegues de pago y setear Efectivo por defecto
  const { data: desplieguesData } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'metodos-para-ventas'],
    queryFn: async () => {
      const result = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      return result.data?.data || []
    },
    enabled: open,
  })

  // Setear Efectivo por defecto cuando se abre el modal
  useEffect(() => {
    if (open && desplieguesData && desplieguesData.length > 0) {
      const efectivo = desplieguesData.find((d: any) =>
        d.tipo?.toLowerCase() === 'efectivo' || 
        d.label?.toUpperCase().includes('EFECTIVO') || 
        d.label?.toUpperCase().includes('CCH')
      )
      if (efectivo) {
        form.setFieldsValue({ despliegue_de_pago_id: efectivo.value })
        setMetodoPagoSeleccionado(efectivo)
      }
    }
  }, [open, desplieguesData, form])

  // Estado para modal de ticket de cobro
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [ticketPdfUrl, setTicketPdfUrl] = useState<string | null>(null)
  const [ticketLoading, setTicketLoading] = useState(false)

  // Estado para modal de anular cobro
  const [anularModalOpen, setAnularModalOpen] = useState(false)
  const [cobroAAnular, setCobroAAnular] = useState<CobroVenta | null>(null)
  const [observacionAnulacion, setObservacionAnulacion] = useState('')
  const [anularLoading, setAnularLoading] = useState(false)

  // Estado para mostrar/ocultar campo N° Operación
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<any>(null)

  // Función helper para detectar si el método es efectivo
  const isEfectivo = useCallback((metodo: any) => {
    if (!metodo) return false
    const label = metodo.label?.toUpperCase() || ''
    const name = metodo.name?.toUpperCase() || ''
    const tipo = metodo.tipo?.toUpperCase() || ''
    const value = String(metodo.value || '').toUpperCase()
    
    return (
      label.includes('EFECTIVO') ||
      label.includes('CCH') ||
      name.includes('EFECTIVO') ||
      tipo.includes('EFECTIVO') ||
      value.includes('EFECTIVO')
    )
  }, [])

  // Ver ticket de un cobro en modal
  const handleVerTicket = useCallback(async (cobroId: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    setTicketModalOpen(true)
    setTicketLoading(true)
    setTicketPdfUrl(null)
    try {
      const res = await fetch(`${API_URL}/pdf/cobro-venta/${cobroId}`, {
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
      console.error('Error al obtener ticket de cobro:', err)
      message.error('Error al generar el ticket del cobro')
      setTicketModalOpen(false)
    } finally {
      setTicketLoading(false)
    }
  }, [message])

  // Anular un cobro
  const handleAnularCobro = useCallback(async (cobroId: string) => {
    if (!localVenta?.id) return
    
    const confirmed = window.confirm('¿Está seguro de anular este cobro? Esta acción no se puede deshacer.')
    if (!confirmed) return

    try {
      const result = await ventaApi.anularCobro(localVenta.id, cobroId)
      if (result.error) {
        message.error(result.error.message)
        return
      }
      message.success(result.data?.message || 'Cobro anulado correctamente')
      // Refrescar datos
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COBROS_VENTA, localVenta.id] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR_STATS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS] })
    } catch (error: any) {
      message.error(error?.message || 'Error al anular el cobro')
    }
  }, [localVenta, message, queryClient])

  // Limpiar URL al cerrar modal de ticket
  const handleCloseTicketModal = useCallback((v: boolean) => {
    setTicketModalOpen(v)
    if (!v && ticketPdfUrl) {
      URL.revokeObjectURL(ticketPdfUrl)
      setTicketPdfUrl(null)
    }
  }, [ticketPdfUrl])

  // Abrir modal para anular cobro
  const handleOpenAnularModal = useCallback((cobro: CobroVenta) => {
    setCobroAAnular(cobro)
    setObservacionAnulacion('')
    setAnularModalOpen(true)
  }, [])

  // Confirmar anulación con observación
  const handleConfirmAnulacion = useCallback(async () => {
    if (!localVenta?.id || !cobroAAnular?.id) return
    
    setAnularLoading(true)
    try {
      const result = await ventaApi.anularCobro(localVenta.id, cobroAAnular.id, observacionAnulacion)
      if (result.error) {
        message.error(result.error.message)
        return
      }
      message.success(result.data?.message || 'Cobro anulado correctamente')
      setAnularModalOpen(false)
      setCobroAAnular(null)
      setObservacionAnulacion('')
      // Refrescar datos
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COBROS_VENTA, localVenta.id] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR_STATS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS] })
    } catch (error: any) {
      message.error(error?.message || 'Error al anular el cobro')
    } finally {
      setAnularLoading(false)
    }
  }, [localVenta, cobroAAnular, observacionAnulacion, queryClient, message])

  // Columnas para tabla de cobros previos
  const columnsCobros: ColDef<CobroVenta>[] = useMemo(() => [
    { headerName: '#', width: 50, valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1 },
    {
      headerName: 'Despliegue de Pago',
      width: 250,
      valueGetter: (p) => {
        const dp = p.data?.despliegue_de_pago
        if (!dp) return ''
        // Construir el label: Banco/Método
        const banco = dp.metodo_de_pago?.name || 'Sin Banco'
        const metodo = dp.name || ''
        return `${banco}/${metodo}`
      },
    },
    {
      headerName: 'Fecha y Hora Pago',
      width: 150,
      valueGetter: (p) => {
        const val = p.data?.created_at || p.data?.fecha
        return val ? dayjs(val).format('DD/MM/YYYY hh:mm A') : ''
      },
    },
    {
      headerName: 'Monto',
      width: 100,
      valueGetter: (p) => `S/. ${Number(p.data?.monto || 0).toFixed(2)}`,
    },
    {
      headerName: 'Registra',
      width: 120,
      valueGetter: (p) => p.data?.user?.name || '',
    },
    {
      headerName: 'Obs.',
      flex: 1,
      valueGetter: (p) => p.data?.observacion || '',
    },
    {
      headerName: 'Ticket',
      width: 70,
      cellRenderer: (p: any) => {
        if (!p.data?.id) return null
        return (
          <button
            onClick={() => handleVerTicket(p.data.id)}
            className='flex items-center justify-center w-full h-full text-blue-600 hover:text-blue-800'
            title='Ver ticket del cobro'
          >
            <FaFileAlt size={14} />
          </button>
        )
      },
    },
    {
      headerName: 'Anular',
      width: 70,
      cellRenderer: (p: any) => {
        if (!p.data?.id) return null
        return (
          <button
            onClick={() => handleOpenAnularModal(p.data)}
            className='flex items-center justify-center w-full h-full text-red-600 hover:text-red-800'
            title='Anular este cobro'
          >
            <FaTrash size={14} />
          </button>
        )
      },
    },
  ], [handleVerTicket, handleOpenAnularModal])

  // Mutation para registrar cobro
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (!localVenta?.id || !user?.id) throw new Error('Datos incompletos')
      return ventaApi.storeCobro(localVenta.id, {
        despliegue_de_pago_id: String(extractDesplieguePagoId(values.despliegue_de_pago_id)),
        monto: values.monto,
        fecha: dayjs(values.fecha).format('YYYY-MM-DD'),
        observacion: values.observacion || undefined,
        numero_letra: values.numero_letra || undefined,
        numero_operacion: values.numero_operacion || undefined,
        user_id: user.id,
      })
    },
    onSuccess: (result) => {
      if (result.error) {
        message.error(result.error.message)
        return
      }
      message.success(result.data?.message || 'Cobro registrado correctamente')
      
      // Refrescar datos - esto actualizará localVenta automáticamente
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COBROS_VENTA, localVenta?.id] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR_STATS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS] })

      // Resetear formulario y setear valores por defecto
      form.resetFields()
      if (desplieguesData && desplieguesData.length > 0) {
        const efectivo = desplieguesData.find((d: any) =>
          d.tipo?.toLowerCase() === 'efectivo' || 
          d.label?.toUpperCase().includes('EFECTIVO') || 
          d.label?.toUpperCase().includes('CCH')
        )
        if (efectivo) {
          form.setFieldsValue({ despliegue_de_pago_id: efectivo.value })
          setMetodoPagoSeleccionado(efectivo)
        }
      }

      // Si saldo_pendiente es 0, cerrar el modal
      if (result.data?.saldo_pendiente === 0) {
        message.success('Venta pagada al 100%')
        setOpen(false)
      }
    },
    onError: (error: any) => {
      message.error(error?.message || 'Error al registrar cobro')
    },
  })

  const handleSubmit = useCallback(() => {
    form.validateFields().then((values) => {
      mutation.mutate(values)
    })
  }, [form, mutation])

  // Info del cliente
  const clienteNombre = localVenta?.cliente?.razon_social ||
    `${localVenta?.cliente?.nombres || ''} ${localVenta?.cliente?.apellidos || ''}`.trim() || 'Sin cliente'

  const nroDocumento = localVenta ? `${localVenta.serie}-${localVenta.numero}` : ''
  const tipoDocMap: Record<string, string> = { '01': 'FACTURA', '03': 'BOLETA', 'nv': 'NOTA DE VENTA' }
  const tipoDoc = tipoDocMap[localVenta?.tipo_documento || ''] || localVenta?.tipo_documento || ''

  return (
    <>
    <Modal
      title='Registrar Cobro de Venta'
      open={open}
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      okText='Guardar Cobro'
      cancelText='Cerrar'
      confirmLoading={mutation.isPending}
      width={1000}
      destroyOnHidden
    >
      {/* Info de la venta */}
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200 shadow-sm'>
        <div className='grid grid-cols-3 gap-4'>
          <div className='space-y-1 border-r border-gray-300 pr-4'>
            <div className='flex items-start gap-2'>
              <span className='text-xs text-gray-500 font-medium min-w-[70px]'>Cliente:</span>
              <span className='font-bold text-sm text-gray-800'>{clienteNombre}</span>
            </div>
            <div className='flex items-start gap-2'>
              <span className='text-xs text-gray-500 font-medium min-w-[70px]'>Doc:</span>
              <span className='font-semibold text-sm text-gray-700'>{localVenta?.cliente?.numero_documento}</span>
            </div>
          </div>
          <div className='space-y-1 border-r border-gray-300 pr-4'>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-500 font-medium min-w-[80px]'>Documento:</span>
              <span className='font-bold text-sm text-gray-800'>{tipoDoc} {nroDocumento}</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-500 font-medium min-w-[80px]'>Tipo Pago:</span>
              <span className='font-semibold text-sm text-red-600 bg-red-50 px-2 py-0.5 rounded'>CRÉDITO{localVenta?.numero_dias ? ` ${localVenta.numero_dias} DÍAS` : ''}</span>
            </div>
          </div>
          <div className='flex flex-col justify-center gap-2 pl-2'>
            <div className='flex justify-between items-center bg-white/50 px-3 py-1 rounded border border-blue-100'>
              <span className='text-[10px] text-gray-500 font-bold uppercase'>Total Neto</span>
              <span className='text-gray-800 font-bold text-lg'>S/. {totalVenta.toFixed(2)}</span>
            </div>
            <div className='flex justify-between items-center bg-white/50 px-3 py-1 rounded border border-green-100'>
              <span className='text-[10px] text-gray-500 font-bold uppercase'>Cancelado</span>
              <span className='text-green-600 font-bold text-lg'>S/. {totalPagado.toFixed(2)}</span>
            </div>
            <div className='flex justify-between items-center bg-white/50 px-3 py-1 rounded border border-red-100'>
              <span className='text-[10px] text-gray-500 font-bold uppercase'>Saldo</span>
              <span className={`font-bold text-lg ${saldoPendiente > 0 ? 'text-red-500' : 'text-green-600'}`}>S/. {saldoPendiente.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <Form form={form} layout='vertical' initialValues={{ fecha: dayjs() }}>
        <div className='grid grid-cols-4 gap-3'>
          <LabelBase label='Modo Pago:' orientation='column'>
            <SelectDespliegueDePago
              propsForm={{ name: 'despliegue_de_pago_id', rules: [{ required: true, message: 'Requerido' }] }}
              placeholder='Seleccione método de pago'
              onChange={(value: any) => {
                // Buscar el método seleccionado en los datos
                const metodo = desplieguesData?.find((d: any) => d.value === value)
                setMetodoPagoSeleccionado(metodo)
                
                // Si es efectivo, limpiar el campo de número de operación
                if (metodo && isEfectivo(metodo)) {
                  form.setFieldValue('numero_operacion', undefined)
                }
              }}
            />
          </LabelBase>

          <LabelBase label='Monto:' orientation='column'>
            <Form.Item name='monto' rules={[
              { required: true, message: 'Requerido' },
              { type: 'number', min: 0.01, message: 'Mínimo S/. 0.01' },
              { type: 'number', max: Number(saldoPendiente.toFixed(2)), message: `Máximo S/. ${saldoPendiente.toFixed(2)}` },
            ]} noStyle>
              <InputNumber
                className='w-full'
                prefix='S/.'
                precision={2}
                min={0.01}
                max={Number(saldoPendiente.toFixed(2))}
                placeholder='0.00'
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label='Fecha Pago:' orientation='column'>
            <Form.Item name='fecha' rules={[{ required: true, message: 'Requerido' }]} noStyle>
              <DatePicker 
                className='w-full' 
                showTime={{ format: 'hh:mm A' }}
                format='DD/MM/YYYY hh:mm A' 
              />
            </Form.Item>
          </LabelBase>

          {/* N° Operación solo si el método es digital (no efectivo) */}
          {metodoPagoSeleccionado && !isEfectivo(metodoPagoSeleccionado) && (
            <div className='transition-all duration-300 ease-in-out'>
              <LabelBase label='N° Operación:' orientation='column'>
                <Form.Item 
                  name='numero_operacion' 
                  rules={[{ required: true, message: 'Requerido para pagos digitales' }]} 
                  noStyle
                >
                  <Input 
                    placeholder='Nº operación' 
                    className='transition-all duration-200'
                  />
                </Form.Item>
              </LabelBase>
            </div>
          )}
          
          {/* Espacio reservado cuando es efectivo para evitar saltos de layout */}
          {metodoPagoSeleccionado && isEfectivo(metodoPagoSeleccionado) && (
            <div className='h-[60px]' />
          )}
        </div>

        <div className='mt-3'>
          <LabelBase label='Observación:' orientation='column'>
            <Form.Item name='observacion' noStyle>
              <Input placeholder='Observaciones (opcional)' maxLength={500} />
            </Form.Item>
          </LabelBase>
        </div>
      </Form>

      {/* Tabla de cobros previos */}
      <div className='mt-4 h-[200px]'>
        <TableWithTitle<CobroVenta>
          id='table-cobros-previos'
          title={`Registros de pagos realizados: #${cobros.length}`}
          columnDefs={columnsCobros}
          rowData={cobros}
          selectionColor={greenColors[1]}
          suppressRowTransform
          withNumberColumn={false}
        />
      </div>

      {/* Resumen */}
      <div className='flex justify-between mt-4 bg-gray-50 rounded-lg p-3 text-sm font-bold border border-gray-200'>
        <span>Facturado: <span className='text-blue-700'>S/. {totalVenta.toFixed(2)}</span></span>
        <span>Cancelado: <span className='text-green-700'>S/. {totalPagado.toFixed(2)}</span></span>
        <span>Saldo Pendiente: <span className='text-red-600 text-lg'>S/. {saldoPendiente.toFixed(2)}</span></span>
      </div>
    </Modal>

    {/* Modal para ver ticket del cobro */}
    <ModalShowDoc
      open={ticketModalOpen}
      setOpen={handleCloseTicketModal}
      nro_doc='Comprobante de Cobro'
      esTicket
      tipoDocumento='venta'
      backendPdfUrl={ticketPdfUrl}
      backendPdfLoading={ticketLoading}
    >
      <></>
    </ModalShowDoc>

    {/* Modal para anular cobro con observación */}
    <Modal
      title='Anular Cobro'
      open={anularModalOpen}
      onCancel={() => {
        setAnularModalOpen(false)
        setCobroAAnular(null)
        setObservacionAnulacion('')
      }}
      footer={[
        <button
          key='cancel'
          onClick={() => {
            setAnularModalOpen(false)
            setCobroAAnular(null)
            setObservacionAnulacion('')
          }}
          className='px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50'
        >
          Cancelar
        </button>,
        <button
          key='submit'
          onClick={handleConfirmAnulacion}
          disabled={anularLoading}
          className='px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
        >
          {anularLoading ? 'Anulando...' : 'Confirmar Anulación'}
        </button>,
      ]}
      width={500}
      centered
    >
      <div className='space-y-4'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
          <p className='text-sm text-red-800 font-semibold'>
            ⚠️ Está a punto de anular el siguiente cobro:
          </p>
          {cobroAAnular && (
            <div className='mt-2 text-sm text-red-700 space-y-1'>
              <p><strong>Monto:</strong> S/. {Number(cobroAAnular.monto || 0).toFixed(2)}</p>
              <p><strong>Fecha:</strong> {dayjs(cobroAAnular.created_at || cobroAAnular.fecha).format('DD/MM/YYYY hh:mm A')}</p>
              <p><strong>Método:</strong> {cobroAAnular.despliegue_de_pago?.name || '-'}</p>
            </div>
          )}
        </div>

        <div>
          <label className='block text-sm font-semibold text-gray-700 mb-2'>
            Observación de Anulación:
          </label>
          <textarea
            value={observacionAnulacion}
            onChange={(e) => setObservacionAnulacion(e.target.value)}
            placeholder='Indique el motivo de la anulación...'
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500'
            rows={4}
            maxLength={500}
          />
          <p className='text-xs text-gray-500 mt-1'>{observacionAnulacion.length}/500</p>
        </div>
      </div>
    </Modal>
    </>
  )
}
