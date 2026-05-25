'use client'

import { useState } from 'react'
import { Modal, Button, Input } from 'antd'
import { FaBan } from 'react-icons/fa'
import type { EntregaNueva } from '~/lib/api/entregas'

interface Props {
  open: boolean
  onClose: () => void
  onAnular: (motivo: string) => Promise<void>
  entrega: EntregaNueva | undefined
}

export default function ModalAnularEntregaV2({ open, onClose, onAnular, entrega }: Props) {
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  if (!entrega) return null

  const handleAnular = async () => {
    if (motivo.trim().length < 5) return
    setLoading(true)
    try {
      await onAnular(motivo.trim())
      setMotivo('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
            <FaBan className="text-red-600" />
          </div>
          <div>
            <div className="font-bold text-slate-800">Anular Entrega</div>
            <div className="text-xs text-red-500">Despacho #{entrega.venta_entrega_secuencia}</div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={480}
      centered
      destroyOnHidden
      footer={
        <div className="flex justify-between pt-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            danger
            type="primary"
            icon={<FaBan />}
            disabled={motivo.trim().length < 5}
            loading={loading}
            onClick={handleAnular}
          >
            Anular
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          Esta acción revertirá el stock si fue aplicado. No se puede deshacer.
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Motivo de anulación <span className="text-red-500">*</span>
          </label>
          <Input.TextArea
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Mínimo 5 caracteres..."
            rows={3}
            maxLength={500}
            showCount
          />
        </div>
      </div>
    </Modal>
  )
}
