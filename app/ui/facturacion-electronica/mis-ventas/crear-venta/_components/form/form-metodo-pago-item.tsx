'use client'

import { TipoMoneda } from '~/lib/api/venta'
import { Tooltip } from 'antd'
import { MdDelete } from 'react-icons/md'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'

interface MetodoDePago {
  despliegue_de_pago_id?: string
  monto?: number
}

export default function FormMetodoPagoItem({
  index,
  metodo,
  onChange,
  onEliminar,
  desplieguesExcluidos,
  tipo_moneda,
  mostrarEliminar,
}: {
  index: number
  metodo: MetodoDePago
  onChange: (
    index: number,
    field: keyof MetodoDePago,
    value: string | number | undefined
  ) => void
  onEliminar: (index: number) => void
  desplieguesExcluidos: string[]
  tipo_moneda: TipoMoneda
  mostrarEliminar: boolean
}) {
  return (
    <div className='flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200'>
      <div className='flex-1'>
        <SelectDespliegueDePago
          placeholder='Seleccionar despliegue'
          value={metodo.despliegue_de_pago_id}
          onChange={(value) =>
            onChange(index, 'despliegue_de_pago_id', value as string)
          }
          classNameIcon='text-rose-700 mx-1'
          // Filtrar despliegues ya seleccionados
          filterOption={(input, option) => {
            const isExcluded = desplieguesExcluidos.includes(
              option?.value as string
            )
            if (isExcluded) return false

            const label = (option?.label ?? '').toString().toLowerCase()
            return label.includes(input.toLowerCase())
          }}
        />
      </div>
      <div className='w-40'>
        <InputNumberBase
          prefix={tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. '}
          placeholder='Monto'
          value={metodo.monto}
          onChange={(value) => onChange(index, 'monto', value ?? undefined)}
          precision={4}
          min={0}
          className='w-full'
        />
      </div>
      {mostrarEliminar && (
        <Tooltip title='Eliminar'>
          <MdDelete
            onClick={() => onEliminar(index)}
            size={20}
            className='cursor-pointer text-rose-700 hover:scale-105 transition-all active:scale-95'
          />
        </Tooltip>
      )}
    </div>
  )
}
