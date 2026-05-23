"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

const DEFAULT_TEMA = "#fadc06"

export default function TicketRequerimientoServicio({ ctx }: { ctx: PreviewContext }) {
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
            <div style={bloqueACSS(b.caja_tipo)}>ORDEN DE SERVICIO</div>
            <div style={bloqueACSS(b.caja_numero)}>{numeroDocumento}</div>
            <div style={{ fontSize: e.font_sm_pt }}>LOG-F-03</div>
          </div>

          {sep}

          {/* Info general + Vehículo */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              {[
                ["Área", "MANTENIMIENTO"],
                ["Fecha", "19/05/2026"],
                ["Prioridad", "MEDIA"],
                ["Estado", "PENDIENTE"],
                ["Solicitante", "BRYZA CARRION"],
                ["Vehículo", "HILUX (ABC-123)"],
                ["Afecta Calend.", "Sí"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ ...bloqueACSS(b.info_label), width: "45%" }}>{k}:</td>
                  <td style={bloqueACSS(b.info_valor)}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {sep}

          {/* Tabla servicios (sin recuadro completo, solo línea bajo header) */}
          <div style={{ ...bloqueACSS(b.tabla_header), textTransform: "uppercase", marginBottom: 4, paddingBottom: 2, borderBottom: `${e.border_thin_px}px solid ${colorLinea}` }}>
            Servicios Requeridos
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={tieneColorPersonalizado ? { background: e.color_tema } : { borderBottom: `${e.border_thin_px}px solid ${colorLinea}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", padding: 2, width: "22%" }}>Tipo</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", padding: 2 }}>Descripción</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", padding: 2, width: "20%" }}>Dur.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right", padding: 2, width: "25%" }}>Presup.</th>
              </tr>
            </thead>
            <tbody>
              {[
                { tipo: "MANT.", desc: "Cambio aceite y filtros", dur: "4 h", pres: "S/ 180.00" },
                { tipo: "LAVADO", desc: "Lavado integral cabina", dur: "2 día(s)", pres: "S/ 90.00" },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ ...bloqueACSS(b.tabla_fila), padding: 2, textAlign: "center", fontWeight: 700 }}>{row.tipo}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), padding: 2 }}>{row.desc}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), padding: 2, textAlign: "center" }}>{row.dur}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), padding: 2, textAlign: "right", fontWeight: 700 }}>{row.pres}</td>
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
