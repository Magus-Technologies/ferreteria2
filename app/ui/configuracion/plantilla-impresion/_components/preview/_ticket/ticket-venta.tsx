"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

const productosDemo = [
  { desc: 'CINTA TEFLON 1/2" X 12 MTS - SWIFT', cant: "10", uni: "UNIDAD", pu: "2.00", subt: "20.00" },
  { desc: 'CINTA TEFLON 3/4" X 10 MTS - SWIFT', cant: "10", uni: "UNIDAD", pu: "2.50", subt: "25.00" },
  { desc: 'CINTA TEFLON AMARILLA GAS 1/2" - MAGNUM', cant: "10", uni: "UNIDAD", pu: "2.00", subt: "20.00" },
]

export default function TicketVenta({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, plantilla, razonSocial, direccion, ruc, logoUrl, fontFaceCss, containerStyle, tituloDocumento, numeroDocumento } = ctx

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
          </div>

          {sep}

          {/* Tipo y número de comprobante */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ ...bloqueACSS(b.caja_tipo), textAlign: "center", whiteSpace: "pre-line" }}>{tituloDocumento}</div>
            <div style={{ ...bloqueACSS(b.caja_numero), textAlign: "center" }}>{numeroDocumento}</div>
          </div>

          {sep}

          {/* Info venta */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>FORMA PAGO:</td>
                <td style={valorStyle}>co</td>
              </tr>
              <tr>
                <td style={labelStyle}>
                  F. EMISIÓN: <span style={bloqueACSS(b.info_valor)}>19/05/2026</span>
                </td>
                <td style={valorStyle}>
                  <span style={bloqueACSS(b.info_label)}>HORA:</span> 21:29:04
                </td>
              </tr>
              <tr>
                <td style={labelStyle}>N° GUÍA:</td>
                <td style={valorStyle}></td>
              </tr>
              <tr>
                <td style={labelStyle}>VENDEDOR:</td>
                <td style={valorStyle}>BRYZA LILIANA CARRION MORALES</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Info cliente */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>DNI:</td>
                <td style={valorStyle}>74568367</td>
              </tr>
              <tr>
                <td style={labelStyle}>CLIENTE:</td>
                <td style={valorStyle}>EFRAIN ALEJANDRO CASTILLO CHIGNE</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Métodos de pago */}
          <div style={{ marginBottom: 6 }}>
            <div style={bloqueACSS(b.info_label)}>Métodos de Pago:</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={bloqueACSS(b.tabla_fila)}>efectivo</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>65.00</td>
                </tr>
                <tr>
                  <td style={{ ...bloqueACSS(b.tabla_fila), fontWeight: 700 }}>TOTAL</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), fontWeight: 700, textAlign: "right" }}>65.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {sep}

          {/* Tabla productos */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "40%" }}>Descripción</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", width: "10%" }}>Cant.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", width: "15%" }}>Unid.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right", width: "15%" }}>P.U.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right", width: "20%" }}>Subt.</th>
              </tr>
            </thead>
            <tbody>
              {productosDemo.map((p, i) => (
                <tr key={i} style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                  <td style={bloqueACSS(b.tabla_fila)}>{p.desc}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>{p.cant}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>{p.uni}</td>
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
                ["OP.GRAVADA", "55.08"],
                ["IGV 18%", "9.92"],
                ["TOTAL", "65.00"],
              ].map(([label, valor], i, arr) => (
                <tr
                  key={label}
                  style={i < arr.length - 1 ? { borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` } : undefined}
                >
                  <td style={bloqueACSS(b.total_label)}>{label}</td>
                  <td style={bloqueACSS(b.total_valor)}>{valor}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* SON en letras */}
          <div style={{ ...bloqueACSS(b.son), marginBottom: 4 }}>SESENTA Y CINCO CON 0/100 SOLES</div>

          {/* Observaciones */}
          <div style={{ marginBottom: 4 }}>
            <div style={bloqueACSS(b.obs_label)}>{m.label_observaciones}</div>
            <div style={bloqueACSS(b.obs_valor)}>{m.observaciones_default}</div>
          </div>

          {sep}

          {/* Consulta */}
          <div style={{ textAlign: "center" }}>
            <div style={bloqueACSS(b.consulta_leyenda)}>{m.leyenda_consulta}</div>
            <div style={bloqueACSS(b.consulta_url)}>{process.env.NEXT_PUBLIC_API_URL?.replace(/\/api(\/api)?$/, '') || 'http://localhost:3000'}/consulta</div>
          </div>

          {sep}

          {/* Despedida */}
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
        </div>
      </div>
    </>
  )
}
