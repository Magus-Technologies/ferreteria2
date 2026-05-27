'use client'

import { useState } from 'react'
import { Form, FormInstance, Tooltip, Badge, Tag } from 'antd'
import { FaTicketAlt } from 'react-icons/fa'
import dynamic from 'next/dynamic'

const ModalCanjearVale = dynamic(
  () => import('../modals/modal-canjear-vale'),
  { ssr: false },
)

/**
 * Botón con icono que abre un modal para ingresar manualmente el código
 * de un vale (DESCUENTO_PROXIMA_COMPRA o SORTEO). Cada código solo puede
 * usarse una vez. Si ya hay un código aplicado se muestra como tag al lado.
 */
export default function BotonCanjearVale({ form }: { form: FormInstance }) {
  const [open, setOpen] = useState(false)
  const codigoActual = Form.useWatch('codigo_vale', form) as string | undefined

  return (
    <div className='flex items-center gap-2'>
      <Tooltip title='Canjear código de vale (sorteo o próxima compra)'>
        <Badge dot={!!codigoActual} color='green' offset={[-4, 4]}>
          <button
            type='button'
            onClick={() => setOpen(true)}
            className='flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors cursor-pointer border border-orange-300'
            aria-label='Canjear código de vale'
          >
            <FaTicketAlt size={18} />
          </button>
        </Badge>
      </Tooltip>

      {codigoActual && (
        <Tag color='green' className='!m-0'>
          {codigoActual}
        </Tag>
      )}

      <ModalCanjearVale
        open={open}
        setOpen={setOpen}
        codigoActual={codigoActual}
        onAplicar={(codigo) => {
          form.setFieldValue('codigo_vale', codigo)
        }}
        onQuitar={() => {
          form.setFieldValue('codigo_vale', undefined)
        }}
      />
    </div>
  )
}
