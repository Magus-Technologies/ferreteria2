"use client"

import { useState, useEffect } from "react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { FaFilePdf } from "react-icons/fa6"
import RequerimientoInternoPdf from "~/components/pdf/requerimiento-interno-pdf"
import { useEmpresaPublica } from "~/hooks/use-empresa-publica"
import { requerimientoInternoApi, type CreateRequerimientoRequest, type RequerimientoInterno } from "~/lib/api/requerimiento-interno"
import { productosApiV2 } from "~/lib/api/producto"
import { proveedorApi } from "~/lib/api/proveedor"
import { tipoServicioApi, type TipoServicio } from "~/lib/api/tipo-servicio"
import ModalCrearTipoServicio from "../modal-crear-tipo-servicio"
import StepGeneral from "./step-general"
import StepProductos from "./step-productos"
import StepServicio from "./step-servicio"
import StepResumen from "./step-resumen"

interface ItemBuscado {
    id: number
    codigo: string
    nombre: string
    cantidad: number
    unidad: string
    stock?: number
}

interface ProductoDisponible {
    id: number
    codigo?: string
    cod_producto?: string
    nombre?: string
    name?: string
    stock_fraccion?: number
    unidad_medida?: { name: string }
    stock?: number
    unidad?: string
}

interface ModalRequerimientoInternoProps {
    open: boolean
    onClose: () => void
    productosDisponibles?: ProductoDisponible[]
    defaultTipoSolicitud?: 'OC' | 'OS'
}

const PRIORIDADES = [
    { value: "BAJA", label: "Baja", color: "bg-gray-100 border-gray-300 text-gray-700" },
    { value: "MEDIA", label: "Media", color: "bg-amber-50 border-amber-300 text-amber-900" },
    { value: "ALTA", label: "Alta", color: "bg-red-50 border-red-300 text-red-900" },
    { value: "URGENTE", label: "Urgente", color: "bg-purple-50 border-purple-300 text-purple-900" },
]

const AREAS = ["Almacén", "Mantenimiento", "Producción", "Logística", "Administración"]

export default function ModalRequerimientoInterno({
    open,
    onClose,
    productosDisponibles = [],
    defaultTipoSolicitud = 'OC',
}: ModalRequerimientoInternoProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [requerimientoCreado, setRequerimientoCreado] = useState<RequerimientoInterno | null>(null)
    const { data: empresa } = useEmpresaPublica()
    const [openModalTipoServicio, setOpenModalTipoServicio] = useState(false)
    const [tiposServicio, setTiposServicio] = useState<{ label: string; value: number }[]>([])
    const [fetchedProductos, setFetchedProductos] = useState<ProductoDisponible[]>([])
    const [fetchedProveedores, setFetchedProveedores] = useState<{ label: string; value: number }[]>([])
    const [productosSeleccionados, setProductosSeleccionados] = useState<ItemBuscado[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Form state
    const [form, setForm] = useState({
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
        presupuestoReferencial: "",
        duracionCif: "",
        duracionUnidad: "dias",
    })

    useEffect(() => {
        if (open && fetchedProductos.length === 0) {
            loadInitialData()
        }
    }, [open, fetchedProductos.length])

    const loadInitialData = async () => {
        try {
            const resProd = await productosApiV2.getAllByAlmacen({ almacen_id: 1, per_page: 50 })
            if (resProd.data?.data) {
                const mapped = resProd.data.data.map((p: ProductoDisponible) => ({
                    id: p.id,
                    codigo: p.cod_producto,
                    nombre: p.name,
                    stock: p.stock_fraccion || 0,
                    unidad: p.unidad_medida?.name || 'UND'
                }))
                setFetchedProductos(mapped)
            }

            const resProv = await proveedorApi.getAll({ per_page: 100 })
            if (resProv.data?.data) {
                setFetchedProveedores(resProv.data.data.map(p => ({ label: p.razon_social, value: p.id })))
            }

            const resTipos = await tipoServicioApi.getAll()
            if (resTipos.data) {
                const tiposFormateados = resTipos.data.map((t: TipoServicio) => ({
                    label: t.nombre,
                    value: t.id
                }))
                setTiposServicio(tiposFormateados)
            }
        } catch (error) {
            console.error("Error al cargar datos iniciales del modal:", error)
        }
    }

    const setField = (key: string, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }))
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: "" }))
        }
    }

    const validate = () => {
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
            if (!form.duracionCif) e.duracionCif = "Requerido"
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleNext = () => {
        if (validate()) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handleSubmit = async () => {
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
                requestData.productos = productosSeleccionados.map(p => ({
                    producto_id: p.id,
                    cantidad: p.cantidad,
                    unidad: p.unidad,
                }))
            } else {
                requestData.servicio = {
                    tipo_servicio: String(form.tipoServicio),
                    descripcion_servicio: form.descripcionServicio,
                    lugar_ejecucion: form.lugarEjecucion,
                    fecha_inicio_estimada: form.fechaInicioEstimada,
                    presupuesto_referencial: form.presupuestoReferencial ? Number(form.presupuestoReferencial) : undefined,
                    duracion_cantidad: form.duracionCif ? Number(form.duracionCif) : undefined,
                    duracion_unidad: form.duracionUnidad,
                }
            }

            const response = await requerimientoInternoApi.create(requestData)
            if (response.data?.data) {
                setRequerimientoCreado(response.data.data)
            }
            setIsSubmitted(true)
        } catch (error: unknown) {
            console.error(error)
            alert(error instanceof Error ? error.message : 'Error al crear el requerimiento')
        } finally {
            setSubmitting(false)
        }
    }

    const handleClose = () => {
        onClose()
        setTimeout(() => {
            setCurrentStep(0)
            setIsSubmitted(false)
            setRequerimientoCreado(null)
            setProductosSeleccionados([])
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
                presupuestoReferencial: "",
                duracionCif: "",
                duracionUnidad: "dias",
            })
            setErrors({})
        }, 300)
    }

    const steps = [
        { label: "Información General", sub: "Datos del requerimiento" },
        { label: form.tipoSolicitud === "OS" ? "Detalle del Servicio" : "Detalle de Productos", sub: "Especificaciones técnicas" },
        { label: "Confirmación", sub: "Revisión final" },
    ]

    const prio = PRIORIDADES.find(p => p.value === form.prioridad)
    const productosSource = productosDisponibles.length > 0 ? productosDisponibles : fetchedProductos

    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="w-full max-w-3xl max-h-[92vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-up duration-300">
                    
                    {/* HEADER */}
                    <div className="flex items-stretch border-b border-slate-200 bg-slate-50">
                        <div className="w-1 bg-gradient-to-b from-emerald-600 to-emerald-800 flex-shrink-0 rounded-tl-xl" />
                        <div className="flex-1 px-7 py-5">
                            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-emerald-200 mb-1.5">
                                <span>⬡</span> LOG-F-03
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 -tracking-0.3">Nuevo Requerimiento Interno</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Complete los campos para generar la solicitud de {form.tipoSolicitud === "OC" ? "orden de compra" : "orden de servicio"}</p>
                        </div>
                        <button onClick={handleClose} className="px-6 py-5 text-slate-400 hover:text-slate-900 transition-colors text-lg font-light">✕</button>
                    </div>

                    {/* STEPPER */}
                    {!isSubmitted && (
                        <div className="flex px-7 py-5 gap-0 border-b border-slate-200 bg-white">
                            {steps.map((s, i) => {
                                const state = i < currentStep ? "done" : i === currentStep ? "active" : "pending"
                                return (
                                    <div key={i} className="flex items-center flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                                                state === "done" ? "bg-emerald-600 text-white" :
                                                state === "active" ? "bg-slate-900 text-white" :
                                                "bg-slate-100 text-slate-400 border border-slate-200"
                                            }`}>
                                                {state === "done" ? "✓" : i + 1}
                                            </div>
                                            <div className="leading-tight">
                                                <div className={`text-xs font-semibold ${
                                                    state === "done" ? "text-emerald-600" :
                                                    state === "active" ? "text-slate-900" :
                                                    "text-slate-400"
                                                }`}>{s.label}</div>
                                                <div className="text-[10px] text-slate-400">{s.sub}</div>
                                            </div>
                                        </div>
                                        {i < steps.length - 1 && (
                                            <div className={`flex-1 h-px mx-4 ${i < currentStep ? "bg-emerald-600" : "bg-slate-200"}`} />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* BODY */}
                    <div className="flex-1 overflow-y-auto px-7 py-7">
                        {isSubmitted ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center animate-in scale-in duration-300">
                                <div className="w-18 h-18 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center text-4xl mb-5 shadow-lg shadow-emerald-600/30">✓</div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Requerimiento Enviado</h3>
                                <p className="text-sm text-slate-600 max-w-sm leading-relaxed mb-4">
                                    El requerimiento ha sido enviado al área de supervisión. Se generará la {form.tipoSolicitud === "OC" ? "Orden de Compra" : "Orden de Servicio"} correspondiente una vez aprobado.
                                </p>
                                {requerimientoCreado && <div className="bg-slate-50 border border-slate-200 rounded px-4 py-2 font-mono text-sm font-semibold text-emerald-600">{requerimientoCreado.codigo}</div>}
                            </div>
                        ) : (
                            <>
                                {currentStep === 0 && (
                                    <div className="animate-in slide-in-from-right-3 duration-300">
                                        <StepGeneral
                                            form={form}
                                            setField={setField}
                                            errors={errors}
                                            areas={AREAS}
                                            prioridades={PRIORIDADES}
                                        />
                                    </div>
                                )}

                                {currentStep === 1 && form.tipoSolicitud === "OC" && (
                                    <div className="animate-in slide-in-from-right-3 duration-300">
                                        <StepProductos
                                            form={form}
                                            setField={setField}
                                            errors={errors}
                                            productosDisponibles={productosSource}
                                            productosSeleccionados={productosSeleccionados}
                                            onAgregarProducto={(p) => {
                                                if (!productosSeleccionados.find(s => s.id === p.id)) {
                                                    setProductosSeleccionados([...productosSeleccionados, { ...p, cantidad: 1 }])
                                                }
                                            }}
                                            onQuitarProducto={(id) => {
                                                setProductosSeleccionados(prev => prev.filter(p => p.id !== id))
                                            }}
                                            onCambiarCantidad={(id, cantidad) => {
                                                setProductosSeleccionados(prev => prev.map(p => p.id === id ? { ...p, cantidad } : p))
                                            }}
                                            proveedores={fetchedProveedores}
                                        />
                                    </div>
                                )}

                                {currentStep === 1 && form.tipoSolicitud === "OS" && (
                                    <div className="animate-in slide-in-from-right-3 duration-300">
                                        <StepServicio
                                            form={form}
                                            setField={setField}
                                            errors={errors}
                                            tiposServicio={tiposServicio}
                                            onAbrirModalTipoServicio={() => setOpenModalTipoServicio(true)}
                                            proveedores={fetchedProveedores}
                                        />
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="animate-in scale-in duration-300">
                                        <StepResumen
                                            form={form}
                                            productosSeleccionados={productosSeleccionados}
                                            prioridades={PRIORIDADES}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* FOOTER */}
                    <div className="px-7 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                        {isSubmitted ? (
                            <>
                                <div className="flex items-center gap-2">
                                    {requerimientoCreado && (
                                        <PDFDownloadLink
                                            document={<RequerimientoInternoPdf requerimiento={requerimientoCreado} empresa={empresa} />}
                                            fileName={`${requerimientoCreado.codigo}-LOG-F-03.pdf`}
                                        >
                                            {({ loading }) => (
                                                <button className="px-4 py-2 bg-white border border-slate-200 rounded text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors flex items-center gap-2" disabled={loading}>
                                                    <FaFilePdf className='text-red-600 text-lg' />
                                                    {loading ? 'Generando PDF...' : 'Descargar PDF'}
                                                </button>
                                            )}
                                        </PDFDownloadLink>
                                    )}
                                </div>
                                <button onClick={handleClose} className="px-6 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 transition-colors">Cerrar</button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    {currentStep > 0 && <button onClick={() => setCurrentStep(prev => prev - 1)} className="px-4 py-2 bg-white border border-slate-200 rounded text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors">← Atrás</button>}
                                    <span className="text-xs text-slate-500">Paso {currentStep + 1} de {steps.length}</span>
                                </div>
                                <div className="flex gap-2">
                                    {currentStep < 2
                                        ? <button onClick={handleNext} className="px-6 py-2 bg-slate-900 text-white rounded text-sm font-semibold hover:bg-slate-800 transition-colors">Siguiente →</button>
                                        : <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 disabled:bg-slate-300 transition-colors flex items-center gap-2">✓ Enviar a Supervisión</button>
                                    }
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <ModalCrearTipoServicio
                open={openModalTipoServicio}
                onClose={() => setOpenModalTipoServicio(false)}
                onSuccess={(nuevoTipo) => {
                    setTiposServicio([...tiposServicio, { label: nuevoTipo.nombre, value: nuevoTipo.id }])
                    setField('tipoServicio', nuevoTipo.id)
                }}
            />
        </>
    )
}
