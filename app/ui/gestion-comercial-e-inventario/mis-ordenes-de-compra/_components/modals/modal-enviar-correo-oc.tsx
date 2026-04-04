'use client'

import React, { useEffect } from 'react'
import { Modal, Form, Input, Checkbox, App } from 'antd'
import { ordenCompraApi, type OrdenCompra } from '~/lib/api/orden-compra'
import { classOkButtonModal } from '~/lib/clases'

export interface ModalEnviarCorreoOCProps {
    open: boolean
    onClose: () => void
    ordenData?: OrdenCompra
}

const OPCIONES_COLUMNAS = [
    { label: 'Código', value: 'codigo' },
    { label: 'Descripción', value: 'producto' },
    { label: 'Marca', value: 'marca' },
    { label: 'Unidad', value: 'unidad' },
    { label: 'Cantidad', value: 'cantidad' },
    { label: 'Precio', value: 'precio' },
    { label: 'Flete', value: 'flete' },
    { label: 'Subtotal', value: 'subtotal' },
    { label: 'Total', value: 'total' },
]

export default function ModalEnviarCorreoOC({ open, onClose, ordenData }: ModalEnviarCorreoOCProps) {
    const { message } = App.useApp()
    const [form] = Form.useForm()
    const [loading, setLoading] = React.useState(false)

    useEffect(() => {
        if (open && ordenData) {
            form.setFieldsValue({
                email: (ordenData.proveedor as any)?.correo ?? '',
                // Por defecto, se enviará todo menos precio, flete, subtotal, a menos que el usuario lo desee
                columnas: ['codigo', 'producto', 'marca', 'unidad', 'cantidad']
            })
        }
    }, [open, ordenData, form])

    const handleSend = async () => {
        try {
            const values = await form.validateFields()
            setLoading(true)
            message.loading({ content: 'Preparando y enviando el correo...', key: 'cargandoEmail' })
            
            const res = await ordenCompraApi.enviarCorreo(ordenData!.id, {
                email: values.email,
                columnas: values.columnas
            })

            message.success({ content: res.data?.message || 'Correo enviado exitosamente', key: 'cargandoEmail' })
            onClose()
        } catch (error: any) {
            if (error.errorFields) return // Validación fallida de Form
            message.error({ content: error.message || 'Error al enviar el correo, verifique la configuración SMTP del servidor', key: 'cargandoEmail' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title={`Enviar Orden de Compra ${ordenData?.codigo || ''}`}
            open={open}
            onCancel={onClose}
            onOk={handleSend}
            confirmLoading={loading}
            okText="Enviar Documento"
            cancelText="Cancelar"
            classNames={{ header: 'border-b pb-3 mb-4', footer: 'mt-5' }}
            okButtonProps={{ className: classOkButtonModal }}
            destroyOnHidden
        >
            <Form layout="vertical" form={form}>
                <Form.Item
                    label="Correo electrónico del destinatario"
                    name="email"
                    rules={[
                        { required: true, message: 'Ingrese el correo' },
                        { type: 'email', message: 'Ingrese un correo válido' }
                    ]}
                >
                    <Input placeholder="ejemplo@proveedor.com" autoComplete='off' autoFocus className="normal-case" />
                </Form.Item>

                <Form.Item
                    label="Seleccione las columnas a incluir en el PDF (Opcional)"
                    name="columnas"
                    tooltip="Desmarca las columnas que no desees compartir con el proveedor, como los precios o fletes internos."
                >
                    <Checkbox.Group className="flex flex-col gap-2 mt-2">
                        <div className="grid grid-cols-2 gap-2">
                            {OPCIONES_COLUMNAS.map(opt => (
                                <Checkbox key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Checkbox>
                            ))}
                        </div>
                    </Checkbox.Group>
                </Form.Item>
            </Form>
        </Modal>
    )
}
