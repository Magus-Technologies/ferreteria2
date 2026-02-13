'use client'

import { useState, useEffect } from 'react'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { FaCalculator } from 'react-icons/fa'

interface ConteoDineroProps {
  onChange?: (total: number, conteo?: any) => void
  className?: string
  initialValues?: { [key: string]: number }
  initialTotal?: number
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

export default function ConteoDinero({ 
  onChange, 
  className = '', 
  initialValues = {},
  initialTotal = 0 
}: ConteoDineroProps) {
  const [cantidades, setCantidades] = useState<{ [key: string]: number }>(() => {
    const initial: { [key: string]: number } = {}
    denominaciones.forEach(d => {
      initial[d.key] = initialValues[d.key] || 0
    })
    return initial
  })
  
  const [montoFijo, setMontoFijo] = useState<number>(initialTotal)

  const calcularTotalDesglose = () => {
    return denominaciones.reduce((sum, d) => {
      return sum + (cantidades[d.key] || 0) * d.valor
    }, 0)
  }

  useEffect(() => {
    const totalDesglose = calcularTotalDesglose()
    // Si hay desglose, usar ese total; si no, usar el monto fijo
    const totalFinal = totalDesglose > 0 ? totalDesglose : montoFijo
    
    // Preparar el objeto de conteo solo si hay denominaciones
    const conteoData = totalDesglose > 0 ? cantidades : null
    
    console.log('💵 ConteoDinero onChange:', { totalFinal, conteoData, totalDesglose, montoFijo })
    onChange?.(totalFinal, conteoData)
  }, [cantidades, montoFijo])

  const handleCantidadChange = (key: string, value: number) => {
    setCantidades(prev => ({
      ...prev,
      [key]: value || 0
    }))
  }

  const handleMontoFijoChange = (value: number | string | null) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    setMontoFijo(numValue || 0)
  }

  const totalDesglose = calcularTotalDesglose()
  const totalFinal = totalDesglose > 0 ? totalDesglose : montoFijo

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className='flex items-center gap-1.5 mb-2 p-1.5 bg-slate-100 rounded'>
        <FaCalculator className='text-orange-600' size={14} />
        <span className='text-xs font-medium text-slate-700'>Desglose de Billetes y Monedas</span>
      </div>

      {/* Tabla de Desglose */}
      <div className='bg-slate-50 rounded p-1 mb-2'>
        <table className='w-full text-[10px]'>
          <thead>
            <tr className='border-b border-slate-300'>
              <th className='text-left py-0.5 px-0.5 text-slate-600 font-medium text-[9px]'>#</th>
              <th className='text-left py-0.5 px-0.5 text-slate-600 font-medium text-[9px]'>Denominación</th>
              <th className='text-center py-0.5 px-0.5 text-slate-600 font-medium text-[9px]'>Cant.</th>
              <th className='text-right py-0.5 px-0.5 text-slate-600 font-medium text-[9px]'>Total</th>
            </tr>
          </thead>
          <tbody>
            {denominaciones.map((denom, index) => {
              const cantidad = cantidades[denom.key] || 0
              const subtotal = cantidad * denom.valor
              return (
                <tr key={denom.key} className='border-b border-slate-100 hover:bg-white'>
                  <td className='py-0.5 px-0.5 text-slate-500 text-[9px]'>{index + 1}</td>
                  <td className='py-0.5 px-0.5 text-slate-700 text-[10px]'>{denom.label}</td>
                  <td className='py-0.5 px-0.5'>
                    <InputNumberBase
                      value={cantidad}
                      onChange={(value) => handleCantidadChange(denom.key, Number(value) || 0)}
                      min={0}
                      precision={0}
                      className='w-full text-[10px]'
                      size='small'
                      style={{ padding: '1px 4px', height: '22px' }}
                    />
                  </td>
                  <td className='py-0.5 px-0.5 text-right font-medium text-slate-800 text-[10px]'>
                    {subtotal.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Total con opción de monto fijo */}
      <div className='p-1.5 bg-orange-100 rounded border border-orange-300'>
        <div className='flex items-center justify-between mb-1'>
          <div className='text-[10px] text-slate-600'>Total Calculado:</div>
          <div className='text-sm font-bold text-orange-600'>
            S/. {totalDesglose.toFixed(2)}
          </div>
        </div>
        
        {totalDesglose === 0 && (
          <div className='mt-1.5 pt-1.5 border-t border-orange-300'>
            <label className='block text-[10px] font-medium text-slate-600 mb-1'>
              O ingrese monto fijo:
            </label>
            <InputNumberBase
              prefix='S/. '
              placeholder='0.00'
              value={montoFijo}
              onChange={handleMontoFijoChange}
              precision={2}
              min={0}
              className='w-full'
              size='small'
              style={{ fontSize: '12px', fontWeight: 'bold', height: '28px' }}
            />
          </div>
        )}

        <div className='mt-1.5 pt-1.5 border-t border-orange-300'>
          <div className='flex items-center justify-between'>
            <div className='text-[10px] font-bold text-slate-700'>TOTAL FINAL:</div>
            <div className='text-base font-bold text-orange-600'>
              S/. {totalFinal.toFixed(2)}
            </div>
          </div>
          <div className='text-[9px] text-slate-500 mt-0.5'>
            {totalDesglose > 0 ? 'Calculado desde desglose' : 'Monto fijo ingresado'}
          </div>
        </div>
      </div>
    </div>
  )
}
