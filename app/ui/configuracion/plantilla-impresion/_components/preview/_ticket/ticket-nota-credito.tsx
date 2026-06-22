"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

const productosDemo = [
  { desc: 'CINTA TEFLON 1/2" X 12 MTS - SWIFT', cant: "5", uni: "UNIDAD", pu: "25.00", subt: "125.00" },
]

export default function TicketNotaCredito({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, razonSocial, direccion, email, ruc, celular, logoUrl, fontFaceCss, containerStyle } = ctx

  const sep = <div style={{ borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`, margin: "6px 0" }} />

  const labelStyle: React.CSSProperties = {
    ...bloqueACSS(b.info_label),
    width: "32%",
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
            <div style={{ ...bloqueACSS(b.caja_tipo), textAlign: "center" }}>NOTA DE CR&Eacute;DITO</div>
            <div style={{ ...bloqueACSS(b.caja_numero), textAlign: "center" }}>NC-00000001</div>
          </div>

          {sep}

          {/* Info */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>F. EMISIÓN:</td>
                <td style={valorStyle}>23/05/2026</td>
              </tr>
              <tr>
                <td style={labelStyle}>MONEDA:</td>
                <td style={valorStyle}>SOLES (PEN)</td>
              </tr>
              <tr>
                <td style={labelStyle}>RUC:</td>
                <td style={valorStyle}>20456789012</td>
              </tr>
              <tr>
                <td style={labelStyle}>DIRECCIÓN:</td>
                <td style={valorStyle}>AV. PRINCIPAL 456 - LIMA</td>
              </tr>
              <tr>
                <td style={labelStyle}>CLIENTE:</td>
                <td style={valorStyle}>CLIENTES VARIOS</td>
              </tr>
              <tr>
                <td style={labelStyle}>MOTIVO:</td>
                <td style={valorStyle}>DEVOLUCIÓN</td>
              </tr>
              <tr>
                <td style={labelStyle}>COMP. AFECTADO:</td>
                <td style={valorStyle}>FACTURA F001-00001234</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Tabla productos */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "55%" }}>Descripci&oacute;n</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", width: "15%" }}>Cant.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right", width: "15%" }}>P.U.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right", width: "15%" }}>Subt.</th>
              </tr>
            </thead>
            <tbody>
              {productosDemo.map((p, i) => (
                <tr key={i} style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                  <td style={bloqueACSS(b.tabla_fila)}>{p.desc}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>{p.cant}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>{p.pu}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>{p.subt}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              {[
                ["SUBTOTAL:", "S/ 105.93"],
                ["IGV 18%:", "S/ 19.07"],
                ["TOTAL:", "S/ 125.00"],
              ].map(([label, valor], i, arr) => (
                <tr
                  key={label}
                  style={
                    i < arr.length - 1
                      ? { borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }
                      : { background: "#f0f0f0" }
                  }
                >
                  <td style={bloqueACSS(b.total_label)}>{label}</td>
                  <td style={{ ...bloqueACSS(b.total_valor), textAlign: "right" }}>{valor}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ ...bloqueACSS(b.son), marginBottom: 4 }}>CIENTO VEINTICINCO CON 0/100 SOLES</div>

          {/* Observaciones */}
          <div style={{ marginBottom: 4 }}>
            <div style={bloqueACSS(b.obs_label)}>{m.label_observaciones}</div>
            <div style={bloqueACSS(b.obs_valor)}>- DEVOLUCIÓN POR PRODUCTO DAÑADO.</div>
          </div>

          {sep}

          {/* Despedida */}
          <div style={{ textAlign: "center" }}>
            <div style={bloqueACSS(b.despedida_footer)}>Representaci&oacute;n impresa de la Nota de Cr&eacute;dito</div>
          </div>
        </div>
      </div>
    </>
  )
}