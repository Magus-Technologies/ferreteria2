"use client";

import { Text, View } from "@react-pdf/renderer";
import { TipoDocumento } from "@prisma/client";
import { TiposDocumentos } from "~/lib/docs";
import { useColumnsDocIngresoSalida } from "../tables/columns-doc-ingreso-salida";
import { DataDocIngresoSalida } from "./doc-ingreso-salida";
import DocGeneralTicket from "~/app/_components/docs/doc-general-ticket";
import { styles_ticket } from "~/app/_components/docs/styles";
import type { Empresa } from "~/lib/api";

export default function DocIngresoSalidaTicket({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
  estilosCampos,
}: {
  data: DataDocIngresoSalida;
  nro_doc: string;
  empresa: Empresa | null | undefined;
  show_logo_html?: boolean;
  estilosCampos?: Record<
    string,
    { fontFamily?: string; fontSize?: number; fontWeight?: string }
  >;
}) {
  console.log("📄 DocIngresoSalidaTicket recibió data:", data);
  console.log("📄 data.almacen:", data?.almacen);
  console.log("📄 data.user:", data?.user);
  console.log("📄 data.tipo_ingreso:", data?.tipo_ingreso);
  console.log("📄 data.productos_por_almacen:", data?.productos_por_almacen);
  // Función para obtener estilos de un campo
  const getEstiloCampo = (campo: string) => {
    const estilo = estilosCampos?.[campo] || {
      fontFamily: "Arial",
      fontSize: 8,
      fontWeight: "normal",
    };

    // React PDF no reconoce "Arial", usar Helvetica o no especificar fontFamily
    const fontFamily =
      estilo.fontFamily === "Arial"
        ? undefined
        : estilo.fontFamily === "Times New Roman"
          ? "Times-Roman"
          : estilo.fontFamily === "Courier New"
            ? "Courier"
            : estilo.fontFamily;

    return {
      fontFamily,
      fontSize: estilo.fontSize,
      fontWeight: estilo.fontWeight,
    };
  };

  const rowData =
    data?.productos_por_almacen?.flatMap((pa) =>
      pa.unidades_derivadas?.map((ud) => ({
        ...ud,
        producto_almacen_ingreso_salida: {
          ...pa,
          producto_almacen: {
            ...pa.producto_almacen,
            producto: pa.producto_almacen.producto,
          },
        },
        unidad_derivada_inmutable: ud.unidad_derivada_inmutable,
      })),
    ) ?? [];

  // Convertir tipo de documento de Laravel (usa códigos: 'in', 'sa') a Prisma
  const tipoDocumentoPrisma =
    data?.tipo_documento === "Ingreso"
      ? TipoDocumento.Ingreso
      : TipoDocumento.Salida;
  const tipo_documento = data?.tipo_documento
    ? TiposDocumentos[tipoDocumentoPrisma].name
    : "";

  const colDefs = useColumnsDocIngresoSalida({
    estado: data?.estado || false,
    tipo_documento: tipoDocumentoPrisma,
  });

  colDefs.find((col) => col.headerName === "Código")!.width = 35;
  colDefs.find((col) => col.headerName === "Código")!.minWidth = 35;
  colDefs.find((col) => col.headerName === "Cantidad")!.width = 30;
  colDefs.find((col) => col.headerName === "Cantidad")!.minWidth = 30;
  colDefs.find((col) => col.headerName === "Unidad Derivada")!.width = 40;
  colDefs.find((col) => col.headerName === "Unidad Derivada")!.minWidth = 40;
  colDefs.find((col) => col.headerName === "Unidad Derivada")!.flex = undefined;
  colDefs.find((col) => col.headerName === "Producto")!.flex = 1;
  colDefs.find((col) => col.headerName === "Stock Anterior")!.width = 35;
  colDefs.find((col) => col.headerName === "Stock Anterior")!.minWidth = 35;
  colDefs.find((col) => col.headerName === "Stock Nuevo")!.width = 35;
  colDefs.find((col) => col.headerName === "Stock Nuevo")!.minWidth = 35;
  colDefs.find((col) => col.headerName === "Costo")!.width = 35;
  colDefs.find((col) => col.headerName === "Costo")!.minWidth = 35;

  return (
    <DocGeneralTicket
      empresa={empresa}
      show_logo_html={show_logo_html}
      tipo_documento={tipo_documento}
      nro_doc={nro_doc}
      colDefs={colDefs}
      rowData={rowData}
      total={rowData.reduce(
        (acc, item) =>
          acc +
          Number(item.cantidad) *
            Number(item.producto_almacen_ingreso_salida.costo) *
            Number(item.factor),
        0,
      )}
      observaciones={data?.descripcion ?? "-"}
      headerNameAl100="Producto"
      totalConLetras
      getEstiloCampo={getEstiloCampo}
    >
      <View style={{ marginBottom: 2 }}>
        <View
          style={{
            ...styles_ticket.sectionInformacionGeneral,
            paddingBottom: 12,
          }}
        >
          <View style={styles_ticket.sectionInformacionGeneralColumn}>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Fecha de Emisión:
              </Text>
              <Text
                style={{
                  ...styles_ticket.textValueSubSectionInformacionGeneral,
                  ...getEstiloCampo("fecha"),
                }}
              >
                {new Date(data?.fecha || "").toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Almacén:
              </Text>
              <Text
                style={{
                  ...styles_ticket.textValueSubSectionInformacionGeneral,
                  ...getEstiloCampo("almacen"),
                }}
              >
                {data?.almacen?.name ?? "-"}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Usuario:
              </Text>
              <Text
                style={{
                  ...styles_ticket.textValueSubSectionInformacionGeneral,
                  ...getEstiloCampo("usuario"),
                }}
              >
                {data?.user?.name ?? "-"}
              </Text>
            </View>
          </View>
          <View
            style={{
              ...styles_ticket.sectionInformacionGeneralColumn,
            }}
          >
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Proveedor:
              </Text>
              <Text
                style={{
                  ...styles_ticket.textValueSubSectionInformacionGeneral,
                  ...getEstiloCampo("proveedor"),
                }}
              >
                {data?.proveedor?.razon_social ?? "-"}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Tipo de {tipo_documento}:
              </Text>
              <Text
                style={{
                  ...styles_ticket.textValueSubSectionInformacionGeneral,
                  ...getEstiloCampo("tipo_ingreso"),
                }}
              >
                {data?.tipo_ingreso?.name ?? "-"}
              </Text>
            </View>
            <View style={styles_ticket.subSectionInformacionGeneral}>
              <Text style={styles_ticket.textTitleSubSectionInformacionGeneral}>
                Observaciones:
              </Text>
              <Text
                style={{
                  ...styles_ticket.textValueSubSectionInformacionGeneral,
                  ...getEstiloCampo("observaciones"),
                }}
              >
                {data?.descripcion ?? "-"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </DocGeneralTicket>
  );
}
