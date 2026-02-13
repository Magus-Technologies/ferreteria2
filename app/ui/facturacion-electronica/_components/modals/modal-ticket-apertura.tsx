'use client'

import { Spin, Modal } from 'antd'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocAperturaTicket from '../docs/doc-apertura-ticket'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { AperturaYCierreCaja } from '~/lib/api/caja'

// ============= TYPES =============

export interface AperturaDataResponse {
  id: string | number
  fecha_apertura: string
  estado: string
  monto_apertura: number
  conteo_apertura_billetes_monedas?: any
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
    vendedor_nombre: string
    monto_asignado: number
    conteo_billetes_monedas?: any
  }>
}

// ============= COMPONENT =============

export default function ModalTicketApertura({
  open,
  onClose,
  apertura,
  vendedorSeleccionado,
}: {
  open: boolean
  onClose: () => void
  apertura: AperturaYCierreCaja | null
  vendedorSeleccionado?: any
}) {
  console.log('🎫 MODAL TICKET: Renderizando con open=', open, 'apertura=', apertura, 'vendedor=', vendedorSeleccionado)
  
  const { data: empresa, isLoading } = useEmpresaPublica()

  // Transformar datos de apertura al formato esperado por el PDF
  const data: AperturaDataResponse | undefined = apertura ? {
    id: apertura.id,
    fecha_apertura: apertura.fecha_apertura,
    estado: apertura.estado,
    monto_apertura: typeof apertura.monto_apertura === 'string' 
      ? parseFloat(apertura.monto_apertura) 
      : apertura.monto_apertura,
    conteo_apertura_billetes_monedas: (apertura as any).conteo_billetes_monedas,
    caja_principal: {
      id: apertura.caja_principal?.id || 0,
      codigo: apertura.caja_principal?.codigo || '',
      nombre: apertura.caja_principal?.nombre || '',
    },
    user: {
      id: apertura.user?.id || '',
      name: apertura.user?.name || '',
    },
    distribuciones_vendedores: apertura.distribuciones_vendedores?.map(dist => ({
      vendedor_id: dist.vendedor_id,
      vendedor_nombre: dist.vendedor,
      monto_asignado: typeof dist.monto === 'string'
        ? parseFloat(dist.monto)
        : parseFloat(dist.monto),
      conteo_billetes_monedas: (dist as any).conteo_billetes_monedas,
    })),
  } : undefined

  // Generar número de documento
  const nro_doc = data
    ? `APERTURA-${typeof data.id === 'number' ? data.id.toString().padStart(6, '0') : data.id}`
    : ''

  // Mostrar loading mientras carga empresa O mientras no hay datos
  if (isLoading || !data || !data.id) {
    return (
      <Modal
        open={open}
        onCancel={onClose}
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

  // Si hay un vendedor seleccionado, filtrar los datos para mostrar solo ese vendedor
  let dataParaPDF = {
    ...data,
    distribuciones_vendedores: data.distribuciones_vendedores?.map(dist => ({
      vendedor: dist.vendedor_nombre,
      monto: dist.monto_asignado,
      conteo_billetes_monedas: dist.conteo_billetes_monedas,
    })),
  }

  if (vendedorSeleccionado) {
    console.log('🎯 Filtrando datos para vendedor específico:', vendedorSeleccionado)
    
    // Filtrar solo el vendedor seleccionado
    const vendedorData = data.distribuciones_vendedores?.find(
      dist => dist.vendedor_id === vendedorSeleccionado.vendedor_id
    )

    if (vendedorData) {
      dataParaPDF = {
        ...data,
        monto_apertura: vendedorData.monto_asignado,
        conteo_apertura_billetes_monedas: vendedorData.conteo_billetes_monedas,
        distribuciones_vendedores: [{
          vendedor: vendedorData.vendedor_nombre,
          monto: vendedorData.monto_asignado,
          conteo_billetes_monedas: vendedorData.conteo_billetes_monedas,
        }],
      }
    }
  }

  return (
    <ModalShowDoc
      open={open}
      setOpen={(isOpen) => !isOpen && onClose()}
      nro_doc={nro_doc}
      tipoDocumento='apertura_caja'
      esTicket={true}
      aperturaId={data.id}
    >
      <DocAperturaTicket
        data={dataParaPDF}
        nro_doc={nro_doc}
        empresa={empresa}
      />
    </ModalShowDoc>
  )
}
