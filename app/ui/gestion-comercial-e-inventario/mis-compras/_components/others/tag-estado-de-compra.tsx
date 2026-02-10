import { Tag } from 'antd'
import { FaCheckCircle } from 'react-icons/fa'
import { FaTrash } from 'react-icons/fa6'
import { IoTime } from 'react-icons/io5'
import { MdOutlineFiberNew } from 'react-icons/md'

export default function TagEstadoDeCompra({
  estado_de_compra,
  className = '',
  children,
}: {
  estado_de_compra: string
  className?: string
  children: React.ReactNode
}) {
  let icon, color
  if (estado_de_compra === 'cr') {
    icon = <MdOutlineFiberNew />
    color = 'cyan'
  }
  if (estado_de_compra === 'ee') {
    icon = <IoTime />
    color = 'yellow'
  }
  if (estado_de_compra === 'pr') {
    icon = <FaCheckCircle />
    color = 'green'
  }
  if (estado_de_compra === 'an') {
    icon = <FaTrash />
    color = 'red'
  }
  return (
    <Tag
      icon={icon}
      color={color}
      bordered={false}
      className={`!flex items-center gap-2 font-semibold ${className}`}
    >
      {children}
    </Tag>
  )
}
