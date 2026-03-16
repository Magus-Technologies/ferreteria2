'use client'

import { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { App, Input, Tag, Form, FormInstance, Spin } from 'antd'
import { FaTicketAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { getValesAplicables, verificarCodigoVale } from '~/lib/api/vales-compra'
import type { ValeCompra, ValeCompraVerificado } from '~/lib/api/vales-compra'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'
import LabelBase from '~/components/form/label-base'

/**
 * Componente que:
 * 1. Detecta automáticamente vales aplicables por productos en carrito (notificaciones)
 * 2. Permite canjear un vale generado escaneando código de barras/QR o escribiendo el código
 */
export default function InputCodigoVale({ form }: { form: FormInstance }) {
  const { notification } = App.useApp()

  // --- Estado del canje ---
  const [codigoInput, setCodigoInput] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [valeVerificado, setValeVerificado] = useState<ValeCompraVerificado | null>(null)
  const [errorVerificacion, setErrorVerificacion] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Detección automática ---
  const valesNotificados = useRef<Set<number>>(new Set())
  const productosVenta = useStoreProductoAgregadoVenta(store => store.productos)

  const productoIds = useMemo(() => {
    return productosVenta
      .map(p => p.producto_id)
      .filter((id): id is number => !!id)
  }, [productosVenta])

  const cantidadTotal = useMemo(() => {
    return productosVenta.reduce((sum, p) => {
      const cantidad = Number(p.cantidad ?? 0)
      const factor = Number(p.unidad_derivada_factor ?? 1)
      return sum + (cantidad * factor)
    }, 0)
  }, [productosVenta])

  const getBeneficio = useCallback((vale: ValeCompra) => {
    if (vale.descuento_tipo === 'PORCENTAJE' && vale.descuento_valor) {
      return `${vale.descuento_valor}% DSCTO`
    }
    if (vale.descuento_tipo === 'MONTO_FIJO' && vale.descuento_valor) {
      return `S/ ${Number(vale.descuento_valor).toFixed(2)} DSCTO`
    }
    if (vale.tipo_promocion === 'PRODUCTO_GRATIS') return 'PRODUCTO GRATIS'
    if (vale.tipo_promocion === 'DOS_POR_UNO') return '2x1'
    return vale.tipo_promocion
  }, [])

  // Consultar vales aplicables automáticos
  const consultarVales = useCallback(async () => {
    if (productoIds.length === 0 || cantidadTotal <= 0) return
    try {
      const res = await getValesAplicables({
        cantidad_total: cantidadTotal,
        producto_ids: productoIds,
      })
      if (res.data?.data) {
        const valesUnicos = res.data.data.filter(
          (vale, idx, arr) => arr.findIndex(v => v.id === vale.id) === idx
        )
        for (const vale of valesUnicos) {
          if (!valesNotificados.current.has(vale.id)) {
            valesNotificados.current.add(vale.id)
            notification.success({
              message: 'Promocion disponible',
              description: `${vale.nombre} (${getBeneficio(vale)}) — Se aplicara automaticamente al crear la venta`,
              duration: 6,
              placement: 'bottomRight',
            })
          }
        }
      }
    } catch {
      // Silencioso
    }
  }, [productoIds, cantidadTotal, getBeneficio, notification])

  useEffect(() => {
    const timer = setTimeout(consultarVales, 500)
    return () => clearTimeout(timer)
  }, [consultarVales])

  useEffect(() => {
    if (productosVenta.length === 0) {
      valesNotificados.current.clear()
    }
  }, [productosVenta.length])

  // --- Verificar código de vale (con debounce para pistola/scanner) ---
  const verificarCodigo = useCallback(async (codigo: string) => {
    const codigoLimpio = codigo.trim()
    if (!codigoLimpio) {
      setValeVerificado(null)
      setErrorVerificacion(null)
      form.setFieldValue('codigo_vale', undefined)
      return
    }

    setVerificando(true)
    setErrorVerificacion(null)
    setValeVerificado(null)

    try {
      const res = await verificarCodigoVale(codigoLimpio)
      if (res.data?.valido && res.data.data) {
        setValeVerificado(res.data.data)
        setErrorVerificacion(null)
        form.setFieldValue('codigo_vale', codigoLimpio)
      } else {
        setValeVerificado(null)
        setErrorVerificacion(res.data?.message || 'Codigo no valido')
        form.setFieldValue('codigo_vale', undefined)
      }
    } catch {
      setErrorVerificacion('Error al verificar codigo')
      form.setFieldValue('codigo_vale', undefined)
    } finally {
      setVerificando(false)
    }
  }, [form])

  // Cuando cambia el input, verificar con debounce (300ms para que la pistola termine de escribir)
  const handleInputChange = useCallback((value: string) => {
    setCodigoInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setValeVerificado(null)
      setErrorVerificacion(null)
      form.setFieldValue('codigo_vale', undefined)
      return
    }

    debounceRef.current = setTimeout(() => {
      verificarCodigo(value)
    }, 400)
  }, [verificarCodigo, form])

  // Limpiar vale
  const handleLimpiar = useCallback(() => {
    setCodigoInput('')
    setValeVerificado(null)
    setErrorVerificacion(null)
    form.setFieldValue('codigo_vale', undefined)
  }, [form])

  // Beneficio del vale verificado
  const beneficioVerificado = useMemo(() => {
    if (!valeVerificado) return ''
    const v = valeVerificado.vale_compra
    if (v.descuento_tipo === 'PORCENTAJE' && v.descuento_valor) {
      return `${v.descuento_valor}% DSCTO`
    }
    if (v.descuento_tipo === 'MONTO_FIJO' && v.descuento_valor) {
      return `S/ ${Number(v.descuento_valor).toFixed(2)} DSCTO`
    }
    if (v.tipo_promocion === 'PRODUCTO_GRATIS') return 'PRODUCTO GRATIS'
    if (v.tipo_promocion === 'DOS_POR_UNO') return '2x1'
    return v.tipo_promocion
  }, [valeVerificado])

  return (
    <LabelBase
      label="Canjear Vale:"
      classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }}
      className="w-full sm:w-auto"
    >
      {/* Campo oculto para el form */}
      <Form.Item name="codigo_vale" hidden>
        <input type="hidden" />
      </Form.Item>

      <div className="flex flex-col gap-1">
        <Input
          placeholder="Escanea o escribe el codigo del vale"
          prefix={<FaTicketAlt className="text-orange-500" />}
          suffix={
            verificando ? (
              <Spin size="small" />
            ) : valeVerificado ? (
              <FaCheckCircle className="text-green-500 cursor-pointer" onClick={handleLimpiar} />
            ) : errorVerificacion ? (
              <FaTimesCircle className="text-red-400 cursor-pointer" onClick={handleLimpiar} />
            ) : null
          }
          value={codigoInput}
          onChange={e => handleInputChange(e.target.value)}
          onPressEnter={() => verificarCodigo(codigoInput)}
          className="!w-full sm:!w-[280px]"
          status={errorVerificacion ? 'error' : valeVerificado ? '' : undefined}
          allowClear
          onClear={handleLimpiar}
        />

        {/* Resultado de verificacion */}
        {valeVerificado && (
          <Tag color="green" className="w-fit !text-xs !mt-1">
            {valeVerificado.vale_compra.nombre} — {beneficioVerificado}
          </Tag>
        )}
        {errorVerificacion && (
          <span className="text-red-500 text-[11px] mt-0.5">{errorVerificacion}</span>
        )}
      </div>
    </LabelBase>
  )
}
