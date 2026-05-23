"use client"

import { useState } from "react"
import { requerimientoInternoApi, type CreateRequerimientoRequest } from "~/lib/api/requerimiento-interno"
import type { RequerimientoFormData, ServicioItem } from "./use-requerimiento-form"

export function useRequerimientoSubmit() {
    const [submitting, setSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [requerimientoCreado, setRequerimientoCreado] = useState<{ id: number; codigo: string } | null>(null)

    const submit = async (form: RequerimientoFormData, servicios: ServicioItem[]) => {
        setSubmitting(true)
        try {
            const requestData: CreateRequerimientoRequest = {
                titulo: form.titulo,
                cargo: form.cargo,
                fecha_requerida: form.fechaRequerida,
                prioridad: form.prioridad as 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE',
                tipo_solicitud: form.tipoSolicitud,
                observaciones: form.observaciones || undefined,
                vehiculo_id: form.vehiculoId ? Number(form.vehiculoId) : undefined,
                afecta_calendario: form.afectaCalendario ?? undefined,
                servicios: servicios.map(s => {
                    const duracionMinutos = s.unidadDuracion === 'dias'
                        ? (parseInt(s.cantidadDias) || 0) * 24 * 60
                        : (parseInt(s.horaInicio?.split(':')[0] || '0') * 60 + parseInt(s.horaInicio?.split(':')[1] || '0'))

                    return {
                        tipo_servicio: s.tipoServicio,
                        descripcion_servicio: s.descripcionServicio,
                        lugar_ejecucion: s.lugarEjecucion || undefined,
                        fecha_inicio_estimada: s.fechaInicioEstimada || undefined,
                        hora_inicio: s.horaInicio || undefined,
                        hora_fin: s.horaFin || undefined,
                        cantidad_dias: s.cantidadDias || undefined,
                        duracion_cantidad: duracionMinutos || undefined,
                        duracion_unidad: 'minutos',
                        presupuesto_referencial: s.presupuestoReferencial ? Number(s.presupuestoReferencial) : undefined,
                        detalles: s.detalles || undefined,
                    }
                }),
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
