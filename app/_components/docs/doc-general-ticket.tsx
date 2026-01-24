import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles_ticket } from "./styles";
import { ColDef } from "ag-grid-community";
import DocHeaderTicket from "./doc-header-ticket";
import DocTableTicket from "./doc-table-ticket";
import { NumeroALetras } from "~/utils/numero-a-letras";
import type { Empresa } from "~/lib/api";

export default function DocGeneralTicket<T>({
  empresa,
  show_logo_html = false,
  tipo_documento,
  nro_doc,
  children,
  colDefs,
  rowData,
  total,
  observaciones,
  headerNameAl100,
  totalConLetras = false,
  getEstiloCampo,
  total_descuento,
  op_gravada,
  subtotal,
  igv,
}: {
  empresa: Empresa | null | undefined;
  show_logo_html?: boolean;
  tipo_documento: string;
  nro_doc: string;
  children: React.ReactNode;

  colDefs: ColDef[];
  rowData: T[];
  total: number;
  observaciones: string;
  headerNameAl100: string;
  totalConLetras?: boolean;
  getEstiloCampo?: (campo: string) => {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
  };
  total_descuento?: number;
  op_gravada?: number;
  subtotal?: number;
  igv?: number;
}) {
  return (
    <Document title={nro_doc}>
      <Page
        size={{ width: 80 / 0.3528, height: 400 / 0.3528 }}
        style={styles_ticket.page}
      >
        <DocHeaderTicket
          empresa={empresa}
          show_logo_html={show_logo_html}
          tipo_documento={tipo_documento}
          nro_doc={nro_doc}
        />
        {children}
        <DocTableTicket
          colDefs={colDefs}
          rowData={rowData}
          headerNameAl100={headerNameAl100}
          getEstiloCampo={getEstiloCampo}
        />
        <View
          style={{
            marginBottom: 6,
          }}
        >
          {/* Total Descuento */}
          {total_descuento !== undefined && total_descuento > 0 && (
            <View
              style={{ ...styles_ticket.total, borderBottom: "1px solid #000" }}
            >
              <Text style={{ fontSize: 7, fontWeight: "bold" }}>
                TOTAL DESCUENTO
              </Text>
              <Text style={{ fontSize: 7 }}>
                {Number(total_descuento).toFixed(2)}
              </Text>
            </View>
          )}

          {/* Op. Gravada */}
          {op_gravada !== undefined && (
            <View
              style={{ ...styles_ticket.total, borderBottom: "1px solid #000" }}
            >
              <Text style={{ fontSize: 7, fontWeight: "bold" }}>
                OP.GRAVADA
              </Text>
              <Text style={{ fontSize: 7 }}>
                {Number(op_gravada).toFixed(2)}
              </Text>
            </View>
          )}

          {/* IGV 18% */}
          {igv !== undefined && (
            <View
              style={{ ...styles_ticket.total, borderBottom: "1px solid #000" }}
            >
              <Text style={{ fontSize: 7, fontWeight: "bold" }}>IGV 18%</Text>
              <Text style={{ fontSize: 7 }}>{Number(igv).toFixed(2)}</Text>
            </View>
          )}

          {/* Total */}
          <View style={styles_ticket.total}>
            <Text style={styles_ticket.textTotal}>TOTAL</Text>
            <Text style={{ fontSize: 7, fontWeight: "bold" }}>
              {Number(total).toFixed(2)}
            </Text>
          </View>

          {totalConLetras && (
            <Text style={{ fontSize: 7, marginTop: 4 }}>
              {NumeroALetras(total)}
            </Text>
          )}
        </View>
        <View style={styles_ticket.observaciones}>
          <Text style={{ fontWeight: "bold" }}>Observaciones:</Text>
          <Text>{observaciones}</Text>
        </View>
      </Page>
    </Document>
  );
}
