import { useState } from 'react'
import { Spin, Modal } from 'antd'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocGuia from '../docs/doc-guia'
import DocGuiaTicket from '../docs/doc-guia-ticket'
import { useEmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'
import type { GuiaRemision } from '~/lib/api/guia-remision'

export default function ModalDocGuia({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: GuiaRemision | undefined
}) {
  const { data: empresa, isLoading } = useEmpresaPublica()
  const [esTicket, setEsTicket] = useState(true)

  const serie = data?.serie ?? 'T001'
  const numero = String(data?.numero ?? '0').padStart(8, '0')
  const nroDoc = `${serie}-${numero}`

  const empresaConLogo = empresa
    ? { ...empresa, logo: getLogoUrl(empresa.logo) }
    : undefined

  if (isLoading) {
    return (
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} centered>
        <div className='flex items-center justify-center py-8'>
          <Spin size='large' />
          <span className='ml-3'>Cargando datos de empresa...</span>
        </div>
      </Modal>
    )
  }

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={nroDoc}
      setEsTicket={setEsTicket}
      esTicket={esTicket}
    >
      {esTicket ? (
        <DocGuiaTicket guia={data} empresa={empresaConLogo as any} />
      ) : (
        <DocGuia guia={data} empresa={empresaConLogo as any} />
      )}
    </ModalShowDoc>
  )
}
