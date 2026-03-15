"use client"

interface PRIORIDAD {
    value: string
    label: string
    color: string
}

interface StepGeneralProps {
    form: any
    setField: (key: string, value: any) => void
    errors: Record<string, string>
    areas: string[]
    prioridades: PRIORIDAD[]
}

export default function StepGeneral({ form, setField, errors, areas, prioridades }: StepGeneralProps) {
    return (
        <div className="space-y-5">
            {/* Título */}
            <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Título del Requerimiento <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    placeholder="Ej: Mantenimiento preventivo de equipos de producción"
                    value={form.titulo}
                    onChange={(e) => setField("titulo", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm font-family-inherit outline-none transition-all ${
                        errors.titulo ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    }`}
                />
                {errors.titulo && <p className="text-xs text-red-600 font-medium mt-1">{errors.titulo}</p>}
            </div>

            {/* Área y Fecha */}
            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        Área Solicitante <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={form.area}
                        onChange={(e) => setField("area", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${
                            errors.area ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        }`}
                    >
                        <option value="">Seleccionar área...</option>
                        {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    {errors.area && <p className="text-xs text-red-600 font-medium mt-1">{errors.area}</p>}
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        Fecha Requerida <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={form.fechaRequerida}
                        onChange={(e) => setField("fechaRequerida", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${
                            errors.fechaRequerida ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        }`}
                    />
                    {errors.fechaRequerida && <p className="text-xs text-red-600 font-medium mt-1">{errors.fechaRequerida}</p>}
                </div>
            </div>

            {/* Prioridad */}
            <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Prioridad
                </label>
                <div className="flex gap-2">
                    {prioridades.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setField("prioridad", p.value)}
                            className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold border transition-all ${
                                form.prioridad === p.value
                                    ? p.color + " border-current"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tipo de Solicitud */}
            <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Tipo de Solicitud <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { value: "OC", icon: "🛒", title: "Orden de Compra", desc: "Adquisición de bienes, repuestos o materiales." },
                        { value: "OS", icon: "🔧", title: "Orden de Servicio", desc: "Contratación de mano de obra o servicios externos." },
                    ].map(t => (
                        <button
                            key={t.value}
                            onClick={() => setField("tipoSolicitud", t.value)}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                                form.tipoSolicitud === t.value
                                    ? "border-emerald-500 bg-emerald-50"
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                        >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base mb-2 ${
                                form.tipoSolicitud === t.value
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-600"
                            }`}>
                                {t.icon}
                            </div>
                            <div className={`text-sm font-bold mb-1 ${form.tipoSolicitud === t.value ? "text-emerald-900" : "text-slate-700"}`}>
                                {t.title}
                            </div>
                            <div className="text-xs text-slate-500 leading-tight">{t.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Observaciones */}
            <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Observaciones Adicionales
                </label>
                <textarea
                    placeholder="Escriba aquí cualquier detalle o consideración adicional relevante..."
                    value={form.observaciones}
                    onChange={(e) => setField("observaciones", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none transition-all hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 resize-vertical"
                />
            </div>
        </div>
    )
}
