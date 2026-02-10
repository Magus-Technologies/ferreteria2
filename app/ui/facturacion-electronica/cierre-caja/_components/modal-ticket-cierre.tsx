'use client'

import { useState } from 'react'
import { Spin, Modal } from 'antd'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocCierreCaja, { CierreCajaDataPDF } from './docs/doc-cierre-caja'
import DocCierreCajaTicket from './docs/doc-cierre-caja-ticket'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'

// ============= TYPES =============

// Tipo para la caja activa que viene de Laravel
export interface CajaActivaResponse {
  id: number
  fecha_apertura: string
  fecha_cierre?: string
  estado: string
  caja_principal: {
    name: string
  }
  user: {
    name: string
  }
  supervisor?: {
    name: string
  }
  resumen: {
    efectivo_inicial: number
    detalle_metodos_pago: Array<{
      label: string
      cantidad_transacciones: number
      total: number
    }>
    total_ventas: number
    total_ingresos: number
    total_egresos: number
    total_prestamos_recibidos: number
    total_prestamos_dados: number
    monto_esperado: number
    prestamos_recibidos?: any[]
    prestamos_dados?: any[]
    movimientos_internos?: any[]
  }
  monto_cierre_efectivo?: number
  total_cuentas?: number
  comentarios?: string
}

// ============= COMPONENT =============

export default function ModalTicketCierre({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: CajaActivaResponse | undefined
}) {
  const { data: empresa, isLoading } = useEmpresaPublica()
  const [esTicket, setEsTicket] = useState(true)

  // Generar número de documento
  const nro_doc = data
    ? `CIERRE-${data.id.toString().padStart(6, '0')}`
    : ''

  // Transformar datos de Laravel a formato PDF
  const cierreDataPDF: CierreCajaDataPDF | undefined = data ? transformCierreData(data) : undefined

  // Mostrar loading mientras carga empresa
  if (isLoading) {
    return (
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        centered
      >
        <div className="flex items-center justify-center py-8">
          <Spin size="large" />
          <span className="ml-3">Cargando datos de empresa...</span>
        </div>
      </Modal>
    )
  }

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={nro_doc}
      setEsTicket={setEsTicket}
      esTicket={esTicket}
      tipoDocumento='cierre_caja'
    >
      {esTicket ? (
        <DocCierreCajaTicket
          data={cierreDataPDF}
          nro_doc={nro_doc}
          empresa={empresa}
        />
      ) : (
        <DocCierreCaja
          data={cierreDataPDF}
          nro_doc={nro_doc}
          empresa={empresa}
        />
      )}
    </ModalShowDoc>
  )
}

// ============= HELPERS =============

/**
 * Transforma la respuesta de Laravel al formato esperado por los componentes PDF
 */
function transformCierreData(caja: CajaActivaResponse): CierreCajaDataPDF {
  return {
    id: caja.id,
    fecha_apertura: caja.fecha_apertura,
    fecha_cierre: caja.fecha_cierre,
    estado: caja.estado,
    caja_principal: caja.caja_principal,
    user: caja.user,
    supervisor: caja.supervisor,
    resumen: {
      efectivo_inicial: Number(caja.resumen.efectivo_inicial || 0),
      detalle_metodos_pago: caja.resumen.detalle_metodos_pago?.map(m => ({
        label: m.label,
        cantidad_transacciones: Number(m.cantidad_transacciones || 0),
        total: Number(m.total || 0),
      })) || [],
      total_ventas: Number(caja.resumen.total_ventas || 0),
      total_ingresos: Number(caja.resumen.total_ingresos || 0),
      total_egresos: Number(caja.resumen.total_egresos || 0),
      total_prestamos_recibidos: Number(caja.resumen.total_prestamos_recibidos || 0),
      total_prestamos_dados: Number(caja.resumen.total_prestamos_dados || 0),
      monto_esperado: Number(caja.resumen.monto_esperado || 0),
      prestamos_recibidos: caja.resumen.prestamos_recibidos,
      prestamos_dados: caja.resumen.prestamos_dados,
      movimientos_internos: caja.resumen.movimientos_internos,
    },
    monto_cierre_efectivo: caja.monto_cierre_efectivo !== undefined ? Number(caja.monto_cierre_efectivo) : undefined,
    total_cuentas: caja.total_cuentas !== undefined ? Number(caja.total_cuentas) : undefined,
    comentarios: caja.comentarios,
  }
}
