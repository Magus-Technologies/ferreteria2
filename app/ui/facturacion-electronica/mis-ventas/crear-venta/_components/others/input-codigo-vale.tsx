'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Tag, Tooltip, Input, App, Spin } from 'antd'
import { FaTicketAlt, FaGift } from 'react-icons/fa'
import { getValesAplicables, verificarCodigoVale } from '~/lib/api/vales-compra'
import type { ValeCompra } from '~/lib/api/vales-compra'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'

interface InputCodigoValeProps {
  value?: string
  onChange?: (value: string | undefined) => void
}

/**
 * Componente que detecta automáticamente vales aplicables según los productos en el carrito.
 * Muestra notificación flotante cuando se detectan vales.
 * También permite ingresar códigos de vale generado (DESCUENTO_PROXIMA_COMPRA).
 */
export default function InputCodigoVale({ value, onChange }: InputCodigoValeProps) {
  const { notification } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [codigoValeInput, setCodigoValeInput] = useState('')
  const [codigoValeValido, setCodigoValeValido] = useState(false)
  const [verificandoCodigo, setVerificandoCodigo] = useState(false)

  // Ref para rastrear los IDs de vales ya notificados (evitar notificaciones repetidas)
  const valesNotificados = useRef<Set<number>>(new Set())

  // Leer productos del store
  const productosVenta = useStoreProductoAgregadoVenta(store => store.productos)

  // Extraer IDs de productos del carrito
  const productoIds = useMemo(() => {
    return productosVenta
      .map(p => p.producto_id)
      .filter((id): id is number => !!id)
  }, [productosVenta])

  // Calcular cantidad total
  const cantidadTotal = useMemo(() => {
    return productosVenta.reduce((sum, p) => {
      const cantidad = Number(p.cantidad ?? 0)
      const factor = Number(p.unidad_derivada_factor ?? 1)
      return sum + (cantidad * factor)
    }, 0)
  }, [productosVenta])

  // Descripción del beneficio del vale
  const getBeneficio = useCallback((vale: ValeCompra) => {
    if (vale.descuento_tipo === 'PORCENTAJE' && vale.descuento_valor) {
      return `${vale.descuento_valor}% DSCTO`
    }
    if (vale.descuento_tipo === 'MONTO_FIJO' && vale.descuento_valor) {
      return `S/ ${Number(vale.descuento_valor).toFixed(2)} DSCTO`
    }
    if (vale.tipo_promocion === 'PRODUCTO_GRATIS') return 'PRODUCTO GRATIS'
    if (vale.tipo_promocion === 'DOS_POR_UNO') return '2x1'
    return vale.tipo_promocion
  }, [])

  // Consultar vales aplicables cuando cambian los productos
  const consultarVales = useCallback(async () => {
    if (productoIds.length === 0 || cantidadTotal <= 0) {
      return
    }

    setLoading(true)
    try {
      const res = await getValesAplicables({
        cantidad_total: cantidadTotal,
        producto_ids: productoIds,
      })
      if (res.data?.data) {
        // Deduplicar por ID
        const valesUnicos = res.data.data.filter(
          (vale, idx, arr) => arr.findIndex(v => v.id === vale.id) === idx
        )

        // Notificar solo vales nuevos que no se hayan notificado antes
        for (const vale of valesUnicos) {
          if (!valesNotificados.current.has(vale.id)) {
            valesNotificados.current.add(vale.id)
            notification.success({
              message: 'Promoción disponible',
              description: `${vale.nombre} (${getBeneficio(vale)}) — Se aplicará automáticamente al crear la venta`,
              duration: 6,
              placement: 'bottomRight',
            })
          }
        }
      }
    } catch {
      // Silencioso - no interrumpir la venta
    } finally {
      setLoading(false)
    }
  }, [productoIds, cantidadTotal, getBeneficio, notification])

  // Debounce: consultar vales 500ms después del último cambio
  useEffect(() => {
    const timer = setTimeout(consultarVales, 500)
    return () => clearTimeout(timer)
  }, [consultarVales])

  // Limpiar notificados cuando se vacía el carrito
  useEffect(() => {
    if (productosVenta.length === 0) {
      valesNotificados.current.clear()
    }
  }, [productosVenta.length])

  // Verificar código de vale generado (DESCUENTO_PROXIMA_COMPRA)
  const verificarCodigo = async (raw: string) => {
    const codigo = raw.replace(/\s/g, '').trim()
    if (!codigo) return

    setVerificandoCodigo(true)
    try {
      const res = await verificarCodigoVale(codigo)
      if (res.data?.valido) {
        setCodigoValeValido(true)
        onChange?.(codigo)
        notification.success({
          message: 'Vale de próxima compra válido',
          description: `Código ${codigo} será aplicado al crear la venta.`,
          duration: 4,
        })
      } else {
        setCodigoValeValido(false)
        onChange?.(undefined)
        notification.error({
          message: 'Código no válido',
          description: res.data?.message || 'El código no existe, ya fue usado o ha expirado.',
          duration: 5,
        })
      }
    } catch {
      setCodigoValeValido(false)
      onChange?.(undefined)
    } finally {
      setVerificandoCodigo(false)
    }
  }

  const limpiarCodigo = () => {
    setCodigoValeInput('')
    setCodigoValeValido(false)
    onChange?.(undefined)
  }

  return (
    <div className='flex items-center gap-2'>
      {codigoValeValido && value ? (
        <div className='flex items-center gap-1.5'>
          <FaGift className='text-purple-600' size={12} />
          <Tag color='purple' className='!text-[10px] !m-0'>
            Vale: {value}
          </Tag>
          <span
            className='text-red-400 cursor-pointer text-[10px] hover:text-red-600'
            onClick={limpiarCodigo}
          >
            Quitar
          </span>
        </div>
      ) : (
        <Tooltip title='Ingresa código si el cliente tiene un vale de próxima compra'>
          <Input
            placeholder='Código vale próxima compra...'
            prefix={<FaTicketAlt className='text-purple-500' size={10} />}
            value={codigoValeInput}
            onChange={(e) => setCodigoValeInput(e.target.value.toUpperCase())}
            onPressEnter={() => verificarCodigo(codigoValeInput)}
            disabled={verificandoCodigo}
            allowClear
            className='!max-w-[220px]'
            size='small'
            style={{ fontSize: '11px' }}
          />
        </Tooltip>
      )}
      {(verificandoCodigo || loading) && <Spin size='small' />}
    </div>
  )
}
