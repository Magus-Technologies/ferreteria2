import { useState } from "react"
import dayjs from "dayjs"
import { requerimientoInternoApi, type CreateRequerimientoRequest, type CreateRequerimientoProductoRequest, type RequerimientoInterno } from "~/lib/api/requerimiento-interno"
import type { RequerimientoFormData, ItemBuscado } from "./use-requerimiento-form"

export function useRequerimientoSubmit() {
    const [submitting, setSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [requerimientoCreado, setRequerimientoCreado] = useState<RequerimientoInterno | null>(null)

    const submit = async (form: RequerimientoFormData, productosSeleccionados: ItemBuscado[]) => {
        setSubmitting(true)
        try {
            const requestData: CreateRequerimientoRequest = {
                titulo: form.titulo,
                area: form.area,
                fecha_requerida: form.fechaRequerida,
                prioridad: form.prioridad as "BAJA" | "MEDIA" | "ALTA" | "URGENTE",
                tipo_solicitud: form.tipoSolicitud,
                observaciones: form.observaciones || undefined,
                proveedor_sugerido_id: form.proveedorSugerido ? Number(form.proveedorSugerido) : undefined,
            }

            if (form.tipoSolicitud === 'OC') {
                requestData.productos = productosSeleccionados.map(p => {
                    const prod: CreateRequerimientoProductoRequest = {
                        cantidad: p.cantidad,
                        unidad: p.unidad,
                    }
                    if (p.id) {
                        prod.producto_id = p.id
                    } else {
                        // Producto manual (no existe en el sistema)
                        prod.nombre_adicional = p.nombre
                    }
                    return prod
                })
            } else {
                requestData.servicio = {
                    tipo_servicio: form.tipoServicio ? String(form.tipoServicio) : undefined,
                    descripcion_servicio: form.descripcionServicio,
                    lugar_ejecucion: form.lugarEjecucion || undefined,
                    fecha_inicio_estimada: form.fechaInicioEstimada || undefined,
                    presupuesto_referencial: form.presupuestoReferencial ? Number(form.presupuestoReferencial) : undefined,
                    duracion_cantidad: (form.fechaInicioEstimada && form.fechaFinEstimada)
                        ? Math.ceil(dayjs(form.fechaFinEstimada).diff(dayjs(form.fechaInicioEstimada), 'hour', true))
                        : undefined,
                    duracion_unidad: 'horas',
                }
            }

            const response = await requerimientoInternoApi.create(requestData)
            if (response.data?.data) {
                setRequerimientoCreado(response.data.data)
            }
            setIsSubmitted(true)
            return { success: true, data: response.data?.data }
        } catch (error: unknown) {
            console.error(error)
            const errorMessage = error instanceof Error ? error.message : 'Error al crear el requerimiento'
            return { success: false, error: errorMessage }
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
