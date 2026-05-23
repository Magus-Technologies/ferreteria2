"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import Fila from "../_shared/fila"
import type { PreviewContext } from "../_shared/types"

export default function A4Guia({ ctx }: { ctx: PreviewContext }) {
  const { e, b, razonSocial, direccion, email, ruc, celular, logoUrl, fontFaceCss, containerStyle } = ctx

  return (
    <>
      {fontFaceCss && <style>{fontFaceCss}</style>}
      <div className="bg-white p-4 border border-slate-200 rounded" style={containerStyle}>
        {/* Header */}
        <table className="w-full mb-2" style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "30%", verticalAlign: "middle", paddingRight: 4 }}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="logo" style={{ maxWidth: "100%", maxHeight: 80, objectFit: "contain" }} />
                ) : (
                  <div style={{ height: 80 }} />
                )}
              </td>
              <td style={{ verticalAlign: "middle", lineHeight: 1.4 }}>
                <div style={{ ...bloqueACSS(b.empresa_razon), marginBottom: 2 }}>{razonSocial}</div>
                <div style={bloqueACSS(b.empresa_direccion)}>
                  {direccion && <div>{direccion}</div>}
                  {celular && <div>Cel: {celular}</div>}
                  {email && <div>Email: {email}</div>}
                </div>
              </td>
              <td style={{ width: "30%", verticalAlign: "middle" }}>
                <div style={{ border: `${e.border_px}px solid ${e.color_tema}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ ...bloqueACSS(b.caja_ruc), padding: 4 }}>R.U.C. {ruc}</div>
                  <div style={{ ...bloqueACSS(b.caja_tipo), background: e.color_tema, padding: 4, whiteSpace: "pre-line" }}>
                    GUÍA DE REMISIÓN REMITENTE{"\n"}ELECTRÓNICA
                  </div>
                  <div style={{ ...bloqueACSS(b.caja_numero), padding: 4 }}>T001-00000087</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Info-grid de la guía */}
        <table className="w-full mb-2" style={{ borderCollapse: "collapse", border: `${e.border_thin_px}px solid ${e.color_borde}` }}>
          <tbody>
            <Fila e={e} b={b} izq={["F. Emision", "19/05/2026"]} der={["F. Traslado", "20/05/2026"]} />
            <Fila e={e} b={b} izq={["Motivo Traslado", "Venta"]} der={["Modalidad", "Transporte Privado"]} />
            <Fila e={e} b={b} izq={["Punto Partida", "AV. EJEMPLO 100"]} der={["Punto Llegada", "AV. DESTINO 250"]} />
            <Fila e={e} b={b} izq={["Vehiculo", "ABC-123"]} der={["Chofer", "MARIO PEREZ (12345678)"]} />
            <Fila e={e} b={b} izq={["RUC / DNI", "74568367"]} der={["Destinatario", "EFRAIN CASTILLO"]} />
          </tbody>
        </table>

        {/* Tabla de detalles (6 columnas: ITEM, CODIGO, DESCRIPCION, CANT, UNIDAD, PESO) */}
        <table className="w-full" style={{ borderCollapse: "collapse", border: `${e.border_px}px solid ${e.color_borde}` }}>
          <thead>
            <tr style={{ background: e.color_tema }}>
              {[
                { label: "ITEM", w: "5%" },
                { label: "CODIGO", w: "12%" },
                { label: "DESCRIPCION", w: "48%" },
                { label: "CANT.", w: "10%" },
                { label: "UNIDAD", w: "12%" },
                { label: "PESO (KG)", w: "13%" },
              ].map((c, i, arr) => (
                <th
                  key={c.label}
                  style={{
                    ...bloqueACSS(b.tabla_header),
                    padding: e.pad_px,
                    width: c.w,
                    borderRight: i === arr.length - 1 ? "none" : `${e.border_thin_px}px solid ${e.color_borde}`,
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
              <td style={{ ...bloqueACSS(b.tabla_fila), padding: e.pad_px, textAlign: "center" }}>1</td>
              <td style={{ ...bloqueACSS(b.tabla_fila), padding: e.pad_px, textAlign: "center" }}>CT12M</td>
              <td style={{ ...bloqueACSS(b.tabla_fila), padding: e.pad_px }}>CINTA TEFLON 1/2" X 12 MTS - SWIFT</td>
              <td style={{ ...bloqueACSS(b.tabla_fila), padding: e.pad_px, textAlign: "center" }}>10</td>
              <td style={{ ...bloqueACSS(b.tabla_fila), padding: e.pad_px, textAlign: "center" }}>UNIDAD</td>
              <td style={{ ...bloqueACSS(b.tabla_fila), padding: e.pad_px, textAlign: "right" }}>2.50</td>
            </tr>
            <tr>
              <td colSpan={6} style={{ height: 160 }} />
            </tr>
          </tbody>
        </table>

        {/* Peso total */}
        <div style={{ textAlign: "right", marginTop: 6, ...bloqueACSS(b.total_label) }}>
          <strong>PESO TOTAL:</strong> 2.50 KG
        </div>

        {/* Observaciones + QR */}
        <div style={{ marginTop: 8 }}>
          <table style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td style={{ width: "75%", verticalAlign: "top", paddingRight: 10 }}>
                  <div style={bloqueACSS(b.obs_label)}>Observaciones:</div>
                  <div style={bloqueACSS(b.obs_valor)}>-</div>
                </td>
                <td style={{ width: "25%", textAlign: "center", verticalAlign: "top" }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      border: "1px solid #ccc",
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 6,
                      color: "#999",
                    }}
                  >
                    QR
                  </div>
                  <div style={{ ...bloqueACSS(b.consulta_leyenda), fontSize: 7, color: "#666", marginTop: 2 }}>
                    Representacion impresa del comprobante electronico
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Consulta URL */}
        <div style={{ textAlign: "center", marginTop: 8, paddingTop: 5, borderTop: "1px solid #ddd" }}>
          <span style={{ ...bloqueACSS(b.consulta_leyenda) }}>Consulte su documento en: </span>
          <span style={{ ...bloqueACSS(b.consulta_url) }}>http://localhost:3000/consulta</span>
        </div>
      </div>
    </>
  )
}
