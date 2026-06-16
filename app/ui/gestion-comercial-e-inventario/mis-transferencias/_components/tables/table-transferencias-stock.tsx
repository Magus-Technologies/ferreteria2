'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tag, Popconfirm, message } from 'antd'
import { formatFechaPeru } from '~/utils/fechas'
import { ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import TableWithTitle from '~/components/tables/table-with-title'
import { greenColors, blueColors } from '~/lib/colors'
import { QueryKeys } from '~/app/_lib/queryKeys'
import {
  transferenciaStockApi,
  type TransferenciaStock,
  type ProductoTransferenciaStock,
} from '~/lib/api/transferencia-stock'
import ButtonBase from '~/components/buttons/button-base'
import { FaBan, FaFilePdf, FaEdit, FaTruck } from 'react-icons/fa'
import ModalDocTransferenciaStock from '~/app/ui/gestion-comercial-e-inventario/_components/modals/modal-doc-transferencia-stock'
import ModalEditTransferenciaStock from '~/app/ui/gestion-comercial-e-inventario/_components/modals/modal-edit-transferencia-stock'
import { useStoreTransferenciaParaGuia } from '~/app/ui/facturacion-electronica/mis-guias/store/store-transferencia-para-guia'
import type { TransferenciasFilters } from '../../page'

function fmt(value: number | string): string {
  return Number(value).toFixed(3).replace(/\.?0+$/, '')
}

const columns: ColDef<TransferenciaStock>[] = [
  {
    colId: 'fecha',
    headerName: 'Fecha',
    field: 'fecha',
    width: 200,
    minWidth: 180,
    valueFormatter: (params) =>
      formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') || '-',
    sort: 'desc',
  },
  {
    colId: 'numero',
    headerName: 'N°',
    valueGetter: (params) =>
      params.data
        ? `TS${String(params.data.serie).padStart(4, '0')}-${String(params.data.numero).padStart(8, '0')}`
        : '-',
    width: 160,
    minWidth: 140,
  },
  {
    colId: 'producto',
    headerName: 'Producto',
    valueGetter: (params) => {
      const prod = params.data?.productos?.[0]
      if (!prod) return '-'
      return `${prod.producto_almacen_origen?.producto?.cod_producto} - ${prod.producto_almacen_origen?.producto?.name}`
    },
    flex: 1,
    minWidth: 250,
  },
  {
    colId: 'cantidad',
    headerName: 'Cantidad',
    valueGetter: (params) => {
      const prod = params.data?.productos?.[0]
      if (!prod) return '-'
      return `${fmt(prod.cantidad)} ${prod.unidad_derivada_inmutable?.name || ''}`
    },
    width: 140,
    minWidth: 120,
  },
  {
    colId: 'origen',
    headerName: 'Origen',
    valueGetter: (params) => params.data?.almacen_origen?.name || '-',
    width: 160,
    minWidth: 130,
    cellRenderer: (params: any) => (
      <div className="flex items-center h-full">
        <Tag color="red" className="!m-0">{params.value}</Tag>
      </div>
    ),
  },
  {
    colId: 'destino',
    headerName: 'Destino',
    valueGetter: (params) => params.data?.almacen_destino?.name || '-',
    width: 160,
    minWidth: 130,
    cellRenderer: (params: any) => (
      <div className="flex items-center h-full">
        <Tag color="green" className="!m-0">{params.value}</Tag>
      </div>
    ),
  },
  {
    colId: 'usuario',
    headerName: 'Usuario',
    valueGetter: (params) => params.data?.user?.name || '-',
    width: 150,
    minWidth: 120,
  },
  {
    colId: 'estado',
    headerName: 'Estado',
    field: 'estado',
    width: 100,
    minWidth: 90,
    cellRenderer: (params: any) => (
      <div className="flex items-center h-full">
        <Tag color={params.value ? 'green' : 'red'} className="!m-0">
          {params.value ? 'Activo' : 'Anulado'}
        </Tag>
      </div>
    ),
  },
  {
    colId: 'observaciones',
    headerName: 'Observaciones',
    field: 'descripcion',
    width: 180,
    minWidth: 120,
    valueFormatter: (params) => params.value || '-',
  },
]

const detalleColumns: ColDef<ProductoTransferenciaStock>[] = [
  {
    headerName: 'Código',
    valueGetter: (p) => p.data?.producto_almacen_origen?.producto?.cod_producto || '-',
    width: 110,
  },
  {
    headerName: 'Producto',
    valueGetter: (p) => p.data?.producto_almacen_origen?.producto?.name || '-',
    flex: 1,
    minWidth: 200,
  },
  {
    headerName: 'Unidad',
    valueGetter: (p) => p.data?.unidad_derivada_inmutable?.name || '-',
    width: 100,
  },
  {
    headerName: 'Cantidad',
    valueGetter: (p) => (p.data ? fmt(p.data.cantidad) : '-'),
    width: 100,
  },
  {
    headerName: 'Stock Ant. Origen',
    valueGetter: (p) => (p.data ? fmt(p.data.stock_anterior_origen) : '-'),
    width: 140,
    cellRenderer: (params: any) => (
      <div className="flex items-center h-full font-bold text-yellow-600">{params.value}</div>
    ),
  },
  {
    headerName: 'Stock Nuevo Origen',
    valueGetter: (p) => (p.data ? fmt(p.data.stock_nuevo_origen) : '-'),
    width: 145,
    cellRenderer: (params: any) => {
      const val = Number(params.value)
      return (
        <div className={`flex items-center h-full font-bold ${val < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          {params.value}
        </div>
      )
    },
  },
  {
    headerName: 'Stock Ant. Destino',
    valueGetter: (p) => (p.data ? fmt(p.data.stock_anterior_destino) : '-'),
    width: 140,
    cellRenderer: (params: any) => (
      <div className="flex items-center h-full font-bold text-yellow-600">{params.value}</div>
    ),
  },
  {
    headerName: 'Stock Nuevo Destino',
    valueGetter: (p) => (p.data ? fmt(p.data.stock_nuevo_destino) : '-'),
    width: 148,
    cellRenderer: (params: any) => (
      <div className="flex items-center h-full font-bold text-emerald-600">{params.value}</div>
    ),
  },
  {
    headerName: 'Costo',
    valueGetter: (p) => (p.data ? `S/. ${Number(p.data.costo).toFixed(4).replace(/\.?0+$/, '')}` : '-'),
    width: 110,
  },
]

export default function TableTransferenciasStock({
  filters,
}: {
  filters?: TransferenciasFilters
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const tableRef = useRef<AgGridReact<TransferenciaStock>>(null)
  const setTransferenciaParaGuia = useStoreTransferenciaParaGuia((s) => s.setTransferencia)
  const [openDoc, setOpenDoc] = useState(false)
  const [docData, setDocData] = useState<TransferenciaStock | undefined>()
  const [openEdit, setOpenEdit] = useState(false)
  const [editData, setEditData] = useState<TransferenciaStock | null>(null)
  const [selectedTransferencia, setSelectedTransferencia] = useState<TransferenciaStock | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.TRANSFERENCIAS_STOCK, filters],
    queryFn: async () => {
      const result = await transferenciaStockApi.getAll({
        almacen_id: filters?.almacen_id || undefined,
        desde: filters?.desde || undefined,
        hasta: filters?.hasta || undefined,
        per_page: 500,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
  })

  // Auto-select first row when data loads
  useEffect(() => {
    if (data?.data && data.data.length > 0 && tableRef.current) {
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0)
        if (firstNode) {
          firstNode.setSelected(true)
          setSelectedTransferencia(firstNode.data ?? null)
        }
      }, 100)
    }
  }, [data])

  const anularMutation = useMutation({
    mutationFn: (id: number) => transferenciaStockApi.anular(id),
    onSuccess: () => {
      message.success('Transferencia anulada')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TRANSFERENCIAS_STOCK] })
      queryClient.invalidateQueries({ queryKey: ['productos-infinite'] })
      setSelectedTransferencia(null)
    },
    onError: (error: any) => {
      message.error(error?.message || 'Error al anular')
    },
  })

  const accionesColumn: ColDef<TransferenciaStock> = {
    colId: 'acciones',
    headerName: 'Acciones',
    width: 145,
    minWidth: 120,
    cellRenderer: (params: any) => {
      if (!params.data) return null
      return (
        <div className="flex items-center h-full gap-1">
          {params.data.estado && (
            <ButtonBase
              color="warning"
              size="sm"
              type="button"
              title="Editar"
              onClick={() => {
                setEditData(params.data)
                setOpenEdit(true)
              }}
            >
              <FaEdit size={12} />
            </ButtonBase>
          )}
          <ButtonBase
            color="success"
            size="sm"
            type="button"
            disabled={!params.data.estado}
            title={
              params.data.estado
                ? 'Crear Guía de Remisión'
                : 'No se puede generar la guía: transferencia anulada'
            }
            onClick={() => {
              if (!params.data.estado) return
              setTransferenciaParaGuia(params.data)
              router.push(`/ui/facturacion-electronica/mis-guias/crear-guia?from_transferencia=true&motivo_codigo=08&transferencia_id=${params.data.id}`)
            }}
          >
            <FaTruck size={12} />
          </ButtonBase>
          <ButtonBase
            color="info"
            size="sm"
            type="button"
            title="Ver PDF"
            onClick={() => {
              setDocData(params.data)
              setOpenDoc(true)
            }}
          >
            <FaFilePdf size={12} />
          </ButtonBase>
          {params.data.estado && (
            <Popconfirm
              title="¿Anular esta transferencia?"
              description="Se revertirán los movimientos de stock"
              onConfirm={() => anularMutation.mutate(params.data.id)}
              okText="Sí, anular"
              cancelText="No"
            >
              <ButtonBase color="danger" size="sm" type="button" title="Anular">
                <FaBan size={12} />
              </ButtonBase>
            </Popconfirm>
          )}
        </div>
      )
    },
  }

  const detalleTitle = selectedTransferencia
    ? `Detalle — TS${String(selectedTransferencia.serie).padStart(4, '0')}-${String(selectedTransferencia.numero).padStart(8, '0')} · ${selectedTransferencia.almacen_origen?.name} → ${selectedTransferencia.almacen_destino?.name}`
    : 'Detalle de Transferencia'

  return (
    <>
      <ModalDocTransferenciaStock open={openDoc} setOpen={setOpenDoc} data={docData} />
      <ModalEditTransferenciaStock
        open={openEdit}
        setOpen={setOpenEdit}
        transferencia={editData}
        onSuccess={(updated) => {
          if (selectedTransferencia?.id === updated.id) setSelectedTransferencia(updated)
        }}
      />

      <div className="h-[350px]">
      <TableWithTitle<TransferenciaStock>
        id="transferencias-stock.historial"
        title="Historial de Transferencias de Stock"
        selectionColor={greenColors[10]}
        columnDefs={[...columns, accionesColumn]}
        rowData={data?.data || []}
        loading={isLoading}
        pagination={false}
        tableRef={tableRef}
        rowSelection
        onRowClicked={(e) => {
          if (e.data) setSelectedTransferencia(e.data)
        }}
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: [
              'Fecha', 'N°', 'Producto', 'Cantidad',
              'Origen', 'Destino', 'Usuario', 'Estado', 'Acciones',
            ],
          },
        ]}
      />
      </div>

      <div className="mt-4 w-full min-h-[200px] h-[calc(100vh-620px)] max-h-[450px]">
        <TableWithTitle<ProductoTransferenciaStock>
          id="transferencias-stock.detalle"
          title={detalleTitle}
          selectionColor={greenColors[10]}
          columnDefs={detalleColumns}
          rowData={selectedTransferencia?.productos || []}
          loading={false}
          pagination={false}
          persistColumnState={false}
        />
      </div>
    </>
  )
}
