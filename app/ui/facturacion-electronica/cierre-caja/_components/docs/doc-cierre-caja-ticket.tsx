'use client'

import { Text, View, Document, Page } from '@react-pdf/renderer'
import { styles_ticket } from '~/app/_components/docs/styles'
import { EmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'
import { CierreCajaDataPDF, MetodoPagoCierrePDF } from './doc-cierre-caja'
import DocHeaderTicket from '~/app/_components/docs/doc-header-ticket'
import { NumeroALetras } from '~/utils/numero-a-letras'

// ============= COMPONENT =============

export default function DocCierreCajaTicket({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
}: {
  data: CierreCajaDataPDF | undefined
  nro_doc: string
  empresa: EmpresaPublica | undefined
  show_logo_html?: boolean
}) {
  if (!data) return null

  const resumen = data.resumen

  // Convert string values from backend to numbers
  const montoCierre = Number(data.monto_cierre_efectivo) || 0
  const totalCuentas = Number(data.total_cuentas || data.monto_cierre_cuentas) || 0

  // Calcular el efectivo esperado (solo el método "Efectivo")
  const efectivoEsperado = resumen.detalle_metodos_pago
    ?.filter((metodo: MetodoPagoCierrePDF) => 
      metodo.label?.toLowerCase().includes('efectivo')
    )
    .reduce((sum: number, metodo: MetodoPagoCierrePDF) => sum + metodo.total, 0) || 0

  // Calcular diferencias basadas en EFECTIVO, no en el total
  const montoEsperado = resumen.efectivo_inicial + efectivoEsperado
  const diferencia = montoCierre - montoEsperado
  const faltante = diferencia < 0 ? Math.abs(diferencia) : 0
  const sobrante = diferencia > 0 ? diferencia : 0

  // Calcular otros ingresos y gastos
  const otrosIngresos = (resumen.total_ingresos || 0) - (resumen.total_ventas || 0) - (resumen.total_prestamos_recibidos || 0)
  const gastos = (resumen.total_egresos || 0) - (resumen.total_prestamos_dados || 0)

  // Preparar empresa con logo URL
  const empresaConLogo = empresa ? {
    ...empresa,
    logo: getLogoUrl(empresa.logo),
  } : undefined

  return (
    <Document title={nro_doc}>
      <Page
        size={{ width: 80 / 0.3528, height: 400 / 0.3528 }}
        style={styles_ticket.page}
      >
        <DocHeaderTicket
          empresa={empresaConLogo as any}
          show_logo_html={show_logo_html}
          tipo_documento='CIERRE DE CAJA'
          nro_doc={nro_doc}
        />
      {/* Información del Cierre */}
      <View style={{ marginBottom: 2 }}>
        <View
          style={{
            ...styles_ticket.sectionInformacionGeneral,
            paddingBottom: 12,
          }}
        >
          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
            
            {/* Fecha de Apertura y Cierre - 2 columnas */}
            <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
              {/* Columna Izquierda: Fecha de Apertura */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: 5 }}>
                  F. Apertura:
                </Text>
                <Text style={{ fontSize: 5 }}>
                  {new Date(data.fecha_apertura).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              {/* Columna Derecha: Hora Apertura */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: 5 }}>
                  Hora:
                </Text>
                <Text style={{ fontSize: 5 }}>
                  {new Date(data.fecha_apertura).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            {/* Fecha de Cierre (si existe) */}
            {data.fecha_cierre && (
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
                {/* Columna Izquierda: Fecha de Cierre */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: 5 }}>
                    F. Cierre:
                  </Text>
                  <Text style={{ fontSize: 5 }}>
                    {new Date(data.fecha_cierre).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                {/* Columna Derecha: Hora Cierre */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: 5 }}>
                    Hora:
                  </Text>
                  <Text style={{ fontSize: 5 }}>
                    {new Date(data.fecha_cierre).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            )}

            {/* Caja - Ocupa todo el ancho */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Caja:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data.caja_principal?.nombre || data.caja_principal?.name || '-'}
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

            {/* Supervisor - SIEMPRE mostrar */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Supervisor:
              </Text>
              <Text style={styles_ticket.textValueSubSectionInformacionGeneral}>
                {data.supervisor?.name || '-'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Resumen de Saldos */}
      <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
        <Text style={{ fontSize: 6, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>
          RESUMEN DE SALDOS
        </Text>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1 }}>
          <Text style={{ fontSize: 5 }}>Efectivo Inicial:</Text>
          <Text style={{ fontSize: 5, fontWeight: 'bold' }}>S/ {resumen.efectivo_inicial.toFixed(2)}</Text>
        </View>
      </View>

      {/* Movimientos de Caja */}
      <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
        <Text style={{ fontSize: 6, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>
          MOVIMIENTOS DE CAJA
        </Text>
        
        {otrosIngresos > 0 && (
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1 }}>
            <Text style={{ fontSize: 5 }}>Otros Ingresos:</Text>
            <Text style={{ fontSize: 5 }}>S/ {otrosIngresos.toFixed(2)}</Text>
          </View>
        )}

        {resumen.total_prestamos_recibidos > 0 && (
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1 }}>
            <Text style={{ fontSize: 5 }}>Préstamos Recibidos ({resumen.prestamos_recibidos?.length || 0}):</Text>
            <Text style={{ fontSize: 5 }}>S/ {resumen.total_prestamos_recibidos.toFixed(2)}</Text>
          </View>
        )}

        {gastos > 0 && (
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1 }}>
            <Text style={{ fontSize: 5 }}>Gastos:</Text>
            <Text style={{ fontSize: 5 }}>S/ {gastos.toFixed(2)}</Text>
          </View>
        )}

        {resumen.total_prestamos_dados > 0 && (
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1 }}>
            <Text style={{ fontSize: 5 }}>Préstamos Dados ({resumen.prestamos_dados?.length || 0}):</Text>
            <Text style={{ fontSize: 5 }}>S/ {resumen.total_prestamos_dados.toFixed(2)}</Text>
          </View>
        )}

        {resumen.movimientos_internos && resumen.movimientos_internos.length > 0 && (
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1, backgroundColor: '#e3f2fd' }}>
            <Text style={{ fontSize: 5 }}>Mov. Internos ({resumen.movimientos_internos.length}) (no afecta):</Text>
            <Text style={{ fontSize: 5 }}>
              S/ {resumen.movimientos_internos.reduce((sum: number, m: any) => sum + Number(m.monto), 0).toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {/* Totales Generales */}
      <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
        <Text style={{ fontSize: 6, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>
          TOTALES GENERALES
        </Text>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1 }}>
          <Text style={{ fontSize: 5, fontWeight: 'bold' }}>Resumen Ventas:</Text>
          <Text style={{ fontSize: 5, fontWeight: 'bold' }}>S/ {resumen.total_ventas.toFixed(2)}</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1 }}>
          <Text style={{ fontSize: 5 }}>Resumen Ingresos:</Text>
          <Text style={{ fontSize: 5 }}>S/ {resumen.total_ingresos.toFixed(2)}</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1 }}>
          <Text style={{ fontSize: 5 }}>Resumen Egresos:</Text>
          <Text style={{ fontSize: 5 }}>S/ {resumen.total_egresos.toFixed(2)}</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 2, backgroundColor: '#f0f0f0', marginTop: 1 }}>
          <Text style={{ fontSize: 6, fontWeight: 'bold' }}>Total en Caja (Efectivo):</Text>
          <Text style={{ fontSize: 6, fontWeight: 'bold' }}>S/ {montoEsperado.toFixed(2)}</Text>
        </View>
      </View>

      {/* Cierre Físico - SIEMPRE mostrar */}
      <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
        <Text style={{ fontSize: 6, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>
          CIERRE FÍSICO
        </Text>
        {data.monto_cierre_efectivo !== undefined ? (
          <>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1 }}>
              <Text style={{ fontSize: 5 }}>Dinero Efectivo:</Text>
              <Text style={{ fontSize: 5 }}>S/ {montoCierre.toFixed(2)}</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1 }}>
              <Text style={{ fontSize: 5 }}>Total Cuentas:</Text>
              <Text style={{ fontSize: 5 }}>S/ {totalCuentas.toFixed(2)}</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 2, backgroundColor: '#f0f0f0', marginTop: 1 }}>
              <Text style={{ fontSize: 6, fontWeight: 'bold' }}>Total Cierre Físico:</Text>
              <Text style={{ fontSize: 6, fontWeight: 'bold' }}>S/ {(montoCierre + totalCuentas).toFixed(2)}</Text>
            </View>
          </>
        ) : (
          <View style={{ paddingHorizontal: 4, paddingVertical: 2, backgroundColor: '#fff3cd' }}>
            <Text style={{ fontSize: 5, textAlign: 'center', color: '#856404' }}>
              Pendiente de cierre
            </Text>
          </View>
        )}
      </View>

      {/* Desglose de Denominaciones (si existe) */}
      {data.conteo_billetes_monedas && (() => {
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

        const conteo = data.conteo_billetes_monedas
        const denominacionesConValor = denominaciones.filter(d => conteo[d.key] > 0)

        if (denominacionesConValor.length === 0) return null

        return (
          <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
            <Text style={{ fontSize: 6, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>
              DESGLOSE DE DENOMINACIONES
            </Text>
            
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
                S/ {montoCierre.toFixed(2)}
              </Text>
            </View>
          </View>
        )
      })()}

      {/* Diferencias - SIEMPRE mostrar */}
      <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
        <Text style={{ fontSize: 6, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>
          DIFERENCIAS
        </Text>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1, backgroundColor: '#e3f2fd' }}>
          <Text style={{ fontSize: 5, fontWeight: 'bold' }}>Monto Esperado:</Text>
          <Text style={{ fontSize: 5, fontWeight: 'bold' }}>S/ {montoEsperado.toFixed(2)}</Text>
        </View>
        {data.monto_cierre_efectivo !== undefined ? (
          <>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1 }}>
              <Text style={{ fontSize: 5 }}>Sobrante:</Text>
              <Text style={{ fontSize: 5, color: 'green' }}>S/ {sobrante.toFixed(2)}</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 1 }}>
              <Text style={{ fontSize: 5 }}>Faltante:</Text>
              <Text style={{ fontSize: 5, color: 'red' }}>S/ {faltante.toFixed(2)}</Text>
            </View>
            <View style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              paddingHorizontal: 4, 
              paddingVertical: 2, 
              backgroundColor: diferencia < 0 ? '#ffebee' : '#e8f5e9',
              marginTop: 1 
            }}>
              <Text style={{ fontSize: 6, fontWeight: 'bold' }}>Diferencia Total:</Text>
              <Text style={{ fontSize: 6, fontWeight: 'bold', color: diferencia < 0 ? 'red' : 'green' }}>
                S/ {diferencia.toFixed(2)}
              </Text>
            </View>
          </>
        ) : (
          <View style={{ paddingHorizontal: 4, paddingVertical: 2, backgroundColor: '#fff3cd', marginTop: 1 }}>
            <Text style={{ fontSize: 5, textAlign: 'center', color: '#856404' }}>
              Pendiente de cierre
            </Text>
          </View>
        )}
      </View>

      {/* Observaciones - SIEMPRE mostrar */}
      <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
        <Text style={{ fontSize: 6, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>
          OBSERVACIONES
        </Text>
        <View style={{ paddingHorizontal: 4, paddingVertical: 2, backgroundColor: '#fffbf0' }}>
          <Text style={{ fontSize: 5, textAlign: 'justify' }}>
            {data.comentarios || '-'}
          </Text>
        </View>
      </View>

      {/* Estado del Cierre - Solo si está cerrada */}
      {data.monto_cierre_efectivo !== undefined && (
        <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
          <Text style={{ fontSize: 6, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>
            ESTADO DEL CIERRE
          </Text>
          <View style={{ 
            paddingHorizontal: 4, 
            paddingVertical: 3, 
            backgroundColor: diferencia === 0 ? '#e8f5e9' : '#ffebee',
            textAlign: 'center'
          }}>
            <Text style={{ 
              fontSize: 7, 
              fontWeight: 'bold', 
              color: diferencia === 0 ? 'green' : 'red',
              textAlign: 'center'
            }}>
              {diferencia === 0 ? '✓ CAJA CUADRADA' : diferencia > 0 ? '⚠ SOBRANTE' : '⚠ FALTANTE'}
            </Text>
          </View>
        </View>
      )}

      {/* Tabla de Métodos de Pago */}
      <View style={{ marginBottom: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
        <Text style={{ fontSize: 6, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>
          MÉTODOS DE PAGO
        </Text>
        
        {/* Header de la tabla */}
        <View style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000', paddingBottom: 2, marginBottom: 2 }}>
          <Text style={{ fontSize: 5, fontWeight: 'bold', flex: 1 }}>Método</Text>
          <Text style={{ fontSize: 5, fontWeight: 'bold', width: 25, textAlign: 'center' }}>Cant.</Text>
          <Text style={{ fontSize: 5, fontWeight: 'bold', width: 40, textAlign: 'right' }}>Total</Text>
        </View>
        
        {/* Filas de datos */}
        {resumen.detalle_metodos_pago && resumen.detalle_metodos_pago.length > 0 ? (
          resumen.detalle_metodos_pago.map((metodo, index) => (
            <View key={index} style={{ display: 'flex', flexDirection: 'row', paddingVertical: 1, backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
              <Text style={{ fontSize: 5, flex: 1 }}>{metodo.label}</Text>
              <Text style={{ fontSize: 5, width: 25, textAlign: 'center' }}>{metodo.cantidad_transacciones}</Text>
              <Text style={{ fontSize: 5, width: 40, textAlign: 'right' }}>{metodo.total.toFixed(2)}</Text>
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 5, textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
            Sin métodos de pago registrados
          </Text>
        )}
      </View>

      {/* Total de Ventas */}
      <View style={{ marginBottom: 6 }}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 3, backgroundColor: '#f0f0f0', borderTop: '2px solid #000' }}>
          <Text style={{ fontSize: 7, fontWeight: 'bold' }}>TOTAL VENTAS</Text>
          <Text style={{ fontSize: 7, fontWeight: 'bold' }}>S/ {resumen.total_ventas.toFixed(2)}</Text>
        </View>
        <Text style={{ fontSize: 5, marginTop: 2, textAlign: 'center' }}>
          {NumeroALetras(resumen.total_ventas)}
        </Text>
      </View>
      
      </Page>
    </Document>
  )
}
