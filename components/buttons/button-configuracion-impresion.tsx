import { Tooltip } from 'antd'
import { IoSettingsSharp } from 'react-icons/io5'
import ButtonBase from './button-base'
import { TipoDocumento } from '~/store/store-configuracion-impresion'

interface ButtonConfiguracionImpresionProps {
  tipoDocumento: TipoDocumento
  onClick: () => void
}

export default function ButtonConfiguracionImpresion({
  tipoDocumento,
  onClick,
}: ButtonConfiguracionImpresionProps) {
  return (
    <Tooltip title='Configurar impresión'>
      <ButtonBase
        onClick={onClick}
        color='warning'
        size='md'
        className='!px-3'
      >
        <IoSettingsSharp className='text-lg' />
      </ButtonBase>
    </Tooltip>
  )
}
