'use client'

import { Modal, Form, InputNumber, DatePicker, Input, App } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { compraApi, type Compra, type PagoDeCompra } from '~/lib/api/compra'
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
import { orangeColors } from '~/lib/colors'
import { getAuthToken } from '~/lib/api'
import { FaFileAlt, FaTrash } from 'react-icons/fa'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'

interface ModalRegistrarPagoProps {
  open: boolean
  setOpen: (open: boolean) => void
  compra: Compra | undefined
}

export default function ModalRegistrarPago({ open, setOpen, compra }: ModalRegistrarPagoProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Congelar la compra cuando el modal abre
  const [localCompra, setLocalCompra] = useState<Compra | undefined>()
  useEffect(() => {
    if (open && compra) {
      setLocalCompra(compra)
      if (compra.tipo_moneda?.toLowerCase() === 'd' && compra.tipo_de_cambio) {
        form.setFieldValue('tipo_de_cambio', Number(compra.tipo_de_cambio))
      } else {
        form.setFieldValue('tipo_de_cambio', undefined)
      }
    }
    if (!open) setLocalCompra(undefined)
  }, [open, compra, form])

  // Calcular total de la compra
  const totalCompra = useMemo(() => {
    if (!localCompra) return 0
    return (localCompra.productos_por_almacen || []).reduce((acc, item: any) => {
      for (const u of item.unidades_derivadas ?? []) {
        const costo = Number(item.costo ?? 0)
        const cantidad = Number(u.cantidad ?? 0)
        const flete = Number(u.flete ?? 0)
        const bonificacion = Boolean(u.bonificacion)
        const montoLinea = bonificacion ? 0 : (costo * cantidad) + flete
        acc += montoLinea
      }
      return acc
    }, 0) + Number(localCompra.percepcion ?? 0)
  }, [localCompra])

  // Obtener pagos previos
  const { data: pagosData } = useQuery({
    queryKey: [QueryKeys.PAGOS_COMPRA, localCompra?.id],
    queryFn: async () => {
      if (!localCompra?.id) return { data: [] }
      const result = await compraApi.getPagos(localCompra.id)
      return result.data ?? { data: [] }
    },
    enabled: open && !!localCompra?.id,
  })

  const pagos = pagosData?.data ?? []

  // Calcular desde pagos en tiempo real
  const totalPagado = useMemo(
    () => pagos
      .filter((p: any) => p.estado !== false && p.estado !== 0)
      .reduce((sum: number, p: any) => sum + Number(p.monto || 0), 0),
    [pagos]
  )
  const saldoPendiente = totalCompra - totalPagado

  const esDolares = localCompra?.tipo_moneda?.toLowerCase() === 'd'
  const tipoDeCambio = Number(localCompra?.tipo_de_cambio ?? 0)
  const totalCompraDolares  = esDolares && tipoDeCambio ? totalCompra  / tipoDeCambio : null
  const totalPagadoDolares  = esDolares && tipoDeCambio ? totalPagado  / tipoDeCambio : null
  const saldoDolares        = esDolares && tipoDeCambio ? saldoPendiente / tipoDeCambio : null

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

  // Estado para modal de ticket de pago
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [ticketPdfUrl, setTicketPdfUrl] = useState<string | null>(null)
  const [ticketLoading, setTicketLoading] = useState(false)

  // Estado para modal de anulación
  const [anularModalOpen, setAnularModalOpen] = useState(false)
  const [pagoAAnular, setPagoAAnular] = useState<PagoDeCompra | null>(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')

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

  // Ver ticket de un pago en modal
  const handleVerTicket = useCallback(async (pagoId: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    setTicketModalOpen(true)
    setTicketLoading(true)
    setTicketPdfUrl(null)
    try {
      const res = await fetch(`${API_URL}/pdf/pago-compra/${pagoId}`, {
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
      console.error('Error al obtener ticket de pago:', err)
      message.error('Error al generar el ticket del pago')
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

  // Abrir modal de anulación
  const handleOpenAnularModal = useCallback((pago: PagoDeCompra) => {
    setPagoAAnular(pago)
    setMotivoAnulacion('')
    setAnularModalOpen(true)
  }, [])

  // Mutation para anular pago
  const anularMutation = useMutation({
    mutationFn: async () => {
      if (!localCompra?.id || !pagoAAnular?.id) throw new Error('Datos incompletos')
      return compraApi.anularPago(localCompra.id, pagoAAnular.id, motivoAnulacion)
    },
    onSuccess: (result) => {
      if (result.error) {
        message.error(result.error.message)
        return
      }
      message.success('Pago anulado correctamente')
      setAnularModalOpen(false)
      setPagoAAnular(null)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PAGOS_COMPRA, localCompra?.id] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COMPRAS_POR_PAGAR] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COMPRAS] })
    },
    onError: (error: any) => {
      message.error(error?.message || 'Error al anular el pago')
    },
  })

  // Columnas para tabla de pagos previos
  const columnsPagos: ColDef<PagoDeCompra>[] = useMemo(() => [
    { headerName: '#', width: 50, valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1 },
    {
      headerName: 'Despliegue de Pago',
      width: 250,
      valueGetter: (p) => {
        const dp = p.data?.despliegue_de_pago
        if (!dp) return ''
        const banco = dp.metodo_de_pago?.name || 'Sin Banco'
        const metodo = dp.numero_celular || ''
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
      headerName: 'Obs.',
      flex: 1,
      valueGetter: (p) => p.data?.observacion || '',
    },
    {
      headerName: 'Acciones',
      width: 100,
      cellRenderer: (p: any) => {
        if (!p.data?.id) return null
        const anulado = p.data.estado === false || p.data.estado === 0
        return (
          <div className='flex items-center justify-center gap-2 w-full h-full'>
            <button
              onClick={() => handleVerTicket(p.data.id)}
              className='text-blue-600 hover:text-blue-800'
              title='Ver ticket del pago'
            >
              <FaFileAlt size={14} />
            </button>
            {!anulado && (
              <button
                onClick={() => handleOpenAnularModal(p.data)}
                className='text-red-500 hover:text-red-700'
                title='Anular pago'
              >
                <FaTrash size={14} />
              </button>
            )}
          </div>
        )
      },
    },
  ], [handleVerTicket, handleOpenAnularModal])

  // Mutation para registrar pago
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (!localCompra?.id || !user?.id) throw new Error('Datos incompletos')
      return compraApi.storePago(localCompra.id, {
        despliegue_de_pago_id: String(extractDesplieguePagoId(values.despliegue_de_pago_id)),
        monto: values.monto,
        tipo_de_cambio: values.tipo_de_cambio || undefined,
        fecha: dayjs(values.fecha).format('YYYY-MM-DD'),
        observacion: values.observacion || undefined,
        numero_letra: values.numero_letra || undefined,
        numero_operacion: values.numero_operacion || undefined,
        afecta_caja: true,
      })
    },
    onSuccess: (result) => {
      if (result.error) {
        message.error(result.error.message)
        return
      }
      message.success(result.data?.message || 'Pago registrado correctamente')
      
      // Refrescar datos
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PAGOS_COMPRA, localCompra?.id] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COMPRAS_POR_PAGAR] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COMPRAS] })

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
      const nuevoSaldo = saldoPendiente - (result.data?.data?.monto || 0)
      if (nuevoSaldo <= 0.01) {
        message.success('Compra pagada al 100%')
        setOpen(false)
      }
    },
    onError: (error: any) => {
      message.error(error?.message || 'Error al registrar pago')
    },
  })

  const handleSubmit = useCallback(() => {
    form.validateFields().then((values) => {
      mutation.mutate(values)
    })
  }, [form, mutation])

  // Info del proveedor
  const proveedorNombre = localCompra?.proveedor?.razon_social || 'Sin proveedor'

  const nroDocumento = localCompra ? `${localCompra.serie}-${localCompra.numero}` : ''
  const tipoDocMap: Record<string, string> = { '01': 'FACTURA', '03': 'BOLETA', 'gr': 'GUÍA REMISIÓN' }
  const tipoDoc = tipoDocMap[localCompra?.tipo_documento || ''] || localCompra?.tipo_documento || ''

  return (
    <>
    <Modal
      title='Registrar Pago de Compra'
      open={open}
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      okText='Guardar Pago'
      cancelText='Cerrar'
      confirmLoading={mutation.isPending}
      width={1000}
      destroyOnHidden
    >
      {/* Info de la compra */}
      <div className='bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-4 mb-4 border border-red-200 shadow-sm'>
        <div className='grid grid-cols-3 gap-4'>
          <div className='space-y-1 border-r border-gray-300 pr-4'>
            <div className='flex items-start gap-2'>
              <span className='text-xs text-gray-500 font-medium min-w-[70px]'>Proveedor:</span>
              <span className='font-bold text-sm text-gray-800'>{proveedorNombre}</span>
            </div>
            <div className='flex items-start gap-2'>
              <span className='text-xs text-gray-500 font-medium min-w-[70px]'>RUC:</span>
              <span className='font-semibold text-sm text-gray-700'>{localCompra?.proveedor?.ruc}</span>
            </div>
          </div>
          <div className='space-y-1 border-r border-gray-300 pr-4'>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-500 font-medium min-w-[80px]'>Documento:</span>
              <span className='font-bold text-sm text-gray-800'>{tipoDoc} {nroDocumento}</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-500 font-medium min-w-[80px]'>Tipo Pago:</span>
              <span className='font-semibold text-sm text-red-600 bg-red-50 px-2 py-0.5 rounded'>CRÉDITO{localCompra?.numero_dias ? ` ${localCompra.numero_dias} DÍAS` : ''}</span>
            </div>
          </div>
          <div className='flex flex-col justify-center gap-2 pl-2'>
            <div className='flex justify-between items-center bg-white/50 px-3 py-1 rounded border border-red-100'>
              <span className='text-[10px] text-gray-500 font-bold uppercase'>Total Neto</span>
              <div className='text-right'>
                <div className='text-gray-800 font-bold text-lg leading-tight'>S/. {totalCompra.toFixed(2)}</div>
                {totalCompraDolares !== null && (
                  <div className='text-blue-600 font-semibold text-sm leading-tight'>$ {totalCompraDolares.toFixed(2)}</div>
                )}
              </div>
            </div>
            <div className='flex justify-between items-center bg-white/50 px-3 py-1 rounded border border-green-100'>
              <span className='text-[10px] text-gray-500 font-bold uppercase'>Cancelado</span>
              <div className='text-right'>
                <div className='text-green-600 font-bold text-lg leading-tight'>S/. {totalPagado.toFixed(2)}</div>
                {totalPagadoDolares !== null && (
                  <div className='text-blue-600 font-semibold text-sm leading-tight'>$ {totalPagadoDolares.toFixed(2)}</div>
                )}
              </div>
            </div>
            <div className='flex justify-between items-center bg-white/50 px-3 py-1 rounded border border-red-100'>
              <span className='text-[10px] text-gray-500 font-bold uppercase'>Saldo</span>
              <div className='text-right'>
                <div className={`font-bold text-lg leading-tight ${saldoPendiente > 0 ? 'text-red-500' : 'text-green-600'}`}>S/. {saldoPendiente.toFixed(2)}</div>
                {saldoDolares !== null && (
                  <div className='text-blue-600 font-semibold text-sm leading-tight'>$ {saldoDolares.toFixed(2)}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <Form form={form} layout='vertical' initialValues={{ fecha: dayjs() }}>
        <div className='grid grid-cols-5 gap-3'>
          <LabelBase label='Modo Pago:' orientation='column'>
            <SelectDespliegueDePago
              propsForm={{ name: 'despliegue_de_pago_id', rules: [{ required: true, message: 'Requerido' }] }}
              placeholder='Seleccione método de pago'
              onChange={(value: any) => {
                const metodo = desplieguesData?.find((d: any) => d.value === value)
                setMetodoPagoSeleccionado(metodo)
                
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

          {localCompra?.tipo_moneda?.toLowerCase() === 'd' && (
            <LabelBase label='TC Pago (S/$):' orientation='column'>
              <Form.Item
                name='tipo_de_cambio'
                noStyle
                rules={[{ required: true, message: 'Ingresa el TC del pago' }]}
              >
                <InputNumber
                  className='w-full'
                  precision={4}
                  min={0.0001}
                  step={0.01}
                  placeholder='Ej: 3.75'
                />
              </Form.Item>
            </LabelBase>
          )}

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

      {/* Tabla de pagos previos */}
      <div className='mt-4 h-[200px]'>
        <TableWithTitle<PagoDeCompra>
          id='table-pagos-previos'
          title={`Registros de pagos realizados: #${pagos.length}`}
          columnDefs={columnsPagos}
          rowData={pagos}
          selectionColor={orangeColors[1]}
          suppressRowTransform
          withNumberColumn={false}
        />
      </div>

      {/* Resumen */}
      <div className='flex justify-between mt-4 bg-gray-50 rounded-lg p-3 text-sm font-bold border border-gray-200'>
        <span>
          Facturado: <span className='text-red-700'>S/. {totalCompra.toFixed(2)}</span>
          {totalCompraDolares !== null && <span className='text-blue-600 ml-1'>($ {totalCompraDolares.toFixed(2)})</span>}
        </span>
        <span>
          Cancelado: <span className='text-green-700'>S/. {totalPagado.toFixed(2)}</span>
          {totalPagadoDolares !== null && <span className='text-blue-600 ml-1'>($ {totalPagadoDolares.toFixed(2)})</span>}
        </span>
        <span>
          Saldo Pendiente: <span className='text-red-600 text-lg'>S/. {saldoPendiente.toFixed(2)}</span>
          {saldoDolares !== null && <span className='text-blue-600 ml-1'>($ {saldoDolares.toFixed(2)})</span>}
        </span>
      </div>
    </Modal>

    {/* Modal para ver ticket del pago */}
    <ModalShowDoc
      open={ticketModalOpen}
      setOpen={handleCloseTicketModal}
      nro_doc='Comprobante de Pago'
      esTicket
      tipoDocumento='compra'
      backendPdfUrl={ticketPdfUrl}
      backendPdfLoading={ticketLoading}
    >
      <></>
    </ModalShowDoc>

    {/* Modal para anular pago */}
    <Modal
      title='Anular Pago'
      open={anularModalOpen}
      onCancel={() => setAnularModalOpen(false)}
      onOk={() => anularMutation.mutate()}
      okText='Confirmar Anulación'
      cancelText='Cancelar'
      confirmLoading={anularMutation.isPending}
      okButtonProps={{ danger: true }}
      destroyOnHidden
    >
      {pagoAAnular && (
        <div className='space-y-3'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-sm'>
            <div className='font-semibold text-red-700 mb-1'>Pago a anular:</div>
            <div>Monto: <span className='font-bold'>S/. {Number(pagoAAnular.monto || 0).toFixed(2)}</span></div>
            <div>Fecha: {pagoAAnular.fecha ? new Date(pagoAAnular.fecha).toLocaleDateString('es-PE') : '-'}</div>
            {pagoAAnular.observacion && <div>Obs: {pagoAAnular.observacion}</div>}
          </div>
          <div>
            <div className='text-sm font-medium mb-1'>Motivo de anulación (opcional):</div>
            <Input.TextArea
              rows={3}
              maxLength={500}
              placeholder='Ingrese el motivo de anulación...'
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
            />
          </div>
        </div>
      )}
    </Modal>
    </>
  )
}
