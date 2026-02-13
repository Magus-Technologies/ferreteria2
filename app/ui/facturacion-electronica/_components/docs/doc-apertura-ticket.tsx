'use client'

import { Text, View, Document, Page } from '@react-pdf/renderer'
import { styles_ticket } from '~/app/_components/docs/styles'
import { EmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'
import DocHeaderTicket from '~/app/_components/docs/doc-header-ticket'

// ============= INTERFACES =============

export interface VendedorDistribucion {
  vendedor: string
  monto: number
  conteo_billetes_monedas?: any
}

export interface AperturaDataPDF {
  id: string | number
  fecha_apertura: string
  monto_apertura: number
  conteo_apertura_billetes_monedas?: any
  caja_principal: {
    id: number
    codigo: string
    nombre: string
  }
  user: {
    id: string
    name: string
  }
  distribuciones_vendedores?: VendedorDistribucion[]
}

// ============= COMPONENT =============

export default function DocAperturaTicket({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
}: {
  data: AperturaDataPDF | undefined
  nro_doc: string
  empresa: EmpresaPublica | undefined
  show_logo_html?: boolean
}) {
  if (!data) return null

  // Preparar empresa con logo URL
  const empresaConLogo = empresa ? {
    ...empresa,
    logo: getLogoUrl(empresa.logo),
  } : undefined

  const cantidadVendedores = data.distribuciones_vendedores?.length || 0

  return (
    <Document title={nro_doc}>
      <Page
        size={{ width: 80 / 0.3528, height: 400 / 0.3528 }}
        style={styles_ticket.page}
      >
        <DocHeaderTicket
          empresa={empresaConLogo as any}
          show_logo_html={show_logo_html}
          tipo_documento='APERTURA DE CAJA'
          nro_doc={nro_doc}
        />

        {/* Información de la Apertura */}
        <View style={{ marginBottom: 2 }}>
          <View
            style={{
              ...styles_ticket.sectionInformacionGeneral,
              paddingBottom: 12,
            }}
          >
            <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
              
              {/* Fecha y Hora de Apertura - 2 columnas */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
                {/* Columna Izquierda: Fecha */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: 5 }}>
                    Fecha:
                  </Text>
                  <Text style={{ fontSize: 5 }}>
                    {data.fecha_apertura ? new Date(data.fecha_apertura).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }) : '-'}
                  </Text>
                </View>

                {/* Columna Derecha: Hora */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: 5 }}>
                    Hora:
                  </Text>
                  <Text style={{ fontSize: 5 }}>
                    {data.fecha_apertura ? new Date(data.fecha_apertura).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : '-'}
                  </Text>
                </View>
              </View>

              {/* Caja - Ocupa todo el ancho */}
              <View style={styles_ticket.subSectionInformacionGeneral}>
                <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                  Caja:
                </Text>
                <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                  {data.caja_principal?.nombre || data.caja_principal?.codigo || '-'}
                </Text>
              </View>

              {/* Usuario - Ocupa todo el ancho */}
              <View style={styles_ticket.subSectionInformacionGeneral}>
                <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                  Usuario:
                </Text>
                <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                  {data.user?.name || '-'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Monto de Apertura */}
        <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
          <Text style={{ fontSize: 6, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>
            MONTO DE APERTURA
          </Text>
          <View style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            paddingHorizontal: 4, 
            paddingVertical: 3, 
            backgroundColor: '#e8f5e9',
            marginTop: 1 
          }}>
            <Text style={{ fontSize: 7, fontWeight: 'bold' }}>Total Efectivo:</Text>
            <Text style={{ fontSize: 7, fontWeight: 'bold', color: 'green' }}>
              S/ {(data.monto_apertura || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Desglose de Denominaciones (si existe) */}
        {(data.conteo_apertura_billetes_monedas || (data.distribuciones_vendedores && data.distribuciones_vendedores.length > 0 && data.distribuciones_vendedores.some(d => d.conteo_billetes_monedas))) && (
          <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
            <Text style={{ fontSize: 6, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>
              DESGLOSE DE DENOMINACIONES
            </Text>
            
            {/* Mostrar conteo_apertura_billetes_monedas si existe (tiene prioridad) */}
            {data.conteo_apertura_billetes_monedas && (() => {
              const denominaciones = [
                { label: 'Billete S/. 200', valor: 200, key: 'b200' },
                { label: 'Billete S/. 100', valor: 100, key: 'b100' },
                { label: 'Billete S/. 50', valor: 50, key: 'b50' },
                { label: 'Billete S/. 20', valor: 20, key: 'b20' },
                { label: 'Billete S/. 10', valor: 10, key: 'b10' },
                { label: 'Moneda S/. 5', valor: 5, key: 'm5' },
                { label: 'Moneda S/. 2', valor: 2, key: 'm2' },
                { label: 'Moneda S/. 1', valor: 1, key: 'm1' },
                { label: 'Moneda S/. 0.50', valor: 0.5, key: 'm050' },
                { label: 'Moneda S/. 0.20', valor: 0.2, key: 'm020' },
                { label: 'Moneda S/. 0.10', valor: 0.1, key: 'm010' },
                { label: 'Moneda S/. 0.05', valor: 0.05, key: 'm005' },
              ]

              const conteo = data.conteo_apertura_billetes_monedas
              const denominacionesConValor = denominaciones.filter(d => conteo[d.key] > 0)

              if (denominacionesConValor.length === 0) return null

              return (
                <View style={{ marginBottom: 3 }}>
                  {/* Header de la tabla */}
                  <View style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000', paddingBottom: 1, marginBottom: 1 }}>
                    <Text style={{ fontSize: 5, fontWeight: 'bold', flex: 1 }}>Denominación</Text>
                    <Text style={{ fontSize: 5, fontWeight: 'bold', width: 30, textAlign: 'center' }}>Cant.</Text>
                    <Text style={{ fontSize: 5, fontWeight: 'bold', width: 40, textAlign: 'right' }}>Total</Text>
                  </View>
                  
                  {/* Filas de datos */}
                  {denominacionesConValor.map((denom, index) => {
                    const cantidad = conteo[denom.key] || 0
                    const subtotal = cantidad * denom.valor
                    return (
                      <View key={denom.key} style={{ display: 'flex', flexDirection: 'row', paddingVertical: 0.5, backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                        <Text style={{ fontSize: 5, flex: 1 }}>{denom.label}</Text>
                        <Text style={{ fontSize: 5, width: 30, textAlign: 'center' }}>{cantidad}</Text>
                        <Text style={{ fontSize: 5, width: 40, textAlign: 'right' }}>S/ {subtotal.toFixed(2)}</Text>
                      </View>
                    )
                  })}

                  {/* Total */}
                  <View style={{ display: 'flex', flexDirection: 'row', paddingVertical: 1, backgroundColor: '#f0f0f0', borderTop: '1px solid #000', marginTop: 1 }}>
                    <Text style={{ fontSize: 5, fontWeight: 'bold', flex: 1 }}>Total</Text>
                    <Text style={{ fontSize: 5, fontWeight: 'bold', width: 40, textAlign: 'right' }}>
                      S/ {data.monto_apertura.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )
            })()}

            {/* Si NO hay conteo_apertura_billetes_monedas, mostrar conteos de vendedores individuales */}
            {!data.conteo_apertura_billetes_monedas && data.distribuciones_vendedores && data.distribuciones_vendedores.map((dist, vendedorIndex) => {
              if (!dist.conteo_billetes_monedas) return null
              
              const denominaciones = [
                { label: 'Billete S/. 200', valor: 200, key: 'b200' },
                { label: 'Billete S/. 100', valor: 100, key: 'b100' },
                { label: 'Billete S/. 50', valor: 50, key: 'b50' },
                { label: 'Billete S/. 20', valor: 20, key: 'b20' },
                { label: 'Billete S/. 10', valor: 10, key: 'b10' },
                { label: 'Moneda S/. 5', valor: 5, key: 'm5' },
                { label: 'Moneda S/. 2', valor: 2, key: 'm2' },
                { label: 'Moneda S/. 1', valor: 1, key: 'm1' },
                { label: 'Moneda S/. 0.50', valor: 0.5, key: 'm050' },
                { label: 'Moneda S/. 0.20', valor: 0.2, key: 'm020' },
                { label: 'Moneda S/. 0.10', valor: 0.1, key: 'm010' },
                { label: 'Moneda S/. 0.05', valor: 0.05, key: 'm005' },
              ]

              const conteo = dist.conteo_billetes_monedas
              const denominacionesConValor = denominaciones.filter(d => conteo[d.key] > 0)

              if (denominacionesConValor.length === 0) return null

              return (
                <View key={vendedorIndex} style={{ marginBottom: 3 }}>
                  {((data.distribuciones_vendedores?.length ?? 0) > 1) && (
                    <Text style={{ fontSize: 5, fontWeight: 'bold', marginBottom: 1, color: '#666' }}>
                      {dist.vendedor}:
                    </Text>
                  )}
                  
                  {/* Header de la tabla */}
                  <View style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000', paddingBottom: 1, marginBottom: 1 }}>
                    <Text style={{ fontSize: 5, fontWeight: 'bold', flex: 1 }}>Denominación</Text>
                    <Text style={{ fontSize: 5, fontWeight: 'bold', width: 30, textAlign: 'center' }}>Cant.</Text>
                    <Text style={{ fontSize: 5, fontWeight: 'bold', width: 40, textAlign: 'right' }}>Total</Text>
                  </View>
                  
                  {/* Filas de datos */}
                  {denominacionesConValor.map((denom, index) => {
                    const cantidad = conteo[denom.key] || 0
                    const subtotal = cantidad * denom.valor
                    return (
                      <View key={denom.key} style={{ display: 'flex', flexDirection: 'row', paddingVertical: 0.5, backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                        <Text style={{ fontSize: 5, flex: 1 }}>{denom.label}</Text>
                        <Text style={{ fontSize: 5, width: 30, textAlign: 'center' }}>{cantidad}</Text>
                        <Text style={{ fontSize: 5, width: 40, textAlign: 'right' }}>S/ {subtotal.toFixed(2)}</Text>
                      </View>
                    )
                  })}

                  {/* Subtotal del vendedor */}
                  <View style={{ display: 'flex', flexDirection: 'row', paddingVertical: 1, backgroundColor: '#f0f0f0', borderTop: '1px solid #000', marginTop: 1 }}>
                    <Text style={{ fontSize: 5, fontWeight: 'bold', flex: 1 }}>Subtotal</Text>
                    <Text style={{ fontSize: 5, fontWeight: 'bold', width: 40, textAlign: 'right' }}>
                      S/ {(dist.monto || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* Distribución a Vendedores */}
        {data.distribuciones_vendedores && data.distribuciones_vendedores.length > 0 && (
          <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
            <Text style={{ fontSize: 6, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>
              DISTRIBUCIÓN A VENDEDORES ({cantidadVendedores})
            </Text>
            
            {/* Header de la tabla */}
            <View style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000', paddingBottom: 2, marginBottom: 2 }}>
              <Text style={{ fontSize: 5, fontWeight: 'bold', flex: 1 }}>Vendedor</Text>
              <Text style={{ fontSize: 5, fontWeight: 'bold', width: 50, textAlign: 'right' }}>Monto</Text>
            </View>
            
            {/* Filas de datos */}
            {data.distribuciones_vendedores.map((dist, index) => (
              <View key={index} style={{ display: 'flex', flexDirection: 'row', paddingVertical: 1, backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                <Text style={{ fontSize: 5, flex: 1 }}>{dist.vendedor || 'N/A'}</Text>
                <Text style={{ fontSize: 5, width: 50, textAlign: 'right' }}>S/ {(dist.monto || 0).toFixed(2)}</Text>
              </View>
            ))}

            {/* Total */}
            <View style={{ display: 'flex', flexDirection: 'row', paddingVertical: 2, backgroundColor: '#f0f0f0', borderTop: '1px solid #000', marginTop: 2 }}>
              <Text style={{ fontSize: 6, fontWeight: 'bold', flex: 1 }}>TOTAL DISTRIBUIDO</Text>
              <Text style={{ fontSize: 6, fontWeight: 'bold', width: 50, textAlign: 'right' }}>
                S/ {(data.monto_apertura || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Información adicional */}
        <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
          <View style={{ paddingHorizontal: 4, paddingVertical: 2, backgroundColor: '#e3f2fd' }}>
            <Text style={{ fontSize: 5, textAlign: 'center', color: '#1565c0' }}>
              ✓ Caja aperturada exitosamente
            </Text>
          </View>
        </View>

        {/* Pie de página */}
        <View style={{ marginTop: 6, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
          <Text style={{ fontSize: 5, textAlign: 'center', color: '#666' }}>
            Gracias por usar nuestro sistema
          </Text>
          <Text style={{ fontSize: 4, textAlign: 'center', color: '#999', marginTop: 2 }}>
            Documento generado el {new Date().toLocaleString('es-ES')}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
