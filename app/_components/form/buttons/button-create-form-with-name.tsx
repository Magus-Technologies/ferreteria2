import { FaPlusCircle } from 'react-icons/fa'
import { IconBaseProps } from 'react-icons/lib'

type ButtonCreateFormWithNameProps = IconBaseProps

export default function ButtonCreateFormWithName({
  className,
  size = 18,
  ...props
}: ButtonCreateFormWithNameProps) {
  return (
    <FaPlusCircle
      {...props}
      className={`text-emerald-600 hover:text-emerald-700 cursor-pointer active:scale-95 hover:scale-110 transition-all mb-7 min-w-5 ${className}`}
      size={size}
    />
  )
}
