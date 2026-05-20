"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "~/lib/auth-context";
import { empresaApi } from "~/lib/api/empresa";
import { QueryKeys } from "~/app/_lib/queryKeys";
import {
  bloqueACSS,
  resolverEstilos,
  resolverBloques,
  type PlantillaImpresion,
  type BloquesResueltos,
} from "~/lib/api/plantilla-impresion";

interface Props {
  plantilla: PlantillaImpresion;
}

export default function PreviewPlantillaImpresion({ plantilla }: Props) {
  const { user } = useAuth();
  const empresaId = user?.empresa?.id;

  const { data } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, empresaId],
    queryFn: () => empresaApi.getById(empresaId!),
    enabled: !!empresaId,
  });

  const empresa = data?.data?.data;
  const razonSocial = empresa?.razon_social ?? "";
  const direccion = empresa?.direccion ?? "";
  const email = empresa?.email ?? "";
  const ruc = empresa?.ruc ?? "";
  const logoUrl = empresa?.logo_url ?? null;

  const e = resolverEstilos(plantilla.estilos);
  const m = plantilla.mensajes_extra;
  const b: BloquesResueltos = resolverBloques(plantilla.estilos_secciones, e);

  const containerStyle: React.CSSProperties = {
    fontFamily: `${e.fuente}, Arial, sans-serif`,
    fontSize: `${e.font_pt}pt`,
    color: e.color_texto,
    lineHeight: 1.3,
  };

  return (
    <div
      className="bg-white p-4 border border-slate-200 rounded"
      style={containerStyle}
    >
      {/* Header */}
      <table className="w-full mb-2" style={{ borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td
              style={{
                width: "30%",
                verticalAlign: "middle",
                paddingRight: 4,
              }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="logo"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 80,
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div style={{ height: 80 }} />
              )}
            </td>
            <td style={{ verticalAlign: "middle", lineHeight: 1.4 }}>
              <div style={{ ...bloqueACSS(b.empresa_razon), marginBottom: 2 }}>
                {razonSocial}
              </div>
              <div style={bloqueACSS(b.empresa_direccion)}>
                {direccion && <div>{direccion}</div>}
                {email && <div>Email: {email}</div>}
              </div>
            </td>
            <td style={{ width: "30%", verticalAlign: "middle" }}>
              <div
                style={{
                  border: `${e.border_px}px solid ${e.color_tema}`,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div style={{ ...bloqueACSS(b.caja_ruc), padding: 4 }}>
                  R.U.C. {ruc}
                </div>
                <div
                  style={{
                    ...bloqueACSS(b.caja_tipo),
                    background: e.color_tema,
                    padding: 4,
                  }}
                >
                  BOLETA DE VENTA
                </div>
                <div style={{ ...bloqueACSS(b.caja_numero), padding: 4 }}>
                  B001-00000325
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Info-grid */}
      <table
        className="w-full mb-2"
        style={{
          borderCollapse: "collapse",
          border: `${e.border_thin_px}px solid ${e.color_borde}`,
        }}
      >
        <tbody>
          <Fila e={e} b={b} izq={["Cliente", "CLIENTE VARIOS"]} der={["F. Emision", "19/05/2026"]} />
          <Fila e={e} b={b} izq={["Direccion", ""]} der={["Hora", "16:30:04"]} />
          <Fila e={e} b={b} izq={["RUC / DNI", "99999999"]} der={["Tipo Doc.", "03"]} />
          <Fila e={e} b={b} izq={["Vendedor", "BRYZA LILIANA CARRION MORALES"]} der={["Almacen", "ALMACEN PRINCIPAL"]} />
          <Fila e={e} b={b} izq={["Forma Pago", "co"]} der={["Moneda", "SOLES"]} />
          <Fila e={e} b={b} izq={["Cajero", "BRYZA LILIANA CARRION MORALES"]} der={["Estado", "cr"]} />
        </tbody>
      </table>

      {/* Tabla productos */}
      <table
        className="w-full"
        style={{
          borderCollapse: "collapse",
          border: `${e.border_px}px solid ${e.color_borde}`,
        }}
      >
        <thead>
          <tr style={{ background: e.color_tema }}>
            {[
              { label: "ITEM", w: "5%" },
              { label: "UBI.", w: "5%" },
              { label: "CODIGO", w: "10%" },
              { label: "CANT.", w: "7%" },
              { label: "UNIDAD", w: "8%" },
              { label: "DESCRIPCION", w: "40%" },
              { label: "P. UNI.", w: "10%" },
              { label: "DESC.", w: "7%" },
              { label: "IMPORTE", w: "8%" },
            ].map((c, i, arr) => (
              <th
                key={c.label}
                style={{
                  ...bloqueACSS(b.tabla_header),
                  padding: e.pad_px,
                  width: c.w,
                  borderRight:
                    i === arr.length - 1
                      ? "none"
                      : `${e.border_thin_px}px solid ${e.color_borde}`,
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <FilaProducto
            e={e}
            b={b}
            cells={[
              "1",
              "A1",
              "CT12M",
              "10",
              "UNIDAD",
              'CINTA TEFLON 1/2" X 12 MTS - SWIFT',
              "2.00",
              "0.00",
              "20.00",
            ]}
          />
          <tr>
            <td
              colSpan={9}
              style={{ height: 180, borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}
            />
          </tr>
        </tbody>
      </table>

      {/* SON */}
      <table
        className="w-full"
        style={{
          borderCollapse: "collapse",
          borderLeft: `${e.border_px}px solid ${e.color_borde}`,
          borderRight: `${e.border_px}px solid ${e.color_borde}`,
          borderBottom: `${e.border_px}px solid ${e.color_borde}`,
        }}
      >
        <tbody>
          <tr>
            <td style={{ ...bloqueACSS(b.son), padding: e.pad_px + 2 }}>
              SON: VEINTE CON 0/100 SOLES.
            </td>
          </tr>
        </tbody>
      </table>

      {/* Observaciones + Totales */}
      <table className="w-full mt-2" style={{ borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "65%", padding: 8, verticalAlign: "middle" }}>
              <div
                style={{
                  border: `${e.border_px}px solid ${e.color_borde}`,
                  borderRadius: 6,
                  padding: 6,
                }}
              >
                <div style={{ ...bloqueACSS(b.obs_label), marginBottom: 4 }}>
                  {m.label_observaciones}
                </div>
                <div style={bloqueACSS(b.obs_valor)}>
                  {m.observaciones_default}
                </div>
              </div>
            </td>
            <td style={{ width: "35%", verticalAlign: "top" }}>
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <tbody>
                  {[
                    ["SUBTOTAL", "16.95"],
                    ["IGV (18%)", "3.05"],
                    ["TOTAL", "20.00"],
                  ].map(([label, valor]) => (
                    <tr
                      key={label}
                      style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}
                    >
                      <td
                        style={{
                          ...bloqueACSS(b.total_label),
                          width: "60%",
                          borderLeft: `${e.border_thin_px}px solid ${e.color_borde}`,
                          borderRight: `${e.border_thin_px}px solid ${e.color_borde}`,
                          padding: e.pad_px + 2,
                        }}
                      >
                        {label}
                      </td>
                      <td
                        style={{
                          ...bloqueACSS(b.total_valor),
                          width: "40%",
                          borderRight: `${e.border_thin_px}px solid ${e.color_borde}`,
                          padding: e.pad_px + 2,
                        }}
                      >
                        {valor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-3" style={{ textAlign: "center" }}>
        <table style={{ margin: "0 auto", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: "middle", paddingRight: 12 }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    border: "1px solid #ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 6,
                    color: "#999",
                  }}
                >
                  QR
                </div>
              </td>
              <td style={{ verticalAlign: "middle" }}>
                <div
                  style={{
                    borderRadius: 10,
                    padding: 10,
                    maxWidth: 420,
                    margin: "0 auto",
                  }}
                >
                  <div style={{ ...bloqueACSS(b.consulta_leyenda), marginBottom: 4 }}>
                    {m.leyenda_representacion}
                  </div>
                  {plantilla.despedida_activo && plantilla.mensaje_despedida ? (
                    <div
                      style={bloqueACSS(b.despedida_footer)}
                      dangerouslySetInnerHTML={{ __html: plantilla.mensaje_despedida }}
                    />
                  ) : (
                    <div style={bloqueACSS(b.despedida_footer)}>
                      GRACIAS POR SU PREFERENCIA!
                    </div>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <div style={bloqueACSS(b.consulta_leyenda)}>{m.leyenda_consulta}</div>
                    <div style={bloqueACSS(b.consulta_url)}>
                      http://localhost:3000/consulta
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Est = ReturnType<typeof resolverEstilos>;

function Fila({
  e,
  b,
  izq,
  der,
}: {
  e: Est;
  b: BloquesResueltos;
  izq: [string, string];
  der: [string, string];
}) {
  const labelStyle = (first: boolean): React.CSSProperties => ({
    ...bloqueACSS(b.info_label),
    width: first ? "12%" : "15%",
    padding: e.pad_px,
  });
  const valorStyle = (first: boolean): React.CSSProperties => ({
    ...bloqueACSS(b.info_valor),
    width: first ? "38%" : "35%",
    padding: e.pad_px,
  });
  return (
    <tr>
      <td style={labelStyle(true)}>{izq[0]}</td>
      <td style={valorStyle(true)}>: {izq[1]}</td>
      <td style={labelStyle(false)}>{der[0]}</td>
      <td style={valorStyle(false)}>: {der[1]}</td>
    </tr>
  );
}

function FilaProducto({
  e,
  b,
  cells,
}: {
  e: Est;
  b: BloquesResueltos;
  cells: string[];
}) {
  // La alineacion por columna sigue siendo natural (numericos a derecha,
  // descripcion a izquierda). El bloque tabla_fila controla color/peso/tamano.
  const aligns: Array<"center" | "left" | "right"> = [
    "center",
    "center",
    "center",
    "center",
    "center",
    "left",
    "right",
    "right",
    "right",
  ];
  const baseStyle = bloqueACSS(b.tabla_fila);
  return (
    <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
      {cells.map((c, i) => (
        <td
          key={i}
          style={{
            ...baseStyle,
            padding: Math.max(2, e.pad_px - 1),
            textAlign: aligns[i],
            borderRight:
              i === cells.length - 1
                ? "none"
                : `${e.border_thin_px}px solid ${e.color_borde}`,
          }}
        >
          {c}
        </td>
      ))}
    </tr>
  );
}
