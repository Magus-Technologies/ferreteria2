"use client"

import { useState } from "react"
import { requerimientoInternoApi, type CreateRequerimientoRequest } from "~/lib/api/requerimiento-interno"
import type { RequerimientoFormData, ItemBuscado } from "./use-requerimiento-form"

export function useRequerimientoSubmit() {
    const [submitting, setSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [requerimientoCreado, setRequerimientoCreado] = useState<{ id: number; codigo: string } | null>(null)

    const submit = async (form: RequerimientoFormData, productos: ItemBuscado[]) => {
        setSubmitting(true)
        try {
            const requestData: CreateRequerimientoRequest = {
                titulo: form.titulo,
                cargo: form.cargo,
                fecha_requerida: form.fechaRequerida,
                prioridad: form.prioridad as 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE',
                tipo_solicitud: form.tipoSolicitud,
                observaciones: form.observaciones || undefined,
                productos: productos.map(p => ({
                    producto_id: p.id ?? undefined,
                    nombre_adicional: p.nombre_adicional || (p.id ? undefined : p.nombre),
                    cantidad: p.cantidad,
                    unidad: p.unidad || undefined,
                })),
            }

            const result = await requerimientoInternoApi.create(requestData)
            if (result.error) {
                return { success: false, error: result.error.message }
            }

            setRequerimientoCreado({
                id: result.data!.data.id,
                codigo: result.data!.data.codigo,
            })
            setIsSubmitted(true)
            return { success: true }
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || error?.message || 'Error al crear el requerimiento'
            return { success: false, error: errorMsg }
        } finally {
            setSubmitting(false)
        }
    }

    const reset = () => {
        setIsSubmitted(false)
        setRequerimientoCreado(null)
    }

    return {
        submitting,
        isSubmitted,
        requerimientoCreado,
        submit,
        reset,
    }
}
