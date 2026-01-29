'use client'

import { Text, View } from '@react-pdf/renderer'
import { TiposDocumentos } from '~/lib/docs'
import { useColumnsDetalleDeRecepcion } from '../tables/columns-detalle-de-recepcion'
import { getRecepcionesAlmacenResponseProps } from '~/app/_actions/recepcion-almacen'
import { getDetallesRecepcionAlmacen } from '../../_utils/get-detalles-recepcion-almacen'
import DocGeneral from '~/app/_components/docs/doc-general'
import { styles_docs } from '~/app/_components/docs/styles'
import { getNroDocCompra } from '~/app/_utils/get-nro-doc'
import type { Empresa } from '~/lib/api'

export default function DocRecepcionAlmacen({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
}: {
  data: getRecepcionesAlmacenResponseProps | undefined
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
  colDefs.find(col => col.headerName === 'Unidad Derivada')!.width = 60
  colDefs.find(col => col.headerName === 'Unidad Derivada')!.minWidth = 60
  colDefs.find(col => col.headerName === 'Cantidad')!.width = 55
  colDefs.find(col => col.headerName === 'Cantidad')!.minWidth = 55
  colDefs.find(col => col.headerName === 'Stock Anterior')!.width = 55
  colDefs.find(col => col.headerName === 'Stock Anterior')!.minWidth = 55
  colDefs.find(col => col.headerName === 'Stock Nuevo')!.width = 55
  colDefs.find(col => col.headerName === 'Stock Nuevo')!.minWidth = 55

  const i_marca = colDefs.findIndex(col => col.headerName === 'Marca')
  colDefs.splice(i_marca, 1)
  const i_vencimiento = colDefs.findIndex(
    col => col.headerName === 'F. Vencimiento'
  )
  colDefs.splice(i_vencimiento, 1)
  const i_lote = colDefs.findIndex(col => col.headerName === 'Lote')
  colDefs.splice(i_lote, 1)

  return (
    <DocGeneral
      empresa={empresa}
      show_logo_html={show_logo_html}
      tipo_documento={tipo_documento}
      nro_doc={nro_doc}
      colDefs={colDefs}
      rowData={rowData}
      total={rowData.reduce((acc, item) => acc + Number(item.cantidad), 0)}
      observaciones={data?.observaciones ?? '-'}
    >
      <View style={styles_docs.section}>
        <View style={styles_docs.sectionInformacionGeneral}>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Fecha de Recepción:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {new Date(data?.fecha || '').toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Almacén:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.compra.almacen.name}
              </Text>
            </View>
          </View>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Fecha de Compra:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
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
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Usuario:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.user.name}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles_docs.titleSectionInformacionGeneral}>
          Datos del Proveedor:
        </Text>
        <View style={{ ...styles_docs.sectionInformacionGeneral }}>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                RUC:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.compra.proveedor?.ruc}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Documento:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {getNroDocCompra({ compra: data?.compra })}
              </Text>
            </View>
          </View>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Razón Social:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.compra.proveedor?.razon_social}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Guía Remisión:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.compra.guia ?? '-'}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles_docs.titleSectionInformacionGeneral}>
          Datos del Transportista:
        </Text>
        <View style={{ ...styles_docs.sectionInformacionGeneral }}>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                RUC:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.transportista_ruc ?? '-'}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Placa Vehicular:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.transportista_placa ?? '-'}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Nombres y Apellidos:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.transportista_name ?? '-'}
              </Text>
            </View>
          </View>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Razón Social:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.transportista_razon_social ?? '-'}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Licencia:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.transportista_licencia ?? '-'}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Guía Remisión Transportista:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.transportista_guia_remision ?? '-'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </DocGeneral>
  )
}
