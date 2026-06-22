"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

const productosDemo = [
  { desc: 'CINTA TEFLON 1/2" X 12 MTS - SWIFT', cant: "10", uni: "UNIDAD", pu: "2.00", subt: "20.00" },
  { desc: 'CINTA TEFLON 3/4" X 10 MTS - SWIFT', cant: "10", uni: "UNIDAD", pu: "2.50", subt: "25.00" },
  { desc: 'CINTA TEFLON AMARILLA GAS 1/2" - MAGNUM', cant: "10", uni: "UNIDAD", pu: "2.00", subt: "20.00" },
]

export default function TicketCotizacion({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, plantilla, razonSocial, direccion, email, ruc, celular, logoUrl, fontFaceCss, containerStyle } = ctx

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
            <div style={{ ...bloqueACSS(b.caja_tipo), textAlign: "center" }}>COTIZACION</div>
            <div style={{ ...bloqueACSS(b.caja_numero), textAlign: "center" }}>COT-00000123</div>
          </div>

          {sep}

          {/* Info cliente */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>
                  F. EMISIÓN: <span style={bloqueACSS(b.info_valor)}>19/05/2026</span>
                </td>
                <td style={valorStyle}>
                  <span style={bloqueACSS(b.info_label)}>F. VENC.:</span> 26/05/2026
                </td>
              </tr>
              <tr>
                <td style={labelStyle}>DNI:</td>
                <td style={valorStyle}>74568367</td>
              </tr>
              <tr>
                <td style={labelStyle}>CLIENTE:</td>
                <td style={valorStyle}>EFRAIN ALEJANDRO CASTILLO CHIGNE</td>
              </tr>
              <tr>
                <td style={labelStyle}>DIRECCIÓN:</td>
                <td style={valorStyle}>AV. EJEMPLO 123 - TRUJILLO</td>
              </tr>
              <tr>
                <td style={labelStyle}>VENDEDOR:</td>
                <td style={valorStyle}>BRYZA LILIANA CARRION MORALES</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Tabla productos */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "55%" }}>Descripción</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "15%" }}>Cant.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "15%" }}>P.U.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "15%" }}>Subt.</th>
              </tr>
            </thead>
            <tbody>
              {productosDemo.map((p, i) => (
                <tr key={i} style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                  <td style={bloqueACSS(b.tabla_fila)}>{p.desc}</td>
                  <td style={bloqueACSS(b.tabla_fila)}>{p.cant}</td>
                  <td style={bloqueACSS(b.tabla_fila)}>{p.pu}</td>
                  <td style={bloqueACSS(b.tabla_fila)}>{p.subt}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales (sin IGV) */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              {[
                ["SUBTOTAL:", "S/ 65.00"],
                ["T. DESCUENTO:", "S/ 0.00"],
                ["TOTAL:", "S/ 65.00"],
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
                  <td style={bloqueACSS(b.total_valor)}>{valor}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ ...bloqueACSS(b.son), marginBottom: 4 }}>SESENTA Y CINCO CON 0/100 SOLES</div>

          {/* Observaciones */}
          <div style={{ marginBottom: 4 }}>
            <div style={bloqueACSS(b.obs_label)}>{m.label_observaciones}</div>
            <div style={bloqueACSS(b.obs_valor)}>- LA MERCADERIA VIAJA POR CUENTA Y RIESGO DEL CLIENTE.</div>
          </div>

          {!m.ocultar_despedida && sep}

          {/* Despedida */}
          {!m.ocultar_despedida && (
            <div style={{ textAlign: "center" }}>
              {plantilla.despedida_activo && plantilla.mensaje_despedida ? (
                <div
                  style={bloqueACSS(b.despedida_footer)}
                  dangerouslySetInnerHTML={{ __html: plantilla.mensaje_despedida }}
                />
              ) : (
                <div style={bloqueACSS(b.despedida_footer)}>GRACIAS POR SU PREFERENCIA!</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
