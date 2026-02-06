'use client'

import { App } from 'antd'
import { useState, useEffect, useRef } from 'react'
import type { Compra, PagoDeCompra } from '~/lib/api/compra'
import { compraApi } from '~/lib/api/compra'
import { toLocalString } from '~/utils/fechas'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import dayjs from 'dayjs'

interface ModalVerDetallesPagosProps {
  open: boolean
  setOpen: (open: boolean) => void
  compra: Compra | undefined
}

export default function ModalVerDetallesPagos({
  open,
  setOpen,
  compra,
}: ModalVerDetallesPagosProps) {
  const { message } = App.useApp()
  const [pagosRealizados, setPagosRealizados] = useState<PagoDeCompra[]>([])
  const [loading, setLoading] = useState(false)
  const tableRefPagos = useRef<AgGridReact>(null)

  // Cargar pagos realizados cuando se abre el modal
  useEffect(() => {
    if (open && compra?.id) {
      setLoading(true)
      compraApi.getPagos(compra.id)
        .then(res => {
          if (res.data) {
            setPagosRealizados(res.data.data || [])
          }
        })
        .catch(err => {
          console.error('Error al cargar pagos:', err)
          message.error('Error al cargar los pagos')
          setPagosRealizados([])
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [open, compra?.id, message])

  // Reset cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setPagosRealizados([])
    }
  }, [open])

  // Columnas de la tabla
  const columnasPagos: ColDef<PagoDeCompra>[] = [
    {
      headerName: '#',
      valueGetter: 'node.rowIndex + 1',
      width: 50,
      cellStyle: { textAlign: 'center', fontWeight: '600' },
    },
    {
      headerName: 'M.',
      width: 60,
      valueGetter: () => compra?.tipo_moneda?.toString() === 's' ? 'S/.' : '$',
      cellStyle: { textAlign: 'center', fontWeight: '600' },
    },
    {
      headerName: 'M. Pago',
      field: 'despliegue_de_pago.metodo_de_pago.name',
      width: 120,
      valueGetter: (params) => params.data?.despliegue_de_pago?.metodo_de_pago?.name || '-',
    },
    {
      headerName: 'Banco',
      width: 180,
      valueGetter: (params) => {
        const cuenta = params.data?.despliegue_de_pago?.metodo_de_pago?.cuenta_bancaria
        const celular = params.data?.despliegue_de_pago?.numero_celular
        return cuenta || celular || '-'
      },
    },
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 110,
      valueFormatter: (params) => {
        if (!params.value) return '-'
        return toLocalString({ date: dayjs(params.value), format: 'DD/MM/YYYY' }) || '-'
      },
      cellStyle: { textAlign: 'center' },
    },
    {
      headerName: 'Monto',
      field: 'monto',
      width: 120,
      valueFormatter: (params) => Number(params.value).toFixed(2),
      cellStyle: { textAlign: 'right', fontWeight: 'bold', color: '#059669' },
    },
    {
      headerName: 'Aplica',
      width: 100,
      valueGetter: () => 'FACTURA',
      cellStyle: { textAlign: 'center', fontSize: '11px' },
    },
    {
      headerName: 'Observación',
      field: 'observacion',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.data?.observacion || '-',
    },
    {
      headerName: 'Recibo',
      width: 100,
      valueGetter: () => '-',
      cellStyle: { textAlign: 'center' },
    },
  ]

  if (!compra) return null

  return (
    <ModalForm
      modalProps={{
        width: 1000,
        title: <TitleForm>Consultar Compras al Crédito (Pagos)</TitleForm>,
        centered: true,
        okText: 'Aceptar',
        cancelButtonProps: { style: { display: 'none' } },
      }}
      open={open}
      setOpen={setOpen}
      onCancel={() => setOpen(false)}
    >
      <div className="space-y-4">
        {/* Información de la compra */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-semibold text-gray-600">Proveedor:</span>{' '}
              <span className="text-gray-800">{compra.proveedor?.razon_social}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Documento:</span>{' '}
              <span className="text-gray-800">{compra.tipo_documento} {compra.serie}-{compra.numero}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Moneda:</span>{' '}
              <span className="text-gray-800">{compra.tipo_moneda?.toString() === 's' ? 'Soles (S/.)' : 'Dólares ($)'}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Total Pagos:</span>{' '}
              <span className="text-green-600 font-bold">
                {pagosRealizados.filter(p => p.estado).length} pago(s)
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de pagos */}
        <div className="h-[400px]">
          <TableWithTitle
            id="tabla-detalles-pagos-compra"
            tableRef={tableRefPagos}
            title="Historial de Pagos Realizados"
            columnDefs={columnasPagos}
            rowData={pagosRealizados.filter(p => p.estado)}
            loading={loading}
            pagination={false}
            domLayout="normal"
          />
        </div>
      </div>
    </ModalForm>
  )
}
