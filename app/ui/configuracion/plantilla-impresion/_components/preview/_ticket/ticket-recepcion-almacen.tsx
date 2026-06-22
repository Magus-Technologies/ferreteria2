"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

export default function TicketRecepcionAlmacen({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, razonSocial, direccion, email, ruc, celular, logoUrl, fontFaceCss, containerStyle } = ctx

  const sep = <div style={{ borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`, margin: "6px 0" }} />

  return (
    <>
      {fontFaceCss && <style>{fontFaceCss}</style>}
      <div className="bg-white p-4 border border-slate-200 rounded" style={containerStyle}>
        <div style={{ width: 280, margin: "0 auto" }}>
          {/* Header */}
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
          <div style={{ padding: "4px 0" }}>
            <div style={bloqueACSS(b.caja_tipo)}>RECEPCIÓN DE ALMACÉN ELECTRÓNICA</div>
            <div style={bloqueACSS(b.caja_numero)}>RA0001-00000022</div>
          </div>

          {sep}

          {/* Info en 2 columnas */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", verticalAlign: "top", paddingRight: 4 }}>
                  <div style={bloqueACSS(b.info_label)}>F. RECEPCIÓN:</div>
                  <div style={bloqueACSS(b.info_valor)}>22/05/2026</div>
                  <div style={{ height: 4 }} />
                  <div style={bloqueACSS(b.info_label)}>ALMACÉN:</div>
                  <div style={bloqueACSS(b.info_valor)}>ALMACÉN PRINCIPAL</div>
                  <div style={{ height: 4 }} />
                  <div style={bloqueACSS(b.info_label)}>F. COMPRA:</div>
                  <div style={bloqueACSS(b.info_valor)}>20/05/2026</div>
                </td>
                <td style={{ width: "50%", verticalAlign: "top", paddingLeft: 4 }}>
                  <div style={bloqueACSS(b.info_label)}>USUARIO:</div>
                  <div style={bloqueACSS(b.info_valor)}>BRYZA LILIANA CARRION</div>
                  <div style={{ height: 4 }} />
                  <div style={bloqueACSS(b.info_label)}>DOCUMENTO:</div>
                  <div style={bloqueACSS(b.info_valor)}>F001-00012345</div>
                </td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Datos del Proveedor */}
          <div style={{ ...bloqueACSS(b.info_label), textAlign: "center", borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`, paddingTop: 4, marginBottom: 2 }}>
            DATOS DEL PROVEEDOR
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={bloqueACSS(b.info_label)}>RUC:</td>
                <td style={bloqueACSS(b.info_valor)}>20456789012</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>RAZÓN SOCIAL:</td>
                <td style={bloqueACSS(b.info_valor)}>GRUPO MI REDENTOR S.A.C.</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>GUÍA REMISIÓN:</td>
                <td style={bloqueACSS(b.info_valor)}>G001-00054321</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Datos del Transportista */}
          <div style={{ ...bloqueACSS(b.info_label), textAlign: "center", borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`, paddingTop: 4, marginBottom: 2 }}>
            DATOS DEL TRANSPORTISTA
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={bloqueACSS(b.info_label)}>RUC:</td>
                <td style={bloqueACSS(b.info_valor)}>20123456789</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>RAZÓN SOCIAL:</td>
                <td style={bloqueACSS(b.info_valor)}>TRANSPORTES LIMA S.A.C.</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>PLACA:</td>
                <td style={bloqueACSS(b.info_valor)}>ABC-123</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>LICENCIA:</td>
                <td style={bloqueACSS(b.info_valor)}>T12345678</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>NOMBRES:</td>
                <td style={bloqueACSS(b.info_valor)}>JUAN PÉREZ ROJAS</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>GUÍA REM. TRANSP.:</td>
                <td style={bloqueACSS(b.info_valor)}>T001-00000789</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Tabla productos */}
          <div style={{ ...bloqueACSS(b.obs_label), borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`, paddingTop: 4, marginBottom: 2 }}>
            PRODUCTOS
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left" }}>Cód.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left" }}>Producto</th>
                <th style={{ ...bloqueACSS(b.tabla_header) }}>Unidad</th>
                <th style={{ ...bloqueACSS(b.tabla_header) }}>Cant.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={bloqueACSS(b.tabla_fila)}>21045</td>
                <td style={bloqueACSS(b.tabla_fila)}>VARILLA CONSTRUCCION 1" - ACEROS AREQUIPA</td>
                <td style={bloqueACSS(b.tabla_fila)}>UNIDAD</td>
                <td style={bloqueACSS(b.tabla_fila)}>50</td>
              </tr>
            </tbody>
          </table>

          {/* Total */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4, background: "#f0f0f0" }}>
            <tbody>
              <tr>
                <td style={{ ...bloqueACSS(b.total_label), padding: 4 }}>TOTAL ITEMS</td>
                <td style={{ ...bloqueACSS(b.total_valor), padding: 4 }}>50</td>
              </tr>
            </tbody>
          </table>

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
