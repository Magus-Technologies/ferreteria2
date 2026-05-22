"use client"

import InputBase from "~/app/_components/form/inputs/input-base"
import SelectBase from "~/app/_components/form/selects/select-base"
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base"
import TextareaBase from "~/app/_components/form/inputs/textarea-base"
import { Radio } from "antd"
import dayjs, { Dayjs } from "dayjs"

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
    cargos: { label: string; value: string }[]
    defaultTipoSolicitud?: 'OC' | 'OS' | 'SOC'
}

export default function StepGeneral({ form, setField, errors, areas, prioridades, cargos, defaultTipoSolicitud = 'OC' }: StepGeneralProps) {
    return (
        <div className="space-y-4">
            {/* Título */}
            <div>
                <label className="block text-sm font-medium mb-1">
                    Título del Requerimiento <span className="text-red-500">*</span>
                </label>
                <InputBase
                    placeholder="Ej: Mantenimiento preventivo de equipos de producción"
                    value={form.titulo}
                    onChange={(e) => setField("titulo", e.target.value)}
                    status={errors.titulo ? "error" : undefined}
                />
                {errors.titulo && <p className="text-xs text-red-600 mt-1">{errors.titulo}</p>}
            </div>

            {/* Cargo y Fecha */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Cargo u Ocupación <span className="text-red-500">*</span>
                    </label>
                    <SelectBase
                        placeholder="Seleccionar cargo..."
                        value={form.cargo}
                        onChange={(val) => setField("cargo", val)}
                        options={cargos}
                        className="w-full"
                        status={errors.cargo ? "error" : undefined}
                    />
                    {errors.cargo && <p className="text-xs text-red-600 mt-1">{errors.cargo}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Fecha Requerida <span className="text-red-500">*</span>
                    </label>
                    <DatePickerBase
                        placeholder="Seleccionar fecha"
                        value={form.fechaRequerida ? dayjs(form.fechaRequerida) : null}
                        onChange={(date: Dayjs | null) => setField("fechaRequerida", date ? date.format('YYYY-MM-DD') : "")}
                        className="w-full"
                        status={errors.fechaRequerida ? "error" : undefined}
                    />
                    {errors.fechaRequerida && <p className="text-xs text-red-600 mt-1">{errors.fechaRequerida}</p>}
                </div>
            </div>

            {/* Prioridad */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Prioridad
                </label>
                <Radio.Group
                    value={form.prioridad}
                    onChange={(e) => setField("prioridad", e.target.value)}
                    className="w-full"
                >
                    <div className="grid grid-cols-4 gap-2">
                        {prioridades.map(p => (
                            <Radio.Button key={p.value} value={p.value} className="text-center">
                                {p.label}
                            </Radio.Button>
                        ))}
                    </div>
                </Radio.Group>
            </div>

            {/* Tipo de Solicitud */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Tipo de Solicitud <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <div
                        onClick={() => setField("tipoSolicitud", defaultTipoSolicitud === "SOC" ? "SOC" : "OC")}
                        className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                            form.tipoSolicitud === "OC" || form.tipoSolicitud === "SOC"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                        <div className="text-3xl mb-2">🛒</div>
                        <div className="font-semibold text-base mb-1">Orden de Compra</div>
                        <div className="text-xs text-gray-500">Adquisición de bienes, repuestos o materiales</div>
                    </div>
                    <div
                        onClick={() => setField("tipoSolicitud", "OS")}
                        className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                            form.tipoSolicitud === "OS"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                        <div className="text-3xl mb-2">🔧</div>
                        <div className="font-semibold text-base mb-1">Orden de Servicio</div>
                        <div className="text-xs text-gray-500">Contratación de mano de obra o servicios externos</div>
                    </div>
                </div>
            </div>

            {/* Observaciones */}
            <div>
                <label className="block text-sm font-medium mb-1">
                    Observaciones Adicionales
                </label>
                <TextareaBase
                    placeholder="Escriba aquí cualquier detalle o consideración adicional relevante..."
                    value={form.observaciones}
                    onChange={(e) => setField("observaciones", e.target.value)}
                    rows={3}
                    uppercase={false}
                />
            </div>
        </div>
    )
}
