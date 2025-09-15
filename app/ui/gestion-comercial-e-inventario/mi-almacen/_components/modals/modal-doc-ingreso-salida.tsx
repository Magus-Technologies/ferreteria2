import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocIngresoSalida, {
  DataDocIngresoSalida,
} from '../docs/doc-ingreso-salida'
import { TiposDocumentos } from '~/lib/docs'
import { useJSXToPdf } from '~/hooks/use-react-to-pdf'

export default function ModalDocIngresoSalida({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: DataDocIngresoSalida | undefined
}) {
  const nro_doc = data?.tipo_documento
    ? `${TiposDocumentos[data.tipo_documento].cod_serie}${data.serie
        .toString()
        .padStart(2, '0')}-${data.numero.toString().padStart(4, '0')}`
    : ''

  const { download, print, share } = useJSXToPdf({
    jsx: <DocIngresoSalida data={data} nro_doc={nro_doc} />,
    name: nro_doc,
  })

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      title={`Documento Nro: ${nro_doc}`}
      handlePdf={download}
      handleShare={share}
      handlePrint={print}
    >
      <DocIngresoSalida data={data} nro_doc={nro_doc} />
    </ModalShowDoc>
  )
}
