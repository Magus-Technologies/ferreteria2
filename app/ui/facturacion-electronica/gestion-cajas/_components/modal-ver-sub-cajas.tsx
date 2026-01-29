'use client'

import { Modal, App, Space, Spin } from 'antd'
import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FaPlus, FaExchangeAlt } from 'react-icons/fa'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import type { CajaPrincipal, SubCaja } from '~/lib/api/caja-principal'
import { cajaPrincipalApi } from '~/lib/api/caja-principal'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalCrearSubCaja from '~/app/ui/facturacion-electronica/gestion-cajas/_components/modal-crear-sub-caja'
import ModalEditarSubCaja from '~/app/ui/facturacion-electronica/gestion-cajas/_components/modal-editar-sub-caja'
import ModalTransferirEntreSubCajas from './modal-transferir-entre-sub-cajas'
import ButtonBase from '~/components/buttons/button-base'
import TableBase from '~/components/tables/table-base'
import { AgGridReact } from 'ag-grid-react'
import { useColumnsSubCajas } from './columns-sub-cajas'

interface ModalVerSubCajasProps {
    open: boolean
    setOpen: (open: boolean) => void
    cajaPrincipal: CajaPrincipal
    onSuccess?: () => void
}

export default function ModalVerSubCajas({
    open,
    setOpen,
    cajaPrincipal,
    onSuccess,
}: ModalVerSubCajasProps) {
    const { modal, message } = App.useApp()
    const [openCrearSubCaja, setOpenCrearSubCaja] = useState(false)
    const [openEditarSubCaja, setOpenEditarSubCaja] = useState(false)
    const [openTransferirSubCajas, setOpenTransferirSubCajas] = useState(false)
    const [subCajaSeleccionada, setSubCajaSeleccionada] = useState<SubCaja | null>(null)
    const gridRef = useRef<AgGridReact<SubCaja>>(null)

    // Obtener datos actualizados de la caja principal
    const { data: cajaActualizada, isLoading } = useQuery({
        queryKey: [QueryKeys.CAJAS_PRINCIPALES, cajaPrincipal.id],
        queryFn: async () => {
            const response = await cajaPrincipalApi.getById(cajaPrincipal.id)
            return response.data?.data
        },
        enabled: open, // Solo hacer query cuando el modal está abierto
    })

    const cajaData = cajaActualizada || cajaPrincipal

    const handleEditarSubCaja = (subCaja: SubCaja) => {
        setSubCajaSeleccionada(subCaja)
        setOpenEditarSubCaja(true)
    }

    const handleEliminarSubCaja = (subCaja: SubCaja) => {
        modal.confirm({
            title: '¿Eliminar Sub-Caja?',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>¿Estás seguro de eliminar la sub-caja <strong>{subCaja.nombre}</strong>?</p>
                    <p className='text-sm text-slate-600 mt-2'>
                        Código: {subCaja.codigo}
                    </p>
                    <p className='text-sm text-red-600 mt-2'>
                        <strong>Advertencia:</strong> Esta acción no se puede deshacer.
                    </p>
                </div>
            ),
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            async onOk() {
                try {
                    const response = await cajaPrincipalApi.deleteSubCaja(subCaja.id)

                    if (response.error) {
                        message.error(response.error.message || 'Error al eliminar la sub-caja')
                        return
                    }

                    message.success('Sub-caja eliminada exitosamente')
                    onSuccess?.()
                } catch (error) {
                    console.error('Error al eliminar sub-caja:', error)
                    message.error('Error inesperado al eliminar la sub-caja')
                }
            },
        })
    }

    const columns = useColumnsSubCajas({
        onEditar: handleEditarSubCaja,
        onEliminar: handleEliminarSubCaja,
    })

    return (
        <>
            <Modal
                title={
                    <div className='flex items-center gap-3'>
                        <span className='text-lg font-bold'>Sub-Cajas de {cajaData.nombre}</span>
                        <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-sm'>
                            {cajaData.codigo}
                        </span>
                    </div>
                }
                open={open}
                onCancel={() => setOpen(false)}
                width={1200}
                footer={null}
                centered
            >
                <div className='mt-4'>
                    <div className='flex justify-between items-center mb-4'>
                        <div className='flex gap-4'>
                            <div className='text-sm'>
                                <span className='text-slate-500'>Responsable:</span>{' '}
                                <span className='font-semibold'>{cajaData.user.name}</span>
                            </div>
                            <div className='text-sm'>
                                <span className='text-slate-500'>Saldo Total:</span>{' '}
                                <span className='font-bold text-emerald-600'>
                                    S/. {parseFloat(cajaData.saldo_total).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <Space>
                            <ButtonBase
                                color='warning'
                                onClick={() => setOpenTransferirSubCajas(true)}
                                className='flex items-center gap-2'
                                size='sm'
                                disabled={cajaData.sub_cajas.length < 2}
                            >
                                <FaExchangeAlt />
                                Movimiento Interno
                            </ButtonBase>
                            <ButtonBase
                                color='info'
                                onClick={() => setOpenCrearSubCaja(true)}
                                className='flex items-center gap-2'
                                size='sm'
                            >
                                <FaPlus />
                                Nueva Sub-Caja
                            </ButtonBase>
                        </Space>
                    </div>

                    {isLoading ? (
                        <div className='flex justify-center items-center h-[400px]'>
                            <Spin size='large' />
                        </div>
                    ) : (
                        <div className='h-[400px] w-full'>
                            <TableBase<SubCaja>
                                ref={gridRef}
                                rowData={cajaData.sub_cajas}
                                columnDefs={columns}
                                rowSelection={false}
                                withNumberColumn={true}
                                headerColor='var(--color-amber-600)'
                            />
                        </div>
                    )}

                    {cajaData.sub_cajas.length > 0 && (
                        <div className='mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                            <p className='text-xs text-slate-600'>
                                <strong>Nota:</strong> La Caja Chica se crea automáticamente y no puede ser modificada ni eliminada.
                            </p>
                        </div>
                    )}
                </div>
            </Modal>

            <ModalCrearSubCaja
                open={openCrearSubCaja}
                setOpen={setOpenCrearSubCaja}
                cajaPrincipalId={cajaPrincipal.id}
                onSuccess={onSuccess}
            />

            {subCajaSeleccionada && (
                <ModalEditarSubCaja
                    open={openEditarSubCaja}
                    setOpen={setOpenEditarSubCaja}
                    subCaja={subCajaSeleccionada}
                    onSuccess={() => {
                        onSuccess?.()
                        setSubCajaSeleccionada(null)
                    }}
                />
            )}

            <ModalTransferirEntreSubCajas
                open={openTransferirSubCajas}
                onClose={() => setOpenTransferirSubCajas(false)}
                subCajas={cajaData.sub_cajas}
                cajaPrincipalId={cajaPrincipal.id}
                onSuccess={onSuccess}
            />
        </>
    )
}
