'use client'

import { Checkbox, Modal, Spin, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { configuracionEntregaApi } from '~/lib/api/configuracion-entrega'

const { Text } = Typography

const ROLES = [
  { value: 'ALMACENERO',  label: 'Almacenero' },
  { value: 'VENDEDOR',    label: 'Vendedor' },
  { value: 'CONTADOR',    label: 'Contador' },
  { value: 'DESPACHADOR', label: 'Despachador' },
  { value: 'CONDUCTOR',   label: 'Conductor' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function ModalConfigRolesEntrega({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  const { data: configData, isLoading } = useQuery({
    queryKey: ['configuracion-entrega'],
    queryFn: () => configuracionEntregaApi.get(),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  })

  const rolesFromServer: string[] = (configData?.data as any)?.roles_entrega_tienda ?? ['ALMACENERO']

  // Sincronizar el estado local cuando los datos del server cambian
  useEffect(() => {
    if (open && !isLoading) {
      setSelectedRoles(rolesFromServer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isLoading, configData])

  const handleCancel = () => {
    onClose()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await configuracionEntregaApi.update({ roles_entrega_tienda: selectedRoles })
      await queryClient.invalidateQueries({ queryKey: ['configuracion-entrega'] })
      message.success('Configuración guardada')
      onClose()
    } catch {
      message.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Roles que pueden entregar en tienda"
      open={open}
      onCancel={handleCancel}
      onOk={handleSave}
      okText="Guardar"
      cancelText="Cancelar"
      confirmLoading={saving}
      width={420}
    >
      <Text type="secondary" className="block mb-4 text-sm">
        Seleccioná los roles que pueden ver y marcar como entregadas las órdenes de Recojo en Tienda.
      </Text>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spin />
        </div>
      ) : (
        <Checkbox.Group
          value={selectedRoles}
          onChange={(vals) => setSelectedRoles(vals as string[])}
          className="flex flex-col gap-3"
        >
          {ROLES.map((rol) => (
            <Checkbox key={rol.value} value={rol.value}>
              {rol.label}
            </Checkbox>
          ))}
        </Checkbox.Group>
      )}
    </Modal>
  )
}
