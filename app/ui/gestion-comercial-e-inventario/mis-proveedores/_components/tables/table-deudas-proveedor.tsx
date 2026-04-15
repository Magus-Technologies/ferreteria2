'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tag, Tooltip, Button } from 'antd'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { FaEye, FaExclamationTriangle } from 'react-icons/fa'
import TableBase from '~/components/tables/table-base'
import { compraApi, type Compra } from '~/lib/api/compra'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { formatFechaPeru } from '~/utils/fechas'
import type { Proveedor } from '~/lib/api/proveedor'
import ModalDetalleDeudaCompra from '../modals/modal-detalle-deuda-compra'
import { greenColors } from '~/lib/colors'

interface TableDeudasProveedorProps {
  proveedorSeleccionado: Proveedor | null
}

function calcularTotalCompra(compra: Compra): number {
  return (compra.productos_por_almacen || []).reduce((acc, item) => {
    const costo = Number(item.costo ?? 0)
    for (const u of item.unidades_derivadas ?? []) {
      const cantidad = Number(u.cantidad ?? 0)
      const factor = Number(u.factor ?? 0)
      const flete = Number(u.flete ?? 0)
      const bonificacion = Boolean(u.bonificacion)
      acc += (bonificacion ? 0 : costo * cantidad * factor) + flete
    }
    return acc
  }, 0)
}

export default function TableDeudasProveedor({ proveedorSeleccionado }: TableDeudasProveedorProps) {
  const [compraDetalle, setCompraDetalle] = useState<Compra | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.COMPRAS_POR_PAGAR, 'deudas', proveedorSeleccionado?.id],
    queryFn: async () => {
      const result = await compraApi.getComprasPorPagar({
        proveedor_id: proveedorSeleccionado?.id,
        per_page: 100,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    enabled: true,
    staleTime: 60 * 1000,
  })

  const compras: Compra[] = Array.isArray(data?.data) ? data.data : []

  const tipoDocLabel: Record<string, string> = {
    '01': 'Factura', '03': 'Boleta', 'nv': 'NV',
  }

  const handleVerDetalle = useCallback((compra: Compra) => {
    setCompraDetalle(compra)
    setModalOpen(true)
  }, [])

  const columns: ColDef<Compra>[] = [
    {
      headerName: 'Documento',
      width: 140,
      flex: 1,
      valueGetter: (p) => `${tipoDocLabel[p.data?.tipo_documento ?? ''] ?? p.data?.tipo_documento} ${p.data?.serie ?? ''}-${p.data?.numero ?? ''}`,
    },
    {
      headerName: 'Proveedor',
      field: 'proveedor',
      flex: 2,
      minWidth: 180,
      valueGetter: (p) => p.data?.proveedor?.razon_social ?? '-',
      hide: !!proveedorSeleccionado,
    },
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 110,
      valueFormatter: (p) => formatFechaPeru(p.value, 'DD/MM/YYYY') ?? '-',
    },
    {
      headerName: 'Vencimiento',
      field: 'fecha_vencimiento',
      width: 110,
      cellRenderer: (p: ICellRendererParams<Compra>) => {
        if (!p.value) return <span className='text-gray-400'>-</span>
        const fecha = new Date(p.value)
        const hoy = new Date()
        const vencido = fecha < hoy
        return (
          <span className={vencido ? 'text-red-600 font-semibold flex items-center gap-1' : ''}>
            {vencido && <FaExclamationTriangle size={12} />}
            {formatFechaPeru(p.value, 'DD/MM/YYYY')}
          </span>
        )
      },
    },
    {
      headerName: 'Total',
      width: 110,
      type: 'numericColumn',
      valueGetter: (p) => p.data ? calcularTotalCompra(p.data) : 0,
      valueFormatter: (p) => `S/. ${Number(p.value).toFixed(2)}`,
    },
    {
      headerName: 'Pagado',
      field: 'total_pagado',
      width: 110,
      type: 'numericColumn',
      valueFormatter: (p) => `S/. ${Number(p.value ?? 0).toFixed(2)}`,
      cellStyle: { color: '#16a34a', fontWeight: 'bold' },
    },
    {
      headerName: 'Saldo',
      width: 110,
      type: 'numericColumn',
      valueGetter: (p) => {
        if (!p.data) return 0
        return calcularTotalCompra(p.data) - Number(p.data.total_pagado ?? 0)
      },
      valueFormatter: (p) => `S/. ${Number(p.value).toFixed(2)}`,
      cellStyle: { color: '#dc2626', fontWeight: 'bold' },
    },
    {
      headerName: 'Estado',
      width: 100,
      cellRenderer: (p: ICellRendererParams<Compra>) => {
        const saldo = p.data ? calcularTotalCompra(p.data) - Number(p.data.total_pagado ?? 0) : 0
        return (
          <div className='flex items-center h-full'>
            <Tag color={saldo <= 0.01 ? 'green' : 'red'}>
              {saldo <= 0.01 ? 'Pagado' : 'Pendiente'}
            </Tag>
          </div>
        )
      },
    },
    {
      headerName: 'Acciones',
      width: 90,
      cellRenderer: (p: ICellRendererParams<Compra>) => (
        <div className='flex items-center h-full'>
          <Tooltip title='Ver pagos y detalle'>
            <Button
              type='link'
              size='small'
              icon={<FaEye />}
              className='text-blue-600 hover:!text-blue-700 p-0'
              onClick={() => p.data && handleVerDetalle(p.data)}
            />
          </Tooltip>
        </div>
      ),
      type: 'actions',
    },
  ]

  // Totales
  const totalDeuda = compras.reduce((acc, c) => acc + calcularTotalCompra(c) - Number(c.total_pagado ?? 0), 0)

  return (
    <div className='w-full'>
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center gap-2'>
          <FaExclamationTriangle className='text-red-500' />
          <span className='font-semibold text-gray-700'>
            Deudas Pendientes {proveedorSeleccionado ? `— ${proveedorSeleccionado.razon_social}` : '(Todos los proveedores)'}
          </span>
          <Tag color='blue'>{compras.length} compras</Tag>
        </div>
        <span className='text-sm font-bold text-red-600'>
          Total deuda: S/. {totalDeuda.toFixed(2)}
        </span>
      </div>

      <div className='h-[calc(50vh-120px)] min-h-[180px] w-full'>
        <TableBase<Compra>
          rowData={compras}
          columnDefs={columns}
          loading={isLoading}
          rowSelection={false}
          withNumberColumn={true}
          selectionColor={greenColors[10]}
          defaultColDef={{ flex: 1, minWidth: 80 }}
        />
      </div>

      <ModalDetalleDeudaCompra
        compra={compraDetalle}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
