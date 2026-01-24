"use client";

import { Text, View } from "@react-pdf/renderer";
import { TipoDocumento } from "@prisma/client";
import { TiposDocumentos } from "~/lib/docs";
import { useColumnsDocIngresoSalida } from "../tables/columns-doc-ingreso-salida";
import DocGeneral from "~/app/_components/docs/doc-general";
import { styles_docs } from "~/app/_components/docs/styles";
import type { Empresa } from "~/lib/api";
import { IngresoSalidaWithRelations } from "~/lib/api/ingreso-salida";

export type DataDocIngresoSalida = IngresoSalidaWithRelations | undefined;

export default function DocIngresoSalida({
  data,
  nro_doc,
  empresa,
  show_logo_html = false,
}: {
  data: DataDocIngresoSalida;
  nro_doc: string;
  empresa: Empresa | null | undefined;
  show_logo_html?: boolean;
}) {
  const rowData =
    data?.productos_por_almacen.flatMap((pa) =>
      pa.unidades_derivadas.map((ud) => ({
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

  // Convertir tipo de documento de Laravel a Prisma para compatibilidad con TiposDocumentos
  const tipoDocumentoPrisma =
    data?.tipo_documento === "Ingreso"
      ? TipoDocumento.Ingreso
      : TipoDocumento.Salida;
  const tipo_documento = data?.tipo_documento
    ? TiposDocumentos[tipoDocumentoPrisma].name
    : "";

  return (
    <DocGeneral
      empresa={empresa}
      show_logo_html={show_logo_html}
      tipo_documento={tipo_documento}
      nro_doc={nro_doc}
      colDefs={useColumnsDocIngresoSalida({
        estado: data?.estado || false,
        tipo_documento: tipoDocumentoPrisma,
      })}
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
      totalConLetras
    >
      <View style={styles_docs.section}>
        <View style={styles_docs.sectionInformacionGeneral}>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Fecha de Emisión:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {new Date(data?.fecha || "").toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Almacén:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.almacen.name}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Usuario:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.user.name}
              </Text>
            </View>
          </View>
          <View style={styles_docs.sectionInformacionGeneralColumn}>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Proveedor:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.proveedor?.razon_social ?? "-"}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Tipo de {tipo_documento}:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.tipo_ingreso.name}
              </Text>
            </View>
            <View style={styles_docs.subSectionInformacionGeneral}>
              <Text style={styles_docs.textTitleSubSectionInformacionGeneral}>
                Observaciones:
              </Text>
              <Text style={styles_docs.textValueSubSectionInformacionGeneral}>
                {data?.descripcion ?? "-"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </DocGeneral>
  );
}
