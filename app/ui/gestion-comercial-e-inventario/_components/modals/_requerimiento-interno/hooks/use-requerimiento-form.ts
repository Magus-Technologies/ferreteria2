import { useState } from "react"

export interface RequerimientoFormData {
    titulo: string
    area: string
    fechaRequerida: string
    prioridad: string
    tipoSolicitud: 'OC' | 'OS' | 'SOC'
    observaciones: string
    proveedorSugerido: string
    tipoServicio: string
    descripcionServicio: string
    lugarEjecucion: string
    fechaInicioEstimada: string
    fechaFinEstimada: string
    presupuestoReferencial: string
}

export interface ItemBuscado {
    id: number | null
    codigo: string
    nombre: string
    nombre_adicional?: string
    cantidad: number
    metric_id?: number | string
    unidad: string
    stock?: number
}

export function useRequerimientoForm(defaultTipoSolicitud: 'OC' | 'OS' | 'SOC' = 'OC') {
    const [form, setForm] = useState<RequerimientoFormData>({
        titulo: "",
        area: "",
        fechaRequerida: "",
        prioridad: "MEDIA",
        tipoSolicitud: defaultTipoSolicitud,
        observaciones: "",
        proveedorSugerido: "",
        tipoServicio: "",
        descripcionServicio: "",
        lugarEjecucion: "",
        fechaInicioEstimada: "",
        fechaFinEstimada: "",
        presupuestoReferencial: "",
    })

    const [productosSeleccionados, setProductosSeleccionados] = useState<ItemBuscado[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})

    const setField = (key: string, value: string | number | boolean) => {
        setForm(prev => ({ ...prev, [key]: value }))
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: "" }))
        }
    }

    const validate = (currentStep: number) => {
        const e: Record<string, string> = {}
        
        if (currentStep === 0) {
            if (!form.titulo.trim()) e.titulo = "Requerido"
            if (!form.area) e.area = "Requerido"
            if (!form.fechaRequerida) e.fechaRequerida = "Requerido"
        }
        
        if (currentStep === 1 && form.tipoSolicitud === "OC") {
            if (productosSeleccionados.length === 0) e.productos = "Agregue al menos un producto"
        }
        
        if (currentStep === 1 && form.tipoSolicitud === "OS") {
            if (!form.tipoServicio) e.tipoServicio = "Requerido"
            if (!form.descripcionServicio.trim()) e.descripcionServicio = "Requerido"
            if (!form.fechaInicioEstimada || !form.fechaFinEstimada) e.duracionRango = "Requerido"
        }
        
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const resetForm = () => {
        setForm({
            titulo: "",
            area: "",
            fechaRequerida: "",
            prioridad: "MEDIA",
            tipoSolicitud: defaultTipoSolicitud,
            observaciones: "",
            proveedorSugerido: "",
            tipoServicio: "",
            descripcionServicio: "",
            lugarEjecucion: "",
            fechaInicioEstimada: "",
            fechaFinEstimada: "",
            presupuestoReferencial: "",
        })
        setProductosSeleccionados([])
        setErrors({})
    }

    return {
        form,
        setField,
        productosSeleccionados,
        setProductosSeleccionados,
        errors,
        validate,
        resetForm,
    }
}
