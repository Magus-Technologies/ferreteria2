'use client'

import { ReactNode, useState } from 'react'
import { Grid, Popover } from 'antd'
import { HiChevronDown } from 'react-icons/hi2'

interface ActionButtonsWrapperProps {
  children: ReactNode
  /** Texto del botón que abre el panel en móvil. Default: "Acciones". */
  label?: string
}

/**
 * Contenedor de botones de acción de una tabla.
 *
 * - Escritorio (sm+): fila horizontal con scroll (como siempre).
 * - Móvil (< sm): un único botón "Acciones" que abre un panel con los mismos
 *   botones apilados verticalmente, para no amontonarlos ni depender del scroll
 *   horizontal. Se renderiza UNA sola variante (Grid.useBreakpoint) para no
 *   duplicar los botones ni sus modales.
 */
export default function ActionButtonsWrapper({
  children,
  label = 'Acciones',
}: ActionButtonsWrapperProps) {
  const screens = Grid.useBreakpoint()
  const [open, setOpen] = useState(false)

  // screens.sm es undefined en el primer render (SSR) → tratamos como móvil
  // hasta que el cliente resuelva el breakpoint.
  if (screens.sm) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
        <style jsx>{`
          div::-webkit-scrollbar {
            height: 4px;
          }
          div::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>
        {children}
      </div>
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      content={
        // Al tocar cualquier botón se cierra el panel. Cada hijo ocupa el
        // ancho completo para que se vean como una lista prolija.
        <div
          className="flex flex-col gap-2 min-w-[220px] [&>*]:w-full"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      }
    >
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 text-sm transition-colors"
      >
        {label}
        <HiChevronDown size={16} />
      </button>
    </Popover>
  )
}
