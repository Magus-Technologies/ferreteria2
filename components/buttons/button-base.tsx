import { ButtonHTMLAttributes } from 'react'
import BottomGradient from '../others/border-bottom-gradient'

interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'xl' | 'lg' | 'md' | 'sm'
  borderBottomGradient?: boolean
}

export default function ButtonBase({
  children,
  color = 'default',
  size = 'md',
  borderBottomGradient = false,
  className,
  ...props
}: ButtonBaseProps) {
  let colorClass = ''
  if (color === 'default') colorClass = 'bg-white shadow text-black'
  if (color === 'success') colorClass = 'bg-lime-500'
  if (color === 'warning') colorClass = 'bg-yellow-500'
  if (color === 'danger') colorClass = 'bg-rose-500'
  if (color === 'info') colorClass = 'bg-blue-500'

  let sizeClass = ''
  if (size === 'xl') sizeClass = 'px-12 py-2 text-xl rounded-3xl shadow-xl'
  if (size === 'lg') sizeClass = 'px-10 py-2 text-lg rounded-2xl shadow-lg'
  if (size === 'md') sizeClass = 'px-8 py-1 text-base rounded-xl shadow-md'
  if (size === 'sm') sizeClass = 'px-6 py-1 text-sm rounded-lg shadow-sm'
  return (
    <button
      className={`group/btn text-white relative font-bold transition-all hover:contrast-125 hover:scale-105 active:scale-95 cursor-pointer ${colorClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
      {borderBottomGradient && <BottomGradient />}
    </button>
  )
}
