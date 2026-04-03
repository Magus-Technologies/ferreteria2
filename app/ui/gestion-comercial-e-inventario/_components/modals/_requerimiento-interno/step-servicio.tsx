"use client"

import { DatePicker } from "antd"
import dayjs from "dayjs"
import SelectBase from "~/app/_components/form/selects/select-base"
import InputBase from "~/app/_components/form/inputs/input-base"
import TextareaBase from "~/app/_components/form/inputs/textarea-base"
import InputNumberBase from "~/app/_components/form/inputs/input-number-base"
import { Button } from "antd"
import { PlusOutlined } from "@ant-design/icons"

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
}: StepServicioProps) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {/* Tipo de Servicio */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Tipo de Servicio <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <SelectBase
                            placeholder="Seleccionar..."
                            value={form.tipoServicio ? Number(form.tipoServicio) : undefined}
                            onChange={(value) => setField("tipoServicio", value)}
                            options={tiposServicio}
                            status={errors.tipoServicio ? "error" : undefined}
                            className="flex-1"
                        />
                        <Button
                            icon={<PlusOutlined />}
                            onClick={onAbrirModalTipoServicio}
                            type="primary"
                            title="Crear nuevo tipo de servicio"
                        />
                    </div>
                    {errors.tipoServicio && <p className="text-xs text-red-600 mt-1">{errors.tipoServicio}</p>}
                </div>

                {/* Lugar de Ejecución */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Lugar de Ejecución
                    </label>
                    <InputBase
                        placeholder="Ej: Planta Principal, Oficina..."
                        value={form.lugarEjecucion}
                        onChange={(e) => setField("lugarEjecucion", e.target.value)}
                    />
                </div>
            </div>

            {/* Descripción Detallada */}
            <div>
                <label className="block text-sm font-medium mb-1">
                    Descripción Detallada <span className="text-red-500">*</span>
                </label>
                <TextareaBase
                    placeholder="Especifique el alcance, trabajos a realizar y requisitos técnicos..."
                    value={form.descripcionServicio}
                    onChange={(e) => setField("descripcionServicio", e.target.value)}
                    rows={4}
                    status={errors.descripcionServicio ? "error" : undefined}
                    uppercase={false}
                />
                {errors.descripcionServicio && <p className="text-xs text-red-600 mt-1">{errors.descripcionServicio}</p>}
            </div>

            {/* Duración y Presupuesto */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">
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
                        className="w-full"
                        status={errors.duracionRango ? "error" : undefined}
                    />
                    {errors.duracionRango && <p className="text-xs text-red-600 mt-1">{errors.duracionRango}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Presupuesto Referencial
                    </label>
                    <InputNumberBase
                        placeholder="0.00"
                        value={form.presupuestoReferencial ? Number(form.presupuestoReferencial) : undefined}
                        onChange={(value) => setField("presupuestoReferencial", value?.toString() ?? "")}
                        prefix="S/"
                        min={0}
                        precision={2}
                        className="w-full"
                    />
                </div>
            </div>
        </div>
    )
}
