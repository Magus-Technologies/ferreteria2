"use client"

import { useRef } from "react"
import { ColDef } from "ag-grid-community"
import TableWithTitle from "~/components/tables/table-with-title"

interface ItemBuscado {
    id: number | null
    codigo: string
    nombre: string
    nombre_adicional?: string
    cantidad: number
    unidad: string
    stock?: number
}

interface PRIORIDAD {
    value: string
    label: string
    color: string
}

interface StepResumenProps {
    form: any
    productosSeleccionados: ItemBuscado[]
    prioridades: PRIORIDAD[]
}

export default function StepResumen({ form, productosSeleccionados, prioridades }: StepResumenProps) {
    const tableGridRef = useRef<any>(null)
    const prio = prioridades.find(p => p.value === form.prioridad)

    const columnDefs: ColDef<ItemBuscado>[] = [
        {
            headerName: "#",
            valueGetter: "node.rowIndex + 1",
            width: 50,
            cellStyle: { textAlign: "center", fontWeight: "500" },
        },
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
                <div className="border border-slate-200 rounded-lg overflow-hidden">
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
                            ["Área", form.area || "—"],
                            ["Fecha requerida", form.fechaRequerida || "—"],
                            ["Observaciones", form.observaciones || "—"],
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
                    domLayout="normal"
                    getRowHeight={() => 45}
                    exportExcel={false}
                    exportPdf={false}
                    selectColumns={false}
                />
            ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Detalle del servicio</span>
                    </div>
                    <div className="px-4 py-4 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                ["Categoría", form.tipoServicio || "—"],
                                ["Duración", form.duracionCif ? `${form.duracionCif} ${form.duracionUnidad}` : "—"],
                                ["Presupuesto Ref.", form.presupuestoReferencial ? `S/ ${form.presupuestoReferencial}` : "—"],
                            ].map(([k, v]) => (
                                <div key={k}>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        {k}
                                    </div>
                                    <div className="text-sm font-semibold text-slate-900">
                                        {v}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-3 border-t border-slate-100">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Descripción
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed italic">
                                "{form.descripcionServicio}"
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
