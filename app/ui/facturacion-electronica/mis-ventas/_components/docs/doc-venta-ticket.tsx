'use client'

import { Text, View } from '@react-pdf/renderer'
import DocGeneralTicket from '~/app/_components/docs/doc-general-ticket'
import DocInfoClienteTicket from '~/app/_components/docs/doc-info-cliente-ticket'
import DocMetodosPagoTicket from '~/app/_components/docs/doc-metodos-pago-ticket'
import { styles_ticket } from '~/app/_components/docs/styles'
import { EmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'
import { ColDef } from 'ag-grid-community'
import { ProductoVentaPDF, VentaDataPDF } from './doc-venta'
import { TipoDocumento } from '@prisma/client'
import { TiposDocumentos } from '~/lib/docs'

// ============= COMPONENT =============

export default function DocVentaTicket({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
  estilosCampos,
}: {
  data: VentaDataPDF | undefined
  nro_doc: string
  empresa: EmpresaPublica | undefined
  show_logo_html?: boolean
  estilosCampos?: Record<string, { fontFamily?: string; fontSize?: number; fontWeight?: string }>
}) {
  if (!data) return null

  // Normalizar forma_de_pago para comparaciones
  const esCredito = data.forma_de_pago === 'cr' || data.forma_de_pago === 'Crédito'
  const esContado = data.forma_de_pago === 'co' || data.forma_de_pago === 'Contado'
  
  // Texto a mostrar
  const formaPagoTexto = esCredito ? 'CRÉDITO' : esContado ? 'CONTADO' : (data.forma_de_pago || '-')

  // Función para obtener estilos de un campo
  const getEstiloCampo = (campo: string) => {
    const estilo = estilosCampos?.[campo] || { fontFamily: 'Arial', fontSize: 7, fontWeight: 'normal' }
    
    // React PDF no reconoce "Arial", usar Helvetica o no especificar fontFamily
    const fontFamily = estilo.fontFamily === 'Arial' ? undefined : 
                       estilo.fontFamily === 'Times New Roman' ? 'Times-Roman' :
                       estilo.fontFamily === 'Courier New' ? 'Courier' :
                       estilo.fontFamily
    
    return {
      fontFamily,
      fontSize: estilo.fontSize || 5, // Usar 5 si no hay tamaño personalizado
      fontWeight: estilo.fontWeight || 'normal',
    }
  }

  // Definir columnas para la tabla de productos (formato ticket)
  const colDefs: ColDef<ProductoVentaPDF>[] = [
    {
      headerName: 'Cant.',
      field: 'cantidad',
      width: 25,
      minWidth: 25,
    },
    {
      headerName: 'Unidad Derivada',
      field: 'unidad',
      width: 30,
      minWidth: 30,
    },
    {
      headerName: 'Descripción',
      field: 'descripcion',
      flex: 1,
      minWidth: 60,
    },
    {
      headerName: 'P.U.',
      field: 'precio_unitario',
      width: 30,
      minWidth: 30,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return !isNaN(num) ? num.toFixed(2) : '0.00'
      },
    },
    {
      headerName: 'Subt.',
      field: 'subtotal',
      width: 35,
      minWidth: 35,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return !isNaN(num) ? num.toFixed(2) : '0.00'
      },
    },
  ]

  // Preparar empresa con logo URL
  const empresaConLogo = empresa ? {
    ...empresa,
    logo: getLogoUrl(empresa.logo),
  } : undefined

  return (
    <DocGeneralTicket
      empresa={empresaConLogo as any}
      show_logo_html={show_logo_html}
      tipo_documento={getTipoDocumentoLabel(data.tipo_documento)}
      nro_doc={nro_doc}
      colDefs={colDefs}
      rowData={data.productos}
      total={data.total}
      observaciones={data.observaciones || '-'}
      headerNameAl100='Descripción'
      totalConLetras
      getEstiloCampo={getEstiloCampo}
      total_descuento={data.total_descuento}
      op_gravada={data.op_gravada}
      subtotal={data.subtotal}
      igv={data.igv}
    >
      {/* Información de la Venta */}
      <View style={{ marginBottom: 2 }}>
        <View
          style={{
            ...styles_ticket.sectionInformacionGeneral,
            paddingBottom: 12,
          }}
        >
          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
            
            {/* Forma de Pago - Ocupa todo el ancho */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Forma Pago:
              </Text>
              <Text style={{
                ...styles_ticket.textValueSubSectionInformacionGeneral,
                ...getEstiloCampo('forma_pago')
              }}>
                {formaPagoTexto}
              </Text>
            </View>

            {/* Fecha de Emisión y Hora - 2 columnas */}
            <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
              {/* Columna Izquierda: Fecha de Emisión */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  F. Emisión:
                </Text>
                <Text style={getEstiloCampo('fecha')}>
                  {new Date(data.fecha).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              {/* Columna Derecha: Hora */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Hora:
                </Text>
                <Text style={getEstiloCampo('hora')}>
                  {new Date(data.fecha).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            {/* F. Vencimiento y N° Guía - 2 columnas (solo si es crédito) */}
            {esCredito && (
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
                {/* Columna Izquierda: F. Vencimiento */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                    F. Vencimiento:
                  </Text>
                  <Text style={getEstiloCampo('fecha_vencimiento')}>
                    {data.fecha_vencimiento 
                      ? new Date(data.fecha_vencimiento).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '-'}
                  </Text>
                </View>

                {/* Columna Derecha: N° Guía */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                    N° Guía:
                  </Text>
                  <Text style={getEstiloCampo('numero_guia')}>
                    {data.numero_guia || '-'}
                  </Text>
                </View>
              </View>
            )}

            {/* N° Guía solo (cuando NO es crédito) */}
            {!esCredito && (
              <View style={styles_ticket.subSectionInformacionGeneral}>
                <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                  N° Guía:
                </Text>
                <Text style={{
                  ...styles_ticket.textValueSubSectionInformacionGeneral,
                  ...getEstiloCampo('numero_guia')
                }}>
                  {data.numero_guia || '-'}
                </Text>
              </View>
            )}

            {/* Vendedor - Ocupa todo el ancho */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Vendedor:
              </Text>
              <Text style={{
                ...styles_ticket.textValueSubSectionInformacionGeneral,
                ...getEstiloCampo('vendedor')
              }}>
                {data.vendedor || '-'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Información del Cliente - Componente Reutilizable */}
      <DocInfoClienteTicket
        cliente={data.cliente}
        getEstiloCampo={getEstiloCampo}
      />

      {/* Métodos de Pago - Componente Reutilizable */}
      <DocMetodosPagoTicket
        metodos_de_pago={data.metodos_de_pago || []}
        getEstiloCampo={getEstiloCampo}
      />
    </DocGeneralTicket>
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
 * Obtiene el label del tipo de documento usando TiposDocumentos
 */
function getTipoDocumentoLabel(laravelCode: string): string {
  const tipoDocEnum = mapLaravelTipoDocumentoToPrisma(laravelCode)
  return TiposDocumentos[tipoDocEnum].name.toUpperCase()
}
