"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

export default function TicketValeCompra({ ctx }: { ctx: PreviewContext }) {
  const { e, b, razonSocial, direccion, ruc, celular, fontFaceCss, containerStyle } = ctx

  const colorTema = e.color_tema || "#D97706"

  return (
    <>
      {fontFaceCss && <style>{fontFaceCss}</style>}
      <div className="bg-white p-4 border border-slate-200 rounded" style={containerStyle}>
        <div style={{ width: 280, margin: "0 auto" }}>
          {/* Borde exterior */}
          <div style={{ border: `2.5px solid ${colorTema}`, borderRadius: 8, padding: 4 }}>
            {/* Borde interior punteado */}
            <div style={{ border: `1px dashed ${colorTema}`, borderRadius: 6, padding: 8 }}>
              {/* Decorativo */}
              <div style={{ textAlign: "center", letterSpacing: 2, color: colorTema, margin: "2px 0" }}>
                - - - - - - - - - - -
              </div>

              {/* Empresa */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ ...bloqueACSS(b.empresa_razon), textAlign: "center", textTransform: "uppercase" }}>
                  {razonSocial}
                </div>
                <div style={{ ...bloqueACSS(b.empresa_direccion), textAlign: "center" }}>RUC: {ruc}</div>
                {direccion && (
                  <div style={{ ...bloqueACSS(b.empresa_direccion), textAlign: "center" }}>{direccion}</div>
                )}
                {celular && (
                  <div style={{ ...bloqueACSS(b.empresa_direccion), textAlign: "center" }}>Tel: {celular}</div>
                )}
              </div>

              {/* Banner tipo */}
              <div style={{
                background: colorTema,
                width: "100%",
                padding: "5px 8px",
                borderRadius: 4,
                textAlign: "center",
                margin: "5px 0",
              }}>
                <div style={{ fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 3, fontSize: 14 }}>
                  DESCUENTO
                </div>
                <div style={{ color: "#fff", marginTop: 1, fontSize: 9 }}>Vale de Compra</div>
              </div>

              {/* Código */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  background: "#FEF3C7",
                  padding: "4px 14px",
                  borderRadius: 4,
                  border: `1.5px solid ${colorTema}`,
                  textAlign: "center",
                  display: "inline-block",
                  margin: "3px 0",
                }}>
                  <div style={{ ...bloqueACSS(b.info_label), color: "#92400E" }}>Código</div>
                  <div style={{ ...bloqueACSS(b.caja_numero), fontSize: 14, letterSpacing: 4, color: "#92400E" }}>
                    VAL-2026-014
                  </div>
                </div>
              </div>

              {/* Nombre */}
              <div style={{ textAlign: "center", fontWeight: 700, margin: "3px 0 1px", textTransform: "uppercase", fontSize: 9 }}>
                PROMOCIÓN ANIVERSARIO
              </div>
              <div style={{ textAlign: "center", fontStyle: "italic", color: "#6B7280", marginBottom: 3, fontSize: 7 }}>
                Vale valido por 30 días desde su emisión
              </div>

              {/* HERO beneficio */}
              <div style={{
                width: "100%",
                border: `2.5px solid ${colorTema}`,
                borderRadius: 6,
                padding: "8px 6px",
                textAlign: "center",
                background: "#FEF3C7",
                margin: "4px 0",
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#92400E" }}>15%</div>
                <div style={{ color: "#92400E", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, fontSize: 9 }}>
                  Descuento en esta compra
                </div>
              </div>

              <div style={{ borderTop: `2px solid ${colorTema}`, margin: "4px auto", width: "70%" }} />

              {/* Info */}
              <div style={{ width: "100%", background: "#FEF3C7", borderRadius: 4, padding: 6, margin: "3px 0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {[
                      ["Precio mínimo", "S/ 100.00"],
                      ["Modalidad", "Por Cantidad Mínima"],
                      ["Desde", "01/05/2026"],
                      ["Hasta", "31/05/2026"],
                    ].map(([l, v]) => (
                      <tr key={l}>
                        <td style={{ ...bloqueACSS(b.info_label), color: "#92400E", padding: "1.5px 0" }}>{l}</td>
                        <td style={{ ...bloqueACSS(b.info_valor), textAlign: "right", fontWeight: 700, padding: "1.5px 0" }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Precios badges */}
              <div style={{ margin: "3px 0" }}>
                <div style={{ ...bloqueACSS(b.info_label), textAlign: "center", color: "#92400E" }}>Aplica a precios</div>
                <div style={{ textAlign: "center", margin: "3px 0" }}>
                  {["Público", "Especial"].map((p) => (
                    <span key={p} style={{
                      background: colorTema,
                      color: "#fff",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 3,
                      display: "inline-block",
                      margin: 1,
                      fontSize: 7,
                    }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: `1px dashed ${colorTema}`, margin: "4px 0" }} />

              {/* Condiciones */}
              <div style={{
                width: "100%",
                border: "1px solid #D1D5DB",
                borderRadius: 4,
                padding: 5,
                textAlign: "center",
                margin: "3px 0",
              }}>
                <div style={{ ...bloqueACSS(b.info_label), color: "#6B7280", marginBottom: 1 }}>Condiciones de uso</div>
                <div style={{ color: "#9CA3AF", fontSize: 6 }}>Válido únicamente en tienda</div>
                <div style={{ color: "#9CA3AF", fontSize: 6 }}>No acumulable con otras promociones</div>
                <div style={{ color: "#9CA3AF", fontSize: 6 }}>Sujeto a disponibilidad de stock</div>
              </div>

              {/* Decorativo */}
              <div style={{ textAlign: "center", letterSpacing: 2, color: colorTema, margin: "2px 0" }}>
                - - - - - - - - - - -
              </div>

              {/* Footer */}
              <div style={{ ...bloqueACSS(b.despedida_footer), marginTop: 2 }}>
                Generado el 25/05/2026 10:00
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
