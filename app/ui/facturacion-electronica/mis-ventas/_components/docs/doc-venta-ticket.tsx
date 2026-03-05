'use client'

import { Text, View } from '@react-pdf/renderer'
import DocGeneralTicket from '~/app/_components/docs/doc-general-ticket'
import DocInfoClienteTicket from '~/app/_components/docs/doc-info-cliente-ticket'
import DocMetodosPagoTicket from '~/app/_components/docs/doc-metodos-pago-ticket'
import { styles_ticket } from '~/app/_components/docs/styles'
import { EmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'
import { ColDef } from 'ag-grid-community'
import { ProductoVentaPDF, VentaDataPDF } from './doc-venta'
import { TipoDocumento } from '@prisma/client'
import { TiposDocumentos } from '~/lib/docs'

// ============= COMPONENT =============

export default function DocVentaTicket({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
  estilosCampos,
}: {
  data: VentaDataPDF | undefined
  nro_doc: string
  empresa: EmpresaPublica | undefined
  show_logo_html?: boolean
  estilosCampos?: Record<string, { fontFamily?: string; fontSize?: number; fontWeight?: string }>
}) {
  if (!data) return null

  // Normalizar forma_de_pago para comparaciones
  const esCredito = data.forma_de_pago === 'cr' || data.forma_de_pago === 'Crédito'
  const esContado = data.forma_de_pago === 'co' || data.forma_de_pago === 'Contado'
  
  // Texto a mostrar
  const formaPagoTexto = esCredito ? 'CRÉDITO' : esContado ? 'CONTADO' : (data.forma_de_pago || '-')

  // Función para obtener estilos de un campo
  const getEstiloCampo = (campo: string) => {
    const estilo = estilosCampos?.[campo] || { fontFamily: 'Arial', fontSize: 7, fontWeight: 'normal' }
    
    // React PDF no reconoce "Arial", usar Helvetica o no especificar fontFamily
    const fontFamily = estilo.fontFamily === 'Arial' ? undefined : 
                       estilo.fontFamily === 'Times New Roman' ? 'Times-Roman' :
                       estilo.fontFamily === 'Courier New' ? 'Courier' :
                       estilo.fontFamily
    
    return {
      fontFamily,
      fontSize: estilo.fontSize || 5, // Usar 5 si no hay tamaño personalizado
      fontWeight: estilo.fontWeight || 'normal',
    }
  }

  // Preparar empresa con logo URL
  const empresaConLogo = empresa ? {
    ...empresa,
    logo: getLogoUrl(empresa.logo),
  } : undefined

  // Tabla normal de 5 columnas
  const renderTablaProductos = () => {
    return (
      <View style={{ marginBottom: 6, borderTop: '1px dashed #000000', paddingTop: 6 }}>
        {/* Headers de las 5 columnas */}
        <View style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000000', fontWeight: 'bold', marginBottom: 2, fontSize: 7 }}>
          <Text style={{ width: 90, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>Descripción</Text>
          <Text style={{ width: 30, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>Cant.</Text>
          <Text style={{ width: 35, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>Unid.</Text>
          <Text style={{ width: 35, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>P.U.</Text>
          <Text style={{ width: 36, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>Subt.</Text>
        </View>
        
        {/* Rows de productos */}
        {data.productos.map((producto, idx) => (
          <View 
            key={idx}
            style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              borderBottom: '1px solid #000000',
              paddingVertical: 2,
              fontSize: 6,
              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9'
            }}
          >
            <Text style={{ width: 90, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>
              {producto.descripcion}
            </Text>
            <Text style={{ width: 30, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>
              {producto.cantidad}
            </Text>
            <Text style={{ width: 35, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>
              {producto.unidad}
            </Text>
            <Text style={{ width: 35, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>
              {Number(producto.precio_unitario).toFixed(2)}
            </Text>
            <Text style={{ width: 36, paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}>
              {Number(producto.subtotal).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    )
  }

  // Sección de vale(s) para imprimir al final del ticket (tear-off)
  const renderValeSection = () => {
    if (!data.vales_aplicados || data.vales_aplicados.length === 0) return null

    return (
      <View>
        {data.vales_aplicados.map((vale, idx) => {
          const tipoLabel = vale.tipo_promocion === 'SORTEO' ? 'SORTEO'
            : vale.tipo_promocion === 'DESCUENTO_PROXIMA_COMPRA' ? 'DESCUENTO PRÓXIMA COMPRA'
            : vale.tipo_promocion === 'DESCUENTO_MISMA_COMPRA' ? 'DESCUENTO'
            : vale.tipo_promocion === 'PRODUCTO_GRATIS' ? 'PRODUCTO GRATIS'
            : vale.tipo_promocion === 'DOS_POR_UNO' ? '2x1'
            : vale.tipo_promocion

          const beneficio = vale.descuento_tipo === 'PORCENTAJE' && vale.descuento_valor
            ? `${vale.descuento_valor}% DSCTO`
            : vale.descuento_tipo === 'MONTO_FIJO' && vale.descuento_valor
            ? `S/. ${vale.descuento_valor.toFixed(2)} DSCTO`
            : tipoLabel

          return (
            <View key={idx}>
              {/* Línea punteada para cortar */}
              <View style={{ marginTop: 10, marginBottom: 6, borderTop: '2px dashed #000', paddingTop: 2 }}>
                <Text style={{ fontSize: 5, textAlign: 'center', color: '#666' }}>
                  - - - - - - - - CORTAR AQUÍ - - - - - - - -
                </Text>
              </View>

              {/* Contenido del vale */}
              <View style={{ border: '1.5px solid #000', borderRadius: 4, padding: 6 }}>
                {/* Título */}
                <View style={{ backgroundColor: '#000', padding: 4, marginBottom: 4, borderRadius: 2 }}>
                  <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold', textAlign: 'center' }}>
                    VALE DE COMPRA - {tipoLabel}
                  </Text>
                </View>

                {/* Nombre de la promoción */}
                <Text style={{ fontSize: 7, fontWeight: 'bold', textAlign: 'center', marginBottom: 3 }}>
                  {vale.nombre}
                </Text>

                {/* Beneficio destacado */}
                <View style={{ border: '1px solid #000', padding: 3, marginBottom: 4, borderRadius: 2 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', textAlign: 'center' }}>
                    {beneficio}
                  </Text>
                </View>

                {/* Código del vale */}
                {vale.codigo_vale_generado ? (
                  <View style={{ backgroundColor: '#f0f0f0', padding: 4, marginBottom: 3, borderRadius: 2 }}>
                    <Text style={{ fontSize: 6, textAlign: 'center', marginBottom: 1 }}>CÓDIGO:</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 }}>
                      {vale.codigo_vale_generado}
                    </Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#f0f0f0', padding: 4, marginBottom: 3, borderRadius: 2 }}>
                    <Text style={{ fontSize: 6, textAlign: 'center', marginBottom: 1 }}>CÓDIGO PROMO:</Text>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 }}>
                      {vale.codigo}
                    </Text>
                  </View>
                )}

                {/* Fecha de validez */}
                {vale.fecha_validez_generado && (
                  <Text style={{ fontSize: 6, textAlign: 'center', marginBottom: 2 }}>
                    Válido hasta: {new Date(vale.fecha_validez_generado).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Text>
                )}

                {/* Info de la boleta */}
                <View style={{ borderTop: '1px dashed #999', paddingTop: 3, marginTop: 2 }}>
                  <Text style={{ fontSize: 5, textAlign: 'center', color: '#666' }}>
                    Boleta: {nro_doc} | {new Date(data.fecha).toLocaleDateString('es-ES')}
                  </Text>
                </View>
              </View>
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <DocGeneralTicket
      empresa={empresaConLogo as any}
      show_logo_html={show_logo_html}
      tipo_documento={getTipoDocumentoLabel(data.tipo_documento)}
      nro_doc={nro_doc}
      colDefs={[]}
      rowData={[]}
      total={data.total}
      observaciones={data.observaciones || '-'}
      headerNameAl100=''
      totalConLetras
      getEstiloCampo={getEstiloCampo}
      total_descuento={data.total_descuento}
      op_gravada={data.op_gravada}
      subtotal={data.subtotal}
      igv={data.igv}
      afterContent={renderValeSection()}
    >
      {/* Información de la Venta */}
      <View style={{ marginBottom: 2 }}>
        <View
          style={{
            ...styles_ticket.sectionInformacionGeneral,
            paddingBottom: 12,
          }}
        >
          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
            
            {/* Forma de Pago - Ocupa todo el ancho */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Forma Pago:
              </Text>
              <Text style={{
                ...styles_ticket.textValueSubSectionInformacionGeneral,
                ...getEstiloCampo('forma_pago')
              }}>
                {formaPagoTexto}
              </Text>
            </View>

            {/* Fecha de Emisión y Hora - 2 columnas */}
            <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
              {/* Columna Izquierda: Fecha de Emisión */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  F. Emisión:
                </Text>
                <Text style={getEstiloCampo('fecha')}>
                  {new Date(data.fecha).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              {/* Columna Derecha: Hora */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Hora:
                </Text>
                <Text style={getEstiloCampo('hora')}>
                  {new Date(data.fecha).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            {/* F. Vencimiento y N° Guía - 2 columnas (solo si es crédito) */}
            {esCredito && (
              <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
                {/* Columna Izquierda: F. Vencimiento */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                    F. Vencimiento:
                  </Text>
                  <Text style={getEstiloCampo('fecha_vencimiento')}>
                    {data.fecha_vencimiento 
                      ? new Date(data.fecha_vencimiento).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '-'}
                  </Text>
                </View>

                {/* Columna Derecha: N° Guía */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: 2, width: '50%', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                    N° Guía:
                  </Text>
                  <Text style={getEstiloCampo('numero_guia')}>
                    {data.numero_guia || '-'}
                  </Text>
                </View>
              </View>
            )}

            {/* N° Guía solo (cuando NO es crédito) */}
            {!esCredito && (
              <View style={styles_ticket.subSectionInformacionGeneral}>
                <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                  N° Guía:
                </Text>
                <Text style={{
                  ...styles_ticket.textValueSubSectionInformacionGeneral,
                  ...getEstiloCampo('numero_guia')
                }}>
                  {data.numero_guia || '-'}
                </Text>
              </View>
            )}

            {/* Vendedor - Ocupa todo el ancho */}
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Vendedor:
              </Text>
              <Text style={{
                ...styles_ticket.textValueSubSectionInformacionGeneral,
                ...getEstiloCampo('vendedor')
              }}>
                {data.vendedor || '-'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Información del Cliente - Componente Reutilizable */}
      <DocInfoClienteTicket
        cliente={data.cliente}
        getEstiloCampo={getEstiloCampo}
      />

      {/* Métodos de Pago - Componente Reutilizable */}
      <DocMetodosPagoTicket
        metodos_de_pago={data.metodos_de_pago || []}
        getEstiloCampo={getEstiloCampo}
      />
      
      {/* Tabla de productos - 5 columnas */}
      {renderTablaProductos()}
    </DocGeneralTicket>
  )
}

// ============= HELPERS =============

/**
 * Mapea el código de tipo de documento de Laravel al enum de Prisma
 */
function mapLaravelTipoDocumentoToPrisma(laravelCode: string): TipoDocumento {
  const mapping: Record<string, TipoDocumento> = {
    '01': TipoDocumento.Factura,
    '03': TipoDocumento.Boleta,
    'nv': TipoDocumento.NotaDeVenta,
    'in': TipoDocumento.Ingreso,
    'sa': TipoDocumento.Salida,
    'rc': TipoDocumento.RecepcionAlmacen,
  }
  return mapping[laravelCode] || TipoDocumento.NotaDeVenta
}

/**
 * Obtiene el label del tipo de documento usando TiposDocumentos
 */
function getTipoDocumentoLabel(laravelCode: string): string {
  const tipoDocEnum = mapLaravelTipoDocumentoToPrisma(laravelCode)
  return TiposDocumentos[tipoDocEnum].name.toUpperCase()
}
