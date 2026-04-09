'use client'

import { Suspense, lazy, useCallback, useEffect, useState, useMemo } from 'react'
import { App, Modal, Spin, Tooltip } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import { ordenCompraApi, type OrdenCompra, type OrdenCompraProducto } from '~/lib/api/orden-compra'
import { useStoreFiltrosOrdenesCompra } from './_store/store-filtros-ordenes-compra'
import { useStoreOrdenCompraSeleccionada } from './_store/store-orden-compra-seleccionada'
import TableProductosOrdenCompra from './_components/tables/table-productos-orden-compra'
import { useColumnsOrdenesCompra } from './_components/tables/columns-ordenes-compra'
import ProgressiveLoader from '~/app/_components/others/progressive-loader'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { getAuthToken } from '~/lib/api'
import { useRouter } from 'next/navigation'
import { FaDownload, FaPrint } from 'react-icons/fa6'
import ButtonBase from '~/components/buttons/button-base'
import { classOkButtonModal } from '~/lib/clases'
import { MdEmail } from 'react-icons/md'

// Lazy loading
const FiltersMisOrdenesCompra = lazy(() => import('./_components/filters/filters-mis-ordenes-compra'))
const TableOrdenesCompra = lazy(() => import('./_components/tables/table-ordenes-compra'))
const ModalDetalleOrdenCompra = lazy(() => import('./_components/modals/modal-detalle-orden-compra'))
const ModalEnviarCorreoOC = lazy(() => import('./_components/modals/modal-enviar-correo-oc'))
const ModalDocOrdenCompra = lazy(() => import('./_components/modals/modal-doc-orden-compra'))

export default function MisOrdenesDeCompra() {
    const { modal, message } = App.useApp()
    const queryClient = useQueryClient()
    const router = useRouter()
    const filtros = useStoreFiltrosOrdenesCompra(state => state.filtros)
    const [openDetalle, setOpenDetalle] = useState(false)
    const [selectedOrdenId, setSelectedOrdenId] = useState<number>()
    const [selectedOrdenData, setSelectedOrdenData] = useState<OrdenCompra>()
    const setOrdenSeleccionada = useStoreOrdenCompraSeleccionada(state => state.setOrdenCompra)
    const ordenSeleccionada = useStoreOrdenCompraSeleccionada(state => state.orden_compra)
    const [filaSeleccionada, setFilaSeleccionada] = useState<OrdenCompra | null>(null)
    const [openModalCorreo, setOpenModalCorreo] = useState(false)

    // Cuando cambia la orden seleccionada en la tabla, cargar productos si no están
    useEffect(() => {
        if (!ordenSeleccionada) {
            setFilaSeleccionada(null)
            return
        }
        if (ordenSeleccionada.productos && ordenSeleccionada.productos.length > 0) {
            setFilaSeleccionada(ordenSeleccionada)
        } else {
            ordenCompraApi.getById(ordenSeleccionada.id).then(res => {
                if (res.data?.data) setFilaSeleccionada(res.data.data as OrdenCompra)
            })
        }
    }, [ordenSeleccionada])

    const productosRowData = useMemo<OrdenCompraProducto[]>(() => {
        return filaSeleccionada?.productos ?? []
    }, [filaSeleccionada])

    // Document modal state
    const [docModalOpen, setDocModalOpen] = useState(false)
    const [docOrdenData, setDocOrdenData] = useState<OrdenCompra>()

    const handleAnular = useCallback((orden: OrdenCompra) => {
        modal.confirm({
            title: '¿Anular Orden de Compra?',
            icon: <ExclamationCircleFilled />,
            content: (
                <div>
                    <p>¿Estás seguro de anular la orden <strong>{orden.codigo}</strong>?</p>
                    <p className='text-sm text-slate-500 mt-1'>Proveedor: {orden.proveedor?.razon_social || '—'}</p>
                    <p className='text-sm text-slate-500'>Total: S/. {Number(orden.total ?? 0).toFixed(2)}</p>
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
    }, [modal, message, queryClient])

    const handleAprobar = useCallback((orden: OrdenCompra) => {
        modal.confirm({
            title: '¿Aprobar Orden de Compra?',
            icon: <ExclamationCircleFilled />,
            content: (
                <div>
                    <p>¿Estás seguro de aprobar la orden <strong>{orden.codigo}</strong>?</p>
                    <p className='text-sm text-slate-500 mt-1'>Proveedor: {orden.proveedor?.razon_social || '—'}</p>
                    <p className='text-sm text-slate-500'>Total: S/. {Number(orden.total ?? 0).toFixed(2)}</p>
                    <p className='text-sm text-blue-600 mt-2'>Se creará la compra con los datos de esta orden</p>
                </div>
            ),
            okText: 'Sí, Aprobar',
            okType: 'primary',
            cancelText: 'Cancelar',
            onOk() {
                router.push(`/ui/gestion-comercial-e-inventario/mis-compras/crear-compra?orden_compra_id=${orden.id}`)
            },
        })
    }, [modal, router])

    const handleEditar = useCallback((orden: OrdenCompra) => {
        router.push(`/ui/gestion-comercial-e-inventario/mis-ordenes-de-compra/crear-orden-compra?id=${orden.id}`)
    }, [router])

    const handleDuplicar = useCallback((orden: OrdenCompra) => {
        router.push(`/ui/gestion-comercial-e-inventario/mis-ordenes-de-compra/crear-orden-compra?duplicate_from=${orden.id}`)
    }, [router])

    const handleView = useCallback((orden: OrdenCompra) => {
        setSelectedOrdenId(orden.id)
        setSelectedOrdenData(orden)
        setOpenDetalle(true)
    }, [])

    const handleViewDoc = useCallback(async (orden: OrdenCompra) => {
        setDocOrdenData(orden)
        setDocModalOpen(true)
    }, [])

    const columns = useColumnsOrdenesCompra({
        onAnular: handleAnular,
        onView: handleView,
        onViewDoc: handleViewDoc,
        onAprobar: handleAprobar,
        onEditar: handleEditar,
        onDuplicar: handleDuplicar,
    })

    return (
        <ContenedorGeneral className="h-full">
            <Suspense fallback={<div className="h-20" />}>
                <FiltersMisOrdenesCompra />
            </Suspense>

            <div className="w-full mt-4">
                <div className="h-[350px]">
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

            {/* TABLA DE PRODUCTOS */}
            <div className="w-full mt-4">
                <div className="h-[400px]">
                    <TableProductosOrdenCompra
                        id="g-c-e-i.mis-ordenes-compra.productos"
                        productos={productosRowData}
                    />
                </div>
            </div>

            <ModalDetalleOrdenCompra
                open={openDetalle}
                onClose={() => setOpenDetalle(false)}
                ordenId={selectedOrdenId}
                ordenData={selectedOrdenData}
            />

            <Suspense fallback={null}>
                <ModalDocOrdenCompra
                    open={docModalOpen}
                    onClose={() => setDocModalOpen(false)}
                    orden={docOrdenData}
                />
            </Suspense>

            <ModalEnviarCorreoOC
                open={openModalCorreo}
                onClose={() => setOpenModalCorreo(false)}
                ordenData={docOrdenData}
            />
        </ContenedorGeneral>
    )
}

