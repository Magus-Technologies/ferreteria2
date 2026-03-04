import { Document, Page, Text, View } from '@react-pdf/renderer'
import DocHeader from '~/app/_components/docs/doc-header'
import DocTable from '~/app/_components/docs/doc-table'
import { styles_docs } from '~/app/_components/docs/styles'
import { styles_globales } from '~/components/pdf/table-pdf-ag-grid'
import { NumeroALetras } from '~/utils/numero-a-letras'
import type { OrdenCompra } from '~/lib/api/orden-compra'
import type { EmpresaPublica } from '~/hooks/use-empresa-publica'
import { ColDef } from 'ag-grid-community'

// ============= TYPES =============

interface ProductoOCPdf {
    codigo: string
    nombre: string
    marca: string
    unidad: string
    cantidad: number
    precio: number
    flete: number
    subtotal: number
}

// ============= COMPONENT =============

interface DocOrdenCompraProps {
    orden: OrdenCompra
    empresa?: EmpresaPublica | null
    show_logo_html?: boolean
}

export default function DocOrdenCompra({
    orden,
    empresa,
    show_logo_html = false,
}: DocOrdenCompraProps) {
    if (!orden) return null

    const monedaSimbolo = orden.tipo_moneda === 'd' ? '$' : 'S/.'

    // Preparar productos para la tabla
    const productos: ProductoOCPdf[] = (orden.productos || []).map(p => ({
        codigo: p.codigo || '—',
        nombre: p.nombre || '—',
        marca: p.marca || '—',
        unidad: p.unidad || 'UND',
        cantidad: Number(p.cantidad),
        precio: Number(p.precio),
        flete: Number(p.flete || 0),
        subtotal: Number(p.subtotal),
    }))

    // Calcular totales
    const subtotal = productos.reduce((sum, p) => sum + p.subtotal, 0)
    const fleteTotal = productos.reduce((sum, p) => sum + p.flete, 0)
    const percepcion = Number(orden.percepcion || 0)
    const total = Number(orden.total ?? subtotal + fleteTotal + percepcion)

    // Columnas para DocTable
    const colDefs: ColDef<ProductoOCPdf>[] = [
        { headerName: 'Código', field: 'codigo', width: 50, minWidth: 50 },
        { headerName: 'Descripción', field: 'nombre', flex: 1, minWidth: 120 },
        { headerName: 'Marca', field: 'marca', width: 50, minWidth: 50 },
        { headerName: 'Unid.', field: 'unidad', width: 35, minWidth: 35 },
        {
            headerName: 'Cant.',
            field: 'cantidad',
            width: 35,
            minWidth: 35,
        },
        {
            headerName: 'P. Unit.',
            field: 'precio',
            width: 50,
            minWidth: 50,
            valueFormatter: ({ value }: { value?: number }) =>
                `${monedaSimbolo} ${Number(value ?? 0).toFixed(2)}`,
        },
        {
            headerName: 'Flete',
            field: 'flete',
            width: 45,
            minWidth: 45,
            valueFormatter: ({ value }: { value?: number }) =>
                `${monedaSimbolo} ${Number(value ?? 0).toFixed(2)}`,
        },
        {
            headerName: 'Subtotal',
            field: 'subtotal',
            width: 55,
            minWidth: 55,
            valueFormatter: ({ value }: { value?: number }) =>
                `${monedaSimbolo} ${Number(value ?? 0).toFixed(2)}`,
        },
    ]

    return (
        <Document title={orden.codigo}>
            <Page size="A4" style={styles_globales.page}>
                {/* Header: Logo + Empresa + Documento */}
                <DocHeader
                    empresa={empresa as any}
                    show_logo_html={show_logo_html}
                    tipo_documento="ORDEN DE COMPRA"
                    nro_doc={orden.codigo}
                />

                {/* Información General */}
                <View style={styles_docs.section}>
                    <Text style={styles_docs.titleSectionInformacionGeneral}>Información General</Text>
                    <View style={styles_docs.sectionInformacionGeneral}>
                        <View style={styles_docs.sectionInformacionGeneralColumn}>
                            <View style={styles_docs.subSectionInformacionGeneral}>
                                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>N° Orden:</Text>
                                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{orden.codigo}</Text>
                            </View>
                            <View style={styles_docs.subSectionInformacionGeneral}>
                                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Fecha:</Text>
                                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{orden.fecha}</Text>
                            </View>
                            <View style={styles_docs.subSectionInformacionGeneral}>
                                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Solicitante:</Text>
                                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{orden.user?.name || '—'}</Text>
                            </View>
                        </View>
                        <View style={styles_docs.sectionInformacionGeneralColumn}>
                            <View style={styles_docs.subSectionInformacionGeneral}>
                                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Moneda:</Text>
                                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                                    {orden.tipo_moneda === 's' ? 'Soles (S/.)' : 'Dólares ($)'}
                                </Text>
                            </View>
                            {Number(orden.tipo_de_cambio) > 0 && (
                                <View style={styles_docs.subSectionInformacionGeneral}>
                                    <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>T. Cambio:</Text>
                                    <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                                        {Number(orden.tipo_de_cambio).toFixed(4)}
                                    </Text>
                                </View>
                            )}
                            {orden.requerimiento && (
                                <View style={styles_docs.subSectionInformacionGeneral}>
                                    <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Requerimiento:</Text>
                                    <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                                        {orden.requerimiento.codigo}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Proveedor */}
                <View style={styles_docs.section}>
                    <Text style={styles_docs.titleSectionInformacionGeneral}>Proveedor</Text>
                    <View style={styles_docs.sectionInformacionGeneral}>
                        <View style={styles_docs.sectionInformacionGeneralColumn}>
                            <View style={styles_docs.subSectionInformacionGeneral}>
                                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Razón Social:</Text>
                                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                                    {orden.proveedor?.razon_social || '—'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles_docs.sectionInformacionGeneralColumn}>
                            <View style={styles_docs.subSectionInformacionGeneral}>
                                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>RUC:</Text>
                                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                                    {orden.proveedor?.ruc || orden.ruc || '—'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tabla de Productos */}
                <DocTable colDefs={colDefs} rowData={productos} />

                {/* Total */}
                <View style={styles_docs.section}>
                    <View style={styles_docs.total}>
                        <Text style={{ textAlign: 'left', position: 'absolute', left: 6 }}>
                            {NumeroALetras(total)}
                        </Text>
                        <Text style={styles_docs.textTotal}>TOTAL</Text>
                        <Text>{monedaSimbolo} {total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Totales adicionales si hay flete/percepción */}
                {(fleteTotal > 0 || percepcion > 0) && (
                    <View style={{ ...styles_docs.section, marginTop: 4 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                            <View style={{ width: 160 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
                                    <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Subtotal:</Text>
                                    <Text style={{ fontSize: 8 }}>{monedaSimbolo} {subtotal.toFixed(2)}</Text>
                                </View>
                                {fleteTotal > 0 && (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
                                        <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Flete Total:</Text>
                                        <Text style={{ fontSize: 8 }}>{monedaSimbolo} {fleteTotal.toFixed(2)}</Text>
                                    </View>
                                )}
                                {percepcion > 0 && (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
                                        <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Percepción:</Text>
                                        <Text style={{ fontSize: 8 }}>{monedaSimbolo} {percepcion.toFixed(2)}</Text>
                                    </View>
                                )}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, backgroundColor: '#f0f0f0' }}>
                                    <Text style={{ fontSize: 9, fontWeight: 'bold' }}>TOTAL:</Text>
                                    <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{monedaSimbolo} {total.toFixed(2)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Condiciones de Pago */}
                <View style={styles_docs.section}>
                    <Text style={styles_docs.titleSectionInformacionGeneral}>Condiciones de Pago</Text>
                    <View style={styles_docs.sectionInformacionGeneral}>
                        <View style={styles_docs.sectionInformacionGeneralColumn}>
                            <View style={styles_docs.subSectionInformacionGeneral}>
                                <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Forma de Pago:</Text>
                                <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                                    {orden.forma_de_pago === 'co' ? 'Contado' : 'Crédito'}
                                </Text>
                            </View>
                            {orden.forma_de_pago === 'cr' && (
                                <>
                                    <View style={styles_docs.subSectionInformacionGeneral}>
                                        <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Días Crédito:</Text>
                                        <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                                            {orden.numero_dias} días
                                        </Text>
                                    </View>
                                    <View style={styles_docs.subSectionInformacionGeneral}>
                                        <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Vencimiento:</Text>
                                        <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                                            {orden.fecha_vencimiento || '—'}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                        <View style={styles_docs.sectionInformacionGeneralColumn}>
                            {orden.tipo_documento && (
                                <View style={styles_docs.subSectionInformacionGeneral}>
                                    <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Tipo Doc.:</Text>
                                    <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                                        {orden.tipo_documento}
                                    </Text>
                                </View>
                            )}
                            {orden.serie && (
                                <View style={styles_docs.subSectionInformacionGeneral}>
                                    <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Serie / Nro:</Text>
                                    <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                                        {orden.serie} - {orden.numero}
                                    </Text>
                                </View>
                            )}
                            {orden.guia && (
                                <View style={styles_docs.subSectionInformacionGeneral}>
                                    <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>Guía Rem.:</Text>
                                    <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                                        {orden.guia}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Observaciones */}
                <View style={styles_docs.observaciones}>
                    <Text style={{ fontWeight: 'bold' }}>Observaciones:</Text>
                    <Text>—</Text>
                </View>
            </Page>
        </Document>
    )
}
