"use client"

import { useState, useEffect, useRef } from "react"
import { Button, Popconfirm, Card, Tag, Checkbox, TimePicker, Tooltip } from "antd"
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { ColDef, ICellRendererParams } from "ag-grid-community"
import dayjs from "dayjs"
import SelectBase from "~/app/_components/form/selects/select-base"
import InputBase from "~/app/_components/form/inputs/input-base"
import TextareaBase from "~/app/_components/form/inputs/textarea-base"
import InputNumberBase from "~/app/_components/form/inputs/input-number-base"
import TableWithTitle from "~/components/tables/table-with-title"
import { useAuth } from "~/lib/auth-context"
import type { ServicioItem } from "./hooks/use-requerimiento-form"

interface StepServicioProps {
    serviciosSeleccionados: ServicioItem[]
    setServiciosSeleccionados: (servicios: ServicioItem[]) => void
    fechaRequerida: string
    errors: Record<string, string>
    tiposServicio: { label: string; value: number }[]
    onAbrirModalTipoServicio: () => void
    vehiculos: { label: string; value: string }[]
    vehiculoId?: string | null
    setVehiculoId?: (id: string | null) => void
    afectaCalendario?: boolean
    setAfectaCalendario?: (value: boolean) => void
}

export default function StepServicio({
    serviciosSeleccionados,
    setServiciosSeleccionados,
    fechaRequerida,
    errors,
    tiposServicio,
    onAbrirModalTipoServicio,
    vehiculos,
    vehiculoId,
    setVehiculoId,
    afectaCalendario,
    setAfectaCalendario,
}: StepServicioProps) {
    const { user } = useAuth()
    const tableGridRef = useRef<any>(null)
    const [newItem, setNewItem] = useState<Partial<ServicioItem>>({
        tipoServicio: "",
        descripcionServicio: "",
        lugarEjecucion: "",
        fechaInicioEstimada: "",
        unidadDuracion: "horas",
        horaInicio: "",
        horaFin: "",
        cantidadDias: "",
        presupuestoReferencial: "",
        detalles: "",
    })

    // Auto-rellenar vehículo del usuario si tiene uno asignado
    useEffect(() => {
        if (user?.vehiculo_id && !vehiculoId) {
            setVehiculoId?.(String(user.vehiculo_id))
        }
    }, [user?.vehiculo_id, vehiculoId, setVehiculoId])

    const handleAdd = () => {
        if (!newItem.tipoServicio || !newItem.descripcionServicio) {
            return
        }

        const unidad = newItem.unidadDuracion || 'horas'
        const fecha = fechaRequerida || dayjs().format('YYYY-MM-DD')
        const hora = unidad === 'horas' ? (newItem.horaInicio || '08:00') : '00:00'
        const fechaHora = `${fecha} ${hora}`

        const item: ServicioItem = {
            id: Math.random().toString(36).substr(2, 9),
            tipoServicio: newItem.tipoServicio!,
            descripcionServicio: newItem.descripcionServicio!,
            lugarEjecucion: newItem.lugarEjecucion || "",
            fechaInicioEstimada: fechaHora,
            unidadDuracion: unidad,
            horaInicio: unidad === 'horas' ? hora : "",
            horaFin: unidad === 'horas' ? (newItem.horaFin || "") : "",
            cantidadDias: unidad === 'dias' ? (newItem.cantidadDias || "") : "",
            presupuestoReferencial: newItem.presupuestoReferencial || "",
            detalles: newItem.detalles || "",
        }

        setServiciosSeleccionados([...serviciosSeleccionados, {
            ...item,
            id: Date.now().toString()
        }])
        setNewItem({
            tipoServicio: "",
            descripcionServicio: "",
            lugarEjecucion: "",
            fechaInicioEstimada: "",
            unidadDuracion: "horas",
            horaInicio: "",
            horaFin: "",
            cantidadDias: "",
            presupuestoReferencial: "",
            detalles: "",
        })
    }

    const handleRemove = (id: string) => {
        setServiciosSeleccionados(serviciosSeleccionados.filter(s => s.id !== id))
    }

    const columnDefs: ColDef<ServicioItem>[] = [
        {
            headerName: "Servicio / Descripción",
            field: "tipoServicio",
            flex: 1,
            minWidth: 240,
            autoHeight: true,
            cellRenderer: ({ data }: ICellRendererParams<ServicioItem>) => {
                if (!data) return null
                const tipoLabel = tiposServicio.find(t => String(t.value) === String(data.tipoServicio))?.label || "Servicio"
                return (
                    <div className="py-1.5 leading-tight">
                        <div className="font-bold text-slate-800 text-xs">{tipoLabel}</div>
                        <div className="text-[11px] text-slate-500 italic line-clamp-1">{data.descripcionServicio}</div>
                        {data.detalles && (
                            <div className="mt-1 flex items-center gap-1">
                                <Tag color="green" className="!text-[10px] !leading-tight !m-0">Detalles</Tag>
                                <Tooltip title={data.detalles}>
                                    <span className="text-[10px] text-slate-600 truncate max-w-[200px]">{data.detalles}</span>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            headerName: "Lugar",
            field: "lugarEjecucion",
            width: 140,
            cellRenderer: ({ data }: ICellRendererParams<ServicioItem>) => (
                <div className="flex items-center h-full text-xs text-slate-700">{data?.lugarEjecucion || "—"}</div>
            ),
        },
        {
            headerName: "Horario / Duración",
            field: "horaInicio",
            width: 150,
            cellRenderer: ({ data }: ICellRendererParams<ServicioItem>) => {
                if (!data) return null
                let txt = "—"
                if (data.unidadDuracion === 'dias') {
                    txt = data.cantidadDias ? `${data.cantidadDias} día(s)` : "—"
                } else if (data.horaInicio && data.horaFin) {
                    txt = `${data.horaInicio} — ${data.horaFin}`
                } else if (data.horaInicio) {
                    txt = data.horaInicio
                }
                return <div className="flex items-center h-full text-xs font-semibold text-emerald-700">{txt}</div>
            },
        },
        {
            headerName: "Presupuesto",
            field: "presupuestoReferencial",
            width: 120,
            cellRenderer: ({ data }: ICellRendererParams<ServicioItem>) => (
                <div className="flex items-center h-full text-xs font-bold text-emerald-700">
                    {data?.presupuestoReferencial ? `S/ ${Number(data.presupuestoReferencial).toFixed(2)}` : "—"}
                </div>
            ),
        },
        {
            headerName: "",
            width: 60,
            cellRenderer: ({ data }: ICellRendererParams<ServicioItem>) => {
                if (!data?.id) return null
                return (
                    <div className="flex items-center justify-center h-full">
                        <Popconfirm title="¿Quitar servicio?" onConfirm={() => handleRemove(data.id!)}>
                            <Tooltip title="Eliminar">
                                <DeleteOutlined className="text-red-500 hover:text-red-700 cursor-pointer text-base" />
                            </Tooltip>
                        </Popconfirm>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="space-y-6">
            {/* Sección de Vehículo y Afecta Calendario */}
            <Card size="small" title={<span className="text-sm font-semibold">Configuración de Vehículo</span>} className="bg-amber-50 border-amber-200">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Vehículo Relacionado <span className="text-gray-400 text-xs">(opcional)</span>
                        </label>
                        <SelectBase
                            placeholder="Seleccionar vehículo..."
                            value={vehiculoId || undefined}
                            onChange={(value) => setVehiculoId?.(value || null)}
                            options={vehiculos}
                            allowClear
                            className="w-full"
                        />
                        {user?.vehiculo_id && vehiculoId === String(user.vehiculo_id) && (
                            <p className="text-xs text-amber-600 mt-1 italic">✓ Auto-rellenado con tu vehículo asignado</p>
                        )}
                    </div>

                    {vehiculoId && (
                        <div className="bg-white p-3 rounded border border-amber-200">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={afectaCalendario ?? true}
                                    onChange={(e) => setAfectaCalendario?.(e.target.checked)}
                                />
                                <span className="text-sm font-medium text-slate-700">
                                    Afecta Calendario de Entregas
                                </span>
                            </label>
                            <p className="text-xs text-slate-500 mt-2 ml-6">
                                Si está marcado, este servicio bloqueará el vehículo en el calendario de entregas durante la duración estimada.
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Formulario de Adición */}
            <Card size="small" title={<span className="text-sm font-semibold">Configurar Nuevo Servicio</span>} className="bg-slate-50">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Tipo de Servicio <span className="text-red-500">*</span></label>
                            <div className="flex gap-1">
                                <SelectBase
                                    placeholder="Seleccionar..."
                                    value={newItem.tipoServicio ? Number(newItem.tipoServicio) : undefined}
                                    onChange={(value) => setNewItem(prev => ({ ...prev, tipoServicio: String(value) }))}
                                    options={tiposServicio}
                                    className="flex-1"
                                />
                                <Button icon={<PlusOutlined />} onClick={onAbrirModalTipoServicio} title="Nuevo tipo" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">Lugar de Ejecución</label>
                            <InputBase
                                placeholder="Ej: Planta Principal"
                                value={newItem.lugarEjecucion}
                                onChange={(e) => setNewItem(prev => ({ ...prev, lugarEjecucion: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Descripción General <span className="text-red-500">*</span></label>
                            <InputBase
                                placeholder="Resumen del servicio..."
                                value={newItem.descripcionServicio}
                                onChange={(e) => setNewItem(prev => ({ ...prev, descripcionServicio: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Presupuesto Referencial</label>
                            <InputNumberBase
                                placeholder="0.00"
                                value={newItem.presupuestoReferencial ? Number(newItem.presupuestoReferencial) : undefined}
                                onChange={(value) => setNewItem(prev => ({ ...prev, presupuestoReferencial: value?.toString() ?? "" }))}
                                prefix="S/"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Unidad de Tiempo</label>
                            <SelectBase
                                value={newItem.unidadDuracion}
                                onChange={(value) => setNewItem(prev => ({
                                    ...prev,
                                    unidadDuracion: value as 'horas' | 'dias',
                                    horaInicio: "",
                                    horaFin: "",
                                    cantidadDias: "",
                                }))}
                                options={[
                                    { label: 'Horas', value: 'horas' },
                                    { label: 'Días', value: 'dias' },
                                ]}
                                className="w-full"
                            />
                        </div>

                        {newItem.unidadDuracion === 'horas' ? (
                            <>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Hora de Inicio</label>
                                    <TimePicker
                                        format="HH:mm"
                                        minuteStep={5}
                                        placeholder="Seleccionar hora"
                                        value={newItem.horaInicio ? dayjs(newItem.horaInicio, 'HH:mm') : null}
                                        onChange={(time) => setNewItem(prev => ({ ...prev, horaInicio: time ? time.format('HH:mm') : '' }))}
                                        className="w-full"
                                        size="middle"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Hora de Fin</label>
                                    <TimePicker
                                        format="HH:mm"
                                        minuteStep={5}
                                        placeholder="Seleccionar hora"
                                        value={newItem.horaFin ? dayjs(newItem.horaFin, 'HH:mm') : null}
                                        onChange={(time) => setNewItem(prev => ({ ...prev, horaFin: time ? time.format('HH:mm') : '' }))}
                                        className="w-full"
                                        size="middle"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="col-span-2">
                                <label className="block text-xs font-medium mb-1">Cantidad de Días</label>
                                <InputNumberBase
                                    placeholder="Ej: 3"
                                    value={newItem.cantidadDias ? Number(newItem.cantidadDias) : undefined}
                                    onChange={(value) => setNewItem(prev => ({ ...prev, cantidadDias: value?.toString() ?? "" }))}
                                    min={1}
                                    className="w-full"
                                />
                                <p className="text-[11px] text-slate-500 mt-1 italic">
                                    Se contará desde la Fecha Requerida (ej: fecha 23 + 3 días → del 23 al 25).
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium mb-1">
                            Detalles Específicos/Tareas <span className="text-slate-400 font-normal">(Ej: Cambio de aceite, Lavado, etc.)</span>
                        </label>
                        <TextareaBase
                            placeholder="Describa los componentes o tareas específicas del servicio..."
                            value={newItem.detalles}
                            onChange={(e) => setNewItem(prev => ({ ...prev, detalles: e.target.value }))}
                            rows={2}
                            uppercase={false}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={handleAdd}
                            disabled={!newItem.tipoServicio || !newItem.descripcionServicio}
                            className="w-1/2"
                        >
                            Agregar a la Lista
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Tabla de Servicios */}
            <div>
                <TableWithTitle<ServicioItem>
                    tableRef={tableGridRef}
                    id="requerimiento-interno.table-servicios"
                    title="Servicios Solicitados"
                    extraTitle={
                        <Tag color="green" className="!rounded-full !text-[10px] !font-bold !border-none">
                            {serviciosSeleccionados.length} {serviciosSeleccionados.length === 1 ? 'servicio' : 'servicios'}
                        </Tag>
                    }
                    columnDefs={columnDefs}
                    rowData={serviciosSeleccionados}
                    loading={false}
                    rowSelection={false}
                    pagination={false}
                    domLayout="autoHeight"
                    exportExcel={false}
                    exportPdf={false}
                    selectColumns={false}
                    selectionColor="#dcfce7"
                />
                {errors.servicios && <p className="text-xs text-red-600 mt-2">{errors.servicios}</p>}
            </div>
        </div>
    )
}
