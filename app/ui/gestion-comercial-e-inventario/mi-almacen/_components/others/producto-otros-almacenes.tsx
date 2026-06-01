import { PiWarehouseFill } from 'react-icons/pi'
import { GetStock } from '~/app/_utils/get-stock'
import type { ProductoAlmacenUnidadDerivada } from '~/app/_types/producto'

interface ProductoOtrosAlmacenesProps {
  stock_fraccion: number
  unidades_contenidas: number
  producto_almacen_unidad_derivada: ProductoAlmacenUnidadDerivada
  almacen: string
}

export default function ProductoOtrosAlmacenes({
  stock_fraccion,
  unidades_contenidas,
  producto_almacen_unidad_derivada,
  almacen,
}: ProductoOtrosAlmacenesProps) {
  return (
    <div className='min-w-[170px]'>
      <div className='font-bold text-sm text-nowrap border-b pb-1 mb-2 flex items-center justify-center gap-2'>
        <PiWarehouseFill size={15} className='text-cyan-600' />
        {almacen}
      </div>
      <div className='flex items-center justify-between gap-4 text-sm'>
        <span className='text-slate-500'>Stock:</span>
        <span className='font-bold text-nowrap'>
          <GetStock
            stock_fraccion={stock_fraccion}
            unidades_contenidas={unidades_contenidas}
          />
        </span>
      </div>
      <div className='flex items-center justify-between gap-4 text-sm mt-1'>
        <span className='text-slate-500'>Precio Público:</span>
        <span className='font-bold text-emerald-700 text-nowrap'>
          S/.{' '}
          {Number(producto_almacen_unidad_derivada.precio_publico ?? 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  )
}
