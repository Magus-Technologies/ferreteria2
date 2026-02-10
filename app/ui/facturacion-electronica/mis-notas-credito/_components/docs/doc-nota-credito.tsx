'use client'

import { Text, View } from '@react-pdf/renderer'
import DocGeneral from '~/app/_components/docs/doc-general'
import { styles_docs } from '~/app/_components/docs/styles'
import { EmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'
import { ColDef } from 'ag-grid-community'

// ============= TYPES =============

export interface ProductoNotaCreditoPDF {
  codigo: string
  descripcion: string
  cantidad: number
  unidad: string
  precio_unitario: number
  subtotal: number
}

export interface NotaCreditoDataPDF {
  id: string
  numero: string
  fecha: string
  motivo: string
  comprobante_afectado: {
    tipo: string
    numero: string
  }
  cliente: {
    numero_documento: string
    razon_social?: string
    nombres?: string
    apellidos?: string
    direccion?: string
  }
  productos: ProductoNotaCreditoPDF[]
  subtotal: number
  igv: number
  total: number
  observaciones?: string
}

// ============= COMPONENT =============

export default function DocNotaCredito({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
}: {
  data: NotaCreditoDataPDF | undefined
  nro_doc: string
  empresa: EmpresaPublica | undefined
  show_logo_html?: boolean
}) {
  if (!data) return null

  // Definir columnas para la tabla de productos
  const colDefs: ColDef<ProductoNotaCreditoPDF>[] = [
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
      tipo_documento="NOTA DE CRÉDITO ELECTRÓNICA"
      nro_doc={nro_doc}
      colDefs={colDefs}
      rowData={data.productos}
      total={data.total}
      observaciones={data.observaciones || '-'}
      totalConLetras
    >
      {/* Información del Cliente y Nota de Crédito */}
      <View style={styles_docs.section}>
        <View style={styles_docs.sectionInformacionGeneral}>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            {/* Fecha de Emisión */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Fecha de Emisión:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data.fecha ? new Date(data.fecha).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }) : 'Invalid Date'}
              </Text>
            </View>

            {/* RUC/DNI del Cliente */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                {data.cliente.numero_documento?.length === 11 ? 'RUC:' : 'DNI:'}
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data.cliente.numero_documento || 'N/A'}
              </Text>
            </View>

            {/* Cliente */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Cliente:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {nombreCliente || 'Cliente no especificado'}
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
                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                  {data.cliente.direccion}
                </Text>
              </View>
            )}

            {/* Comprobante Afectado */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Comprobante Afectado:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data.comprobante_afectado?.tipo || 'COMPROBANTE'} {data.comprobante_afectado?.numero || 'N/A'}
              </Text>
            </View>

            {/* Motivo */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Motivo:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data.motivo || 'Sin motivo especificado'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Totales: Subtotal, IGV, Total */}
      <View style={{ ...styles_docs.section, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <View style={{ width: 150 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>SUBTOTAL:</Text>
              <Text style={{ fontSize: 10 }}>S/ {data.subtotal.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>IGV (18%):</Text>
              <Text style={{ fontSize: 10 }}>S/ {data.igv.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, backgroundColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold' }}>TOTAL:</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold' }}>S/ {data.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>
    </DocGeneral>
  )
}
