import { FaCircle } from 'react-icons/fa'

interface TitleFormProps {
  children: React.ReactNode
  className?: string
}

export default function TitleForm({ children, className }: TitleFormProps) {
  return (
    <div className={`flex items-center gap-8 pb-3 ${className}`}>
      <span className='text-xl font-bold '>{children}</span>
      <div className='flex items-center justify-center gap-6 text-sm text-slate-700'>
        <div className='flex items-center justify-center gap-1'>
          <FaCircle size={15} className='text-cyan-600' />
          Opcional
        </div>
        <div className='flex items-center justify-center gap-1'>
          <FaCircle size={15} className='text-rose-700' />
          Obligatorio
        </div>
      </div>
    </div>
  )
}
