'use client'

import SelectBase, { SelectBaseProps } from './select-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { FaMoneyCheckAlt } from 'react-icons/fa'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '~/lib/api'
import { Form } from 'antd'
import { useEffect } from 'react'

interface SelectDespliegueDePagoProps extends SelectBaseProps {
  classNameIcon?: string
  sizeIcon?: number
  /**
   * '01' = Factura, '03' = Boleta, 'nv' = Nota de Venta.
   * Si se pasa un array (pantallas que cobran/pagan varios documentos de una),
   * solo quedan los métodos que sirven para TODOS: es un único método aplicado
   * a todas las filas, así que tiene que ser válido en todas.
   */
  tipoComprobante?: string | string[]
  filterByTipo?: 'efectivo' | 'banco' | 'billetera' | string[] // Filtrar por tipo de método de pago (puede ser array)
  subCajaId?: number // Filtrar por sub-caja específica
}

export default function SelectDespliegueDePago({
  placeholder = 'Método de Pago',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 14,
  tipoComprobante,
  filterByTipo,
  subCajaId,
  ...props
}: SelectDespliegueDePagoProps) {
  const { data } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'metodos-para-ventas'],
    queryFn: async () => {
      const result = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      return result.data?.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Filtrar métodos por tipo de comprobante si se proporciona.
  // Cada sub-caja declara qué comprobantes maneja; si el método elegido cae en una
  // que no acepta el comprobante del documento, el backend rechaza el cobro/pago
  // (antes se lo tragaba en silencio y el dinero no entraba a ninguna caja). Por
  // eso conviene no ofrecerlo siquiera.
  const comprobantesRequeridos = tipoComprobante
    ? (Array.isArray(tipoComprobante) ? tipoComprobante : [tipoComprobante]).filter(Boolean)
    : []

  let metodosFiltrados = comprobantesRequeridos.length
    ? data?.filter((metodo: any) =>
        comprobantesRequeridos.every((tipo) => metodo.tipos_comprobante?.includes(tipo))
      )
    : data

  // Filtrar por sub-caja si se proporciona
  if (subCajaId && metodosFiltrados) {
    metodosFiltrados = metodosFiltrados.filter((metodo: any) => {
      return metodo.sub_caja_id === subCajaId
    })
  }

  // Filtrar por tipo de método de pago si se proporciona
  if (filterByTipo && metodosFiltrados) {
    metodosFiltrados = metodosFiltrados.filter((metodo: any) => {
      const tipo = metodo.tipo?.toLowerCase()
      
      // Si filterByTipo es un array, verificar si el tipo está en el array
      if (Array.isArray(filterByTipo)) {
        return filterByTipo.some(t => tipo === t.toLowerCase())
      }
      
      // Si es un string, comparar directamente
      return tipo === filterByTipo.toLowerCase()
    })
  }

  // Crear opciones con el formato: SubCaja/Banco/Método/Titular
  const options = metodosFiltrados?.map((metodo: any) => ({
    value: metodo.value,
    label: metodo.label,
  })) || []

  // Auto-corregir: si el valor del formulario es un ID plano (no compuesto),
  // buscar el valor compuesto correspondiente y actualizar el formulario
  const watchedValue = Form.useWatch(props.propsForm?.name)
  const fieldName = props.propsForm?.name

  let formInstance: ReturnType<typeof Form.useFormInstance> | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    formInstance = Form.useFormInstance()
  } catch { formInstance = null }

  useEffect(() => {
    if (!watchedValue || !metodosFiltrados?.length || !fieldName || !formInstance) return

    const isAlreadyComposite = metodosFiltrados.some((m: any) => m.value === watchedValue)
    if (isAlreadyComposite) return

    const found = metodosFiltrados.find((m: any) => m.despliegue_pago_id === watchedValue)
    if (found) {
      formInstance.setFieldValue(fieldName, found.value)
    }
  }, [watchedValue, metodosFiltrados, fieldName, formInstance])

  return (
    <SelectBase
      showSearch
      prefix={<FaMoneyCheckAlt className={classNameIcon} size={sizeIcon} />}
      variant={variant}
      placeholder={placeholder}
      options={options}
      {...props}
    />
  )
}
