'use client'

import { useState, useEffect } from 'react'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'

interface ConteoDineroProps {
  onChange?: (total: number) => void
  className?: string
  initialValues?: { [key: string]: number }
}

const denominaciones = [
  { label: 'Billete S/. 200.00', valor: 200, key: 'b200' },
  { label: 'Billete S/. 100.00', valor: 100, key: 'b100' },
  { label: 'Billete S/. 50.00', valor: 50, key: 'b50' },
  { label: 'Billete S/. 20.00', valor: 20, key: 'b20' },
  { label: 'Billete S/. 10.00', valor: 10, key: 'b10' },
  { label: 'Moneda S/. 5.00', valor: 5, key: 'm5' },
  { label: 'Moneda S/. 2.00', valor: 2, key: 'm2' },
  { label: 'Moneda S/. 1.00', valor: 1, key: 'm1' },
  { label: 'Moneda S/. 0.50', valor: 0.5, key: 'm050' },
  { label: 'Moneda S/. 0.20', valor: 0.2, key: 'm020' },
  { label: 'Moneda S/. 0.10', valor: 0.1, key: 'm010' },
  { label: 'Moneda S/. 0.05', valor: 0.05, key: 'm005' },
]

export default function ConteoDinero({ onChange, className = '', initialValues = {} }: ConteoDineroProps) {
  const [cantidades, setCantidades] = useState<{ [key: string]: number }>(() => {
    const initial: { [key: string]: number } = {}
    denominaciones.forEach(d => {
      initial[d.key] = initialValues[d.key] || 0
    })
    return initial
  })

  const calcularTotal = () => {
    return denominaciones.reduce((sum, d) => {
      return sum + (cantidades[d.key] || 0) * d.valor
    }, 0)
  }

  useEffect(() => {
    const total = calcularTotal()
    onChange?.(total)
  }, [cantidades])

  const handleCantidadChange = (key: string, value: number) => {
    setCantidades(prev => ({
      ...prev,
      [key]: value || 0
    }))
  }

  return (
    <div className={`${className}`}>
      <div className='bg-slate-50 rounded p-1.5'>
        <table className='w-full text-[11px]'>
          <thead>
            <tr className='border-b border-slate-300'>
              <th className='text-left py-0.5 px-1 text-slate-600 font-medium text-[10px]'>#</th>
              <th className='text-left py-0.5 px-1 text-slate-600 font-medium text-[10px]'>Denominación</th>
              <th className='text-center py-0.5 px-1 text-slate-600 font-medium text-[10px]'>Cant.</th>
              <th className='text-right py-0.5 px-1 text-slate-600 font-medium text-[10px]'>Total</th>
            </tr>
          </thead>
          <tbody>
            {denominaciones.map((denom, index) => {
              const cantidad = cantidades[denom.key] || 0
              const subtotal = cantidad * denom.valor
              return (
                <tr key={denom.key} className='border-b border-slate-100 hover:bg-white'>
                  <td className='py-0.5 px-1 text-slate-500'>{index + 1}</td>
                  <td className='py-0.5 px-1 text-slate-700'>{denom.label}</td>
                  <td className='py-0.5 px-1'>
                    <InputNumberBase
                      value={cantidad}
                      onChange={(value) => handleCantidadChange(denom.key, Number(value) || 0)}
                      min={0}
                      precision={0}
                      className='w-full text-[11px]'
                      size='small'
                    />
                  </td>
                  <td className='py-0.5 px-1 text-right font-medium text-slate-800'>
                    {subtotal.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className='bg-orange-100 border-t border-orange-400'>
              <td colSpan={3} className='py-1 px-1 text-right font-bold text-slate-800 text-xs'>
                TOTAL:
              </td>
              <td className='py-1 px-1 text-right font-bold text-orange-600 text-sm'>
                S/. {calcularTotal().toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
