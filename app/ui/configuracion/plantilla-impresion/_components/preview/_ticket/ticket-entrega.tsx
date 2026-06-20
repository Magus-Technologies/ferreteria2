"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

export default function TicketEntrega({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, razonSocial, direccion, email, ruc, celular, logoUrl, fontFaceCss, containerStyle } = ctx

  const sep = <div style={{ borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`, margin: "6px 0" }} />

  return (
    <>
      {fontFaceCss && <style>{fontFaceCss}</style>}
      <div className="bg-white p-4 border border-slate-200 rounded" style={containerStyle}>
        <div style={{ width: 280, margin: "0 auto" }}>
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

          <div style={{ marginBottom: 6 }}>
            <div style={{ ...bloqueACSS(b.caja_tipo), textAlign: "center" }}>TICKET DE ENTREGA</div>
            <div style={{ ...bloqueACSS(b.caja_numero), textAlign: "center" }}>Venta: B001-00000327</div>
          </div>

          {sep}

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", verticalAlign: "top", paddingRight: 4 }}>
                  <div style={bloqueACSS(b.entrega_info_label)}>FECHA ENTREGA:</div>
                  <div style={bloqueACSS(b.entrega_info_valor)}>19/05/2026</div>
                  <div style={{ height: 4 }} />
                  <div style={bloqueACSS(b.entrega_info_label)}>TIPO ENTREGA:</div>
                  <div style={bloqueACSS(b.entrega_info_valor)}>Despacho a Domicilio</div>
                  <div style={{ height: 4 }} />
                  <div style={bloqueACSS(b.entrega_info_label)}>DESPACHADOR:</div>
                  <div style={bloqueACSS(b.entrega_info_valor)}>BRYZA CARRION</div>
                </td>
                <td style={{ width: "50%", verticalAlign: "top", paddingLeft: 4 }}>
                  <div style={bloqueACSS(b.entrega_info_label)}>FECHA PROGRAMADA:</div>
                  <div style={bloqueACSS(b.entrega_info_valor)}>20/05/2026</div>
                  <div style={{ height: 4 }} />
                  <div style={bloqueACSS(b.entrega_info_label)}>TIPO DESPACHO:</div>
                  <div style={bloqueACSS(b.entrega_info_valor)}>Programado</div>
                  <div style={{ height: 4 }} />
                  <div style={bloqueACSS(b.entrega_info_label)}>HORARIO:</div>
                  <div style={bloqueACSS(b.entrega_info_valor)}>08:00 - 12:00</div>
                </td>
              </tr>
            </tbody>
          </table>

          <div
            style={{
              ...bloqueACSS(b.obs_label),
              textAlign: "center",
              borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`,
              paddingTop: 4,
              marginBottom: 2,
            }}
          >
            DATOS DEL CLIENTE
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={{ ...bloqueACSS(b.info_label), width: "25%" }}>CLIENTE:</td>
                <td style={bloqueACSS(b.info_valor)}>EFRAIN CASTILLO</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>DOCUMENTO:</td>
                <td style={bloqueACSS(b.info_valor)}>74568367</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>TELÉFONO:</td>
                <td style={bloqueACSS(b.info_valor)}>987654321</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>DIRECCIÓN:</td>
                <td style={bloqueACSS(b.info_valor)}>AV. EJEMPLO 123</td>
              </tr>
            </tbody>
          </table>

          <div
            style={{
              ...bloqueACSS(b.obs_label),
              textAlign: "center",
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
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left" }}>Cód.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left" }}>Producto</th>
                <th style={bloqueACSS(b.tabla_header)}>Unidad</th>
                <th style={bloqueACSS(b.tabla_header)}>Entreg.</th>
                <th style={bloqueACSS(b.tabla_header)}>Pend.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={bloqueACSS(b.tabla_fila)}>CT12M</td>
                <td style={bloqueACSS(b.tabla_fila)}>CINTA TEFLON</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>UNIDAD</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>10</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>0</td>
              </tr>
            </tbody>
          </table>

          <table
            style={{ width: "100%", borderCollapse: "collapse", marginTop: 4, background: "#f0f0f0" }}
          >
            <tbody>
              <tr>
                <td style={{ ...bloqueACSS(b.total_label), padding: 4 }}>TOTAL ITEMS</td>
                <td style={{ ...bloqueACSS(b.total_valor), padding: 4 }}>1</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 4 }}>
            <div style={bloqueACSS(b.obs_label)}>{m.label_observaciones}</div>
            <div style={bloqueACSS(b.obs_valor)}>- NINGUNA</div>
          </div>

          {/* Firmas */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
            <tbody>
              <tr>
                <td
                  style={{
                    width: "45%",
                    textAlign: "center",
                    paddingTop: 18,
                    borderTop: `1px solid ${e.color_texto}`,
                    ...bloqueACSS(b.consulta_leyenda),
                  }}
                >
                  Firma del Despachador
                </td>
                <td style={{ width: "10%" }}></td>
                <td
                  style={{
                    width: "45%",
                    textAlign: "center",
                    paddingTop: 18,
                    borderTop: `1px solid ${e.color_texto}`,
                    ...bloqueACSS(b.consulta_leyenda),
                  }}
                >
                  Firma del Cliente
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
