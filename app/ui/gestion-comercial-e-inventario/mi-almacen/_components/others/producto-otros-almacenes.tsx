import { FaMoneyBills } from 'react-icons/fa6'
import { PiWarehouseFill } from 'react-icons/pi'

export default function ProductoOtrosAlmacenes() {
  return (
    <div>
      <div className='font-bold text-lg text-nowrap border-b text-center flex items-center justify-center gap-3'>
        <PiWarehouseFill size={18} className='text-cyan-600' />
        Almacén 1
      </div>
      <div className='flex items-center justify-between gap-4'>
        <div className='font-medium'>Stock:</div>
        <div>5F10</div>
      </div>
      <div className='font-bold text-nowrap flex items-center justify-center gap-2'>
        <FaMoneyBills size={16} className='text-emerald-600' />
        Precios
      </div>
      <div className='flex items-center justify-between gap-4'>
        <div className='font-medium'>Público</div>
        <div className='text-nowrap'>S/. 20.00</div>
      </div>
    </div>
  )
}
