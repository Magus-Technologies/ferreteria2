'use client'

import TableCotizar from '../tables/table-cotizar'

// La tabla de productos vive en Zustand, no en el form (ver
// store-producto-agregado-cotizacion.ts) — ya no necesita el Form.List que
// la envolvía antes para darle `fields`/`add`/`remove`.
export default function FormTableCotizar() {
  return <TableCotizar />
}
