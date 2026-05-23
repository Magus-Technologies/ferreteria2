"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import Fila from "../_shared/fila"
import type { PreviewContext } from "../_shared/types"

export default function A4IngresoSalida({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, razonSocial, direccion, email, ruc, celular, logoUrl, fontFaceCss, containerStyle } = ctx

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
                  <div style={{ ...bloqueACSS(b.caja_tipo), background: e.color_tema, padding: 4 }}>NOTA DE INGRESO ELECTRÓNICA</div>
                  <div style={{ ...bloqueACSS(b.caja_numero), padding: 4 }}>NI0001-00005334</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Info-grid */}
        <table className="w-full mb-2" style={{ borderCollapse: "collapse", border: `${e.border_thin_px}px solid ${e.color_borde}` }}>
          <tbody>
            <Fila e={e} b={b} izq={["Fecha de Emisión", "22/05/2026"]} der={["Proveedor", "GRUPO MI REDENTOR S.A.C."]} />
            <Fila e={e} b={b} izq={["Almacén", "ALMACÉN PRINCIPAL"]} der={["Tipo de Ingreso", "AJUSTE"]} />
            <Fila e={e} b={b} izq={["Usuario", "BRYZA LILIANA CARRION"]} der={["Observaciones", "—"]} />
          </tbody>
        </table>

        {/* Tabla productos */}
        <table className="w-full" style={{ borderCollapse: "collapse", border: `${e.border_px}px solid ${e.color_borde}` }}>
          <thead>
            <tr style={{ background: e.color_tema }}>
              {[
                { label: "ITEM", w: "5%", align: "center" as const },
                { label: "CÓDIGO", w: "10%", align: "center" as const },
                { label: "DESCRIPCIÓN", w: "auto", align: "left" as const },
                { label: "CANT.", w: "8%", align: "center" as const },
                { label: "UNIDAD", w: "10%", align: "center" as const },
                { label: "STOCK ANT.", w: "10%", align: "center" as const },
                { label: "STOCK NUE.", w: "10%", align: "center" as const },
                { label: "COSTO", w: "10%", align: "right" as const },
              ].map((c, i, arr) => (
                <th
                  key={c.label}
                  style={{
                    ...bloqueACSS(b.tabla_header),
                    padding: e.pad_px,
                    width: c.w,
                    textAlign: c.align,
                    borderRight: i === arr.length - 1 ? "none" : `${e.border_thin_px}px solid ${e.color_borde}`,
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
              {[
                { v: "1", align: "center" as const },
                { v: "21045", align: "center" as const },
                { v: 'VARILLA CONSTRUCCION 1" - ACEROS AREQUIPA', align: "left" as const },
                { v: "15.000", align: "center" as const },
                { v: "UNIDAD", align: "center" as const },
                { v: "-2F40", align: "center" as const },
                { v: "-2F25", align: "center" as const },
                { v: "98.31", align: "right" as const },
              ].map((c, i, arr) => (
                <td
                  key={i}
                  style={{
                    ...bloqueACSS(b.tabla_fila),
                    padding: e.pad_px,
                    textAlign: c.align,
                    borderRight: i === arr.length - 1 ? "none" : `${e.border_thin_px}px solid ${e.color_borde}`,
                  }}
                >
                  {c.v}
                </td>
              ))}
            </tr>
            <tr>
              <td colSpan={8} style={{ height: 140, borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }} />
            </tr>
          </tbody>
        </table>

        {/* SON + Total */}
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
              <td style={{ ...bloqueACSS(b.son), padding: e.pad_px + 2 }}>
                SON: MIL CUATROCIENTOS SETENTA Y CUATRO CON 58/100 SOLES.
              </td>
            </tr>
          </tbody>
        </table>

        {/* Observaciones + Total */}
        <table className="w-full mt-2" style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "65%", padding: 8, verticalAlign: "middle" }}>
                <div style={{ border: `${e.border_px}px solid ${e.color_borde}`, borderRadius: 6, padding: 6 }}>
                  <div style={{ ...bloqueACSS(b.obs_label), marginBottom: 4 }}>{m.label_observaciones}</div>
                  <div style={bloqueACSS(b.obs_valor)}>—</div>
                </div>
              </td>
              <td style={{ width: "35%", verticalAlign: "top" }}>
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                      <td
                        style={{
                          ...bloqueACSS(b.total_label),
                          width: "60%",
                          borderLeft: `${e.border_thin_px}px solid ${e.color_borde}`,
                          borderRight: `${e.border_thin_px}px solid ${e.color_borde}`,
                          padding: e.pad_px + 2,
                        }}
                      >
                        TOTAL
                      </td>
                      <td
                        style={{
                          ...bloqueACSS(b.total_valor),
                          width: "40%",
                          borderRight: `${e.border_thin_px}px solid ${e.color_borde}`,
                          padding: e.pad_px + 2,
                        }}
                      >
                        S/. 1,474.58
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
