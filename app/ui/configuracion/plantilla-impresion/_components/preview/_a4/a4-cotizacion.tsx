"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import Fila from "../_shared/fila"
import FilaProducto from "../_shared/fila-producto"
import type { PreviewContext } from "../_shared/types"

export default function A4Cotizacion({ ctx }: { ctx: PreviewContext }) {
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
                  <div style={{ ...bloqueACSS(b.caja_tipo), background: e.color_tema, padding: 4 }}>COTIZACION</div>
                  <div style={{ ...bloqueACSS(b.caja_numero), padding: 4 }}>COT-00000123</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Info-grid */}
        <table className="w-full mb-2" style={{ borderCollapse: "collapse", border: `${e.border_thin_px}px solid ${e.color_borde}` }}>
          <tbody>
            <Fila e={e} b={b} izq={["Cliente", "EFRAIN ALEJANDRO CASTILLO CHIGNE"]} der={["F. Emision", "19/05/2026"]} />
            <Fila e={e} b={b} izq={["Direccion", ""]} der={["Hora", "16:30:04"]} />
            <Fila e={e} b={b} izq={["RUC / DNI", "74568367"]} der={["F. Vencimiento", "26/05/2026"]} />
            <Fila e={e} b={b} izq={["Vendedor", "BRYZA LILIANA CARRION MORALES"]} der={["N Guia", ""]} />
            <Fila e={e} b={b} izq={["Forma Pago", "CREDITO 7 DIAS"]} der={["Moneda", "SOL"]} />
            <Fila e={e} b={b} izq={["Cajero", "BRYZA LILIANA CARRION MORALES"]} der={["Orden de Compra", ""]} />
          </tbody>
        </table>

        {/* Tabla productos */}
        <table className="w-full" style={{ borderCollapse: "collapse", border: `${e.border_px}px solid ${e.color_borde}` }}>
          <thead>
            <tr style={{ background: e.color_tema }}>
              {[
                { label: "ITEM", w: "5%" },
                { label: "UBI.", w: "5%" },
                { label: "CODIGO", w: "10%" },
                { label: "CANT.", w: "7%" },
                { label: "UNIDAD", w: "8%" },
                { label: "DESCRIPCION", w: "40%" },
                { label: "P. UNI.", w: "10%" },
                { label: "DESC.", w: "7%" },
                { label: "IMPORTE", w: "8%" },
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
              cells={["1", "A1", "CT12M", "10", "UNIDAD", 'CINTA TEFLON 1/2" X 12 MTS - SWIFT', "2.00", "0.00", "20.00"]}
            />
            <tr>
              <td colSpan={9} style={{ height: 180, borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }} />
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
              <td style={{ ...bloqueACSS(b.son), padding: e.pad_px + 2 }}>SON: VEINTE CON 0/100 SOL.</td>
            </tr>
          </tbody>
        </table>

        {/* Observaciones + Totales (sin IGV) */}
        <table className="w-full mt-2" style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "65%", padding: 8, verticalAlign: "middle" }}>
                <div style={{ border: `${e.border_px}px solid ${e.color_borde}`, borderRadius: 6, padding: 6 }}>
                  <div style={{ ...bloqueACSS(b.obs_label), marginBottom: 4 }}>{m.label_observaciones}</div>
                  <div style={bloqueACSS(b.obs_valor)}>
                    - LA MERCADERIA VIAJA POR CUENTA Y RIESGO DEL CLIENTE.<br />
                    - UNA VEZ RECIBIDA LA MERCADERIA NO HAY LUGAR A RECLAMO.<br />
                    - REPARTO MINIMO 1 DIA DE ANTICIPACION.
                  </div>
                </div>
              </td>
              <td style={{ width: "35%", verticalAlign: "top" }}>
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    {[["SUBTOTAL", "20.00"], ["T. DESCUENTO", "0.00"], ["TOTAL", "20.00"]].map(([label, valor]) => (
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
        {(!m.ocultar_despedida || !m.ocultar_canjear) && (
          <div className="mt-3" style={{ textAlign: "center" }}>
            {!m.ocultar_despedida && (
              <div style={bloqueACSS(b.despedida_footer)}>
                Sin otro particular, esperando su pronta respuesta.{" "}
                {plantilla.despedida_activo && plantilla.mensaje_despedida ? (
                  <span dangerouslySetInnerHTML={{ __html: plantilla.mensaje_despedida }} />
                ) : (
                  "GRACIAS POR SU PREFERENCIA! DIOS LES BENDIGA!"
                )}
              </div>
            )}
            {!m.ocultar_canjear && (
              <div style={{ ...bloqueACSS(b.despedida_footer), marginBottom: 10 }}>- CANJEAR POR BOLETA O FACTURA -</div>
            )}
          </div>
        )}

        {/* Cuentas bancarias */}
        {!m.ocultar_cuentas_bancarias && (
          <div style={{ textAlign: "right", marginTop: 10 }}>
            <div style={{ ...bloqueACSS(b.obs_label), textAlign: "left", marginBottom: 5, width: "55%", display: "inline-block" }}>
              CUENTAS:
            </div>
            <table style={{ width: "55%", marginLeft: "auto", border: `${e.border_px}px solid ${e.color_tema}`, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}`, background: e.color_tema }}>
                  {["ENTIDAD", "CUENTA", "NUMERO", "CCI"].map((label, i, arr) => (
                    <th key={label} style={{ ...bloqueACSS(b.tabla_header), padding: 2, borderRight: i === arr.length - 1 ? "none" : `${e.border_thin_px}px solid ${e.color_borde}` }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["BCP", "AHORROS", "57099829303065", "00257000998279306504"],
                  ["BBVA", "AHORROS", "57099829303065", "00257000998279306504"],
                  ["SCOTIABANK", "AHORROS", "7117529613", "00940830711752961369"],
                  ["INTERBANK", "AHORROS", "6003004488177", "00360000600344881774"],
                ].map((fila, i) => (
                  <tr key={i} style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                    {fila.map((celda, j, arr) => (
                      <td key={j} style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center", padding: 2, borderRight: j === arr.length - 1 ? "none" : `${e.border_thin_px}px solid ${e.color_borde}` }}>
                        {celda}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
