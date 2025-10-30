import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getNroDoc } from '~/app/_utils/get-nro-doc'
import { useSession } from 'next-auth/react'
import DocRecepcionAlmacen from '../docs/doc-recepcion-almacen'
import { getRecepcionesAlmacenResponseProps } from '~/app/_actions/recepcion-almacen'
import { TipoDocumento } from '@prisma/client'

export default function ModalDocRecepcionAlmacen({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: getRecepcionesAlmacenResponseProps | undefined
}) {
  const { data: session } = useSession()
  const empresa = session?.user.empresa

  const nro_doc = getNroDoc({
    tipo_documento: TipoDocumento.RecepcionAlmacen,
    serie: empresa?.serie_recepcion_almacen ?? 0,
    numero: data?.numero ?? 0,
  })

  return (
    <ModalShowDoc open={open} setOpen={setOpen} nro_doc={nro_doc}>
      <DocRecepcionAlmacen data={data} nro_doc={nro_doc} empresa={empresa} />
    </ModalShowDoc>
  )
}
