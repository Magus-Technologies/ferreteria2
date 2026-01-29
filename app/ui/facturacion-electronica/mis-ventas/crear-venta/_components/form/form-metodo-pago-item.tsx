'use client'

import { TipoMoneda } from '~/lib/api/venta'
import { Tooltip, Input } from 'antd'
import { MdDelete } from 'react-icons/md'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import { useState, useEffect } from 'react'
import { despliegueDePagoApi, type DespliegueDePago, calcularSobrecargo, calcularMontoTotal } from '~/lib/api/despliegue-de-pago'

interface MetodoDePago {
  despliegue_de_pago_id?: string
  monto?: number
  numero_operacion?: string
}

export default function FormMetodoPagoItem({
  index,
  metodo,
  onChange,
  onEliminar,
  desplieguesExcluidos,
  tipo_moneda,
  mostrarEliminar,
}: {
  index: number
  metodo: MetodoDePago
  onChange: (
    index: number,
    field: keyof MetodoDePago,
    value: string | number | undefined
  ) => void
  onEliminar: (index: number) => void
  desplieguesExcluidos: string[]
  tipo_moneda: TipoMoneda
  mostrarEliminar: boolean
}) {
  const [metodoPagoInfo, setMetodoPagoInfo] = useState<DespliegueDePago | null>(null)
  const [sobrecargo, setSobrecargo] = useState(0)
  const [montoTotal, setMontoTotal] = useState(0)

  // Cargar información del método de pago seleccionado
  useEffect(() => {
    if (metodo.despliegue_de_pago_id) {
      despliegueDePagoApi.getById(metodo.despliegue_de_pago_id).then((response) => {
        if (response.data?.data) {
          setMetodoPagoInfo(response.data.data)
        }
      })
    } else {
      setMetodoPagoInfo(null)
    }
  }, [metodo.despliegue_de_pago_id])

  // Calcular sobrecargo cuando cambia el monto o el método
  useEffect(() => {
    if (metodoPagoInfo && metodo.monto) {
      const sobrecargoCalculado = calcularSobrecargo(metodoPagoInfo, metodo.monto)
      const totalCalculado = calcularMontoTotal(metodoPagoInfo, metodo.monto)
      setSobrecargo(sobrecargoCalculado)
      setMontoTotal(totalCalculado)
    } else {
      setSobrecargo(0)
      setMontoTotal(metodo.monto || 0)
    }
  }, [metodoPagoInfo, metodo.monto])

  const requiereNumeroOperacion = metodoPagoInfo?.requiere_numero_serie || false
  const tieneSobrecargo = sobrecargo > 0

  return (
    <div className='flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200'>
      <div className='flex items-center gap-2'>
        <div className='flex-1'>
          <SelectDespliegueDePago
            placeholder='Seleccionar despliegue'
            value={metodo.despliegue_de_pago_id}
            onChange={(value) =>
              onChange(index, 'despliegue_de_pago_id', value as string)
            }
            classNameIcon='text-rose-700 mx-1'
            filterOption={(input, option) => {
              const isExcluded = desplieguesExcluidos.includes(
                option?.value as string
              )
              if (isExcluded) return false

              const label = (option?.label ?? '').toString().toLowerCase()
              return label.includes(input.toLowerCase())
            }}
          />
        </div>
        <div className='w-40'>
          <InputNumberBase
            prefix={tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. '}
            placeholder='Monto'
            value={metodo.monto}
            onChange={(value) => onChange(index, 'monto', value ?? undefined)}
            precision={4}
            min={0}
            className='w-full'
          />
        </div>
        {mostrarEliminar && (
          <Tooltip title='Eliminar'>
            <MdDelete
              onClick={() => onEliminar(index)}
              size={20}
              className='cursor-pointer text-rose-700 hover:scale-105 transition-all active:scale-95'
            />
          </Tooltip>
        )}
      </div>

      {/* Número de operación (si es requerido) */}
      {requiereNumeroOperacion && (
        <div className='flex items-center gap-2'>
          <div className='flex-1'>
            <Input
              placeholder='Número de operación/voucher (requerido)'
              value={metodo.numero_operacion}
              onChange={(e) => onChange(index, 'numero_operacion', e.target.value)}
              className='w-full'
              status={!metodo.numero_operacion ? 'error' : ''}
            />
          </div>
        </div>
      )}

      {/* Mostrar sobrecargo si aplica */}
      {tieneSobrecargo && metodo.monto && (
        <div className='flex items-center justify-between text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1'>
          <div className='flex items-center gap-4'>
            <span className='text-slate-600'>
              Monto: <span className='font-semibold'>{tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$'} {metodo.monto.toFixed(2)}</span>
            </span>
            <span className='text-amber-700'>
              Sobrecargo ({metodoPagoInfo?.sobrecargo_porcentaje}%): <span className='font-semibold'>+{tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$'} {sobrecargo.toFixed(2)}</span>
            </span>
          </div>
          <span className='text-emerald-700 font-bold'>
            Total: {tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$'} {montoTotal.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}
