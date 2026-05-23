"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

export default function TicketOrdenCompra({ ctx }: { ctx: PreviewContext }) {
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
            <div style={bloqueACSS(b.caja_tipo)}>ORDEN DE COMPRA</div>
            <div style={bloqueACSS(b.caja_numero)}>OC-00000056</div>
          </div>

          {sep}

          {/* Info general */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={{ ...bloqueACSS(b.info_label), width: "45%" }}>N° Orden:</td>
                <td style={bloqueACSS(b.info_valor)}>OC-00000056</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>Fecha:</td>
                <td style={bloqueACSS(b.info_valor)}>19/05/2026</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>Solicitante:</td>
                <td style={bloqueACSS(b.info_valor)}>BRYZA CARRION</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>Moneda:</td>
                <td style={bloqueACSS(b.info_valor)}>Soles (S/.)</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Proveedor */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={{ ...bloqueACSS(b.info_label), width: "45%" }}>Razón Social:</td>
                <td style={bloqueACSS(b.info_valor)}>GRUPO MI REDENTOR S.A.C.</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>RUC:</td>
                <td style={bloqueACSS(b.info_valor)}>20611539160</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Tabla productos */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left" }}>Cód.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left" }}>Descripción</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center" }}>Cant.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right" }}>P.Unit</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <td style={bloqueACSS(b.tabla_fila)}>CT12M</td>
                <td style={bloqueACSS(b.tabla_fila)}>CINTA TEFLON 1/2"</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>100.00</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>S/. 0.39</td>
              </tr>
            </tbody>
          </table>

          {/* Totales */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
            <tbody>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <td style={bloqueACSS(b.total_label)}>SUBTOTAL</td>
                <td style={bloqueACSS(b.total_valor)}>S/. 39.00</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.total_label)}>TOTAL</td>
                <td style={bloqueACSS(b.total_valor)}>S/. 39.00</td>
              </tr>
            </tbody>
          </table>

          {/* SON */}
          <div style={{ ...bloqueACSS(b.son), marginTop: 4 }}>SON: TREINTA Y NUEVE CON 0/100 SOLES</div>

          {/* Observaciones */}
          <div style={{ marginTop: 4 }}>
            <div style={bloqueACSS(b.obs_label)}>{m.label_observaciones}</div>
            <div style={bloqueACSS(b.obs_valor)}>- NINGUNA</div>
          </div>
        </div>
      </div>
    </>
  )
}
