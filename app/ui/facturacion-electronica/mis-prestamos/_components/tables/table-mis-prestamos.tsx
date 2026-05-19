'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal, Input, message } from 'antd'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsMisPrestamos } from './columns-mis-prestamos'
import ModalDocPrestamo from '../modals/modal-doc-prestamo'
import { create } from 'zustand'
import { prestamoApi, type Prestamo } from '~/lib/api/prestamo'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import { orangeColors } from '~/lib/colors'
import { AgGridReact } from 'ag-grid-react'
import { useStoreFiltrosMisPrestamos } from '../../store/store-filtros-mis-prestamos'

type UseStorePrestamoSeleccionada = {
  prestamo?: Prestamo
  setPrestamo: (prestamo: Prestamo | undefined) => void
}

export const UseStorePrestamoSeleccionada =
  create<UseStorePrestamoSeleccionada>((set) => ({
    prestamo: undefined,
    setPrestamo: (prestamo) => set({ prestamo }),
  }))

export default function TableMisPrestamos() {
  const tableRef = useRef<AgGridReact>(null)
  const router = useRouter()
  const queryClient = useQueryClient()
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)
  const filtros = useStoreFiltrosMisPrestamos((state) => state.filtros)

  // Anular préstamo
  const [anularOpen, setAnularOpen] = useState(false)
  const [prestamoAnular, setPrestamoAnular] = useState<Prestamo | undefined>()
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [anulando, setAnulando] = useState(false)

  const handleEditar = (prestamo: Prestamo) => {
    router.push(
      `/ui/facturacion-electronica/mis-prestamos/crear-prestamo?id=${prestamo.id}`
    )
  }

  const handleAnular = (prestamo: Prestamo) => {
    setPrestamoAnular(prestamo)
    setMotivoAnulacion('')
    setAnularOpen(true)
  }

  const confirmarAnular = async () => {
    if (!prestamoAnular) return
    if (motivoAnulacion.trim().length < 3) {
      message.error('El motivo debe tener al menos 3 caracteres')
      return
    }
    setAnulando(true)
    try {
      const res = await prestamoApi.anular(
        String(prestamoAnular.id),
        motivoAnulacion.trim()
      )
      if (res.error) {
        message.error(res.error.message || 'Error al anular el préstamo')
        return
      }
      message.success(res.data?.message || 'Préstamo anulado exitosamente')
      setAnularOpen(false)
      setPrestamoAnular(undefined)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS] })
    } catch {
      message.error('Error inesperado al anular el préstamo')
    } finally {
      setAnulando(false)
    }
  }

  const { data: response, isLoading: loading } = useQuery({
    queryKey: [QueryKeys.PRESTAMOS, almacen_id ?? 0, filtros],
    queryFn: async () => {
      const result = await prestamoApi.getAll({
        almacen_id: almacen_id ?? undefined,
        ...filtros,
      })
      return result.data?.data || []
    },
    enabled: !!almacen_id,
  })

  const setPrestamoSeleccionada = UseStorePrestamoSeleccionada(
    (state) => state.setPrestamo
  )

  // Modal de PDF/Ticket del préstamo
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [prestamoIdDoc, setPrestamoIdDoc] = useState<string | undefined>()

  const handleVerPdf = (id: string) => {
    setPrestamoIdDoc(id)
    setDocModalOpen(true)
  }

  // Seleccionar automáticamente el primer registro cuando se cargan los datos
  React.useEffect(() => {
    if (response && response.length > 0 && tableRef.current) {
      // Esperar un momento para que la tabla se renderice completamente
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0)
        if (firstNode) {
          firstNode.setSelected(true)
          setPrestamoSeleccionada(firstNode.data)
        }
      }, 100)
    }
  }, [response, setPrestamoSeleccionada])

  return (
    <div className='w-full' style={{ height: '300px' }}>
      <TableWithTitle<Prestamo>
        id='mis-prestamos'
        title='N° DE CLIENTES/PROVEEDORES - Préstamos'
        loading={loading}
        columnDefs={useColumnsMisPrestamos(handleVerPdf, handleEditar, handleAnular)}
        rowData={response || []}
        tableRef={tableRef}
        selectionColor={orangeColors[10]} // Color naranja para facturación electrónica
        onRowClicked={(event) => {
          // Seleccionar la fila cuando se hace clic en cualquier parte
          event.node.setSelected(true)
        }}
        onSelectionChanged={({ selectedNodes }) =>
          setPrestamoSeleccionada(selectedNodes?.[0]?.data as Prestamo)
        }
        onRowDoubleClicked={({ data }) => {
          setPrestamoSeleccionada(data)
        }}
      />

      <ModalDocPrestamo
        open={docModalOpen}
        setOpen={setDocModalOpen}
        prestamoId={prestamoIdDoc}
      />

      <Modal
        title={`Anular préstamo ${prestamoAnular?.numero ?? ''}`}
        open={anularOpen}
        onOk={confirmarAnular}
        onCancel={() => setAnularOpen(false)}
        okText="Sí, Anular"
        okButtonProps={{ danger: true, loading: anulando }}
        cancelText="Cancelar"
      >
        <p className="mb-2 text-sm text-rose-600">
          Esta acción revierte devoluciones, pagos e inventario del préstamo y
          lo marca como ANULADO. No se puede deshacer.
        </p>
        <Input.TextArea
          rows={3}
          placeholder="Motivo de anulación (mínimo 3 caracteres)"
          value={motivoAnulacion}
          onChange={(e) => setMotivoAnulacion(e.target.value)}
        />
      </Modal>
    </div>
  )
}
