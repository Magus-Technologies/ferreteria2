"use client"

import { useState } from "react"
import { DatePicker, Button, Table, Space, Popconfirm, Card, Tag } from "antd"
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import SelectBase from "~/app/_components/form/selects/select-base"
import InputBase from "~/app/_components/form/inputs/input-base"
import TextareaBase from "~/app/_components/form/inputs/textarea-base"
import InputNumberBase from "~/app/_components/form/inputs/input-number-base"
import type { ServicioItem } from "./hooks/use-requerimiento-form"

interface StepServicioProps {
    serviciosSeleccionados: ServicioItem[]
    setServiciosSeleccionados: (servicios: ServicioItem[]) => void
    fechaRequerida: string
    errors: Record<string, string>
    tiposServicio: { label: string; value: number }[]
    onAbrirModalTipoServicio: () => void
}

export default function StepServicio({
    serviciosSeleccionados,
    setServiciosSeleccionados,
    fechaRequerida,
    errors,
    tiposServicio,
    onAbrirModalTipoServicio,
}: StepServicioProps) {
    const [newItem, setNewItem] = useState<Partial<ServicioItem>>({
        tipoServicio: "",
        descripcionServicio: "",
        lugarEjecucion: "",
        fechaInicioEstimada: "",
        presupuestoReferencial: "",
        detalles: "",
    })

    const handleAdd = () => {
        if (!newItem.tipoServicio || !newItem.descripcionServicio) {
            return
        }

        const item: ServicioItem = {
            id: Math.random().toString(36).substr(2, 9),
            tipoServicio: newItem.tipoServicio!,
            descripcionServicio: newItem.descripcionServicio!,
            lugarEjecucion: newItem.lugarEjecucion || "",
            fechaInicioEstimada: fechaRequerida || dayjs().format('YYYY-MM-DD HH:mm'),
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
            presupuestoReferencial: "",
            detalles: "",
        })
    }

    const handleRemove = (id: string) => {
        setServiciosSeleccionados(serviciosSeleccionados.filter(s => s.id !== id))
    }

    const columns = [
        {
            title: "Servicio / Descripción",
            key: "servicio",
            render: (_: any, record: ServicioItem) => (
                <div>
                    <div className="font-bold text-slate-800">
                        {tiposServicio.find(t => String(t.value) === String(record.tipoServicio))?.label || "Servicio"}
                    </div>
                    <div className="text-xs text-slate-500 italic">{record.descripcionServicio}</div>
                    {record.detalles && (
                        <div className="mt-1 flex flex-wrap gap-1">
                             <Tag color="blue" className="text-[10px]">Detalles:</Tag>
                             <span className="text-[10px] text-slate-600 truncate max-w-[200px]">{record.detalles}</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            title: "Lugar",
            dataIndex: "lugarEjecucion",
            key: "lugarEjecucion",
            className: "text-xs"
        },
        {
            title: "Presupuesto",
            dataIndex: "presupuestoReferencial",
            key: "presupuesto",
            render: (val: string) => val ? `S/ ${Number(val).toFixed(2)}` : "-",
            className: "text-xs"
        },
        {
            title: "Acciones",
            key: "acciones",
            width: 80,
            render: (_: any, record: ServicioItem) => (
                <Popconfirm title="¿Quitar servicio?" onConfirm={() => handleRemove(record.id!)}>
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
            )
        }
    ]

    return (
        <div className="space-y-6">
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
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-slate-800">Servicios Solicitados</h4>
                    <span className="text-xs text-slate-500">{serviciosSeleccionados.length} servicios</span>
                </div>
                <Table
                    dataSource={serviciosSeleccionados}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    className="border rounded-md overflow-hidden shadow-sm"
                    locale={{ emptyText: "No hay servicios agregados" }}
                />
                {errors.servicios && <p className="text-xs text-red-600 mt-2">{errors.servicios}</p>}
            </div>
        </div>
    )
}
