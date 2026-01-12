'use client'

import { Text, View } from '@react-pdf/renderer'
import DocGeneralTicket from '~/app/_components/docs/doc-general-ticket'
import { styles_ticket } from '~/app/_components/docs/styles'
import { EmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'
import { ColDef } from 'ag-grid-community'
import { ProductoCotizacionPDF, CotizacionDataPDF } from './doc-cotizacion'

// ============= COMPONENT =============

export default function DocCotizacionTicket({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
  estilosCampos,
}: {
  data: CotizacionDataPDF | undefined
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
  const colDefs: ColDef<ProductoCotizacionPDF>[] = [
    {
      headerName: 'Cant.',
      field: 'cantidad',
      width: 30,
      minWidth: 30,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return !isNaN(num) ? num.toFixed(0) : '0'
      },
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
      tipo_documento="PROFORMA"
      nro_doc={nro_doc}
      colDefs={colDefs}
      rowData={data.productos}
      total={data.total}
      observaciones={data.observaciones || '-'}
      headerNameAl100='Descripción'
      totalConLetras
      getEstiloCampo={getEstiloCampo}
    >
      {/* Información del Cliente y Cotización */}
      <View style={{ marginBottom: 2 }}>
        <View
          style={{
            ...styles_ticket.sectionInformacionGeneral,
            paddingBottom: 12,
          }}
        >
          {/* UNA SOLA COLUMNA AL 100% */}
          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
            {/* Fecha de Emisión y F. Vencimiento en la misma fila */}
            <View style={{ display: 'flex', flexDirection: 'row', gap: 4, width: '100%' }}>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, flex: 1 }}>
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
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, flex: 1 }}>
                <Text style={{ fontSize: 5, fontWeight: 'bold', textTransform: 'uppercase' }}>
                  F. Vencimiento:
                </Text>
                <Text style={getEstiloCampo('fecha_vencimiento')}>
                  {new Date(data.fecha_vencimiento).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
              </View>
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
                <Text
                  style={{
                    ...getEstiloCampo('cliente_direccion'),
                    flex: 1,
                  }}
                >
                  {data.cliente.direccion}
                </Text>
              </View>
            )}

            {/* Vendedor */}
            <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
              <Text style={{ fontSize: 5, fontWeight: 'bold', textTransform: 'uppercase' }}>
                Vendedor:
              </Text>
              <Text style={getEstiloCampo('vendedor')}>
                {data.vendedor}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Totales: Subtotal, Descuento, Total */}
      <View style={{ marginBottom: 8, paddingHorizontal: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottom: '1px solid #ccc' }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold' }}>SUBTOTAL:</Text>
          <Text style={getEstiloCampo('subtotal')}>S/ {data.subtotal.toFixed(2)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottom: '1px solid #ccc' }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold' }}>T. DESCUENTO:</Text>
          <Text style={getEstiloCampo('total_descuento')}>S/ {data.total_descuento.toFixed(2)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, backgroundColor: '#f0f0f0', paddingHorizontal: 2 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold' }}>TOTAL:</Text>
          <Text style={{...getEstiloCampo('total'), fontSize: 9}}>S/ {data.total.toFixed(2)}</Text>
        </View>
      </View>
    </DocGeneralTicket>
  )
}
