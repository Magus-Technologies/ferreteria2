import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getNroDoc } from '~/app/_utils/get-nro-doc'
import { useAuth } from '~/lib/auth-context'
import DocRecepcionAlmacen from '../docs/doc-recepcion-almacen'
import { useState } from 'react'
import DocRecepcionAlmacenTicket from '../docs/doc-recepcion-almacen-ticket'
import type { RecepcionAlmacenResponse } from '~/lib/api/recepcion-almacen'

export default function ModalDocRecepcionAlmacen({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: RecepcionAlmacenResponse | undefined
}) {
  const { user } = useAuth()
  const empresa = user?.empresa

  const nro_doc = getNroDoc({
    tipo_documento: 'RecepcionAlmacen' as any,
    serie: empresa?.serie_recepcion_almacen ?? 0,
    numero: data?.numero ?? 0,
  })

  const [esTicket, setEsTicket] = useState(true)

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={nro_doc}
      setEsTicket={setEsTicket}
      esTicket={esTicket}
      tipoDocumento='recepcion_almacen'
    >
      {esTicket ? (
        <DocRecepcionAlmacenTicket
          data={data}
          nro_doc={nro_doc}
          empresa={empresa ?? undefined}
        />
      ) : (
        <DocRecepcionAlmacen data={data} nro_doc={nro_doc} empresa={empresa ?? undefined} />
      )}
    </ModalShowDoc>
  )
}
