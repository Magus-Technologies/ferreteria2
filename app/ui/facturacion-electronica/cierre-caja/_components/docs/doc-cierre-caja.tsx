'use client'

import { Text, View } from '@react-pdf/renderer'
import DocGeneral from '~/app/_components/docs/doc-general'
import { styles_docs } from '~/app/_components/docs/styles'
import { EmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'
import { ColDef } from 'ag-grid-community'

// ============= TYPES =============

export interface MetodoPagoCierrePDF {
  label: string
  cantidad_transacciones: number
  total: number
}

export interface CierreCajaDataPDF {
  id: number
  fecha_apertura: string
  fecha_cierre?: string
  estado: string
  caja_principal: {
    name?: string
    nombre?: string
  }
  user: {
    name: string
  }
  resumen: {
    efectivo_inicial: number
    detalle_metodos_pago: MetodoPagoCierrePDF[]
    total_ventas: number
    total_ingresos: number
    total_egresos: number
    total_prestamos_recibidos: number
    total_prestamos_dados: number
    monto_esperado: number
    prestamos_recibidos?: any[]
    prestamos_dados?: any[]
    movimientos_internos?: any[]
  }
  monto_cierre_efectivo?: number
  total_cuentas?: number
  conteo_billetes_monedas?: any
  comentarios?: string
  supervisor?: {
    name: string
  }
}

// ============= COMPONENT =============

export default function DocCierreCaja({
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

  // Calcular el efectivo esperado (solo el método "Efectivo")
  const efectivoEsperado = resumen.detalle_metodos_pago
    ?.filter((metodo: MetodoPagoCierrePDF) => 
      metodo.label?.toLowerCase().includes('efectivo')
    )
    .reduce((sum: number, metodo: MetodoPagoCierrePDF) => sum + metodo.total, 0) || 0

  // Calcular diferencias basadas en EFECTIVO, no en el total
  const montoEsperado = resumen.efectivo_inicial + efectivoEsperado
  const montoCierre = data.monto_cierre_efectivo || 0
  const diferencia = montoCierre - montoEsperado
  const faltante = diferencia < 0 ? Math.abs(diferencia) : 0
  const sobrante = diferencia > 0 ? diferencia : 0

  // Calcular otros ingresos y gastos
  const otrosIngresos = (resumen.total_ingresos || 0) - (resumen.total_ventas || 0) - (resumen.total_prestamos_recibidos || 0)
  const gastos = (resumen.total_egresos || 0) - (resumen.total_prestamos_dados || 0)

  // Definir columnas para la tabla de métodos de pago
  const colDefs: ColDef<MetodoPagoCierrePDF>[] = [
    {
      headerName: 'Método de Pago',
      field: 'label',
      flex: 1,
      minWidth: 150,
    },
    {
      headerName: 'Cant.',
      field: 'cantidad_transacciones',
      width: 60,
      minWidth: 60,
    },
    {
      headerName: 'Total',
      field: 'total',
      width: 100,
      minWidth: 100,
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

  return (
    <DocGeneral
      empresa={empresaConLogo as any}
      show_logo_html={show_logo_html}
      tipo_documento='CIERRE DE CAJA'
      nro_doc={nro_doc}
      colDefs={colDefs}
      rowData={resumen.detalle_metodos_pago || []}
      total={resumen.monto_esperado}
      observaciones={data.comentarios || '-'}
      totalConLetras={false}
    >
      {/* Información del Cierre */}
      <View style={styles_docs.section}>
        <View style={styles_docs.sectionInformacionGeneral}>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            {/* Fecha de Apertura */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Fecha de Apertura:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {new Date(data.fecha_apertura).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {/* Fecha de Cierre */}
            {data.fecha_cierre && (
              <View style={styles_docs.subSectionInformacionGeneral}>
                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                  Fecha de Cierre:
                </Text>
                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                  {new Date(data.fecha_cierre).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}

            {/* Caja */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Caja:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data.caja_principal?.nombre || data.caja_principal?.name || '-'}
              </Text>
            </View>
          </View>

          <View style={styles_docs.sectionInformacionGeneralColumn}>
            {/* Usuario */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Usuario:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data.user?.name || '-'}
              </Text>
            </View>

            {/* Supervisor - SIEMPRE mostrar */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Supervisor:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data.supervisor?.name || '-'}
              </Text>
            </View>

            {/* Estado */}
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Estado:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data.estado === 'abierta' ? 'ABIERTA' : 'CERRADA'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Resumen de Saldos */}
      <View style={{ ...styles_docs.section, marginTop: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Resumen de Saldos</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Efectivo Inicial:</Text>
          <Text style={{ fontSize: 10 }}>S/ {resumen.efectivo_inicial.toFixed(2)}</Text>
        </View>
      </View>

      {/* Movimientos */}
      <View style={{ ...styles_docs.section, marginTop: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Movimientos de Caja</Text>
        
        {otrosIngresos > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
            <Text style={{ fontSize: 10 }}>Otros Ingresos:</Text>
            <Text style={{ fontSize: 10 }}>S/ {otrosIngresos.toFixed(2)}</Text>
          </View>
        )}

        {resumen.total_prestamos_recibidos > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
            <Text style={{ fontSize: 10 }}>Préstamos Recibidos ({resumen.prestamos_recibidos?.length || 0}):</Text>
            <Text style={{ fontSize: 10 }}>S/ {resumen.total_prestamos_recibidos.toFixed(2)}</Text>
          </View>
        )}

        {gastos > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
            <Text style={{ fontSize: 10 }}>Gastos:</Text>
            <Text style={{ fontSize: 10, color: 'red' }}>S/ {gastos.toFixed(2)}</Text>
          </View>
        )}

        {resumen.total_prestamos_dados > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
            <Text style={{ fontSize: 10 }}>Préstamos Dados ({resumen.prestamos_dados?.length || 0}):</Text>
            <Text style={{ fontSize: 10, color: 'red' }}>S/ {resumen.total_prestamos_dados.toFixed(2)}</Text>
          </View>
        )}

        {resumen.movimientos_internos && resumen.movimientos_internos.length > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc', backgroundColor: '#e3f2fd' }}>
            <Text style={{ fontSize: 10 }}>Movimientos Internos ({resumen.movimientos_internos.length}) (no afecta total):</Text>
            <Text style={{ fontSize: 10 }}>
              S/ {resumen.movimientos_internos.reduce((sum: number, m: any) => sum + Number(m.monto), 0).toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {/* Totales */}
      <View style={{ ...styles_docs.section, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <View style={{ width: 200 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Resumen Ventas:</Text>
              <Text style={{ fontSize: 10 }}>S/ {resumen.total_ventas.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Resumen Ingresos:</Text>
              <Text style={{ fontSize: 10 }}>S/ {resumen.total_ingresos.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Resumen Egresos:</Text>
              <Text style={{ fontSize: 10, color: 'red' }}>S/ {resumen.total_egresos.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, backgroundColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold' }}>Total en Caja (Efectivo):</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold' }}>S/ {montoEsperado.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Cierre Físico - SIEMPRE mostrar */}
      {data.monto_cierre_efectivo !== undefined ? (
        <View style={{ ...styles_docs.section, marginTop: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Cierre Físico</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
            <Text style={{ fontSize: 10 }}>Dinero Efectivo:</Text>
            <Text style={{ fontSize: 10 }}>S/ {montoCierre.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
            <Text style={{ fontSize: 10 }}>Total Cuentas:</Text>
            <Text style={{ fontSize: 10 }}>S/ {(data.total_cuentas || 0).toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, backgroundColor: '#f0f0f0' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Total Cierre Físico:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>S/ {(montoCierre + (data.total_cuentas || 0)).toFixed(2)}</Text>
          </View>
        </View>
      ) : (
        <View style={{ ...styles_docs.section, marginTop: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Cierre Físico</Text>
          <View style={{ padding: 6, backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4 }}>
            <Text style={{ fontSize: 10, textAlign: 'center', color: '#856404' }}>
              Pendiente de cierre
            </Text>
          </View>
        </View>
      )}

      {/* Diferencias - SIEMPRE mostrar */}
      <View style={{ ...styles_docs.section, marginTop: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Diferencias</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc', backgroundColor: '#e3f2fd' }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Monto Esperado:</Text>
          <Text style={{ fontSize: 10, fontWeight: 'bold' }}>S/ {montoEsperado.toFixed(2)}</Text>
        </View>
        {data.monto_cierre_efectivo !== undefined ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
              <Text style={{ fontSize: 10 }}>Sobrante:</Text>
              <Text style={{ fontSize: 10, color: 'green' }}>S/ {sobrante.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
              <Text style={{ fontSize: 10 }}>Faltante:</Text>
              <Text style={{ fontSize: 10, color: 'red' }}>S/ {faltante.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, backgroundColor: diferencia < 0 ? '#ffebee' : '#e8f5e9' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Diferencia Total:</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: diferencia < 0 ? 'red' : 'green' }}>
                S/ {diferencia.toFixed(2)}
              </Text>
            </View>
          </>
        ) : (
          <View style={{ padding: 6, backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, marginTop: 4 }}>
            <Text style={{ fontSize: 10, textAlign: 'center', color: '#856404' }}>
              Pendiente de cierre
            </Text>
          </View>
        )}
      </View>

      {/* Observaciones - SIEMPRE mostrar */}
      <View style={{ ...styles_docs.section, marginTop: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Observaciones</Text>
        <View style={{ padding: 6, backgroundColor: '#fffbf0', border: '1px solid #e0e0e0', borderRadius: 4 }}>
          <Text style={{ fontSize: 10, textAlign: 'justify' }}>
            {data.comentarios || '-'}
          </Text>
        </View>
      </View>

      {/* Estado del Cierre - Solo si está cerrada */}
      {data.monto_cierre_efectivo !== undefined && (
        <View style={{ ...styles_docs.section, marginTop: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Estado del Cierre</Text>
          <View style={{ 
            padding: 8, 
            backgroundColor: diferencia === 0 ? '#e8f5e9' : '#ffebee',
            border: `2px solid ${diferencia === 0 ? 'green' : 'red'}`,
            borderRadius: 4,
            textAlign: 'center'
          }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: 'bold', 
              color: diferencia === 0 ? 'green' : 'red',
              textAlign: 'center'
            }}>
              {diferencia === 0 ? '✓ CAJA CUADRADA' : diferencia > 0 ? '⚠ SOBRANTE DE S/ ' + sobrante.toFixed(2) : '⚠ FALTANTE DE S/ ' + faltante.toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </DocGeneral>
  )
}
