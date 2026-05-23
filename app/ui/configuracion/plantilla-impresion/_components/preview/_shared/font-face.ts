import type { FuentePersonalizada } from "~/lib/api/fuentes"

export function generarFontFaceCss(fuentes: FuentePersonalizada[]): string {
  return fuentes
    .map((f) => {
      const ext = f.archivo_url.split(".").pop()?.toLowerCase() || "ttf"
      const format =
        ext === "woff2" ? "woff2" : ext === "woff" ? "woff" : ext === "otf" ? "opentype" : "truetype"
      return `@font-face { font-family: '${f.nombre}'; src: url('${f.archivo_url}') format('${format}'); font-weight: normal; font-style: normal; }
@font-face { font-family: '${f.nombre}'; src: url('${f.archivo_url}') format('${format}'); font-weight: bold; font-style: normal; }
@font-face { font-family: '${f.nombre}'; src: url('${f.archivo_url}') format('${format}'); font-weight: normal; font-style: italic; }`
    })
    .join("\n")
}
