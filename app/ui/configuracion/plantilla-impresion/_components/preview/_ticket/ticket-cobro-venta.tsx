"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

export default function TicketCobroVenta({ ctx }: { ctx: PreviewContext }) {
  const { e, b, logoUrl, fontFaceCss, containerStyle } = ctx

  const sep = <div style={{ borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`, margin: "4px 0" }} />
  const sepDouble = <div style={{ borderTop: `2px solid ${e.color_borde}`, margin: "4px 0" }} />

  const labelStyle: React.CSSProperties = {
    ...bloqueACSS(b.info_label),
    width: "40%",
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
          {/* Solo logo */}
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="logo" style={{ maxWidth: "100%", height: 80, objectFit: "contain" }} />
            )}
          </div>

          {sepDouble}

          {/* Título */}
          <div style={{ ...bloqueACSS(b.caja_tipo), textAlign: "center", padding: "4px 0" }}>
            COMPROBANTE DE COBRO
          </div>

          {sep}

          {/* Datos del cobro */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>Fecha Cobro:</td>
                <td style={valorStyle}>09/05/2026</td>
              </tr>
              <tr>
                <td style={labelStyle}>Método Pago:</td>
                <td style={valorStyle}>efectivo / efectivo</td>
              </tr>
              <tr>
                <td style={labelStyle}>Registrado por:</td>
                <td style={valorStyle}>BRYZA LILIANA CARRION MORALES</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Monto cobrado destacado */}
          <div style={{ textAlign: "center", padding: "6px 0" }}>
            <div style={{ ...bloqueACSS(b.info_label), marginBottom: 2 }}>MONTO COBRADO</div>
            <div style={{ ...bloqueACSS(b.caja_numero), fontSize: 18, fontWeight: 700 }}>S/. 10.00</div>
          </div>

          {sep}

          {/* Referencia de venta */}
          <div style={{ ...bloqueACSS(b.info_label), textAlign: "center", marginBottom: 3 }}>
            REFERENCIA DE VENTA
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>Documento:</td>
                <td style={valorStyle}>BOLETA B001-00000254</td>
              </tr>
              <tr>
                <td style={labelStyle}>Cliente:</td>
                <td style={valorStyle}>EFRAIN ALEJANDRO CASTILLO CHIGNE</td>
              </tr>
              <tr>
                <td style={labelStyle}>Doc. Cliente:</td>
                <td style={valorStyle}>74568367</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Resumen de cuenta */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={{ ...bloqueACSS(b.info_label), width: "60%" }}>Total de Venta:</td>
                <td style={{ ...bloqueACSS(b.info_valor), textAlign: "right" }}>S/. 670.00</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>Total Cobrado:</td>
                <td style={{ ...bloqueACSS(b.info_valor), textAlign: "right" }}>S/. 670.00</td>
              </tr>
              <tr>
                <td style={{ ...bloqueACSS(b.total_label), paddingTop: 2 }}>SALDO PENDIENTE:</td>
                <td style={{ ...bloqueACSS(b.total_valor), paddingTop: 2, textAlign: "right" }}>S/. 0.00</td>
              </tr>
            </tbody>
          </table>

          {sepDouble}

          {/* Pie */}
          <div style={{ ...bloqueACSS(b.despedida_footer), textAlign: "center", padding: "4px 0" }}>
            Comprobante de cobro generado el 25/05/2026 10:00
          </div>
        </div>
      </div>
    </>
  )
}
