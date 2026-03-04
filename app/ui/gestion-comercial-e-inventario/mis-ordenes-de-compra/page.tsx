'use client'

import { Suspense, lazy, useCallback, useState } from 'react'
import { App } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import { ordenCompraApi, type OrdenCompra } from '~/lib/api/orden-compra'
import { useStoreFiltrosOrdenesCompra } from './_store/store-filtros-ordenes-compra'
import { useStoreOrdenCompraSeleccionada } from './_store/store-orden-compra-seleccionada'
import { useColumnsOrdenesCompra } from './_components/tables/columns-ordenes-compra'
import ProgressiveLoader from '~/app/_components/others/progressive-loader'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalPdfViewer from '~/components/modals/modal-pdf-viewer'
import DocOrdenCompra from './_components/docs/doc-orden-compra'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'

// Lazy loading
const FiltersMisOrdenesCompra = lazy(() => import('./_components/filters/filters-mis-ordenes-compra'))
const TableOrdenesCompra = lazy(() => import('./_components/tables/table-ordenes-compra'))
const ModalDetalleOrdenCompra = lazy(() => import('./_components/modals/modal-detalle-orden-compra'))

export default function MisOrdenesDeCompra() {
    const { modal, message } = App.useApp()
    const queryClient = useQueryClient()
    const filtros = useStoreFiltrosOrdenesCompra(state => state.filtros)
    const [openDetalle, setOpenDetalle] = useState(false)
    const [selectedOrdenId, setSelectedOrdenId] = useState<number>()
    const [selectedOrdenData, setSelectedOrdenData] = useState<OrdenCompra>()
    const setOrdenSeleccionada = useStoreOrdenCompraSeleccionada(state => state.setOrdenCompra)

    // Document modal state
    const [docModalOpen, setDocModalOpen] = useState(false)
    const [docOrdenData, setDocOrdenData] = useState<OrdenCompra>()
    const { data: empresa } = useEmpresaPublica()

    const handleAnular = useCallback((orden: OrdenCompra) => {
        modal.confirm({
            title: '¿Anular Orden de Compra?',
            icon: <ExclamationCircleFilled />,
            content: (
                <div>
                    <p>¿Estás seguro de anular la orden <strong>{orden.codigo}</strong>?</p>
                    <p className='text-sm text-slate-500 mt-1'>Proveedor: {orden.proveedor?.razon_social || '—'}</p>
                    <p className='text-sm text-slate-500'>Total: S/. {(Number((orden as any).total ?? 0)).toFixed(2)}</p>
                </div>
            ),
            okText: 'Sí, Anular',
            okType: 'danger',
            cancelText: 'Cancelar',
            async onOk() {
                try {
                    await ordenCompraApi.anular(orden.id)
                    message.success(`Orden ${orden.codigo} anulada correctamente`)
                    queryClient.invalidateQueries({ queryKey: [QueryKeys.ORDENES_COMPRA] })
                } catch (error) {
                    message.error('Error al anular la orden de compra')
                    console.error(error)
                }
            },
        })
    }, [queryClient])

    const handleAprobar = useCallback((orden: OrdenCompra) => {
        modal.confirm({
            title: '¿Aprobar Orden de Compra?',
            icon: <ExclamationCircleFilled />,
            content: (
                <div>
                    <p>¿Estás seguro de aprobar la orden <strong>{orden.codigo}</strong>?</p>
                    <p className='text-sm text-slate-500 mt-1'>Proveedor: {orden.proveedor?.razon_social || '—'}</p>
                    <p className='text-sm text-slate-500'>Total: S/. {(Number((orden as any).total ?? 0)).toFixed(2)}</p>
                    <p className='text-sm text-blue-600 mt-2'>Aparecerá en Mis Recepciones después de aprobada</p>
                </div>
            ),
            okText: 'Sí, Aprobar',
            okType: 'primary',
            cancelText: 'Cancelar',
            async onOk() {
                try {
                    await ordenCompraApi.aprobar(orden.id)
                    message.success(`Orden ${orden.codigo} aprobada correctamente`)
                    queryClient.invalidateQueries({ queryKey: [QueryKeys.ORDENES_COMPRA] })
                } catch (error) {
                    message.error('Error al aprobar la orden de compra')
                    console.error(error)
                }
            },
        })
    }, [queryClient])

    const handleView = useCallback((orden: OrdenCompra) => {
        setSelectedOrdenId(orden.id)
        setSelectedOrdenData(orden)
        setOpenDetalle(true)
    }, [])

    const handleViewDoc = useCallback(async (orden: OrdenCompra) => {
        try {
            // Fetch full detail to get products
            const res = await ordenCompraApi.getById(orden.id)
            if (res.data?.data) {
                setDocOrdenData(res.data.data)
            } else {
                setDocOrdenData(orden)
            }
        } catch {
            setDocOrdenData(orden)
        }
        setDocModalOpen(true)
    }, [])

    const columns = useColumnsOrdenesCompra({
        onAnular: handleAnular,
        onView: handleView,
        onViewDoc: handleViewDoc,
        onAprobar: handleAprobar,
    })

    return (
        <ContenedorGeneral className="h-full">
            <Suspense fallback={<div className="h-20" />}>
                <FiltersMisOrdenesCompra />
            </Suspense>

            <div className="w-full mt-4">
                <div className="h-[400px]">
                    <ProgressiveLoader identifier="mis-ordenes-compra-table" priority="critical">
                        <Suspense fallback={<div className="h-40 flex items-center justify-center font-medium text-slate-500 italic">Cargando tabla...</div>}>
                            <TableOrdenesCompra
                                id="g-c-e-i.mis-ordenes-compra.lista"
                                columns={columns}
                                filtros={filtros}
                                setOrdenSeleccionada={setOrdenSeleccionada}
                            />
                        </Suspense>
                    </ProgressiveLoader>
                </div>
            </div>

            <ModalDetalleOrdenCompra
                open={openDetalle}
                onClose={() => setOpenDetalle(false)}
                ordenId={selectedOrdenId}
                ordenData={selectedOrdenData}
            />

            {docOrdenData && (
                <ModalPdfViewer
                    open={docModalOpen}
                    onClose={() => {
                        setDocModalOpen(false)
                        setDocOrdenData(undefined)
                    }}
                    document={<DocOrdenCompra orden={docOrdenData} empresa={empresa} />}
                    fileName={`OC-${docOrdenData.codigo}`}
                    title={`Orden de Compra - ${docOrdenData.codigo}`}
                />
            )}
        </ContenedorGeneral>
    )
}

