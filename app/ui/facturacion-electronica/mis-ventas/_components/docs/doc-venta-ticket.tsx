'use client'

import { Text, View } from '@react-pdf/renderer'
import DocGeneralTicket from '~/app/_components/docs/doc-general-ticket'
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

  // Función para obtener estilos de un campo
  const getEstiloCampo = (campo: string) => {
    const estilo = estilosCampos?.[campo] || { fontFamily: 'Arial', fontSize: 8, fontWeight: 'normal' }
    
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
      width: 30,
      minWidth: 30,
    },
    {
      headerName: 'Descripción',
      field: 'descripcion',
      flex: 1,
      minWidth: 80,
    },
    {
      headerName: 'P.U.',
      field: 'precio_unitario',
      width: 35,
      minWidth: 35,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return !isNaN(num) ? num.toFixed(2) : '0.00'
      },
    },
    {
      headerName: 'Subt.',
      field: 'subtotal',
      width: 40,
      minWidth: 40,
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

  // Nombre del cliente
  const nombreCliente = data.cliente.razon_social ||
    `${data.cliente.nombres || ''} ${data.cliente.apellidos || ''}`.trim()

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
    >
      {/* Información del Cliente y Venta */}
      <View style={{ marginBottom: 2 }}>
        <View
          style={{
            ...styles_ticket.sectionInformacionGeneral,
            paddingBottom: 12,
          }}
        >
          {/* UNA SOLA COLUMNA AL 100% */}
          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
            {/* Fecha de Emisión */}
            <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
              <Text style={{ fontSize: 5, fontWeight: 'bold', textTransform: 'uppercase' }}>
                Fecha de Emisión:
              </Text>
              <Text style={getEstiloCampo('fecha')}>
                {new Date(data.fecha).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* RUC/DNI del Cliente */}
            <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
              <Text style={{ fontSize: 5, fontWeight: 'bold', textTransform: 'uppercase' }}>
                {data.cliente.numero_documento.length === 11 ? 'RUC:' : 'DNI:'}
              </Text>
              <Text style={getEstiloCampo('cliente_documento')}>
                {data.cliente.numero_documento}
              </Text>
            </View>

            {/* Cliente - Ocupa toda la fila */}
            <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
              <Text style={{ fontSize: 5, fontWeight: 'bold', textTransform: 'uppercase' }}>
                Cliente:
              </Text>
              <Text style={{
                ...getEstiloCampo('cliente_nombre'),
                flex: 1,
              }}>
                {nombreCliente}
              </Text>
            </View>

            {/* Dirección del Cliente - Ocupa toda la fila */}
            {data.cliente.direccion && (
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
                <Text style={{ fontSize: 5, fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Dirección:
                </Text>
                <Text style={{
                  ...getEstiloCampo('cliente_direccion'),
                  flex: 1,
                }}>
                  {data.cliente.direccion}
                </Text>
              </View>
            )}

            {/* Métodos de Pago */}
            {data.metodos_de_pago && data.metodos_de_pago.length > 0 && (
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
                <Text style={{ fontSize: 5, fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Forma de Pago:
                </Text>
                <View style={{ flex: 1 }}>
                  {data.metodos_de_pago.map((mp, index) => (
                    <Text
                      key={index}
                      style={getEstiloCampo('metodo_pago')}
                    >
                      {mp.forma_de_pago}: S/ {mp.monto.toFixed(2)}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Totales: Subtotal, IGV, Total */}
      <View style={{ marginBottom: 8, paddingHorizontal: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottom: '1px solid #ccc' }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold' }}>SUBTOTAL:</Text>
          <Text style={getEstiloCampo('subtotal')}>S/ {data.subtotal.toFixed(2)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottom: '1px solid #ccc' }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold' }}>IGV (18%):</Text>
          <Text style={getEstiloCampo('igv')}>S/ {data.igv.toFixed(2)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, backgroundColor: '#f0f0f0', paddingHorizontal: 2 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold' }}>TOTAL:</Text>
          <Text style={{...getEstiloCampo('total'), fontSize: 9}}>S/ {data.total.toFixed(2)}</Text>
        </View>
      </View>
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
