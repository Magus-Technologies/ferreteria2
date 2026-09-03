'use client'

import { TipoMoneda, EstadoDeVenta } from '~/lib/api/venta'
import { Form, FormInstance, Modal, Select, message } from 'antd'
import { useEffect, useMemo, useState, useRef } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { FaHashtag } from 'react-icons/fa6'
import InputBase from '~/app/_components/form/inputs/input-base'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { apiRequest } from '~/lib/api'
import { extractDesplieguePagoId } from '~/lib/utils/despliegue-pago-utils'

interface MetodoPago {
  id: string
  despliegue_de_pago_id: string
  despliegue_name: string
  monto: number
  referencia?: string
  recibe_efectivo?: number
  sobrecargo?: {
    tipo: string
    valor: number
    monto: number
  }
}

function roundMoney(value: number) {
  return Number(value.toFixed(2))
}

export default function ModalMetodosPagoVenta({
  open,
  onCancel,
  form: ventaForm,
  totalCobrado,
  tipo_moneda,
  tipo_documento,
  baseAmount,
  descuentoVale = 0,
  valesInfo = [],
  onSurchargeChange,
  onContinuar,
  modo = 'total',
  metodosPermitidos,
}: {
  open: boolean
  onCancel: () => void
  form: FormInstance
  totalCobrado: number
  tipo_moneda: TipoMoneda
  tipo_documento?: string
  baseAmount: number
  descuentoVale?: number
  valesInfo?: Array<{ nombre: string; tipo: string | null; valor: number }>
  onSurchargeChange: (surcharge: number) => void
  onContinuar?: () => void
  /**
   * 'total' (default): flujo normal, pide el total completo (crear venta o
   * primer cobro). 'diferencia'/'devolucion': al editar una venta ya
   * cobrada — `baseAmount` ya viene calculado como la diferencia a
   * cobrar/devolver, no el total de la venta. El pago se adjunta al MISMO
   * guardado de la edición (campo `diferencia_pago` del form) en vez de
   * llamar un endpoint aparte — así la edición y el cobro/devolución de la
   * diferencia son atómicos: si se cancela este modal, no se guarda nada.
   */
  /**
   * 'cambio_metodo': la venta ya está cobrada y solo se corrige CON QUÉ se cobró
   * (se puso efectivo y fue yape, por ejemplo). El monto no cambia: el backend
   * anula el pago anterior y registra el nuevo, moviendo el dinero de una caja a
   * la otra. Se comporta igual que 'diferencia' salvo por el título y el rótulo.
   */
  modo?: 'total' | 'diferencia' | 'devolucion' | 'cambio_metodo'
  /** En modo 'devolucion': solo se puede devolver por estos despliegue_de_pago_id (ya usados en la venta). */
  metodosPermitidos?: string[]
}) {
  const [modalForm] = Form.useForm()
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<any>(null)
  const [selectedDespliegueValue, setSelectedDespliegueValue] = useState<string | null>(null)
  // Solo almacena tipo y tasa; el monto se recalcula dinámicamente según lo que escribe el usuario
  const [sobrecargoCfg, setSobrecargoCfg] = useState<{ tipo: string; valor: number }>({ tipo: 'ninguno', valor: 0 })
  const wasOpenRef = useRef(false)

  // Notificar al padre SOLO con sobrecargos ya confirmados (no el pendiente en formulario)
  useEffect(() => {
    const totalSurcharge = metodosPago.reduce((sum, m) => sum + (m.sobrecargo?.monto || 0), 0)
    onSurchargeChange(totalSurcharge)
  }, [metodosPago, onSurchargeChange])

  // Cargar depliegues de pago
  const { data: desplieguesPago, isFetched } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'metodos-para-ventas'],
    queryFn: async () => {
      const result = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      return result.data?.data || []
    },
    enabled: open,
  })

  // Watch del campo "Monto Recibe" para recalcular sobrecargo dinámicamente
  const recibe_efectivo = Form.useWatch('recibe_efectivo', modalForm)

  // Total NETO a pagar = base (bruto) − descuento de promoción (vale).
  // baseAmount llega como subtotal bruto; descuentoVale se aplica acá para no confundir
  // al usuario en el card "Total a Cobrar" (que sigue mostrando baseAmount bruto).
  const baseNeto = useMemo(() => {
    const neto = Math.max(0, baseAmount - descuentoVale)
    // Redondeo a los 10 céntimos más cercanos (26.25→26.30, 26.24→26.20):
    // conviene para el manejo de efectivo, no hay moneditas más chicas.
    // Solo en modo 'total' (cobro inicial completo de una venta nueva) — en
    // 'diferencia'/'devolución' el backend valida el monto contra el total
    // exacto con tolerancia de apenas 0.01 (VentaController::procesoPostVenta
    // / cobrar-diferencia), así que ahí debe quedar sin redondear.
    return modo === 'total' ? Math.round(neto * 10) / 10 : roundMoney(neto)
  }, [baseAmount, descuentoVale, modo])

  // Saldo BASE: lo que queda por cubrir del baseNeto (sin sobrecargo).
  // Se calcula primero porque sobrecargoActual lo necesita para capear el principal.
  const saldoBase = useMemo(() => {
    const pagadoPrincipal = metodosPago.reduce((sum, m) => sum + m.monto, 0)
    return roundMoney(Math.max(0, baseNeto - pagadoPrincipal))
  }, [baseNeto, metodosPago])

  // Sobrecargo calculado dinámicamente.
  // "recibe_efectivo" representa el TOTAL que entrega el cliente (principal + sobrecargo).
  // Para porcentaje: si recibe cubre el saldo entero, sobrecargo = saldoBase * %. Si pago parcial,
  // sobrecargo = recibe * % / (100 + %) (resolviendo recibe = principal + principal*%).
  const sobrecargoActual = useMemo(() => {
    const recibe = Number(recibe_efectivo) || 0
    if (sobrecargoCfg.tipo === 'porcentaje' && sobrecargoCfg.valor > 0) {
      const pct = sobrecargoCfg.valor / 100
      const sobrecargoTopeBase = saldoBase * pct
      const totalTope = saldoBase + sobrecargoTopeBase
      const monto = recibe >= totalTope
        ? roundMoney(sobrecargoTopeBase)
        : roundMoney((recibe * pct) / (1 + pct))
      return { tipo: 'porcentaje', valor: sobrecargoCfg.valor, monto }
    }
    if (sobrecargoCfg.tipo === 'monto_fijo' && sobrecargoCfg.valor > 0) {
      return { tipo: 'monto_fijo', valor: sobrecargoCfg.valor, monto: sobrecargoCfg.valor }
    }
    return { tipo: 'ninguno', valor: 0, monto: 0 }
  }, [sobrecargoCfg, recibe_efectivo, saldoBase])

  // Calcular total pagado (suma de principal + sobrecargo de métodos confirmados)
  const totalPagado = useMemo(() => {
    return roundMoney(metodosPago.reduce((sum, metodo) => {
      return sum + metodo.monto + (metodo.sobrecargo?.monto || 0)
    }, 0))
  }, [metodosPago])

  // Sobrecargo total: métodos confirmados + sobrecargo dinámico del formulario actual
  const totalSobrecargo = useMemo(() => {
    const agregado = metodosPago.reduce((sum, m) => sum + (m.sobrecargo?.monto || 0), 0)
    return roundMoney(agregado + sobrecargoActual.monto)
  }, [metodosPago, sobrecargoActual])

  // Saldo PENDIENTE mostrado al usuario: incluye el sobrecargo total (confirmado + en formulario)
  // = (baseNeto + totalSobrecargo) - totalPagado
  const saldoPendiente = useMemo(() => {
    const totalDebido = baseNeto + totalSobrecargo
    return roundMoney(Math.max(0, totalDebido - totalPagado))
  }, [baseNeto, totalSobrecargo, totalPagado])

  // Calcular vuelto total de todos los métodos agregados
  const vueltoTotal = useMemo(() => {
    return metodosPago.reduce((sum, metodo) => {
      if (metodo.recibe_efectivo) {
        const montoTotalConSobrecargo = metodo.monto + (metodo.sobrecargo?.monto || 0)
        const vueltoMetodo = Math.max(0, metodo.recibe_efectivo - montoTotalConSobrecargo)
        return sum + vueltoMetodo
      }
      return sum
    }, 0)
  }, [metodosPago])

  // Filtrar despliegues por tipo de documento y, en modo devolución, solo
  // los métodos ya usados en la venta (no se puede devolver por uno distinto).
  const desplieguesFiltradosPorTipo = useMemo(() => {
    if (!desplieguesPago) return []
    let lista = desplieguesPago
    if (tipo_documento) {
      lista = lista.filter((d: any) => d.tipos_comprobante?.includes(tipo_documento))
    }
    if (modo === 'devolucion' && metodosPermitidos) {
      // d.value viene codificado como "subCajaId-despliegueId" — comparar
      // contra el ID real extraído, no el valor compuesto.
      lista = lista.filter((d: any) => metodosPermitidos.includes(String(extractDesplieguePagoId(d.value))))
    }
    return lista
  }, [desplieguesPago, tipo_documento, modo, metodosPermitidos])

  const despliegueName = metodoPagoSeleccionado?.label || ''

  const isEfectivo = useMemo(() => {
    if (!metodoPagoSeleccionado) return false
    const tipo = metodoPagoSeleccionado.tipo?.toUpperCase?.() || ''
    const label = metodoPagoSeleccionado.label?.toUpperCase?.() || ''
    const metodo = metodoPagoSeleccionado.metodo?.toUpperCase?.() || ''
    return (
      tipo === 'EFECTIVO' ||
      label.includes('EFECTIVO') ||
      label.includes('CCH') ||
      metodo.includes('EFECTIVO')
    )
  }, [metodoPagoSeleccionado])

  // El método de pago (banco/billetera) define si pide N° de Operación. Si no
  // lo requiere (ej. Yape sin validar operación), el campo Referencia queda opcional.
  const requiereNumeroOperacion = useMemo(() => {
    return Boolean(metodoPagoSeleccionado?.requiere_numero_serie)
  }, [metodoPagoSeleccionado])

  // Vuelto del formulario actual (antes de confirmar agregar) — usa saldoBase porque
  // el sobrecargo se suma aparte; recibe_efectivo cubre el principal.
  const vuelto = useMemo(() => {
    if (!isEfectivo) return 0
    return Math.max(0, (Number(recibe_efectivo) || 0) - (saldoBase + sobrecargoActual.monto))
  }, [isEfectivo, recibe_efectivo, saldoBase, sobrecargoActual.monto])

  // Resetear formulario SOLO al abrir el modal (transición false → true).
  // No reaccionar a cambios de totalCobrado ni baseAmount para evitar reseteos en cascada.
  // En modo diferencia/devolución, baseAmount YA es la diferencia a
  // cobrar/devolver (no el total de la venta) — precargar con eso, no con
  // totalCobrado (que sigue siendo el total completo de la venta).
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      modalForm.resetFields()
      setMetodosPago([])
      setMetodoPagoSeleccionado(null)
      setSelectedDespliegueValue(null)
      setSobrecargoCfg({ tipo: 'ninguno', valor: 0 })
      const montoInicial = modo === 'total' ? totalCobrado : baseAmount
      modalForm.setFieldValue('monto', roundMoney(montoInicial))
      modalForm.setFieldValue('recibe_efectivo', roundMoney(montoInicial))
    }
    wasOpenRef.current = open
  }, [open, modalForm, totalCobrado, modo, baseAmount])

  // Setear método por defecto SOLO si no hay selección activa.
  // Devolución con un único método permitido: preseleccionarlo directo (es
  // el mismo con el que se cobró, no tiene sentido pedir que lo elija).
  // Diferencia (cobrar de más sobre una venta ya cobrada): preseleccionar el
  // método CON EL QUE se cobró originalmente en vez de caer siempre en
  // Efectivo — antes, si la venta se había pagado por transferencia/tarjeta/
  // yape, el modal igual arrancaba en Efectivo y parecía que el sistema
  // "olvidó" cómo se cobró (el usuario sigue pudiendo cambiarlo, esto solo
  // cambia el default). Si hay más de un método original, se usa el primero
  // como sugerencia razonable.
  useEffect(() => {
    if (open && isFetched && desplieguesFiltradosPorTipo.length > 0) {
      const currentValue = selectedDespliegueValue
      if (!currentValue) {
        const unico = modo === 'devolucion' && desplieguesFiltradosPorTipo.length === 1
          ? desplieguesFiltradosPorTipo[0]
          : null
        const original = modo === 'diferencia' && metodosPermitidos?.length
          ? desplieguesFiltradosPorTipo.find((d: any) =>
              metodosPermitidos.includes(String(extractDesplieguePagoId(d.value)))
            )
          : null
        const efectivo = unico ?? original ?? desplieguesFiltradosPorTipo.find((d: any) =>
          d.tipo === 'efectivo' ||
          d.label?.toUpperCase().includes('EFECTIVO') ||
          d.label?.toUpperCase().includes('CCH')
        )
        if (efectivo) {
          setSelectedDespliegueValue(String(efectivo.value))
          setMetodoPagoSeleccionado(efectivo)
        }
      }
    }
  }, [open, isFetched, desplieguesFiltradosPorTipo, selectedDespliegueValue, modo, metodosPermitidos])

  // Helper para calcular el monto total a recibir (base + sobrecargo) según la config actual
  const calcularTotalARecibir = (base: number) => {
    if (sobrecargoCfg.tipo === 'porcentaje' && sobrecargoCfg.valor > 0) {
      return roundMoney(base * (1 + sobrecargoCfg.valor / 100))
    }
    if (sobrecargoCfg.tipo === 'monto_fijo' && sobrecargoCfg.valor > 0) {
      return roundMoney(base + sobrecargoCfg.valor)
    }
    return roundMoney(base)
  }

  // Actualizar "Monto Recibe" cuando cambia el saldo base (después de confirmar un método).
  // "Monto Recibe" representa el TOTAL que entrega el cliente, así que incluye el sobrecargo.
  useEffect(() => {
    if (!open || saldoBase <= 0) return
    const totalRecibir = calcularTotalARecibir(saldoBase)
    modalForm.setFieldValue('monto', totalRecibir)
    const current = modalForm.getFieldValue('recibe_efectivo')
    if (current === undefined || current === null || Number(current) === 0) {
      modalForm.setFieldValue('recibe_efectivo', totalRecibir)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saldoBase, open, modalForm, sobrecargoCfg.tipo, sobrecargoCfg.valor])

  const handleAgregarMetodo = async () => {
    try {
      await modalForm.validateFields(
        requiereNumeroOperacion ? ['referencia', 'recibe_efectivo'] : ['recibe_efectivo']
      )
      const values = modalForm.getFieldsValue()

      if (!selectedDespliegueValue || !metodoPagoSeleccionado) {
        message.error('Selecciona un método de pago')
        return
      }

      const montoRecibido = roundMoney(Number(values.recibe_efectivo) || 0)
      // "Monto Recibe" = total entregado por el cliente (principal + sobrecargo).
      // El principal real que cubre el baseAmount = recibe − sobrecargo, tope: saldoBase.
      const principalCalculado = montoRecibido - sobrecargoActual.monto
      const montoFinal = roundMoney(Math.min(principalCalculado, saldoBase))

      if (montoFinal <= 0) {
        message.error('El monto debe ser mayor a 0')
        return
      }

      // Usar el sobrecargo calculado dinámicamente en el momento de confirmar
      const sobrecargoSnapshot = sobrecargoActual.monto > 0 ? { ...sobrecargoActual } : undefined

      const nuevoMetodo: MetodoPago = {
        id: Date.now().toString(),
        despliegue_de_pago_id: selectedDespliegueValue,
        despliegue_name: despliegueName,
        monto: montoFinal,
        referencia: values.referencia || undefined,
        recibe_efectivo: values.recibe_efectivo || undefined,
        sobrecargo: sobrecargoSnapshot,
      }

      setMetodosPago((prev) => [...prev, nuevoMetodo])
      modalForm.resetFields()
      setMetodoPagoSeleccionado(null)
      setSelectedDespliegueValue(null)
      setSobrecargoCfg({ tipo: 'ninguno', valor: 0 })
      message.success('Método de pago agregado')
    } catch (error: any) {
      console.error('Error al validar formulario:', error)
      if (error.errorFields && error.errorFields.length > 0) {
        const firstError = error.errorFields[0]
        message.error(firstError.errors[0])
      }
    }
  }

  const handleEliminarMetodo = (id: string) => {
    setMetodosPago(metodosPago.filter(m => m.id !== id))
    message.info('Método de pago eliminado')
  }

  const handleGuardar = async () => {
    if (metodosPago.length === 0) {
      message.error('Debes agregar al menos un método de pago')
      return
    }

    if (saldoPendiente > 0) {
      message.error('El total pagado debe cubrir el total a cobrar')
      return
    }

    if (modo !== 'total') {
      // Cobro/devolución de diferencia: se adjunta al MISMO guardado de la
      // venta (campo `diferencia_pago`), no se llama ningún endpoint acá —
      // use-create-venta.ts lo manda junto con el resto de la edición en
      // una sola petición atómica.
      const metodosDiferencia = metodosPago.map(m => ({
        despliegue_de_pago_id: m.despliegue_de_pago_id,
        monto: m.monto,
        referencia: m.referencia || undefined,
        recibe_efectivo: m.recibe_efectivo || undefined,
      }))

      ventaForm.setFieldValue('diferencia_pago', { tipo: modo, despliegue_de_pago_ventas: metodosDiferencia })
      ventaForm.setFieldValue('metodos_de_pago', undefined)

      onCancel()
      modalForm.resetFields()
      setMetodosPago([])

      onContinuar?.()
      return
    }

    const metodos = metodosPago.map(m => ({
      despliegue_de_pago_id: m.despliegue_de_pago_id,
      monto: m.monto,
      numero_operacion: m.referencia || undefined,
      recibe_efectivo: m.recibe_efectivo || undefined,
      sobrecargo: m.sobrecargo && m.sobrecargo.monto > 0 ? m.sobrecargo : undefined,
    }))

    ventaForm.setFieldValue('metodos_de_pago', metodos)
    ventaForm.setFieldValue('estado_de_venta', EstadoDeVenta.CREADO)

    onCancel()
    modalForm.resetFields()
    setMetodosPago([])

    onContinuar?.()
  }

  const handleCancelar = () => {
    modalForm.resetFields()
    setMetodosPago([])
    setMetodoPagoSeleccionado(null)
    setSelectedDespliegueValue(null)
    setSobrecargoCfg({ tipo: 'ninguno', valor: 0 })
    onCancel()
  }

  const monedaSymbol = tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'

  const tituloModal = modo === 'diferencia'
    ? 'Cobrar Diferencia'
    : modo === 'devolucion'
      ? 'Devolver Diferencia'
      : modo === 'cambio_metodo'
        ? 'Cambiar Método de Pago'
        : 'Cobrar - Métodos de Pago'

  const labelTotalCard = modo === 'diferencia'
    ? 'Diferencia a Cobrar'
    : modo === 'devolucion'
      ? 'Monto a Devolver'
      : modo === 'cambio_metodo'
        ? 'Monto a Recobrar'
        : 'Total a Cobrar'

  // Suppress unused warning — vuelto is used only if we add a vuelto display below the form
  void vuelto
  void totalCobrado

  return (
    <Modal
      title={tituloModal}
      open={open}
      onCancel={handleCancelar}
      width={1000}
      footer={null}
      centered
      destroyOnHidden
    >
      <div className='mt-4'>
        {modo !== 'total' && (
          <div className='mb-4 p-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-sm text-slate-700'>
            {modo === 'diferencia'
              ? 'Esta venta ya tenía un cobro registrado. Solo se cobra la diferencia — no el total de la venta. Los cambios se guardan recién al confirmar; si cancelas, no se guarda nada.'
              : 'Esta venta ya tenía un cobro registrado. El nuevo total es menor: se devuelve la diferencia por el mismo método con el que se cobró. Los cambios se guardan recién al confirmar; si cancelas, no se guarda nada.'}
          </div>
        )}

        {/* Aviso de promoción aplicada */}
        {descuentoVale > 0 && valesInfo.length > 0 && (
          <div className='mb-4 p-3 bg-fuchsia-50 border-2 border-fuchsia-300 rounded-lg'>
            <div className='text-xs font-bold text-fuchsia-700 uppercase mb-1'>
              Promoción aplicada
            </div>
            {valesInfo.map((v, i) => (
              <div key={i} className='text-sm text-slate-700 flex items-center justify-between'>
                <span>{v.nombre}</span>
                <span className='font-bold text-fuchsia-700'>
                  {v.tipo === 'PORCENTAJE' ? `-${v.valor}%` : `-${monedaSymbol} ${v.valor.toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Cards resumen */}
        <div className={`grid ${descuentoVale > 0 ? 'grid-cols-5' : 'grid-cols-4'} gap-4 mb-6`}>
          <div className='p-4 bg-blue-50 rounded-lg border-2 border-blue-300'>
            <div className='text-sm font-medium text-slate-600'>{labelTotalCard}</div>
            <div className='text-2xl font-bold text-blue-600'>
              {monedaSymbol} {baseAmount.toFixed(2)}
            </div>
          </div>
          {descuentoVale > 0 && (
            <div className='p-4 bg-fuchsia-50 rounded-lg border-2 border-fuchsia-300'>
              <div className='text-sm font-medium text-slate-600'>Descuento Promoción</div>
              <div className='text-2xl font-bold text-fuchsia-600'>
                -{monedaSymbol} {descuentoVale.toFixed(2)}
              </div>
            </div>
          )}
          <div className={`p-4 rounded-lg border-2 ${totalSobrecargo > 0 ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-200'}`}>
            <div className='text-sm font-medium text-slate-600'>Sobrecargo</div>
            <div className={`text-2xl font-bold ${totalSobrecargo > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {monedaSymbol} {totalSobrecargo.toFixed(2)}
            </div>
          </div>
          <div className={`p-4 rounded-lg border-2 ${saldoPendiente > 0 ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-300'}`}>
            <div className='text-sm font-medium text-slate-600'>Saldo Pendiente</div>
            <div className={`text-2xl font-bold ${saldoPendiente > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {monedaSymbol} {saldoPendiente.toFixed(2)}
            </div>
          </div>
          <div className='p-4 bg-green-50 rounded-lg border-2 border-green-300'>
            <div className='text-sm font-medium text-slate-600'>Total Pagado</div>
            <div className='text-2xl font-bold text-green-600'>
              {monedaSymbol} {totalPagado.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Tabla de métodos agregados */}
        {metodosPago.length > 0 && (
          <div className='mb-6'>
            <div className='text-sm font-semibold text-slate-700 mb-2'>Métodos de Pago Agregados</div>
            <div className='border rounded-lg overflow-hidden'>
              <table className='w-full'>
                <thead className='bg-slate-100'>
                  <tr>
                    <th className='px-4 py-2 text-left text-sm font-semibold text-slate-700'>#</th>
                    <th className='px-4 py-2 text-left text-sm font-semibold text-slate-700'>Tipo de Pago</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Subtotal</th>
                    <th className='px-4 py-2 text-left text-sm font-semibold text-slate-700'>Referencia</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Sobrecargo</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Total Cobrado</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Recibe</th>
                    <th className='px-4 py-2 text-right text-sm font-semibold text-slate-700'>Vuelto</th>
                    <th className='px-4 py-2 text-center text-sm font-semibold text-slate-700'>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {metodosPago.map((metodo, index) => {
                    const montoTotalCobrado = metodo.monto + (metodo.sobrecargo?.monto || 0)
                    const vueltoMetodo = metodo.recibe_efectivo
                      ? Math.max(0, metodo.recibe_efectivo - montoTotalCobrado)
                      : 0
                    return (
                      <tr key={metodo.id} className='border-t hover:bg-slate-50'>
                        <td className='px-4 py-3 text-sm text-slate-600'>{index + 1}</td>
                        <td className='px-4 py-3 text-sm font-medium text-slate-700'>{metodo.despliegue_name}</td>
                        <td className='px-4 py-3 text-sm text-right text-blue-600'>
                          {monedaSymbol} {metodo.monto.toFixed(2)}
                        </td>
                        <td className='px-4 py-3 text-sm text-slate-600'>{metodo.referencia || '-'}</td>
                        <td className='px-4 py-3 text-sm text-right'>
                          {metodo.sobrecargo && metodo.sobrecargo.monto > 0 ? (
                            <span className='px-2 py-1 bg-orange-50 border border-orange-300 rounded text-orange-700 font-semibold text-xs whitespace-nowrap'>
                              {metodo.sobrecargo.tipo === 'porcentaje'
                                ? `+${metodo.sobrecargo.valor}% = ${monedaSymbol} ${metodo.sobrecargo.monto.toFixed(2)}`
                                : `+${monedaSymbol} ${metodo.sobrecargo.monto.toFixed(2)}`}
                            </span>
                          ) : (
                            <span className='text-slate-400'>-</span>
                          )}
                        </td>
                        <td className='px-4 py-3 text-sm font-bold text-right text-green-700'>
                          {monedaSymbol} {montoTotalCobrado.toFixed(2)}
                        </td>
                        <td className='px-4 py-3 text-sm text-right text-slate-600'>
                          {metodo.recibe_efectivo ? `${monedaSymbol} ${metodo.recibe_efectivo.toFixed(2)}` : '-'}
                        </td>
                        <td className='px-4 py-3 text-sm font-semibold text-right text-green-600'>
                          {vueltoMetodo > 0 ? `${monedaSymbol} ${vueltoMetodo.toFixed(2)}` : '-'}
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <button
                            onClick={() => handleEliminarMetodo(metodo.id)}
                            className='text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors'
                          >
                            <FaTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formulario para agregar método — visible mientras quede base por cubrir */}
        {saldoBase > 0 && (
          <Form form={modalForm} className='border-t pt-4'>
            <div className='text-sm font-semibold text-slate-700 mb-3'>Agregar Método de Pago</div>

            <div className='flex items-start gap-3'>
              {/* Tipo de Pago */}
              <div className='flex-1 min-w-[200px]'>
                <label className='block text-xs font-medium text-slate-600 mb-1'>Tipo de Pago</label>
                <Select
                  className='w-full'
                  value={selectedDespliegueValue ?? undefined}
                  placeholder='Método de Pago'
                  disabled={modo === 'devolucion' && desplieguesFiltradosPorTipo.length <= 1}
                  showSearch
                  optionFilterProp='label'
                  options={desplieguesFiltradosPorTipo.map((item: any) => ({
                    value: String(item.value),
                    label: item.label,
                  }))}
                  filterOption={(input, option) =>
                    String(option?.label || '').toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    const valueAsString = String(value)
                    setSelectedDespliegueValue(valueAsString)

                    const despliegueData = desplieguesFiltradosPorTipo.find((d: any) => String(d.value) === valueAsString)
                    setMetodoPagoSeleccionado(despliegueData || null)

                    // Guardar solo la configuración; el monto se calccula dinámicamente
                    if (despliegueData?.tipo_sobrecargo === 'porcentaje' && Number(despliegueData.sobrecargo_porcentaje) > 0) {
                      setSobrecargoCfg({ tipo: 'porcentaje', valor: Number(despliegueData.sobrecargo_porcentaje) })
                    } else if (despliegueData?.tipo_sobrecargo === 'monto_fijo' && Number(despliegueData.adicional) > 0) {
                      setSobrecargoCfg({ tipo: 'monto_fijo', valor: Number(despliegueData.adicional) })
                    } else {
                      setSobrecargoCfg({ tipo: 'ninguno', valor: 0 })
                    }

                    if (despliegueData && (
                      despliegueData.tipo?.toUpperCase?.() === 'EFECTIVO' ||
                      despliegueData.label?.toUpperCase?.().includes('EFECTIVO') ||
                      despliegueData.label?.toUpperCase?.().includes('CCH')
                    )) {
                      modalForm.setFieldValue('referencia', undefined)
                    }

                    // Pre-llenar con el total a recibir (base + sobrecargo de este método)
                    let totalInicial = saldoBase
                    if (despliegueData?.tipo_sobrecargo === 'porcentaje' && Number(despliegueData.sobrecargo_porcentaje) > 0) {
                      totalInicial = saldoBase * (1 + Number(despliegueData.sobrecargo_porcentaje) / 100)
                    } else if (despliegueData?.tipo_sobrecargo === 'monto_fijo' && Number(despliegueData.adicional) > 0) {
                      totalInicial = saldoBase + Number(despliegueData.adicional)
                    }
                    modalForm.setFieldValue('recibe_efectivo', roundMoney(totalInicial))
                  }}
                />
                {!selectedDespliegueValue && (
                  <div className='mt-1 text-xs text-red-500'>Requerido</div>
                )}
              </div>

              {/* Referencia (solo si NO es efectivo) */}
              {!isEfectivo && (
                <div className='flex-1 min-w-[180px]'>
                  <label className='block text-xs font-medium text-slate-600 mb-1'>Referencia</label>
                  <InputBase
                    prefix={<FaHashtag className='text-cyan-600 mx-1' size={12} />}
                    placeholder='N° Transacción'
                    uppercase={false}
                    propsForm={{
                      name: 'referencia',
                      rules: requiereNumeroOperacion
                        ? [{ required: true, message: 'Requerido' }]
                        : [],
                    }}
                  />
                </div>
              )}

              {/* Monto Recibe */}
              <div className='w-[180px]'>
                <div className='flex items-center gap-2 mb-1'>
                  <label className='block text-xs font-medium text-slate-600'>Monto Recibe</label>
                  {sobrecargoActual.monto > 0 && (
                    <span className='px-1.5 py-0.5 bg-orange-50 border border-orange-300 rounded text-xs text-orange-700 font-semibold whitespace-nowrap'>
                      {sobrecargoActual.tipo === 'porcentaje'
                        ? `+${sobrecargoActual.valor}% = ${monedaSymbol} ${sobrecargoActual.monto.toFixed(2)}`
                        : `+${monedaSymbol} ${sobrecargoActual.monto.toFixed(2)}`}
                    </span>
                  )}
                </div>
                <InputNumberBase
                  prefix={<span className='text-rose-700 font-bold text-xs'>{monedaSymbol}</span>}
                  placeholder='0.00'
                  min={0}
                  max={!isEfectivo ? calcularTotalARecibir(saldoBase) : undefined}
                  precision={2}
                  propsForm={{
                    name: 'recibe_efectivo',
                    className: 'w-full',
                    rules: [
                      { required: true, message: 'Requerido' },
                      {
                        validator: (_, value) => {
                          if (!value || value <= 0) {
                            return Promise.reject('Debe ser > 0')
                          }
                          const maxPermitido = calcularTotalARecibir(saldoBase)
                          if (!isEfectivo && value > maxPermitido) {
                            return Promise.reject(`Máx: ${maxPermitido.toFixed(2)}`)
                          }
                          return Promise.resolve()
                        },
                      },
                    ],
                  }}
                />
              </div>

              {/* Botón Agregar */}
              <div className='w-[140px] pt-5'>
                <ButtonBase
                  onClick={handleAgregarMetodo}
                  color='info'
                  className='flex items-center justify-center gap-2 w-full h-8'
                >
                  <FaPlus size={12} />
                  Agregar
                </ButtonBase>
              </div>
            </div>
          </Form>
        )}

        {/* Botones finales */}
        <div className='flex gap-3 justify-between items-center mt-6 pt-4 border-t'>
          <ButtonBase onClick={handleCancelar} color='default' size='lg'>
            Cancelar
          </ButtonBase>

          <div className='flex items-center gap-2 px-4 py-2 bg-yellow-50 border-2 border-yellow-400 rounded-lg'>
            <span className='text-sm font-medium text-slate-700'>Vuelto Total:</span>
            <span className='text-xl font-bold text-green-600'>
              {monedaSymbol} {vueltoTotal.toFixed(2)}
            </span>
          </div>

          <ButtonBase
            onClick={handleGuardar}
            color='success'
            size='lg'
            disabled={metodosPago.length === 0 || saldoPendiente > 0}
            className='flex items-center gap-2'
          >
            <FaSave size={16} />
            {modo === 'diferencia' ? 'Guardar y Cobrar' : modo === 'devolucion' ? 'Guardar y Devolver' : 'Continuar'}
          </ButtonBase>
        </div>
      </div>
    </Modal>
  )
}
