'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Tag, Tooltip, Input, App, Spin } from 'antd'
import { FaTicketAlt, FaCheckCircle, FaGift } from 'react-icons/fa'
import { getValesAplicables, verificarCodigoVale } from '~/lib/api/vales-compra'
import type { ValeCompra } from '~/lib/api/vales-compra'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'

interface InputCodigoValeProps {
  value?: string
  onChange?: (value: string | undefined) => void
}

/**
 * Componente que detecta automáticamente vales aplicables según los productos en el carrito.
 * También permite ingresar códigos de vale generado (DESCUENTO_PROXIMA_COMPRA).
 */
export default function InputCodigoVale({ value, onChange }: InputCodigoValeProps) {
  const { notification } = App.useApp()
  const [valesAplicables, setValesAplicables] = useState<ValeCompra[]>([])
  const [loading, setLoading] = useState(false)
  const [codigoValeInput, setCodigoValeInput] = useState('')
  const [codigoValeValido, setCodigoValeValido] = useState(false)
  const [verificandoCodigo, setVerificandoCodigo] = useState(false)

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

  // Consultar vales aplicables cuando cambian los productos
  const consultarVales = useCallback(async () => {
    if (productoIds.length === 0 || cantidadTotal <= 0) {
      setValesAplicables([])
      return
    }

    setLoading(true)
    try {
      const res = await getValesAplicables({
        cantidad_total: cantidadTotal,
        producto_ids: productoIds,
      })
      if (res.data?.data) {
        setValesAplicables(res.data.data)
      }
    } catch {
      // Silencioso - no interrumpir la venta
    } finally {
      setLoading(false)
    }
  }, [productoIds, cantidadTotal])

  // Debounce: consultar vales 500ms después del último cambio
  useEffect(() => {
    const timer = setTimeout(consultarVales, 500)
    return () => clearTimeout(timer)
  }, [consultarVales])

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

  // Descripción del beneficio del vale
  const getBeneficio = (vale: ValeCompra) => {
    if (vale.descuento_tipo === 'PORCENTAJE' && vale.descuento_valor) {
      return `${vale.descuento_valor}% DSCTO`
    }
    if (vale.descuento_tipo === 'MONTO_FIJO' && vale.descuento_valor) {
      return `S/ ${Number(vale.descuento_valor).toFixed(2)} DSCTO`
    }
    if (vale.tipo_promocion === 'PRODUCTO_GRATIS') return 'PRODUCTO GRATIS'
    if (vale.tipo_promocion === 'DOS_POR_UNO') return '2x1'
    return vale.tipo_promocion
  }

  return (
    <div className='flex flex-col gap-1.5'>
      {/* Vales detectados automáticamente */}
      {loading ? (
        <div className='flex items-center gap-2 text-gray-400'>
          <Spin size='small' />
          <span className='text-[10px]'>Buscando vales...</span>
        </div>
      ) : valesAplicables.length > 0 ? (
        <div className='flex flex-col gap-1'>
          {valesAplicables.map((vale) => (
            <div key={vale.id} className='flex items-center gap-1.5'>
              <FaCheckCircle className='text-green-600 flex-shrink-0' size={12} />
              <Tooltip title={`${vale.nombre} - ${vale.modalidad}`}>
                <Tag color='green' className='!text-[10px] !m-0 !px-1.5 !py-0'>
                  {vale.nombre} ({getBeneficio(vale)})
                </Tag>
              </Tooltip>
            </div>
          ))}
          <span className='text-[9px] text-green-600 pl-4'>
            Se aplicarán automáticamente al crear la venta
          </span>
        </div>
      ) : productosVenta.length > 0 ? (
        <span className='text-[10px] text-gray-400'>Sin vales aplicables</span>
      ) : null}

      {/* Input para código de vale generado (próxima compra) */}
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
        {verificandoCodigo && <Spin size='small' />}
      </div>
    </div>
  )
}
