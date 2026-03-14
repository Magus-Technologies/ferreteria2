"use client"

import { useState } from "react"

interface ItemBuscado {
    id: number | null
    codigo: string
    nombre: string
    nombre_adicional?: string
    cantidad: number
    unidad: string
    stock?: number
    marca?: string
}

interface ProductoDisponible {
    id: number
    codigo?: string
    cod_producto?: string
    nombre?: string
    name?: string
    stock_fraccion?: number
    unidad_medida?: { name: string }
    stock?: number
    unidad?: string
    marca?: { id: number; name: string }
}

interface StepProductosProps {
    form: any
    setField: (key: string, value: any) => void
    errors: Record<string, string>
    productosDisponibles: ProductoDisponible[]
    productosSeleccionados: ItemBuscado[]
    onAgregarProducto: (p: ItemBuscado) => void
    onQuitarProducto: (id: number | string) => void
    onCambiarCantidad: (id: number | string, cantidad: number) => void
    onCambiarUnidad: (id: number | string, unidad: string) => void
}

export default function StepProductos({
    form,
    setField,
    errors,
    productosDisponibles,
    productosSeleccionados,
    onAgregarProducto,
    onQuitarProducto,
    onCambiarCantidad,
    onCambiarUnidad,
}: StepProductosProps) {
    const [busqueda, setBusqueda] = useState("")

    const productosFiltrados = busqueda.length > 1
        ? productosDisponibles.filter(p => {
            const nombre = (p.name || p.nombre || "").toLowerCase()
            const codigo = (p.cod_producto || p.codigo || "").toLowerCase()
            return nombre.includes(busqueda.toLowerCase()) || codigo.includes(busqueda.toLowerCase())
        })
        : []

    const agregarProducto = (p: ProductoDisponible) => {
        const item: ItemBuscado = {
            id: p.id,
            codigo: p.cod_producto || p.codigo || "",
            nombre: p.name || p.nombre || "",
            cantidad: 1,
            unidad: p.unidad_medida?.name || p.unidad || "UND",
            stock: p.stock_fraccion || p.stock || 0,
            marca: p.marca?.name || "",
        }
        onAgregarProducto(item)
    }

    const agregarProductoManual = () => {
        if (!busqueda.trim()) return
        const item: ItemBuscado = {
            id: null,
            codigo: "N/A",
            nombre: busqueda.trim(),
            nombre_adicional: busqueda.trim(),
            cantidad: 1,
            unidad: "UND",
            stock: 0,
        }
        onAgregarProducto(item)
        setBusqueda("")
    }

    return (
        <div className="space-y-5">
            {/* Search Box */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Explorador de inventario
                    </span>
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código de producto..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && busqueda.length > 2 && productosFiltrados.length === 0) {
                                    agregarProductoManual()
                                }
                            }}
                            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded text-sm outline-none transition-all hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        />
                    </div>
                </div>

                {/* Resultados */}
                <div className="max-h-64 overflow-y-auto">
                    {busqueda.length > 1 ? (
                        <>
                            {productosFiltrados.length > 0 ? (
                                productosFiltrados.map(p => {
                                    const added = !!productosSeleccionados.find(s => s.id === p.id)
                                    return (
                                        <div
                                            key={p.id}
                                            className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                                        >
                                            <span className="font-mono text-xs font-semibold text-emerald-600 w-16 flex-shrink-0">
                                                {p.cod_producto || p.codigo}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-slate-900 truncate">{p.name || p.nombre}</div>
                                                {p.marca?.name && (
                                                    <div className="text-[10px] text-slate-500 font-medium">{p.marca.name}</div>
                                                )}
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded flex-shrink-0 ${(p.stock_fraccion || p.stock || 0) > 0
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-red-100 text-red-700"
                                                }`}>
                                                Stock: {p.stock_fraccion || p.stock || 0}
                                            </span>
                                            <button
                                                onClick={() => agregarProducto(p)}
                                                disabled={added}
                                                className={`w-7 h-7 rounded flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all ${added
                                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                                                    }`}
                                            >
                                                {added ? "✓" : "+"}
                                            </button>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="px-4 py-6 text-center">
                                    <p className="text-sm text-slate-500 mb-2">Sin resultados para "{busqueda}"</p>
                                    <button
                                        onClick={agregarProductoManual}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-bold hover:bg-emerald-100 transition-colors"
                                    >
                                        + Agregar "{busqueda}" como producto nuevo
                                    </button>
                                </div>
                            )}
                            {productosFiltrados.length > 0 && (
                                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                                    <button
                                        onClick={agregarProductoManual}
                                        className="text-[10px] font-bold text-slate-500 hover:text-emerald-600 uppercase tracking-tight"
                                    >
                                        ¿No encuentras lo que buscas? Agregar "{busqueda}" manualmente
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="px-4 py-4 text-center text-xs text-slate-500 italic">
                            Ingrese al menos 2 caracteres para buscar...
                        </div>
                    )}
                </div>
            </div>

            {errors.productos && (
                <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-xs text-red-700 font-medium">
                    ⚠ {errors.productos}
                </div>
            )}

            {/* Materiales a solicitar */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Materiales a solicitar
                    </label>
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                        {productosSeleccionados.length} {productosSeleccionados.length === 1 ? "ítem" : "ítems"}
                    </span>
                </div>

                {productosSeleccionados.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center bg-slate-50">
                        <div className="text-3xl mb-2 opacity-30">📦</div>
                        <p className="text-sm text-slate-500">Use el buscador para añadir productos al requerimiento</p>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        {productosSeleccionados.map((p, idx) => {
                            const uniqueId = p.id || `manual-${idx}-${p.nombre}`
                            return (
                                <div
                                    key={uniqueId}
                                    className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                                >
                                    <span className={`font-mono text-xs font-bold w-16 flex-shrink-0 ${p.id ? 'text-emerald-600' : 'text-amber-600 italic'}`}>
                                        {p.codigo}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-slate-900 truncate">{p.nombre}</div>
                                        {p.marca
                                            ? <div className="text-[10px] text-slate-500 font-medium">{p.marca}</div>
                                            : !p.id && <div className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter">Producto no registrado</div>
                                        }
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        value={p.cantidad}
                                        onChange={(e) => onCambiarCantidad(uniqueId, Number(e.target.value))}
                                        className="w-16 px-2 py-1 border border-slate-200 rounded text-sm text-right outline-none transition-all hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                    />
                                    {p.id ? (
                                        <span className="text-xs font-bold text-emerald-600 w-12 flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap" title={p.unidad}>
                                            {p.unidad}
                                        </span>
                                    ) : (
                                        <input
                                            type="text"
                                            value={p.unidad}
                                            onChange={(e) => onCambiarUnidad(uniqueId, e.target.value)}
                                            placeholder="UND"
                                            className="w-12 px-1 py-1 border border-amber-200 bg-amber-50 rounded text-[10px] font-bold text-center outline-none"
                                        />
                                    )}
                                    <button
                                        onClick={() => onQuitarProducto(uniqueId)}
                                        className="w-6 h-6 rounded border border-red-300 text-red-500 flex items-center justify-center text-xs font-semibold hover:bg-red-50 transition-all flex-shrink-0"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
