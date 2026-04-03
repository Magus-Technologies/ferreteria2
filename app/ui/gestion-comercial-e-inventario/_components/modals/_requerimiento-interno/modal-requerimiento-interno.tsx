"use client"

import { useState } from "react"
import { Modal, Steps, Button, message } from "antd"
import { FaFilePdf } from "react-icons/fa6"
import { classOkButtonModal } from "~/lib/clases"
import ModalShowDoc from "~/app/_components/modals/modal-show-doc"
import ModalCrearTipoServicio from "../modal-crear-tipo-servicio"
import StepGeneral from "./step-general"
import StepProductos from "./step-productos"
import StepServicio from "./step-servicio"
import StepResumen from "./step-resumen"
import { useRequerimientoForm } from "./hooks/use-requerimiento-form"
import { useRequerimientoData, type ProductoDisponible } from "./hooks/use-requerimiento-data"
import { useRequerimientoSubmit } from "./hooks/use-requerimiento-submit"
import { usePdfGenerator } from "./hooks/use-pdf-generator"

interface ModalRequerimientoInternoProps {
    open: boolean
    onClose: () => void
    productosDisponibles?: ProductoDisponible[]
    defaultTipoSolicitud?: 'OC' | 'OS' | 'SOC'
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
    const [openModalTipoServicio, setOpenModalTipoServicio] = useState(false)

    // Custom hooks
    const formHook = useRequerimientoForm(defaultTipoSolicitud)
    const dataHook = useRequerimientoData(open)
    const submitHook = useRequerimientoSubmit()
    const pdfHook = usePdfGenerator()

    const handleNext = () => {
        if (formHook.validate(currentStep)) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handleSubmit = async () => {
        const result = await submitHook.submit(formHook.form, formHook.productosSeleccionados)
        if (!result.success) {
            message.error(result.error || 'Error al crear el requerimiento')
        }
    }

    const handleClose = () => {
        onClose()
        setTimeout(() => {
            setCurrentStep(0)
            submitHook.reset()
            formHook.resetForm()
        }, 300)
    }

    const steps = [
        { title: "Información General" },
        { title: formHook.form.tipoSolicitud === "OS" ? "Detalle del Servicio" : "Detalle de Productos" },
        { title: "Confirmación" },
    ]

    const productosSource = productosDisponibles.length > 0 ? productosDisponibles : dataHook.fetchedProductos

    if (!open) return null

    return (
        <>
            <Modal
                centered
                width={900}
                open={open}
                title="Nuevo Requerimiento Interno"
                onCancel={handleClose}
                maskClosable={false}
                keyboard={false}
                destroyOnHidden
                footer={
                    submitHook.isSubmitted ? (
                        <div className="flex items-center justify-between">
                            {submitHook.requerimientoCreado && (
                                <Button
                                    icon={<FaFilePdf className='text-red-600' />}
                                    loading={pdfHook.pdfLoading}
                                    onClick={() => pdfHook.generatePdf(submitHook.requerimientoCreado!.id)}
                                >
                                    Ver PDF
                                </Button>
                            )}
                            <Button type="primary" onClick={handleClose} className={classOkButtonModal}>
                                Cerrar
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {currentStep > 0 && (
                                    <Button onClick={() => setCurrentStep(prev => prev - 1)}>
                                        ← Atrás
                                    </Button>
                                )}
                                <span className="text-xs text-slate-500">Paso {currentStep + 1} de {steps.length}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleClose}>Cancelar</Button>
                                {currentStep < 2 ? (
                                    <Button type="primary" onClick={handleNext} className={classOkButtonModal}>
                                        Siguiente →
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        onClick={handleSubmit}
                                        loading={submitHook.submitting}
                                        className={classOkButtonModal}
                                    >
                                        ✓ Enviar a Supervisión
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                }
            >
                {!submitHook.isSubmitted && (
                    <Steps
                        current={currentStep}
                        items={steps}
                        size="small"
                        className="mb-6"
                    />
                )}

                <div className="min-h-[400px]">
                    {submitHook.isSubmitted ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-18 h-18 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center text-4xl mb-5 shadow-lg shadow-emerald-600/30">✓</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Requerimiento Enviado</h3>
                            <p className="text-sm text-slate-600 max-w-sm leading-relaxed mb-4">
                                El requerimiento ha sido enviado al área de supervisión. Se generará la {formHook.form.tipoSolicitud === "OC" ? "Orden de Compra" : "Orden de Servicio"} correspondiente una vez aprobado.
                            </p>
                            {submitHook.requerimientoCreado && (
                                <div className="bg-slate-50 border border-slate-200 rounded px-4 py-2 font-mono text-sm font-semibold text-emerald-600">
                                    {submitHook.requerimientoCreado.codigo}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {currentStep === 0 && (
                                <StepGeneral
                                    form={formHook.form}
                                    setField={formHook.setField}
                                    errors={formHook.errors}
                                    areas={AREAS}
                                    prioridades={PRIORIDADES}
                                />
                            )}

                            {currentStep === 1 && formHook.form.tipoSolicitud === "OC" && (
                                <StepProductos
                                    form={formHook.form}
                                    setField={formHook.setField}
                                    errors={formHook.errors}
                                    productosDisponibles={productosSource}
                                    productosSeleccionados={formHook.productosSeleccionados}
                                    onAgregarProducto={(p) => {
                                        const exists = p.id
                                            ? formHook.productosSeleccionados.find(s => s.id === p.id)
                                            : formHook.productosSeleccionados.find(s => s.nombre === p.nombre && s.id === null)

                                        if (!exists) {
                                            formHook.setProductosSeleccionados([...formHook.productosSeleccionados, { ...p, cantidad: 1 }])
                                        }
                                    }}
                                    onQuitarProducto={(id) => {
                                        formHook.setProductosSeleccionados(prev => prev.filter(p => {
                                            const uniqueId = p.id || `manual-${formHook.productosSeleccionados.indexOf(p)}-${p.nombre}`
                                            return uniqueId !== id
                                        }))
                                    }}
                                    onCambiarCantidad={(id, cantidad) => {
                                        formHook.setProductosSeleccionados(prev => prev.map(p => {
                                            const uniqueId = p.id || `manual-${prev.indexOf(p)}-${p.nombre}`
                                            return uniqueId === id ? { ...p, cantidad } : p
                                        }))
                                    }}
                                    onCambiarUnidad={(id, unidad) => {
                                        formHook.setProductosSeleccionados(prev => prev.map(p => {
                                            const uniqueId = p.id || `manual-${prev.indexOf(p)}-${p.nombre}`
                                            return uniqueId === id ? { ...p, unidad } : p
                                        }))
                                    }}
                                />
                            )}

                            {currentStep === 1 && formHook.form.tipoSolicitud === "OS" && (
                                <StepServicio
                                    form={formHook.form}
                                    setField={formHook.setField}
                                    errors={formHook.errors}
                                    tiposServicio={dataHook.tiposServicio}
                                    onAbrirModalTipoServicio={() => setOpenModalTipoServicio(true)}
                                    proveedores={dataHook.fetchedProveedores}
                                />
                            )}

                            {currentStep === 2 && (
                                <StepResumen
                                    form={formHook.form}
                                    productosSeleccionados={formHook.productosSeleccionados}
                                    prioridades={PRIORIDADES}
                                />
                            )}
                        </>
                    )}
                </div>
            </Modal>

            <ModalShowDoc
                open={pdfHook.openPdfModal}
                setOpen={(v) => { if (!v) pdfHook.closePdfModal() }}
                nro_doc={submitHook.requerimientoCreado?.codigo ?? ''}
                backendPdfUrl={pdfHook.pdfBlobUrl}
                backendPdfLoading={pdfHook.pdfLoading}
            >
                <></>
            </ModalShowDoc>

            <ModalCrearTipoServicio
                open={openModalTipoServicio}
                onClose={() => setOpenModalTipoServicio(false)}
                onSuccess={(nuevoTipo) => {
                    dataHook.addTipoServicio(nuevoTipo)
                    formHook.setField('tipoServicio', nuevoTipo.id)
                }}
            />
        </>
    )
}
