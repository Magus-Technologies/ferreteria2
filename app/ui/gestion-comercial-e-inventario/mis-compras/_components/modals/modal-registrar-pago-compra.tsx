'use client'

import { Form, Input, DatePicker, Select, Divider, App } from 'antd'
import { useState, useEffect, useMemo } from 'react'
import type { Compra, PagoDeCompra } from '~/lib/api/compra'
import { compraApi } from '~/lib/api/compra'
import dayjs, { Dayjs } from 'dayjs'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import LabelBase from '~/components/form/label-base'
import SelectDespliegeDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import { useServerMutation } from '~/hooks/use-server-mutation'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { toLocalString } from '~/utils/fechas'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'

interface ModalRegistrarPagoCompraProps {
  open: boolean
  setOpen: (open: boolean) => void
  compra: Compra | undefined
}

interface PagoCompraValues {
  despliegue_de_pago_id: string | number
  monto: number
  fecha_pago: Dayjs
  observacion?: string
  afecta_caja: boolean
  numero_operacion?: string
  tipo_cambio?: number
  aplica_letra?: string
  banco_cuenta?: string
  numero_letra?: string
}

export default function ModalRegistrarPagoCompra({
  open,
  setOpen,
  compra,
}: ModalRegistrarPagoCompraProps) {
  const { message, modal } = App.useApp()
  const [form] = Form.useForm<PagoCompraValues>()
  const [pagosRealizados, setPagosRealizados] = useState<PagoDeCompra[]>([])
  const tableRefPagos = useRef<AgGridReact>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const [isEfectivo, setIsEfectivo] = useState(false)

  // Manejar cambio de método de pago
  const handleMetodoPagoChange = (value: string, option: any) => {
    // El option contiene el label que tiene el formato: "SubCaja/Banco/Método/Titular"
    if (option && option.label) {
      const label = (option.label as string).toUpperCase()
      const cashDetected = label.includes('EFECTIVO')
      setIsEfectivo(cashDetected)

      // Si es efectivo, limpiar el número de operación
      if (cashDetected) {
        form.setFieldValue('numero_operacion', undefined)
      }

      // Extraer banco, método y titular del label
      const parts = option.label.split('/')
      if (parts.length >= 2) {
        const banco = parts[1]?.trim() || ''
        const metodo = parts[2]?.trim() || ''
        const titular = parts[3]?.trim() || ''

        // Construir el texto de banco y cuenta
        const bancoCuenta = titular
          ? `${banco} / ${metodo} / ${titular}`
          : `${banco} / ${metodo}`

        form.setFieldValue('banco_cuenta', bancoCuenta)
      }
    } else {
      setIsEfectivo(false)
    }
  }

  // Calcular totales de la compra
  const totales = useMemo(() => {
    if (!compra) return { totalNeto: 0, montoCancelado: 0, saldo: 0 }

    // Calcular total neto de la compra
    const totalNeto = (compra.productos_por_almacen || []).reduce((acc, item) => {
      const costo = Number(item.costo ?? 0)
      for (const u of item.unidades_derivadas ?? []) {
        const cantidad = Number(u.cantidad ?? 0)
        const factor = Number(u.factor ?? 0)
        const flete = Number(u.flete ?? 0)
        const bonificacion = Boolean(u.bonificacion)
        const montoLinea = (bonificacion ? 0 : costo * cantidad * factor) + flete
        acc += montoLinea
      }
      return acc
    }, 0)

    // Calcular monto cancelado (suma de pagos realizados)
    const montoCancelado = pagosRealizados
      .filter(p => p.estado)
      .reduce((acc, p) => acc + Number(p.monto), 0)

    // Calcular saldo pendiente
    const saldo = totalNeto - montoCancelado

    return { totalNeto, montoCancelado, saldo }
  }, [compra, pagosRealizados])

  // Mutation para registrar pago
  const { execute: registrarPago, loading: isPending } = useServerMutation({
    action: async (params: any) => {
      if (!compra?.id) {
        return { error: { message: 'ID de compra no disponible' } }
      }
      return await compraApi.storePago(compra.id, params)
    },
    queryKey: [QueryKeys.COMPRAS],
    onSuccess: (res) => {
      if (res.data && res.data.data) {
        message.success('Pago registrado correctamente')
        // Agregar el nuevo pago a la lista
        setPagosRealizados(prev => [...prev, res.data!.data as PagoDeCompra])
        // Limpiar solo los campos del pago, mantener fecha y afecta_caja
        form.setFieldsValue({
          despliegue_de_pago_id: undefined,
          monto: undefined,
          observacion: undefined,
          numero_operacion: undefined,
          banco_cuenta: undefined,
        })
        setHasChanges(false)
      }
    },
  })

  // Cargar pagos realizados cuando se abre el modal
  useEffect(() => {
    if (open && compra?.id) {
      compraApi.getPagos(compra.id)
        .then(res => {
          if (res.data) {
            setPagosRealizados(res.data.data || [])
          }
        })
        .catch(err => {
          console.error('Error al cargar pagos:', err)
          setPagosRealizados([])
        })
    }
  }, [open, compra?.id])

  // Calcular siguiente letra correlativa
  const siguienteLetra = useMemo(() => {
    // Buscar el máximo número de letra actual
    const letrasActuales = pagosRealizados
      .filter((p) => p.numero_letra && p.numero_letra.startsWith('L'))
      .map((p) => parseInt(p.numero_letra!.substring(1)))
      .filter((n) => !isNaN(n))

    const maxLetra = letrasActuales.length > 0 ? Math.max(...letrasActuales) : 0
    const nextNum = maxLetra + 1
    return `L${nextNum.toString().padStart(3, '0')}`
  }, [pagosRealizados])

  // Cargar siguiente letra al abrir o cuando cambian pagos
  useEffect(() => {
    if (open) {
      form.setFieldValue('numero_letra', siguienteLetra)
    }
  }, [open, siguienteLetra, form])

  // Reset form cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      form.resetFields()
      setPagosRealizados([])
      setHasChanges(false)
    }
  }, [open, form])

  // Detectar cambios en el formulario
  const handleFormChange = () => {
    const values = form.getFieldsValue()
    const hasData = (values.monto && values.monto > 0) || values.observacion || values.numero_operacion
    setHasChanges(!!hasData)
  }

  const handleSubmit = (values: PagoCompraValues & { numero_letra?: string }) => {
    if (!compra) return

    // Validar que el monto no exceda el saldo
    if (values.monto > totales.saldo) {
      message.error(`El monto no puede exceder el saldo pendiente de S/ ${totales.saldo.toFixed(2)}`)
      return
    }

    // Extraer solo el despliegue_pago_id del value (formato: "sub_caja_id-despliegue_pago_id")
    const desplieguePagoId = typeof values.despliegue_de_pago_id === 'string'
      ? values.despliegue_de_pago_id.split('-')[1]
      : values.despliegue_de_pago_id

    registrarPago({
      despliegue_de_pago_id: desplieguePagoId, // Mantener como string (ULID)
      monto: values.monto,
      fecha: values.fecha_pago.toISOString(),
      observacion: values.observacion,
      afecta_caja: values.afecta_caja,
      numero_operacion: values.numero_operacion,
      numero_letra: values.numero_letra,
    })
  }

  // Columnas de la tabla de pagos realizados
  const columnasPagos: ColDef<PagoDeCompra>[] = [
    {
      headerName: 'M.PAGO',
      width: 120,
      valueGetter: (params) => params.data?.despliegue_de_pago?.metodo_de_pago?.name || '-',
    },
    {
      headerName: 'BANCO/CUENTA',
      width: 160,
      valueGetter: (params) => {
        const cuenta = params.data?.despliegue_de_pago?.metodo_de_pago?.cuenta_bancaria
        const celular = params.data?.despliegue_de_pago?.numero_celular
        return cuenta || celular || '-'
      },
    },
    {
      headerName: 'LETRA',
      field: 'numero_letra',
      width: 90,
      cellStyle: { textAlign: 'center', fontWeight: 'bold' },
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'NRO.OPER',
      field: 'numero_operacion',
      width: 100,
      cellStyle: { textAlign: 'center' },
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'FECHA',
      field: 'fecha',
      width: 100,
      valueFormatter: (params) => {
        if (!params.value) return '-'
        return toLocalString({ date: dayjs(params.value), format: 'DD/MM/YYYY' }) || '-'
      },
      cellStyle: { textAlign: 'center' },
    },
    {
      headerName: 'MONTO',
      field: 'monto',
      width: 110,
      valueFormatter: (params) => `S/ ${Number(params.value).toFixed(2)}`,
      cellStyle: { textAlign: 'right', fontWeight: 'bold', color: '#059669' },
    },
    {
      headerName: 'OBSERVACIÓN',
      field: 'observacion',
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => params.data?.observacion || '-',
    },
  ]

  // Manejar cierre con confirmación
  const handleCancel = () => {
    if (hasChanges) {
      modal.confirm({
        title: '¿Desea descartar los cambios?',
        content: 'Hay datos sin guardar en el formulario. Si cierra, se perderán.',
        okText: 'Sí, descartar',
        cancelText: 'No, continuar',
        okButtonProps: { danger: true },
        onOk: () => {
          form.resetFields()
          setPagosRealizados([])
          setHasChanges(false)
          setOpen(false)
        },
      })
    } else {
      form.resetFields()
      setPagosRealizados([])
      setOpen(false)
    }
  }

  if (!compra) return null

  // Validar si el botón guardar debe estar habilitado
  const montoActual = form.getFieldValue('monto')
  const isGuardarDisabled = isPending || totales.saldo <= 0 || !montoActual || montoActual <= 0

  return (
    <ModalForm
      modalProps={{
        width: 1100,
        title: <TitleForm>Cuentas por Pagar - Comprobantes de Compras</TitleForm>,
        centered: true,
        okText: 'Guardar',
        okButtonProps: {
          loading: isPending,
          disabled: isGuardarDisabled,
          className: 'bg-green-600 hover:bg-green-700',
        },
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: 'vertical',
        initialValues: {
          fecha_pago: dayjs(),
          afecta_caja: true,
        },
        onValuesChange: handleFormChange,
      }}
      onCancel={handleCancel}
    >
      <div className="space-y-4">
        {/* Información del proveedor y documento - Jerarquía Visual Mejorada */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
          <div className="grid grid-cols-3 gap-6">
            {/* Bloque Izquierdo: Datos del Proveedor */}
            <div className="space-y-2 border-r border-gray-300 pr-4">
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-500 font-medium min-w-[100px]">Proveedor [F1]:</span>
                <div className="font-bold text-sm text-gray-800">
                  {compra.proveedor?.razon_social}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-500 font-medium min-w-[100px]">RUC:</span>
                <div className="font-semibold text-sm text-gray-700">
                  {compra.proveedor?.ruc}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-500 font-medium min-w-[100px]">Dirección:</span>
                <div className="text-sm text-gray-600 italic">
                  {(compra.proveedor as any)?.direccion || 'EL PORVENIR'}
                </div>
              </div>
            </div>

            {/* Bloque Central: Datos del Crédito */}
            <div className="space-y-2 border-r border-gray-300 pr-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium min-w-[110px]">Documento [F2]:</span>
                <div className="font-bold text-sm text-gray-800">
                  {compra.tipo_documento} {compra.serie}-{compra.numero}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium min-w-[110px]">*Moneda:</span>
                <div className="font-bold text-sm text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  {(compra.tipo_moneda as any) === 's' ? '🇵🇪 SOLES (S/)' : '🇺🇸 DÓLARES ($)'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium min-w-[110px]">Tipo Pago:</span>
                <div className="font-semibold text-sm text-gray-700">
                  {compra.forma_de_pago === 'cr' ? 'CRÉDITO' : 'CONTADO'}
                </div>
              </div>
            </div>

            {/* Bloque Derecho: Totales (Saldos) */}
            <div className="flex flex-col justify-center gap-2 pl-4">
              <div className="flex justify-between items-center bg-white/50 px-3 py-1 rounded border border-blue-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Total Neto</span>
                <span className="text-gray-800 font-bold text-lg">S/ {totales.totalNeto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-white/50 px-3 py-1 rounded border border-green-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Cancelado</span>
                <span className="text-green-600 font-bold text-lg">S/ {totales.montoCancelado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-white/50 px-3 py-1 rounded border border-red-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Saldo</span>
                <span className={`font-bold text-lg ${totales.saldo > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  S/ {totales.saldo.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Divider className="my-3" />

        {/* Formulario de pago */}
        <div className="grid grid-cols-4 gap-3">
          <LabelBase label="Modo Pago:" orientation="column">
            <SelectDespliegeDePago
              propsForm={{
                name: 'despliegue_de_pago_id',
                rules: [{ required: true, message: 'Requerido' }],
              }}
              form={form}
              formWithMessage={false}
              placeholder="Seleccione método de pago"
              filterByTipo={['efectivo', 'banco', 'billetera']}
              onChange={handleMetodoPagoChange}
            />
          </LabelBase>

          <LabelBase label="Banco y Cuenta:" orientation="column">
            <Form.Item name="banco_cuenta" className="mb-0">
              <Input
                placeholder="Se llenará automáticamente"
                disabled
                className="bg-gray-50 rounded-lg text-gray-700 font-medium"
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="Monto:" orientation="column">
            <Form.Item
              name="monto"
              rules={[
                { required: true, message: 'Requerido' },
                {
                  validator: (_, value) => {
                    const num = Number(value)
                    if (isNaN(num) || num <= 0) {
                      return Promise.reject('El monto debe ser mayor a 0')
                    }
                    return Promise.resolve()
                  }
                },
              ]}
              className="mb-0"
            >
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                prefix="S/"
                className="rounded-lg"
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="T.Cambio:" orientation="column">
            <Form.Item name="tipo_cambio" className="mb-0">
              <Input
                type="number"
                step="0.001"
                placeholder="0.000"
                disabled={(compra.tipo_moneda as any) === 's'}
                className={`rounded-lg ${(compra.tipo_moneda as any) === 's' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </Form.Item>
          </LabelBase>
        </div>

        <Form.Item name="afecta_caja" hidden>
          <Input type="hidden" />
        </Form.Item>

        <div className="grid grid-cols-4 gap-3">
          <LabelBase label="Fecha Pago:" orientation="column">
            <Form.Item name="fecha_pago" className="mb-0">
              <DatePicker
                format="DD/MM/YYYY"
                className="w-full rounded-lg"
                placeholder="Fecha"
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="Aplica Letra:" orientation="column">
            <Form.Item name="numero_letra" className="mb-0">
              <Input
                placeholder="L001"
                readOnly
                className="rounded-lg bg-gray-50 font-bold text-center"
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="Nº Recibo:" orientation="column">
            <Form.Item name="numero_operacion" className="mb-0">
              <Input
                placeholder={isEfectivo ? 'No aplica (Efectivo)' : 'Nº operación'}
                disabled={isEfectivo}
                className={`rounded-lg ${isEfectivo ? 'bg-gray-100' : ''}`}
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="Observación:" orientation="column">
            <Form.Item name="observacion" className="mb-0">
              <Input placeholder="Observaciones (opcional)" className="rounded-lg" />
            </Form.Item>
          </LabelBase>
        </div>

        <Divider className="my-3" />

        {/* Tabla de pagos realizados */}
        <div>
          <div className="mb-2 font-semibold text-sm">
            Registros pagos realizados: # {pagosRealizados.filter(p => p.estado).length}
          </div>
          <div className="h-[200px]">
            <TableWithTitle
              id="tabla-pagos-compra"
              tableRef={tableRefPagos}
              title=""
              columnDefs={columnasPagos}
              rowData={pagosRealizados.filter(p => p.estado)}
              loading={false}
              pagination={false}
              domLayout="normal"
              withNumberColumn={true}
            />
          </div>
        </div>

        {totales.saldo <= 0 && (
          <div className="text-center text-green-700 font-bold text-sm bg-green-50 p-2 rounded border border-green-200">
            COMPRA TOTALMENTE CANCELADA
          </div>
        )}
      </div>
    </ModalForm>
  )
}
