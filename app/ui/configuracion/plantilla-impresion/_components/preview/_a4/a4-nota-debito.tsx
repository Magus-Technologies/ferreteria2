"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import Fila from "../_shared/fila"
import FilaProducto from "../_shared/fila-producto"
import type { PreviewContext } from "../_shared/types"

export default function A4NotaDebito({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, plantilla, razonSocial, direccion, email, ruc, celular, logoUrl, fontFaceCss, containerStyle } = ctx

  return (
    <>
      {fontFaceCss && <style>{fontFaceCss}</style>}
      <div className="bg-white p-4 border border-slate-200 rounded" style={containerStyle}>
        {/* Header */}
        <table className="w-full mb-2" style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "30%", verticalAlign: "middle", paddingRight: 4 }}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="logo" style={{ maxWidth: "100%", maxHeight: 80, objectFit: "contain" }} />
                ) : (
                  <div style={{ height: 80 }} />
                )}
              </td>
              <td style={{ verticalAlign: "middle", lineHeight: 1.4 }}>
                <div style={{ ...bloqueACSS(b.empresa_razon), marginBottom: 2 }}>{razonSocial}</div>
                <div style={bloqueACSS(b.empresa_direccion)}>
                  {direccion && <div>{direccion}</div>}
                  {celular && <div>Cel: {celular}</div>}
                  {email && <div>Email: {email}</div>}
                </div>
              </td>
              <td style={{ width: "30%", verticalAlign: "middle" }}>
                <div style={{ border: `${e.border_px}px solid ${e.color_tema}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ ...bloqueACSS(b.caja_ruc), padding: 4 }}>R.U.C. {ruc}</div>
                  <div style={{ ...bloqueACSS(b.caja_tipo), background: e.color_tema, padding: 4 }}>NOTA DE D&Eacute;BITO</div>
                  <div style={{ ...bloqueACSS(b.caja_numero), padding: 4 }}>ND-00000001</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Info-grid */}
        <table className="w-full mb-2" style={{ borderCollapse: "collapse", border: `${e.border_thin_px}px solid ${e.color_borde}` }}>
          <tbody>
            <Fila e={e} b={b} izq={["F. Emisi&oacute;n", "23/05/2026"]} der={["Moneda", "SOLES (PEN)"]} />
            <Fila e={e} b={b} izq={["RUC / DNI", "20456789012"]} der={["Direcci&oacute;n", "AV. PRINCIPAL 456 - LIMA"]} />
            <Fila e={e} b={b} izq={["Se&ntilde;or(es)", "CLIENTES VARIOS"]} der={["Doc. que modifica", "FACTURA F001-00001234"]} />
            <Fila e={e} b={b} izq={["Motivo", "INTER&Eacute;S POR MORA"]} der={["Observaciones", "Cobro de inter&eacute;s por pago tard&iacute;o"]} />
          </tbody>
        </table>

        {/* Tabla productos */}
        <table className="w-full" style={{ borderCollapse: "collapse", border: `${e.border_px}px solid ${e.color_borde}` }}>
          <thead>
            <tr style={{ background: e.color_tema }}>
              {[
                { label: "ITEM", w: "6%" },
                { label: "C&Oacute;DIGO", w: "10%" },
                { label: "DESCRIPCI&Oacute;N", w: "40%" },
                { label: "CANT.", w: "8%" },
                { label: "UNIDAD", w: "10%" },
                { label: "P. UNIT.", w: "13%" },
                { label: "IMPORTE", w: "13%" },
              ].map((c, i, arr) => (
                <th
                  key={c.label}
                  style={{
                    ...bloqueACSS(b.tabla_header),
                    padding: e.pad_px,
                    width: c.w,
                    borderRight: i === arr.length - 1 ? "none" : `${e.border_thin_px}px solid ${e.color_borde}`,
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <FilaProducto
              e={e}
              b={b}
              cells={["1", "CT12M", 'CINTA TEFLON 1/2" X 12 MTS - SWIFT', "1", "UNIDAD", "15.00", "15.00"]}
            />
            <tr>
              <td colSpan={7} style={{ height: 180, borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }} />
            </tr>
          </tbody>
        </table>

        {/* SON */}
        <table
          className="w-full"
          style={{
            borderCollapse: "collapse",
            borderLeft: `${e.border_px}px solid ${e.color_borde}`,
            borderRight: `${e.border_px}px solid ${e.color_borde}`,
            borderBottom: `${e.border_px}px solid ${e.color_borde}`,
          }}
        >
          <tbody>
            <tr>
              <td style={{ ...bloqueACSS(b.son), padding: e.pad_px + 2 }}>SON: QUINCE CON 0/100 SOLES.</td>
            </tr>
          </tbody>
        </table>

        {/* Observaciones + Totales */}
        <table className="w-full mt-2" style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "65%", padding: 8, verticalAlign: "middle" }}>
                <div style={{ border: `${e.border_px}px solid ${e.color_borde}`, borderRadius: 6, padding: 6 }}>
                  <div style={{ ...bloqueACSS(b.obs_label), marginBottom: 4 }}>{m.label_observaciones}</div>
                  <div style={bloqueACSS(b.obs_valor)}>
                    - COBRO DE INTER&Eacute;S POR MORA EN PAGO.<br />
                    - NINGUNA.
                  </div>
                </div>
              </td>
              <td style={{ width: "35%", verticalAlign: "top" }}>
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    {[["SUBTOTAL", "12.71"], ["IGV (18%)", "2.29"], ["TOTAL", "15.00"]].map(([label, valor]) => (
                      <tr key={label} style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                        <td style={{ ...bloqueACSS(b.total_label), width: "60%", borderLeft: `${e.border_thin_px}px solid ${e.color_borde}`, borderRight: `${e.border_thin_px}px solid ${e.color_borde}`, padding: e.pad_px + 2 }}>{label}</td>
                        <td style={{ ...bloqueACSS(b.total_valor), width: "40%", borderRight: `${e.border_thin_px}px solid ${e.color_borde}`, padding: e.pad_px + 2 }}>{valor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Despedida */}
        {!m.ocultar_despedida && (
          <div className="mt-3" style={{ textAlign: "center" }}>
            <div style={bloqueACSS(b.despedida_footer)}>
              {plantilla.despedida_activo && plantilla.mensaje_despedida ? (
                <span dangerouslySetInnerHTML={{ __html: plantilla.mensaje_despedida }} />
              ) : (
                "Representaci&oacute;n impresa de la Nota de D&eacute;bito Electr&oacute;nica"
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}