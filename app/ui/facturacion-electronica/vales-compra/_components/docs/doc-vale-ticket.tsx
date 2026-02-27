'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { ValeCompra } from '~/lib/api/vales-compra'
import { EmpresaPublica } from '~/hooks/use-empresa-publica'
import dayjs from 'dayjs'

interface DocValeTicketProps {
  vale: ValeCompra
  empresa?: EmpresaPublica | null
  show_logo_html?: boolean
}

const ACCENT = '#D97706'
const ACCENT_LIGHT = '#FEF3C7'
const ACCENT_DARK = '#92400E'
const DARK = '#1F2937'

const s = StyleSheet.create({
  page: {
    padding: 8,
    fontSize: 7,
    color: DARK,
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  outerBorder: {
    border: `2.5px solid ${ACCENT}`,
    borderRadius: 8,
    padding: 4,
    width: '100%',
  },
  innerBorder: {
    border: `1px dashed ${ACCENT}`,
    borderRadius: 6,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
  },
  // Decorativo
  deco: {
    fontSize: 7,
    textAlign: 'center',
    letterSpacing: 2,
    color: ACCENT,
  },
  // Empresa
  empresaNombre: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    color: DARK,
  },
  empresaDatos: {
    fontSize: 5.5,
    textAlign: 'center',
    color: '#6B7280',
  },
  // Banner
  banner: {
    backgroundColor: ACCENT,
    width: '100%',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  bannerSub: {
    fontSize: 7,
    color: '#fff',
    textAlign: 'center',
    marginTop: 1,
  },
  // Código
  codigoBox: {
    backgroundColor: ACCENT_LIGHT,
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 4,
    border: `1.5px solid ${ACCENT}`,
    display: 'flex',
    alignItems: 'center',
  },
  codigoLabel: {
    fontSize: 5.5,
    textAlign: 'center',
    color: ACCENT_DARK,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  codigoTexto: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 4,
    color: ACCENT_DARK,
  },
  // Nombre
  nombre: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    color: DARK,
  },
  desc: {
    fontSize: 6,
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  // Hero - beneficio (usa border en vez de background oscuro para que se vea en preview)
  heroBox: {
    width: '100%',
    border: `2.5px solid ${ACCENT}`,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    backgroundColor: ACCENT_LIGHT,
  },
  heroTexto: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: ACCENT_DARK,
  },
  heroSub: {
    fontSize: 7,
    textAlign: 'center',
    color: ACCENT_DARK,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  // Separadores
  sep: {
    width: '100%',
    borderBottom: `1px dashed ${ACCENT}`,
    marginVertical: 2,
  },
  sepFuerte: {
    width: '70%',
    borderBottom: `2px solid ${ACCENT}`,
    marginVertical: 2,
  },
  // Info
  infoBox: {
    width: '100%',
    backgroundColor: ACCENT_LIGHT,
    borderRadius: 4,
    padding: 6,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  infoLabel: {
    fontSize: 6,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: ACCENT_DARK,
  },
  infoVal: {
    fontSize: 6,
    textAlign: 'right',
    color: DARK,
    fontWeight: 'bold',
  },
  // Listas
  listaWrap: {
    width: '100%',
    paddingHorizontal: 2,
  },
  listaTitle: {
    fontSize: 6.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: ACCENT_DARK,
    marginBottom: 2,
  },
  listaItem: {
    fontSize: 6,
    paddingLeft: 6,
    color: DARK,
    marginBottom: 1,
  },
  // Badges
  badgesRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    width: '100%',
  },
  badge: {
    backgroundColor: ACCENT,
    color: '#fff',
    fontSize: 5.5,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  // Condiciones
  condBox: {
    width: '100%',
    border: `1px solid #D1D5DB`,
    borderRadius: 4,
    padding: 5,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  condTitle: {
    fontSize: 6,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 1,
  },
  condItem: {
    fontSize: 5,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Footer
  footer: {
    fontSize: 5,
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 2,
  },
})

// Formatear porcentaje sin decimales innecesarios
function fmtPct(val: number | null | undefined): string {
  if (!val) return '0'
  const n = Number(val)
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)
}

export default function DocValeTicket({ vale, empresa }: DocValeTicketProps) {
  const tipoLabel: Record<string, string> = {
    SORTEO: 'SORTEO',
    DESCUENTO_MISMA_COMPRA: 'DESCUENTO',
    DESCUENTO_PROXIMA_COMPRA: 'VALE DESCUENTO',
    PRODUCTO_GRATIS: 'PRODUCTO GRATIS',
  }

  const modalidadLabel: Record<string, string> = {
    CANTIDAD_MINIMA: 'Por Cantidad Minima',
    POR_CATEGORIA: 'Por Categoria',
    POR_PRODUCTOS: 'Por Productos Especificos',
    MIXTO: 'Mixto (Categoria + Productos)',
  }

  let beneficioPrincipal = ''
  let beneficioDetalle = ''
  if (vale.tipo_promocion === 'DESCUENTO_MISMA_COMPRA' || vale.tipo_promocion === 'DESCUENTO_PROXIMA_COMPRA') {
    beneficioPrincipal = vale.descuento_tipo === 'PORCENTAJE'
      ? `${fmtPct(vale.descuento_valor)}%`
      : `S/ ${Number(vale.descuento_valor).toFixed(2)}`
    beneficioDetalle = vale.tipo_promocion === 'DESCUENTO_PROXIMA_COMPRA'
      ? 'Descuento en tu proxima compra'
      : 'Descuento en esta compra'
  } else if (vale.tipo_promocion === 'PRODUCTO_GRATIS') {
    beneficioPrincipal = 'GRATIS'
    beneficioDetalle = `${vale.cantidad_producto_gratis}x ${vale.producto_gratis?.name || 'Producto'}`
  } else if (vale.tipo_promocion === 'SORTEO') {
    beneficioPrincipal = 'SORTEO'
    beneficioDetalle = 'Participas automaticamente'
  }

  const fechaInicio = dayjs(vale.fecha_inicio).format('DD/MM/YYYY')
  const fechaFin = vale.fecha_fin ? dayjs(vale.fecha_fin).format('DD/MM/YYYY') : 'Sin limite'
  const cantMin = Number(vale.cantidad_minima) % 1 === 0
    ? Number(vale.cantidad_minima).toFixed(0)
    : String(vale.cantidad_minima)

  const precios = [
    vale.aplica_precio_publico && 'Publico',
    vale.aplica_precio_especial && 'Especial',
    vale.aplica_precio_minimo && 'Minimo',
    vale.aplica_precio_ultimo && 'Ultimo',
  ].filter(Boolean) as string[]

  return (
    <Document title={`Vale ${vale.codigo}`}>
      <Page
        size={{ width: 80 / 0.3528, height: 400 / 0.3528 }}
        style={s.page}
      >
        <View style={s.outerBorder}>
          <View style={s.innerBorder}>

            {/* Decorativo */}
            <Text style={s.deco}>- - - - - - - - - - -</Text>

            {/* Empresa */}
            <View style={{ alignItems: 'center', gap: 1, width: '100%' }}>
              <Text style={s.empresaNombre}>
                {empresa?.razon_social || empresa?.nombre_comercial || 'FERRETERIA'}
              </Text>
              {empresa?.ruc && <Text style={s.empresaDatos}>RUC: {empresa.ruc}</Text>}
              {empresa?.direccion && <Text style={s.empresaDatos}>{empresa.direccion}</Text>}
              {empresa?.telefono && <Text style={s.empresaDatos}>Tel: {empresa.telefono}</Text>}
            </View>

            {/* Banner tipo */}
            <View style={s.banner}>
              <Text style={s.bannerText}>
                {tipoLabel[vale.tipo_promocion] || 'VALE'}
              </Text>
              <Text style={s.bannerSub}>Vale de Compra</Text>
            </View>

            {/* Codigo */}
            <View style={s.codigoBox}>
              <Text style={s.codigoLabel}>Codigo</Text>
              <Text style={s.codigoTexto}>{vale.codigo}</Text>
            </View>

            {/* Nombre */}
            <Text style={s.nombre}>{vale.nombre}</Text>
            {vale.descripcion && <Text style={s.desc}>{vale.descripcion}</Text>}

            {/* HERO beneficio */}
            <View style={s.heroBox}>
              <Text style={s.heroTexto}>{beneficioPrincipal}</Text>
              <Text style={s.heroSub}>{beneficioDetalle}</Text>
            </View>

            <View style={s.sepFuerte} />

            {/* Info */}
            <View style={s.infoBox}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Compra minima</Text>
                <Text style={s.infoVal}>{cantMin} und.</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Modalidad</Text>
                <Text style={s.infoVal}>{modalidadLabel[vale.modalidad]}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Desde</Text>
                <Text style={s.infoVal}>{fechaInicio}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Hasta</Text>
                <Text style={s.infoVal}>{fechaFin}</Text>
              </View>
              {vale.tipo_promocion === 'DESCUENTO_PROXIMA_COMPRA' && vale.fecha_validez_vale && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Vale valido hasta</Text>
                  <Text style={s.infoVal}>{dayjs(vale.fecha_validez_vale).format('DD/MM/YYYY')}</Text>
                </View>
              )}
              {vale.usa_limite_por_cliente && vale.limite_usos_cliente && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Max. por cliente</Text>
                  <Text style={s.infoVal}>{vale.limite_usos_cliente} uso(s)</Text>
                </View>
              )}
              {vale.usa_limite_stock && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Disponibles</Text>
                  <Text style={s.infoVal}>{vale.stock_disponible ?? 0}</Text>
                </View>
              )}
            </View>

            {/* Productos */}
            {vale.productos && vale.productos.length > 0 && (
              <View style={s.listaWrap}>
                <Text style={s.listaTitle}>Productos aplicables</Text>
                {vale.productos.map((p, i) => (
                  <Text key={i} style={s.listaItem}>
                    - {p.cod_producto}: {p.name}
                  </Text>
                ))}
              </View>
            )}

            {/* Categorias */}
            {vale.categorias && vale.categorias.length > 0 && (
              <View style={s.listaWrap}>
                <Text style={s.listaTitle}>Categorias aplicables</Text>
                {vale.categorias.map((c, i) => (
                  <Text key={i} style={s.listaItem}>
                    - {c.name}
                  </Text>
                ))}
              </View>
            )}

            {/* Precios badges */}
            {precios.length > 0 && (
              <View style={{ width: '100%', alignItems: 'center', gap: 3 }}>
                <Text style={s.listaTitle}>Aplica a precios</Text>
                <View style={s.badgesRow}>
                  {precios.map((p, i) => (
                    <Text key={i} style={s.badge}>{p}</Text>
                  ))}
                </View>
              </View>
            )}

            <View style={s.sep} />

            {/* Condiciones */}
            <View style={s.condBox}>
              <Text style={s.condTitle}>Condiciones de uso</Text>
              <Text style={s.condItem}>Valido unicamente en tienda</Text>
              <Text style={s.condItem}>No acumulable con otras promociones</Text>
              <Text style={s.condItem}>Sujeto a disponibilidad de stock</Text>
            </View>

            {/* Decorativo */}
            <Text style={s.deco}>- - - - - - - - - - -</Text>

            {/* Footer */}
            <Text style={s.footer}>
              Generado el {dayjs().format('DD/MM/YYYY HH:mm')}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
