'use client'

import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import { styles_ticket } from '~/app/_components/docs/styles'
import DocHeaderTicket from '~/app/_components/docs/doc-header-ticket'
import type { Empresa } from '~/lib/api'
import type { GuiaRemision } from '~/lib/api/guia-remision'

export default function DocGuiaTicket({
  guia,
  empresa,
  show_logo_html = false,
}: {
  guia: GuiaRemision | undefined
  empresa: Empresa | null | undefined
  show_logo_html?: boolean
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

  // Detalles
  const detalles = (guia.detalles || []).map((d) => ({
    codigo: d.producto?.cod_producto || String(d.producto_id),
    descripcion: d.producto?.name || 'Producto',
    cantidad: Number(d.cantidad),
    unidad: d.unidad_derivada_inmutable_name || 'UND',
    peso: d.peso_total ? Number(d.peso_total).toFixed(2) : '-',
  }))

  // Peso total
  const pesoTotal = (guia.detalles || []).reduce((sum, d) => sum + (Number(d.peso_total) || 0), 0)

  return (
    <Document title={`GRE ${nroDoc}`}>
      <Page
        size={{ width: 80 / 0.3528, height: 400 / 0.3528 }}
        style={styles_ticket.page}
      >
        <DocHeaderTicket
          empresa={empresa}
          show_logo_html={show_logo_html}
          tipo_documento='GUIA DE REMISION'
          nro_doc={nroDoc}
        />

        {/* Informacion de la Guia */}
        <View style={{ marginBottom: 2 }}>
          <View style={{ ...styles_ticket.sectionInformacionGeneral, paddingBottom: 6 }}>
            <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
              {/* Fechas */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>F. Emision:</Text>
                  <Text style={{ fontSize: 7 }}>{fechaEmision}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>F. Traslado:</Text>
                  <Text style={{ fontSize: 7 }}>{fechaTraslado}</Text>
                </View>
              </View>

              {/* Motivo */}
              <View style={styles_ticket.subSectionInformacionGeneral}>
                <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>Motivo:</Text>
                <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>{motivoTraslado}</Text>
              </View>

              {/* Modalidad */}
              <View style={styles_ticket.subSectionInformacionGeneral}>
                <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>Modalidad:</Text>
                <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>{modalidad}</Text>
              </View>

              {/* Punto Partida */}
              <View style={styles_ticket.subSectionInformacionGeneral}>
                <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>P. Partida:</Text>
                <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>{guia.punto_partida || '-'}</Text>
              </View>

              {/* Punto Llegada */}
              <View style={styles_ticket.subSectionInformacionGeneral}>
                <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>P. Llegada:</Text>
                <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>{guia.punto_llegada || '-'}</Text>
              </View>

              {/* Vehiculo y Chofer */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Vehiculo:</Text>
                  <Text style={{ fontSize: 7 }}>{vehiculoPlaca}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Chofer:</Text>
                  <Text style={{ fontSize: 7 }}>{choferDni}</Text>
                </View>
              </View>
              {choferNombre !== '-' && (
                <View style={styles_ticket.subSectionInformacionGeneral}>
                  <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>Nombre:</Text>
                  <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>{choferNombre}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Destinatario */}
        <View style={{ borderTop: '1px dashed #000000', paddingTop: 4, marginBottom: 4 }}>
          <View style={styles_ticket.subSectionInformacionGeneral}>
            <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
              {docCliente.length === 11 ? 'RUC:' : 'DNI:'}
            </Text>
            <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>{docCliente}</Text>
          </View>
          <View style={styles_ticket.subSectionInformacionGeneral}>
            <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>Destinatario:</Text>
            <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>{nombreCliente}</Text>
          </View>
        </View>

        {/* Tabla de productos */}
        <View style={{ marginBottom: 6, borderTop: '1px dashed #000000', paddingTop: 6 }}>
          {/* Headers */}
          <View style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000000', fontWeight: 'bold', marginBottom: 2, fontSize: 7 }}>
            <Text style={{ width: 90, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>Descripcion</Text>
            <Text style={{ width: 30, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>Cant.</Text>
            <Text style={{ width: 35, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>Unid.</Text>
            <Text style={{ width: 40, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>Peso(kg)</Text>
          </View>

          {/* Rows */}
          {detalles.map((det, idx) => (
            <View
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'row',
                borderBottom: '1px solid #000000',
                paddingVertical: 2,
                fontSize: 6,
                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
              }}
            >
              <Text style={{ width: 90, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>
                {det.descripcion}
              </Text>
              <Text style={{ width: 30, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>
                {det.cantidad}
              </Text>
              <Text style={{ width: 35, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>
                {det.unidad}
              </Text>
              <Text style={{ width: 40, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>
                {det.peso}
              </Text>
            </View>
          ))}
        </View>

        {/* Peso total */}
        <View style={styles_ticket.total}>
          <Text style={styles_ticket.textTotal}>PESO TOTAL</Text>
          <Text style={{ fontSize: 7, fontWeight: 'bold' }}>{pesoTotal.toFixed(2)} KG</Text>
        </View>

        {/* Observaciones */}
        <View style={styles_ticket.observaciones}>
          <Text style={{ fontWeight: 'bold' }}>Observaciones:</Text>
          <Text>{guia.observaciones || '-'}</Text>
        </View>

        {/* QR */}
        {guia.sunat_codigo_qr && (
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <Image src={guia.sunat_codigo_qr} style={{ width: 60, height: 60 }} />
            <Text style={{ fontSize: 5, color: '#666', marginTop: 2 }}>
              Representacion impresa del comprobante electronico
            </Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
