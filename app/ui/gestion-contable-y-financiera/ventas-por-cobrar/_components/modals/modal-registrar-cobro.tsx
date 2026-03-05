'use client'

import { Modal, Form, InputNumber, DatePicker, Input, App } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ventaApi, type VentaCompleta, type CobroVenta } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useAuth } from '~/lib/auth-context'
import dayjs from 'dayjs'
import { useMemo, useCallback } from 'react'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import { extractDesplieguePagoId } from '~/lib/utils/despliegue-pago-utils'
import LabelBase from '~/components/form/label-base'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { greenColors } from '~/lib/colors'

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

  // Calcular total de la venta
  const totalVenta = useMemo(() => {
    if (!venta) return 0
    return (venta.productos_por_almacen || []).reduce((acc, item: any) => {
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
  }, [venta])

  const totalPagado = Number(venta?.total_cobrado || 0)
  const saldoPendiente = totalVenta - totalPagado

  // Obtener cobros previos
  const { data: cobrosData } = useQuery({
    queryKey: [QueryKeys.COBROS_VENTA, venta?.id],
    queryFn: async () => {
      if (!venta?.id) return { data: [] }
      const result = await ventaApi.getCobros(venta.id)
      return result.data ?? { data: [] }
    },
    enabled: open && !!venta?.id,
  })

  const cobros = cobrosData?.data ?? []

  // Columnas para tabla de cobros previos
  const columnsCobros: ColDef<CobroVenta>[] = useMemo(() => [
    { headerName: '#', width: 50, valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1 },
    {
      headerName: 'M. Pago',
      width: 120,
      valueGetter: (p) => {
        const dp = p.data?.despliegue_de_pago
        return dp?.metodo_de_pago?.name
          ? `${dp.metodo_de_pago.name} / ${dp.name}`
          : dp?.name || ''
      },
    },
    {
      headerName: 'Fecha',
      width: 110,
      valueGetter: (p) => p.data?.fecha ? dayjs(p.data.fecha).format('DD/MM/YYYY') : '',
    },
    {
      headerName: 'Monto',
      width: 110,
      valueGetter: (p) => `S/. ${Number(p.data?.monto || 0).toFixed(2)}`,
    },
    {
      headerName: 'Registra',
      width: 130,
      valueGetter: (p) => p.data?.user?.name || '',
    },
    {
      headerName: 'Observación',
      flex: 1,
      valueGetter: (p) => p.data?.observacion || '',
    },
  ], [])

  // Mutation para registrar cobro
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (!venta?.id || !user?.id) throw new Error('Datos incompletos')
      return ventaApi.storeCobro(venta.id, {
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
      form.resetFields()
      // Refrescar datos
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COBROS_VENTA, venta?.id] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VENTAS_POR_COBRAR_STATS] })

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
  const clienteNombre = venta?.cliente?.razon_social ||
    `${venta?.cliente?.nombres || ''} ${venta?.cliente?.apellidos || ''}`.trim() || 'Sin cliente'

  const nroDocumento = venta ? `${venta.serie}-${venta.numero}` : ''
  const tipoDocMap: Record<string, string> = { '01': 'FACTURA', '03': 'BOLETA', 'nv': 'NOTA DE VENTA' }
  const tipoDoc = tipoDocMap[venta?.tipo_documento || ''] || venta?.tipo_documento || ''

  return (
    <Modal
      title='Registrar Cobro de Venta'
      open={open}
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      okText='Guardar Cobro'
      cancelText='Cerrar'
      confirmLoading={mutation.isPending}
      width={1000}
      destroyOnClose
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
              <span className='font-semibold text-sm text-gray-700'>{venta?.cliente?.numero_documento}</span>
            </div>
          </div>
          <div className='space-y-1 border-r border-gray-300 pr-4'>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-500 font-medium min-w-[80px]'>Documento:</span>
              <span className='font-bold text-sm text-gray-800'>{tipoDoc} {nroDocumento}</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-500 font-medium min-w-[80px]'>Tipo Pago:</span>
              <span className='font-semibold text-sm text-red-600 bg-red-50 px-2 py-0.5 rounded'>CRÉDITO{venta?.numero_dias ? ` ${venta.numero_dias} DÍAS` : ''}</span>
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
              <DatePicker className='w-full' format='DD/MM/YYYY' />
            </Form.Item>
          </LabelBase>

          <LabelBase label='N° Operación:' orientation='column'>
            <Form.Item name='numero_operacion' noStyle>
              <Input placeholder='Nº operación' />
            </Form.Item>
          </LabelBase>
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
        />
      </div>

      {/* Resumen */}
      <div className='flex justify-between mt-4 bg-gray-50 rounded-lg p-3 text-sm font-bold border border-gray-200'>
        <span>Facturado: <span className='text-blue-700'>S/. {totalVenta.toFixed(2)}</span></span>
        <span>Cancelado: <span className='text-green-700'>S/. {totalPagado.toFixed(2)}</span></span>
        <span>Saldo Pendiente: <span className='text-red-600 text-lg'>S/. {saldoPendiente.toFixed(2)}</span></span>
      </div>
    </Modal>
  )
}
