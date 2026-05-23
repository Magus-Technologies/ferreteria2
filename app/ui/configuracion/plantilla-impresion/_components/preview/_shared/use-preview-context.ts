"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "~/lib/auth-context"
import { empresaApi } from "~/lib/api/empresa"
import { QueryKeys } from "~/app/_lib/queryKeys"
import { resolverEstilos, resolverBloques, type BloquesResueltos } from "~/lib/api/plantilla-impresion"
import { generarFontFaceCss } from "./font-face"
import { tituloComprobante } from "./titulo-comprobante"
import type { PreviewContext, PreviewProps } from "./types"

/**
 * Centraliza el setup común a todas las variantes del preview:
 * - resuelve estilos y bloques de la plantilla
 * - carga datos de la empresa actual
 * - construye el container style y el título/número de ejemplo
 * - genera el CSS @font-face de las fuentes personalizadas
 */
export function usePreviewContext({
  plantilla,
  comprobante,
  fuentesPersonalizadas = [],
}: PreviewProps): PreviewContext {
  const { user } = useAuth()
  const empresaId = user?.empresa?.id

  const { data } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, empresaId],
    queryFn: () => empresaApi.getById(empresaId!),
    enabled: !!empresaId,
  })

  const empresa = data?.data?.data
  const e = resolverEstilos(plantilla.estilos)
  const m = plantilla.mensajes_extra
  const b: BloquesResueltos = resolverBloques(plantilla.estilos_secciones, e)

  const { titulo: tituloDocumento, numero: numeroDocumento } = tituloComprobante(comprobante)
  const fontFaceCss = generarFontFaceCss(fuentesPersonalizadas)

  const containerStyle: React.CSSProperties = {
    fontFamily: `"${e.fuente}", Arial, sans-serif`,
    fontSize: `${e.font_pt}pt`,
    color: e.color_texto,
    lineHeight: 1.3,
  }

  return {
    e, m, b, plantilla,
    razonSocial: empresa?.razon_social ?? "",
    direccion: empresa?.direccion ?? "",
    email: empresa?.email ?? "",
    ruc: empresa?.ruc ?? "",
    celular: empresa?.celular ?? "",
    logoUrl: empresa?.logo_url ?? null,
    fontFaceCss,
    containerStyle,
    tituloDocumento,
    numeroDocumento,
  }
}
