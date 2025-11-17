'use client'

import { Text, View } from '@react-pdf/renderer'
import { TipoDocumento } from '@prisma/client'
import { TiposDocumentos } from '~/lib/docs'
import { useColumnsDocIngresoSalida } from '../tables/columns-doc-ingreso-salida'
import { DataDocIngresoSalida } from './doc-ingreso-salida'
import DocGeneralTicket from '~/app/_components/docs/doc-general-ticket'
import { styles_ticket } from '~/app/_components/docs/styles'
import { EmpresaSession } from '~/auth/auth'

export default function DocIngresoSalidaTicket({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
}: {
  data: DataDocIngresoSalida
  nro_doc: string
  empresa: EmpresaSession | undefined
  show_logo_html?: boolean
}) {
  const rowData =
    data?.productos_por_almacen.flatMap(pa =>
      pa.unidades_derivadas.map(ud => ({
        ...ud,
        producto_almacen_ingreso_salida: {
          ...pa,
          producto_almacen: {
            ...pa.producto_almacen,
            producto: pa.producto_almacen.producto,
          },
        },
        unidad_derivada_inmutable: ud.unidad_derivada_inmutable,
      }))
    ) ?? []

  const tipo_documento = data?.tipo_documento
    ? TiposDocumentos[data.tipo_documento].name
    : ''

  const colDefs = useColumnsDocIngresoSalida({
    estado: data?.estado || false,
    tipo_documento: data?.tipo_documento || TipoDocumento.Ingreso,
  })

  colDefs.find(col => col.headerName === 'Código')!.width = 40
  colDefs.find(col => col.headerName === 'Código')!.minWidth = 40
  colDefs.find(col => col.headerName === 'Cantidad')!.width = 40
  colDefs.find(col => col.headerName === 'Cantidad')!.minWidth = 40
  colDefs.find(col => col.headerName === 'Unidad Derivada')!.flex = 1
  colDefs.find(col => col.headerName === 'Costo')!.width = 35
  colDefs.find(col => col.headerName === 'Costo')!.minWidth = 35

  const i_stock_anterior = colDefs.findIndex(
    col => col.headerName === 'Stock Anterior'
  )
  colDefs.splice(i_stock_anterior, 1)
  const i_stock_nuevo = colDefs.findIndex(
    col => col.headerName === 'Stock Nuevo'
  )
  colDefs.splice(i_stock_nuevo, 1)

  return (
    <DocGeneralTicket
      empresa={empresa}
      show_logo_html={show_logo_html}
      tipo_documento={tipo_documento}
      nro_doc={nro_doc}
      colDefs={colDefs}
      rowData={rowData}
      total={rowData.reduce(
        (acc, item) =>
          acc +
          Number(item.cantidad) *
            Number(item.producto_almacen_ingreso_salida.costo) *
            Number(item.factor),
        0
      )}
      observaciones={data?.descripcion ?? '-'}
      headerNameAl100='Producto'
      totalConLetras
    >
      <View style={{ marginBottom: 2 }}>
        <View
          style={{
            ...styles_ticket.sectionInformacionGeneral,
            paddingBottom: 12,
          }}
        >
          <View style={styles_ticket.sectionInformacionGeneralColumn}>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Fecha de Emisión:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {new Date(data?.fecha || '').toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Almacén:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.almacen.name}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Usuario:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.user.name}
              </Text>
            </View>
          </View>
          <View
            style={{
              ...styles_ticket.sectionInformacionGeneralColumn,
            }}
          >
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Proveedor:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.proveedor?.razon_social ?? '-'}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Tipo de {tipo_documento}:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.tipo_ingreso.name}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Observaciones:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.descripcion ?? '-'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </DocGeneralTicket>
  )
}
