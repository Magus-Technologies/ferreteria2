"use client"

import { useState } from "react"
import { Modal, Form, Input, Button, message } from "antd"
import TitleForm from "~/components/form/title-form"
import LabelBase from "~/components/form/label-base"
import { PlusOutlined } from "@ant-design/icons"
import { tipoServicioApi } from "~/lib/api/tipo-servicio"

interface ModalCrearTipoServicioProps {
    open: boolean
    onClose: () => void
    onSuccess?: (nuevoTipo: { id: number; nombre: string }) => void
}

export default function ModalCrearTipoServicio({
    open,
    onClose,
    onSuccess,
}: ModalCrearTipoServicioProps) {
    const [form] = Form.useForm()
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            setSubmitting(true)

            const response = await tipoServicioApi.create({
                nombre: values.nombre,
                descripcion: values.descripcion || undefined,
            })

            if (response.data?.data) {
                message.success('Tipo de servicio creado exitosamente')
                onSuccess?.(response.data.data)
                form.resetFields()
                onClose()
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error al crear el tipo de servicio'
            message.error(errorMessage)
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleClose = () => {
        form.resetFields()
        onClose()
    }

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            centered
            width={500}
            title={<TitleForm className="!pb-0">Nuevo Tipo de Servicio</TitleForm>}
            footer={[
                <Button key="cancel" onClick={handleClose} className="!rounded-md">
                    Cancelar
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    onClick={handleSubmit}
                    loading={submitting}
                    className="!bg-emerald-600 hover:!bg-emerald-700 !border-none !rounded-md"
                    icon={<PlusOutlined />}
                >
                    Crear Tipo de Servicio
                </Button>,
            ]}
            destroyOnHidden
            classNames={{ content: "!rounded-2xl overflow-hidden" }}
        >
            <Form form={form} layout="vertical" className="py-4">
                <LabelBase label="Nombre del Tipo de Servicio" orientation="column" classNames={{ labelParent: 'mb-1' }}>
                    <Form.Item
                        name="nombre"
                        noStyle
                        rules={[
                            { required: true, message: 'Ingrese el nombre del tipo de servicio' },
                            { min: 3, message: 'El nombre debe tener al menos 3 caracteres' },
                            { max: 100, message: 'El nombre no puede exceder 100 caracteres' },
                        ]}
                    >
                        <Input
                            placeholder="Ej: Mantenimiento, Instalación, Consultoría..."
                            className="!rounded-md h-10 border-slate-200 focus:border-emerald-500"
                        />
                    </Form.Item>
                </LabelBase>
            </Form>
        </Modal>
    )
}
