// Cargar datos del banco si está en modo edición'use client'

import { useState, useEffect } from 'react'
import { Form, Switch, Radio, App, Divider, Card, Button, Select } from 'antd'
import { FaPlus, FaTrash } from 'react-icons/fa'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import LabelBase from '~/components/form/label-base'
import { metodoDePagoApi, type MetodoDePago } from '~/lib/api/metodo-de-pago'
import { apiRequest } from '~/lib/api'
import { cajaPrincipalApi } from '~/lib/api/caja-principal'

interface MetodoPagoItem {
  id: string
  nombre: string
  requiere_numero_serie: boolean
  tipo_sobrecargo: 'ninguno' | 'porcentaje' | 'monto_fijo'
  sobrecargo_porcentaje: number
  adicional: number
  mostrar: boolean
  tiene_numero_celular: boolean
  numero_celular?: string
  esExistente?: boolean
}

interface ModalRegistroCompletoProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
  bancoInicial?: MetodoDePago | null
}

export default function ModalRegistroCompleto({
  open,
  setOpen,
  onSuccess,
  bancoInicial,
}: ModalRegistroCompletoProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [metodosPago, setMetodosPago] = useState<MetodoPagoItem[]>([])
  const [bancoId, setBancoId] = useState<string | null>(null)
  const [subCajasDigitales, setSubCajasDigitales] = useState<any[]>([])
  const [montoInicial, setMontoInicial] = useState<number>(0)
  const { message } = App.useApp()
  const modoEdicion = !!bancoInicial

  // Cargar sub-cajas digitales disponibles
  useEffect(() => {
    if (open && !modoEdicion) {
      cargarSubCajasDigitales()
    }
  }, [open, modoEdicion])

  const cargarSubCajasDigitales = async () => {
    try {
      const response = await cajaPrincipalApi.getAll()
      if (response.data) {
        // Extraer todas las sub-cajas que NO sean Caja Chica (tipo_caja !== 'CC')
        const todasSubCajas = response.data.data.flatMap((caja: any) =>
          (caja.sub_cajas || []).filter((sc: any) => sc.tipo_caja !== 'CC')
        )
        setSubCajasDigitales(todasSubCajas)
      }
    } catch (error) {
      console.error('Error al cargar sub-cajas:', error)
    }
  }
  useEffect(() => {
    if (open && bancoInicial) {
      form.setFieldsValue({
        nombre_banco: bancoInicial.name,
        cuenta_bancaria: bancoInicial.cuenta_bancaria,
        nombre_titular: bancoInicial.nombre_titular,
      })
      setMontoInicial(bancoInicial.monto_inicial || 0)
      setBancoId(bancoInicial.id)
      // Cargar métodos existentes del banco
      if (bancoInicial.despliegues_de_pagos) {
        const metodosExistentes = bancoInicial.despliegues_de_pagos.map((m: any) => ({
          id: m.id,
          nombre: m.name,
          requiere_numero_serie: m.requiere_numero_serie,
          tipo_sobrecargo: m.tipo_sobrecargo,
          sobrecargo_porcentaje: m.sobrecargo_porcentaje,
          adicional: m.adicional,
          mostrar: m.mostrar,
          tiene_numero_celular: !!m.numero_celular,
          numero_celular: m.numero_celular || '',
          esExistente: true,
        }))
        setMetodosPago(metodosExistentes)
      }
    } else if (!open) {
      // Limpiar cuando se cierra el modal
      handleReset()
    }
  }, [open, bancoInicial, form])

  const agregarMetodo = () => {
    const nuevoMetodo: MetodoPagoItem = {
      id: Date.now().toString(),
      nombre: '',
      requiere_numero_serie: false,
      tipo_sobrecargo: 'ninguno',
      sobrecargo_porcentaje: 0,
      adicional: 0,
      mostrar: true,
      tiene_numero_celular: false,
      numero_celular: '',
    }
    setMetodosPago([...metodosPago, nuevoMetodo])
  }

  const eliminarMetodo = (id: string) => {
    setMetodosPago(metodosPago.filter(m => m.id !== id))
  }

  const actualizarMetodo = (id: string, campo: keyof MetodoPagoItem, valor: any) => {
    setMetodosPago(metodosPago.map(m =>
      m.id === id ? { ...m, [campo]: valor } : m
    ))
  }

  const handleReset = () => {
    form.resetFields()
    setMetodosPago([])
    setBancoId(null)
    setMontoInicial(0)
    setLoading(false)
  }

  const handleSubmit = async (values: any) => {
    // Validar que todos los métodos tengan nombre (si hay métodos)
    if (metodosPago.length > 0) {
      const metodosSinNombre = metodosPago.filter(m => !m.nombre.trim())
      if (metodosSinNombre.length > 0) {
        message.error('Todos los métodos deben tener un nombre')
        return
      }
    }

    setLoading(true)
    try {
      let bancoIdFinal: string | null = bancoId

      // Si el nombre del banco está vacío, usar "Sin Banco"
      const nombreBanco = values.nombre_banco?.trim() || 'Sin Banco'

      // Si no estamos en modo edición, crear el banco
      if (!modoEdicion) {
        const responseBanco = await metodoDePagoApi.create({
          name: nombreBanco,
          cuenta_bancaria: values.cuenta_bancaria,
          nombre_titular: values.nombre_titular,
          monto_inicial: montoInicial,
        })

        if (responseBanco.error) {
          message.error(responseBanco.error.message || 'Error al crear banco')
          return
        }

        bancoIdFinal = responseBanco.data?.data.id || null
      } else {
        // Actualizar el banco
        const responseBanco = await metodoDePagoApi.update(bancoId!, {
          name: nombreBanco,
          cuenta_bancaria: values.cuenta_bancaria,
          nombre_titular: values.nombre_titular,
        })

        if (responseBanco.error) {
          message.error(responseBanco.error.message || 'Error al actualizar banco')
          return
        }
      }

      if (!bancoIdFinal) {
        message.error('Error: No se pudo obtener el ID del banco')
        return
      }

      // Crear/actualizar métodos de pago solo si hay métodos
      if (metodosPago.length > 0) {
        const metodosNuevos = metodosPago.filter(m => !m.esExistente)
        const metodosExistentes = metodosPago.filter(m => m.esExistente)

        // Crear nuevos métodos
        if (metodosNuevos.length > 0) {
          const resultados = await Promise.allSettled(
            metodosNuevos.map(metodo =>
              apiRequest('/despliegues-de-pago', {
                method: 'POST',
                body: JSON.stringify({
                  name: metodo.nombre,
                  metodo_de_pago_id: bancoIdFinal,
                  requiere_numero_serie: metodo.requiere_numero_serie,
                  tipo_sobrecargo: metodo.tipo_sobrecargo,
                  sobrecargo_porcentaje: metodo.sobrecargo_porcentaje,
                  adicional: metodo.adicional,
                  mostrar: metodo.mostrar,
                  numero_celular: metodo.tiene_numero_celular ? (metodo.numero_celular || null) : null,
                }),
              })
            )
          )

          // Contar éxitos y fallos
          const exitosos = resultados.filter(r => r.status === 'fulfilled').length
          const fallidos = resultados.filter(r => r.status === 'rejected').length

          if (fallidos > 0) {
            message.warning(`${exitosos} método(s) creado(s), ${fallidos} fallaron (posiblemente ya existen)`)
          }
        }

        // Actualizar métodos existentes
        if (metodosExistentes.length > 0) {
          const promesasActualizar = metodosExistentes.map(metodo =>
            apiRequest(`/despliegues-de-pago/${metodo.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                name: metodo.nombre,
                requiere_numero_serie: metodo.requiere_numero_serie,
                tipo_sobrecargo: metodo.tipo_sobrecargo,
                sobrecargo_porcentaje: metodo.sobrecargo_porcentaje,
                adicional: metodo.adicional,
                mostrar: metodo.mostrar,
                numero_celular: metodo.tiene_numero_celular ? (metodo.numero_celular || null) : null,
              }),
            })
          )
          await Promise.all(promesasActualizar)
        }
      }

      const mensajeExito = metodosPago.length > 0
        ? (modoEdicion
          ? 'Banco y métodos actualizados exitosamente'
          : `${nombreBanco} y ${metodosPago.length} método(s) creados exitosamente`)
        : `${nombreBanco} creado exitosamente`

      message.success(mensajeExito)

      setOpen(false)
      handleReset()
      onSuccess?.()
    } catch (error) {
      console.error('Error:', error)
      message.error('Error inesperado al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalForm
      modalProps={{
        width: 900,
        title: (
          <TitleForm>
            {modoEdicion ? 'Editar Banco y Métodos de Pago' : 'Registro de Cuenta y Métodos de Pago'}
          </TitleForm>
        ),
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: modoEdicion ? 'Actualizar Todo' : 'Guardar Todo',
      }}
      onCancel={handleReset}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: 'vertical',
      }}
    >
      {/* SECCIÓN 1: DATOS DEL BANCO */}
      <div className='mb-6'>
        <h3 className='text-base font-semibold text-slate-700 mb-2'>
          1. Datos del Banco (Opcional)
        </h3>
        <p className='text-xs text-slate-500 mb-4'>
          Puedes dejar el nombre del banco vacío si el método no pertenece a ningún banco (ej: Efectivo)
        </p>

        <div className='grid grid-cols-2 gap-4'>
          <LabelBase label='Nombre del Banco (Opcional)' orientation='column'>
            <InputBase
              placeholder='Ej: BCP, BBVA, Interbank (dejar vacío para métodos sin banco)'
              uppercase={false}
              propsForm={{
                name: 'nombre_banco',
                rules: [
                  { max: 191, message: 'Máximo 191 caracteres' },
                ],
              }}
            />
            <p className='text-xs text-slate-500 mt-1'>
              Si dejas este campo vacío, se creará como "Sin Banco" (útil para Efectivo)
            </p>
          </LabelBase>

          <LabelBase label='Nombre del Titular (Opcional)' orientation='column'>
            <InputBase
              placeholder='Ej: Juan Pérez'
              uppercase={false}
              propsForm={{
                name: 'nombre_titular',
                rules: [
                  { max: 191, message: 'Máximo 191 caracteres' },
                ],
              }}
            />
          </LabelBase>
        </div>

        <div className='grid grid-cols-2 gap-4 mt-4'>
          <LabelBase label='Número de Cuenta (Opcional)' orientation='column'>
            <InputBase
              placeholder='Ej: 123-456789-0-12'
              uppercase={false}
              propsForm={{
                name: 'cuenta_bancaria',
                rules: [
                  { max: 191, message: 'Máximo 191 caracteres' },
                ],
              }}
            />
          </LabelBase>

          <LabelBase label='Monto Inicial (Opcional)' orientation='column'>
            <InputNumberBase
              placeholder='0.00'
              min={0}
              precision={2}
              prefix='S/. '
              value={montoInicial}
              onChange={(value) => setMontoInicial(Number(value) || 0)}
            />
            <p className='text-xs text-slate-500 mt-1'>
              Saldo inicial con el que se registra la cuenta bancaria.
            </p>
          </LabelBase>


        </div>
      </div>

      <Divider />

      {/* SECCIÓN 2: TIPOS DE PAGOS */}
      <div>
        <div className='flex justify-between items-center mb-2'>
          <h3 className='text-base font-semibold text-slate-700'>
            2. Tipos de Pagos Vinculados (Opcional)
          </h3>
          <Button
            type='dashed'
            icon={<FaPlus />}
            onClick={agregarMetodo}
          >
            Agregar Método
          </Button>
        </div>
        <p className='text-xs text-slate-500 mb-4'>
          Si el método de pago no requiere sub-tipos (ej: Efectivo), puedes dejarlo vacío
        </p>

        {metodosPago.length === 0 ? (
          <div className='text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300'>
            <p className='text-slate-500 mb-2'>No hay métodos vinculados</p>
            <p className='text-xs text-slate-400 mb-3'>
              Puedes crear el método de pago sin sub-tipos (útil para Efectivo)
            </p>
            <Button
              type='dashed'
              icon={<FaPlus />}
              onClick={agregarMetodo}
            >
              Agregar Método Vinculado
            </Button>
          </div>
        ) : (
          <div className='space-y-4 max-h-[400px] overflow-y-auto pr-2'>
            {metodosPago.map((metodo, index) => (
              <Card
                key={metodo.id}
                size='small'
                title={
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Método #{index + 1}</span>
                    <Button
                      danger
                      size='small'
                      icon={<FaTrash />}
                      onClick={() => eliminarMetodo(metodo.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                }
                className='border-slate-300'
              >
                <div className='space-y-3'>
                  {/* Nombre del método */}
                  <LabelBase label='Nombre del Método' orientation='column'>
                    <InputBase
                      placeholder='Ej: Yape, Transferencia, Izipay, Plin'
                      uppercase={false}
                      value={metodo.nombre}
                      onChange={(e) => actualizarMetodo(metodo.id, 'nombre', e.target.value)}
                    />
                  </LabelBase>

                  {/* Checkbox para habilitar número de celular */}
                  <LabelBase label='¿Tiene Número de Celular?' orientation='column'>
                    <Switch
                      checked={metodo.tiene_numero_celular}
                      onChange={(checked) => {
                        // Actualizar el estado del switch
                        const nuevosMetodos = metodosPago.map(m => {
                          if (m.id === metodo.id) {
                            return {
                              ...m,
                              tiene_numero_celular: checked,
                              numero_celular: checked ? m.numero_celular : ''
                            }
                          }
                          return m
                        })
                        setMetodosPago(nuevosMetodos)
                      }}
                      checkedChildren="Sí"
                      unCheckedChildren="No"
                    />
                    <p className='text-xs text-slate-500 mt-1'>
                      Activar para métodos como Yape o Plin
                    </p>
                  </LabelBase>

                  {/* Número de celular (solo si está habilitado) */}
                  {metodo.tiene_numero_celular && (
                    <LabelBase label='Número de Celular' orientation='column'>
                      <InputBase
                        placeholder='Ej: 987654321, +51 987 654 321'
                        uppercase={false}
                        value={metodo.numero_celular || ''}
                        onChange={(e) => actualizarMetodo(metodo.id, 'numero_celular', e.target.value)}
                      />
                      <p className='text-xs text-slate-500 mt-1'>
                        Debe ser único (no se puede repetir).
                      </p>
                    </LabelBase>
                  )}

                  <div className='grid grid-cols-2 gap-4'>
                    {/* Requiere número de operación */}
                    <LabelBase label='¿Requiere N° Operación?' orientation='column'>
                      <Switch
                        checked={metodo.requiere_numero_serie}
                        onChange={(checked) => actualizarMetodo(metodo.id, 'requiere_numero_serie', checked)}
                        checkedChildren="Sí"
                        unCheckedChildren="No"
                      />
                    </LabelBase>

                    {/* Mostrar en ventas */}
                    <LabelBase label='Mostrar en Ventas' orientation='column'>
                      <Switch
                        checked={metodo.mostrar}
                        onChange={(checked) => actualizarMetodo(metodo.id, 'mostrar', checked)}
                        checkedChildren="Visible"
                        unCheckedChildren="Oculto"
                      />
                    </LabelBase>
                  </div>

                  {/* Tipo de sobrecargo */}
                  <LabelBase label='Tipo de Sobrecargo' orientation='column'>
                    <Radio.Group
                      value={metodo.tipo_sobrecargo}
                      onChange={(e) => actualizarMetodo(metodo.id, 'tipo_sobrecargo', e.target.value)}
                    >
                      <Radio value='ninguno'>Ninguno</Radio>
                      <Radio value='porcentaje'>Porcentaje</Radio>
                      <Radio value='monto_fijo'>Monto Fijo</Radio>
                    </Radio.Group>
                  </LabelBase>

                  {/* Campos condicionales de sobrecargo */}
                  {metodo.tipo_sobrecargo === 'porcentaje' && (
                    <LabelBase label='Porcentaje (%)' orientation='column'>
                      <InputNumberBase
                        placeholder='Ej: 4.8'
                        min={0}
                        max={100}
                        precision={2}
                        value={metodo.sobrecargo_porcentaje}
                        onChange={(value) => actualizarMetodo(metodo.id, 'sobrecargo_porcentaje', value || 0)}
                      />
                    </LabelBase>
                  )}

                  {metodo.tipo_sobrecargo === 'monto_fijo' && (
                    <LabelBase label='Monto Fijo (S/.)' orientation='column'>
                      <InputNumberBase
                        placeholder='Ej: 5.00'
                        min={0}
                        precision={2}
                        prefix='S/. '
                        value={metodo.adicional}
                        onChange={(value) => actualizarMetodo(metodo.id, 'adicional', value || 0)}
                      />
                    </LabelBase>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {metodosPago.length > 0 && (
        <div className='mt-4 p-3 bg-green-50 rounded-lg border border-green-200'>
          <p className='text-sm text-green-700'>
            <strong>✓ {metodosPago.length} método(s)</strong> listo(s) para crear
          </p>
        </div>
      )}
    </ModalForm>
  )
}
