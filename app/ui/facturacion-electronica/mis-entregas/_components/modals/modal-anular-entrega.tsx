'use client'

import { useState } from 'react'
import { Modal, Input, Form } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useQueryClient } from '@tanstack/react-query'
import { FaExclamationTriangle } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import { entregasNuevasApi } from '~/lib/api/entregas'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface ModalAnularEntregaProps {
  open: boolean
  onClose: () => void
  entrega?: any
  onSuccess?: () => void
}

/**
 * Modal de confirmación para ANULAR una entrega que el usuario marcó
 * como entregada por error. Pide un motivo (mínimo 5 caracteres) y
 * llama al endpoint `POST /entregas-productos/{id}/anular`.
 *
 * Tras anular, el `estado_entrega` vuelve a `'pe'` (pendiente) y se
 * registran `fecha_anulacion`, `motivo_anulacion`, `user_anulacion_id`
 * para auditoría.
 *
 * NO afecta stock, NO toca comprobante SUNAT — solo deshace la marca
 * física de entregado. Si se quiere anular la venta entera, hay que
 * usar el botón "Anular Venta" en mis-ventas.
 */
export default function ModalAnularEntrega({
  open,
  onClose,
  entrega,
  onSuccess,
}: ModalAnularEntregaProps) {
  const { message } = useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  if (!entrega) return null

  const ventaNumero =
    entrega.venta?.serie && entrega.venta?.numero
      ? `${entrega.venta.serie}-${entrega.venta.numero}`
      : 'S/N'

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      const response = await entregasNuevasApi.anular(Number(entrega.id), values.motivo.trim())
      if (response.error) {
        message.error(response.error.message || 'Error al anular la entrega')
        return
      }
      message.success('Entrega anulada — vuelve a Pendiente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      form.resetFields()
      onSuccess?.()
      onClose()
    } catch (error: any) {
      // validateFields lanza si hay validation errors — no es ruido.
      if (error?.errorFields) return
      console.error('Error al anular entrega:', error)
      message.error(error?.message || 'Error al anular la entrega')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <FaExclamationTriangle className="text-amber-600 text-lg" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-800 leading-tight">
              Anular Entrega
            </div>
            <span className="text-amber-600 text-xs font-mono">
              Venta {ventaNumero}
            </span>
          </div>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      width={520}
      centered
      destroyOnHidden
      footer={
        <div className="flex items-center justify-between pt-2">
          <ButtonBase color="default" size="md" onClick={handleCancel}>
            Cancelar
          </ButtonBase>
          <ButtonBase
            color="warning"
            size="md"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Anulando...' : 'Anular Entrega'}
          </ButtonBase>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          La entrega volverá a estado <strong>Pendiente</strong>. El stock y los
          comprobantes <strong>NO</strong> se modifican. Si querés anular la
          venta completa, usá el botón "Anular Venta" en Mis Ventas.
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="motivo"
            label={
              <span className="text-xs font-bold uppercase text-slate-600 tracking-wide">
                Motivo de la anulación <span className="text-red-500">*</span>
              </span>
            }
            rules={[
              { required: true, message: 'Ingresá un motivo' },
              { min: 5, message: 'El motivo debe tener al menos 5 caracteres' },
              { max: 500, message: 'Máximo 500 caracteres' },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ej: el cliente no llegó a recoger, le di entregar por error..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
