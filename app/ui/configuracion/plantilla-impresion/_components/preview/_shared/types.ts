import type { PlantillaImpresion, BloquesResueltos, resolverEstilos } from "~/lib/api/plantilla-impresion"
import type { FuentePersonalizada } from "~/lib/api/fuentes"

export interface PreviewProps {
  plantilla: PlantillaImpresion
  formato?: string
  comprobante?: string
  fuentesPersonalizadas?: FuentePersonalizada[]
}

export type EstiloResuelto = ReturnType<typeof resolverEstilos>

export interface PreviewContext {
  // Estilos resueltos
  e: EstiloResuelto
  m: PlantillaImpresion["mensajes_extra"]
  b: BloquesResueltos
  plantilla: PlantillaImpresion

  // Datos de empresa
  razonSocial: string
  direccion: string
  email: string
  ruc: string
  celular: string
  logoUrl: string | null

  // Estilos / textos de documento
  fontFaceCss: string
  containerStyle: React.CSSProperties
  tituloDocumento: string
  numeroDocumento: string
}
