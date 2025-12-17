import { TipoMoneda } from '@prisma/client'
import SelectBase, { SelectBaseProps } from './select-base'
import { consultaTipoDeCambio } from '~/app/_actions/consulta-tipo-de-cambio'
import { useStoreTipoDeCambio } from '~/store/store-tipo-de-cambio'
import { useEffect } from 'react'
import { useServerQuery } from '~/hooks/use-server-query'
import { RiExchangeDollarFill } from 'react-icons/ri'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface SelectTipoMonedaProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  onChangeTipoDeCambio?: (value: number) => void
}

export default function SelectTipoMoneda({
  placeholder = 'Tipo Moneda',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  onChange,
  onChangeTipoDeCambio,
  ...props
}: SelectTipoMonedaProps) {
  const setTipoDeCambio = useStoreTipoDeCambio(store => store.setTipoDeCambio)
  const { response, refetch } = useServerQuery({
    action: consultaTipoDeCambio,
    propsQuery: {
      queryKey: [QueryKeys.TIPO_CAMBIO],
      staleTime: 30 * 60 * 1000, // Cache por 30 minutos (tipo de cambio cambia poco)
    },
    params: undefined,
  })

  useEffect(() => {
    setTipoDeCambio(response ?? 1)
    onChangeTipoDeCambio?.(response ?? 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response])

  return (
    <SelectBase
      {...(!props.propsForm && { defaultValue: TipoMoneda.Soles })}
      prefix={
        <RiExchangeDollarFill className={classNameIcon} size={sizeIcon} />
      }
      variant={variant}
      placeholder={placeholder}
      options={Object.values(TipoMoneda).map(value => ({
        value,
        label: value,
      }))}
      onChange={value => {
        if (value === TipoMoneda.Soles) setTipoDeCambio(1)
        else refetch()
        onChange?.(value)
      }}
      {...props}
      propsForm={
        props.propsForm
          ? {
              ...props.propsForm,
              initialValue: props.propsForm.initialValue ?? TipoMoneda.Soles,
            }
          : undefined
      }
    />
  )
}
