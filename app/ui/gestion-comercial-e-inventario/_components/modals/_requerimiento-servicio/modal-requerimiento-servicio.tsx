"use client"

import { useState } from "react"
import { Modal, Steps, Button, message } from "antd"
import { FaFilePdf } from "react-icons/fa6"
import { classOkButtonModal } from "~/lib/clases"
import ModalShowDoc from "~/app/_components/modals/modal-show-doc"
import ModalCrearTipoServicio from "../modal-crear-tipo-servicio"
import StepGeneral from "./step-general"
import StepServicio from "../_requerimiento-interno/step-servicio"
import StepResumen from "./step-resumen"
import { useRequerimientoForm } from "./hooks/use-requerimiento-form"
import { useRequerimientoData } from "./hooks/use-requerimiento-data"
import { useRequerimientoSubmit } from "./hooks/use-requerimiento-submit"
import { usePdfGenerator } from "../_requerimiento-interno/hooks/use-pdf-generator"

interface ModalRequerimientoServicioProps {
    open: boolean
    onClose: () => void
}

const PRIORIDADES = [
    { value: "BAJA", label: "Baja", color: "bg-gray-100 border-gray-300 text-gray-700" },
    { value: "MEDIA", label: "Media", color: "bg-amber-50 border-amber-300 text-amber-900" },
    { value: "ALTA", label: "Alta", color: "bg-red-50 border-red-300 text-red-900" },
    { value: "URGENTE", label: "Urgente", color: "bg-purple-50 border-purple-300 text-purple-900" },
]

export default function ModalRequerimientoServicio({
    open,
    onClose,
}: ModalRequerimientoServicioProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [openModalTipoServicio, setOpenModalTipoServicio] = useState(false)

    const formHook = useRequerimientoForm()
    const dataHook = useRequerimientoData(open)
    const submitHook = useRequerimientoSubmit()
    const pdfHook = usePdfGenerator()

    const handleNext = () => {
        if (formHook.validate(currentStep)) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handleSubmit = async () => {
        const result = await submitHook.submit(formHook.form, formHook.serviciosSeleccionados)
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
        { title: "Detalle del Servicio" },
        { title: "Confirmación" },
    ]

    if (!open) return null

    return (
        <>
            <Modal
                centered
                width={900}
                open={open}
                title="Nueva Orden de Servicio"
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
                                El requerimiento ha sido enviado al área de supervisión. Se generará la Orden de Servicio correspondiente una vez aprobado.
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
                                    prioridades={PRIORIDADES}
                                    cargos={dataHook.cargos}
                                />
                            )}

                            {currentStep === 1 && (
                                <StepServicio
                                    serviciosSeleccionados={formHook.serviciosSeleccionados}
                                    setServiciosSeleccionados={formHook.setServiciosSeleccionados}
                                    fechaRequerida={formHook.form.fechaRequerida}
                                    errors={formHook.errors}
                                    tiposServicio={dataHook.tiposServicio}
                                    onAbrirModalTipoServicio={() => setOpenModalTipoServicio(true)}
                                    vehiculos={dataHook.vehiculos}
                                    vehiculoId={formHook.form.vehiculoId}
                                    setVehiculoId={(id) => formHook.setField('vehiculoId', id)}
                                    afectaCalendario={formHook.form.afectaCalendario}
                                    setAfectaCalendario={(value) => formHook.setField('afectaCalendario', value)}
                                />
                            )}

                            {currentStep === 2 && (
                                <StepResumen
                                    form={formHook.form}
                                    serviciosSeleccionados={formHook.serviciosSeleccionados}
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
