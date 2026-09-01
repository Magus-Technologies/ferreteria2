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

      {/*
        Las dos tablas se reparten lo que queda de pantalla en vez de tener alto
        fijo (eran 450px + 250px + margenes = 732px, y con los filtros arriba el
        contenido pasaba el viewport: de ahi el scroll de la pagina).

        Cada tabla scrollea internamente. Los 230px que se restan son el alto de
        lo que va ARRIBA (header de la app, padding, titulo y fila de filtros):
        es el unico numero a tocar si sobra o falta aire.

        La lista va 2/3 y los productos 1/3, respetando la proporcion original.
      */}
      <div className="w-full mt-4 flex flex-col gap-4 h-[calc(100vh-230px)] min-h-[520px]">
        {/* ═══════ TABLA DE SOLICITUDES ═══════ */}
        {/* min-h-0: sin esto un hijo flex no se encoge por debajo de su
            contenido y el reparto de altura no se respeta. */}
        <div className="flex-[2] min-h-0">
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

        {/* ═══════ TABLA DE PRODUCTOS SOLICITADOS ═══════ */}
        <div className="flex-1 min-h-0">
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
