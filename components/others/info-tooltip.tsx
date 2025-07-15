import { Tooltip } from 'antd'
import { TooltipProps } from 'antd/lib'
import { FaInfoCircle } from 'react-icons/fa'

type InfoTooltipProps = TooltipProps & {
  sizeIcon?: number
  classNameIcon?: string
}

export default function InfoTooltip({
  sizeIcon,
  classNameIcon = '',
  ...props
}: InfoTooltipProps) {
  return (
    <Tooltip {...props}>
      <FaInfoCircle
        className={`text-slate-500 cursor-pointer ${classNameIcon}`}
        size={sizeIcon}
      />
    </Tooltip>
  )
}
