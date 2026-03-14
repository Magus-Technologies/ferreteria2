'use client'

import { Suspense, lazy, useCallback, useMemo, useState } from 'react'
import { Spin, App, Tag, Modal, Button, Tooltip } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { FaDownload, FaPrint } from 'react-icons/fa6'
import { ColDef, ICellRendererParams, RowSelectedEvent } from 'ag-grid-community'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import { getAuthToken } from '~/lib/api'
import ButtonBase from '~/components/buttons/button-base'
import { classOkButtonModal } from '~/lib/clases'
import { type RequerimientoInterno, type RequerimientoInternoProducto, requerimientoInternoApi } from '~/lib/api/requerimiento-interno'
import { useStoreFiltrosSolicitudOC } from './_store/store-filtros-solicitud-oc'
import { useColumnsSolicitudOC } from './_components/tables/columns-solicitud-oc'
import ModalRequerimientoInterno from '../_components/modals/modal-requerimiento-interno'
import TableProductosSolicitudOC from './_components/tables/table-productos-solicitud-oc'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

const FiltersSolicitudOC = lazy(() => import('./_components/filters/filters-solicitud-oc'))
const TableSolicitudOC = lazy(() => import('./_components/tables/table-solicitud-oc'))
const ModalDetalleRequerimiento = lazy(() => import('../mis-requerimientos-internos/_components/modal-detalle-requerimiento'))

const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function SolicitudOrdenCompra() {
  const { modal, message } = App.useApp()
  const queryClient = useQueryClient()
  const filtros = useStoreFiltrosSolicitudOC(state => state.filtros)

  const [seleccionado, setSeleccionado] = useState<RequerimientoInterno | null>(null)
  const [filaSeleccionada, setFilaSeleccionada] = useState<RequerimientoInterno | null>(null)
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false)
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [docPdfUrl, setDocPdfUrl] = useState<string | null>(null)
  const [docPdfLoading, setDocPdfLoading] = useState(false)

  const handleView = useCallback((row: RequerimientoInterno) => {
    setSeleccionado(row)
    setModalDetalleOpen(true)
  }, [])

  const handleViewPdf = useCallback((row: RequerimientoInterno) => {
    setSeleccionado(row)
    setPdfModalOpen(true)
  }, [])

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

  const columns = useColumnsSolicitudOC({ onView: handleView, onViewPdf: handleViewPdf, onAprobar: handleAprobar })

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
                  // Si los productos no están cargados, hacer una consulta
                  if (!event.data.productos || event.data.productos.length === 0) {
                    const rowId = event.data.id
                    requerimientoInternoApi.getById(rowId).then(res => {
                      if (res.data?.data) {
                        // Solo actualizar si la fila sigue seleccionada
                        const stillSelected = event.api.getSelectedRows().some(r => r.id === rowId)
                        if (stillSelected) setFilaSeleccionada(res.data.data)
                      }
                    })
                  } else {
                    setFilaSeleccionada(event.data)
                  }
                } else if (event.api.getSelectedRows().length === 0) {
                  // Solo limpiar si realmente no hay ninguna fila seleccionada
                  // (AG Grid dispara onRowSelected para deselects también, incluso al cambiar de fila)
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
        <ModalDetalleRequerimiento
          open={modalDetalleOpen}
          requerimiento={seleccionado}
          onClose={() => {
            setModalDetalleOpen(false)
            setSeleccionado(null)
          }}
        />
      </Suspense>

      <ModalRequerimientoInterno
        open={modalNuevoOpen}
        onClose={() => {
          setModalNuevoOpen(false)
          queryClient.invalidateQueries({ queryKey: [QueryKeys.SOLICITUD_ORDEN_COMPRA] })
        }}
        defaultTipoSolicitud="SOC"
      />

      <Modal
        open={pdfModalOpen}
        onCancel={() => {
          setPdfModalOpen(false)
          setSeleccionado(null)
          if (docPdfUrl) { URL.revokeObjectURL(docPdfUrl); setDocPdfUrl(null) }
        }}
        width={900}
        centered
        title={seleccionado ? `PDF - ${seleccionado.codigo}` : 'PDF'}
        footer={
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Tooltip title="Descargar PDF">
                <ButtonBase
                  disabled={!docPdfUrl}
                  onClick={() => {
                    if (!docPdfUrl) return
                    const a = document.createElement('a')
                    a.href = docPdfUrl
                    a.download = seleccionado ? `${seleccionado.codigo}-SOC.pdf` : 'documento.pdf'
                    a.click()
                  }}
                >
                  <FaDownload />
                </ButtonBase>
              </Tooltip>
              <Tooltip title="Imprimir">
                <ButtonBase
                  disabled={!docPdfUrl}
                  onClick={() => {
                    if (!docPdfUrl) return
                    const w = window.open(docPdfUrl)
                    w?.addEventListener('load', () => w.print())
                  }}
                >
                  <FaPrint />
                </ButtonBase>
              </Tooltip>
            </div>
            <Button type="primary" onClick={() => { setPdfModalOpen(false); setSeleccionado(null); if (docPdfUrl) { URL.revokeObjectURL(docPdfUrl); setDocPdfUrl(null) } }} className={classOkButtonModal}>
              Cerrar
            </Button>
          </div>
        }
        afterOpenChange={async (open) => {
          if (open && seleccionado) {
            setDocPdfLoading(true)
            try {
              const token = getAuthToken()
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pdf/requerimiento-interno/${seleccionado.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (!res.ok) throw new Error('Error al generar PDF')
              const blob = await res.blob()
              setDocPdfUrl(URL.createObjectURL(blob))
            } catch { setDocPdfUrl(null) } finally { setDocPdfLoading(false) }
          }
        }}
      >
        {docPdfLoading ? (
          <div className="flex justify-center py-12"><Spin /></div>
        ) : docPdfUrl ? (
          <iframe src={docPdfUrl} className="w-full" style={{ height: '70vh' }} />
        ) : (
          <div className="flex justify-center py-12 text-slate-400">No se pudo cargar el PDF</div>
        )}
      </Modal>
    </ContenedorGeneral>
  )
}
