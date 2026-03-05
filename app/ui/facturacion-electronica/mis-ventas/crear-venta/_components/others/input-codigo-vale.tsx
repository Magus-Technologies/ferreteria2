'use client'

import { useState } from 'react'
import { Input, Tag, Tooltip, App, Spin } from 'antd'
import { FaTicketAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { verificarCodigoVale } from '~/lib/api/vales-compra'
import type { ValeCompraAplicado } from '~/lib/api/vales-compra'

interface InputCodigoValeProps {
  value?: string
  onChange?: (value: string | undefined) => void
}

export default function InputCodigoVale({ value, onChange }: InputCodigoValeProps) {
  const { notification } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [valeInfo, setValeInfo] = useState<ValeCompraAplicado | null>(null)
  const [inputValue, setInputValue] = useState('')

  const verificar = async (codigo: string) => {
    if (!codigo.trim()) return

    setLoading(true)
    try {
      const res = await verificarCodigoVale(codigo.trim())
      if (res.data?.valido && res.data.data) {
        setValeInfo(res.data.data)
        onChange?.(codigo.trim())
        notification.success({
          message: 'Vale válido',
          description: `${res.data.data.vale_compra?.nombre || 'Vale de compra'} aplicado.`,
          duration: 4,
        })
      } else {
        setValeInfo(null)
        onChange?.(undefined)
        notification.error({
          message: 'Vale no válido',
          description: res.data?.message || 'El código no es válido, ya fue usado o expiró.',
          duration: 5,
        })
      }
    } catch {
      setValeInfo(null)
      onChange?.(undefined)
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

    return (
      <div className='flex items-center gap-2'>
        <FaCheckCircle className='text-green-600' />
        <Tag color='green' className='!text-xs !m-0'>
          {value} - {vale?.nombre || 'Vale'} ({beneficio})
        </Tag>
        <Tooltip title='Quitar vale'>
          <FaTimesCircle
            className='text-red-400 cursor-pointer hover:text-red-600 transition-colors'
            onClick={limpiar}
          />
        </Tooltip>
      </div>
    )
  }

  return (
    <Input
      placeholder='Ingresa código de vale...'
      prefix={<FaTicketAlt className='text-amber-600' />}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value.toUpperCase())}
      onPressEnter={() => verificar(inputValue)}
      suffix={loading ? <Spin size='small' /> : undefined}
      disabled={loading}
      allowClear
      className='!max-w-[280px]'
    />
  )
}
