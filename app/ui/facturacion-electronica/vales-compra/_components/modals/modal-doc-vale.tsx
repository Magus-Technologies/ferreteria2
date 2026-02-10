'use client'

import { ValeCompra } from '~/lib/api/vales-compra'
import DocValeTicket from '../docs/doc-vale-ticket'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { useState } from 'react'

interface ModalDocValeProps {
  open: boolean
  setOpen: (open: boolean) => void
  data: ValeCompra | null | undefined
}

export default function ModalDocVale({ open, setOpen, data }: ModalDocValeProps) {
  const { data: empresa } = useEmpresaPublica()
  const [esTicket] = useState(true) // Siempre es ticket para vales

  if (!data) return null

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={data.codigo}
      esTicket={esTicket}
    >
      <DocValeTicket vale={data} empresa={empresa} />
    </ModalShowDoc>
  )
}
