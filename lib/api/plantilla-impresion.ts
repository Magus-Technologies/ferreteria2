import type { CSSProperties } from "react";
import { apiRequest, type ApiResponse } from "../api";

export type Densidad = "compacta" | "normal" | "espaciada";

export interface EstilosPlantilla {
  color_tema: string;
  color_borde: string;
  color_texto: string;
  fuente: string;
  tamano_base: number;
  grosor_borde: number;
  densidad: Densidad;
}

export interface MensajesExtraPlantilla {
  label_observaciones: string;
  observaciones_default: string;
  leyenda_consulta: string;
  leyenda_representacion: string;
  // Flags específicos de cotización
  ocultar_canjear?: boolean;
  ocultar_despedida?: boolean;
  ocultar_cuentas_bancarias?: boolean;
  // Oculta el logo de la empresa en el ticket (configurable por comprobante).
  ocultar_logo?: boolean;
}

export type AlineacionBloque = "left" | "center" | "right";
export type PesoBloque = "normal" | "bold";

export interface EstiloBloque {
  color: string | null;
  tamano: number | null;
  peso: PesoBloque | null;
  alineacion: AlineacionBloque | null;
  cursiva: boolean | null;
  subrayado: boolean | null;
  fuente: string | null;
}

export type BloqueKey =
  | "empresa_razon"
  | "empresa_direccion"
  | "caja_ruc"
  | "caja_tipo"
  | "caja_numero"
  | "info_label"
  | "info_valor"
  | "tabla_header"
  | "tabla_fila"
  | "son"
  | "obs_label"
  | "obs_valor"
  | "total_label"
  | "total_valor"
  | "despedida_footer"
  | "consulta_leyenda"
  | "consulta_url"
  // Específicos del comprobante Entrega: permiten estilar la sección
  // "Datos de la entrega" (FECHA ENTREGA / TIPO / DESPACHADOR / etc.)
  // independientemente de "Datos del cliente".
  | "entrega_info_label"
  | "entrega_info_valor";

export type EstilosSecciones = Record<BloqueKey, EstiloBloque>;

export interface PlantillaImpresion {
  empresa_id: number;
  mensaje_despedida: string | null;
  despedida_activo: boolean;
  logos_nota_venta: number[];
  estilos: EstilosPlantilla;
  mensajes_extra: MensajesExtraPlantilla;
  estilos_secciones: EstilosSecciones;
}

export const ESTILOS_DEFAULT: EstilosPlantilla = {
  color_tema: "#fadc06",
  color_borde: "#fadc06",
  color_texto: "#000000",
  fuente: "Helvetica",
  tamano_base: 8,
  grosor_borde: 2,
  densidad: "normal",
};

export const MENSAJES_EXTRA_DEFAULT: MensajesExtraPlantilla = {
  label_observaciones: "OBSERVACIONES",
  observaciones_default: "- NINGUNA",
  leyenda_consulta: "Consulte su documento en:",
  leyenda_representacion: "Representacion impresa del comprobante electronico",
  ocultar_canjear: false,
  ocultar_despedida: false,
  ocultar_cuentas_bancarias: false,
  ocultar_logo: false,
};

export const BLOQUE_VACIO: EstiloBloque = {
  color: null,
  tamano: null,
  peso: null,
  alineacion: null,
  cursiva: null,
  subrayado: null,
  fuente: null,
};

export const BLOQUES_CATALOGO: Array<{ key: BloqueKey; label: string }> = [
  { key: "empresa_razon", label: "Razón social de la empresa" },
  { key: "empresa_direccion", label: "Dirección, email y celular" },
  { key: "caja_ruc", label: "Caja documento — línea de RUC" },
  { key: "caja_tipo", label: "Caja documento — tipo (BOLETA/FACTURA)" },
  { key: "caja_numero", label: "Caja documento — número" },
  { key: "info_label", label: "Info-grid: etiquetas" },
  { key: "info_valor", label: "Info-grid: valores" },
  { key: "tabla_header", label: "Tabla productos: header" },
  { key: "tabla_fila", label: "Tabla productos: filas" },
  { key: "son", label: "Línea SON: VEINTE…" },
  { key: "obs_label", label: "OBSERVACIONES: etiqueta" },
  { key: "obs_valor", label: "OBSERVACIONES: contenido" },
  { key: "total_label", label: "Totales: etiquetas (SUBTOTAL/IGV/TOTAL)" },
  { key: "total_valor", label: "Totales: valores" },
  { key: "despedida_footer", label: "Mensaje del pie (GRACIAS POR SU PREFERENCIA!)" },
  { key: "consulta_leyenda", label: 'Leyenda "Consulte su documento en:"' },
  { key: "consulta_url", label: "URL del enlace de consulta" },
  // Específicos del comprobante Entrega
  { key: "entrega_info_label", label: "Entrega — etiquetas datos de entrega" },
  { key: "entrega_info_valor", label: "Entrega — valores datos de entrega" },
];

export const ESTILOS_SECCIONES_DEFAULT: EstilosSecciones =
  BLOQUES_CATALOGO.reduce((acc, b) => {
    acc[b.key] = { ...BLOQUE_VACIO };
    return acc;
  }, {} as EstilosSecciones);

export const FUENTES_DISPONIBLES = [
  "Helvetica",
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
];

export interface PlantillaImpresionShowResponse {
  success: boolean;
  data: PlantillaImpresion;
}

export interface PlantillaImpresionUpdateResponse {
  success: boolean;
  message: string;
  data: PlantillaImpresion;
}

export type PlantillaImpresionPayload = Partial<
  Omit<PlantillaImpresion, "empresa_id">
> & {
  comprobante?: string;
  formato?: string;
};

export interface EstiloBloqueResuelto {
  color: string;
  tamano: number;
  peso: PesoBloque;
  alineacion: AlineacionBloque;
  cursiva: boolean;
  subrayado: boolean;
  fuente: string;
}

export type BloquesResueltos = Record<BloqueKey, EstiloBloqueResuelto>;

export interface EstilosResueltos {
  color_tema: string;
  color_borde: string;
  color_texto: string;
  fuente: string;
  font_pt: number;
  font_sm_pt: number;
  font_lg_pt: number;
  border_px: number;
  border_thin_px: number;
  pad_px: number;
  pad_lg_px: number;
  densidad: Densidad;
}

/**
 * Resuelve los estilos crudos a valores listos para usar en CSS (pt/px).
 * Mismo cálculo que VentaPdfService::resolverEstilos en PHP.
 */
export function resolverEstilos(estilos: EstilosPlantilla): EstilosResueltos {
  const densidad = estilos.densidad ?? "normal";
  const padMul =
    densidad === "compacta" ? 0.7 : densidad === "espaciada" ? 1.4 : 1.0;
  const fontPt = estilos.tamano_base ?? 8;
  const borderPx = estilos.grosor_borde ?? 2;

  return {
    color_tema: estilos.color_tema,
    color_borde: estilos.color_borde,
    color_texto: estilos.color_texto,
    fuente: estilos.fuente,
    font_pt: fontPt,
    font_sm_pt: Math.max(6, fontPt - 1),
    font_lg_pt: fontPt + 2,
    border_px: borderPx,
    border_thin_px: Math.max(1, Math.round(borderPx / 2)),
    pad_px: Math.round(4 * padMul),
    pad_lg_px: Math.round(6 * padMul),
    densidad,
  };
}

/**
 * Defaults por bloque, calculados desde los estilos globales resueltos.
 * Mismo cálculo que VentaPdfService::resolverEstilosBloques en PHP.
 */
export function defaultsBloque(
  key: BloqueKey,
  e: EstilosResueltos
): EstiloBloqueResuelto {
  const t = e.color_texto;
  const base = { cursiva: false, subrayado: false, fuente: e.fuente };

  switch (key) {
    case "empresa_razon":
      return {
        color: t,
        tamano: e.font_lg_pt,
        peso: "bold",
        alineacion: "center",
        ...base,
      };
    case "empresa_direccion":
      return {
        color: t,
        tamano: e.font_sm_pt,
        peso: "normal",
        alineacion: "center",
        ...base,
      };
    case "caja_ruc":
      return { color: t, tamano: e.font_lg_pt, peso: "bold", alineacion: "center", ...base };
    case "caja_tipo":
      return {
        color: t,
        tamano: e.font_lg_pt + 1,
        peso: "bold",
        alineacion: "center",
        ...base,
      };
    case "caja_numero":
      return {
        color: t,
        tamano: e.font_lg_pt + 1,
        peso: "bold",
        alineacion: "center",
        ...base,
      };
    case "info_label":
      return { color: t, tamano: e.font_sm_pt, peso: "bold", alineacion: "left", ...base };
    case "info_valor":
      return { color: t, tamano: e.font_sm_pt, peso: "normal", alineacion: "left", ...base };
    case "tabla_header":
      return { color: t, tamano: e.font_sm_pt, peso: "bold", alineacion: "center", ...base };
    case "tabla_fila":
      return { color: t, tamano: e.font_sm_pt, peso: "normal", alineacion: "left", ...base };
    case "son":
      return { color: t, tamano: e.font_sm_pt, peso: "bold", alineacion: "left", ...base };
    case "obs_label":
      return { color: t, tamano: e.font_pt, peso: "bold", alineacion: "left", ...base };
    case "obs_valor":
      return {
        color: t,
        tamano: Math.max(6, e.font_sm_pt - 1),
        peso: "normal",
        alineacion: "left",
        ...base,
      };
    case "total_label":
      return { color: t, tamano: e.font_pt, peso: "bold", alineacion: "right", ...base };
    case "total_valor":
      return { color: t, tamano: e.font_pt, peso: "normal", alineacion: "right", ...base };
    case "despedida_footer":
      return { color: t, tamano: e.font_pt, peso: "bold", alineacion: "center", ...base };
    case "consulta_leyenda":
      return {
        color: "#666666",
        tamano: e.font_sm_pt,
        peso: "normal",
        alineacion: "center",
        ...base,
      };
    case "consulta_url":
      return {
        color: "#333333",
        tamano: e.font_sm_pt,
        peso: "bold",
        alineacion: "center",
        ...base,
      };
    case "entrega_info_label":
      return { color: t, tamano: e.font_sm_pt, peso: "bold", alineacion: "left", ...base };
    case "entrega_info_valor":
      return { color: t, tamano: e.font_sm_pt, peso: "normal", alineacion: "left", ...base };
  }
}

export function resolverEstiloBloque(
  key: BloqueKey,
  override: EstiloBloque | undefined,
  globalEst: EstilosResueltos
): EstiloBloqueResuelto {
  const def = defaultsBloque(key, globalEst);
  return {
    color: override?.color !== null && override?.color !== undefined ? override.color : def.color,
    tamano: override?.tamano !== null && override?.tamano !== undefined ? override.tamano : def.tamano,
    peso: override?.peso !== null && override?.peso !== undefined ? override.peso : def.peso,
    alineacion: override?.alineacion !== null && override?.alineacion !== undefined ? override.alineacion : def.alineacion,
    cursiva: override?.cursiva !== null && override?.cursiva !== undefined ? override.cursiva : def.cursiva,
    subrayado: override?.subrayado !== null && override?.subrayado !== undefined ? override.subrayado : def.subrayado,
    fuente: override?.fuente !== null && override?.fuente !== undefined ? override.fuente : def.fuente,
  };
}

export function resolverBloques(
  secciones: EstilosSecciones,
  globalEst: EstilosResueltos
): BloquesResueltos {
  return BLOQUES_CATALOGO.reduce((acc, b) => {
    acc[b.key] = resolverEstiloBloque(b.key, secciones[b.key], globalEst);
    return acc;
  }, {} as BloquesResueltos);
}

/**
 * Convierte un EstiloBloqueResuelto en un objeto CSSProperties para React.
 */
export function bloqueACSS(b: EstiloBloqueResuelto): CSSProperties {
  return {
    color: b.color,
    fontSize: `${b.tamano}pt`,
    fontWeight: b.peso === "bold" ? 700 : 400,
    textAlign: b.alineacion,
    fontStyle: b.cursiva ? "italic" : "normal",
    textDecoration: b.subrayado ? "underline" : "none",
    fontFamily: `"${b.fuente}", Arial, sans-serif`,
  };
}

export const plantillaImpresionApi = {
  show: async (params?: { comprobante?: string; formato?: string }): Promise<ApiResponse<PlantillaImpresionShowResponse>> => {
    let url = "/configuracion-impresion/plantilla";
    if (params && (params.comprobante || params.formato)) {
      const qs = new URLSearchParams();
      if (params.comprobante) qs.set('comprobante', params.comprobante);
      if (params.formato) qs.set('formato', params.formato);
      url += '?' + qs.toString();
    }
    return apiRequest<PlantillaImpresionShowResponse>(url);
  },

  update: async (
    payload: PlantillaImpresionPayload
  ): Promise<ApiResponse<PlantillaImpresionUpdateResponse>> => {
    return apiRequest<PlantillaImpresionUpdateResponse>(
      "/configuracion-impresion/plantilla",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },
};
