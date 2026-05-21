'use client'

import { App, Button, Select, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { FaWarehouse, FaMapMarkerAlt } from 'react-icons/fa'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import LabelBase from '~/components/form/label-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import { almacenesApi } from '~/lib/api/almacen'
import { empresaApi } from '~/lib/api/empresa'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { buildSlotsDireccionEmpresa } from '~/lib/utils/empresa-direcciones-form'
import type { Almacen } from '~/app/_types/almacen'

type AlmacenEditState = {
  id: number
  name: string
  direccion: string
  empresa_dir_slot: 'D1' | 'D2' | 'D3' | 'D4' | null
}

const SLOTS = ['D1', 'D2', 'D3', 'D4'] as const
const SLOT_COLORS: Record<string, string> = {
  D1: 'green',
  D2: 'blue',
  D3: 'orange',
  D4: 'purple',
}

interface FormAlmacenesEmpresaProps {
  empresaId: number
}

export default function FormAlmacenesEmpresa({ empresaId }: FormAlmacenesEmpresaProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [almacenesState, setAlmacenesState] = useState<AlmacenEditState[]>([])

  const { data: almacenesResp, isLoading: loadingAlmacenes } = useQuery({
    queryKey: [QueryKeys.ALMACENES, 'all'],
    queryFn: () => almacenesApi.getAll(true), // incluir inactivos
  })

  const { data: empresaResp } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, empresaId],
    queryFn: () => empresaApi.getById(empresaId),
    enabled: !!empresaId,
  })

  // Sync estado local cuando llegan los datos
  useEffect(() => {
    const lista = almacenesResp?.data?.data || []
    setAlmacenesState(
      lista.map((a: Almacen) => ({
        id: a.id,
        name: a.name,
        direccion: a.direccion || '',
        empresa_dir_slot: (a.empresa_dir_slot ?? null) as AlmacenEditState['empresa_dir_slot'],
      }))
    )
  }, [almacenesResp])

  const slots = buildSlotsDireccionEmpresa(empresaResp?.data?.data?.direcciones)

  const slotOptions = [
    { value: null, label: 'Sin asignar' },
    ...SLOTS.map((slot) => {
      const slotData = slots.find((s) => s.tipo === slot)
      const label = slotData?.direccion
        ? `${slot} — ${slotData.direccion.alias || slotData.direccion.direccion || slot}`
        : slot
      return { value: slot, label }
    }),
  ]

  // Check: no dos almacenes con el mismo slot
  const slotUsado = (slot: string | null, propioId: number) => {
    if (!slot) return false
    return almacenesState.some((a) => a.id !== propioId && a.empresa_dir_slot === slot)
  }

  const updateMutation = useMutation({
    mutationFn: async (almacen: AlmacenEditState) =>
      almacenesApi.update(almacen.id, {
        name: almacen.name,
        direccion: almacen.direccion || undefined,
        empresa_dir_slot: almacen.empresa_dir_slot,
      }),
  })

  const handleGuardar = async () => {
    // Detectar conflictos de slot
    const slotsAsignados = almacenesState
      .filter((a) => a.empresa_dir_slot)
      .map((a) => a.empresa_dir_slot)
    const duplicados = slotsAsignados.filter((s, i) => slotsAsignados.indexOf(s) !== i)
    if (duplicados.length > 0) {
      message.error(`El slot ${duplicados[0]} está asignado a más de un almacén`)
      return
    }

    try {
      await Promise.all(almacenesState.map((a) => updateMutation.mutateAsync(a)))
      message.success('Almacenes actualizados correctamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ALMACENES] })
    } catch {
      message.error('Error al guardar cambios')
    }
  }

  const updateAlmacen = (id: number, patch: Partial<AlmacenEditState>) => {
    setAlmacenesState((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    )
  }

  if (loadingAlmacenes) {
    return <div className="text-gray-500 text-sm py-4">Cargando almacenes...</div>
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          Asocia cada almacén a un slot de dirección de empresa (D1–D4). Esto permite que en la{' '}
          <strong>Guía de Remisión</strong> se auto-complete el punto de partida/llegada y se
          bloquee la selección de dirección al elegir el almacén de traslado (Motivo 08).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {almacenesState.map((almacen) => {
          const conflicto = slotUsado(almacen.empresa_dir_slot, almacen.id)
          return (
            <div
              key={almacen.id}
              className={`bg-gray-50 p-4 rounded-lg border ${conflicto ? 'border-red-300' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <FaWarehouse className="text-gray-500" />
                <span className="font-semibold text-gray-700">{almacen.name}</span>
                {almacen.empresa_dir_slot && (
                  <Tag color={SLOT_COLORS[almacen.empresa_dir_slot]} className="!ml-2">
                    {almacen.empresa_dir_slot}
                  </Tag>
                )}
                {conflicto && (
                  <Tag color="red">⚠ Slot duplicado</Tag>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <LabelBase label="Dirección del almacén:" orientation="column">
                    <InputBase
                      value={almacen.direccion}
                      onChange={(e) =>
                        updateAlmacen(almacen.id, { direccion: e.target.value })
                      }
                      placeholder="Ingrese la dirección física del almacén"
                      uppercase={false}
                      prefix={
                        <FaMapMarkerAlt size={13} className="text-emerald-600 mx-1" />
                      }
                    />
                  </LabelBase>
                </div>

                <div>
                  <LabelBase label="Slot de dirección empresa:" orientation="column">
                    <Select
                      value={almacen.empresa_dir_slot}
                      onChange={(val) =>
                        updateAlmacen(almacen.id, {
                          empresa_dir_slot: val as AlmacenEditState['empresa_dir_slot'],
                        })
                      }
                      options={slotOptions}
                      placeholder="Sin asignar"
                      className="w-full"
                      status={conflicto ? 'error' : undefined}
                    />
                  </LabelBase>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {almacenesState.length === 0 && (
        <div className="text-gray-400 text-sm py-8 text-center">
          No hay almacenes configurados
        </div>
      )}

      <div className="flex justify-start pt-2">
        <Button
          type="primary"
          loading={updateMutation.isPending}
          disabled={updateMutation.isPending}
          onClick={handleGuardar}
          className="bg-cyan-500 hover:bg-cyan-600 px-8"
        >
          Guardar Almacenes
        </Button>
      </div>
    </div>
  )
}
