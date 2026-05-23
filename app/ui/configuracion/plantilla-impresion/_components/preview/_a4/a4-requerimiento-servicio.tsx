"use client"

import { bloqueACSS } from "~/lib/api/plantilla-impresion"
import type { PreviewContext, EstiloResuelto } from "../_shared/types"
import type { BloquesResueltos } from "~/lib/api/plantilla-impresion"

interface InfoRowProps {
  b: BloquesResueltos
  pares: Array<[string, string]>
}

function InfoRow({ b, pares }: InfoRowProps) {
  return (
    <tr>
      {pares.flatMap(([label, valor], idx) => [
        <td
          key={`l-${idx}`}
          style={{
            ...bloqueACSS(b.info_label),
            width: "20%",
            padding: 2,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {label}:
        </td>,
        <td
          key={`v-${idx}`}
          style={{ ...bloqueACSS(b.info_valor), width: "30%", padding: 2 }}
        >
          {valor}
        </td>,
      ])}
    </tr>
  )
}

function SectionTitle({ e, color, children }: { e: EstiloResuelto; color: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: e.font_lg_pt,
        fontWeight: 700,
        textTransform: "uppercase",
        marginBottom: 6,
        paddingBottom: 4,
        borderBottom: `${e.border_thin_px}px solid ${color}`,
      }}
    >
      {children}
    </div>
  )
}

export default function A4RequerimientoServicio({ ctx }: { ctx: PreviewContext }) {
  const { e, m, b, razonSocial, direccion, email, celular, logoUrl, fontFaceCss, containerStyle, numeroDocumento } = ctx

  // Servicio: usa verde como tema/borde. El editor sigue siendo configurable;
  // si el usuario cambia el color, se usa el suyo. Solo si el tema es el
  // amarillo por defecto (mismo que compra) caemos al verde para diferenciar
  // visualmente el preview, coherente con el blade que es verde fijo.
  const DEFAULT_TEMA = "#fadc06"
  const esTemaDefault = e.color_tema?.toLowerCase() === DEFAULT_TEMA
  const tema = esTemaDefault ? "#059669" : e.color_tema
  const borde = esTemaDefault ? "#059669" : e.color_borde
  const fondoSuave = esTemaDefault ? "#ecfdf5" : "#fafafa"
  const headerTexto = esTemaDefault ? "white" : undefined

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
              <td style={{ verticalAlign: "middle", textAlign: "center", lineHeight: 1.4 }}>
                <div style={{ ...bloqueACSS(b.empresa_razon), marginBottom: 2 }}>{razonSocial}</div>
                <div style={bloqueACSS(b.empresa_direccion)}>
                  {direccion && <div>Dirección: {direccion}</div>}
                  {celular && <div>Teléfono: {celular}</div>}
                  {email && <div>Email: {email}</div>}
                </div>
              </td>
              <td style={{ width: "30%", verticalAlign: "middle" }}>
                <div style={{ border: `${e.border_px}px solid ${tema}`, borderRadius: 8, overflow: "hidden", background: fondoSuave }}>
                  <div style={{ ...bloqueACSS(b.caja_tipo), background: tema, color: headerTexto, padding: "6px 8px", textAlign: "center" }}>
                    ORDEN DE SERVICIO
                  </div>
                  <div style={{ ...bloqueACSS(b.caja_numero), padding: "6px 8px", textAlign: "center" }}>
                    {numeroDocumento}
                  </div>
                  <div style={{ fontSize: e.font_sm_pt, padding: "0 8px 6px", textAlign: "center" }}>
                    LOG-F-03
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Información General */}
        <SectionTitle e={e} color={tema}>Información General</SectionTitle>
        <table className="w-full mb-2" style={{ borderCollapse: "collapse", border: `${e.border_thin_px}px solid ${tema}`, borderRadius: 4, background: fondoSuave, padding: "6px 10px" }}>
          <tbody>
            <InfoRow b={b} pares={[["Número", numeroDocumento], ["Área", "MANTENIMIENTO"]]} />
            <InfoRow b={b} pares={[["Fecha", "lunes, 19 de mayo de 2026"], ["Prioridad", "MEDIA"]]} />
            <InfoRow b={b} pares={[["Tipo", "Orden de Servicio"], ["Estado", "PENDIENTE"]]} />
          </tbody>
        </table>

        {/* Solicitante y Vehículo */}
        <SectionTitle e={e} color={tema}>Solicitante y Vehículo</SectionTitle>
        <table className="w-full mb-2" style={{ borderCollapse: "collapse", border: `${e.border_thin_px}px solid ${tema}`, borderRadius: 4, background: fondoSuave, padding: "6px 10px" }}>
          <tbody>
            <InfoRow b={b} pares={[["Solicitante", "BRYZA CARRION MORALES"], ["Vehículo", "CAMIONETA HILUX (ABC-123)"]]} />
            <tr>
              <td style={{ ...bloqueACSS(b.info_label), width: "20%", padding: 2, textTransform: "uppercase", fontWeight: 700 }}>
                Afecta Calendario:
              </td>
              <td colSpan={3} style={{ ...bloqueACSS(b.info_valor), padding: 2 }}>Sí</td>
            </tr>
          </tbody>
        </table>

        {/* Servicios Requeridos */}
        <SectionTitle e={e} color={tema}>Servicios Requeridos</SectionTitle>
        <table className="w-full mb-2" style={{ borderCollapse: "collapse", border: `${e.border_px}px solid ${tema}`, borderRadius: 4, overflow: "hidden" }}>
          <thead>
            <tr style={{ background: tema, color: headerTexto }}>
              {[
                { label: "TIPO", w: "15%", align: "center" as const },
                { label: "DESCRIPCIÓN", w: "25%", align: "left" as const },
                { label: "LUGAR", w: "15%", align: "left" as const },
                { label: "HORARIO", w: "12%", align: "center" as const },
                { label: "DURACIÓN", w: "13%", align: "center" as const },
                { label: "PRESUPUESTO", w: "20%", align: "right" as const },
              ].map((c) => (
                <th key={c.label} style={{ ...bloqueACSS(b.tabla_header), padding: 4, width: c.w, textAlign: c.align }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { tipo: "MANT.", desc: "Cambio de aceite y filtros", lugar: "Taller principal", horario: "08:00 – 12:00", dur: "4 h", pres: "S/ 180.00" },
              { tipo: "LAVADO", desc: "Lavado integral cabina y caja", lugar: "Patio", horario: "—", dur: "2 día(s)", pres: "S/ 90.00" },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: `${e.border_thin_px}px solid ${tema}`, background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                <td style={{ ...bloqueACSS(b.tabla_fila), padding: "3px 4px", textAlign: "center", fontWeight: 700, color: tema }}>{row.tipo}</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), padding: "3px 4px" }}>{row.desc}</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), padding: "3px 4px" }}>{row.lugar}</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), padding: "3px 4px", textAlign: "center" }}>{row.horario}</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), padding: "3px 4px", textAlign: "center" }}>{row.dur}</td>
                <td style={{ ...bloqueACSS(b.tabla_fila), padding: "3px 4px", textAlign: "right", fontWeight: 700, color: tema }}>{row.pres}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Observaciones */}
        <table className="w-full mb-2" style={{ borderCollapse: "collapse", border: `${e.border_thin_px}px solid ${tema}`, borderRadius: 4, background: fondoSuave, padding: "8px 10px" }}>
          <tbody>
            <tr>
              <td>
                <span style={{ ...bloqueACSS(b.obs_label), fontWeight: 700 }}>{m.label_observaciones}:</span>
                <br />
                <span style={bloqueACSS(b.obs_valor)}>{m.observaciones_default}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Firmas */}
        <table className="w-full" style={{ borderCollapse: "collapse", marginTop: 24 }}>
          <tbody>
            <tr>
              {["Responsable del Área", "Solicitante", "Supervisor"].map((rol) => (
                <td key={rol} style={{ width: "33%", textAlign: "center", verticalAlign: "bottom" }}>
                  <div style={{ borderTop: "1px solid #000", marginTop: 28, marginBottom: 6 }} />
                  <div style={{ fontSize: e.font_sm_pt, fontWeight: 700, textTransform: "uppercase" }}>{rol}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Aprobaciones */}
        <table className="w-full" style={{ borderCollapse: "collapse", marginTop: 16, borderTop: `${e.border_px}px solid ${tema}`, paddingTop: 10 }}>
          <tbody>
            <tr>
              {[
                { titulo: "Elaborado Por", valor: "Área de Servicios" },
                { titulo: "Revisado Por", valor: "Departamento de Logística y Operaciones" },
                { titulo: "Aprobado por", valor: "Gerencia General" },
              ].map((col, idx) => (
                <td
                  key={col.titulo}
                  style={{
                    width: "33%",
                    textAlign: "center",
                    fontSize: e.font_sm_pt,
                    verticalAlign: "top",
                    borderLeft: idx === 0 ? "none" : `${e.border_thin_px}px solid ${borde}`,
                    paddingLeft: idx === 0 ? 0 : 8,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 3, textTransform: "uppercase" }}>{col.titulo}:</div>
                  <div>{col.valor}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
