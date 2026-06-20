'use client'

import { useMemo, useState } from 'react'
import { App, Form, Input, Modal, Popconfirm, Switch, Tag } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import ButtonBase from '~/components/buttons/button-base'
import { blueColors } from '~/lib/colors'
import { vehiculosApi, type Vehiculo } from '~/lib/api/catalogos'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface VehiculoFormValues {
  name: string
  tipo: string
  marca_modelo?: string
  placa?: string
}

export default function TabVehiculos() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Vehiculo | null>(null)
  const [form] = Form.useForm<VehiculoFormValues>()

  const { data: vehiculos = [], isLoading } = useQuery({
    queryKey: [QueryKeys.VEHICULOS],
    queryFn: async () => {
      const res = await vehiculosApi.getAll()
      return res.data?.data || []
    },
  })

  const invalidar = () => queryClient.invalidateQueries({ queryKey: [QueryKeys.VEHICULOS] })

  const guardarMutation = useMutation({
    mutationFn: async (values: VehiculoFormValues) => {
      const payload: any = {
        name: values.name.trim().toUpperCase(),
        tipo: values.tipo.trim().toUpperCase(),
        marca_modelo: values.marca_modelo?.trim() || null,
        placa: values.placa?.trim() || null,
      }
      if (editando) {
        return vehiculosApi.update(editando.id, payload)
      }
      return vehiculosApi.create(payload)
    },
    onSuccess: (res: any) => {
      if (res?.error) {
        message.error(res.error.message || 'Error al guardar el vehículo')
        return
      }
      message.success(editando ? 'Vehículo actualizado' : 'Vehículo creado')
      cerrarModal()
      invalidar()
    },
    onError: (e: any) => message.error(e?.message || 'Error al guardar el vehículo'),
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => vehiculosApi.delete(id),
    onSuccess: (res: any) => {
      if (res?.error) {
        message.error(res.error.message || 'No se pudo eliminar')
        return
      }
      message.success('Vehículo eliminado')
      invalidar()
    },
    onError: (e: any) => message.error(e?.message || 'No se pudo eliminar'),
  })

  const toggleMutation = useMutation({
    mutationFn: (v: Vehiculo) => vehiculosApi.update(v.id, { estado: v.estado === false }),
    onSuccess: (res: any) => {
      if (res?.error) {
        message.error(res.error.message || 'No se pudo cambiar el estado')
        return
      }
      invalidar()
    },
    onError: (e: any) => message.error(e?.message || 'No se pudo cambiar el estado'),
  })

  const abrirCrear = () => {
    setEditando(null)
    form.resetFields()
    setModalOpen(true)
  }

  const abrirEditar = (v: Vehiculo) => {
    setEditando(v)
    form.setFieldsValue({
      name: v.name,
      tipo: v.tipo,
      marca_modelo: v.marca_modelo || undefined,
      placa: v.placa || undefined,
    })
    setModalOpen(true)
  }

  const cerrarModal = () => {
    setModalOpen(false)
    setEditando(null)
    form.resetFields()
  }

  const columnDefs = useMemo<ColDef<Vehiculo>[]>(
    () => [
      {
        headerName: 'Estado',
        field: 'estado',
        width: 100,
        cellRenderer: (params: { data: Vehiculo }) => (
          <div className='flex items-center h-full'>
            <Switch
              size='small'
              checked={params.data.estado !== false}
              disabled={toggleMutation.isPending}
              onChange={() => toggleMutation.mutate(params.data)}
            />
          </div>
        ),
      },
      {
        headerName: 'Nombre',
        field: 'name',
        flex: 1,
        minWidth: 180,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: { data: Vehiculo }) => (
          <span className={`font-medium ${params.data.estado === false ? 'text-gray-400 line-through' : ''}`}>
            {params.data.name}
          </span>
        ),
      },
      {
        headerName: 'Tipo',
        field: 'tipo',
        width: 140,
        filter: 'agTextColumnFilter',
        valueGetter: (params) => params.data?.tipo || '-',
      },
      {
        headerName: 'Marca/Modelo',
        field: 'marca_modelo',
        flex: 1,
        minWidth: 160,
        filter: 'agTextColumnFilter',
        valueGetter: (params) => params.data?.marca_modelo || '-',
      },
      {
        headerName: 'Placa',
        field: 'placa',
        width: 130,
        filter: 'agTextColumnFilter',
        valueGetter: (params) => params.data?.placa || '-',
      },
      {
        headerName: 'Acciones',
        width: 140,
        pinned: 'right',
        sortable: false,
        filter: false,
        cellRenderer: (params: { data: Vehiculo }) => {
          const v = params.data
          return (
            <div className='flex gap-2 items-center h-full'>
              <ButtonBase size='sm' color='warning' onClick={() => abrirEditar(v)}>
                <FaEdit />
              </ButtonBase>
              <Popconfirm
                title='¿Eliminar este vehículo?'
                description='Esta acción no se puede deshacer'
                okText='Sí, eliminar'
                cancelText='Cancelar'
                okButtonProps={{ danger: true }}
                onConfirm={() => eliminarMutation.mutate(v.id)}
              >
                <ButtonBase size='sm' color='danger'>
                  <FaTrash />
                </ButtonBase>
              </Popconfirm>
            </div>
          )
        },
      },
    ],
    [toggleMutation, eliminarMutation]
  )

  return (
    <div className='mt-4 space-y-4'>
      <div className='flex justify-end'>
        <ButtonBase color='success' size='md' onClick={abrirCrear} className='flex items-center gap-2'>
          <FaPlus />
          Nuevo Vehículo
        </ButtonBase>
      </div>

      <TableWithTitle
        id='configuracion-vehiculos'
        title='Vehículos'
        extraTitle={<Tag color='blue'>{vehiculos.length} total</Tag>}
        rowData={vehiculos}
        columnDefs={columnDefs}
        loading={isLoading}
        domLayout='autoHeight'
        selectionColor={blueColors[0]}
        pagination={true}
        paginationPageSize={20}
        getRowId={(params) => String(params.data.id)}
      />

      <Modal
        title={editando ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        open={modalOpen}
        onCancel={cerrarModal}
        onOk={() => form.submit()}
        okText={editando ? 'Guardar' : 'Crear'}
        cancelText='Cancelar'
        confirmLoading={guardarMutation.isPending}
        destroyOnHidden
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={(values) => guardarMutation.mutate(values)}
          className='mt-4'
        >
          <Form.Item
            label='Nombre'
            name='name'
            rules={[{ required: true, message: 'El nombre es requerido' }]}
            normalize={(v) => (typeof v === 'string' ? v.toUpperCase() : v)}
          >
            <Input placeholder='Nombre del vehículo' />
          </Form.Item>
          <Form.Item
            label='Tipo (MOTO, CAMION, etc.)'
            name='tipo'
            rules={[{ required: true, message: 'El tipo es requerido' }]}
            normalize={(v) => (typeof v === 'string' ? v.toUpperCase() : v)}
          >
            <Input placeholder='MOTO, CAMION...' />
          </Form.Item>
          <Form.Item label='Marca / Modelo' name='marca_modelo'>
            <Input placeholder='Marca / Modelo' />
          </Form.Item>
          <Form.Item label='Placa' name='placa'>
            <Input placeholder='Placa' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
