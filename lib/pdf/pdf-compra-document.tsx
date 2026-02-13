import { Text, View } from '@react-pdf/renderer'
import { CompraConRelaciones } from './generar-pdf-compra'
import DocGeneral from '~/app/_components/docs/doc-general'
import { styles_docs } from '~/app/_components/docs/styles'
import { ColDef } from 'ag-grid-community'

export default function PDFCompraDocument({
  compra,
  logoDataURI,
}: {
  compra: CompraConRelaciones;
  logoDataURI: string;
}) {
  // Obtener datos de la empresa
  const empresa = compra.user.empresa ? {
    ...compra.user.empresa,
    logo: logoDataURI
  } : null

  // Calcular productos
  const productos = compra.productos_por_almacen.flatMap((pa) =>
    pa.unidades_derivadas.map((ud) => {
      const costo = Number(pa.costo)
      const cantidad = Number(ud.cantidad)
      const factor = Number(ud.factor)
      return {
        codigo: pa.producto_almacen.producto.cod_producto || "",
        nombre: pa.producto_almacen.producto.name,
        marca: pa.producto_almacen.producto.marca.name,
        unidad: ud.unidad_derivada_inmutable.name,
        cantidad: cantidad,
        precio: costo,
        subtotal: cantidad * factor * costo,
      }
    })
  )

  const subtotalTotal = productos.reduce((sum: number, p: any) => sum + p.subtotal, 0)

  // Calcular deuda
  const totalPagado = compra.pagos_de_compras?.reduce(
    (sum, pago) => sum + Number(pago.monto),
    0
  ) || 0
  const deuda = subtotalTotal - totalPagado

  const fechaEmision = new Date(compra.fecha)

  const formatFecha = (fecha: Date) => {
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  const formatHora = (fecha: Date) => {
    const horas = fecha.getHours();
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    const segundos = String(fecha.getSeconds()).padStart(2, "0");
    const periodo = horas >= 12 ? "p. m." : "a. m.";
    const horas12 = horas % 12 || 12;
    return `${String(horas12).padStart(2, "0")}:${minutos}:${segundos} ${periodo}`;
  }

  const colDefs: ColDef[] = [
    { headerName: 'CÓDIGO', field: 'codigo', width: 60 },
    { headerName: 'DESCRIPCIÓN', field: 'nombre', flex: 1 },
    { headerName: 'MARCA', field: 'marca', width: 70 },
    { headerName: 'U.Medida', field: 'unidad', width: 60 },
    { headerName: 'Cantidad', field: 'cantidad', width: 50, valueFormatter: ({ value }) => Number(value).toFixed(2) },
    { headerName: 'Precio', field: 'precio', width: 60, valueFormatter: ({ value }) => Number(value).toFixed(5) },
    { headerName: 'SubTotal', field: 'subtotal', width: 70, valueFormatter: ({ value }) => Number(value).toFixed(2) },
  ]

  return (
    <DocGeneral
      empresa={empresa as any}
      show_logo_html={true}
      tipo_documento="VISTA PREVIA DE FACTURA DE COMPRAS"
      nro_doc={`${compra.serie || '001'}-${String(compra.numero || 0).padStart(6, '0')}`}
      colDefs={colDefs}
      rowData={productos}
      total={subtotalTotal}
      observaciones={compra.descripcion || '- NINGUNA'}
    >
      {/* Información del Proveedor y Compra */}
      <View style={styles_docs.section}>
        <View style={styles_docs.sectionInformacionGeneral}>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>TIPO DOC:</Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{compra.tipo_documento}</Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>PROVEEDOR:</Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {compra.proveedor?.ruc || ''} {compra.proveedor?.razon_social || ''}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>FECHA:</Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {formatFecha(fechaEmision)} {formatHora(fechaEmision)}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>ALMACÉN:</Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{compra.almacen?.name || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles_docs.sectionInformacionGeneralColumn}>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>FORMA PAGO:</Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{compra.forma_de_pago}</Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>TOTAL PAGADO:</Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{totalPagado.toFixed(2)}</Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>DEUDA:</Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{deuda.toFixed(2)}</Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>USUARIO:</Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>{compra.user?.name || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ ...styles_docs.section, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <View style={{ width: 150 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>SUBTOTAL:</Text>
              <Text style={{ fontSize: 9 }}>S/ {(subtotalTotal / 1.18).toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottom: '1px solid #ccc' }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>IGV (18%):</Text>
              <Text style={{ fontSize: 9 }}>S/ {(subtotalTotal - subtotalTotal / 1.18).toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>
    </DocGeneral>
  )
}

