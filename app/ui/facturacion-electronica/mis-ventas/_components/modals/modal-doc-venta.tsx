import { useState, useMemo } from 'react'
import { Spin, Modal } from 'antd'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocVenta, { VentaDataPDF, ProductoVentaPDF } from '../docs/doc-venta'
import DocVentaTicket from '../docs/doc-venta-ticket'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { TipoDocumento } from '@prisma/client'
import { TiposDocumentos } from '~/lib/docs'
import { useConfiguracionImpresion } from '~/hooks/use-configuracion-impresion'

// ============= TYPES =============

// Tipo para la venta completa que viene de Laravel
export interface VentaResponse {
  id: number
  numero: string
  fecha: string
  tipo_documento: string
  forma_de_pago?: string
  fecha_vencimiento?: string
  numero_guia?: string
  direccion_seleccionada?: 'D1' | 'D2' | 'D3' | 'D4' // Nueva: dirección seleccionada
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
    direccion_2?: string
    direccion_3?: string
    direccion_4?: string
    telefono?: string
  } | null
  // Usuario/Vendedor
  user?: {
    id: string
    name: string
  }
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

  // Obtener configuraciones de estilos
  const { getConfiguracionCampo } = useConfiguracionImpresion({ 
    tipoDocumento: 'venta',
    enabled: open,
  })

  // Preparar estilos para pasar al PDF
  const estilosCampos = useMemo(() => {
    const campos = [
      'fecha', 'hora', 'numero_documento', 'empresa_nombre', 'empresa_ruc', 'empresa_direccion',
      'forma_pago', 'fecha_vencimiento', 'numero_guia', 'vendedor',
      'cliente_nombre', 'cliente_documento', 'cliente_direccion',
      'tabla_codigo', 'tabla_descripcion', 'tabla_cantidad', 'tabla_precio', 'tabla_subtotal',
      'subtotal', 'igv', 'total', 'metodo_pago'
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
      tipoDocumento='venta'
    >
      {esTicket ? (
        <DocVentaTicket
          data={ventaDataPDF}
          nro_doc={nro_doc}
          empresa={empresa}
          estilosCampos={estilosCampos}
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
  let totalDescuentos = 0

  // Transformar productos_por_almacen a formato plano
  const productos: ProductoVentaPDF[] = venta.productos_por_almacen?.flatMap(
    (productoAlmacen) => {
      return productoAlmacen.unidades_derivadas.map((ud) => {
        const cantidad = Number(ud.cantidad ?? 0)
        const precio = Number(ud.precio ?? 0)
        const recargo = Number(ud.recargo ?? 0)
        const descuento = Number(ud.descuento ?? 0)

        // Calcular subtotal de la línea
        // NOTA: El precio ya es el precio de venta final de esa unidad derivada específica
        // NO multiplicar por factor porque eso duplicaría el cálculo
        const subtotalLinea = precio * cantidad
        const subtotalConRecargo = subtotalLinea + recargo

        // Calcular descuento aplicado
        let descuentoAplicado = 0
        if (ud.descuento_tipo === '%') {
          descuentoAplicado = subtotalConRecargo * descuento / 100
        } else {
          descuentoAplicado = descuento
        }
        
        totalDescuentos += descuentoAplicado

        // Aplicar descuento
        const montoLinea = subtotalConRecargo - descuentoAplicado

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
  
  // Op. Gravada es el subtotal (base imponible)
  const op_gravada = subtotal

  // Manejar cliente: si no hay cliente o es null, usar "CLIENTE VARIOS"
  const clienteData = venta.cliente || {
    numero_documento: venta.ruc_dni || '99999999',
    razon_social: venta.cliente_nombre || 'CLIENTE VARIOS',
  }

  // Determinar qué dirección usar según direccion_seleccionada
  let direccionFinal = clienteData.direccion || ''
  
  if (venta.cliente && venta.direccion_seleccionada) {
    const clienteConDirecciones = venta.cliente as any;
    if (clienteConDirecciones.direcciones && Array.isArray(clienteConDirecciones.direcciones)) {
      const direcciones = clienteConDirecciones.direcciones;
      const direccionSeleccionada = direcciones.find((d: any) => d.tipo === venta.direccion_seleccionada);
      direccionFinal = direccionSeleccionada?.direccion || '';
      
      // Fallback: si no se encuentra, usar la principal o la primera
      if (!direccionFinal) {
        const principal = direcciones.find((d: any) => d.es_principal);
        direccionFinal = principal?.direccion || direcciones[0]?.direccion || '';
      }
    }
  }

  // Crear objeto cliente con la dirección correcta
  const clienteConDireccionCorrecta = {
    ...clienteData,
    direccion: direccionFinal,
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
    forma_de_pago: venta.forma_de_pago,
    fecha_vencimiento: venta.fecha_vencimiento,
    numero_guia: venta.numero_guia,
    vendedor: venta.user?.name,
    cliente: clienteConDireccionCorrecta,
    productos,
    metodos_de_pago,
    subtotal,
    igv,
    total,
    total_descuento: totalDescuentos > 0 ? totalDescuentos : undefined,
    op_gravada,
    observaciones: venta.observaciones,
  }
}

