'use client'

import { useState } from 'react'
import { App, Button, Checkbox, Modal, Select, Tag, Spin } from 'antd'
import { FaCopy, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { useMutation, useQuery } from '@tanstack/react-query'
import { almacenesApi } from '~/lib/api/almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import TablaCatalogo from '../tabla-catalogo'

type AlmacenEstado = {
  id: number
  name: string
  total_productos: number
  replicado: boolean
}

export default function TabAlmacenes() {
  const { notification } = App.useApp()
  const almacenIdStore = useStoreAlmacen(s => s.almacen_id)
  const [modalOpen, setModalOpen] = useState(false)
  const [origenId, setOrigenId] = useState<number | undefined>(almacenIdStore)
  const [seleccionados, setSeleccionados] = useState<number[]>([])

  const { data: almacenes = [] } = useQuery({
    queryKey: [QueryKeys.ALMACENES, 'activos'],
    queryFn: async () => {
      const res = await almacenesApi.getAll(true) // incluir inactivos
      return res.data?.data || []
    },
  })

  const {
    data: estadoData,
    isLoading: loadingEstado,
    refetch: refetchEstado,
  } = useQuery({
    queryKey: ['almacen-estado-replicacion', origenId],
    queryFn: async () => {
      const res = await almacenesApi.estadoReplicacion(origenId!)
      return (res.data as any)?.data ?? res.data
    },
    enabled: !!origenId && modalOpen,
    staleTime: 0,
  })

  const destinos: AlmacenEstado[] = estadoData?.almacenes ?? []
  const totalOrigen = estadoData?.total_origen ?? 0

  function handleOrigenChange(id: number) {
    setOrigenId(id)
    setSeleccionados([])
  }

  function toggleSeleccion(id: number) {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function seleccionarSinReplicar() {
    setSeleccionados(destinos.filter(d => !d.replicado).map(d => d.id))
  }

  const mutation = useMutation({
    mutationFn: () => almacenesApi.replicarProductos(origenId!, seleccionados),
    onSuccess: (res) => {
      const d = (res.data as any)?.data
      notification.success({
        message: 'Replicación completada',
        description: `${d?.creados ?? 0} productos creados en ${d?.almacenes_actualizados ?? 0} almacén(es). ${d?.ya_existian ?? 0} ya existían.`,
        duration: 8,
      })
      setSeleccionados([])
      refetchEstado()
    },
    onError: () => {
      notification.error({ message: 'Error al replicar productos' })
    },
  })

  const sinReplicar = destinos.filter(d => !d.replicado)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <div>
          <p className="font-semibold text-amber-800 text-sm">Replicar productos a otros almacenes</p>
          <p className="text-amber-700 text-xs mt-0.5">
            Copia productos de un almacén origen a los destinos que elijas. Stock 0, mismos precios.
          </p>
        </div>
        <Button icon={<FaCopy />} onClick={() => setModalOpen(true)} className="min-w-fit">
          Replicar
        </Button>
      </div>

      <TablaCatalogo
        queryKey={QueryKeys.ALMACENES}
        fetchFn={async () => {
          const res = await almacenesApi.getAll(true)
          return res.data?.data || []
        }}
        createFn={data => almacenesApi.create(data)}
        updateFn={(id, data) => almacenesApi.update(id, data)}
        deleteFn={id => almacenesApi.delete(id)}
        nameField='name'
        statusField='activo'
        entityName='Almacén'
        extraColumns={[
          {
            key: 'direccion',
            label: 'Dirección',
            render: (item: any) => <span className='text-gray-500 text-xs'>{item.direccion || '-'}</span>,
          },
        ]}
      />

      <Modal
        title="Replicar productos entre almacenes"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setOrigenId(almacenIdStore); setSeleccionados([]) }}
        onOk={() => mutation.mutate()}
        okText="Replicar seleccionados"
        cancelText="Cancelar"
        confirmLoading={mutation.isPending}
        okButtonProps={{ disabled: seleccionados.length === 0 || mutation.isPending }}
        width={520}
      >
        <div className="flex flex-col gap-4 py-2">
          {/* Origen */}
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">ALMACÉN ORIGEN</p>
            <Select
              placeholder="Seleccionar almacén de origen"
              className="w-full"
              value={origenId}
              onChange={handleOrigenChange}
              options={almacenes.map((a: any) => ({ value: a.id, label: a.name }))}
            />
            {origenId && totalOrigen > 0 && (
              <p className="text-xs text-gray-400 mt-1">{totalOrigen} productos en este almacén</p>
            )}
          </div>

          {/* Destinos */}
          {origenId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-medium">ALMACENES DESTINO</p>
                {sinReplicar.length > 0 && (
                  <button
                    onClick={seleccionarSinReplicar}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Seleccionar todos sin replicar ({sinReplicar.length})
                  </button>
                )}
              </div>

              {loadingEstado ? (
                <div className="flex justify-center py-6"><Spin /></div>
              ) : destinos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No hay otros almacenes activos</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {destinos.map(d => (
                    <div
                      key={d.id}
                      onClick={() => !d.replicado && toggleSeleccion(d.id)}
                      className={`flex items-center justify-between border rounded-lg px-3 py-2 transition-colors ${
                        d.replicado
                          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                          : seleccionados.includes(d.id)
                          ? 'border-blue-400 bg-blue-50 cursor-pointer'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox disabled={d.replicado} checked={seleccionados.includes(d.id)} onChange={() => toggleSeleccion(d.id)} />
                        <span className="font-medium text-sm">{d.name}</span>
                        <span className="text-xs text-gray-400">({d.total_productos} productos)</span>
                      </div>
                      {d.replicado ? (
                        <Tag icon={<FaCheckCircle className="mr-1" />} color="success">
                          Replicado
                        </Tag>
                      ) : (
                        <Tag icon={<FaTimesCircle className="mr-1" />} color="default">
                          Sin replicar
                        </Tag>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
