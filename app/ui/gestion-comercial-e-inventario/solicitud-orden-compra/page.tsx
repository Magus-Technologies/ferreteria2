'use client'

import { Suspense, lazy, useCallback, useMemo, useState } from 'react'
import { Spin, Modal, Button, Tooltip } from 'antd'
// import { ExclamationCircleFilled } from '@ant-design/icons'
import { FaDownload, FaPrint } from 'react-icons/fa6'
import { RowSelectedEvent } from 'ag-grid-community'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import { getAuthToken } from '~/lib/api'
import ButtonBase from '~/components/buttons/button-base'
import { classOkButtonModal } from '~/lib/clases'
import { type RequerimientoInterno, type RequerimientoInternoProducto, requerimientoInternoApi } from '~/lib/api/requerimiento-interno'
import { useStoreFiltrosSolicitudOC } from './_store/store-filtros-solicitud-oc'
import { useColumnsSolicitudOC } from './_components/tables/columns-solicitud-oc'
import ModalRequerimientoCompra from '../_components/modals/modal-requerimiento-compra'
import ModalDocSolicitudOC from './_components/modals/modal-doc-solicitud-oc'
import TableProductosSolicitudOC from './_components/tables/table-productos-solicitud-oc'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

const FiltersSolicitudOC = lazy(() => import('./_components/filters/filters-solicitud-oc'))
const TableSolicitudOC = lazy(() => import('./_components/tables/table-solicitud-oc'))
const ModalDetalleSolicitudOC = lazy(() => import('./_components/modals/_detalle-solicitud-oc/modal-detalle-solicitud-oc'))

const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function SolicitudOrdenCompra() {
  // const { modal, message } = App.useApp()
  const queryClient = useQueryClient()
  const filtros = useStoreFiltrosSolicitudOC(state => state.filtros)

  const [seleccionado, setSeleccionado] = useState<RequerimientoInterno | null>(null)
  const [filaSeleccionada, setFilaSeleccionada] = useState<RequerimientoInterno | null>(null)
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false)
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)

  const handleView = useCallback((row: RequerimientoInterno) => {
    setSeleccionado(row)
    setModalDetalleOpen(true)
  }, [])

  const handleViewPdf = useCallback((row: RequerimientoInterno) => {
    setSeleccionado(row)
    setPdfModalOpen(true)
  }, [])

  /* handleAprobar oculto - botón comentado en columns-solicitud-oc.tsx
  const handleAprobar = useCallback((row: RequerimientoInterno) => {
    modal.confirm({
      title: '¿Aprobar Solicitud de Orden de Compra?',
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          <p>¿Estás seguro de aprobar <strong>{row.codigo}</strong>?</p>
          <p className='text-sm text-slate-500 mt-1'>{row.titulo}</p>
        </div>
      ),
      okText: 'Sí, Aprobar',
      okType: 'primary',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          await requerimientoInternoApi.updateEstado(row.id, { estado: 'aprobado' })
          message.success(`${row.codigo} aprobado correctamente`)
          queryClient.invalidateQueries({ queryKey: [QueryKeys.SOLICITUD_ORDEN_COMPRA] })
        } catch (error) {
          message.error('Error al aprobar la solicitud')
          console.error(error)
        }
      },
    })
  }, [modal, message, queryClient])
  */

  const columns = useColumnsSolicitudOC({ onView: handleView, onViewPdf: handleViewPdf })

  const productosRowData = useMemo<RequerimientoInternoProducto[]>(() => {
    if (filaSeleccionada?.productos) return filaSeleccionada.productos
    return []
  }, [filaSeleccionada])

  return (
    <ContenedorGeneral className="h-full">
      <Suspense fallback={<div className="h-20" />}>
        <FiltersSolicitudOC onNueva={() => setModalNuevoOpen(true)} />
      </Suspense>

      {/* ═══════ TABLA DE SOLICITUDES ═══════ */}
      <div className="w-full mt-4">
        <div className="h-[450px]">
          <Suspense fallback={<ComponentLoading />}>
            <TableSolicitudOC
              id="g-c-e-i.solicitud-orden-compra.lista"
              columns={columns}
              filtros={filtros}
              selectionColor="#dcfce7"
              onRowSelected={(event: RowSelectedEvent<RequerimientoInterno>) => {
                if (event.node.isSelected() && event.data) {
                  const rowId = event.data.id
                  requerimientoInternoApi.getById(rowId).then(res => {
                    if (res.data?.data) {
                      const selectedRows = event.api?.getSelectedRows?.() ?? []
                      const stillSelected = selectedRows.some(r => r.id === rowId)
                      if (stillSelected) setFilaSeleccionada(res.data.data)
                    }
                  })
                } else if ((event.api?.getSelectedRows?.() ?? []).length === 0) {
                  setFilaSeleccionada(null)
                }
              }}
            />
          </Suspense>
        </div>
      </div>

      {/* ═══════ TABLA DE PRODUCTOS SOLICITADOS ═══════ */}
      <div className="w-full mt-4">
        <div className="h-[250px]">
          <TableProductosSolicitudOC
            id="g-c-e-i.solicitud-orden-compra.productos"
            productos={productosRowData}
          />
        </div>
      </div>

      <Suspense fallback={null}>
        <ModalDetalleSolicitudOC
          open={modalDetalleOpen}
          requerimiento={seleccionado}
          onClose={() => {
            setModalDetalleOpen(false)
            setSeleccionado(null)
          }}
        />
      </Suspense>

      <ModalRequerimientoCompra
        open={modalNuevoOpen}
        onClose={() => {
          setModalNuevoOpen(false)
          queryClient.invalidateQueries({ queryKey: [QueryKeys.SOLICITUD_ORDEN_COMPRA] })
        }}
        tipoSolicitud="SOC"
      />

      <ModalDocSolicitudOC
        open={pdfModalOpen}
        requerimiento={seleccionado}
        onClose={() => {
          setPdfModalOpen(false)
          setSeleccionado(null)
        }}
      />
    </ContenedorGeneral>
  )
}
