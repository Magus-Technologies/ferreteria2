'use client'

import { Text, View } from '@react-pdf/renderer'
import DocGeneral from '~/app/_components/docs/doc-general'
import { styles_docs } from '~/app/_components/docs/styles'
import { EmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'
import { ColDef } from 'ag-grid-community'

// ============= TYPES =============

export interface ProductoCotizacionPDF {
  codigo: string
  descripcion: string
  cantidad: number
  unidad: string
  precio_unitario: number
  descuento: number
  subtotal: number
}

export interface CotizacionDataPDF {
  id: number
  numero: string
  fecha: string
  fecha_vencimiento: string
  cliente: {
    numero_documento: string
    razon_social?: string | null
    nombres?: string | null
    apellidos?: string | null
    direccion?: string | null
  }
  productos: ProductoCotizacionPDF[]
  subtotal: number
  total_descuento: number
  total: number
  observaciones?: string
  vendedor: string
}

// ============= COMPONENT =============

export default function DocCotizacion({
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
      fontSize: estilo.fontSize,
      fontWeight: estilo.fontWeight,
    }
  }

  // Definir columnas para la tabla de productos
  const colDefs: ColDef<ProductoCotizacionPDF>[] = [
    {
      headerName: 'Código',
      field: 'codigo',
      width: 50,
      minWidth: 50,
    },
    {
      headerName: 'Descripción',
      field: 'descripcion',
      flex: 1,
      minWidth: 150,
    },
    {
      headerName: 'Cant.',
      field: 'cantidad',
      width: 40,
      minWidth: 40,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return !isNaN(num) ? num.toFixed(0) : '0'
      },
    },
    {
      headerName: 'Unid.',
      field: 'unidad',
      width: 40,
      minWidth: 40,
    },
    {
      headerName: 'P. Unit.',
      field: 'precio_unitario',
      width: 50,
      minWidth: 50,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return `S/ ${!isNaN(num) ? num.toFixed(2) : '0.00'}`
      },
    },
    {
      headerName: 'Desc.',
      field: 'descuento',
      width: 50,
      minWidth: 50,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return `S/ ${!isNaN(num) ? num.toFixed(2) : '0.00'}`
      },
    },
    {
      headerName: 'Subtotal',
      field: 'subtotal',
      width: 60,
      minWidth: 60,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return `S/ ${!isNaN(num) ? num.toFixed(2) : '0.00'}`
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
    <DocGeneral
      empresa={empresaConLogo as any}
      show_logo_html={show_logo_html}
      tipo_documento="PROFORMA"
      nro_doc={nro_doc}
      colDefs={colDefs}
      rowData={data.productos}
      total={data.total}
      observaciones={data.observaciones || '-'}
      totalConLetras
      getEstiloCampo={getEstiloCampo}
    >
      {/* Información del Cliente y Cotización */}
      <View style={styles_docs.section}>
        <View style={styles_docs.sectionInformacionGeneral}>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            {/* Fecha de Emisión */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Fecha de Emisión:
              </Text>
              <Text style={{
                ...styles_docs.textValueSubSectionInformacionGeneral,
                ...getEstiloCampo('fecha'),
                width: '50%',
              }}>
                {new Date(data.fecha).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Fecha de Vencimiento */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                F. Vencimiento:
              </Text>
              <Text style={{
                ...styles_docs.textValueSubSectionInformacionGeneral,
                ...getEstiloCampo('fecha_vencimiento'),
                width: '50%',
              }}>
                {new Date(data.fecha_vencimiento).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* RUC/DNI del Cliente */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                {data.cliente.numero_documento.length === 11 ? 'RUC:' : 'DNI:'}
              </Text>
              <Text style={{
                ...styles_docs.textValueSubSectionInformacionGeneral,
                ...getEstiloCampo('cliente_documento'),
                width: '50%',
              }}>
                {data.cliente.numero_documento}
              </Text>
            </View>

            {/* Cliente */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Cliente:
              </Text>
              <Text style={{
                ...styles_docs.textValueSubSectionInformacionGeneral,
                ...getEstiloCampo('cliente_nombre'),
                width: '50%',
              }}>
                {nombreCliente}
              </Text>
            </View>
          </View>

          <View style={styles_docs.sectionInformacionGeneralColumn}>
            {/* Dirección del Cliente */}
            {data.cliente.direccion && (
              <View style={styles_docs.subSectionInformacionGeneral}>
                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                  Dirección:
                </Text>
                <Text style={{
                  ...styles_docs.textValueSubSectionInformacionGeneral,
                  ...getEstiloCampo('cliente_direccion'),
                  width: '50%',
                }}>
                  {data.cliente.direccion}
                </Text>
              </View>
            )}

            {/* Vendedor */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Vendedor:
              </Text>
              <Text style={{
                ...styles_docs.textValueSubSectionInformacionGeneral,
                ...getEstiloCampo('vendedor'),
                width: '50%',
              }}>
                {data.vendedor}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Totales: Subtotal, Descuento, Total */}
      <View style={{ ...styles_docs.section, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <View style={{ width: 150 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>SUBTOTAL:</Text>
              <Text style={getEstiloCampo('subtotal')}>S/ {data.subtotal.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>T. DESCUENTO:</Text>
              <Text style={getEstiloCampo('total_descuento')}>S/ {data.total_descuento.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, backgroundColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold' }}>TOTAL:</Text>
              <Text style={{...getEstiloCampo('total'), fontSize: 11}}>S/ {data.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>
    </DocGeneral>
  )
}
