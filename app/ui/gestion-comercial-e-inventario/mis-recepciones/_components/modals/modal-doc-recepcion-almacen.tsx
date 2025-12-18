import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getNroDoc } from '~/app/_utils/get-nro-doc'
import { useAuth } from '~/lib/auth-context'
import DocRecepcionAlmacen from '../docs/doc-recepcion-almacen'
import { getRecepcionesAlmacenResponseProps } from '~/app/_actions/recepcion-almacen'
import { TipoDocumento } from '@prisma/client'
import { useState } from 'react'
import DocRecepcionAlmacenTicket from '../docs/doc-recepcion-almacen-ticket'

export default function ModalDocRecepcionAlmacen({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: getRecepcionesAlmacenResponseProps | undefined
}) {
  const { user } = useAuth()
  const empresa = user?.empresa

  const nro_doc = getNroDoc({
    tipo_documento: TipoDocumento.RecepcionAlmacen,
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
