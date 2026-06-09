'use client'

import { Modal } from 'antd'
import { useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { FaCheck, FaTimes } from 'react-icons/fa'
import TipoAutorizacionFields from '~/components/autorizaciones/tipo-autorizacion-fields'

interface ModalAprobarProps {
  open: boolean
  onClose: () => void
  onAprobar: (data: {
    tipo_aprobacion: 'temporal' | 'permanente' | 'una_vez'
    duracion_horas?: number
    comentario?: string
  }) => Promise<void>
  onRechazar: (data: { comentario?: string }) => Promise<void>
  loading: boolean
  solicitudDescripcion?: string
}

export default function ModalAprobar({
  open,
  onClose,
  onAprobar,
  onRechazar,
  loading,
  solicitudDescripcion,
}: ModalAprobarProps) {
  const [tipo, setTipo] = useState<'temporal' | 'permanente' | 'una_vez'>('temporal')
  const [duracion, setDuracion] = useState<number>(24)
  const [comentario, setComentario] = useState('')
  const [modo, setModo] = useState<'aprobar' | 'rechazar' | null>(null)

  const handleAprobar = async () => {
    await onAprobar({
      tipo_aprobacion: tipo,
      duracion_horas: tipo === 'temporal' ? duracion : undefined,
      comentario: comentario || undefined,
    })
    resetState()
  }

  const handleRechazar = async () => {
    await onRechazar({ comentario: comentario || undefined })
    resetState()
  }

  const resetState = () => {
    setTipo('temporal')
    setDuracion(24)
    setComentario('')
    setModo(null)
  }

  return (
    <Modal
      open={open}
      onCancel={() => { onClose(); resetState() }}
      footer={null}
      centered
      width={460}
      destroyOnHidden
      title="Resolver Solicitud"
    >
      {solicitudDescripcion && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Solicitud</div>
          <div className="text-sm text-gray-700">{solicitudDescripcion}</div>
        </div>
      )}

      {!modo && (
        <div className="flex gap-3 mb-4">
          <ButtonBase
            color="success"
            size="md"
            onClick={() => setModo('aprobar')}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <FaCheck /> Aprobar
          </ButtonBase>
          <ButtonBase
            color="danger"
            size="md"
            onClick={() => setModo('rechazar')}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <FaTimes /> Rechazar
          </ButtonBase>
        </div>
      )}

      {modo === 'aprobar' && (
        <div className="space-y-4">
          <TipoAutorizacionFields
            tipo={tipo}
            setTipo={setTipo}
            duracion={duracion}
            setDuracion={setDuracion}
          />

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Comentario (opcional):
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Agrega un comentario..."
              className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <ButtonBase
              color="default"
              size="md"
              onClick={() => setModo(null)}
              className="flex-1"
            >
              Volver
            </ButtonBase>
            <ButtonBase
              color="success"
              size="md"
              onClick={handleAprobar}
              loading={loading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <FaCheck /> Confirmar Aprobación
            </ButtonBase>
          </div>
        </div>
      )}

      {modo === 'rechazar' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Motivo del rechazo (opcional):
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Explica por qué se rechaza..."
              className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <ButtonBase
              color="default"
              size="md"
              onClick={() => setModo(null)}
              className="flex-1"
            >
              Volver
            </ButtonBase>
            <ButtonBase
              color="danger"
              size="md"
              onClick={handleRechazar}
              loading={loading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <FaTimes /> Confirmar Rechazo
            </ButtonBase>
          </div>
        </div>
      )}
    </Modal>
  )
}
