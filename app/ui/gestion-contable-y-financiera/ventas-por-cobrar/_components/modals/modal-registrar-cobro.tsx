'use client'

import { Modal, Form, InputNumber, DatePicker, Input, App } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ventaApi, type VentaCompleta, type CobroVenta } from '~/lib/api/venta'
import { apiRequest } from '~/lib/api'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useAuth } from '~/lib/auth-context'
import dayjs from 'dayjs'
import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import { extractDesplieguePagoId } from '~/lib/utils/despliegue-pago-utils'
import LabelBase from '~/components/form/label-base'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { greenColors } from '~/lib/colors'
import { getAuthToken } from '~/lib/api'
import { FaFileAlt, FaTrash, FaPrint } from 'react-icons/fa'
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
  const autofilledMonto = useRef(false)
  useEffect(() => {
    if (open && venta) {
      setLocalVenta(venta)
      autofilledMonto.current = false
    }
    if (!open) {
      setLocalVenta(undefined)
      autofilledMonto.current = false
    }
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

  // Calcular desde cobros en tiempo real para que se actualice sin cerrar el modal
  const totalPagado = useMemo(
    () => cobros
      .filter((c: any) => c.estado !== false && c.estado !== 0)
      .reduce((sum: number, c: any) => sum + Number(c.monto || 0), 0),
    [cobros]
  )
  const saldoPendiente = totalVenta - totalPagado

  // Autofill monto con el saldo pendiente cada vez que cambia (al abrir o tras registrar un cobro)
  useEffect(() => {
    if (open && saldoPendiente > 0 && !autofilledMonto.current) {
      form.setFieldValue('monto', Number(saldoPendiente.toFixed(2)))
      autofilledMonto.current = true
    }
  }, [open, saldoPendiente, form])

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

  // Estado para modal de impresión masiva de tickets
  const [impresionMasivaOpen, setImpresionMasivaOpen] = useState(false)
  const [ticketsMasivosPdfUrl, setTicketsMasivosPdfUrl] = useState<string | null>(null)
  const [ticketsMasivosLoading, setTicketsMasivosLoading] = useState(false)

  // Estado para mostrar/ocultar campo N° Operación
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<any>(null)
  const [sobrecargoCalculado, setSobrecargoCalculado] = useState(0)

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

  // Calcular sobrecargo cuando cambia el método de pago
  useEffect(() => {
    if (!metodoPagoSeleccionado) {
      setSobrecargoCalculado(0)
      return
    }

    const tipoSobrecargo = metodoPagoSeleccionado.tipo_sobrecargo || 'ninguno'
    const porcentajeSobrecargo = Number(metodoPagoSeleccionado.sobrecargo_porcentaje || 0)
    const adicional = Number(metodoPagoSeleccionado.adicional || 0)

    if (tipoSobrecargo === 'ninguno') {
      setSobrecargoCalculado(0)
    } else if (tipoSobrecargo === 'porcentaje') {
      const sobrecargo = saldoPendiente * (porcentajeSobrecargo / 100)
      setSobrecargoCalculado(sobrecargo)
    } else if (tipoSobrecargo === 'fijo') {
      setSobrecargoCalculado(adicional)
    }
  }, [metodoPagoSeleccionado, saldoPendiente])

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

  // Limpiar URL al cerrar modal de ticket
  const handleCloseTicketModal = useCallback((v: boolean) => {
    setTicketModalOpen(v)
    if (!v && ticketPdfUrl) {
      URL.revokeObjectURL(ticketPdfUrl)
      setTicketPdfUrl(null)
    }
  }, [ticketPdfUrl])

  // Imprimir masivamente todos los tickets de cobro (solo los NO anulados)
  const handleImpresionMasiva = useCallback(async () => {
    if (!cobros || cobros.length === 0) {
      message.warning('No hay cobros registrados para imprimir')
      return
    }

    // Filtrar solo cobros activos (no anulados)
    const cobrosActivos = cobros.filter((c: any) => c.estado !== false && c.estado !== 0)
    
    if (cobrosActivos.length === 0) {
      message.warning('No hay cobros activos para imprimir')
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    setImpresionMasivaOpen(true)
    setTicketsMasivosLoading(true)
    setTicketsMasivosPdfUrl(null)
    try {
      const cobroIds = cobrosActivos.map((c: any) => c.id).join(',')
      const res = await fetch(`${API_URL}/pdf/cobro-venta-multiple?ids=${cobroIds}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
        },
      })
      if (!res.ok) throw new Error(`Error PDF: ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setTicketsMasivosPdfUrl(url)
    } catch (err) {
      console.error('Error al obtener tickets masivos:', err)
      message.error('Error al generar los tickets masivos')
      setImpresionMasivaOpen(false)
    } finally {
      setTicketsMasivosLoading(false)
    }
  }, [cobros, message])

  // Limpiar URL al cerrar modal de impresión masiva
  const handleCloseImpresionMasivaModal = useCallback((v: boolean) => {
    setImpresionMasivaOpen(v)
    if (!v && ticketsMasivosPdfUrl) {
      URL.revokeObjectURL(ticketsMasivosPdfUrl)
      setTicketsMasivosPdfUrl(null)
    }
  }, [ticketsMasivosPdfUrl])

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
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COBROS_VENTA, 'all-cobros'] }) // ← Agregar esta línea
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
        return val ? dayjs(val).format('DD/MM/YYYY hh:mm:ss A') : ''
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
      headerName: 'Acciones',
      width: 100,
      cellRenderer: (p: any) => {
        if (!p.data?.id) return null
        return (
          <div className='flex items-center justify-center gap-2 w-full h-full'>
            <button
              onClick={() => handleVerTicket(p.data.id)}
              className='text-blue-600 hover:text-blue-800'
              title='Ver ticket del cobro'
            >
              <FaFileAlt size={14} />
            </button>
            <button
              onClick={() => handleOpenAnularModal(p.data)}
              className='text-red-600 hover:text-red-800'
              title='Anular este cobro'
            >
              <FaTrash size={14} />
            </button>
          </div>
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
        fecha: dayjs(values.fecha).format('YYYY-MM-DD HH:mm:ss'),
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
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COBROS_VENTA, 'all-cobros'] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR_STATS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS] })
      // Invalidar queries de ganancias para que se actualice en mis-ganancias
      queryClient.invalidateQueries({ queryKey: ['ganancias'] })
      queryClient.invalidateQueries({ queryKey: ['mis-ganancias'] })

      // Permitir nuevo autofill del monto con el saldo actualizado
      autofilledMonto.current = false

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
              <span className='text-[10px] text-gray-500 font-bold uppercase'>Total a Cobrar</span>
              <span className='text-gray-800 font-bold text-lg'>S/. {(saldoPendiente + sobrecargoCalculado).toFixed(2)}</span>
            </div>
            <div className='flex justify-between items-center bg-white/50 px-3 py-1 rounded border border-green-100'>
              <span className='text-[10px] text-gray-500 font-bold uppercase'>Total Pagado</span>
              <span className='text-green-600 font-bold text-lg'>S/. {totalPagado.toFixed(2)}</span>
            </div>
            <div className='flex justify-between items-center bg-white/50 px-3 py-1 rounded border border-red-100'>
              <span className='text-[10px] text-gray-500 font-bold uppercase'>Saldo Pendiente</span>
              <span className={`font-bold text-lg ${saldoPendiente > 0 ? 'text-red-500' : 'text-green-600'}`}>S/. {saldoPendiente.toFixed(2)}</span>
            </div>
            {sobrecargoCalculado > 0 && (
              <div className='flex justify-between items-center bg-orange-50/50 px-3 py-1 rounded border border-orange-200'>
                <span className='text-[10px] text-orange-600 font-bold uppercase'>Sobrecargo</span>
                <span className='text-orange-600 font-bold text-lg'>+S/. {sobrecargoCalculado.toFixed(2)}</span>
              </div>
            )}
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
                showTime={{ format: 'hh:mm:ss A' }}
                format='DD/MM/YYYY hh:mm:ss A' 
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
          extraTitle={
            <button
              onClick={handleImpresionMasiva}
              disabled={!cobros || cobros.filter((c: any) => c.estado !== false && c.estado !== 0).length === 0}
              className='ml-2 px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1'
              title={cobros && cobros.filter((c: any) => c.estado !== false && c.estado !== 0).length > 0 
                ? `Imprimir ${cobros.filter((c: any) => c.estado !== false && c.estado !== 0).length} ticket(s) activo(s)` 
                : 'No hay cobros activos para imprimir'}
            >
              <FaPrint size={10} />
              <span>Imprimir Tickets ({cobros?.filter((c: any) => c.estado !== false && c.estado !== 0).length || 0})</span>
            </button>
          }
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
      // Este modal es hermano (no hijo) del modal "Registrar Cobro", por lo que antd
      // les asigna el mismo z-index (1100) y el orden del DOM decide cuál queda encima.
      // Forzamos un z-index mayor para que "Anular Cobro" siempre quede sobre el padre.
      zIndex={1100 + 100}
      destroyOnHidden
    >
      <div className='space-y-4'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
          <p className='text-sm text-red-800 font-semibold'>
            ⚠️ Está a punto de anular el siguiente cobro:
          </p>
          {cobroAAnular && (
            <div className='mt-2 text-sm text-red-700 space-y-1'>
              <p><strong>Monto:</strong> S/. {Number(cobroAAnular.monto || 0).toFixed(2)}</p>
              <p><strong>Fecha:</strong> {dayjs(cobroAAnular.created_at || cobroAAnular.fecha).format('DD/MM/YYYY hh:mm:ss A')}</p>
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

    {/* Modal para impresión masiva de tickets */}
    <ModalShowDoc
      open={impresionMasivaOpen}
      setOpen={handleCloseImpresionMasivaModal}
      nro_doc='Comprobantes de Cobro Masivos'
      esTicket
      tipoDocumento='venta'
      backendPdfUrl={ticketsMasivosPdfUrl}
      backendPdfLoading={ticketsMasivosLoading}
    >
      <></>
    </ModalShowDoc>
    </>
  )
}
