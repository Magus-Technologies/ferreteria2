'use client'

import { Text, View } from '@react-pdf/renderer'
import DocGeneral from '~/app/_components/docs/doc-general'
import { styles_docs } from '~/app/_components/docs/styles'
import { EmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'
import { ColDef } from 'ag-grid-community'

// ============= TYPES =============

export interface ProductoPrestamoPDF {
  codigo: string
  descripcion: string
  cantidad: number
  unidad: string
  costo: number
  importe: number
}

export interface PrestamoDataPDF {
  id: number
  numero: string
  fecha: string
  tipo_operacion: string
  tipo_entidad: string
  entidad: {
    numero_documento: string
    razon_social?: string | null
    nombres?: string | null
    apellidos?: string | null
    direccion?: string | null
  }
  productos: ProductoPrestamoPDF[]
  monto_total: number
  observaciones?: string | null
  garantia?: string | null
  usuario: string
}

// ============= COMPONENT =============

export default function DocPrestamo({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
}: {
  data: PrestamoDataPDF | undefined
  nro_doc: string
  empresa: EmpresaPublica | undefined
  show_logo_html?: boolean
}) {
  if (!data) return null

  // Definir columnas para la tabla de productos
  const colDefs: ColDef<ProductoPrestamoPDF>[] = [
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
      headerName: 'Costo',
      field: 'costo',
      width: 50,
      minWidth: 50,
      valueFormatter: ({ value }: { value?: number }) => {
        const num = Number(value)
        return `S/ ${!isNaN(num) ? num.toFixed(2) : '0.00'}`
      },
    },
    {
      headerName: 'Importe',
      field: 'importe',
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

  // Nombre de la entidad (cliente o proveedor)
  const nombreEntidad = data.entidad.razon_social ||
    `${data.entidad.nombres || ''} ${data.entidad.apellidos || ''}`.trim()

  return (
    <DocGeneral
      empresa={empresaConLogo as any}
      show_logo_html={show_logo_html}
      tipo_documento={`${data.tipo_operacion.toUpperCase()} - PRÉSTAMO`}
      nro_doc={nro_doc}
      colDefs={colDefs}
      rowData={data.productos}
      total={data.monto_total}
      observaciones={data.observaciones || '-'}
      totalConLetras
    >
      {/* Información de la Entidad y Préstamo */}
      <View style={styles_docs.section}>
        <View style={styles_docs.sectionInformacionGeneral}>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            {/* Fecha */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Fecha:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {new Date(data.fecha).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Tipo de Operación */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Operación:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data.tipo_operacion}
              </Text>
            </View>

            {/* RUC/DNI de la Entidad */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                {data.entidad.numero_documento.length === 11 ? 'RUC:' : 'DNI:'}
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data.entidad.numero_documento}
              </Text>
            </View>

            {/* Entidad (Cliente o Proveedor) */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                {data.tipo_entidad}:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {nombreEntidad}
              </Text>
            </View>
          </View>

          <View style={styles_docs.sectionInformacionGeneralColumn}>
            {/* Dirección de la Entidad */}
            {data.entidad.direccion && (
              <View style={styles_docs.subSectionInformacionGeneral}>
                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                  Dirección:
                </Text>
                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                  {data.entidad.direccion}
                </Text>
              </View>
            )}

            {/* Usuario */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Usuario:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data.usuario}
              </Text>
            </View>

            {/* Garantía */}
            {data.garantia && (
              <View style={styles_docs.subSectionInformacionGeneral}>
                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                  Garantía:
                </Text>
                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                  {data.garantia}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </DocGeneral>
  )
}
