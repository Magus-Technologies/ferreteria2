import { ProductoAlmacenUnidadDerivada, UnidadDerivada } from '@prisma/client'
import { FaMoneyBills } from 'react-icons/fa6'
import { PiWarehouseFill } from 'react-icons/pi'
import { GetStock } from '~/app/_utils/get-stock'

interface ProductoOtrosAlmacenesProps {
  stock_fraccion: number
  unidades_contenidas: number
  producto_almacen_unidad_derivada: ProductoAlmacenUnidadDerivada & {
    unidad_derivada: UnidadDerivada
  }
  almacen: string
}

export default function ProductoOtrosAlmacenes({
  stock_fraccion,
  unidades_contenidas,
  producto_almacen_unidad_derivada,
  almacen,
}: ProductoOtrosAlmacenesProps) {
  const precios = [
    { key: 'precio_publico', name: 'Precio Público' },
    { key: 'precio_especial', name: 'Precio Especial' },
    { key: 'precio_minimo', name: 'Precio Mínimo' },
    { key: 'precio_ultimo', name: 'Precio Último' },
  ]
  return (
    <div>
      <div className='font-bold text-lg text-nowrap border-b text-center flex items-center justify-center gap-3'>
        <PiWarehouseFill size={18} className='text-cyan-600' />
        {almacen}
      </div>
      <div className='flex items-center justify-between gap-4'>
        <div>Stock:</div>
        <div className='font-bold text-nowrap'>
          <GetStock
            stock_fraccion={stock_fraccion}
            unidades_contenidas={unidades_contenidas}
          />
        </div>
      </div>
      <div className='font-bold text-nowrap flex items-center justify-center gap-2'>
        <FaMoneyBills size={16} className='text-emerald-600' />
        Precios ({producto_almacen_unidad_derivada.unidad_derivada.name})
      </div>
      {precios.map(precio => (
        <div
          className='flex items-center justify-between gap-4'
          key={precio.key}
        >
          <div className=''>{precio.name}:</div>
          <div className='font-bold text-nowrap'>
            S/.{' '}
            {Number(
              producto_almacen_unidad_derivada[
                precio.key as keyof ProductoAlmacenUnidadDerivada
              ] ?? '0'
            ).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
