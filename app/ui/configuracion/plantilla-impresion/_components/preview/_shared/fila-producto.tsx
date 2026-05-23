import { bloqueACSS, type BloquesResueltos } from "~/lib/api/plantilla-impresion"
import type { EstiloResuelto } from "./types"

interface FilaProductoProps {
  e: EstiloResuelto
  b: BloquesResueltos
  cells: string[]
}

export default function FilaProducto({ e, b, cells }: FilaProductoProps) {
  // La alineacion por columna sigue siendo natural (numericos a derecha,
  // descripcion a izquierda). El bloque tabla_fila controla color/peso/tamano.
  const aligns: Array<"center" | "left" | "right"> = [
    "center", "center", "center", "center", "center", "left", "right", "right", "right",
  ]
  const baseStyle = bloqueACSS(b.tabla_fila)
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
  )
}
