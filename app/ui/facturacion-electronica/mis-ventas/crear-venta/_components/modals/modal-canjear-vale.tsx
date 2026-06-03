'use client'

import { useEffect, useState } from 'react'
import { Modal, Input, App, Tag, Divider, Form, FormInstance } from 'antd'
import { FaTicketAlt, FaCheckCircle, FaTimesCircle, FaGift, FaDollarSign, FaPercentage, FaTrophy, FaExclamationTriangle } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import { verificarCodigoVale, type ValeCompraVerificado } from '~/lib/api/vales-compra'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'

interface ModalCanjearValeProps {
  form?: FormInstance | null
  open: boolean
  setOpen: (open: boolean) => void
  codigoActual?: string
  onAplicar: (codigo: string, info: ValeCompraVerificado) => void
  onQuitar: (codigo: string) => void
}

export default function ModalCanjearVale({
  form,
  open,
  setOpen,
  codigoActual,
  onAplicar,
  onQuitar,
}: ModalCanjearValeProps) {
  const { notification } = App.useApp()
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<ValeCompraVerificado | null>(null)
  const [error, setError] = useState<string | null>(null)

  const productosVenta = useStoreProductoAgregadoVenta((s) => s.productos)
  const clienteId = Form.useWatch('cliente_id', form ?? undefined)

  useEffect(() => {
    if (open) {
      setCodigo(codigoActual ?? '')
      setResultado(null)
      setError(null)
    }
  }, [open, codigoActual])

  // Computar contexto de la venta para validar condiciones del vale
  const getSaleContext = () => {
    const productoIds = productosVenta
      .map((p) => p.producto_id)
      .filter((id): id is number => !!id)
    const precioTotal = productosVenta.reduce(
      (sum, p) => sum + Number(p.precio_venta ?? 0) * Number(p.cantidad ?? 0), 0
    )
    const cantidadTotal = productosVenta.reduce(
      (sum, p) => sum + Number(p.cantidad ?? 0), 0
    )
    // Detalle por línea para que el umbral se mida solo sobre los productos/categoría
    // del vale (no toda la venta).
    const detalles = productosVenta
      .filter((p) => p.producto_id)
      .map((p) => ({
        producto_id: Number(p.producto_id),
        categoria_id: (p as any)?.categoria_id != null ? Number((p as any).categoria_id) : null,
        cantidad: Number(p.cantidad ?? 0),
        precio_total: Number(p.cantidad ?? 0) * Number(p.precio_venta ?? 0),
      }))
    return {
      precio_total: precioTotal,
      cantidad_total: cantidadTotal,
      producto_ids: productoIds.length > 0 ? productoIds : undefined,
      cliente_id: clienteId || undefined,
      detalles: detalles.length > 0 ? detalles : undefined,
    }
  }

  const handleVerificar = async () => {
    const codigoLimpio = codigo.trim()
    if (!codigoLimpio) {
      setError('Ingresa un código de vale')
      return
    }

    setLoading(true)
    setError(null)
    setResultado(null)

    try {
      const res = await verificarCodigoVale(codigoLimpio, getSaleContext())
      if (res.data?.valido && res.data.data) {
        setResultado(res.data.data)
      } else {
        setError(res.data?.message ?? 'Código no válido')
      }
    } catch {
      setError('Error al verificar el código. Inténtalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleAplicar = () => {
    if (!resultado) return
    onAplicar(codigo.trim(), resultado)
    notification.success({
      message: resultado.es_sorteo ? 'Código de sorteo registrado' : 'Vale aplicado',
      description: `${resultado.vale_compra.nombre} se canjeará al crear la venta.`,
      placement: 'bottomRight',
    })
    setOpen(false)
  }

  const handleQuitar = () => {
    onQuitar(codigo.trim())
    notification.info({
      message: 'Código removido',
      description: 'El código de vale fue retirado de la venta.',
      placement: 'bottomRight',
    })
    setOpen(false)
  }

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={
        <div className='flex items-center gap-2'>
          <FaTicketAlt className='text-orange-600' />
          <span>Canjear código de vale</span>
        </div>
      }
      footer={null}
      destroyOnHidden
      width={520}
    >
      <div className='space-y-4 pt-2'>
        <div className='text-sm text-gray-600'>
          Ingresa el código de un vale (ej: VC-0005) o código generado (ej: VCC-...).
          Se validará si la venta actual cumple las condiciones del vale.
        </div>

        <div className='flex gap-2'>
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            onPressEnter={handleVerificar}
            placeholder='Ej: VCC-ABCD1234'
            size='large'
            prefix={<FaTicketAlt className='text-gray-400' />}
            autoFocus
            disabled={loading}
          />
          <ButtonBase
            onClick={handleVerificar}
            loading={loading}
            color='warning'
            size='sm'
          >
            Verificar
          </ButtonBase>
        </div>

        {error && (
          <div className='flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3'>
            <FaTimesCircle className='text-red-500 mt-0.5 flex-shrink-0' />
            <span className='text-sm text-red-700'>{error}</span>
          </div>
        )}

        {resultado && <ResultadoVale resultado={resultado} />}

        <Divider className='!my-2' />

        <div className='flex items-center justify-between gap-2'>
          {codigoActual ? (
            <ButtonBase onClick={handleQuitar} color='danger' size='sm'>
              Quitar código actual
            </ButtonBase>
          ) : (
            <span />
          )}
          <div className='flex gap-2'>
            <ButtonBase onClick={() => setOpen(false)} color='default' size='sm'>
              Cancelar
            </ButtonBase>
            <ButtonBase
              onClick={handleAplicar}
              disabled={!resultado || (resultado.condiciones && !resultado.condiciones.cumple)}
              color='success'
              size='sm'
            >
              Aplicar a la venta
            </ButtonBase>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function ResultadoVale({ resultado }: { resultado: ValeCompraVerificado }) {
  const vale = resultado.vale_compra
  const esSorteo = resultado.es_sorteo || vale.tipo_promocion === 'SORTEO'
  const condiciones = resultado.condiciones
  const condicionesNoCumplidas = condiciones && !condiciones.cumple
  const esUmbralUnidades = vale.tipo_promocion === 'PRODUCTO_GRATIS' || vale.tipo_promocion === 'DOS_POR_UNO'
    || ((vale as any).tipo_umbral ? (vale as any).tipo_umbral === 'CANTIDAD' : vale.modalidad === 'POR_PRODUCTOS' || vale.modalidad === 'MIXTO')

  let beneficio: React.ReactNode = null
  if (esSorteo) {
    if (vale.producto_gratis) {
      beneficio = (
        <span className='flex items-center gap-1'>
          <FaTrophy className='text-amber-500' />
          Premio: {vale.cantidad_producto_gratis ?? 1} × {vale.producto_gratis.nombre}
        </span>
      )
    } else {
      beneficio = (
        <span className='flex items-center gap-1'>
          <FaTrophy className='text-amber-500' />
          Participación en sorteo
        </span>
      )
    }
  } else if (vale.descuento_tipo === 'PORCENTAJE' && vale.descuento_valor) {
    beneficio = (
      <span className='flex items-center gap-1'>
        <FaPercentage className='text-green-600' />
        {Number(vale.descuento_valor)}% de descuento
      </span>
    )
  } else if (vale.descuento_tipo === 'MONTO_FIJO' && vale.descuento_valor) {
    beneficio = (
      <span className='flex items-center gap-1'>
        <FaDollarSign className='text-green-600' />
        S/ {Number(vale.descuento_valor).toFixed(2)} de descuento
      </span>
    )
  } else if (vale.tipo_promocion === 'PRODUCTO_GRATIS') {
    beneficio = (
      <span className='flex items-center gap-1'>
        <FaGift className='text-pink-600' />
        Producto gratis
      </span>
    )
  }

  const bgColor = condicionesNoCumplidas ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
  const iconColor = condicionesNoCumplidas ? 'text-amber-600' : 'text-green-700'
  const titulo = condicionesNoCumplidas ? 'La venta no cumple las condiciones del vale' : 'Vale válido'

  return (
    <div className={`${bgColor} border rounded-lg p-4 space-y-2`}>
      <div className={`flex items-center gap-2 ${iconColor} font-semibold`}>
        {condicionesNoCumplidas ? <FaExclamationTriangle /> : <FaCheckCircle />}
        {titulo}
      </div>
      <div className='text-base font-medium text-gray-800'>{vale.nombre}</div>
      <div className='flex flex-wrap gap-2 items-center'>
        <Tag color={esSorteo ? 'blue' : 'green'}>{vale.tipo_promocion}</Tag>
        {vale.momento_aplicacion && <Tag color='purple'>{vale.momento_aplicacion === 'PROXIMA_COMPRA' ? 'Próxima compra' : 'Misma compra'}</Tag>}
        {vale.fecha_fin && <Tag color='orange'>Vence: {vale.fecha_fin}</Tag>}
      </div>
      {beneficio && <div className='text-sm text-gray-700 pt-1'>{beneficio}</div>}
      {esSorteo && (
        <div className='text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 mt-2'>
          Este código solo registra el canje del sorteo. No aplica descuento a la venta actual.
        </div>
      )}
      {condiciones && (
        <div className='text-xs space-y-1 pt-1'>
          {!condiciones.umbral && <div className='text-red-600'>✗ No alcanza la compra mínima de {esUmbralUnidades ? `${Number(vale.cantidad_minima)} und.` : `S/ ${Number(vale.cantidad_minima).toFixed(2)}`}</div>}
          {!condiciones.vigente && <div className='text-red-600'>✗ El vale no está vigente</div>}
          {!condiciones.stock && <div className='text-red-600'>✗ El vale no tiene stock disponible</div>}
          {!condiciones.cliente && <div className='text-red-600'>✗ El cliente ya usó este vale</div>}
          {condiciones.modalidad === false && <div className='text-red-600'>✗ Los productos de la venta no cumplen la modalidad del vale</div>}
        </div>
      )}
    </div>
  )
}
