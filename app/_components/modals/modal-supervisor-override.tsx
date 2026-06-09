'use client'

import { useState } from 'react'
import { Modal, Select, Input, App, Empty, Spin } from 'antd'
import { FaUserShield } from 'react-icons/fa'
import { useQuery } from '@tanstack/react-query'
import { autorizacionesApi, type AccionAutorizacion } from '~/lib/api/autorizaciones'
import TipoAutorizacionFields, { type TipoAprobacion } from '~/components/autorizaciones/tipo-autorizacion-fields'

interface ModalSupervisorOverrideProps {
  open: boolean
  setOpen: (open: boolean) => void
  modulo: string
  accion: AccionAutorizacion
  /** Se llama tras una autorización exitosa. */
  onSuccess?: () => void
}

/**
 * Override en sitio: un supervisor presente autoriza la acción/vista con su
 * clave de supervisor. Solo lista supervisores que pueden autorizar (según el
 * organigrama/config). Concede una autorización de uso único.
 */
export default function ModalSupervisorOverride({
  open,
  setOpen,
  modulo,
  accion,
  onSuccess,
}: ModalSupervisorOverrideProps) {
  const { message } = App.useApp()
  const [supervisorId, setSupervisorId] = useState<string>()
  const [password, setPassword] = useState('')
  const [tipo, setTipo] = useState<TipoAprobacion>('una_vez')
  const [duracionHoras, setDuracionHoras] = useState<number>(24)
  const [loading, setLoading] = useState(false)

  const { data: supervisores = [], isLoading } = useQuery({
    queryKey: ['autorizaciones', 'supervisores', modulo, accion],
    queryFn: async () => {
      const res = await autorizacionesApi.supervisoresOverride(modulo, accion)
      return res.data?.data ?? []
    },
    enabled: open,
  })

  const reset = () => {
    setSupervisorId(undefined)
    setPassword('')
    setTipo('una_vez')
    setDuracionHoras(24)
  }

  const handleConfirmar = async () => {
    if (!supervisorId) {
      message.warning('Selecciona el supervisor')
      return
    }
    if (!password) {
      message.warning('Ingresa la clave de supervisor')
      return
    }
    setLoading(true)
    try {
      const res = await autorizacionesApi.autorizarOverride({
        modulo,
        accion,
        supervisor_id: supervisorId,
        supervisor_password: password,
        tipo_aprobacion: tipo,
        duracion_horas: tipo === 'temporal' ? duracionHoras : undefined,
      })
      if (res.data) {
        message.success('Autorización concedida')
        setOpen(false)
        reset()
        onSuccess?.()
      } else {
        message.error(res.error?.message || 'No se pudo autorizar')
      }
    } catch {
      message.error('Error al autorizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={() => { setOpen(false); reset() }}
      onOk={handleConfirmar}
      okText="Autorizar"
      cancelText="Cancelar"
      confirmLoading={loading}
      centered
      destroyOnHidden
      title={
        <span className="flex items-center gap-2">
          <FaUserShield className="text-amber-500" /> Autorizar con clave de supervisor
        </span>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-8"><Spin /></div>
      ) : supervisores.length === 0 ? (
        <Empty
          description="No hay supervisores que puedan autorizar esta acción"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-500">
            Un supervisor autorizado ingresa su clave y elige el tipo de autorización a conceder.
          </p>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Supervisor</label>
            <Select
              showSearch
              optionFilterProp="label"
              className="w-full"
              placeholder="Selecciona el supervisor"
              value={supervisorId}
              onChange={setSupervisorId}
              options={supervisores.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Clave de supervisor</label>
            <Input.Password
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPressEnter={handleConfirmar}
            />
          </div>

          <TipoAutorizacionFields
            tipo={tipo}
            setTipo={setTipo}
            duracion={duracionHoras}
            setDuracion={setDuracionHoras}
          />
        </div>
      )}
    </Modal>
  )
}
