'use client'

import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import { styles_globales } from '~/components/pdf/table-pdf-ag-grid'
import DocHeader from '~/app/_components/docs/doc-header'
import DocTable from '~/app/_components/docs/doc-table'
import { styles_docs } from '~/app/_components/docs/styles'
import { ColDef } from 'ag-grid-community'
import type { Empresa } from '~/lib/api'
import type { GuiaRemision } from '~/lib/api/guia-remision'

export interface DetalleGuiaPDF {
  codigo: string
  descripcion: string
  cantidad: number
  unidad: string
  peso: string
}

export default function DocGuia({
  guia,
  empresa,
}: {
  guia: GuiaRemision | undefined
  empresa: Empresa | null | undefined
}) {
  if (!guia) return null

  const serie = guia.serie ?? 'T001'
  const numero = String(guia.numero ?? '0').padStart(8, '0')
  const nroDoc = `${serie}-${numero}`

  // Nombre del cliente
  const nombreCliente = guia.cliente?.razon_social
    || `${guia.cliente?.nombres || ''} ${guia.cliente?.apellidos || ''}`.trim()
    || 'VARIOS'

  const docCliente = guia.cliente?.numero_documento || '-'

  // Formatear fechas
  const fechaEmision = guia.fecha_emision
    ? new Date(guia.fecha_emision).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '-'
  const fechaTraslado = guia.fecha_traslado
    ? new Date(guia.fecha_traslado).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '-'

  // Datos de transporte
  const motivoTraslado = guia.motivo_traslado?.descripcion || '-'
  const modalidad = guia.modalidad_transporte === 'PRIVADO' ? 'Transporte Privado' : 'Transporte Publico'
  const vehiculoPlaca = guia.vehiculo_placa || '-'
  const choferNombre = guia.chofer
    ? (guia.chofer as any).name || `${(guia.chofer as any).nombres || ''} ${(guia.chofer as any).apellidos || ''}`.trim()
    : '-'
  const choferDni = guia.chofer?.dni || '-'

  // Detalles para la tabla
  const rowData: DetalleGuiaPDF[] = (guia.detalles || []).map((d) => ({
    codigo: d.producto?.cod_producto || String(d.producto_id),
    descripcion: d.producto?.name || 'Producto',
    cantidad: Number(d.cantidad),
    unidad: d.unidad_derivada_inmutable_name || 'UND',
    peso: d.peso_total ? Number(d.peso_total).toFixed(2) : '-',
  }))

  const colDefs: ColDef<DetalleGuiaPDF>[] = [
    { headerName: '#', width: 25, minWidth: 25, valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1 },
    { headerName: 'Codigo', field: 'codigo', width: 60, minWidth: 60 },
    { headerName: 'Descripcion', field: 'descripcion', flex: 1, minWidth: 150 },
    { headerName: 'Cant.', field: 'cantidad', width: 40, minWidth: 40 },
    { headerName: 'Unid.', field: 'unidad', width: 45, minWidth: 45 },
    { headerName: 'Peso (kg)', field: 'peso', width: 50, minWidth: 50 },
  ]

  // Peso total
  const pesoTotal = (guia.detalles || []).reduce((sum, d) => sum + (Number(d.peso_total) || 0), 0)

  return (
    <Document title={`GRE ${nroDoc}`}>
      <Page size='A4' style={styles_globales.page}>
        <DocHeader
          empresa={empresa as any}
          tipo_documento='GUIA DE REMISION ELECTRONICA'
          nro_doc={nroDoc}
        />

        {/* Informacion General */}
        <View style={styles_docs.section}>
          <View style={styles_docs.sectionInformacionGeneral}>
            {/* Columna izquierda */}
            <View style={styles_docs.sectionInformacionGeneralColumn}>
              <View style={styles_docs.subSectionInformacionGeneral}>
                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Fecha Emision:</Text>
                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{fechaEmision}</Text>
              </View>
              <View style={styles_docs.subSectionInformacionGeneral}>
                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Fecha Traslado:</Text>
                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{fechaTraslado}</Text>
              </View>
              <View style={styles_docs.subSectionInformacionGeneral}>
                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Motivo Traslado:</Text>
                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{motivoTraslado}</Text>
              </View>
              <View style={styles_docs.subSectionInformacionGeneral}>
                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Modalidad:</Text>
                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{modalidad}</Text>
              </View>
            </View>

            {/* Columna derecha */}
            <View style={styles_docs.sectionInformacionGeneralColumn}>
              <View style={styles_docs.subSectionInformacionGeneral}>
                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Punto Partida:</Text>
                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{guia.punto_partida || '-'}</Text>
              </View>
              <View style={styles_docs.subSectionInformacionGeneral}>
                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Punto Llegada:</Text>
                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{guia.punto_llegada || '-'}</Text>
              </View>
              <View style={styles_docs.subSectionInformacionGeneral}>
                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Vehiculo:</Text>
                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{vehiculoPlaca}</Text>
              </View>
              <View style={styles_docs.subSectionInformacionGeneral}>
                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Chofer:</Text>
                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{choferNombre} ({choferDni})</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Destinatario */}
        <View style={{ ...styles_docs.section, marginBottom: 4 }}>
          <View style={{ ...styles_docs.sectionInformacionGeneral, flexDirection: 'column', gap: 2 }}>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={{ ...styles_docs.textTitleSubSectionInformacionGeneral, width: '20%' }}>
                {docCliente.length === 11 ? 'RUC:' : 'DNI:'}
              </Text>
              <Text style={{ ...styles_docs.textValueSubSectionInformacionGeneral, width: '80%' }}>
                {docCliente}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={{ ...styles_docs.textTitleSubSectionInformacionGeneral, width: '20%' }}>Destinatario:</Text>
              <Text style={{ ...styles_docs.textValueSubSectionInformacionGeneral, width: '80%' }}>
                {nombreCliente}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabla de productos */}
        <DocTable colDefs={colDefs} rowData={rowData} />

        {/* Peso total */}
        <View style={styles_docs.total}>
          <Text style={styles_docs.textTotal}>PESO TOTAL</Text>
          <Text>{pesoTotal.toFixed(2)} KG</Text>
        </View>

        {/* Observaciones + QR */}
        <View style={{ display: 'flex', flexDirection: 'row', marginTop: 8, gap: 8 }}>
          {/* Observaciones */}
          <View style={{ ...styles_docs.observaciones, flex: 1 }}>
            <Text style={{ fontWeight: 'bold' }}>Observaciones:</Text>
            <Text>{guia.observaciones || '-'}</Text>
          </View>

          {/* QR */}
          {guia.sunat_codigo_qr && (
            <View style={{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center' }}>
              <Image src={guia.sunat_codigo_qr} style={{ width: 75, height: 75 }} />
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
