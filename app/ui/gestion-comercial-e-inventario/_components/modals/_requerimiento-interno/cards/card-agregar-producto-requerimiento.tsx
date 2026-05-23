'use client'

import { useEffect, useRef, useState } from 'react'
import { App } from 'antd'
import { FaBoxes, FaPlusCircle } from 'react-icons/fa'
import { FaWeightHanging } from 'react-icons/fa6'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectBase, { RefSelectBaseProps } from '~/app/_components/form/selects/select-base'
import ButtonBase from '~/components/buttons/button-base'
import LabelBase from '~/components/form/label-base'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'

export interface ProductoRequerimientoAgregado {
    producto_id: number
    codigo: string
    nombre: string
    marca?: string
    cantidad: number
    unidad: string
    unidadesDerivadas?: { value: string; label: string }[]
    stock?: number
}

interface Props {
    setOpen: (open: boolean) => void
    onAgregar: (item: ProductoRequerimientoAgregado) => void
}

export default function CardAgregarProductoRequerimiento({ setOpen, onAgregar }: Props) {
    const { notification } = App.useApp()
    const producto = useStoreProductoSeleccionadoSearch(s => s.producto)

    const cantidadRef = useRef<HTMLInputElement>(null)
    const unidadRef = useRef<RefSelectBaseProps>(null)
    const masRef = useRef<HTMLButtonElement>(null)
    const lastProductoIdRef = useRef<number | undefined>(undefined)

    const [cantidad, setCantidad] = useState<number | undefined>(undefined)
    const [unidadId, setUnidadId] = useState<number | undefined>(undefined)

    const unidadesDerivadas = producto?.producto_en_almacenes?.[0]?.unidades_derivadas ?? []
    const opciones = unidadesDerivadas
        .map(ud => ({ value: ud.unidad_derivada.id, label: ud.unidad_derivada.name }))
        .filter((ud, idx, arr) => arr.findIndex(x => x.value === ud.value) === idx)

    const fallbackUnidad = producto?.unidad_medida?.name || 'UND'

    useEffect(() => {
        const primera = opciones[0]?.value
        if (primera) {
            unidadRef.current?.changeValue(primera)
            setUnidadId(primera)
        } else {
            setUnidadId(undefined)
        }
    }, [producto?.id])

    useEffect(() => {
        if (
            producto?.id &&
            producto.id !== lastProductoIdRef.current &&
            lastProductoIdRef.current !== undefined
        ) {
            setTimeout(() => cantidadRef.current?.focus(), 50)
        }
        lastProductoIdRef.current = producto?.id
    }, [producto])

    const handleOk = (closeModal: boolean) => {
        if (!producto) {
            return notification.error({ message: 'Seleccione un producto' })
        }
        if (!cantidad || cantidad <= 0) {
            return notification.error({ message: 'Ingrese una cantidad válida' })
        }

        const derivadaSeleccionada = opciones.find(o => o.value === unidadId)
        const unidadName = derivadaSeleccionada?.label || fallbackUnidad

        onAgregar({
            producto_id: producto.id,
            codigo: producto.cod_producto || '',
            nombre: producto.name || '',
            marca: producto.marca?.name,
            cantidad,
            unidad: unidadName,
            unidadesDerivadas: opciones.length > 0
                ? opciones.map(o => ({ value: o.label, label: o.label }))
                : undefined,
            stock: producto.producto_en_almacenes?.[0]?.stock_fraccion ?? 0,
        })

        setCantidad(undefined)
        if (closeModal) setOpen(false)
        else setTimeout(() => cantidadRef.current?.focus(), 50)
    }

    return (
        <div className="flex flex-col gap-2">
            <LabelBase label="Cantidad:" orientation="column">
                <InputNumberBase
                    ref={cantidadRef}
                    placeholder="Cantidad"
                    precision={3}
                    prefix={<FaBoxes size={15} className="text-emerald-700 mx-1" />}
                    onChange={value => setCantidad(value as number | undefined)}
                    value={cantidad}
                    min={0.001}
                    nextInEnter={false}
                    controls={false}
                    keyboard={false}
                    onKeyUp={e => {
                        if (e.key === 'Enter') masRef.current?.focus()
                    }}
                />
            </LabelBase>

            <LabelBase label="Unidad Derivada:" orientation="column">
                <SelectBase
                    ref={unidadRef}
                    placeholder={opciones.length === 0 ? fallbackUnidad : 'Unidad Derivada'}
                    prefix={<FaWeightHanging size={15} className="text-emerald-700 mx-1" />}
                    onChange={value => setUnidadId(value as number | undefined)}
                    className="w-full"
                    value={unidadId}
                    disabled={opciones.length === 0}
                    options={opciones}
                />
                {opciones.length === 0 && producto && (
                    <div className="text-xs text-amber-700 mt-1">
                        Este producto no tiene unidades derivadas; se usará "{fallbackUnidad}".
                    </div>
                )}
            </LabelBase>

            {producto && (
                <div className="flex items-center justify-between gap-4 my-2">
                    <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-500">Stock</div>
                        <div className="font-bold text-emerald-700 text-lg">
                            {producto.producto_en_almacenes?.[0]?.stock_fraccion ?? 0}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between gap-2">
                <ButtonBase
                    ref={masRef}
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
