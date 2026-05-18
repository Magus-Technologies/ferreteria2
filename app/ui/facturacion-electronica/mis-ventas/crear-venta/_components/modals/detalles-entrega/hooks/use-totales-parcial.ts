import { useMemo } from 'react'
import type { ProductoEntrega } from '../../../../../_hooks/use-productos-entrega'

/**
 * Suma de cantidades de la tabla de productos del modal — usado para
 * mostrar los counters al pie del modo Parcial y para habilitar/deshabilitar
 * botones del footer.
 *
 * - `totalAEntregar` = suma de "entregar ahora" (lo que el cliente lleva).
 * - `totalAProgramar` = suma de "entregar programado" (lo que se entrega luego).
 * - `totalSinProgramar` = lo que sobra y queda como pendiente sin programar
 *    (`total - entregar - entregar_programado`, mínimo 0).
 */
export function useTotalesParcial(productos: ProductoEntrega[]) {
  const totalAEntregar = useMemo(
    () => productos.reduce((acc, item) => acc + item.entregar, 0),
    [productos],
  )
  const totalAProgramar = useMemo(
    () => productos.reduce((acc, item) => acc + item.entregar_programado, 0),
    [productos],
  )
  const totalSinProgramar = useMemo(
    () =>
      productos.reduce(
        (acc, item) =>
          acc +
          Math.max(
            0,
            // Descuenta también `entregado` (>0 solo en `crear-entrega-resto`,
            // donde representa lo entregado en entregas previas).
            // `programado` representa cantidades ya reservadas en otro tramo
            // parcial del mismo grupo; no deben reaparecer como "sin programar".
            item.total -
              item.entregar -
              item.entregar_programado -
              (item.entregado || 0) -
              (item.programado || 0),
          ),
        0,
      ),
    [productos],
  )

  return { totalAEntregar, totalAProgramar, totalSinProgramar }
}
