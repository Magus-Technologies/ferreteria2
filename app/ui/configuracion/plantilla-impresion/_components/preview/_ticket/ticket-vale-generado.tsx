"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext } from "../_shared/types"

export default function TicketValeGenerado({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, razonSocial, logoUrl, fontFaceCss, containerStyle } = ctx

  return (
    <>
      {fontFaceCss && <style>{fontFaceCss}</style>}
      <div className="bg-white p-4 border border-slate-200 rounded" style={containerStyle}>
        <div style={{ width: 280, margin: "0 auto" }}>
          {/* Header empresa */}
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            {logoUrl && !m.ocultar_logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="logo" style={{ maxWidth: "100%", height: 60, objectFit: "contain" }} />
            )}
            <div style={{ ...bloqueACSS(b.empresa_razon), marginTop: 2 }}>{razonSocial}</div>
          </div>

          {/* Vale card */}
          <div style={{
            border: `${e.border_px - 0.5}px solid ${e.color_borde}`,
            borderRadius: 4,
            padding: 6,
            marginTop: 4,
          }}>
            <div style={{
              ...bloqueACSS(b.caja_tipo),
              background: e.color_tema,
              color: "#fff",
              padding: 4,
              marginBottom: 4,
              borderRadius: 2,
              textAlign: "center",
            }}>
              VALE DE COMPRA - DESCUENTO %
            </div>

            <div style={{ textAlign: "center", fontWeight: 700, marginBottom: 3, fontSize: 9 }}>
              Promoción Aniversario
            </div>

            <div style={{
              ...bloqueACSS(b.caja_numero),
              textAlign: "center",
              fontWeight: 700,
              border: `${e.border_thin_px}px solid ${e.color_borde}`,
              padding: 3,
              marginBottom: 4,
              borderRadius: 2,
            }}>
              15% DESCUENTO
            </div>

            {/* Código texto */}
            <div style={{
              textAlign: "center",
              background: "#f0f0f0",
              padding: 4,
              marginBottom: 4,
              borderRadius: 2,
            }}>
              <div style={bloqueACSS(b.info_label)}>CÓDIGO:</div>
              <div style={{ ...bloqueACSS(b.caja_numero), fontSize: 13, letterSpacing: 1 }}>
                VAL-2026-014
              </div>
            </div>

            {/* Barcode placeholder */}
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{
                width: "90%",
                height: 40,
                margin: "0 auto",
                background: "repeating-linear-gradient(90deg, #000 0 2px, #fff 2px 4px, #000 4px 5px, #fff 5px 7px)",
              }} />
            </div>

            {/* QR placeholder */}
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{
                width: 100,
                height: 100,
                margin: "0 auto",
                background: "#000",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute",
                  inset: 8,
                  background: "#fff",
                  display: "grid",
                  gridTemplateColumns: "repeat(8, 1fr)",
                  gap: 1,
                }}>
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} style={{ background: Math.random() > 0.5 ? "#000" : "#fff" }} />
                  ))}
                </div>
              </div>
              <div style={{ color: "#666", fontSize: 6 }}>Escanea para canjear</div>
            </div>

            <div style={{ ...bloqueACSS(b.info_valor), textAlign: "center", marginBottom: 2 }}>
              Válido hasta: 30/06/2026
            </div>
            <div style={{
              textAlign: "center",
              color: "#666",
              borderTop: `${e.border_thin_px}px dashed #999`,
              paddingTop: 3,
              marginTop: 2,
              fontSize: 6,
            }}>
              Boleta: B001-00000327 | 19/05/2026
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
