'use client'

import { Checkbox, Modal, Spin, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { configuracionEntregaApi } from '~/lib/api/configuracion-entrega'
import { permissionsApi } from '~/lib/api/permissions'

const { Text } = Typography

interface Props {
  open: boolean
  onClose: () => void
}

export default function ModalConfigRolesEntrega({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  // Roles desde la DB — solo los que tienen rol_sistema definido
  const { data: rolesData, isLoading: loadingRoles } = useQuery({
    queryKey: ['roles-db'],
    queryFn: () => permissionsApi.getRoles(),
    staleTime: 10 * 60 * 1000,
  })

  const roles: { value: string; label: string }[] =
    ((rolesData?.data as any)?.data ?? (rolesData?.data as any) ?? [])
      .filter((r: any) => r.name !== 'admin_global')
      .map((r: any) => ({ value: r.name as string, label: r.descripcion as string }))

  const { data: configData, isLoading: loadingConfig } = useQuery({
    queryKey: ['configuracion-entrega'],
    queryFn: () => configuracionEntregaApi.get(),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  })

  const isLoading = loadingRoles || loadingConfig

  const rolesFromServer: string[] =
    (configData?.data as any)?.roles_entrega_tienda ?? ['ALMACENERO']

  useEffect(() => {
    if (open && !isLoading) {
      setSelectedRoles(rolesFromServer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isLoading, configData])

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
      onCancel={onClose}
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
          {roles.map((rol) => (
            <Checkbox key={rol.value} value={rol.value}>
              {rol.label}
            </Checkbox>
          ))}
        </Checkbox.Group>
      )}
    </Modal>
  )
}
