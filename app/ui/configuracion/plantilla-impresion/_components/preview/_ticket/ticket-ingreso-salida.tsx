"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

export default function TicketIngresoSalida({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, razonSocial, direccion, email, ruc, celular, logoUrl, fontFaceCss, containerStyle } = ctx

  const sep = <div style={{ borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`, margin: "6px 0" }} />

  return (
    <>
      {fontFaceCss && <style>{fontFaceCss}</style>}
      <div className="bg-white p-4 border border-slate-200 rounded" style={containerStyle}>
        <div style={{ width: 280, margin: "0 auto" }}>
          {/* Header */}
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
          <div style={{ padding: "4px 0" }}>
            <div style={bloqueACSS(b.caja_tipo)}>NOTA DE INGRESO ELECTRÓNICA</div>
            <div style={bloqueACSS(b.caja_numero)}>NI0001-00005334</div>
          </div>

          {sep}

          {/* Info en 2 columnas */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", verticalAlign: "top", paddingRight: 4 }}>
                  <div style={bloqueACSS(b.info_label)}>FECHA DE EMISIÓN:</div>
                  <div style={bloqueACSS(b.info_valor)}>22/05/2026</div>
                  <div style={{ height: 4 }} />
                  <div style={bloqueACSS(b.info_label)}>ALMACÉN:</div>
                  <div style={bloqueACSS(b.info_valor)}>ALMACÉN PRINCIPAL</div>
                  <div style={{ height: 4 }} />
                  <div style={bloqueACSS(b.info_label)}>USUARIO:</div>
                  <div style={bloqueACSS(b.info_valor)}>BRYZA LILIANA CARRION</div>
                </td>
                <td style={{ width: "50%", verticalAlign: "top", paddingLeft: 4 }}>
                  <div style={bloqueACSS(b.info_label)}>PROVEEDOR:</div>
                  <div style={bloqueACSS(b.info_valor)}>GRUPO MI REDENTOR S.A.C.</div>
                  <div style={{ height: 4 }} />
                  <div style={bloqueACSS(b.info_label)}>TIPO DE INGRESO:</div>
                  <div style={bloqueACSS(b.info_valor)}>AJUSTE</div>
                  <div style={{ height: 4 }} />
                  <div style={bloqueACSS(b.info_label)}>OBSERVACIONES:</div>
                  <div style={bloqueACSS(b.info_valor)}>—</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tabla productos */}
          <div
            style={{
              ...bloqueACSS(b.obs_label),
              borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`,
              paddingTop: 4,
              marginBottom: 2,
            }}
          >
            PRODUCTOS
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left" }}>Producto</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left" }}>Cód.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left" }}>Cant.</th>
                <th style={{ ...bloqueACSS(b.tabla_header) }}>Unid.</th>
                <th style={{ ...bloqueACSS(b.tabla_header) }}>Stock Ant</th>
                <th style={{ ...bloqueACSS(b.tabla_header) }}>Stock Nue</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right" }}>Costo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} style={{ ...bloqueACSS(b.tabla_fila), paddingTop: 2 }}>
                  VARILLA CONSTRUCCION 1" - ACEROS AREQUIPA
                </td>
              </tr>
              <tr>
                <td></td>
                <td style={bloqueACSS(b.tabla_fila)}>21045</td>
                <td style={bloqueACSS(b.tabla_fila)}>15.000</td>
                <td style={bloqueACSS(b.tabla_fila)}>UNIDAD</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>-2F40</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>-2F25</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>98.31</td>
              </tr>
            </tbody>
          </table>

          {/* Total */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4, background: "#f0f0f0" }}>
            <tbody>
              <tr>
                <td style={{ ...bloqueACSS(b.total_label), padding: 4 }}>TOTAL</td>
                <td style={{ ...bloqueACSS(b.total_valor), padding: 4 }}>S/ 1,474.58</td>
              </tr>
            </tbody>
          </table>

          {/* SON */}
          <div style={{ ...bloqueACSS(b.son), textAlign: "center", marginTop: 2 }}>
            MIL CUATROCIENTOS SETENTA Y CUATRO CON 58/100 SOLES
          </div>

          {/* Observaciones */}
          <div style={{ marginTop: 4 }}>
            <div style={bloqueACSS(b.obs_label)}>{m.label_observaciones}</div>
            <div style={bloqueACSS(b.obs_valor)}>—</div>
          </div>
        </div>
      </div>
    </>
  )
}
