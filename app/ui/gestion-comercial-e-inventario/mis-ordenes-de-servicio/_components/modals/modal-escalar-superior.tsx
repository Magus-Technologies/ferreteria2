'use client'

import { Modal, Button, App, Spin } from 'antd'
import { useState, useEffect } from 'react'
import { requerimientoInternoApi, type RequerimientoInterno } from '~/lib/api/requerimiento-interno'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { cargosHierarchyApi } from '~/lib/api/cargos-hierarchy'
import { classOkButtonModal } from '~/lib/clases'

interface ModalEscalarSuperiorProps {
  open: boolean
  requerimiento: RequerimientoInterno | null
  onClose: () => void
}

export default function ModalEscalarSuperior({
  open,
  requerimiento,
  onClose,
}: ModalEscalarSuperiorProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [parentCargoInfo, setParentCargoInfo] = useState<{ id: number; descripcion: string } | null>(null)
  const [loadingCargo, setLoadingCargo] = useState(false)

  useEffect(() => {
    if (open && requerimiento) {
      loadParentCargo()
    }
  }, [open, requerimiento])

  const loadParentCargo = async () => {
    setLoadingCargo(true)
    try {
      const result = await cargosHierarchyApi.getAllCargos()
      const allCargos = result.data?.data || []
      
      // Encontrar el cargo del REQUERIMIENTO
      const reqCargoObj = allCargos.find((c) => c.descripcion?.toLowerCase() === requerimiento?.cargo?.toLowerCase())
      const parentCode = reqCargoObj?.parent || null

      if (parentCode) {
        const parentCargoObj = allCargos.find((c) => c.codigo === parentCode)
        if (parentCargoObj) {
          setParentCargoInfo({
            id: parentCargoObj.id,
            descripcion: parentCargoObj.descripcion
          })
        }
      }
    } catch (error) {
      message.error('Error al cargar cargo superior')
      console.error(error)
    } finally {
      setLoadingCargo(false)
    }
  }

  const handleEscalar = async () => {
    if (!requerimiento || !parentCargoInfo) return

    setLoading(true)
    try {
      await requerimientoInternoApi.escalarASuperior(requerimiento.id, {
        reason: 'Escalado a superior jerárquico',
      })
      message.success('Requerimiento escalado correctamente')
      setParentCargoInfo(null)
      onClose()
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ORDENES_DE_SERVICIO] })
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Error al escalar el requerimiento'
      message.error(errorMsg)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Escalar Requerimiento"
      open={open}
      onCancel={() => {
        onClose()
        setParentCargoInfo(null)
      }}
      centered
      width={500}
      footer={[
        <Button key="cancel" onClick={() => { onClose(); setParentCargoInfo(null) }}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleEscalar}
          disabled={!parentCargoInfo || loadingCargo}
          className={classOkButtonModal}
        >
          Escalar
        </Button>,
      ]}
    >
      <Spin spinning={loadingCargo}>
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Nota:</strong> Este requerimiento será escalado al cargo superior en la jerarquía para su revisión y aprobación.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Cargo Actual</label>
              <div className="text-sm font-semibold text-slate-700">{requerimiento?.cargo || '—'}</div>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                ↑
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Escalado a</label>
              {parentCargoInfo ? (
                <div className="text-sm font-bold text-emerald-600 bg-emerald-50 p-3 rounded border border-emerald-200">
                  {parentCargoInfo.descripcion}
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic">No hay cargo superior disponible</div>
              )}
            </div>
          </div>

          {parentCargoInfo && (
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-sm text-emerald-800">
              ✓ El requerimiento será enviado a <strong>{parentCargoInfo.descripcion}</strong> para su aprobación
            </div>
          )}
        </div>
      </Spin>
    </Modal>
  )
}
