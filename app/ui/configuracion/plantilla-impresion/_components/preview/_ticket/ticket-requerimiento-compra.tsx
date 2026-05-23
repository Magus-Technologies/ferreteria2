"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

const DEFAULT_TEMA = "#fadc06"

export default function TicketRequerimientoCompra({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, razonSocial, celular, logoUrl, fontFaceCss, containerStyle, numeroDocumento } = ctx

  // Por defecto el ticket va monocromo (impresora térmica = B/N).
  // Solo si el usuario personaliza el color desde el editor, se aplica.
  const esTemaDefault = e.color_tema?.toLowerCase() === DEFAULT_TEMA
  const colorLinea = esTemaDefault ? "#000" : e.color_tema
  const tieneColorPersonalizado = !esTemaDefault

  const sep = <div style={{ borderTop: `${e.border_thin_px}px dashed ${colorLinea}`, margin: "6px 0" }} />

  return (
    <>
      {fontFaceCss && <style>{fontFaceCss}</style>}
      <div className="bg-white p-4 border border-slate-200 rounded" style={containerStyle}>
        <div style={{ width: 280, margin: "0 auto" }}>
          {/* Header centrado, sin recuadros */}
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="logo" style={{ maxHeight: 50, objectFit: "contain", marginBottom: 4 }} />
            )}
            <div style={bloqueACSS(b.empresa_razon)}>{razonSocial}</div>
            {celular && <div style={bloqueACSS(b.empresa_direccion)}>{celular}</div>}
          </div>

          {sep}

          {/* Tipo y número (sin caja) */}
          <div style={{ textAlign: "center", padding: "4px 0" }}>
            <div style={bloqueACSS(b.caja_tipo)}>ORDEN DE COMPRA</div>
            <div style={bloqueACSS(b.caja_numero)}>{numeroDocumento}</div>
            <div style={{ fontSize: e.font_sm_pt }}>LOG-F-03</div>
          </div>

          {sep}

          {/* Info general */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              {[
                ["Área", "ÁREA DE COMPRAS"],
                ["Fecha", "19/05/2026"],
                ["Prioridad", "ALTA"],
                ["Estado", "PENDIENTE"],
                ["Solicitante", "BRYZA CARRION"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ ...bloqueACSS(b.info_label), width: "45%" }}>{k}:</td>
                  <td style={bloqueACSS(b.info_valor)}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {sep}

          {/* Tabla productos (sin recuadro completo, solo línea bajo header) */}
          <div style={{ ...bloqueACSS(b.tabla_header), textTransform: "uppercase", marginBottom: 4, paddingBottom: 2, borderBottom: `${e.border_thin_px}px solid ${colorLinea}` }}>
            Productos Requeridos
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={tieneColorPersonalizado ? { background: e.color_tema } : { borderBottom: `${e.border_thin_px}px solid ${colorLinea}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", padding: 2, width: "20%" }}>Cód.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", padding: 2, width: "15%" }}>Cant</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", padding: 2, width: "15%" }}>U.M</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", padding: 2 }}>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cod: "CT12M", cant: "100", um: "UND", desc: "CINTA TEFLON 1/2\"" },
                { cod: "TPV34", cant: "50", um: "UND", desc: "TUBO PVC 3/4\"" },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ ...bloqueACSS(b.tabla_fila), padding: 2, textAlign: "center" }}>{row.cod}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), padding: 2, textAlign: "center" }}>{row.cant}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), padding: 2, textAlign: "center" }}>{row.um}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), padding: 2 }}>{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {sep}

          {/* Observaciones (sin recuadro) */}
          <div style={{ marginBottom: 4 }}>
            <span style={{ ...bloqueACSS(b.obs_label), fontWeight: 700 }}>Obs:</span>{" "}
            <span style={bloqueACSS(b.obs_valor)}>{m.observaciones_default}</span>
          </div>

          {/* Proveedor */}
          <div style={{ marginBottom: 4, fontSize: e.font_sm_pt }}>
            <span style={{ ...bloqueACSS(b.info_label), fontWeight: 700 }}>PROV:</span> DISTRIBUIDORA ANDES S.A.
            <br />
            <span style={{ ...bloqueACSS(b.info_label), fontWeight: 700 }}>RUC:</span> 20512345678
          </div>

          {sep}

          {/* Firmas */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
            <tbody>
              <tr>
                {["Responsable", "Solicitante", "Supervisor"].map((rol) => (
                  <td key={rol} style={{ width: "33%", textAlign: "center", verticalAlign: "bottom", fontSize: e.font_sm_pt }}>
                    <div style={{ borderTop: "1px solid #000", marginTop: 16, paddingTop: 2 }}>{rol}</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
