import { useState } from "react"

export interface RequerimientoFormData {
    titulo: string
    cargo: string
    fechaRequerida: string
    prioridad: string
    tipoSolicitud: 'OC' | 'SOC'
    observaciones: string
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

export function useRequerimientoForm(defaultTipoSolicitud: 'OC' | 'SOC' = 'OC') {
    const [form, setForm] = useState<RequerimientoFormData>({
        titulo: "",
        cargo: "",
        fechaRequerida: "",
        prioridad: "MEDIA",
        tipoSolicitud: defaultTipoSolicitud,
        observaciones: "",
    })

    const [productosSeleccionados, setProductosSeleccionados] = useState<ItemBuscado[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})

    const setField = (key: string, value: string | number | boolean | null | undefined) => {
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
        }

        if (currentStep === 1) {
            if (productosSeleccionados.length === 0) e.productos = "Agregue al menos un producto"
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
