import { useState } from 'react'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import LabelBase from '~/components/form/label-base'

const conteo = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1]

export interface ConteoBilletesMonedas {
  billete_200: number
  billete_100: number
  billete_50: number
  billete_20: number
  billete_10: number
  moneda_5: number
  moneda_2: number
  moneda_1: number
  moneda_050: number
  moneda_020: number
  moneda_010: number
}

export default function ConteoDinero({
  onChange,
  onConteoChange,
  className = '',
}: {
  onChange?: (value: number) => void
  onConteoChange?: (conteo: ConteoBilletesMonedas) => void
  className?: string
}) {
  const [valores, setValores] = useState<Record<number, number>>({})
  const [monto, setMonto] = useState(0)

  const handleChange = (denominacion: number, cantidad: number) => {
    const nuevosValores = { ...valores, [denominacion]: cantidad || 0 }
    setValores(nuevosValores)

    const total = conteo.reduce(
      (acc, item) => acc + (nuevosValores[item] || 0) * item,
      0
    )
    setMonto(total)
    onChange?.(total)

    // Enviar el conteo detallado
    const conteoDetallado: ConteoBilletesMonedas = {
      billete_200: nuevosValores[200] || 0,
      billete_100: nuevosValores[100] || 0,
      billete_50: nuevosValores[50] || 0,
      billete_20: nuevosValores[20] || 0,
      billete_10: nuevosValores[10] || 0,
      moneda_5: nuevosValores[5] || 0,
      moneda_2: nuevosValores[2] || 0,
      moneda_1: nuevosValores[1] || 0,
      moneda_050: nuevosValores[0.5] || 0,
      moneda_020: nuevosValores[0.2] || 0,
      moneda_010: nuevosValores[0.1] || 0,
    }
    onConteoChange?.(conteoDetallado)
  }

  return (
    <div className={`max-w-[280px] flex flex-col gap-2 ${className}`}>
      <div className='grid grid-cols-[20px_1fr_80px] gap-2 items-center justify-center'>
        <div className='font-bold text-slate-500 text-center'>N°</div>
        <div className='font-bold text-slate-500 text-center'>Denominación</div>
        <div className='font-bold text-slate-500 text-center'>Total</div>
      </div>
      {conteo.map((item, index) => (
        <div
          key={item}
          className='grid grid-cols-[20px_1fr_80px] gap-4 items-center'
        >
          <div className='font-bold text-slate-500'>{index + 1}</div>
          <LabelBase
            className='grid grid-cols-[1fr_auto]'
            classNames={{
              labelParent: 'justify-end',
            }}
            label={`${
              item > 5 ? 'Billete' : 'Moneda'
            } S/. ${item.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          >
            <InputNumberBase
              size='small'
              className='max-w-[50px]'
              placeholder='0'
              min={0}
              step={1}
              precision={0}
              value={valores[item] || 0}
              onChange={value => handleChange(item, Number(value) ?? 0)}
            />
          </LabelBase>
          <div
            className={`font-bold text-nowrap ${
              (valores[item] || 0) > 0 ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            S/.{' '}
            {((valores[item] || 0) * item).toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      ))}

      <div className='mt-2 font-bold text-xl flex items-center justify-center gap-2'>
        <div className='text-slate-500'>Total Conteo:</div>
        <div className='text-emerald-600'>
          S/. {monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  )
}
