import { useState } from "react"

export interface RequerimientoFormData {
    titulo: string
    cargo: string
    fechaRequerida: string
    prioridad: string
    tipoSolicitud: 'OS'
    observaciones: string
    vehiculoId?: string | null
    afectaCalendario?: boolean
}

export interface ServicioItem {
    id?: string
    tipoServicio: string
    descripcionServicio: string
    lugarEjecucion: string
    fechaInicioEstimada: string
    unidadDuracion: 'horas' | 'dias'
    horaInicio: string
    horaFin: string
    cantidadDias: string
    presupuestoReferencial: string
    detalles: string
}

export function useRequerimientoForm() {
    const [form, setForm] = useState<RequerimientoFormData>({
        titulo: "",
        cargo: "",
        fechaRequerida: "",
        prioridad: "MEDIA",
        tipoSolicitud: 'OS',
        observaciones: "",
        vehiculoId: null,
        afectaCalendario: true,
    })

    const [serviciosSeleccionados, setServiciosSeleccionados] = useState<ServicioItem[]>([])
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
            tipoSolicitud: 'OS',
            observaciones: "",
            vehiculoId: null,
            afectaCalendario: true,
        })
        setServiciosSeleccionados([])
        setErrors({})
    }

    return {
        form,
        setField,
        serviciosSeleccionados,
        setServiciosSeleccionados,
        errors,
        validate,
        resetForm,
    }
}
