"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

const productosDemo = [
  { desc: "GLOSS ALUMINIO GRUESO - GLUCOM", cant: "15", uni: "1/32 GALON", costo: "0.00", importe: "0.00" },
]

export default function TicketPrestamo({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, razonSocial, direccion, email, ruc, celular, logoUrl, fontFaceCss, containerStyle, tituloDocumento, numeroDocumento } = ctx

  const sep = <div style={{ borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`, margin: "6px 0" }} />

  const labelStyle: React.CSSProperties = {
    ...bloqueACSS(b.info_label),
    width: "38%",
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
            {logoUrl && (
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

          {/* Info préstamo */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>
                  F. EMISIÓN: <span style={bloqueACSS(b.info_valor)}>19/05/2026</span>
                </td>
                <td style={valorStyle}>
                  <span style={bloqueACSS(b.info_label)}>HORA:</span> 15:35:23
                </td>
              </tr>
              <tr>
                <td style={labelStyle}>F. VENCIMIENTO:</td>
                <td style={valorStyle}>19/05/2026</td>
              </tr>
              <tr>
                <td style={labelStyle}>VENDEDOR:</td>
                <td style={valorStyle}>BRYZA LILIANA CARRION MORALES</td>
              </tr>
              <tr>
                <td style={labelStyle}>ESTADO:</td>
                <td style={valorStyle}>PAGADO_TOTAL</td>
              </tr>
              <tr>
                <td style={labelStyle}>MONEDA:</td>
                <td style={valorStyle}>SOL</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Info entidad (proveedor / cliente) */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>PROVEEDOR:</td>
                <td style={valorStyle}>GRUPO MI REDENTOR S.A.C.</td>
              </tr>
              <tr>
                <td style={labelStyle}>DNI:</td>
                <td style={valorStyle}></td>
              </tr>
              <tr>
                <td style={labelStyle}>DIRECCIÓN:</td>
                <td style={valorStyle}>CAL. SINCHI ROCA MZA. 6 LOTE 15 P.J. EL MILAGRO</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Tabla productos */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "38%" }}>Descripción</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", width: "12%" }}>Cant.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", width: "18%" }}>Unid.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right", width: "16%" }}>Costo</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right", width: "16%" }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {productosDemo.map((p, i) => (
                <tr key={i} style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                  <td style={bloqueACSS(b.tabla_fila)}>{p.desc}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>{p.cant}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>{p.uni}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>{p.costo}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>{p.importe}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
            <tbody>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <td style={bloqueACSS(b.total_label)}>MONTO TOTAL S/.</td>
                <td style={bloqueACSS(b.total_valor)}>1.80</td>
              </tr>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <td style={bloqueACSS(b.total_label)}>MONTO PAGADO S/.</td>
                <td style={bloqueACSS(b.total_valor)}>1.80</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.total_label)}>SALDO PENDIENTE S/.</td>
                <td style={bloqueACSS(b.total_valor)}>0.00</td>
              </tr>
            </tbody>
          </table>

          {/* Observaciones */}
          <div style={{ marginTop: 6 }}>
            <div style={bloqueACSS(b.obs_label)}>{m.label_observaciones}</div>
            <div style={bloqueACSS(b.obs_valor)}>- NINGUNA</div>
          </div>
        </div>
      </div>
    </>
  )
}
