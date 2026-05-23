"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import Fila from "../_shared/fila"
import type { PreviewContext, EstiloResuelto } from "../_shared/types"
import type { BloquesResueltos } from "~/lib/api/plantilla-impresion"

// Fila tipo "título de sección" dentro de un info-grid (igual que en
// info-grid.blade.php cuando recibe { __titulo: '...' }).
function FilaTitulo({ e, b, titulo }: { e: EstiloResuelto; b: BloquesResueltos; titulo: string }) {
  return (
    <tr>
      <td
        colSpan={4}
        style={{
          ...bloqueACSS(b.info_label),
          padding: `${e.pad_px}px ${e.pad_px + 4}px`,
          background: "#f5f5f5",
          borderTop: `${e.border_thin_px}px solid ${e.color_borde}`,
          borderBottom: `${e.border_thin_px}px solid ${e.color_borde}`,
        }}
      >
        {titulo}
      </td>
    </tr>
  )
}

export default function A4OrdenCompra({ ctx }: { ctx: PreviewContext }) {
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
                  <div style={{ ...bloqueACSS(b.caja_tipo), background: e.color_tema, padding: 4 }}>ORDEN DE COMPRA</div>
                  <div style={{ ...bloqueACSS(b.caja_numero), padding: 4 }}>OC-00000056</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Info general + Proveedor (un solo recuadro continuo) */}
        <table className="w-full mb-2" style={{ borderCollapse: "collapse", border: `${e.border_thin_px}px solid ${e.color_borde}` }}>
          <tbody>
            <Fila e={e} b={b} izq={["N° Orden", "OC-00000056"]} der={["Fecha", "19/05/2026"]} />
            <Fila e={e} b={b} izq={["Solicitante", "BRYZA LILIANA CARRION MORALES"]} der={["Moneda", "Soles (S/.)"]} />
            <Fila e={e} b={b} izq={["T. Cambio", "1.0000"]} der={["Requerimiento", "—"]} />
            <FilaTitulo e={e} b={b} titulo="Proveedor" />
            <Fila e={e} b={b} izq={["Razón Social", "GRUPO MI REDENTOR S.A.C."]} der={["RUC", "20611539160"]} />
          </tbody>
        </table>

        {/* Tabla productos */}
        <table className="w-full" style={{ borderCollapse: "collapse", border: `${e.border_px}px solid ${e.color_borde}` }}>
          <thead>
            <tr style={{ background: e.color_tema }}>
              {[
                { label: "ITEM", w: "5%", align: "center" as const },
                { label: "CÓDIGO", w: "12%", align: "center" as const },
                { label: "DESCRIPCIÓN", w: "auto", align: "left" as const },
                { label: "MARCA", w: "10%", align: "center" as const },
                { label: "UNID.", w: "8%", align: "center" as const },
                { label: "CANT.", w: "8%", align: "center" as const },
                { label: "P. UNIT.", w: "11%", align: "right" as const },
                { label: "FLETE", w: "11%", align: "right" as const },
                { label: "SUBTOTAL", w: "11%", align: "right" as const },
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
                { v: "CT12M", align: "center" as const },
                { v: 'CINTA TEFLON 1/2" X 12 MTS - SWIFT', align: "left" as const },
                { v: "SCHUBERT", align: "center" as const },
                { v: "UNIDAD", align: "center" as const },
                { v: "100.00", align: "center" as const },
                { v: "S/. 0.39", align: "right" as const },
                { v: "S/. 0.00", align: "right" as const },
                { v: "S/. 39.00", align: "right" as const },
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
              <td colSpan={9} style={{ height: 140, borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }} />
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
              <td style={{ ...bloqueACSS(b.son), padding: e.pad_px + 2 }}>SON: TREINTA Y NUEVE CON 0/100 SOLES.</td>
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
                  <div style={bloqueACSS(b.obs_valor)}>- NINGUNA</div>
                </div>
              </td>
              <td style={{ width: "35%", verticalAlign: "top" }}>
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    {[
                      ["SUBTOTAL", "S/. 39.00"],
                      ["TOTAL", "S/. 39.00"],
                    ].map(([label, valor]) => (
                      <tr key={label} style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                        <td style={{ ...bloqueACSS(b.total_label), width: "60%", borderLeft: `${e.border_thin_px}px solid ${e.color_borde}`, borderRight: `${e.border_thin_px}px solid ${e.color_borde}`, padding: e.pad_px + 2 }}>
                          {label}
                        </td>
                        <td style={{ ...bloqueACSS(b.total_valor), width: "40%", borderRight: `${e.border_thin_px}px solid ${e.color_borde}`, padding: e.pad_px + 2 }}>
                          {valor}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Condiciones de Pago (con título dentro del recuadro) */}
        <table className="w-full mt-2" style={{ borderCollapse: "collapse", border: `${e.border_thin_px}px solid ${e.color_borde}` }}>
          <tbody>
            <FilaTitulo e={e} b={b} titulo="Condiciones de Pago" />
            <Fila e={e} b={b} izq={["Forma de Pago", "Contado"]} der={["", ""]} />
            <Fila e={e} b={b} izq={["Tipo Doc.", "01"]} der={["Serie / Nro", "-"]} />
          </tbody>
        </table>
      </div>
    </>
  )
}
