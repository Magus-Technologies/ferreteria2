import { TipoMoneda } from '~/lib/api/venta'
import SelectBase, { SelectBaseProps } from './select-base'
import { consultaTipoDeCambio } from '~/app/_actions/consulta-tipo-de-cambio'
import { useStoreTipoDeCambio } from '~/store/store-tipo-de-cambio'
import { useEffect, useState } from 'react'
import { useServerQuery } from '~/hooks/use-server-query'
import { RiExchangeDollarFill } from 'react-icons/ri'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface SelectTipoMonedaProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  onChangeTipoDeCambio?: (value: number) => void
  /** Fecha (YYYY-MM-DD) para traer el tipo de cambio de ese día (ej. fecha pasada). */
  fecha?: string
}

export default function SelectTipoMoneda({
  placeholder = 'Tipo Moneda',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 16,
  onChange,
  onChangeTipoDeCambio,
  fecha,
  ...props
}: SelectTipoMonedaProps) {
  const setTipoDeCambio = useStoreTipoDeCambio(store => store.setTipoDeCambio)
  const [selectedMoneda, setSelectedMoneda] = useState(
    props.value ?? props.propsForm?.initialValue ?? TipoMoneda.SOLES,
  )
  const { response, refetch } = useServerQuery({
    action: consultaTipoDeCambio,
    propsQuery: {
      // Incluir la fecha en el key para cachear/refrescar por día.
      queryKey: [QueryKeys.TIPO_CAMBIO, fecha ?? 'hoy'],
      staleTime: 30 * 60 * 1000, // Cache por 30 minutos (tipo de cambio cambia poco)
    },
    params: fecha,
  })

  useEffect(() => {
    if (response) {
      setTipoDeCambio(response)
    }
    // Si estamos en DÓLARES y cambió el tipo de cambio (por cambiar la fecha),
    // propagar el nuevo valor al formulario padre.
    if (response && selectedMoneda === TipoMoneda.DOLARES) {
      onChangeTipoDeCambio?.(response)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response])

  // Mapeo de valores a nombres legibles
  const tipoMonedaLabels: Record<TipoMoneda, string> = {
    [TipoMoneda.SOLES]: 'Soles',
    [TipoMoneda.DOLARES]: 'Dólares',
  }

  return (
    <SelectBase
      {...(!props.propsForm && { defaultValue: TipoMoneda.SOLES })}
      prefix={
        <RiExchangeDollarFill className={classNameIcon} size={sizeIcon} />
      }
      variant={variant}
      placeholder={placeholder}
      options={Object.values(TipoMoneda).map(value => ({
        value,
        label: tipoMonedaLabels[value as TipoMoneda],
      }))}
      onChange={value => {
        setSelectedMoneda(value)
        if (value === TipoMoneda.SOLES) {
          setTipoDeCambio(1)
          onChangeTipoDeCambio?.(1)
        } else {
          const tc = response ?? 1
          setTipoDeCambio(tc)
          onChangeTipoDeCambio?.(tc)
          refetch()
        }
        onChange?.(value)
      }}
      {...props}
      propsForm={
        props.propsForm
          ? {
              ...props.propsForm,
              initialValue: props.propsForm.initialValue ?? TipoMoneda.SOLES,
            }
          : undefined
      }
    />
  )
}
