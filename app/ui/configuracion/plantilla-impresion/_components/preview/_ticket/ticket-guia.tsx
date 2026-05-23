"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

export default function TicketGuia({ ctx }: { ctx: PreviewContext }) {
  const { e, b, razonSocial, direccion, email, ruc, celular, logoUrl, fontFaceCss, containerStyle } = ctx

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
            <div style={{ ...bloqueACSS(b.caja_tipo), whiteSpace: "pre-line" }}>
              GUÍA DE REMISIÓN REMITENTE{"\n"}ELECTRÓNICA
            </div>
            <div style={bloqueACSS(b.caja_numero)}>T001-00000087</div>
          </div>

          {sep}

          {/* Info guía */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={{ ...bloqueACSS(b.info_label), width: "50%" }}>
                  F. Emisión: <span style={bloqueACSS(b.info_valor)}>19/05/2026</span>
                </td>
                <td style={{ ...bloqueACSS(b.info_label), width: "50%" }}>
                  F. Traslado: <span style={bloqueACSS(b.info_valor)}>20/05/2026</span>
                </td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>Motivo:</td>
                <td style={bloqueACSS(b.info_valor)}>Venta</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>Modalidad:</td>
                <td style={bloqueACSS(b.info_valor)}>Transporte Privado</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>P. Partida:</td>
                <td style={bloqueACSS(b.info_valor)}>AV. EJEMPLO 100</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>P. Llegada:</td>
                <td style={bloqueACSS(b.info_valor)}>AV. DESTINO 250</td>
              </tr>
              <tr>
                <td style={{ ...bloqueACSS(b.info_label), width: "50%" }}>
                  Vehiculo: <span style={bloqueACSS(b.info_valor)}>ABC-123</span>
                </td>
                <td style={{ ...bloqueACSS(b.info_label), width: "50%" }}>
                  Chofer: <span style={bloqueACSS(b.info_valor)}>12345678</span>
                </td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>Nombre:</td>
                <td style={bloqueACSS(b.info_valor)}>MARIO PEREZ</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Destinatario */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={bloqueACSS(b.info_label)}>DNI:</td>
                <td style={bloqueACSS(b.info_valor)}>74568367</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>Destinatario:</td>
                <td style={bloqueACSS(b.info_valor)}>EFRAIN CASTILLO</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Tabla de detalles */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "40%" }}>Descripción</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "15%" }}>Cant.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "20%" }}>Unid.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "25%" }}>Peso(kg)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <td style={bloqueACSS(b.tabla_fila)}>CINTA TEFLON 1/2"</td>
                <td style={bloqueACSS(b.tabla_fila)}>10</td>
                <td style={bloqueACSS(b.tabla_fila)}>UNIDAD</td>
                <td style={bloqueACSS(b.tabla_fila)}>2.50</td>
              </tr>
            </tbody>
          </table>

          {/* Peso total */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
            <tbody>
              <tr>
                <td style={bloqueACSS(b.total_label)}>PESO TOTAL</td>
                <td style={bloqueACSS(b.total_valor)}>2.50 KG</td>
              </tr>
            </tbody>
          </table>

          {/* Observaciones */}
          <div style={{ marginTop: 4 }}>
            <div style={bloqueACSS(b.obs_label)}>OBSERVACIONES</div>
            <div style={bloqueACSS(b.obs_valor)}>-</div>
          </div>
        </div>
      </div>
    </>
  )
}
