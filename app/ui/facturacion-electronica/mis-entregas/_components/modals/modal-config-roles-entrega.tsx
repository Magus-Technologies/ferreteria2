'use client'

import { Checkbox, Divider, Modal, Spin, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { configuracionEntregaApi } from '~/lib/api/configuracion-entrega'
import { permissionsApi } from '~/lib/api/permissions'

const { Text, Title } = Typography

interface Props {
  open: boolean
  onClose: () => void
}

export default function ModalConfigRolesEntrega({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [selectedTienda, setSelectedTienda] = useState<string[]>([])
  const [selectedSupervisores, setSelectedSupervisores] = useState<string[]>([])

  const { data: rolesData, isLoading: loadingRoles } = useQuery({
    queryKey: ['roles-db'],
    queryFn: () => permissionsApi.getRoles(),
    staleTime: 10 * 60 * 1000,
  })

  const roles: { value: string; label: string }[] =
    ((rolesData?.data as any)?.data ?? (rolesData?.data as any) ?? [])
      .filter((r: any) => r.name !== 'admin_global')
      .map((r: any) => ({ value: r.name as string, label: (r.name as string).toUpperCase() }))

  const { data: configData, isLoading: loadingConfig } = useQuery({
    queryKey: ['configuracion-entrega'],
    queryFn: () => configuracionEntregaApi.get(),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  })

  const isLoading = loadingRoles || loadingConfig

  useEffect(() => {
    if (open && !isLoading) {
      setSelectedTienda((configData?.data as any)?.roles_entrega_tienda ?? ['ALMACENERO'])
      setSelectedSupervisores((configData?.data as any)?.roles_supervisores_entrega ?? [])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isLoading, configData])

  const handleSave = async () => {
    setSaving(true)
    try {
      await configuracionEntregaApi.update({
        roles_entrega_tienda:       selectedTienda,
        roles_supervisores_entrega: selectedSupervisores,
      })
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
      title="Configuración de roles — Entregas"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="Guardar"
      cancelText="Cancelar"
      confirmLoading={saving}
      width={440}
    >
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spin />
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <Title level={5} className="!mb-1">Recojo en Tienda</Title>
            <Text type="secondary" className="block mb-3 text-sm">
              Roles que pueden ver y confirmar órdenes de Recojo en Tienda no asignadas.
            </Text>
            <Checkbox.Group
              value={selectedTienda}
              onChange={(vals) => setSelectedTienda(vals as string[])}
              className="flex flex-col gap-2"
            >
              {roles.map((rol) => (
                <Checkbox key={rol.value} value={rol.value}>
                  {rol.label}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </div>

          <Divider className="!my-3" />

          <div>
            <Title level={5} className="!mb-1">Supervisores de Entregas</Title>
            <Text type="secondary" className="block mb-3 text-sm">
              Roles que pueden ver <strong>todas</strong> las entregas (tienda y domicilio) sin importar a quién están asignadas.
            </Text>
            <Checkbox.Group
              value={selectedSupervisores}
              onChange={(vals) => setSelectedSupervisores(vals as string[])}
              className="flex flex-col gap-2"
            >
              {roles.map((rol) => (
                <Checkbox key={rol.value} value={rol.value}>
                  {rol.label}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </div>
        </div>
      )}
    </Modal>
  )
}
