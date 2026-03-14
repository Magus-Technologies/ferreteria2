"use client"

import { DatePicker } from "antd"
import dayjs from "dayjs"

interface FormServicio {
    tipoServicio: string
    lugarEjecucion: string
    descripcionServicio: string
    fechaInicioEstimada: string
    fechaFinEstimada: string
    presupuestoReferencial: string
}

interface StepServicioProps {
    form: FormServicio
    setField: (key: string, value: string | number | boolean) => void
    errors: Record<string, string>
    tiposServicio: { label: string; value: number }[]
    onAbrirModalTipoServicio: () => void
    proveedores: { label: string; value: number }[]
}

export default function StepServicio({
    form,
    setField,
    errors,
    tiposServicio,
    onAbrirModalTipoServicio,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    proveedores: _proveedores,
}: StepServicioProps) {
    return (
        <div className="space-y-5">
            {/* Servicio Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* Tipo de Servicio */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Tipo de Servicio <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={form.tipoServicio}
                                onChange={(e) => setField("tipoServicio", e.target.value)}
                                className={`flex-1 px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.tipoServicio ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                    }`}
                            >
                                <option value="">Seleccionar...</option>
                                {tiposServicio.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <button
                                onClick={onAbrirModalTipoServicio}
                                className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-700 transition-colors flex-shrink-0"
                                title="Crear nuevo tipo de servicio"
                            >
                                +
                            </button>
                        </div>
                        {errors.tipoServicio && <p className="text-xs text-red-600 font-medium mt-1">{errors.tipoServicio}</p>}
                    </div>

                    {/* Lugar de Ejecución */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Lugar de Ejecución
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Planta Principal, Oficina..."
                            value={form.lugarEjecucion}
                            onChange={(e) => setField("lugarEjecucion", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none transition-all hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        />
                    </div>
                </div>

                {/* Descripción Detallada */}
                <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        Descripción Detallada <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        placeholder="Especifique el alcance, trabajos a realizar y requisitos técnicos..."
                        value={form.descripcionServicio}
                        onChange={(e) => setField("descripcionServicio", e.target.value)}
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all resize-vertical ${errors.descripcionServicio ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                            }`}
                    />
                    {errors.descripcionServicio && <p className="text-xs text-red-600 font-medium mt-1">{errors.descripcionServicio}</p>}
                </div>
            </div>

            {/* Duración y Presupuesto */}
            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        Duración Estimada <span className="text-red-500">*</span>
                    </label>
                    <DatePicker.RangePicker
                        showTime={{ format: "HH:mm" }}
                        format="DD/MM/YYYY HH:mm"
                        placeholder={["Inicio", "Fin"]}
                        value={[
                            form.fechaInicioEstimada ? dayjs(form.fechaInicioEstimada) : null,
                            form.fechaFinEstimada ? dayjs(form.fechaFinEstimada) : null,
                        ]}
                        onChange={(dates) => {
                            setField("fechaInicioEstimada", dates?.[0]?.toISOString() ?? "")
                            setField("fechaFinEstimada", dates?.[1]?.toISOString() ?? "")
                        }}
                        className={`w-full ${errors.duracionRango ? "border-red-400" : ""}`}
                        status={errors.duracionRango ? "error" : undefined}
                    />
                    {errors.duracionRango && <p className="text-xs text-red-600 font-medium mt-1">{errors.duracionRango}</p>}
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        Presupuesto Referencial
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 text-sm font-bold">S/</span>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={form.presupuestoReferencial}
                            onChange={(e) => setField("presupuestoReferencial", e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-md text-sm outline-none transition-all hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
