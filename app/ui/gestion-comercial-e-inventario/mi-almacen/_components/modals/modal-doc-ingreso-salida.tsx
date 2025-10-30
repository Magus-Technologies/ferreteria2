import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocIngresoSalida, {
  DataDocIngresoSalida,
} from '../docs/doc-ingreso-salida'
import { getNroDoc } from '~/app/_utils/get-nro-doc'
import { useSession } from 'next-auth/react'

export default function ModalDocIngresoSalida({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: DataDocIngresoSalida | undefined
}) {
  const nro_doc = getNroDoc({
    tipo_documento: data?.tipo_documento,
    serie: data?.serie ?? 0,
    numero: data?.numero ?? 0,
  })

  const { data: session } = useSession()
  const empresa = session?.user.empresa

  return (
    <ModalShowDoc open={open} setOpen={setOpen} nro_doc={nro_doc}>
      <DocIngresoSalida data={data} nro_doc={nro_doc} empresa={empresa} />
    </ModalShowDoc>
  )
}
