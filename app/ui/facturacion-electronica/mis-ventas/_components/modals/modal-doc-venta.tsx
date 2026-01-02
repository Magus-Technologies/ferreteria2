import { useState } from 'react'
import { Spin, Modal } from 'antd'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocVenta, { VentaDataPDF, ProductoVentaPDF } from '../docs/doc-venta'
import DocVentaTicket from '../docs/doc-venta-ticket'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { TipoDocumento } from '@prisma/client'
import { TiposDocumentos } from '~/lib/docs'

// ============= TYPES =============

// Tipo para la venta completa que viene de Laravel
export interface VentaResponse {
  id: number
  numero: string
  fecha: string
  tipo_documento: string
  serie_documento?: {
    serie: string
  }
  // Cliente puede ser null para "CLIENTE VARIOS"
  cliente?: {
    numero_documento: string
    razon_social?: string
    nombres?: string
    apellidos?: string
    direccion?: string
  } | null
  // Campos alternativos cuando no hay cliente
  ruc_dni?: string
  cliente_nombre?: string
  // Laravel serializa relaciones en snake_case
  productos_por_almacen?: Array<{
    producto_almacen: {
      producto: {
        cod_producto: string
        name: string
      }
    }
    unidades_derivadas: Array<{
      cantidad: number | string
      precio: number | string
      factor: number | string
      recargo?: number | string
      descuento?: number | string
      descuento_tipo?: string
      unidad_derivada_inmutable: {
        name: string
      }
    }>
  }>
  despliegue_de_pago_ventas?: Array<{
    despliegue_de_pago: {
      name: string
    }
    monto: number | string
    referencia?: string
    recibe_efectivo?: number | string
  }>
  observaciones?: string
  // NOTA: subtotal, igv y total NO vienen del backend, se calculan en transformVentaData
}

// ============= COMPONENT =============

export default function ModalDocVenta({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: VentaResponse | undefined
}) {
  const { data: empresa, isLoading } = useEmpresaPublica()
  const [esTicket, setEsTicket] = useState(true)

  // Generar número de documento usando TiposDocumentos
  const nro_doc = data
    ? `${getTipoDocumentoCodSerie(data.tipo_documento)}${data.serie_documento?.serie || ''}-${data.numero.toString().padStart(4, '0')}`
    : ''

  // Transformar datos de Laravel a formato PDF
  const ventaDataPDF: VentaDataPDF | undefined = data ? transformVentaData(data) : undefined

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
    >
      {esTicket ? (
        <DocVentaTicket
          data={ventaDataPDF}
          nro_doc={nro_doc}
          empresa={empresa}
        />
      ) : (
        <DocVenta
          data={ventaDataPDF}
          nro_doc={nro_doc}
          empresa={empresa}
        />
      )}
    </ModalShowDoc>
  )
}

// ============= HELPERS =============

/**
 * Mapea el código de tipo de documento de Laravel al enum de Prisma
 */
function mapLaravelTipoDocumentoToPrisma(laravelCode: string): TipoDocumento {
  const mapping: Record<string, TipoDocumento> = {
    '01': TipoDocumento.Factura,
    '03': TipoDocumento.Boleta,
    'nv': TipoDocumento.NotaDeVenta,
    'in': TipoDocumento.Ingreso,
    'sa': TipoDocumento.Salida,
    'rc': TipoDocumento.RecepcionAlmacen,
  }
  return mapping[laravelCode] || TipoDocumento.NotaDeVenta
}

/**
 * Obtiene el código de serie según el tipo de documento usando TiposDocumentos
 */
function getTipoDocumentoCodSerie(laravelCode: string): string {
  const tipoDocEnum = mapLaravelTipoDocumentoToPrisma(laravelCode)
  return TiposDocumentos[tipoDocEnum].cod_serie
}

/**
 * Transforma la respuesta de Laravel al formato esperado por los componentes PDF
 */
function transformVentaData(venta: VentaResponse): VentaDataPDF {
  // Calcular total según la lógica de Laravel (VentaController::getTotalVenta)
  let totalCalculado = 0

  // Transformar productos_por_almacen a formato plano
  const productos: ProductoVentaPDF[] = venta.productos_por_almacen?.flatMap(
    (productoAlmacen) => {
      return productoAlmacen.unidades_derivadas.map((ud) => {
        const cantidad = Number(ud.cantidad ?? 0)
        const factor = Number(ud.factor ?? 0)
        const precio = Number(ud.precio ?? 0)
        const recargo = Number(ud.recargo ?? 0)
        const descuento = Number(ud.descuento ?? 0)

        // Calcular subtotal de la línea (igual que Laravel)
        const subtotalLinea = precio * cantidad * factor
        const subtotalConRecargo = subtotalLinea + recargo

        // Aplicar descuento
        let montoLinea = subtotalConRecargo
        if (ud.descuento_tipo === '%' || ud.descuento_tipo === 'porcentaje') {
          montoLinea = subtotalConRecargo - (subtotalConRecargo * descuento / 100)
        } else {
          montoLinea = subtotalConRecargo - descuento
        }

        totalCalculado += montoLinea

        return {
          codigo: productoAlmacen.producto_almacen.producto.cod_producto,
          descripcion: productoAlmacen.producto_almacen.producto.name,
          cantidad: cantidad,
          unidad: ud.unidad_derivada_inmutable.name,
          precio_unitario: precio,
          subtotal: montoLinea,
        }
      })
    }
  ) || []

  // El backend NO retorna subtotal, igv, total - debemos calcularlos
  const total = totalCalculado

  // Calcular subtotal e IGV (18% en Perú)
  const subtotal = total / 1.18
  const igv = total - subtotal

  // Manejar cliente: si no hay cliente o es null, usar "CLIENTE VARIOS"
  const clienteData = venta.cliente || {
    numero_documento: venta.ruc_dni || '99999999',
    razon_social: venta.cliente_nombre || 'CLIENTE VARIOS',
  }

  // Transformar despliegue_de_pago_ventas a metodos_de_pago
  const metodos_de_pago = venta.despliegue_de_pago_ventas?.map((dp) => ({
    forma_de_pago: dp.despliegue_de_pago.name,
    monto: Number(dp.monto),
  }))

  return {
    id: venta.id,
    numero: venta.numero,
    fecha: venta.fecha,
    tipo_documento: venta.tipo_documento,
    cliente: clienteData,
    productos,
    metodos_de_pago,
    subtotal,
    igv,
    total,
    observaciones: venta.observaciones,
  }
}
