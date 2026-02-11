'use client'

import { useState } from 'react'
import { Spin, Modal } from 'antd'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocAperturaTicket from '../docs/doc-apertura-ticket'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'

// ============= TYPES =============

export interface AperturaDataResponse {
  id: string | number  // Can be ULID string or number
  fecha_apertura: string
  estado: string
  monto_apertura: number
  conteo_apertura_billetes_monedas?: any  // Conteo a nivel de apertura
  caja_principal: {
    id: number
    codigo: string
    nombre: string
  }
  user: {
    id: string
    name: string
  }
  distribuciones_vendedores?: Array<{
    vendedor_id: string
    vendedor: string
    monto: number
    conteo_billetes_monedas?: any  // Conteo individual por vendedor
  }>
}

// ============= COMPONENT =============

export default function ModalTicketApertura({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: AperturaDataResponse | undefined
}) {
  console.log('🎫 MODAL TICKET: Renderizando con open=', open, 'data=', data)
  
  const { data: empresa, isLoading } = useEmpresaPublica()

  // Generar número de documento
  const nro_doc = data
    ? `APERTURA-${typeof data.id === 'number' ? data.id.toString().padStart(6, '0') : data.id}`
    : ''

  // Mostrar loading mientras carga empresa O mientras no hay datos
  if (isLoading || !data || !data.id) {
    return (
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        centered
      >
        <div className="flex items-center justify-center py-8">
          <Spin size="large" />
          <span className="ml-3">Cargando...</span>
        </div>
      </Modal>
    )
  }

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={nro_doc}
      tipoDocumento='apertura_caja'
      esTicket={true}
      aperturaId={data.id}
    >
      <DocAperturaTicket
        data={data}
        nro_doc={nro_doc}
        empresa={empresa}
      />
    </ModalShowDoc>
  )
}
