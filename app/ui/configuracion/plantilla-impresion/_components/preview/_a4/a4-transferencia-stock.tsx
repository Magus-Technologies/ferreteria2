"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import Fila from "../_shared/fila"
import type { PreviewContext } from "../_shared/types"

export default function A4TransferenciaStock({ ctx }: { ctx: PreviewContext }) {
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
                <div style={{ border: `${e.border_px}px solid ${e.color_tema}`, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ ...bloqueACSS(b.caja_ruc), padding: "8px 8px 6px" }}>R.U.C. {ruc}</div>
                  <div style={{ ...bloqueACSS(b.caja_tipo), background: e.color_tema, padding: "7px 8px" }}>TRANSFERENCIA DE STOCK</div>
                  <div style={{ ...bloqueACSS(b.caja_numero), padding: "6px 8px 8px" }}>TS0001-00000041</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Info-grid (orden idéntico al blade) */}
        <table className="w-full mb-2" style={{ borderCollapse: "collapse", border: `${e.border_thin_px}px solid ${e.color_borde}` }}>
          <tbody>
            <Fila e={e} b={b} izq={["Fecha de Emisión", "22/05/2026"]} der={["Usuario", "BRYZA LILIANA CARRION"]} />
            <Fila e={e} b={b} izq={["Almacén Origen", "ALMACÉN PRINCIPAL"]} der={["Almacén Destino", "ALMACÉN SECUNDARIO"]} />
            <Fila e={e} b={b} izq={["Observaciones", "TRANSFERENCIA POR REABASTECIMIENTO"]} der={["Estado", "ACTIVO"]} />
          </tbody>
        </table>

        {/* Tabla productos */}
        <table className="w-full" style={{ borderCollapse: "collapse", border: `${e.border_px}px solid ${e.color_borde}` }}>
          <thead>
            <tr style={{ background: e.color_tema }}>
              {[
                { label: "ITEM", w: "4%", align: "center" as const },
                { label: "CÓDIGO", w: "9%", align: "center" as const },
                { label: "CANT.", w: "6%", align: "center" as const },
                { label: "UNIDAD", w: "9%", align: "center" as const },
                { label: "PRODUCTO", w: "auto", align: "left" as const },
                { label: "STK ANT. ORIG.", w: "10%", align: "center" as const },
                { label: "STK NVO. ORIG.", w: "10%", align: "center" as const },
                { label: "STK ANT. DEST.", w: "10%", align: "center" as const },
                { label: "STK NVO. DEST.", w: "10%", align: "center" as const },
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
                { v: "50.000", align: "center" as const },
                { v: "UNIDAD", align: "center" as const },
                { v: 'VARILLA CONSTRUCCION 1" - ACEROS AREQUIPA', align: "left" as const },
                { v: "120", align: "center" as const },
                { v: "70", align: "center" as const },
                { v: "0", align: "center" as const },
                { v: "50", align: "center" as const },
                { v: "S/ 4,915.50", align: "right" as const },
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
              <td colSpan={10} style={{ height: 100, borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }} />
            </tr>
          </tbody>
        </table>

        {/* SON + Observaciones + Total */}
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
                SON: CUATRO MIL NOVECIENTOS QUINCE CON 50/100 SOLES.
              </td>
            </tr>
          </tbody>
        </table>

        {/* Observaciones + Total */}
        <table className="w-full" style={{ borderCollapse: "collapse", minHeight: 120 }}>
          <tbody>
            <tr>
              <td style={{ width: "65%", padding: 15, verticalAlign: "middle" }}>
                <div style={{ border: `${e.border_px}px solid ${e.color_borde}`, borderRadius: 8, padding: 8 }}>
                  <div style={{ ...bloqueACSS(b.obs_label), marginBottom: 4 }}>{m.label_observaciones}</div>
                  <div style={{ ...bloqueACSS(b.obs_valor), lineHeight: 1.5 }}>TRANSFERENCIA POR REABASTECIMIENTO</div>
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
                        S/. 4,915.50
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
