'use client'

import { Text, View } from '@react-pdf/renderer'
import DocGeneralTicket from '~/app/_components/docs/doc-general-ticket'
import { styles_ticket } from '~/app/_components/docs/styles'
import { ValeCompra } from '~/lib/api/vales-compra'
import { EmpresaPublica, getLogoUrl } from '~/hooks/use-empresa-publica'

// ============= TYPES =============

interface DocValeTicketProps {
  vale: ValeCompra
  empresa?: EmpresaPublica | null
}

// ============= COMPONENT =============

export default function DocValeTicket({ vale, empresa }: DocValeTicketProps) {
  const empresaConLogo = empresa ? {
    ...empresa,
    logo: getLogoUrl(empresa.logo),
  } : undefined

  const tipoPromocionLabel = {
    SORTEO: 'Sorteo',
    DESCUENTO_MISMA_COMPRA: 'Descuento en esta Compra',
    DESCUENTO_PROXIMA_COMPRA: 'Vale para Próxima Compra',
    PRODUCTO_GRATIS: 'Producto Gratis',
  }[vale.tipo_promocion]

  const modalidadLabel = {
    CANTIDAD_MINIMA: 'Por Cantidad Mínima',
    POR_CATEGORIA: 'Por Categoría',
    POR_PRODUCTOS: 'Por Productos',
    MIXTO: 'Modalidad Mixta',
  }[vale.modalidad]

  // Preparar datos de beneficio
  let beneficioTexto = ''
  if (vale.tipo_promocion === 'DESCUENTO_MISMA_COMPRA' || vale.tipo_promocion === 'DESCUENTO_PROXIMA_COMPRA') {
    beneficioTexto = vale.descuento_tipo === 'PORCENTAJE'
      ? `${vale.descuento_valor}% de descuento`
      : `S/ ${vale.descuento_valor} de descuento`
  } else if (vale.tipo_promocion === 'PRODUCTO_GRATIS') {
    beneficioTexto = `${vale.cantidad_producto_gratis} ${vale.producto_gratis?.name || 'producto(s)'} GRATIS`
  } else if (vale.tipo_promocion === 'SORTEO') {
    beneficioTexto = 'Participación en sorteo'
  }

  return (
    <DocGeneralTicket
      empresa={empresaConLogo as any}
      show_logo_html={true}
      tipo_documento="VALE DE COMPRA"
      nro_doc={vale.codigo}
      colDefs={[]}
      rowData={[]}
      total={0}
      observaciones=""
      headerNameAl100=""
    >
      {/* Información Compacta */}
      <View style={{ gap: 3 }}>
        {/* Nombre y Tipo */}
        <View>
          <Text style={{ fontWeight: 'bold', fontSize: 7 }}>
            {vale.nombre}
          </Text>
          <Text style={{ fontSize: 6 }}>
            {tipoPromocionLabel} - {modalidadLabel}
          </Text>
        </View>

        {/* Beneficio */}
        <View style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', paddingVertical: 3 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>
            {beneficioTexto}
          </Text>
        </View>

        {/* Condiciones */}
        <View>
          <Text style={{ fontSize: 6 }}>
            • Compra mínima: {vale.cantidad_minima} unidades
          </Text>
          <Text style={{ fontSize: 6 }}>
            • Válido: {new Date(vale.fecha_inicio).toLocaleDateString('es-ES')} - {vale.fecha_fin ? new Date(vale.fecha_fin).toLocaleDateString('es-ES') : 'Sin límite'}
          </Text>
          {vale.usa_limite_por_cliente && vale.limite_usos_cliente && (
            <Text style={{ fontSize: 6 }}>
              • Máx. {vale.limite_usos_cliente} uso(s) por cliente
            </Text>
          )}
        </View>
      </View>
    </DocGeneralTicket>
  )
}
