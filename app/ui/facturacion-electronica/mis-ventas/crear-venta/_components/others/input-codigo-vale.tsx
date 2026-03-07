'use client'

import { useState, useMemo } from 'react'
import { Input, Tag, Tooltip, App } from 'antd'
import { FaTicketAlt, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa'
import { FaSearch } from 'react-icons/fa'
import { Spin } from 'antd'
import { verificarCodigoVale } from '~/lib/api/vales-compra'
import type { ValeCompraVerificado } from '~/lib/api/vales-compra'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'

interface InputCodigoValeProps {
  value?: string
  onChange?: (value: string | undefined) => void
}

/**
 * Valida si los productos actuales de la venta cumplen las condiciones del vale
 */
function validarValeConProductos(
  vale: ValeCompraVerificado['vale_compra'],
  productosVenta: Array<{ producto_id?: number; cantidad?: number; unidad_derivada_factor?: number }>
): { aplica: boolean; mensaje: string } {
  if (!vale) return { aplica: false, mensaje: '' }

  // Calcular cantidad total (cantidad * factor para unidad base)
  const cantidadTotal = productosVenta.reduce((sum, p) => {
    const cantidad = Number(p.cantidad ?? 0)
    const factor = Number(p.unidad_derivada_factor ?? 1)
    return sum + (cantidad * factor)
  }, 0)

  // IDs de productos en la venta
  const productoIdsVenta = productosVenta
    .map(p => p.producto_id)
    .filter((id): id is number => !!id)

  // 1. Validar cantidad minima
  if (vale.cantidad_minima > 0 && cantidadTotal < vale.cantidad_minima) {
    const faltan = Math.ceil(vale.cantidad_minima - cantidadTotal)
    return {
      aplica: false,
      mensaje: `Faltan ${faltan} unidades (mín: ${vale.cantidad_minima})`,
    }
  }

  // 2. Validar por modalidad
  switch (vale.modalidad) {
    case 'CANTIDAD_MINIMA':
      // Solo valida cantidad, ya pasó arriba
      break

    case 'POR_PRODUCTOS': {
      if (vale.productos?.length) {
        const productosValeIds = vale.productos.map(p => p.id)
        const tieneProducto = productoIdsVenta.some(id => productosValeIds.includes(id))
        if (!tieneProducto) {
          const nombres = vale.productos.map(p => p.nombre).join(', ')
          return {
            aplica: false,
            mensaje: `Agrega: ${nombres}`,
          }
        }
      }
      break
    }

    case 'POR_CATEGORIA': {
      // No podemos validar categorías en frontend (no tenemos categoria_id en productos del store)
      // Se validará en el backend al crear la venta
      break
    }

    case 'MIXTO': {
      const problemas: string[] = []
      if (vale.productos?.length) {
        const productosValeIds = vale.productos.map(p => p.id)
        const tieneProducto = productoIdsVenta.some(id => productosValeIds.includes(id))
        if (!tieneProducto) {
          problemas.push(`producto: ${vale.productos.map(p => p.nombre).join(', ')}`)
        }
      }
      // Categorías se validan en backend
      if (problemas.length > 0) {
        return {
          aplica: false,
          mensaje: `Falta ${problemas.join(' y ')}`,
        }
      }
      break
    }
  }

  // Si no hay productos en la venta, advertir
  if (productosVenta.length === 0) {
    return {
      aplica: false,
      mensaje: 'Agrega productos a la venta',
    }
  }

  return { aplica: true, mensaje: 'Este vale aplica a tu venta' }
}

export default function InputCodigoVale({ value, onChange }: InputCodigoValeProps) {
  const { notification } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [valeInfo, setValeInfo] = useState<ValeCompraVerificado | null>(null)
  const [inputValue, setInputValue] = useState('')

  // Leer productos del store para validación en tiempo real
  const productosVenta = useStoreProductoAgregadoVenta(store => store.productos)

  // Validación en tiempo real
  const validacion = useMemo(() => {
    if (!valeInfo?.vale_compra) return null
    return validarValeConProductos(valeInfo.vale_compra, productosVenta)
  }, [valeInfo, productosVenta])

  const verificar = async (raw: string) => {
    const codigo = raw.replace(/\s/g, '').trim()
    if (!codigo) return

    setLoading(true)
    try {
      const res = await verificarCodigoVale(codigo.trim())
      if (res.data?.valido && res.data.data) {
        setValeInfo(res.data.data)
        onChange?.(codigo.trim())
        notification.success({
          message: 'Vale encontrado',
          description: `${res.data.data.vale_compra?.nombre || 'Vale de compra'} aplicado correctamente.`,
          duration: 4,
        })
      } else {
        setValeInfo(null)
        onChange?.(undefined)
        notification.error({
          message: 'Vale no válido',
          description: res.data?.message || 'El código no es válido, ya fue usado o ha expirado.',
          duration: 5,
        })
      }
    } catch {
      setValeInfo(null)
      onChange?.(undefined)
      notification.error({
        message: 'Error',
        description: 'No se pudo verificar el código de vale.',
        duration: 4,
      })
    } finally {
      setLoading(false)
    }
  }

  const limpiar = () => {
    setInputValue('')
    setValeInfo(null)
    onChange?.(undefined)
  }

  if (valeInfo) {
    const vale = valeInfo.vale_compra
    const beneficio = vale?.descuento_tipo === 'PORCENTAJE' && vale.descuento_valor
      ? `${vale.descuento_valor}% DSCTO`
      : vale?.descuento_tipo === 'MONTO_FIJO' && vale?.descuento_valor
      ? `S/. ${vale.descuento_valor.toFixed(2)} DSCTO`
      : vale?.tipo_promocion || ''

    // Descripción de a qué aplica el vale
    const aplicaPara = (() => {
      if (!vale) return ''
      const partes: string[] = []
      if (vale.productos?.length) {
        partes.push(vale.productos.map(p => p.nombre).join(', '))
      }
      if (vale.categorias?.length) {
        partes.push(`Cat: ${vale.categorias.map(c => c.nombre).join(', ')}`)
      }
      if (vale.modalidad === 'CANTIDAD_MINIMA' && !vale.productos?.length && !vale.categorias?.length) {
        partes.push('Cualquier producto')
      }
      if (vale.cantidad_minima > 0) {
        partes.push(`Mín: ${vale.cantidad_minima} uds`)
      }
      return partes.join(' · ')
    })()

    const noAplica = validacion && !validacion.aplica

    return (
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          {noAplica
            ? <FaExclamationTriangle className='text-amber-500' />
            : <FaCheckCircle className='text-green-600' />
          }
          <Tooltip title={aplicaPara ? `Válido para: ${aplicaPara}` : undefined}>
            <Tag color={noAplica ? 'warning' : 'green'} className='!text-xs !m-0'>
              {value} - {vale?.nombre || 'Vale'} ({beneficio})
            </Tag>
          </Tooltip>
          <Tooltip title='Quitar vale'>
            <FaTimesCircle
              className='text-red-400 cursor-pointer hover:text-red-600 transition-colors'
              onClick={limpiar}
            />
          </Tooltip>
        </div>
        {/* Mensaje de validación en tiempo real */}
        {validacion && (
          <span className={`text-[10px] pl-6 ${noAplica ? 'text-amber-600 font-medium' : 'text-green-600'}`}>
            {noAplica ? validacion.mensaje : validacion.mensaje}
          </span>
        )}
        {/* Info de aplicabilidad */}
        {aplicaPara && !noAplica && (
          <span className='text-[10px] text-gray-500 pl-6'>
            Válido para: {aplicaPara}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className='flex items-center gap-2'>
      <Input
        placeholder='Ingresa código de vale...'
        prefix={<FaTicketAlt className='text-cyan-600' />}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value.toUpperCase())}
        onPressEnter={() => verificar(inputValue)}
        disabled={loading}
        allowClear
        className='!max-w-[220px]'
      />
      {loading
        ? <Spin size='small' />
        : <FaSearch
            className='text-yellow-600 cursor-pointer z-10'
            size={15}
            onClick={() => verificar(inputValue)}
          />
      }
    </div>
  )
}
