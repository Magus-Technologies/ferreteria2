/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react'
import { FaBoxes, FaPlusCircle } from 'react-icons/fa'
import { FaWeightHanging } from 'react-icons/fa6'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectBase, { RefSelectBaseProps } from '~/app/_components/form/selects/select-base'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import ButtonBase from '~/components/buttons/button-base'
import LabelBase from '~/components/form/label-base'
import { useStoreAlmacen } from '~/store/store-almacen'
import { App } from 'antd'
import type { ProductoPaquete } from './table-productos-paquete'

export default function CardAgregarProductoPaquete({
  setOpen,
  onAgregar,
}: {
  setOpen: (open: boolean) => void
  onAgregar: (producto: ProductoPaquete) => void
}) {
  const [cantidad, setCantidad] = useState<number | null>(1)
  const [unidad_derivada_id, setUnidadDerivadaId] = useState<number | null>(null)

  const { notification } = App.useApp()

  const productoSeleccionado = useStoreProductoSeleccionadoSearch((store) => store.producto)
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)

  const producto_en_almacen = productoSeleccionado?.producto_en_almacenes?.find(
    (item) => item.almacen_id === almacen_id
  )
  const unidades_derivadas = producto_en_almacen?.unidades_derivadas

  function handleOk(closeModal?: boolean) {
    if (!cantidad || !unidad_derivada_id) {
      return notification.error({
        message: 'Complete cantidad y unidad derivada',
      })
    }

    if (!productoSeleccionado) return

    const unidad_derivada = unidades_derivadas?.find(
      (item) => item.unidad_derivada.id === unidad_derivada_id
    )

    if (!unidad_derivada) return

    const nuevoProducto: ProductoPaquete = {
      key: `${productoSeleccionado.id}-${unidad_derivada_id}-${Date.now()}`,
      producto_id: productoSeleccionado.id,
      producto_name: productoSeleccionado.name,
      producto_codigo: productoSeleccionado.cod_producto,
      marca_name: productoSeleccionado.marca?.name,
      unidad_derivada_id: unidad_derivada_id,
      unidad_derivada_name: unidad_derivada.unidad_derivada.name,
      cantidad: cantidad,
      precio_publico: Number(unidad_derivada.precio_publico) || 0,
      precio_especial: Number(unidad_derivada.precio_especial) || 0,
      precio_minimo: Number(unidad_derivada.precio_minimo) || 0,
      precio_ultimo: Number(unidad_derivada.precio_ultimo) || 0,
      tipo_precio_vista: 'publico',
      costo: producto_en_almacen?.costo ? Number(producto_en_almacen.costo) : undefined,
      unidades_derivadas_disponibles: unidades_derivadas,
    }

    onAgregar(nuevoProducto)

    // Limpiar formulario
    setCantidad(1)

    if (closeModal) setOpen(false)
  }

  const cantidadRef = useRef<HTMLInputElement>(null)
  const unidad_derivadaRef = useRef<RefSelectBaseProps>(null)
  const buttom_masRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cantidadRef.current?.focus()
  }, [productoSeleccionado])

  useEffect(() => {
    const primeraUnidad = unidades_derivadas?.[0]?.unidad_derivada?.id
    if (primeraUnidad) {
      unidad_derivadaRef.current?.changeValue(primeraUnidad)
      setUnidadDerivadaId(primeraUnidad)
    }
  }, [unidades_derivadas])

  const unidad_derivada_seleccionada = unidades_derivadas?.find(
    (item) => item.unidad_derivada.id === unidad_derivada_id
  )

  return (
    <div className="flex flex-col gap-2">
      <LabelBase label="Cantidad:" orientation="column">
        <InputNumberBase
          ref={cantidadRef}
          placeholder="Cantidad"
          precision={2}
          prefix={<FaBoxes size={15} className="text-rose-700 mx-1" />}
          onChange={(value) => setCantidad(value as number)}
          value={cantidad}
          min={0}
          nextInEnter={false}
          onKeyUp={(e) => {
            if (e.key === 'Enter') buttom_masRef.current?.focus()
          }}
        />
        {/* Validación de stock */}
        {cantidad && unidad_derivada_seleccionada && producto_en_almacen && (() => {
          const cantidadEnFraccion = Number(cantidad) * Number(unidad_derivada_seleccionada.factor)
          const stockDisponible = Number(producto_en_almacen.stock_fraccion)
          const stockEnUnidad = stockDisponible / Number(unidad_derivada_seleccionada.factor)

          if (cantidadEnFraccion > stockDisponible) {
            return (
              <div className="text-red-600 text-sm mt-1 font-medium">
                Stock insuficiente. Disponible: {stockEnUnidad.toFixed(2)}{' '}
                {unidad_derivada_seleccionada.unidad_derivada.name}
              </div>
            )
          }
          return null
        })()}
      </LabelBase>
      <LabelBase label="Unidad Derivada:" orientation="column">
        <SelectBase
          ref={unidad_derivadaRef}
          placeholder="Unidad Derivada"
          prefix={<FaWeightHanging size={15} className="text-rose-700 mx-1" />}
          onChange={(value) => {
            setUnidadDerivadaId(value as number)
          }}
          className="w-full"
          value={unidad_derivada_id}
          options={
            unidades_derivadas?.map((item) => ({
              value: item.unidad_derivada.id,
              label: item.unidad_derivada.name,
            })) || []
          }
        />
      </LabelBase>

      {/* Mostrar precios de la unidad seleccionada */}
      {unidad_derivada_seleccionada && (
        <div className="bg-blue-50 p-2 rounded-lg text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">P. Público:</span>
            <span className="font-semibold">S/. {Number(unidad_derivada_seleccionada.precio_publico || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">P. Especial:</span>
            <span className="font-semibold">S/. {Number(unidad_derivada_seleccionada.precio_especial || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">P. Mínimo:</span>
            <span className="font-semibold">S/. {Number(unidad_derivada_seleccionada.precio_minimo || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">P. Último:</span>
            <span className="font-semibold">S/. {Number(unidad_derivada_seleccionada.precio_ultimo || 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-4">
        <ButtonBase
          ref={buttom_masRef}
          color="success"
          className="flex items-center justify-center gap-3 !rounded-md w-full h-full text-balance px-4! hover:!scale-100"
          onClick={() => handleOk(false)}
        >
          <FaPlusCircle className="min-w-fit" size={12} /> Más
        </ButtonBase>
        <ButtonBase
          color="warning"
          className="flex items-center justify-center gap-3 !rounded-md w-full h-full text-nowrap px-4! hover:!scale-100"
          onClick={() => handleOk(true)}
        >
          <FaPlusCircle className="min-w-fit" size={12} /> Más y Salir
        </ButtonBase>
      </div>
    </div>
  )
}
