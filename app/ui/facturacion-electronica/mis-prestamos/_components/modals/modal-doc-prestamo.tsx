import { useState } from 'react'
import { Spin, Modal } from 'antd'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocPrestamo, { PrestamoDataPDF, ProductoPrestamoPDF } from '../docs/doc-prestamo'
import DocPrestamoTicket from '../docs/doc-prestamo-ticket'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'

// ============= TYPES =============

// Tipo para el préstamo completo que viene de Laravel
export interface PrestamoResponse {
  id: string | number // Laravel retorna string, pero acepta number también
  numero: string
  fecha: string
  tipo_operacion: string
  tipo_entidad: string
  cliente?: {
    numero_documento: string
    razon_social?: string | null
    nombres?: string | null
    apellidos?: string | null
    direccion?: string | null
  } | null
  proveedor?: {
    numero_documento: string
    razon_social?: string | null
    nombres?: string | null
    apellidos?: string | null
    direccion?: string | null
  } | null
  productos_por_almacen?: Array<{
    producto_almacen?: {
      producto?: {
        cod_producto: string | null
        name: string
      }
    }
    unidades_derivadas?: Array<{
      cantidad: number | string
      costo?: number | string
      factor: number | string
      unidad_derivada_inmutable?: {
        name: string
      }
      unidad_derivada?: {
        name: string
      }
    }>
  }>
  monto_total: number | string
  garantia?: string | null
  observaciones?: string | null
  user?: {
    name: string
  }
}

// ============= COMPONENT =============

export default function ModalDocPrestamo({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: PrestamoResponse | undefined
}) {
  const { data: empresa, isLoading } = useEmpresaPublica()
  const [esTicket, setEsTicket] = useState(true)

  // Generar número de documento
  const nro_doc = data ? data.numero : ''

  // Transformar datos de Laravel a formato PDF
  const prestamoDataPDF: PrestamoDataPDF | undefined = data ? transformPrestamoData(data) : undefined

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
      tipoDocumento='prestamo'
    >
      {esTicket ? (
        <DocPrestamoTicket
          data={prestamoDataPDF}
          nro_doc={nro_doc}
          empresa={empresa}
        />
      ) : (
        <DocPrestamo
          data={prestamoDataPDF}
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
function transformPrestamoData(prestamo: PrestamoResponse): PrestamoDataPDF {
  // Determinar la entidad (cliente o proveedor)
  const entidad = prestamo.cliente || prestamo.proveedor

  if (!entidad) {
    throw new Error('No se encontró información de cliente o proveedor')
  }

  // Transformar productos_por_almacen a formato plano
  const productos: ProductoPrestamoPDF[] = prestamo.productos_por_almacen?.flatMap(
    (productoAlmacen) => {
      // Validar que producto_almacen y producto existan
      if (!productoAlmacen?.producto_almacen?.producto) {
        return []
      }

      return productoAlmacen.unidades_derivadas?.map((ud) => {
        const cantidad = Number(ud.cantidad ?? 0)
        const factor = Number(ud.factor ?? 0)
        const costo = Number(ud.costo ?? 0)

        // Calcular importe (cantidad * factor * costo)
        const importe = cantidad * factor * costo

        return {
          codigo: productoAlmacen.producto_almacen?.producto?.cod_producto || '',
          descripcion: productoAlmacen.producto_almacen?.producto?.name || 'Sin nombre',
          cantidad: cantidad,
          unidad: ud.unidad_derivada_inmutable?.name || ud.unidad_derivada?.name || 'UND',
          costo: costo,
          importe: importe,
        }
      }) || []
    }
  ) || []

  return {
    id: typeof prestamo.id === 'string' ? parseInt(prestamo.id) : prestamo.id,
    numero: prestamo.numero,
    fecha: prestamo.fecha,
    tipo_operacion: prestamo.tipo_operacion,
    tipo_entidad: prestamo.tipo_entidad,
    entidad: entidad,
    productos,
    monto_total: Number(prestamo.monto_total ?? 0),
    observaciones: prestamo.observaciones || null,
    garantia: prestamo.garantia || null,
    usuario: prestamo.user?.name || 'Sin usuario',
  }
}
