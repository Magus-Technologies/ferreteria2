import { Tag, TagProps } from 'antd'
import { FaCheckCircle } from 'react-icons/fa'
import { FaCircleXmark } from 'react-icons/fa6'

interface TagBooleanProps
  extends Omit<TagProps, 'color' | 'icon' | 'bordered'> {
  booleano: boolean
  ifIsTrue?: React.ReactNode
  ifIsFalse?: React.ReactNode
}

export default function TagBoolean({
  booleano,
  ifIsTrue = 'Activo',
  ifIsFalse = 'Inactivo',
  className = '',
  ...props
}: TagBooleanProps) {
  return (
    <Tag
      icon={booleano ? <FaCheckCircle /> : <FaCircleXmark />}
      color={booleano ? 'success' : 'error'}
      bordered={false}
      className={`!flex items-center gap-2 font-semibold ${className}`}
      {...props}
    >
      {booleano ? ifIsTrue : ifIsFalse}
    </Tag>
  )
}
