import { useState } from "react"
import dayjs from "dayjs"
import { requerimientoInternoApi, type CreateRequerimientoRequest, type CreateRequerimientoProductoRequest, type RequerimientoInterno } from "~/lib/api/requerimiento-interno"
import type { RequerimientoFormData, ItemBuscado, ServicioItem } from "./use-requerimiento-form"

export function useRequerimientoSubmit() {
    const [submitting, setSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [requerimientoCreado, setRequerimientoCreado] = useState<RequerimientoInterno | null>(null)

    const submit = async (
        form: RequerimientoFormData,
        productosSeleccionados: ItemBuscado[],
        serviciosSeleccionados: ServicioItem[]
    ) => {
        setSubmitting(true)
        try {
            const requestData: CreateRequerimientoRequest = {
                titulo: form.titulo,
                cargo: form.cargo,
                fecha_requerida: form.fechaRequerida,
                prioridad: form.prioridad as "BAJA" | "MEDIA" | "ALTA" | "URGENTE",
                tipo_solicitud: form.tipoSolicitud,
                observaciones: form.observaciones || undefined,
                duracion_cantidad: form.duracionCantidad ? Number(form.duracionCantidad) : undefined,
                duracion_unidad: form.duracionUnidad || undefined,
                proveedor_sugerido_id: form.proveedorSugerido ? Number(form.proveedorSugerido) : undefined,
            }

            if (form.tipoSolicitud === 'OC') {
                requestData.productos = productosSeleccionados.map(p => {
                    const prod: any = {
                        cantidad: p.cantidad,
                        unidad: p.unidad,
                    }
                    if (p.id) {
                        prod.producto_id = p.id
                    } else {
                        prod.nombre_adicional = p.nombre
                    }
                    return prod
                })
            } else {
                requestData.servicios = serviciosSeleccionados.map(s => ({
                    tipo_servicio: s.tipoServicio ? String(s.tipoServicio) : undefined,
                    descripcion_servicio: s.descripcionServicio,
                    lugar_ejecucion: s.lugarEjecucion || undefined,
                    fecha_inicio_estimada: s.fechaInicioEstimada || undefined,
                    presupuesto_referencial: s.presupuestoReferencial ? Number(s.presupuestoReferencial) : undefined,
                    detalles: s.detalles || undefined,
                }))
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
