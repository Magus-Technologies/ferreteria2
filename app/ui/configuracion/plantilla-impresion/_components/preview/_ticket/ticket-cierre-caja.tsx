"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

const denominacionesDemo = [
  { label: "Billete S/. 100", cant: 3, total: "300.00" },
  { label: "Billete S/. 50", cant: 5, total: "250.00" },
  { label: "Billete S/. 20", cant: 4, total: "80.00" },
  { label: "Moneda S/. 5", cant: 6, total: "30.00" },
]

const metodosPagoDemo = [
  { label: "Efectivo", cant: 12, total: "660.00" },
  { label: "Yape", cant: 4, total: "180.00" },
  { label: "Transferencia", cant: 1, total: "150.00" },
]

export default function TicketCierreCaja({ ctx }: { ctx: PreviewContext }) {
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
            <div style={{ ...bloqueACSS(b.caja_tipo), textAlign: "center", whiteSpace: "pre-line" }}>{tituloDocumento}</div>
            <div style={{ ...bloqueACSS(b.caja_numero), textAlign: "center" }}>{numeroDocumento}</div>
          </div>

          {sep}

          {/* Info del cierre */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>F. APERTURA:</td>
                <td style={valorStyle}>19/05/2026</td>
                <td style={{ ...labelStyle, width: "20%" }}>HORA:</td>
                <td style={valorStyle}>08:15</td>
              </tr>
              <tr>
                <td style={labelStyle}>F. CIERRE:</td>
                <td style={valorStyle}>19/05/2026</td>
                <td style={labelStyle}>HORA:</td>
                <td style={valorStyle}>20:30</td>
              </tr>
              <tr>
                <td style={labelStyle}>CAJA:</td>
                <td style={valorStyle} colSpan={3}>CAJA PRINCIPAL</td>
              </tr>
              <tr>
                <td style={labelStyle}>USUARIO:</td>
                <td style={valorStyle} colSpan={3}>BRYZA LILIANA CARRION MORALES</td>
              </tr>
              <tr>
                <td style={labelStyle}>SUPERVISOR:</td>
                <td style={valorStyle} colSpan={3}>JUAN PEREZ RAMOS</td>
              </tr>
            </tbody>
          </table>

          {/* Resumen de saldos */}
          <div style={sectionTitle}>RESUMEN DE SALDOS</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={bloqueACSS(b.tabla_fila)}>Efectivo Inicial:</td>
                <td style={{ ...bloqueACSS(b.total_valor), textAlign: "right" }}>S/ 500.00</td>
              </tr>
            </tbody>
          </table>

          {/* Movimientos de Caja */}
          <div style={sectionTitle}>MOVIMIENTOS DE CAJA</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={bloqueACSS(b.tabla_fila)}>Otros Ingresos:</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>S/ 50.00</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.tabla_fila)}>Gastos:</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>S/ 20.00</td>
              </tr>
            </tbody>
          </table>

          {/* Totales Generales */}
          <div style={sectionTitle}>TOTALES GENERALES</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={bloqueACSS(b.total_label)}>Resumen Ventas:</td>
                <td style={{ ...bloqueACSS(b.total_valor), textAlign: "right" }}>S/ 990.00</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.tabla_fila)}>Resumen Ingresos:</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>S/ 50.00</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.tabla_fila)}>Resumen Egresos:</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>S/ 20.00</td>
              </tr>
              <tr style={{ background: "#f0f0f0" }}>
                <td style={{ ...bloqueACSS(b.total_label), padding: 3 }}>Total en Caja (Efectivo):</td>
                <td style={{ ...bloqueACSS(b.total_valor), padding: 3, textAlign: "right" }}>S/ 660.00</td>
              </tr>
            </tbody>
          </table>

          {/* Cierre Físico */}
          <div style={sectionTitle}>CIERRE FÍSICO</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={bloqueACSS(b.tabla_fila)}>Dinero Efectivo:</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>S/ 660.00</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.tabla_fila)}>Total Cuentas:</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>S/ 330.00</td>
              </tr>
              <tr style={{ background: "#f0f0f0" }}>
                <td style={{ ...bloqueACSS(b.total_label), padding: 3 }}>Total Cierre Físico:</td>
                <td style={{ ...bloqueACSS(b.total_valor), padding: 3, textAlign: "right" }}>S/ 990.00</td>
              </tr>
            </tbody>
          </table>

          {/* Desglose denominaciones */}
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
                <td style={bloqueACSS(b.total_label)}>Total</td>
                <td />
                <td style={{ ...bloqueACSS(b.total_valor), textAlign: "right" }}>S/ 660.00</td>
              </tr>
            </tbody>
          </table>

          {/* Diferencias */}
          <div style={sectionTitle}>DIFERENCIAS</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr style={{ background: "#e3f2fd" }}>
                <td style={{ ...bloqueACSS(b.total_label), padding: "2px 4px" }}>Monto Esperado:</td>
                <td style={{ ...bloqueACSS(b.total_valor), padding: "2px 4px", textAlign: "right" }}>S/ 660.00</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.tabla_fila)}>Sobrante:</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right", color: "green" }}>S/ 0.00</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.tabla_fila)}>Faltante:</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right", color: "red" }}>S/ 0.00</td>
              </tr>
              <tr style={{ background: "#e8f5e9" }}>
                <td style={{ ...bloqueACSS(b.total_label), padding: 3 }}>Diferencia Total:</td>
                <td style={{ ...bloqueACSS(b.total_valor), padding: 3, textAlign: "right", color: "green" }}>S/ 0.00</td>
              </tr>
            </tbody>
          </table>

          {/* Observaciones */}
          <div style={sectionTitle}>OBSERVACIONES</div>
          <div style={{ background: "#fff3cd", padding: 3, fontSize: 9 }}>- NINGUNA</div>

          {/* Estado del cierre */}
          <div style={sectionTitle}>ESTADO DEL CIERRE</div>
          <div style={{ padding: 4, textAlign: "center", fontWeight: 700, background: "#e8f5e9", color: "green" }}>
            ✓ CAJA CUADRADA
          </div>

          {/* Métodos de pago */}
          <div style={sectionTitle}>MÉTODOS DE PAGO</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left" }}>Método</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", width: 35 }}>Cant.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right", width: 55 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {metodosPagoDemo.map((m, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                  <td style={bloqueACSS(b.tabla_fila)}>{m.label}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>{m.cant}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Ventas */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
            <tbody>
              <tr style={{ borderTop: `${e.border_px}px solid ${e.color_borde}`, background: "#f0f0f0" }}>
                <td style={{ ...bloqueACSS(b.total_label), padding: 4 }}>TOTAL VENTAS</td>
                <td style={{ ...bloqueACSS(b.total_valor), padding: 4, textAlign: "right" }}>S/ 990.00</td>
              </tr>
            </tbody>
          </table>
          <div style={{ textAlign: "center", marginTop: 2, fontSize: 9 }}>
            NOVECIENTOS NOVENTA CON 0/100 SOLES
          </div>
        </div>
      </div>
    </>
  )
}
