"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

export default function TicketPagoCompra({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, logoUrl, fontFaceCss, containerStyle } = ctx

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
            {logoUrl && !m.ocultar_logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="logo" style={{ maxWidth: "100%", height: 80, objectFit: "contain" }} />
            )}
          </div>

          {sepDouble}

          {/* Título */}
          <div style={{ ...bloqueACSS(b.caja_tipo), textAlign: "center", padding: "4px 0" }}>
            COMPROBANTE DE PAGO
          </div>

          {sep}

          {/* Datos del pago */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>Fecha Pago:</td>
                <td style={valorStyle}>09/05/2026</td>
              </tr>
              <tr>
                <td style={labelStyle}>Método Pago:</td>
                <td style={valorStyle}>efectivo / efectivo</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Monto pagado destacado */}
          <div style={{ textAlign: "center", padding: "6px 0" }}>
            <div style={{ ...bloqueACSS(b.info_label), marginBottom: 2 }}>MONTO PAGADO</div>
            <div style={{ ...bloqueACSS(b.caja_numero), fontSize: 18, fontWeight: 700 }}>S/. 250.00</div>
          </div>

          {sep}

          {/* Referencia de compra */}
          <div style={{ ...bloqueACSS(b.info_label), textAlign: "center", marginBottom: 3 }}>
            REFERENCIA DE COMPRA
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>Documento:</td>
                <td style={valorStyle}>FACTURA F001-00000045</td>
              </tr>
              <tr>
                <td style={labelStyle}>Proveedor:</td>
                <td style={valorStyle}>DISTRIBUIDORA SCHUBERT S.A.C.</td>
              </tr>
              <tr>
                <td style={labelStyle}>RUC:</td>
                <td style={valorStyle}>20505123456</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Resumen de cuenta */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={{ ...bloqueACSS(b.info_label), width: "60%" }}>Total de Compra:</td>
                <td style={{ ...bloqueACSS(b.info_valor), textAlign: "right" }}>S/. 1,500.00</td>
              </tr>
              <tr>
                <td style={bloqueACSS(b.info_label)}>Total Pagado:</td>
                <td style={{ ...bloqueACSS(b.info_valor), textAlign: "right" }}>S/. 1,250.00</td>
              </tr>
              <tr>
                <td style={{ ...bloqueACSS(b.total_label), paddingTop: 2 }}>SALDO PENDIENTE:</td>
                <td style={{ ...bloqueACSS(b.total_valor), paddingTop: 2, textAlign: "right" }}>S/. 250.00</td>
              </tr>
            </tbody>
          </table>

          {sepDouble}

          {/* Pie */}
          <div style={{ ...bloqueACSS(b.despedida_footer), textAlign: "center", padding: "4px 0" }}>
            Comprobante de pago generado el 25/05/2026 10:00
          </div>
        </div>
      </div>
    </>
  )
}
