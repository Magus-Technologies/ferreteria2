"use client"

import { useRef } from "react"
import { ColDef } from "ag-grid-community"
import TableWithTitle from "~/components/tables/table-with-title"
import type { ItemBuscado, ServicioItem } from "./hooks/use-requerimiento-form"
import { Tag } from "antd"

interface PRIORIDAD {
    value: string
    label: string
    color: string
}

interface StepResumenProps {
    form: any
    productosSeleccionados: ItemBuscado[]
    serviciosSeleccionados: ServicioItem[]
    prioridades: PRIORIDAD[]
}

export default function StepResumen({ 
    form, 
    productosSeleccionados, 
    serviciosSeleccionados,
    prioridades 
}: StepResumenProps) {
    const tableGridRef = useRef<any>(null)
    const prio = prioridades.find(p => p.value === form.prioridad)

    const columnDefs: ColDef<ItemBuscado>[] = [
        {
            headerName: "Código",
            field: "codigo",
            width: 100,
            cellStyle: { fontWeight: "600", color: "#059669" },
        },
        {
            headerName: "Descripción",
            field: "nombre",
            flex: 1,
            minWidth: 250,
        },
        {
            headerName: "Cantidad",
            field: "cantidad",
            width: 100,
            cellStyle: { textAlign: "right", fontWeight: "bold", color: "#059669" },
        },
        {
            headerName: "Unidad",
            field: "unidad",
            width: 80,
            cellStyle: { textAlign: "center", fontWeight: "600" },
        },
    ]

    return (
        <div className="space-y-5 animate-in scale-in duration-300">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                <span className="text-blue-600 text-sm flex-shrink-0 mt-0.5">ℹ</span>
                <p className="text-xs text-blue-900 leading-relaxed">
                    Revise los datos antes de enviar. Al confirmar, el requerimiento será derivado al área de supervisión para su aprobación.
                </p>
            </div>

            {/* Tipo y General Info */}
            <div className="grid grid-cols-2 gap-5">
                {/* Tipo de Solicitud */}
                <div className="border border-slate-200 rounded-lg overflow-hidden h-fit">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                        <span className="text-base">{form.tipoSolicitud === "OC" ? "🛒" : "🔧"}</span>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tipo de solicitud</span>
                    </div>
                    <div className="px-4 py-3">
                        <div className="font-bold text-sm text-slate-900 mb-2">
                            {form.tipoSolicitud === "OC" ? "Orden de Compra" : "Orden de Servicio"}
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${prio?.color}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {form.prioridad}
                        </div>
                    </div>
                </div>

                {/* Información General */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Información general</span>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-y divide-slate-100">
                        {[
                            ["Título", form.titulo || "—"],
                            ["Cargo / Ocupación", form.cargo || "—"],
                            ["Fecha requerida", form.fechaRequerida || "—"],
                            ["Observaciones", form.observaciones || "—"],
                            ...(form.tipoSolicitud === 'OS' ? [
                                ["Duración Estimada", `${form.duracionCantidad} ${form.duracionUnidad}`]
                            ] : [])
                        ].map(([k, v]) => (
                            <div key={k} className="px-3 py-2">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    {k}
                                </div>
                                <div className="text-xs font-semibold text-slate-900">
                                    {v}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Información de Vehículo (solo para OS) */}
            {form.tipoSolicitud === "OS" && form.vehiculoId && (
                <div className="border border-amber-200 rounded-lg overflow-hidden bg-amber-50">
                    <div className="bg-amber-100 px-4 py-3 border-b border-amber-200 flex items-center gap-2">
                        <span className="text-base">🚗</span>
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Configuración de Vehículo</span>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-amber-900">Vehículo ID:</span>
                            <span className="text-xs font-bold text-amber-700 bg-white px-2 py-1 rounded">{form.vehiculoId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-amber-900">Afecta Calendario:</span>
                            <Tag color={form.afectaCalendario ? "green" : "default"}>
                                {form.afectaCalendario ? "✓ Sí" : "✗ No"}
                            </Tag>
                        </div>
                        {form.afectaCalendario && (
                            <p className="text-xs text-amber-700 italic mt-2 bg-white p-2 rounded border border-amber-200">
                                Este servicio bloqueará el vehículo en el calendario de entregas durante la duración estimada.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Detalle del Requerimiento */}
            {form.tipoSolicitud === "OC" ? (
                <TableWithTitle<ItemBuscado>
                    tableRef={tableGridRef}
                    id="requerimiento-interno.table-productos-resumen"
                    title="Productos a Solicitar"
                    columnDefs={columnDefs}
                    rowData={productosSeleccionados}
                    loading={false}
                    rowSelection={false}
                    pagination={false}
                    domLayout="autoHeight"
                    exportExcel={false}
                    exportPdf={false}
                    selectColumns={false}
                />
            ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Servicios a Solicitar</span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 rounded-full">{serviciosSeleccionados.length} servicios</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {serviciosSeleccionados.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs italic">
                                No hay servicios agregados
                            </div>
                        ) : (
                            serviciosSeleccionados.map((s, idx) => (
                                <div key={s.id || idx} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{s.descripcionServicio}</div>
                                            <div className="text-xs text-slate-500 italic mt-0.5">Lugar: {s.lugarEjecucion || "—"}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-emerald-600">{s.presupuestoReferencial ? `S/ ${Number(s.presupuestoReferencial).toFixed(2)}` : "Sin presupuesto"}</div>
                                        </div>
                                    </div>
                                    {s.detalles && (
                                        <div className="mt-2 bg-slate-100 p-2 rounded text-xs text-slate-600 border-l-2 border-slate-300">
                                            <div className="font-bold mb-1 text-[10px] uppercase text-slate-500">Detalles y Tareas:</div>
                                            {s.detalles}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
