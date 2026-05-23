import { bloqueACSS, type BloquesResueltos } from "~/lib/api/plantilla-impresion"
import type { EstiloResuelto } from "./types"

interface FilaProps {
  e: EstiloResuelto
  b: BloquesResueltos
  izq: [string, string]
  der: [string, string]
}

export default function Fila({ e, b, izq, der }: FilaProps) {
  const labelStyle = (first: boolean): React.CSSProperties => ({
    ...bloqueACSS(b.info_label),
    width: first ? "12%" : "15%",
    padding: e.pad_px,
  })
  const valorStyle = (first: boolean): React.CSSProperties => ({
    ...bloqueACSS(b.info_valor),
    width: first ? "38%" : "35%",
    padding: e.pad_px,
  })
  return (
    <tr>
      <td style={labelStyle(true)}>{izq[0]}</td>
      <td style={valorStyle(true)}>: {izq[1]}</td>
      <td style={labelStyle(false)}>{der[0]}</td>
      <td style={valorStyle(false)}>: {der[1]}</td>
    </tr>
  )
}
