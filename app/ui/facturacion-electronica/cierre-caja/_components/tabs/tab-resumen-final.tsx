'use client'

interface TabResumenFinalProps {
  resumen: any
  montoEsperado: number
}

export default function TabResumenFinal({ resumen, montoEsperado }: TabResumenFinalProps) {
  return (
    <div className='bg-slate-50 p-6 rounded-lg'>
      <div className='max-w-2xl mx-auto space-y-4'>
        <div className='text-2xl font-bold text-slate-800 mb-6 text-center'>Resumen Final del Cierre</div>

        <div className='bg-white p-4 rounded-lg shadow-sm space-y-3'>
          <div className='flex justify-between items-center text-lg border-b pb-2'>
            <span className='font-semibold text-slate-700'>Efectivo Inicial:</span>
            <span className='font-bold text-slate-800'>S/. {Number(resumen.efectivo_inicial || 0).toFixed(2)}</span>
          </div>

          <div className='flex justify-between items-center text-lg border-b pb-2'>
            <span className='font-semibold text-slate-700'>Total Ingresos:</span>
            <span className='font-bold text-green-600'>+ S/. {Number(resumen.total_ingresos || 0).toFixed(2)}</span>
          </div>

          <div className='flex justify-between items-center text-lg border-b pb-2'>
            <span className='font-semibold text-slate-700'>Total Egresos:</span>
            <span className='font-bold text-red-600'>- S/. {Number(resumen.total_egresos || 0).toFixed(2)}</span>
          </div>

          <div className='h-px bg-slate-300 my-4' />

          <div className='flex justify-between items-center text-2xl bg-slate-100 p-4 rounded-lg'>
            <span className='font-bold text-slate-900'>Total en Caja:</span>
            <span className='font-bold text-slate-900'>S/. {montoEsperado.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
