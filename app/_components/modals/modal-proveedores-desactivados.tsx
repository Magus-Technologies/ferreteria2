'use client'

import { useRef, useState, useMemo } from 'react'
import { Modal, Button, App, Input } from 'antd'
import { useModalProveedoresDesactivados } from '~/app/_stores/store-modal-proveedores-desactivados'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '~/lib/api'
import { CheckCircleOutlined, SearchOutlined } from '@ant-design/icons'
import TableWithTitle from '~/components/tables/table-with-title'
import type { ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'

interface Proveedor {
  id: number
  razon_social: string
  ruc: string
  direccion: string | null
  telefono: string | null
  email: string | null
  estado: boolean
  vendedores?: any[]
  carros?: any[]
  choferes?: any[]
}

export default function ModalProveedoresDesactivados() {
  const { isOpen, closeModal } = useModalProveedoresDesactivados()
  const queryClient = useQueryClient()
  const { notification } = App.useApp()
  const tableRef = useRef<AgGridReact<Proveedor>>(null)
  const [searchText, setSearchText] = useState('')

  // Obtener proveedores desactivados
  const { data, isLoading } = useQuery({
    queryKey: ['proveedores-desactivados'],
    queryFn: async () => {
      const response = await apiRequest<{ data: Proveedor[] }>('/proveedores?estado=0&per_page=100')
      return response.data?.data || []
    },
    enabled: isOpen,
  })

  // Mutación para activar proveedor
  const activarMutation = useMutation({
    mutationFn: async (proveedor: Proveedor) => {
      const response = await apiRequest(`/proveedores/${proveedor.id}`, {
        method: 'PUT',
        data: {
          razon_social: proveedor.razon_social,
          ruc: proveedor.ruc,
          direccion: proveedor.direccion,
          telefono: proveedor.telefono,
          email: proveedor.email,
          estado: 1, // Enviar como número 1 en lugar de boolean
          vendedores: proveedor.vendedores || [],
          carros: proveedor.carros || [],
          choferes: proveedor.choferes || [],
        },
      })
      return response.data
    },
    onSuccess: (data, variables) => {
      notification.success({
        message: 'Proveedor activado',
        description: 'El proveedor ha sido activado exitosamente',
      })
      
      // Refrescar la lista de proveedores desactivados
      queryClient.invalidateQueries({ queryKey: ['proveedores-desactivados'] })
      queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      
      // Actualizar el cache optimísticamente removiendo el proveedor de la lista
      queryClient.setQueryData(['proveedores-desactivados'], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.filter((p: Proveedor) => p.id !== variables.id)
        }
      })
    },
    onError: (error: any) => {
      notification.error({
        message: 'Error',
        description: error?.response?.data?.error?.message || 'Error al activar proveedor',
      })
    },
  })

  const columnDefs: ColDef<Proveedor>[] = [
    {
      headerName: 'RUC',
      field: 'ruc',
      width: 120,
      pinned: 'left',
    },
    {
      headerName: 'Razón Social',
      field: 'razon_social',
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: 'Estado',
      field: 'estado',
      width: 120,
      cellRenderer: (params: any) => {
        const estado = params.data?.estado
        return (
          <div className="flex items-center justify-center h-full">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {estado ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        )
      },
    },
    {
      headerName: 'Dirección',
      field: 'direccion',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.data?.direccion || '-',
    },
    {
      headerName: 'Teléfono',
      field: 'telefono',
      width: 120,
      valueGetter: (params) => params.data?.telefono || '-',
    },
    {
      headerName: 'Email',
      field: 'email',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.data?.email || '-',
    },
    {
      headerName: 'Acciones',
      width: 100,
      pinned: 'right',
      cellRenderer: (params: any) => {
        const proveedor = params.data
        if (!proveedor) return null

        return (
          <div className="flex items-center justify-center h-full">
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => activarMutation.mutate(proveedor)}
              loading={activarMutation.isPending}
            />
          </div>
        )
      },
    },
  ]

  const proveedores = data || []

  // Filtrado inteligente
  const proveedoresFiltrados = useMemo(() => {
    if (!searchText.trim()) return proveedores

    const searchLower = searchText.toLowerCase().trim()
    
    return proveedores.filter((proveedor) => {
      const ruc = proveedor.ruc?.toLowerCase() || ''
      const razonSocial = proveedor.razon_social?.toLowerCase() || ''
      const direccion = proveedor.direccion?.toLowerCase() || ''
      const telefono = proveedor.telefono?.toLowerCase() || ''
      const email = proveedor.email?.toLowerCase() || ''

      return (
        ruc.includes(searchLower) ||
        razonSocial.includes(searchLower) ||
        direccion.includes(searchLower) ||
        telefono.includes(searchLower) ||
        email.includes(searchLower)
      )
    })
  }, [proveedores, searchText])

  return (
    <Modal
      title="Proveedores Desactivados"
      open={isOpen}
      onCancel={closeModal}
      footer={null}
      width={1000}
      destroyOnClose
      styles={{ body: { height: '600px', padding: '16px' } }}
    >
      <div className="flex flex-col gap-3 h-full">
        {/* Buscador inteligente */}
        <Input
          placeholder="Buscar por RUC, razón social, dirección, teléfono o email..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="large"
          className="mb-2"
        />

        {proveedoresFiltrados.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center flex-1 text-gray-500">
            {searchText ? 'No se encontraron proveedores con ese criterio' : 'No hay proveedores desactivados'}
          </div>
        ) : (
          <div className="flex-1">
            <TableWithTitle<Proveedor>
              id="proveedores-desactivados"
              title="PROVEEDORES DESACTIVADOS"
              loading={isLoading}
              columnDefs={columnDefs}
              rowData={proveedoresFiltrados}
              tableRef={tableRef}
              domLayout="normal"
              selectionColor="#d1fae5"
              headerColor="var(--color-emerald-600)"
              isVisible={isOpen}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
              }}
              getRowId={(params) => params.data.id.toString()}
              className="h-full"
              exportExcel={true}
              exportPdf={true}
              selectColumns={true}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
