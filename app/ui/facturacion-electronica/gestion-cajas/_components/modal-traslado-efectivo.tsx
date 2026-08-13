'use client'

import { useEffect, useState } from 'react'
import { Modal, Form, InputNumber, Select, Input, Button, message } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '~/lib/api'
import { transaccionesCajaApi } from '~/lib/api/transacciones-caja'
import { useCrearMovimientoInterno } from '~/app/ui/facturacion-electronica/gestion-cajas/_hooks/use-crear-movimiento-interno'
import { subscribeModelChanged } from '~/lib/realtime-bus'

// Módulos cuyos movimientos afectan el efectivo disponible/cerrado mostrado en
// este modal (origen, destino y saldos) — mismo criterio que el resto de
// modales de caja (ver modal-solicitar-efectivo.tsx).
const MODULOS_EFECTIVO = ['ventas', 'gastos', 'ingresos', 'prestamos', 'prestamos-vendedores', 'traslados-boveda', 'cajas']

interface MetodoParaVenta {
  value: string
  label: string
  sub_caja_id: number
  despliegue_pago_id: string
  sub_caja_nombre: string
  banco: string
  metodo: string
  tipo: string
}

interface Props {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
}

export default function ModalTrasladoEfectivo({ open, setOpen, onSuccess }: Props) {
  const [form] = Form.useForm()
  const { mutate: crearMovimiento, isPending } = useCrearMovimientoInterno()
  const [origenValue, setOrigenValue] = useState<string | null>(null)

  // TODOS los métodos, no solo efectivo: el traslado también mueve bancos y
  // billeteras. La restricción real es que origen y destino sean del mismo
  // método, y eso se aplica más abajo sobre los destinos.
  const { data: metodosOrigen = [], refetch: refetchMetodos } = useQuery({
    queryKey: ['metodos-para-ventas-traslado'],
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: MetodoParaVenta[] }>(
        '/cajas/sub-cajas/metodos-para-ventas'
      )
      return res.data?.data || []
    },
    enabled: open,
  })

  const { data: saldos = [], refetch: refetchSaldos } = useQuery({
    queryKey: ['saldos-disponibles-movimiento'],
    queryFn: async () => {
      const response = await transaccionesCajaApi.getSaldosDisponiblesMovimiento()
      return response.data?.data || []
    },
    enabled: open,
  })

  // DESTINOS: el efectivo de TODOS los usuarios de las aperturas abiertas
  // (cada usuario × sub-caja × despliegue de efectivo, con su saldo desde que
  // se aperturó). El traslado ACREDITA el dinero al usuario elegido.
  const { data: destinosUsuarios = [], refetch: refetchDestinos } = useQuery({
    queryKey: ['efectivo-todos-usuarios'],
    queryFn: async () => {
      const response = await transaccionesCajaApi.getEfectivoTodosUsuarios()
      return response.data?.data || []
    },
    enabled: open,
  })

  // Tiempo real: el canal WebSocket ya está conectado globalmente
  // (RealtimeProvider) — acá solo nos suscribimos al bus interno para refrescar
  // los saldos/orígenes/destinos apenas ocurra un movimiento relevante, sin
  // depender de que el usuario cierre y reabra el modal.
  useEffect(() => {
    if (!open) return
    const unsub = subscribeModelChanged((ev) => {
      if (MODULOS_EFECTIVO.includes(ev.module)) {
        refetchMetodos()
        refetchSaldos()
        refetchDestinos()
      }
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Disponible del ORIGEN: solo el dinero CERRADO (saldo_disponible). Lo de la
  // sesión abierta —incluida la apertura— no se puede mover hasta cerrar caja.
  //
  // Se lee del despliegue puntual, no del total de la sub-caja: una misma caja
  // mezcla efectivo, bancos y billeteras, y el total haría creer que en "bcp"
  // hay disponible el efectivo que está al lado.
  const saldoDeDespliegue = (subCajaId: number, desplieguePagoId: string) =>
    saldos.find((s) => s.sub_caja_id === subCajaId)?.despliegues?.find((d) => d.despliegue_pago_id === desplieguePagoId)

  const origen = metodosOrigen.find((m) => m.value === origenValue)
  const saldoRowOrigen = origen ? saldoDeDespliegue(origen.sub_caja_id, origen.despliegue_pago_id) : undefined
  const saldoOrigen = saldoRowOrigen?.saldo_disponible ?? 0
  const saldoTotalOrigen = saldoRowOrigen?.saldo_actual ?? 0

  // Valor compuesto por fila: usuario|sub-caja|despliegue (el backend exige
  // que la sub-caja destino sea distinta a la de origen)
  const destinoKey = (d: { vendedor_id: string; sub_caja_id: number; despliegue_pago_id: string }) =>
    `${d.vendedor_id}|${d.sub_caja_id}|${d.despliegue_pago_id}`

  // El destino debe ser el MISMO despliegue de pago que el origen, cambiando solo
  // de usuario: el traslado le acredita a alguien dinero ya cerrado, no lo convierte
  // de un método a otro.
  //
  // Se compara por `despliegue_pago_id`, no por nombre: cada sub-caja tiene su
  // propio despliegue aunque se llamen igual, y "transferencia" existe en bcp,
  // interbank, scotiabank y bbva. Emparejar por nombre dejaría mandar dinero de
  // un banco a otro como si fuera el mismo.
  const destinosDisponibles = origen
    ? destinosUsuarios.filter((d) => d.despliegue_pago_id === origen.despliegue_pago_id)
    : destinosUsuarios

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const destino = destinosUsuarios.find((d) => destinoKey(d) === values.destino)
      if (!origen || !destino) return

      crearMovimiento(
        {
          sub_caja_origen_id: origen.sub_caja_id,
          sub_caja_destino_id: destino.sub_caja_id,
          despliegue_de_pago_origen_id: origen.despliegue_pago_id,
          despliegue_de_pago_destino_id: destino.despliegue_pago_id,
          destino_user_id: destino.vendedor_id,
          monto: values.monto,
          concepto: 'TRASLADO DE DINERO',
          justificacion: values.justificacion,
        },
        {
          onSuccess: () => {
            message.success('Dinero trasladado correctamente')
            form.resetFields()
            setOrigenValue(null)
            onSuccess?.()
            setOpen(false)
          },
          onError: (error: any) => {
            message.error(error.message || 'Error al trasladar el dinero')
          },
        }
      )
    } catch {
      // errores de validación del form
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setOrigenValue(null)
    setOpen(false)
  }

  return (
    <Modal
      title="Traslado de Dinero"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isPending}
      okText="Trasladar"
      cancelText="Cancelar"
      width={600}
    >
      <p className="text-xs text-slate-500 mb-4">
        Mueve el dinero <strong>cerrado</strong> (acumulado de sesiones cerradas) —efectivo,
        banco o billetera— hacia el mismo método de pago de un usuario. Lo de la sesión
        abierta no se puede mover hasta cerrar caja.
      </p>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Origen (método de pago)"
          name="origen"
          rules={[{ required: true, message: 'Seleccione el origen' }]}
        >
          <Select
            placeholder="Seleccione origen"
            showSearch
            optionFilterProp="label"
            onChange={(value) => {
              setOrigenValue(value)
              form.setFieldValue('destino', undefined)
            }}
            options={metodosOrigen.map((m) => ({
              value: m.value,
              // Muestra el disponible CERRADO (lo realmente movible) de ese método
              label: `${m.label} — S/ ${Number(saldoDeDespliegue(m.sub_caja_id, m.despliegue_pago_id)?.saldo_disponible ?? 0).toFixed(2)}`,
            }))}
          />
        </Form.Item>

        {origen && (
          <div className="mb-4 p-3 bg-emerald-50 rounded border border-emerald-200">
            <p className="text-sm text-gray-600 m-0">
              Disponible para trasladar (caja cerrada) en{' '}
              <strong>{origen.sub_caja_nombre}/{origen.metodo}</strong>:{' '}
              <span className="font-semibold text-emerald-700">S/ {Number(saldoOrigen).toFixed(2)}</span>
              <span className="text-xs text-gray-400 ml-2">
                (saldo total: S/ {Number(saldoTotalOrigen).toFixed(2)} — lo de la sesión abierta no se mueve)
              </span>
            </p>
          </div>
        )}

        <Form.Item
          label="Destino (mismo método)"
          name="destino"
          rules={[{ required: true, message: 'Seleccione el destino' }]}
        >
          <Select
            placeholder="Seleccione destino (a qué usuario/método va el dinero)"
            disabled={!origen}
            showSearch
            optionFilterProp="label"
            options={destinosDisponibles.map((d) => ({
              value: destinoKey(d),
              label: `${d.vendedor_nombre} — ${d.sub_caja_nombre}/${d.metodo_nombre} — S/ ${d.efectivo_disponible}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Monto a Trasladar"
          required
        >
          <div className="flex gap-2">
            <Form.Item
              name="monto"
              noStyle
              rules={[
                { required: true, message: 'Ingrese el monto' },
                {
                  validator: (_, value) => {
                    if (!origen) return Promise.resolve()
                    if (value > Number(saldoOrigen)) {
                      return Promise.reject(`El monto excede el disponible de caja cerrada (S/ ${Number(saldoOrigen).toFixed(2)})`)
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <InputNumber
                className="flex-1 !w-full"
                placeholder="0.00"
                min={0.01}
                step={0.01}
                precision={2}
                prefix="S/"
              />
            </Form.Item>
            <Button
              disabled={!origen || Number(saldoOrigen) <= 0}
              onClick={() => form.setFieldValue('monto', Number(saldoOrigen))}
            >
              Usar total
            </Button>
          </div>
        </Form.Item>

        <Form.Item
          label="Justificación"
          name="justificacion"
          rules={[{ required: true, message: 'Ingrese una justificación' }]}
        >
          <Input.TextArea
            placeholder="Ej: Trasladar dinero a efectivo negro para pagar compra"
            rows={2}
            maxLength={1000}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
