import { useState } from "react"

export interface RequerimientoFormData {
    titulo: string
    cargo: string
    fechaRequerida: string
    prioridad: string
    tipoSolicitud: 'OC' | 'OS' | 'SOC'
    observaciones: string
    proveedorSugerido: string
    duracionCantidad: string
    duracionUnidad: string
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

export interface ServicioItem {
    id?: string // Client-side unique ID
    tipoServicio: string
    descripcionServicio: string
    lugarEjecucion: string
    fechaInicioEstimada: string
    presupuestoReferencial: string
    detalles: string
}

export function useRequerimientoForm(defaultTipoSolicitud: 'OC' | 'OS' | 'SOC' = 'OC') {
    const [form, setForm] = useState<RequerimientoFormData>({
        titulo: "",
        cargo: "",
        fechaRequerida: "",
        prioridad: "MEDIA",
        tipoSolicitud: defaultTipoSolicitud,
        observaciones: "",
        proveedorSugerido: "",
        duracionCantidad: "",
        duracionUnidad: "dias",
    })

    const [productosSeleccionados, setProductosSeleccionados] = useState<ItemBuscado[]>([])
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState<ServicioItem[]>([])
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
            if (!form.cargo) e.cargo = "Requerido"
            if (!form.fechaRequerida) e.fechaRequerida = "Requerido"
            if (form.tipoSolicitud === 'OS') {
                if (!form.duracionCantidad) e.duracionCantidad = "Requerido"
            }
        }
        
        if (currentStep === 1 && form.tipoSolicitud === "OC") {
            if (productosSeleccionados.length === 0) e.productos = "Agregue al menos un producto"
        }
        
        if (currentStep === 1 && form.tipoSolicitud === "OS") {
            if (serviciosSeleccionados.length === 0) e.servicios = "Agregue al menos un servicio"
        }
        
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const resetForm = () => {
        setForm({
            titulo: "",
            cargo: "",
            fechaRequerida: "",
            prioridad: "MEDIA",
            tipoSolicitud: defaultTipoSolicitud,
            observaciones: "",
            proveedorSugerido: "",
            duracionCantidad: "",
            duracionUnidad: "dias",
        })
        setProductosSeleccionados([])
        setServiciosSeleccionados([])
        setErrors({})
    }

    return {
        form,
        setField,
        productosSeleccionados,
        setProductosSeleccionados,
        serviciosSeleccionados,
        setServiciosSeleccionados,
        errors,
        validate,
        resetForm,
    }
}
