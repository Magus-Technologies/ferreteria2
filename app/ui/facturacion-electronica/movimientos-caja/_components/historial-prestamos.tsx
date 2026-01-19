'use client'

import { useState, useEffect, useRef } from 'react'
import { Spin, Tag, Button, message, App } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { transaccionesCajaApi, type Prestamo } from '~/lib/api/transacciones-caja'
import TableBase from '~/components/tables/table-base'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'

export default function HistorialPrestamos() {
  const { modal } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const gridRef = useRef<AgGridReact<Prestamo>>(null)

  const fetchPrestamos = async () => {
    setLoading(true)
    try {
      const response = await transaccionesCajaApi.getPrestamos({
        page: 1,
        per_page: 100,
      })

      if (response.error) {
        console.error('Error al cargar préstamos:', response.error)
        setPrestamos([])
        return
      }

      if (response.data?.data) {
        setPrestamos(response.data.data.data || [])
      }
    } catch (error) {
      console.error('Error al cargar préstamos:', error)
      setPrestamos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrestamos()
  }, [])

  const handleDevolverPrestamo = (prestamo: Prestamo) => {
    modal.confirm({
      title: '¿Devolver Préstamo?',
      content: (
        <div>
          <p>
            ¿Confirmas la devolución del préstamo de <strong>S/ {prestamo.monto}</strong>?
          </p>
          <p className="text-sm text-gray-600 mt-2">
            De: {prestamo.sub_caja_destino.nombre} → A: {prestamo.sub_caja_origen.nombre}
          </p>
        </div>
      ),
      okText: 'Sí, devolver',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          const response = await transaccionesCajaApi.devolverPrestamo(prestamo.id)

          if (response.error) {
            message.error(response.error.message || 'Error al devolver préstamo')
            return
          }

          message.success('Préstamo devuelto exitosamente')
          fetchPrestamos()
        } catch (error) {
          console.error('Error al devolver préstamo:', error)
          message.error('Error inesperado al devolver préstamo')
        }
      },
    })
  }

  const columns: ColDef<Prestamo>[] = [
    {
      headerName: 'Fecha',
      field: 'fecha_prestamo',
      width: 180,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      headerName: 'Monto',
      field: 'monto',
      width: 120,
      valueFormatter: (params) => `S/ ${parseFloat(params.value).toFixed(2)}`,
      cellStyle: { fontWeight: 'bold', color: '#059669' },
    },
    {
      headerName: 'Quien Presta',
      field: 'user_presta.name',
      width: 200,
    },
    {
      headerName: 'Sub-Caja Origen',
      field: 'sub_caja_origen.nombre',
      width: 180,
    },
    {
      headerName: 'Quien Recibe',
      field: 'user_recibe.name',
      width: 200,
    },
    {
      headerName: 'Sub-Caja Destino',
      field: 'sub_caja_destino.nombre',
      width: 180,
    },
    {
      headerName: 'Motivo',
      field: 'motivo',
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: 'Estado',
      field: 'estado',
      width: 130,
      cellRenderer: (params: any) => {
        const estado = params.value
        if (estado === 'pendiente') {
          return <Tag color="orange">Pendiente</Tag>
        }
        if (estado === 'devuelto') {
          return <Tag color="green">Devuelto</Tag>
        }
        return <Tag color="red">Cancelado</Tag>
      },
    },
    {
      headerName: 'Acciones',
      width: 120,
      cellRenderer: (params: any) => {
        const prestamo = params.data as Prestamo
        if (prestamo.estado !== 'pendiente') return null

        return (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleDevolverPrestamo(prestamo)}
          >
            Devolver
          </Button>
        )
      },
    },
  ]

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large" tip="Cargando préstamos..." />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold">Historial de Préstamos</span>
        <span className="text-sm text-slate-500">Total: {prestamos.length} préstamos</span>
      </div>
      <div className="h-[500px] w-full">
        <TableBase<Prestamo>
          ref={gridRef}
          rowData={prestamos}
          columnDefs={columns}
          rowSelection={false}
          withNumberColumn={true}
          headerColor="var(--color-amber-600)"
        />
      </div>
    </div>
  )
}
