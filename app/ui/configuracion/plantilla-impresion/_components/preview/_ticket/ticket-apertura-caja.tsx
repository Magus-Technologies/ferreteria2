"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

const denominacionesDemo = [
  { label: "Billete S/. 100", cant: 2, total: "200.00" },
  { label: "Billete S/. 50", cant: 4, total: "200.00" },
  { label: "Billete S/. 20", cant: 5, total: "100.00" },
]

const distribucionesDemo = [
  { vendedor: "BRYZA LILIANA CARRION MORALES", monto: "300.00" },
  { vendedor: "EFRAIN ALEJANDRO CASTILLO CHIGNE", monto: "200.00" },
]

export default function TicketAperturaCaja({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, razonSocial, direccion, email, ruc, celular, logoUrl, fontFaceCss, containerStyle, tituloDocumento, numeroDocumento } = ctx

  const sep = <div style={{ borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`, margin: "6px 0" }} />

  const sectionTitle: React.CSSProperties = {
    ...bloqueACSS(b.info_label),
    textAlign: "center",
    marginBottom: 2,
    paddingTop: 4,
    borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`,
  }

  const labelStyle: React.CSSProperties = {
    ...bloqueACSS(b.info_label),
    width: "35%",
    verticalAlign: "top",
    paddingRight: 4,
  }
  const valorStyle: React.CSSProperties = {
    ...bloqueACSS(b.info_valor),
    verticalAlign: "top",
  }

  return (
    <>
      {fontFaceCss && <style>{fontFaceCss}</style>}
      <div className="bg-white p-4 border border-slate-200 rounded" style={containerStyle}>
        <div style={{ width: 280, margin: "0 auto" }}>
          {/* Empresa */}
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            {logoUrl && !m.ocultar_logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="logo" style={{ maxWidth: "100%", height: 60, objectFit: "contain" }} />
            )}
            <div style={bloqueACSS(b.empresa_razon)}>{razonSocial}</div>
            <div style={bloqueACSS(b.caja_ruc)}>R.U.C. {ruc}</div>
            <div style={bloqueACSS(b.empresa_direccion)}>{direccion}</div>
            {celular && (
              <div style={bloqueACSS(b.empresa_direccion)}>
                <span style={{ fontWeight: 700 }}>Cel:</span> {celular}
              </div>
            )}
            {email && (
              <div style={bloqueACSS(b.empresa_direccion)}>
                <span style={{ fontWeight: 700 }}>Email:</span> {email}
              </div>
            )}
          </div>

          {sep}

          {/* Tipo y número */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ ...bloqueACSS(b.caja_tipo), textAlign: "center", whiteSpace: "pre-line" }}>{tituloDocumento}</div>
            <div style={{ ...bloqueACSS(b.caja_numero), textAlign: "center" }}>{numeroDocumento}</div>
          </div>

          {sep}

          {/* Info apertura */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>FECHA:</td>
                <td style={valorStyle}>19/05/2026</td>
                <td style={{ ...labelStyle, width: "20%" }}>HORA:</td>
                <td style={valorStyle}>08:15</td>
              </tr>
              <tr>
                <td style={labelStyle}>CAJA:</td>
                <td style={valorStyle} colSpan={3}>CAJA PRINCIPAL</td>
              </tr>
              <tr>
                <td style={labelStyle}>USUARIO:</td>
                <td style={valorStyle} colSpan={3}>BRYZA LILIANA CARRION MORALES</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Monto de Apertura */}
          <div style={sectionTitle}>MONTO DE APERTURA</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr style={{ background: "#e8f5e9" }}>
                <td style={{ ...bloqueACSS(b.total_label), padding: 3 }}>Total Efectivo:</td>
                <td style={{ ...bloqueACSS(b.total_valor), padding: 3, color: "green" }}>S/ 500.00</td>
              </tr>
            </tbody>
          </table>

          {/* Desglose */}
          <div style={sectionTitle}>DESGLOSE DE DENOMINACIONES</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left" }}>Denominación</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", width: 40 }}>Cant.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right", width: 55 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {denominacionesDemo.map((d, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                  <td style={bloqueACSS(b.tabla_fila)}>{d.label}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>{d.cant}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>S/ {d.total}</td>
                </tr>
              ))}
              <tr style={{ background: "#f0f0f0", borderTop: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <td style={{ ...bloqueACSS(b.total_label) }}>Total</td>
                <td />
                <td style={{ ...bloqueACSS(b.total_valor), textAlign: "right" }}>S/ 500.00</td>
              </tr>
            </tbody>
          </table>

          {/* Distribución a Vendedores */}
          <div style={sectionTitle}>DISTRIBUCIÓN A VENDEDORES ({distribucionesDemo.length})</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left" }}>Vendedor</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right", width: 60 }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {distribucionesDemo.map((d, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                  <td style={bloqueACSS(b.tabla_fila)}>{d.vendedor}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>S/ {d.monto}</td>
                </tr>
              ))}
              <tr style={{ background: "#f0f0f0", borderTop: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <td style={bloqueACSS(b.total_label)}>TOTAL DISTRIBUIDO</td>
                <td style={{ ...bloqueACSS(b.total_valor), textAlign: "right" }}>S/ 500.00</td>
              </tr>
            </tbody>
          </table>

          {/* Mensaje confirmación */}
          <div style={{ background: "#e3f2fd", padding: 3, textAlign: "center", color: "#1565c0", marginTop: 4, fontSize: 9 }}>
            Caja aperturada exitosamente
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 6, paddingTop: 4, borderTop: `${e.border_thin_px}px dashed ${e.color_borde}` }}>
            <div style={{ ...bloqueACSS(b.despedida_footer) }}>Gracias por usar nuestro sistema</div>
          </div>
        </div>
      </div>
    </>
  )
}
