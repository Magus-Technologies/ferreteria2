'use client'

import { Modal, Input, App, Popconfirm, Switch } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { almacenesApi } from '~/lib/api/almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useState, useCallback } from 'react'
import { FaPlus, FaEdit, FaTrash, FaWarehouse, FaCheck, FaTimes } from 'react-icons/fa'
import { useStoreAlmacen } from '~/store/store-almacen'
import ButtonBase from '~/components/buttons/button-base'

interface ModalGestionarAlmacenesProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function ModalGestionarAlmacenes({ open, setOpen }: ModalGestionarAlmacenesProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const almacen_id = useStoreAlmacen(s => s.almacen_id)
  const setAlmacenId = useStoreAlmacen(s => s.setAlmacenId)

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editandoNombre, setEditandoNombre] = useState('')

  const { data: almacenes } = useQuery({
    queryKey: [QueryKeys.ALMACENES, 'gestion'],
    queryFn: async () => {
      const response = await almacenesApi.getAll(true) // incluir inactivos
      if (response.error) throw new Error(response.error.message)
      return response.data?.data || []
    },
    enabled: open,
  })

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: [QueryKeys.ALMACENES] })
  }

  // Crear
  const crearMutation = useMutation({
    mutationFn: async () => {
      if (!nuevoNombre.trim()) throw new Error('El nombre es requerido')
      return almacenesApi.create({ name: nuevoNombre.trim().toUpperCase() })
    },
    onSuccess: (res) => {
      if (res.error) { message.error(res.error.message); return }
      message.success('Sucursal creada')
      setNuevoNombre('')
      invalidar()
    },
    onError: (e: any) => message.error(e.message),
  })

  // Editar
  const editarMutation = useMutation({
    mutationFn: async () => {
      if (!editandoId || !editandoNombre.trim()) throw new Error('Datos incompletos')
      return almacenesApi.update(editandoId, { name: editandoNombre.trim().toUpperCase() })
    },
    onSuccess: (res) => {
      if (res.error) { message.error(res.error.message); return }
      message.success('Sucursal actualizada')
      setEditandoId(null)
      setEditandoNombre('')
      invalidar()
    },
    onError: (e: any) => message.error(e.message),
  })

  // Eliminar
  const eliminarMutation = useMutation({
    mutationFn: async (id: number) => almacenesApi.delete(id),
    onSuccess: (res, id) => {
      if (res.error) { message.error(res.error.message); return }
      message.success('Sucursal eliminada')
      if (almacen_id === id) setAlmacenId(1)
      invalidar()
    },
    onError: (e: any) => message.error(e.message),
  })

  // Toggle activo
  const toggleActivoMutation = useMutation({
    mutationFn: async (id: number) => almacenesApi.toggleActivo(id),
    onSuccess: (res) => {
      if (res.error) { message.error(res.error.message); return }
      const activo = res.data?.data?.activo
      message.success(activo ? 'Sucursal activada' : 'Sucursal desactivada')
      invalidar()
    },
    onError: (e: any) => message.error(e.message),
  })

  const handleClose = useCallback(() => {
    setEditandoId(null)
    setEditandoNombre('')
    setNuevoNombre('')
    setOpen(false)
  }, [setOpen])

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <FaWarehouse className='text-emerald-600' />
          <span>Gestionar Sucursales</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={500}
      destroyOnClose
    >
      {/* Crear nueva */}
      <div className='flex gap-2 mb-4'>
        <Input
          placeholder='Nombre de nueva sucursal...'
          value={nuevoNombre}
          onChange={e => setNuevoNombre(e.target.value)}
          onPressEnter={() => crearMutation.mutate()}
          maxLength={100}
        />
        <ButtonBase
          color='success'
          size='md'
          onClick={() => crearMutation.mutate()}
          className='flex items-center gap-1 flex-shrink-0'
          disabled={!nuevoNombre.trim()}
        >
          <FaPlus size={12} />
          Agregar
        </ButtonBase>
      </div>

      {/* Lista de almacenes */}
      <div className='divide-y border rounded-lg overflow-hidden'>
        {(almacenes || []).map(a => (
          <div key={a.id} className={`flex items-center gap-3 px-4 py-3 ${!a.activo ? 'bg-gray-50' : almacen_id === a.id ? 'bg-emerald-50' : 'bg-white'}`}>
            {editandoId === a.id ? (
              <>
                <Input
                  value={editandoNombre}
                  onChange={e => setEditandoNombre(e.target.value)}
                  onPressEnter={() => editarMutation.mutate()}
                  size='small'
                  className='flex-1'
                  autoFocus
                />
                <button
                  onClick={() => editarMutation.mutate()}
                  className='text-emerald-600 hover:text-emerald-800 p-1'
                  title='Guardar'
                >
                  <FaCheck size={14} />
                </button>
                <button
                  onClick={() => { setEditandoId(null); setEditandoNombre('') }}
                  className='text-gray-400 hover:text-gray-600 p-1'
                  title='Cancelar'
                >
                  <FaTimes size={14} />
                </button>
              </>
            ) : (
              <>
                <FaWarehouse className={!a.activo ? 'text-gray-300' : almacen_id === a.id ? 'text-emerald-600' : 'text-gray-400'} />
                <span className={`flex-1 font-medium text-sm ${!a.activo ? 'text-gray-400 line-through' : ''}`}>
                  {a.name}
                  {almacen_id === a.id && a.activo && (
                    <span className='ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold'>
                      ACTIVA
                    </span>
                  )}
                  {!a.activo && (
                    <span className='ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold'>
                      INACTIVA
                    </span>
                  )}
                </span>
                <Switch
                  size='small'
                  checked={a.activo}
                  onChange={() => toggleActivoMutation.mutate(a.id)}
                  loading={toggleActivoMutation.isPending}
                />
                <button
                  onClick={() => { setEditandoId(a.id); setEditandoNombre(a.name) }}
                  className='text-blue-500 hover:text-blue-700 p-1'
                  title='Editar'
                >
                  <FaEdit size={13} />
                </button>
                <Popconfirm
                  title='¿Eliminar esta sucursal?'
                  description='Se eliminarán los datos asociados'
                  onConfirm={() => eliminarMutation.mutate(a.id)}
                  okText='Sí, eliminar'
                  cancelText='Cancelar'
                >
                  <button
                    className='text-red-400 hover:text-red-600 p-1'
                    title='Eliminar'
                  >
                    <FaTrash size={13} />
                  </button>
                </Popconfirm>
              </>
            )}
          </div>
        ))}
        {(!almacenes || almacenes.length === 0) && (
          <div className='text-center py-6 text-gray-400 text-sm'>No hay sucursales</div>
        )}
      </div>
    </Modal>
  )
}
