'use client'

import { Modal, App, Space, Spin, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import { useState, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FaPlus, FaExchangeAlt, FaWarehouse, FaBoxes } from 'react-icons/fa'
import { ExclamationCircleOutlined, UserOutlined, BankOutlined } from '@ant-design/icons'
import type { CajaPrincipal, SubCaja } from '~/lib/api/caja-principal'
import { cajaPrincipalApi } from '~/lib/api/caja-principal'
import { fetchCajaActivaOrNull } from '~/lib/api/caja'
import { transaccionesCajaApi } from '~/lib/api/transacciones-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalCrearSubCaja from '~/app/ui/facturacion-electronica/gestion-cajas/_components/modal-crear-sub-caja'
import ModalEditarSubCaja from '~/app/ui/facturacion-electronica/gestion-cajas/_components/modal-editar-sub-caja'
import ModalTransferirEntreSubCajas from '~/app/ui/facturacion-electronica/gestion-cajas/_components/modal-transferir-entre-sub-cajas'
import ButtonBase from '~/components/buttons/button-base'
import TableWithTitle from '~/components/tables/table-with-title'
import { AgGridReact } from 'ag-grid-react'
import { useColumnsSubCajas } from '~/app/ui/facturacion-electronica/gestion-cajas/_components/columns-sub-cajas'
import HistorialTrasladosBoveda from '~/app/ui/facturacion-electronica/mis-aperturas-cierres/_components/modals/historial-traslados-boveda'
import HistorialTrasladoEfectivoCaja from '~/app/ui/facturacion-electronica/gestion-cajas/_components/historial-traslado-efectivo-caja'
import HistorialPrestamosVendedores from '~/app/ui/facturacion-electronica/movimientos-caja/_components/historial-prestamos-vendedores'
import HistorialDepositosSeguridad from '~/app/ui/facturacion-electronica/movimientos-caja/_components/historial-depositos-seguridad'

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
    const [activeTab, setActiveTab] = useState('sub-cajas')
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

    const handleVerHistorialTraslados = (subCaja: SubCaja) => {
        setSubCajaSeleccionada(subCaja)
        setActiveTab('historial-traslados')
    }

    // Saldo NO CERRADO por sub-caja = saldo actual − disponible cerrado
    // (dinero de la sesión abierta, aún sin cerrar caja)
    const { data: saldosMovimiento = [] } = useQuery({
        queryKey: ['saldos-disponibles-movimiento'],
        queryFn: async () => {
            const response = await transaccionesCajaApi.getSaldosDisponiblesMovimiento()
            return response.data?.data || []
        },
        enabled: open,
    })

    // NO CERRADO viene del backend (sesión abierta + monto de apertura);
    // CERRADO es el disponible de sesiones cerradas.
    const saldosNoCerrados = useMemo(() => Object.fromEntries(
        saldosMovimiento.map((s) => [s.sub_caja_id, s.saldo_no_cerrado ?? Math.max(s.saldo_actual - s.saldo_disponible, 0)])
    ), [saldosMovimiento])

    const saldosCerrados = useMemo(() => Object.fromEntries(
        saldosMovimiento.map((s) => [s.sub_caja_id, s.saldo_disponible])
    ), [saldosMovimiento])

    // Totales del header: cada uno es la suma EXACTA de su columna en la tabla,
    // resuelta con la misma lógica de fallback que usan las celdas. Así lo que el
    // usuario suma a ojo siempre coincide con lo que muestra el header.
    //
    // No se usa `cajaData.saldo_total` (el backend lo calcula por su cuenta): la
    // única fuente son estos mismos saldos, para que header y filas no diverjan.
    const { saldoTotalMostrado, totalNoCerrado } = useMemo(() => {
        let cerrado = 0
        let noCerrado = 0

        for (const sc of cajaData.sub_cajas as SubCaja[]) {
            cerrado += saldosCerrados[sc.id] ?? parseFloat(sc.saldo_actual)
            noCerrado += saldosNoCerrados[sc.id] ?? 0
        }

        return { saldoTotalMostrado: cerrado, totalNoCerrado: noCerrado }
    }, [cajaData.sub_cajas, saldosCerrados, saldosNoCerrados])

    // Todo el dinero que hay en la caja: lo consolidado más lo que sigue dentro
    // de las sesiones abiertas.
    const totalGeneral = saldoTotalMostrado + totalNoCerrado

    // MEMOIZAR las columnas: si el array cambia de identidad en cada render,
    // AG Grid recibe columnDefs nuevas constantemente y resetea el orden en
    // pleno arrastre (por eso "no dejaba" mover las columnas).
    const columns = useMemo(
        // eslint-disable-next-line react-hooks/rules-of-hooks
        () => useColumnsSubCajas({
            onEditar: handleEditarSubCaja,
            onEliminar: handleEliminarSubCaja,
            onVerHistorialTraslados: handleVerHistorialTraslados,
            saldosNoCerrados,
            saldosCerrados,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [saldosNoCerrados, saldosCerrados]
    )

    // Encontrar la Caja Chica
    const cajaChica = cajaData.sub_cajas.find((sc: SubCaja) => sc.es_caja_chica)

    // Obtener caja activa para sacar su ID (ULID)
    const { data: cajaActiva } = useQuery({
        queryKey: [QueryKeys.CAJA_ACTIVA],
        queryFn: () => fetchCajaActivaOrNull(),
        staleTime: 30000,
        gcTime: 60000,
        retry: 1,
        enabled: open,
    })

    const tabItems: TabsProps['items'] = useMemo(
        () => [
            {
                key: 'sub-cajas',
                label: (
                    <span className='flex items-center gap-2 px-2'>
                        <FaBoxes className='text-sm' />
                        Sub-Cajas
                    </span>
                ),
                children: (
                    <div className='pt-2 animate-in fade-in duration-500'>
                        <div className='flex justify-between items-center mb-4'>
                            <div className='flex gap-4 items-center'>
                                {/* Cada total usa el color de su columna en la tabla:
                                    verde = Saldo Cerrado, azul = Saldo No Cerrado. */}
                                <div className='text-sm'>
                                    <span className='text-slate-500'>Saldo Total:</span>{' '}
                                    <span className='font-bold text-emerald-600'>
                                        S/. {saldoTotalMostrado.toFixed(2)}
                                    </span>
                                </div>
                                <div className='text-sm'>
                                    <span className='text-slate-500'>No Cerrado:</span>{' '}
                                    <span className='font-bold text-blue-600'>
                                        S/. {totalNoCerrado.toFixed(2)}
                                    </span>
                                </div>
                                <div className='text-sm border-l border-slate-300 pl-4'>
                                    <span className='text-slate-500'>Total General:</span>{' '}
                                    <span className='font-bold text-slate-800'>
                                        S/. {totalGeneral.toFixed(2)}
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
                                <TableWithTitle<SubCaja>
                                    id='gestion-cajas-sub-cajas'
                                    title='Sub-Cajas'
                                    tableRef={gridRef}
                                    rowData={cajaData.sub_cajas}
                                    columnDefs={columns}
                                    rowSelection={false}
                                    withNumberColumn={true}
                                    suppressDragLeaveHidesColumns={true}
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
                ),
            },
            {
                key: 'historial-traslados',
                label: (
                    <span className='flex items-center gap-2 px-2'>
                        <FaWarehouse className='text-sm' />
                        Historial de Traslados a Bóveda
                    </span>
                ),
                children: cajaChica ? (
                    <div className='pt-2 animate-in slide-in-from-right-4 duration-500'>
                        <HistorialTrasladosBoveda
                            aperturaCierreId={cajaActiva?.id || ''}
                            onTrasladoAnulado={onSuccess}
                        />
                    </div>
                ) : (
                    <div className='flex flex-col items-center justify-center h-[400px] text-slate-400'>
                        <FaWarehouse size={48} className='mb-4' />
                        <p className='text-lg font-semibold'>No hay Caja Chica disponible</p>
                        <p className='text-sm'>La Caja Chica se crea automáticamente con la caja principal</p>
                    </div>
                ),
            },
            {
                key: 'traslado-efectivo',
                label: (
                    <span className='flex items-center gap-2 px-2'>
                        <FaExchangeAlt className='text-sm' />
                        Traslado de Efectivo
                    </span>
                ),
                children: (
                    <div className='pt-2 animate-in slide-in-from-right-4 duration-500'>
                        <HistorialTrasladoEfectivoCaja cajaPrincipalId={cajaPrincipal.id} />
                    </div>
                ),
            },
            {
                key: 'prestamos-vendedores',
                label: (
                    <span className='flex items-center gap-2 px-2'>
                        <UserOutlined className='text-sm' />
                        Préstamos entre Vendedores
                    </span>
                ),
                children: (
                    <div className='pt-2 animate-in slide-in-from-right-4 duration-500'>
                        <HistorialPrestamosVendedores />
                    </div>
                ),
            },
            {
                key: 'depositos-seguridad',
                label: (
                    <span className='flex items-center gap-2 px-2'>
                        <BankOutlined className='text-sm' />
                        Depósitos de Seguridad
                    </span>
                ),
                children: (
                    <div className='pt-2 animate-in slide-in-from-right-4 duration-500'>
                        <HistorialDepositosSeguridad />
                    </div>
                ),
            },
        ],
        [cajaData, isLoading, columns, cajaChica, cajaPrincipal.id, onSuccess, cajaActiva?.id, saldoTotalMostrado, totalNoCerrado, totalGeneral]
    )

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
                destroyOnHidden
            >
                <div className='mt-4 min-h-[500px]'>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        size='large'
                        items={tabItems}
                        animated={{ inkBar: true, tabPane: true }}
                    />
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
                    cajaPrincipalId={cajaPrincipal.id}
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
