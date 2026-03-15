'use client'

import { useState, useEffect } from 'react'
import { Tag, Input, Spin, Empty, Tooltip, message } from 'antd'
import { FaSearch, FaChevronRight, FaPlus } from 'react-icons/fa'
import { requerimientoInternoApi, type RequerimientoInterno, type RequerimientoInternoProducto } from '~/lib/api/requerimiento-interno'
import dayjs, { Dayjs } from 'dayjs'
import { useDebounce } from 'use-debounce'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'

export interface ProductoSidebarSelection {
    id: number
    producto_id: number | null
    codigo: string
    nombre: string
    marca: string
    unidad: string
    cantidad: number
    cantidad_requerida: number
    cantidad_pendiente: number
    precio_compra: number
    flete: number
    vencimiento: string | null
    lote: string
    requerimiento_id: number
    requerimiento_codigo: string
    proveedor_sugerido: RequerimientoInterno['proveedor_sugerido']
}

interface ProductoAgregado {
    id: number
    cantidad: number
}

interface SidebarSolicitudesProps {
    onAddProduct: (product: ProductoSidebarSelection) => void
    onAddAll: (products: ProductoSidebarSelection[]) => void
    productosAgregados: ProductoAgregado[]
    onSeleccionarRequerimiento?: (req: RequerimientoInterno) => void
}

export default function SidebarSolicitudes({ onAddProduct, onAddAll, productosAgregados, onSeleccionarRequerimiento }: SidebarSolicitudesProps) {
    const [searchText, setSearchText] = useState('')
    const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(dayjs().startOf('month'))
    const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(dayjs().endOf('month'))
    const [expandedIds, setExpandedIds] = useState<number[]>([])
    const [debouncedSearch] = useDebounce(searchText, 500)
    const [requerimientos, setRequerimientos] = useState<RequerimientoInterno[]>([])
    const [loading, setLoading] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [selectedReqId, setSelectedReqId] = useState<number | null>(null)

    useEffect(() => {
        fetchRequerimientos()
    }, [fechaDesde, fechaHasta, debouncedSearch])

    const fetchRequerimientos = async () => {
        setLoading(true)
        try {
            const response = await requerimientoInternoApi.getAll({
                desde: fechaDesde?.format('YYYY-MM-DD'),
                hasta: fechaHasta?.format('YYYY-MM-DD'),
                search: debouncedSearch,
                per_page: 100
            })
            if (response.data?.data) {
                const filtered = response.data.data.filter(req =>
                    (req.productos || []).some(p => (p.cantidad_restante ?? p.cantidad_pendiente ?? p.cantidad) > 0)
                )
                setRequerimientos(filtered)
            }
        } catch (error) {
            console.error('Error fetching requerimientos:', error)
            message.error('Error al cargar las solicitudes')
        } finally {
            setLoading(false)
        }
    }

    const toggleExpand = (req: RequerimientoInterno) => {
        const id = req.id
        const isCurrentlyExpanded = expandedIds.includes(id)

        if (!isCurrentlyExpanded) {
            setExpandedIds(prev => [...prev, id])
            setSelectedReqId(id)
            onSeleccionarRequerimiento?.(req)
        } else {
            setExpandedIds(prev => prev.filter(i => i !== id))
        }
    }

    const getRemaining = (p: RequerimientoInternoProducto): number => {
        // Solo mostrar la cantidad original del requerimiento
        // No restar lo ya agregado, porque queremos permitir agregar múltiples veces
        return Number(p.cantidad)
    }

    const mapToSelection = (p: RequerimientoInternoProducto, req: RequerimientoInterno): ProductoSidebarSelection => {
        const remaining = getRemaining(p)
        return {
            id: p.id,
            producto_id: p.producto_id,
            codigo: p.producto?.cod_producto || 'MANUAL',
            nombre: p.producto?.name || p.nombre_adicional || '—',
            marca: p.producto?.marca?.name || '',
            unidad: p.unidad || p.producto?.unidad_medida?.name || 'UND',
            cantidad: remaining,
            cantidad_requerida: Number(p.cantidad),
            cantidad_pendiente: remaining,
            precio_compra: 0,
            flete: 0,
            vencimiento: null,
            lote: '',
            requerimiento_id: req.id,
            requerimiento_codigo: req.codigo,
            proveedor_sugerido: req.proveedor_sugerido
        }
    }

    const handleAddAll = (req: RequerimientoInterno) => {
        const productsToAdd = (req.productos || [])
            .filter(p => getRemaining(p) > 0)
            .map(p => mapToSelection(p, req))

        if (productsToAdd.length > 0) {
            onAddAll(productsToAdd)
            message.success(`Se agregaron ${productsToAdd.length} productos de ${req.codigo}`)
        }
    }


    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsCollapsed(false)}
                title="Expandir Solicitudes"
                className="flex items-center justify-center w-6 h-full bg-emerald-600 hover:bg-emerald-700 transition-colors shrink-0 shadow-md"
            >
                <FaChevronRight className="text-white" size={12} />
            </button>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200 shadow-sm overflow-hidden w-80">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-2 justify-between bg-emerald-50/50 border-emerald-100">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 bg-emerald-600 rounded-full flex items-center justify-center shadow-md grow-0 shrink-0">
                        <FaChevronRight className="text-white text-xs" />
                    </div>
                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">Solicitudes</h2>
                </div>
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-1 hover:bg-emerald-100/50 rounded-lg transition-colors shrink-0"
                    title="Contraer"
                >
                    <FaChevronRight className="text-slate-400 rotate-180" size={14} />
                </button>
            </div>

            {/* Filters */}
            {!isCollapsed && (
                <div className="p-3 space-y-2 bg-slate-50/30 border-b border-slate-100">
                    <Input
                        placeholder="Buscar requerimiento..."
                        prefix={<FaSearch className="text-slate-300" size={12} />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        className="!rounded-lg !text-xs !py-1.5 shadow-sm border-slate-200 hover:border-emerald-400 focus:border-emerald-500"
                        allowClear
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <DatePickerBase
                            placeholder="Desde"
                            value={fechaDesde}
                            onChange={val => setFechaDesde(val)}
                            className="!w-full !text-[10px] !rounded-md"
                            size="small"
                            formWithMessage={false}
                            propsForm={{ name: 'desde' }}
                        />
                        <DatePickerBase
                            placeholder="Hasta"
                            value={fechaHasta}
                            onChange={val => setFechaHasta(val)}
                            className="!w-full !text-[10px] !rounded-md"
                            size="small"
                            formWithMessage={false}
                            propsForm={{ name: 'hasta' }}
                        />
                    </div>
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 bg-white">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-32 gap-2">
                        <Spin size="small" />
                        {!isCollapsed && <span className="text-[10px] text-slate-400 font-medium italic">Cargando solicitudes...</span>}
                    </div>
                ) : requerimientos.length === 0 ? (
                    !isCollapsed && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-[10px]">No hay solicitudes pendientes</span>} />
                ) : (
                    requerimientos
                        .filter(req => (req.productos || []).some(p => getRemaining(p) > 0))
                        .map(req => {
                        const isExpanded = expandedIds.includes(req.id)
                        const isSelected = selectedReqId === req.id
                        const pendingProds = (req.productos || []).filter(p => getRemaining(p) > 0)
                        const allAdded = pendingProds.length === 0

                        return (
                            <div key={req.id} className={`border rounded-xl overflow-hidden transition-all duration-200 ${isSelected ? 'border-emerald-300 shadow-md scale-[1.01]' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
                                {/* Req Header */}
                                <div
                                    className={`p-3 cursor-pointer flex items-center justify-between transition-colors ${isExpanded ? 'bg-emerald-50/40' : 'bg-white hover:bg-slate-50'}`}
                                    onClick={() => !isCollapsed && toggleExpand(req)}
                                >
                                    {isCollapsed ? (
                                        <Tooltip title={req.codigo} placement="right">
                                            <div className="w-full flex justify-center">
                                                <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                                                    {req.codigo.slice(-4)}
                                                </span>
                                            </div>
                                        </Tooltip>
                                    ) : (
                                        <>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded border italic transition-colors ${isSelected ? 'text-emerald-800 bg-emerald-100 border-emerald-200' : 'text-emerald-700 bg-emerald-50 border-emerald-100'}`}>
                                                        {req.codigo}
                                                    </span>
                                                    <Tag color={req.prioridad === 'URGENTE' ? 'red' : 'blue'} bordered={false} className="text-[9px] leading-tight m-0 px-1 font-bold">
                                                        {req.prioridad}
                                                    </Tag>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-medium line-clamp-1">{req.area}</span>
                                                <span className="text-[9px] text-slate-400 font-medium">{dayjs(req.fecha_requerida).format('DD/MM/YYYY')} · {req.productos?.length || 0} ítems</span>
                                            </div>
                                            <FaChevronRight className={`text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-emerald-500' : ''}`} size={10} />
                                        </>
                                    )}
                                </div>

                                {/* Detail */}
                                {isExpanded && !isCollapsed && (
                                    <div className="bg-slate-50/30 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                                        <div className="p-2 flex justify-end">
                                            <button
                                                className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${allAdded ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:shadow-sm'}`}
                                                onClick={(e) => { e.stopPropagation(); handleAddAll(req); }}
                                                disabled={allAdded}
                                            >
                                                {allAdded ? '✓ Agregado' : '+ Agregar Todo'}
                                            </button>
                                        </div>
                                        <div className="flex flex-col divide-y divide-slate-100">
                                            {pendingProds.map(p => {
                                                const remaining = getRemaining(p)
                                                return (
                                                    <div key={p.id} className="p-2.5 flex items-center justify-between gap-2 group transition-colors hover:bg-white">
                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                            <span className="text-[11px] font-semibold line-clamp-2 text-slate-700">
                                                                {p.producto?.name || p.nombre_adicional}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] text-slate-400 font-mono">
                                                                    {p.producto?.cod_producto || 'MANUAL'}
                                                                </span>
                                                                <span className="text-[9px] text-slate-300 font-bold">·</span>
                                                                <span className="text-[9px] text-emerald-600 font-bold">{p.unidad}</span>
                                                            </div>
                                                            <div className="mt-1 flex items-center gap-1.5">
                                                                <span className="text-[10px] bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-bold shadow-sm">
                                                                    Cant: {Number(p.cantidad).toFixed(2)}
                                                                </span>
                                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-bold shadow-sm">
                                                                    Pend: {remaining.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-emerald-600 text-white shadow-md hover:scale-110 active:scale-95"
                                                            onClick={() => onAddProduct(mapToSelection(p, req))}
                                                        >
                                                            <FaPlus size={10} />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
