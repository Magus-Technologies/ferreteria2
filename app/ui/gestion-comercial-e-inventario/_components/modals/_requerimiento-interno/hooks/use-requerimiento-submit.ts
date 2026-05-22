import { useState } from "react"
import { requerimientoInternoApi, type CreateRequerimientoRequest, type RequerimientoInterno } from "~/lib/api/requerimiento-interno"
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
                proveedor_sugerido_id: form.proveedorSugerido ? Number(form.proveedorSugerido) : undefined,
                vehiculo_id: form.vehiculoId ? Number(form.vehiculoId) : undefined,
                afecta_calendario: form.afectaCalendario ?? true,
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
                requestData.servicios = serviciosSeleccionados.map(s => {
                    let duracion_cantidad: number | undefined
                    let duracion_unidad: string | undefined

                    if (s.unidadDuracion === 'dias') {
                        const dias = Number(s.cantidadDias) || 0
                        if (dias > 0) {
                            duracion_cantidad = dias
                            duracion_unidad = 'dias'
                        }
                    } else {
                        // horas: calcular minutos entre horaInicio y horaFin
                        if (s.horaInicio && s.horaFin) {
                            const [hi, mi] = s.horaInicio.split(':').map(Number)
                            const [hf, mf] = s.horaFin.split(':').map(Number)
                            const inicio = (hi || 0) * 60 + (mi || 0)
                            const fin = (hf || 0) * 60 + (mf || 0)
                            const totalMinutos = fin - inicio
                            if (totalMinutos > 0) {
                                duracion_cantidad = totalMinutos
                                duracion_unidad = 'minutos'
                            }
                        }
                    }

                    return {
                        tipo_servicio: s.tipoServicio ? String(s.tipoServicio) : undefined,
                        descripcion_servicio: s.descripcionServicio,
                        lugar_ejecucion: s.lugarEjecucion || undefined,
                        fecha_inicio_estimada: s.fechaInicioEstimada || undefined,
                        presupuesto_referencial: s.presupuestoReferencial ? Number(s.presupuestoReferencial) : undefined,
                        detalles: s.detalles || undefined,
                        duracion_cantidad,
                        duracion_unidad,
                    }
                })
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
