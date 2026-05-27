'use client'

import { useState } from 'react'
import { FaFilePdf, FaUndoAlt } from 'react-icons/fa'
import { Tooltip } from 'antd'
import { useStoreModalPdfEntrega } from '~/app/ui/facturacion-electronica/mis-entregas/_store/store-modal-pdf-entrega'
import ModalAnularEntrega from '~/app/ui/facturacion-electronica/mis-entregas/_components/modals/modal-anular-entrega'
import type { EntregaNueva } from '~/lib/api/entregas'

interface Props {
  entrega?: EntregaNueva
  onRefetch?: () => void
}

export default function CellAccionesHistorial({ entrega, onRefetch }: Props) {
  const [anularOpen, setAnularOpen] = useState(false)
  const openPdfModal = useStoreModalPdfEntrega((s) => s.openModal)

  if (!entrega) return null

  const codigo = entrega.estado_entrega_codigo ?? ''
  const puedeAnular = codigo !== 'ca'

  return (
    <>
      <div className="flex items-center gap-1.5 h-full">
        <Tooltip title="Imprimir Ticket">
          <button
            type="button"
            onClick={() => openPdfModal(entrega as any)}
            className="flex items-center justify-center w-7 h-7 rounded text-white cursor-pointer transition-opacity hover:opacity-75"
            style={{ backgroundColor: '#c0392b' }}
          >
            <FaFilePdf size={12} />
          </button>
        </Tooltip>

        {puedeAnular && (
          <Tooltip title="Anular Entrega">
            <button
              type="button"
              onClick={() => setAnularOpen(true)}
              className="flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <FaUndoAlt size={12} />
            </button>
          </Tooltip>
        )}
      </div>

      <ModalAnularEntrega
        open={anularOpen}
        onClose={() => setAnularOpen(false)}
        entrega={entrega as any}
        onSuccess={() => { setAnularOpen(false); onRefetch?.() }}
      />
    </>
  )
}
