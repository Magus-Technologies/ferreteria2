"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import Fila from "../_shared/fila"
import type { PreviewContext } from "../_shared/types"

export default function A4Entrega({ ctx }: { ctx: PreviewContext }) {
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
                  <div style={{ ...bloqueACSS(b.caja_tipo), background: e.color_tema, padding: 4 }}>VALE DE RECOJO</div>
                  <div style={{ ...bloqueACSS(b.caja_numero), padding: 4 }}>B001-00000327</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Info-grid del cliente y la entrega */}
        <table className="w-full mb-2" style={{ borderCollapse: "collapse", border: `${e.border_thin_px}px solid ${e.color_borde}` }}>
          <tbody>
            <Fila e={e} b={b} izq={["CLIENTE", "EFRAIN CASTILLO"]} der={["DOC", "74568367"]} />
            <Fila e={e} b={b} izq={["TELEFONO", "987654321"]} der={["DIRECCION", "AV. EJEMPLO 123"]} />
            <Fila e={e} b={b} izq={["F. ENTREGA", "19/05/2026 16:30"]} der={["ALMACEN", "ALMACEN PRINCIPAL"]} />
            <Fila e={e} b={b} izq={["TIPO ENTREGA", "Despacho a Domicilio"]} der={["DESPACHADOR", "BRYZA CARRION"]} />
            <Fila e={e} b={b} izq={["TIPO DESPACHO", "Programado"]} der={["ESTADO", "PENDIENTE"]} />
          </tbody>
        </table>

        {/* Tabla productos (sin precios) */}
        <table className="w-full" style={{ borderCollapse: "collapse", border: `${e.border_px}px solid ${e.color_borde}` }}>
          <thead>
            <tr style={{ background: e.color_tema }}>
              <th style={{ ...bloqueACSS(b.tabla_header), padding: e.pad_px, width: "10%" }}>CODIGO</th>
              <th style={{ ...bloqueACSS(b.tabla_header), padding: e.pad_px, width: "45%" }}>DESCRIPCION</th>
              <th style={{ ...bloqueACSS(b.tabla_header), padding: e.pad_px, width: "15%" }}>UNIDAD</th>
              <th style={{ ...bloqueACSS(b.tabla_header), padding: e.pad_px, width: "15%" }}>ENTREGADO</th>
              <th style={{ ...bloqueACSS(b.tabla_header), padding: e.pad_px, width: "15%" }}>PENDIENTE</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
              <td style={{ ...bloqueACSS(b.tabla_fila), padding: e.pad_px, textAlign: "center" }}>CT12M</td>
              <td style={{ ...bloqueACSS(b.tabla_fila), padding: e.pad_px }}>CINTA TEFLON 1/2" X 12 MTS - SWIFT</td>
              <td style={{ ...bloqueACSS(b.tabla_fila), padding: e.pad_px, textAlign: "center" }}>UNIDAD</td>
              <td style={{ ...bloqueACSS(b.tabla_fila), padding: e.pad_px, textAlign: "center" }}>10</td>
              <td style={{ ...bloqueACSS(b.tabla_fila), padding: e.pad_px, textAlign: "center" }}>0</td>
            </tr>
            <tr>
              <td colSpan={5} style={{ height: 120 }} />
            </tr>
          </tbody>
        </table>

        {/* Observaciones */}
        <div style={{ marginTop: 8, border: `${e.border_thin_px}px solid ${e.color_borde}`, borderRadius: 6, padding: 6 }}>
          <div style={{ ...bloqueACSS(b.obs_label), marginBottom: 4 }}>{m.label_observaciones}</div>
          <div style={bloqueACSS(b.obs_valor)}>- NINGUNA</div>
        </div>

        {/* Firmas */}
        <table className="w-full mt-3" style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "45%", textAlign: "center", paddingTop: 30, borderTop: `${e.border_thin_px}px solid ${e.color_borde}`, ...bloqueACSS(b.consulta_leyenda) }}>
                Firma del Despachador
              </td>
              <td style={{ width: "10%" }}></td>
              <td style={{ width: "45%", textAlign: "center", paddingTop: 30, borderTop: `${e.border_thin_px}px solid ${e.color_borde}`, ...bloqueACSS(b.consulta_leyenda) }}>
                Firma del Cliente
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
