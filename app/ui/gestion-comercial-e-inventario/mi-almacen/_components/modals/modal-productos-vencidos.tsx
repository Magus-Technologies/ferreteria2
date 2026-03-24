'use client'

import { useMemo, useState } from 'react'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import { useStoreProductosVencidos } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-productos-vencidos'
import TableProductosPorVencer from '~/app/ui/gestion-comercial-e-inventario/_components/tables/table-productos-por-vencer'
import { Input, InputNumber, Tag, Space, Card, Segmented, Badge, Tooltip } from 'antd'
import { FaCalendarAlt, FaExclamationTriangle, FaSearch } from 'react-icons/fa'
import { MdWarning, MdDangerous, MdAccessTimeFilled } from 'react-icons/md'

type FiltroEstado = 'todos' | 'vencidos' | 'por_vencer'

export default function ModalProductosVencidos() {
    const open = useStoreProductosVencidos(state => state.openModal)
    const setOpen = useStoreProductosVencidos(state => state.setOpenModal)
    const [dias, setDias] = useState<number | null>(null)
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
    const [busqueda, setBusqueda] = useState('')

    // Compute API parameter based on filter state
    const diasParam = useMemo(() => {
        if (filtroEstado === 'vencidos') return 0
        if (filtroEstado === 'por_vencer' && dias !== null && dias > 0) return dias
        if (filtroEstado === 'por_vencer') return 30  // default for "por_vencer"
        return -1 // all
    }, [filtroEstado, dias])

    const getDescripcion = () => {
        if (filtroEstado === 'vencidos') {
            return 'Mostrando solo productos que ya expiraron o vencen hoy'
        }
        if (filtroEstado === 'por_vencer') {
            const d = dias !== null && dias > 0 ? dias : 30
            return `Mostrando productos que vencerán en los próximos ${d} días`
        }
        return 'Mostrando todos los productos con fecha de vencimiento'
    }

    const getTitulo = () => {
        if (filtroEstado === 'vencidos') return 'Productos Vencidos'
        if (filtroEstado === 'por_vencer') return 'Próximos a Vencer'
        return 'Vista General de Vencimientos'
    }

    const handleReset = () => {
        setDias(null)
        setFiltroEstado('todos')
        setBusqueda('')
    }

    return (
        <ModalForm
            open={open}
            setOpen={setOpen}
            modalProps={{
                title: (
                    <TitleForm className='!pb-0'>
                        Vencimientos de Productos
                    </TitleForm>
                ),
                width: 1200,
                footer: null,
                centered: true,
                afterClose: handleReset,
            }}
        >
            <div className='flex flex-col gap-4 py-2'>
                {/* Filtros */}
                <Card
                    variant="borderless"
                    className='bg-gradient-to-r from-rose-50/60 to-orange-50/40 border border-rose-100 rounded-xl'
                    size="small"
                >
                    <div className='flex flex-col gap-4'>
                        {/* Fila 1: Título + Estado */}
                        <div className='flex flex-wrap items-center justify-between gap-4'>
                            <div className='flex items-center gap-3'>
                                <div className='bg-rose-100 text-rose-600 p-2.5 rounded-lg shadow-sm'>
                                    <FaCalendarAlt size={18} />
                                </div>
                                <div>
                                    <h4 className='text-sm font-semibold text-slate-800 m-0'>
                                        {getTitulo()}
                                    </h4>
                                    <p className='text-xs text-slate-500 m-0'>
                                        {getDescripcion()}
                                    </p>
                                </div>
                            </div>

                            {/* Segmented filter for status */}
                            <Segmented
                                value={filtroEstado}
                                onChange={(val) => setFiltroEstado(val as FiltroEstado)}
                                options={[
                                    {
                                        label: (
                                            <div className='flex items-center gap-1.5 px-1'>
                                                <FaCalendarAlt size={13} />
                                                <span>Todos</span>
                                            </div>
                                        ),
                                        value: 'todos',
                                    },
                                    {
                                        label: (
                                            <div className='flex items-center gap-1.5 px-1'>
                                                <MdDangerous size={15} />
                                                <span>Vencidos</span>
                                            </div>
                                        ),
                                        value: 'vencidos',
                                    },
                                    {
                                        label: (
                                            <div className='flex items-center gap-1.5 px-1'>
                                                <MdWarning size={15} />
                                                <span>Por Vencer</span>
                                            </div>
                                        ),
                                        value: 'por_vencer',
                                    },
                                ]}
                                className='bg-white/80'
                            />
                        </div>

                        {/* Fila 2: Búsqueda + Días */}
                        <div className='flex flex-wrap items-center gap-3'>
                            {/* Búsqueda por nombre */}
                            <div className='flex-1 min-w-[200px]'>
                                <Input
                                    placeholder='Buscar por nombre de producto...'
                                    prefix={<FaSearch className='text-slate-400' size={13} />}
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    allowClear
                                    variant="filled"
                                    className='rounded-lg'
                                />
                            </div>

                            {/* Filtro de días - solo visible en "Por Vencer" */}
                            {filtroEstado === 'por_vencer' && (
                                <Space align="center" size="small" className='bg-white/70 px-3 py-1.5 rounded-lg border border-orange-100'>
                                    <Tooltip title="Ingresa la cantidad de días. Ej: 2 = productos que vencen en los próximos 2 días">
                                        <MdAccessTimeFilled className='text-orange-500' size={16} />
                                    </Tooltip>
                                    <span className='text-xs font-medium text-slate-600 whitespace-nowrap'>Vence en:</span>
                                    <InputNumber
                                        min={1}
                                        max={365}
                                        placeholder="30"
                                        value={dias}
                                        onChange={(val) => setDias(val)}
                                        addonAfter="días"
                                        className='w-28'
                                        variant="borderless"
                                        size="small"
                                    />
                                </Space>
                            )}

                            {/* Quick day buttons - solo visible en "Por Vencer" */}
                            {filtroEstado === 'por_vencer' && (
                                <Space size={4}>
                                    {[7, 15, 30, 60, 90].map((d) => (
                                        <Tag
                                            key={d}
                                            color={dias === d ? 'orange' : undefined}
                                            className={`cursor-pointer font-medium !rounded-full !px-2.5 !py-0.5 text-xs transition-all ${dias === d ? 'shadow-sm' : 'hover:bg-orange-50'}`}
                                            onClick={() => setDias(d)}
                                        >
                                            {d}d
                                        </Tag>
                                    ))}
                                </Space>
                            )}

                            {/* Badge de estado actual */}
                            <Tag
                                color={filtroEstado === 'todos' ? 'blue' : filtroEstado === 'vencidos' ? 'error' : 'orange'}
                                className='font-medium px-3 py-1 !rounded-full text-xs'
                            >
                                {filtroEstado === 'todos'
                                    ? 'Ver Todo'
                                    : filtroEstado === 'vencidos'
                                        ? 'Solo Vencidos'
                                        : `Próximos ${dias || 30} días`}
                            </Tag>
                        </div>
                    </div>
                </Card>

                {/* Tabla */}
                <div className='h-[550px] w-full bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm'>
                    <TableProductosPorVencer dias={diasParam} busqueda={busqueda} />
                </div>
            </div>
        </ModalForm>
    )
}
