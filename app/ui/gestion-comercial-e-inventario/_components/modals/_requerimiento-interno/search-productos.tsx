"use client"

import { useState } from "react"
import { SearchOutlined, PlusOutlined } from "@ant-design/icons"

interface Producto {
    id: number
    codigo: string
    nombre: string
    stock: number
    unidad: string
}

interface SearchProductosProps {
    productos: Producto[]
    onAgregar: (producto: Producto) => void
    productosSeleccionados: number[]
}

export default function SearchProductos({ productos, onAgregar, productosSeleccionados }: SearchProductosProps) {
    const [busqueda, setBusqueda] = useState("")

    const productosFiltrados = busqueda.length > 1
        ? productos.filter(p =>
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.codigo.toLowerCase().includes(busqueda.toLowerCase())
        )
        : []

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm">
                        <SearchOutlined />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Explorador de Inventario</span>
                </div>
                <div className="relative flex-1 max-w-xs">
                    <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                </div>
            </div>

            {busqueda.length > 1 ? (
                <div className="max-h-64 overflow-y-auto">
                    {productosFiltrados.length > 0 ? (
                        productosFiltrados.map(p => {
                            const isAdded = productosSeleccionados.includes(p.id)
                            return (
                                <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <span className="font-mono text-xs font-semibold text-emerald-600 w-20 flex-shrink-0">{p.codigo}</span>
                                    <span className="text-sm text-slate-700 flex-1">{p.nombre}</span>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded ${p.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        Stock: {p.stock} {p.unidad}
                                    </span>
                                    <button
                                        onClick={() => onAgregar(p)}
                                        disabled={isAdded}
                                        className={`w-7 h-7 rounded flex items-center justify-center text-white text-sm transition-colors ${
                                            isAdded
                                                ? 'bg-slate-300 cursor-not-allowed'
                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                    >
                                        {isAdded ? '✓' : <PlusOutlined />}
                                    </button>
                                </div>
                            )
                        })
                    ) : (
                        <div className="px-4 py-8 text-center text-slate-400 text-sm">
                            Sin resultados para "{busqueda}"
                        </div>
                    )}
                </div>
            ) : (
                <div className="px-4 py-6 text-center text-slate-400 text-xs italic">
                    Ingrese al menos 2 caracteres para buscar...
                </div>
            )}
        </div>
    )
}
