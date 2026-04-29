'use client'

import { useState, useEffect, useMemo } from 'react'
import { Modal, Radio, Button, Input, InputNumber } from 'antd'
import {
  FaBoxOpen,
  FaUser,
  FaWarehouse,
} from 'react-icons/fa'
import {
  entregaProductoApi,
  EstadoEntrega,
  QuienEntrega,
  TipoDespacho,
  TipoEntrega,
  type CreateEntregaProductoRequest,
} from '~/lib/api/entrega-producto'
import useApp from 'antd/es/app/useApp'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import dayjs from 'dayjs'

interface ModalEntregarParcialProps {
  open: boolean
  onClose: () => void
  entrega?: any
  onSuccess?: () => void
}

interface FilaProducto {
  detalle_id: number
  unidad_derivada_venta_id: number
  nombre: string
  codigo: string
  unidad: string
  cantidad_max: number
  entregar_ahora: number
}

export default function ModalEntregarParcial({
  open,
  onClose,
  entrega,
  onSuccess,
}: ModalEntregarParcialProps) {
  const { message } = useApp()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [quienEntrega, setQuienEntrega] = useState<QuienEntrega>(
    QuienEntrega.ALMACEN,
  )
  const [observaciones, setObservaciones] = useState('')
  const [filas, setFilas] = useState<FilaProducto[]>([])

  useEffect(() => {
    if (open && entrega) {
      const productos = entrega.productos_entregados || []
      const nuevasFilas: FilaProducto[] = productos.map((p: any) => {
        const udv = p.unidad_derivada_venta
        const prod = udv?.producto_almacen_venta?.producto_almacen?.producto
        const cantidad = Number(p.cantidad_entregada || 0)
        return {
          detalle_id: p.id,
          unidad_derivada_venta_id: udv?.id,
          nombre: prod?.name || 'Producto',
          codigo: prod?.cod_producto || '',
          unidad: udv?.unidad_derivada_inmutable?.name || '',
          cantidad_max: cantidad,
          entregar_ahora: cantidad,
        }
      })
      setFilas(nuevasFilas)

      // Quien "despacha" siempre es Almacén o Vendedor — el chofer es quien
      // luego entrega al cliente, pero en este modal estamos registrando quién
      // hace la salida del almacén.
      setQuienEntrega(QuienEntrega.ALMACEN)
      setObservaciones('')
    }
  }, [open, entrega])

  const totalAEntregar = useMemo(
    () => filas.reduce((s, f) => s + (f.entregar_ahora || 0), 0),
    [filas],
  )
  const totalMax = useMemo(
    () => filas.reduce((s, f) => s + f.cantidad_max, 0),
    [filas],
  )
  const hayResto = filas.some((f) => f.entregar_ahora < f.cantidad_max)
  const algunaCantidad = filas.some((f) => f.entregar_ahora > 0)

  if (!entrega) return null

  const ventaNumero =
    entrega.venta?.serie && entrega.venta?.numero
      ? `${entrega.venta.serie}-${entrega.venta.numero}`
      : 'S/N'
  const tipoEntrega = entrega.tipo_entrega

  // El chofer NO aparece como opción aquí: en este modal se registra quién
  // hace la salida del almacén (el chofer luego entrega al cliente, pero esa
  // confirmación es otro flujo).
  const opciones = [
    { value: QuienEntrega.ALMACEN, label: 'Almacén', icon: <FaWarehouse /> },
    { value: QuienEntrega.VENDEDOR, label: 'Vendedor', icon: <FaUser /> },
  ]

  const actualizarFila = (idx: number, value: number | null) => {
    setFilas((prev) => {
      const next = [...prev]
      const max = next[idx].cantidad_max
      const v = value == null ? 0 : Math.max(0, Math.min(max, Number(value)))
      next[idx] = { ...next[idx], entregar_ahora: v }
      return next
    })
  }

  const handleConfirmar = async () => {
    if (!algunaCantidad) {
      message.warning('Debes ingresar al menos una cantidad a entregar')
      return
    }

    setLoading(true)
    try {
      // Caso 1: entrega TODO lo de esta entrega → solo update estado
      if (!hayResto) {
        const response = await entregaProductoApi.update(entrega.id, {
          estado_entrega: EstadoEntrega.ENTREGADO,
          quien_entrega: quienEntrega,
          ...(observaciones ? { observaciones } : {}),
        })
        if (response.error) {
          message.error(response.error.message || 'Error al marcar entregada')
          return
        }
        message.success('Entrega completada')
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.ENTREGAS_PRODUCTOS],
        })
        onSuccess?.()
        onClose()
        return
      }

      // Caso 2: entrega solo parte → split
      // Paso 1: anular la entrega original (devuelve cantidad_pendiente y stock)
      const anularResp = await entregaProductoApi.anular(entrega.id)
      if (anularResp.error) {
        message.error(
          anularResp.error.message || 'Error al anular entrega original',
        )
        return
      }

      // Paso 2: crear entrega ENTREGADA con cantidades elegidas
      const productosEntregadosAhora = filas
        .filter((f) => f.entregar_ahora > 0)
        .map((f) => ({
          unidad_derivada_venta_id: f.unidad_derivada_venta_id,
          cantidad_entregada: f.entregar_ahora,
          ubicacion: undefined,
        }))

      const baseFecha = dayjs().format('YYYY-MM-DD')
      const entregaEntregada: CreateEntregaProductoRequest = {
        venta_id: entrega.venta_id,
        tipo_entrega: tipoEntrega as TipoEntrega,
        tipo_despacho: TipoDespacho.INMEDIATO,
        estado_entrega: EstadoEntrega.ENTREGADO,
        fecha_entrega: baseFecha,
        almacen_salida_id: entrega.almacen_salida_id,
        quien_entrega: quienEntrega,
        user_id: entrega.user_id,
        chofer_id: entrega.chofer_id || undefined,
        vehiculo_id: entrega.vehiculo_id || undefined,
        direccion_entrega: entrega.direccion_entrega || undefined,
        referencia_entrega: entrega.referencia_entrega || undefined,
        latitud: entrega.latitud ? Number(entrega.latitud) : undefined,
        longitud: entrega.longitud ? Number(entrega.longitud) : undefined,
        observaciones: observaciones || undefined,
        productos_entregados: productosEntregadosAhora,
      }

      const respEntregada = await entregaProductoApi.create(entregaEntregada)
      if (respEntregada.error) {
        message.error(
          respEntregada.error.message ||
            'Error al crear entrega — la original fue anulada',
        )
        return
      }

      // Paso 3: crear entrega PENDIENTE con el resto
      const productosPendientes = filas
        .filter((f) => f.cantidad_max - f.entregar_ahora > 0)
        .map((f) => ({
          unidad_derivada_venta_id: f.unidad_derivada_venta_id,
          cantidad_entregada: f.cantidad_max - f.entregar_ahora,
          ubicacion: undefined,
        }))

      if (productosPendientes.length > 0) {
        const entregaPendiente: CreateEntregaProductoRequest = {
          venta_id: entrega.venta_id,
          tipo_entrega: tipoEntrega as TipoEntrega,
          tipo_despacho: entrega.tipo_despacho || TipoDespacho.PROGRAMADO,
          estado_entrega: EstadoEntrega.PENDIENTE,
          fecha_entrega: baseFecha,
          fecha_programada: entrega.fecha_programada
            ? dayjs(entrega.fecha_programada).format('YYYY-MM-DD')
            : undefined,
          hora_inicio: entrega.hora_inicio || undefined,
          hora_fin: entrega.hora_fin || undefined,
          almacen_salida_id: entrega.almacen_salida_id,
          quien_entrega: entrega.quien_entrega || QuienEntrega.ALMACEN,
          user_id: entrega.user_id,
          chofer_id: entrega.chofer_id || undefined,
          vehiculo_id: entrega.vehiculo_id || undefined,
          direccion_entrega: entrega.direccion_entrega || undefined,
          referencia_entrega: entrega.referencia_entrega || undefined,
          latitud: entrega.latitud ? Number(entrega.latitud) : undefined,
          longitud: entrega.longitud ? Number(entrega.longitud) : undefined,
          observaciones: entrega.observaciones || undefined,
          productos_entregados: productosPendientes,
        }

        const respPendiente = await entregaProductoApi.create(entregaPendiente)
        if (respPendiente.error) {
          message.warning(
            'Entrega parcial registrada pero no se pudo crear la pendiente del resto',
          )
        }
      }

      message.success(
        `Entrega parcial registrada (${totalAEntregar} de ${totalMax} unidades)`,
      )
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al entregar parcial:', error)
      message.error('Error inesperado al entregar parcial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <FaBoxOpen className="text-orange-600 text-lg" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-800 leading-tight">
              Entregar Parcial
            </div>
            <span className="text-orange-600 text-xs font-mono">
              Venta {ventaNumero}
            </span>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={780}
      centered
      destroyOnHidden
      footer={
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            Total: <span className="font-bold text-slate-700">{totalAEntregar}</span>{' '}
            de {totalMax}
            {hayResto && (
              <span className="ml-2 text-orange-600 font-semibold">
                · Quedará pendiente {totalMax - totalAEntregar}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              className="!rounded-lg !h-10 !px-5 !font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="primary"
              icon={<FaBoxOpen />}
              onClick={handleConfirmar}
              loading={loading}
              disabled={!algunaCantidad}
              className="!rounded-lg !h-10 !px-6 !font-bold !bg-orange-600 hover:!bg-orange-700 !border-none"
            >
              {hayResto ? 'Entregar y dejar pendiente' : 'Marcar Entregada'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          Indica cuánto entregar ahora. Si entregas menos del total, el resto
          quedará en una nueva entrega pendiente.
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 grid grid-cols-12 gap-2 text-xs font-bold uppercase text-slate-600 tracking-wide">
            <div className="col-span-7">Producto</div>
            <div className="col-span-2 text-right">Disponible</div>
            <div className="col-span-3 text-right">Entregar</div>
          </div>
          <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
            {filas.map((f, idx) => (
              <div
                key={f.detalle_id}
                className="px-4 py-2.5 grid grid-cols-12 gap-2 items-center"
              >
                <div className="col-span-7 min-w-0">
                  <div className="text-sm text-slate-800 truncate">
                    {f.nombre}
                  </div>
                  {f.codigo && (
                    <div className="text-xs text-slate-500">{f.codigo}</div>
                  )}
                </div>
                <div className="col-span-2 text-right text-sm text-slate-600">
                  {f.cantidad_max} {f.unidad}
                </div>
                <div className="col-span-3">
                  <InputNumber
                    size="small"
                    min={0}
                    max={f.cantidad_max}
                    precision={2}
                    value={f.entregar_ahora}
                    onChange={(v) => actualizarFila(idx, v as number | null)}
                    className="!w-full"
                    addonAfter={f.unidad}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 tracking-wide mb-2">
            ¿Quién entrega ahora?
          </label>
          <Radio.Group
            value={quienEntrega}
            onChange={(e) => setQuienEntrega(e.target.value)}
            className="!w-full"
          >
            <div className="grid grid-cols-2 gap-2">
              {opciones.map((opt) => (
                <Radio
                  key={opt.value}
                  value={opt.value}
                  className={`!w-full !p-2 !rounded-lg !border ${
                    quienEntrega === opt.value
                      ? '!border-orange-500 !bg-orange-50'
                      : '!border-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-slate-500">{opt.icon}</span>
                    {opt.label}
                  </span>
                </Radio>
              ))}
            </div>
          </Radio.Group>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 tracking-wide mb-2">
            Observaciones (opcional)
          </label>
          <Input.TextArea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Agregar nota..."
            maxLength={500}
            showCount
          />
        </div>
      </div>
    </Modal>
  )
}
