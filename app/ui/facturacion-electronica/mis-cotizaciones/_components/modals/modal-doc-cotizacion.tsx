import { useState, useMemo } from 'react'
import { Spin, Modal } from 'antd'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocCotizacion, { CotizacionDataPDF, ProductoCotizacionPDF } from '../docs/doc-cotizacion'
import DocCotizacionTicket from '../docs/doc-cotizacion-ticket'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { useConfiguracionImpresion } from '~/hooks/use-configuracion-impresion'

// ============= TYPES =============

// Tipo para la cotización completa que viene de Laravel
export interface CotizacionResponse {
  id: string | number // Laravel retorna string, pero acepta number también
  numero: string
  fecha: string
  fecha_vencimiento: string
  cliente?: {
    numero_documento: string
    razon_social?: string | null
    nombres?: string | null
    apellidos?: string | null
    direccion?: string | null
    telefono?: string | null
    email?: string | null
  } | null
  ruc_dni?: string | null
  productos_por_almacen?: Array<{
    producto_almacen: {
      producto: {
        cod_producto: string | null
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
  user?: {
    name: string
  }
  vendedor?: string | null
}

// ============= COMPONENT =============

export default function ModalDocCotizacion({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: CotizacionResponse | undefined
}) {
  const { data: empresa, isLoading } = useEmpresaPublica()
  const [esTicket, setEsTicket] = useState(true)

  // Obtener configuraciones de impresión
  const { getConfiguracionCampo } = useConfiguracionImpresion({
    tipoDocumento: 'cotizacion',
    enabled: open,
  })

  // Crear objeto de estilos para pasar al componente PDF
  const estilosCampos = useMemo(() => {
    const campos = [
      'fecha', 'fecha_vencimiento', 'cliente_nombre', 'cliente_documento', 
      'cliente_direccion', 'vendedor', 'subtotal', 'total_descuento', 'total'
    ]
    const estilos: Record<string, { fontFamily?: string; fontSize?: number; fontWeight?: string }> = {}
    campos.forEach(campo => {
      const config = getConfiguracionCampo(campo)
      estilos[campo] = {
        fontFamily: config.font_family,
        fontSize: config.font_size,
        fontWeight: config.font_weight,
      }
    })
    return estilos
  }, [getConfiguracionCampo])

  // Generar número de documento
  const nro_doc = data ? data.numero : ''

  // Transformar datos de Laravel a formato PDF
  const cotizacionDataPDF: CotizacionDataPDF | undefined = data ? transformCotizacionData(data) : undefined

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
      tipoDocumento='cotizacion'
    >
      {esTicket ? (
        <DocCotizacionTicket
          data={cotizacionDataPDF}
          nro_doc={nro_doc}
          empresa={empresa}
          estilosCampos={estilosCampos}
        />
      ) : (
        <DocCotizacion
          data={cotizacionDataPDF}
          nro_doc={nro_doc}
          empresa={empresa}
          estilosCampos={estilosCampos}
        />
      )}
    </ModalShowDoc>
  )
}

// ============= HELPERS =============

/**
 * Transforma la respuesta de Laravel al formato esperado por los componentes PDF
 */
function transformCotizacionData(cotizacion: CotizacionResponse): CotizacionDataPDF {
  // Calcular totales según la lógica de Laravel
  let totalCalculado = 0
  let totalDescuento = 0

  // Transformar productos_por_almacen a formato plano
  const productos: ProductoCotizacionPDF[] = cotizacion.productos_por_almacen?.flatMap(
    (productoAlmacen) => {
      return productoAlmacen.unidades_derivadas.map((ud) => {
        const cantidad = Number(ud.cantidad ?? 0)
        const precio = Number(ud.precio ?? 0)
        const recargo = Number(ud.recargo ?? 0)
        const descuento = Number(ud.descuento ?? 0)

        // Calcular subtotal de la línea
        // La cantidad YA está en la unidad derivada seleccionada, NO multiplicar por factor
        const subtotalLinea = precio * cantidad
        const subtotalConRecargo = subtotalLinea + recargo

        // Aplicar descuento
        let montoLinea = subtotalConRecargo
        if (ud.descuento_tipo === '%') {
          montoLinea = subtotalConRecargo - (subtotalConRecargo * descuento / 100)
        } else {
          montoLinea = subtotalConRecargo - descuento
        }

        totalCalculado += montoLinea
        totalDescuento += descuento

        return {
          codigo: productoAlmacen.producto_almacen.producto.cod_producto || '',
          descripcion: productoAlmacen.producto_almacen.producto.name,
          cantidad: cantidad,
          unidad: ud.unidad_derivada_inmutable.name,
          precio_unitario: precio,
          descuento: descuento,
          subtotal: montoLinea,
        }
      })
    }
  ) || []

  // Calcular totales
  const subtotal = productos.reduce((sum, p) => sum + (p.precio_unitario * p.cantidad), 0)
  const total = totalCalculado

  // Manejar cliente: puede ser null, usar datos de ruc_dni si no existe
  const clienteData = cotizacion.cliente || {
    numero_documento: cotizacion.ruc_dni || '99999999',
    razon_social: 'CLIENTE VARIOS',
  }

  // Obtener nombre del vendedor
  const vendedorName = cotizacion.vendedor || cotizacion.user?.name || 'Sin vendedor'

  return {
    id: typeof cotizacion.id === 'string' ? parseInt(cotizacion.id) : cotizacion.id,
    numero: cotizacion.numero,
    fecha: cotizacion.fecha,
    fecha_vencimiento: cotizacion.fecha_vencimiento,
    cliente: clienteData,
    productos,
    subtotal,
    total_descuento: totalDescuento,
    total,
    observaciones: '-',
    vendedor: vendedorName,
  }
}

