"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "~/lib/auth-context";
import { empresaApi } from "~/lib/api/empresa";
import { QueryKeys } from "~/app/_lib/queryKeys";
import {
  bloqueACSS,
  resolverEstilos,
  resolverBloques,
  type PlantillaImpresion,
  type BloquesResueltos,
} from "~/lib/api/plantilla-impresion";

interface Props {
  plantilla: PlantillaImpresion;
  formato?: string;
  comprobante?: string;
}

export default function PreviewPlantillaImpresion({ plantilla, formato, comprobante }: Props) {
  const { user } = useAuth();
  const empresaId = user?.empresa?.id;

  const { data } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, empresaId],
    queryFn: () => empresaApi.getById(empresaId!),
    enabled: !!empresaId,
  });

  const empresa = data?.data?.data;
  const razonSocial = empresa?.razon_social ?? "";
  const direccion = empresa?.direccion ?? "";
  const email = empresa?.email ?? "";
  const ruc = empresa?.ruc ?? "";
  const celular = empresa?.celular ?? "";
  const logoUrl = empresa?.logo_url ?? null;

  const e = resolverEstilos(plantilla.estilos);
  const m = plantilla.mensajes_extra;
  const b: BloquesResueltos = resolverBloques(plantilla.estilos_secciones, e);

  const containerStyle: React.CSSProperties = {
    fontFamily: `"${e.fuente}", Arial, sans-serif`,
    fontSize: `${e.font_pt}pt`,
    color: e.color_texto,
    lineHeight: 1.3,
  };

  if (formato === "Ticket") {
    const sep = (
      <div style={{ borderTop: `${e.border_thin_px}px dashed ${e.color_borde}`, margin: "6px 0" }} />
    );

    const labelStyle: React.CSSProperties = {
      ...bloqueACSS(b.info_label),
      width: "32%",
      verticalAlign: "top",
      paddingRight: 4,
    };
    const valorStyle: React.CSSProperties = {
      ...bloqueACSS(b.info_valor),
      verticalAlign: "top",
    };

    const productos: Array<{ desc: string; cant: string; uni: string; pu: string; subt: string }> = [
      { desc: 'CINTA TEFLON 1/2" X 12 MTS - SWIFT', cant: "10", uni: "UNIDAD", pu: "2.00", subt: "20.00" },
      { desc: 'CINTA TEFLON 3/4" X 10 MTS - SWIFT', cant: "10", uni: "UNIDAD", pu: "2.50", subt: "25.00" },
      { desc: 'CINTA TEFLON AMARILLA GAS 1/2" - MAGNUM', cant: "10", uni: "UNIDAD", pu: "2.00", subt: "20.00" },
    ];

    if (comprobante === "cotizacion") {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded" style={containerStyle}>
          <div style={{ width: 280, margin: "0 auto" }}>
            {/* Empresa */}
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="logo" style={{ maxWidth: "100%", height: 60, objectFit: "contain" }} />
              )}
              <div style={bloqueACSS(b.empresa_razon)}>{razonSocial}</div>
              <div style={bloqueACSS(b.caja_ruc)}>R.U.C. {ruc}</div>
              <div style={bloqueACSS(b.empresa_direccion)}>{direccion}</div>
              {celular && (
                <div style={bloqueACSS(b.empresa_direccion)}>
                  <span style={{ fontWeight: 700 }}>Cel:</span> {celular}
                </div>
              )}
              {email && (
                <div style={bloqueACSS(b.empresa_direccion)}>
                  <span style={{ fontWeight: 700 }}>Email:</span> {email}
                </div>
              )}
            </div>

            {sep}

            {/* Tipo y número */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ ...bloqueACSS(b.caja_tipo), textAlign: "center" }}>PROFORMA ELECTRÓNICA</div>
              <div style={{ ...bloqueACSS(b.caja_numero), textAlign: "center" }}>COT-00000123</div>
            </div>

            {sep}

            {/* Info cliente */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
              <tbody>
                <tr>
                  <td style={labelStyle}>
                    F. EMISIÓN: <span style={bloqueACSS(b.info_valor)}>19/05/2026</span>
                  </td>
                  <td style={valorStyle}>
                    <span style={bloqueACSS(b.info_label)}>F. VENC.:</span> 26/05/2026
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>DNI:</td>
                  <td style={valorStyle}>74568367</td>
                </tr>
                <tr>
                  <td style={labelStyle}>CLIENTE:</td>
                  <td style={valorStyle}>EFRAIN ALEJANDRO CASTILLO CHIGNE</td>
                </tr>
                <tr>
                  <td style={labelStyle}>VENDEDOR:</td>
                  <td style={valorStyle}>BRYZA LILIANA CARRION MORALES</td>
                </tr>
              </tbody>
            </table>

            {sep}

            {/* Tabla productos */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
              <thead>
                <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                  <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "55%" }}>Descripción</th>
                  <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "15%" }}>Cant.</th>
                  <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "15%" }}>P.U.</th>
                  <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "15%" }}>Subt.</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                    <td style={bloqueACSS(b.tabla_fila)}>{p.desc}</td>
                    <td style={bloqueACSS(b.tabla_fila)}>{p.cant}</td>
                    <td style={bloqueACSS(b.tabla_fila)}>{p.pu}</td>
                    <td style={bloqueACSS(b.tabla_fila)}>{p.subt}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales (sin IGV) */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
              <tbody>
                {[
                  ["SUBTOTAL:", "S/ 65.00"],
                  ["T. DESCUENTO:", "S/ 0.00"],
                  ["TOTAL:", "S/ 65.00"],
                ].map(([label, valor], i, arr) => (
                  <tr key={label} style={i < arr.length - 1 ? { borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` } : { background: "#f0f0f0" }}>
                    <td style={bloqueACSS(b.total_label)}>{label}</td>
                    <td style={bloqueACSS(b.total_valor)}>{valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ ...bloqueACSS(b.son), marginBottom: 4 }}>SESENTA Y CINCO CON 0/100 SOLES</div>

            {/* Observaciones */}
            <div style={{ marginBottom: 4 }}>
              <div style={bloqueACSS(b.obs_label)}>{m.label_observaciones}</div>
              <div style={bloqueACSS(b.obs_valor)}>
                - LA MERCADERIA VIAJA POR CUENTA Y RIESGO DEL CLIENTE.
              </div>
            </div>

            {sep}

            {/* Despedida */}
            <div style={{ textAlign: "center" }}>
              {plantilla.despedida_activo && plantilla.mensaje_despedida ? (
                <div style={bloqueACSS(b.despedida_footer)} dangerouslySetInnerHTML={{ __html: plantilla.mensaje_despedida }} />
              ) : (
                <div style={bloqueACSS(b.despedida_footer)}>GRACIAS POR SU PREFERENCIA!</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-4 border border-slate-200 rounded" style={containerStyle}>
        <div style={{ width: 280, margin: "0 auto" }}>
          {/* Empresa */}
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="logo" style={{ maxWidth: "100%", height: 60, objectFit: "contain" }} />
            )}
            <div style={bloqueACSS(b.empresa_razon)}>{razonSocial}</div>
            <div style={bloqueACSS(b.caja_ruc)}>R.U.C. {ruc}</div>
            <div style={bloqueACSS(b.empresa_direccion)}>{direccion}</div>
          </div>

          {sep}

          {/* Tipo y número de comprobante */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ ...bloqueACSS(b.caja_tipo), textAlign: "center" }}>BOLETA DE VENTA</div>
            <div style={{ ...bloqueACSS(b.caja_numero), textAlign: "center" }}>B001-00000327</div>
          </div>

          {sep}

          {/* Info venta (Forma pago, F. Emisión/Hora, N° Guía, Vendedor) */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>FORMA PAGO:</td>
                <td style={valorStyle}>co</td>
              </tr>
              <tr>
                <td style={labelStyle}>
                  F. EMISIÓN: <span style={bloqueACSS(b.info_valor)}>19/05/2026</span>
                </td>
                <td style={valorStyle}>
                  <span style={bloqueACSS(b.info_label)}>HORA:</span> 21:29:04
                </td>
              </tr>
              <tr>
                <td style={labelStyle}>N° GUÍA:</td>
                <td style={valorStyle}></td>
              </tr>
              <tr>
                <td style={labelStyle}>VENDEDOR:</td>
                <td style={valorStyle}>BRYZA LILIANA CARRION MORALES</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Info cliente (DNI, Cliente) */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={labelStyle}>DNI:</td>
                <td style={valorStyle}>74568367</td>
              </tr>
              <tr>
                <td style={labelStyle}>CLIENTE:</td>
                <td style={valorStyle}>EFRAIN ALEJANDRO CASTILLO CHIGNE</td>
              </tr>
            </tbody>
          </table>

          {sep}

          {/* Métodos de pago */}
          <div style={{ marginBottom: 6 }}>
            <div style={bloqueACSS(b.info_label)}>Métodos de Pago:</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={bloqueACSS(b.tabla_fila)}>efectivo</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>65.00</td>
                </tr>
                <tr>
                  <td style={{ ...bloqueACSS(b.tabla_fila), fontWeight: 700 }}>TOTAL</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), fontWeight: 700, textAlign: "right" }}>65.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {sep}

          {/* Tabla productos */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <thead>
              <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "left", width: "40%" }}>Descripción</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", width: "10%" }}>Cant.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "center", width: "15%" }}>Unid.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right", width: "15%" }}>P.U.</th>
                <th style={{ ...bloqueACSS(b.tabla_header), textAlign: "right", width: "20%" }}>Subt.</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p, i) => (
                <tr key={i} style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
                  <td style={bloqueACSS(b.tabla_fila)}>{p.desc}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>{p.cant}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "center" }}>{p.uni}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>{p.pu}</td>
                  <td style={{ ...bloqueACSS(b.tabla_fila), textAlign: "right" }}>{p.subt}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
            <tbody>
              {[
                ["OP.GRAVADA", "55.08"],
                ["IGV 18%", "9.92"],
                ["TOTAL", "65.00"],
              ].map(([label, valor], i, arr) => (
                <tr key={label} style={i < arr.length - 1 ? { borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` } : undefined}>
                  <td style={bloqueACSS(b.total_label)}>{label}</td>
                  <td style={bloqueACSS(b.total_valor)}>{valor}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* SON en letras */}
          <div style={{ ...bloqueACSS(b.son), marginBottom: 4 }}>SESENTA Y CINCO CON 0/100 SOLES</div>

          {/* Observaciones */}
          <div style={{ marginBottom: 4 }}>
            <div style={bloqueACSS(b.obs_label)}>{m.label_observaciones}</div>
            <div style={bloqueACSS(b.obs_valor)}>{m.observaciones_default}</div>
          </div>

          {sep}

          {/* Consulta */}
          <div style={{ textAlign: "center" }}>
            <div style={bloqueACSS(b.consulta_leyenda)}>{m.leyenda_consulta}</div>
            <div style={bloqueACSS(b.consulta_url)}>http://localhost:3000/consulta</div>
          </div>

          {sep}

          {/* Despedida */}
          <div style={{ textAlign: "center" }}>
            {plantilla.despedida_activo && plantilla.mensaje_despedida ? (
              <div style={bloqueACSS(b.despedida_footer)} dangerouslySetInnerHTML={{ __html: plantilla.mensaje_despedida }} />
            ) : (
              <div style={bloqueACSS(b.despedida_footer)}>GRACIAS POR SU PREFERENCIA!</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (comprobante === "cotizacion") {
    return (
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
                  <div style={{ ...bloqueACSS(b.caja_tipo), background: e.color_tema, padding: 4 }}>PROFORMA</div>
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

        {/* Texto intro */}
        <div style={{ ...bloqueACSS(b.obs_valor), marginBottom: 6 }}>
          De nuestra consideracion: Por medio de la presente es grato saludarlos y a la vez cotizarle los siguientes productos:
        </div>

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
                <th key={c.label} style={{ ...bloqueACSS(b.tabla_header), padding: e.pad_px, width: c.w, borderRight: i === arr.length - 1 ? "none" : `${e.border_thin_px}px solid ${e.color_borde}` }}>
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
        <table className="w-full" style={{ borderCollapse: "collapse", borderLeft: `${e.border_px}px solid ${e.color_borde}`, borderRight: `${e.border_px}px solid ${e.color_borde}`, borderBottom: `${e.border_px}px solid ${e.color_borde}` }}>
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
        <div className="mt-3" style={{ textAlign: "center" }}>
          <div style={bloqueACSS(b.obs_valor)}>
            Sin otro particular, esperando su pronta respuesta.{" "}
            <span style={{ fontWeight: 700 }}>
              {plantilla.despedida_activo && plantilla.mensaje_despedida ? (
                <span dangerouslySetInnerHTML={{ __html: plantilla.mensaje_despedida }} />
              ) : (
                "GRACIAS POR SU PREFERENCIA! DIOS LES BENDIGA!"
              )}
            </span>
          </div>
          <div style={{ ...bloqueACSS(b.obs_valor), marginBottom: 10 }}>- CANJEAR POR BOLETA O FACTURA -</div>
        </div>

        {/* Cuentas bancarias */}
        <div style={{ textAlign: "right", marginTop: 10 }}>
          <div style={{ fontSize: "9pt", fontWeight: 700, textAlign: "left", marginBottom: 5, width: "55%", display: "inline-block" }}>
            CUENTAS:
          </div>
          <table style={{ width: "55%", marginLeft: "auto", border: `${e.border_px}px solid ${e.color_tema}`, borderCollapse: "collapse", fontSize: "7pt" }}>
            <thead>
              <tr style={{ fontWeight: 700, borderBottom: `${e.border_thin_px}px solid ${e.color_tema}`, background: e.color_tema }}>
                <td style={{ padding: 2, textAlign: "center", borderRight: `${e.border_thin_px}px solid ${e.color_tema}` }}>ENTIDAD</td>
                <td style={{ padding: 2, textAlign: "center", borderRight: `${e.border_thin_px}px solid ${e.color_tema}` }}>CUENTA</td>
                <td style={{ padding: 2, textAlign: "center", borderRight: `${e.border_thin_px}px solid ${e.color_tema}` }}>NUMERO</td>
                <td style={{ padding: 2, textAlign: "center" }}>CCI</td>
              </tr>
            </thead>
            <tbody>
              {[
                ["BCP", "AHORROS", "57099829303065", "00257000998279306504"],
                ["BBVA", "AHORROS", "57099829303065", "00257000998279306504"],
                ["SCOTIABANK", "AHORROS", "7117529613", "00940830711752961369"],
                ["INTERBANK", "AHORROS", "6003004488177", "00360000600344881774"],
              ].map((fila, i) => (
                <tr key={i} style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_tema}` }}>
                  {fila.map((celda, j) => (
                    <td key={j} style={{ padding: 2, textAlign: "center", borderRight: j === fila.length - 1 ? "none" : `${e.border_thin_px}px solid ${e.color_tema}` }}>
                      {celda}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
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
                {email && <div>Email: {email}</div>}
              </div>
            </td>
            <td style={{ width: "30%", verticalAlign: "middle" }}>
              <div style={{ border: `${e.border_px}px solid ${e.color_tema}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ ...bloqueACSS(b.caja_ruc), padding: 4 }}>R.U.C. {ruc}</div>
                <div style={{ ...bloqueACSS(b.caja_tipo), background: e.color_tema, padding: 4 }}>BOLETA DE VENTA</div>
                <div style={{ ...bloqueACSS(b.caja_numero), padding: 4 }}>B001-00000325</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Info-grid */}
      <table className="w-full mb-2" style={{ borderCollapse: "collapse", border: `${e.border_thin_px}px solid ${e.color_borde}` }}>
        <tbody>
          <Fila e={e} b={b} izq={["Cliente", "CLIENTE VARIOS"]} der={["F. Emision", "19/05/2026"]} />
          <Fila e={e} b={b} izq={["Direccion", ""]} der={["Hora", "16:30:04"]} />
          <Fila e={e} b={b} izq={["RUC / DNI", "99999999"]} der={["Tipo Doc.", "03"]} />
          <Fila e={e} b={b} izq={["Vendedor", "BRYZA LILIANA CARRION MORALES"]} der={["Almacen", "ALMACEN PRINCIPAL"]} />
          <Fila e={e} b={b} izq={["Forma Pago", "co"]} der={["Moneda", "SOLES"]} />
          <Fila e={e} b={b} izq={["Cajero", "BRYZA LILIANA CARRION MORALES"]} der={["Estado", "cr"]} />
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
              <th key={c.label} style={{ ...bloqueACSS(b.tabla_header), padding: e.pad_px, width: c.w, borderRight: i === arr.length - 1 ? "none" : `${e.border_thin_px}px solid ${e.color_borde}` }}>
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
      <table className="w-full" style={{ borderCollapse: "collapse", borderLeft: `${e.border_px}px solid ${e.color_borde}`, borderRight: `${e.border_px}px solid ${e.color_borde}`, borderBottom: `${e.border_px}px solid ${e.color_borde}` }}>
        <tbody>
          <tr>
            <td style={{ ...bloqueACSS(b.son), padding: e.pad_px + 2 }}>SON: VEINTE CON 0/100 SOLES.</td>
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
                <div style={bloqueACSS(b.obs_valor)}>{m.observaciones_default}</div>
              </div>
            </td>
            <td style={{ width: "35%", verticalAlign: "top" }}>
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <tbody>
                  {[["SUBTOTAL", "16.95"], ["IGV (18%)", "3.05"], ["TOTAL", "20.00"]].map(([label, valor]) => (
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

      {/* Footer */}
      <div className="mt-3" style={{ textAlign: "center" }}>
        <table style={{ margin: "0 auto", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: "middle", paddingRight: 12 }}>
                <div style={{ width: 60, height: 60, border: "1px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, color: "#999" }}>
                  QR
                </div>
              </td>
              <td style={{ verticalAlign: "middle" }}>
                <div style={{ borderRadius: 10, padding: 10, maxWidth: 420, margin: "0 auto" }}>
                  <div style={{ ...bloqueACSS(b.consulta_leyenda), marginBottom: 4 }}>{m.leyenda_representacion}</div>
                  {plantilla.despedida_activo && plantilla.mensaje_despedida ? (
                    <div style={bloqueACSS(b.despedida_footer)} dangerouslySetInnerHTML={{ __html: plantilla.mensaje_despedida }} />
                  ) : (
                    <div style={bloqueACSS(b.despedida_footer)}>GRACIAS POR SU PREFERENCIA!</div>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <div style={bloqueACSS(b.consulta_leyenda)}>{m.leyenda_consulta}</div>
                    <div style={bloqueACSS(b.consulta_url)}>http://localhost:3000/consulta</div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Est = ReturnType<typeof resolverEstilos>;

function Fila({
  e,
  b,
  izq,
  der,
}: {
  e: Est;
  b: BloquesResueltos;
  izq: [string, string];
  der: [string, string];
}) {
  const labelStyle = (first: boolean): React.CSSProperties => ({
    ...bloqueACSS(b.info_label),
    width: first ? "12%" : "15%",
    padding: e.pad_px,
  });
  const valorStyle = (first: boolean): React.CSSProperties => ({
    ...bloqueACSS(b.info_valor),
    width: first ? "38%" : "35%",
    padding: e.pad_px,
  });
  return (
    <tr>
      <td style={labelStyle(true)}>{izq[0]}</td>
      <td style={valorStyle(true)}>: {izq[1]}</td>
      <td style={labelStyle(false)}>{der[0]}</td>
      <td style={valorStyle(false)}>: {der[1]}</td>
    </tr>
  );
}

function FilaProducto({
  e,
  b,
  cells,
}: {
  e: Est;
  b: BloquesResueltos;
  cells: string[];
}) {
  // La alineacion por columna sigue siendo natural (numericos a derecha,
  // descripcion a izquierda). El bloque tabla_fila controla color/peso/tamano.
  const aligns: Array<"center" | "left" | "right"> = [
    "center",
    "center",
    "center",
    "center",
    "center",
    "left",
    "right",
    "right",
    "right",
  ];
  const baseStyle = bloqueACSS(b.tabla_fila);
  return (
    <tr style={{ borderBottom: `${e.border_thin_px}px solid ${e.color_borde}` }}>
      {cells.map((c, i) => (
        <td
          key={i}
          style={{
            ...baseStyle,
            padding: Math.max(2, e.pad_px - 1),
            textAlign: aligns[i],
            borderRight:
              i === cells.length - 1
                ? "none"
                : `${e.border_thin_px}px solid ${e.color_borde}`,
          }}
        >
          {c}
        </td>
      ))}
    </tr>
  );
}
