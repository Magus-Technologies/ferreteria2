'use client'

import { Modal, Button, App, Spin, Select, Input } from 'antd'
import { useState, useEffect } from 'react'
import { requerimientoInternoApi, type RequerimientoInterno } from '~/lib/api/requerimiento-interno'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { cargosHierarchyApi } from '~/lib/api/cargos-hierarchy'
import { classOkButtonModal } from '~/lib/clases'

interface ModalReasignarCargoProps {
  open: boolean
  requerimiento: RequerimientoInterno | null
  onClose: () => void
}

interface CargoOption {
  id: number
  descripcion: string
  codigo: string
}

export default function ModalReasignarCargo({
  open,
  requerimiento,
  onClose,
}: ModalReasignarCargoProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [loadingCargos, setLoadingCargos] = useState(false)
  const [cargos, setCargos] = useState<CargoOption[]>([])
  const [toCargoId, setToCargoId] = useState<number | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) {
      loadCargos()
      setToCargoId(null)
      setReason('')
    }
  }, [open])

  const loadCargos = async () => {
    setLoadingCargos(true)
    try {
      const result = await cargosHierarchyApi.getAllCargos()
      setCargos(result.data?.data || [])
    } catch (error) {
      message.error('Error al cargar cargos')
      console.error(error)
    } finally {
      setLoadingCargos(false)
    }
  }

  const handleReasignar = async () => {
    if (!requerimiento || !toCargoId) return

    setLoading(true)
    try {
      await requerimientoInternoApi.reasignar(requerimiento.id, {
        to_cargo_id: toCargoId,
        reason: reason || undefined,
      })
      message.success('Requerimiento reasignado correctamente')
      onClose()
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ORDENES_DE_SERVICIO] })
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Error al reasignar el requerimiento'
      message.error(errorMsg)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const cargoActual = cargos.find(
    (c) => c.descripcion?.toLowerCase() === requerimiento?.cargo?.toLowerCase()
  )

  const cargosDisponibles = cargos.filter((c) => c.id !== cargoActual?.id)

  return (
    <Modal
      title="Reasignar Requerimiento"
      open={open}
      onCancel={onClose}
      centered
      width={500}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleReasignar}
          disabled={!toCargoId || loadingCargos}
          className={classOkButtonModal}
        >
          Reasignar
        </Button>,
      ]}
    >
      <Spin spinning={loadingCargos}>
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <p className="text-sm text-indigo-800">
              <strong>ℹ️ Nota:</strong> Como cargo raíz, puedes reasignar este requerimiento a cualquier cargo ocupacional.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Cargo Actual</label>
              <div className="text-sm font-semibold text-slate-700">{requerimiento?.cargo || '—'}</div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Reasignar a <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="Selecciona el cargo destino..."
                value={toCargoId ?? undefined}
                onChange={(value) => setToCargoId(value)}
                className="w-full"
                options={cargosDisponibles.map((c) => ({
                  label: c.descripcion,
                  value: c.id,
                }))}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Motivo <span className="text-slate-400 font-normal normal-case">(opcional)</span>
              </label>
              <Input.TextArea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Indica el motivo de la reasignación..."
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
        </div>
      </Spin>
    </Modal>
  )
}
