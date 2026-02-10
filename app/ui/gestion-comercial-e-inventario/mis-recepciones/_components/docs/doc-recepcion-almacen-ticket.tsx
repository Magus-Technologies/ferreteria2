'use client'

import { Text, View } from '@react-pdf/renderer'
import { TiposDocumentos } from '~/lib/docs'
import { useColumnsDetalleDeRecepcion } from '../tables/columns-detalle-de-recepcion'
import type { RecepcionAlmacenResponse } from '~/lib/api/recepcion-almacen'
import { getDetallesRecepcionAlmacen } from '../../_utils/get-detalles-recepcion-almacen'
import { styles_ticket } from '~/app/_components/docs/styles'
import { getNroDocCompra } from '~/app/_utils/get-nro-doc'
import DocGeneralTicket from '~/app/_components/docs/doc-general-ticket'
import type { Empresa } from '~/lib/api'

export default function DocRecepcionAlmacenTicket({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
}: {
  data: RecepcionAlmacenResponse | undefined
  nro_doc: string
  empresa: Empresa | null | undefined
  show_logo_html?: boolean
}) {
  const rowData = getDetallesRecepcionAlmacen({ data })

  const tipo_documento = TiposDocumentos.RecepcionAlmacen.name

  const colDefs = useColumnsDetalleDeRecepcion({
    estado: data?.estado || false,
  })
  colDefs.find(col => col.headerName === 'Cod. Producto')!.width = 60
  colDefs.find(col => col.headerName === 'Cod. Producto')!.minWidth = 60
  colDefs.find(col => col.headerName === 'Producto')!.width = 100
  colDefs.find(col => col.headerName === 'Producto')!.minWidth = 100
  colDefs.find(col => col.headerName === 'Unidad Derivada')!.width = 70
  colDefs.find(col => col.headerName === 'Unidad Derivada')!.minWidth = 70
  colDefs.find(col => col.headerName === 'Unidad Derivada')!.flex = 1
  colDefs.find(col => col.headerName === 'Cantidad')!.width = 40
  colDefs.find(col => col.headerName === 'Cantidad')!.minWidth = 40

  const i_marca = colDefs.findIndex(col => col.headerName === 'Marca')
  colDefs.splice(i_marca, 1)
  const i_vencimiento = colDefs.findIndex(
    col => col.headerName === 'F. Vencimiento'
  )
  colDefs.splice(i_vencimiento, 1)
  const i_lote = colDefs.findIndex(col => col.headerName === 'Lote')
  colDefs.splice(i_lote, 1)
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
      total={rowData.reduce((acc, item) => acc + Number(item.cantidad), 0)}
      observaciones={data?.observaciones ?? '-'}
      headerNameAl100='Producto'
    >
      <View style={{ marginBottom: 2 }}>
        <View style={styles_ticket.sectionInformacionGeneral}>
          <View style={styles_ticket.sectionInformacionGeneralColumn}>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Fecha de Recepción:
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
                {data?.compra.almacen.name}
              </Text>
            </View>
          </View>
          <View style={styles_ticket.sectionInformacionGeneralColumn}>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Fecha de Compra:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {new Date(data?.compra.fecha || '').toLocaleDateString(
                  'es-ES',
                  {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  }
                )}
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
        </View>
        <Text style={styles_ticket.titleSectionInformacionGeneral}>
          Datos del Proveedor:
        </Text>
        <View style={{ ...styles_ticket.sectionInformacionGeneral }}>
          <View style={styles_ticket.sectionInformacionGeneralColumn}>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                RUC:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.compra.proveedor?.ruc}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Documento:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {getNroDocCompra({ compra: data?.compra })}
              </Text>
            </View>
          </View>
          <View style={styles_ticket.sectionInformacionGeneralColumn}>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Razón Social:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.compra.proveedor?.razon_social}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Guía Remisión:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.compra.guia ?? '-'}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles_ticket.titleSectionInformacionGeneral}>
          Datos del Transportista:
        </Text>
        <View
          style={{
            ...styles_ticket.sectionInformacionGeneral,
            paddingBottom: 12,
          }}
        >
          <View style={styles_ticket.sectionInformacionGeneralColumn}>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                RUC:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.transportista_ruc ?? '-'}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Placa Vehicular:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.transportista_placa ?? '-'}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Nombres y Apellidos:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.transportista_name ?? '-'}
              </Text>
            </View>
          </View>
          <View style={styles_ticket.sectionInformacionGeneralColumn}>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Razón Social:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.transportista_razon_social ?? '-'}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Licencia:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.transportista_licencia ?? '-'}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Guía Remisión Transportista:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data?.transportista_guia_remision ?? '-'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </DocGeneralTicket>
  )
}
