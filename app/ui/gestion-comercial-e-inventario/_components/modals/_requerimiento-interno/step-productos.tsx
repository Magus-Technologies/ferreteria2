"use client"

import { useState, useRef } from "react"
import { Button, Alert } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { ColDef } from "ag-grid-community"
import ModalProductoSearch from "~/app/_components/modals/modal-producto-search"
import { TipoBusquedaProducto } from "~/app/_components/form/selects/select-tipo-busqueda-producto"
import type { Producto } from "~/app/_types/producto"
import TableWithTitle from "~/components/tables/table-with-title"
import ButtonCreateProductoPlus from "~/app/_components/form/buttons/button-create-producto-plus"

interface ItemBuscado {
    id: number | null
    codigo: string
    nombre: string
    nombre_adicional?: string
    cantidad: number
    unidad: string
    stock?: number
    marca?: string
}

interface ProductoDisponible {
    id: number
    codigo?: string
    cod_producto?: string
    nombre?: string
    name?: string
    stock_fraccion?: number
    unidad_medida?: { name: string }
    stock?: number
    unidad?: string
    marca?: { id: number; name: string }
}

interface StepProductosProps {
    form: any
    setField: (key: string, value: any) => void
    errors: Record<string, string>
    productosDisponibles: ProductoDisponible[]
    productosSeleccionados: ItemBuscado[]
    onAgregarProducto: (p: ItemBuscado) => void
    onQuitarProducto: (id: number | string) => void
    onCambiarCantidad: (id: number | string, cantidad: number) => void
    onCambiarUnidad: (id: number | string, unidad: string) => void
}

export default function StepProductos({
    errors,
    productosSeleccionados,
    onAgregarProducto,
    onQuitarProducto,
    onCambiarCantidad,
    onCambiarUnidad,
}: StepProductosProps) {
    const [openModalProducto, setOpenModalProducto] = useState(false)
    const [textDefault, setTextDefault] = useState("")
    const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusquedaProducto>(TipoBusquedaProducto.CODIGO_DESCRIPCION)
    const tableGridRef = useRef<any>(null)
    const [showManualForm, setShowManualForm] = useState(false)
    const [manualProducto, setManualProducto] = useState({
        nombre: "",
        unidad: "UND",
        cantidad: 1,
    })

    const handleProductoSeleccionado = ({ data }: { data: Producto | undefined }) => {
        if (!data) return
        
        const item: ItemBuscado = {
            id: data.id,
            codigo: data.cod_producto || "",
            nombre: data.name || "",
            cantidad: 1,
            unidad: data.unidad_medida?.name || "UND",
            stock: data.producto_en_almacenes?.[0]?.stock_fraccion || 0,
            marca: data.marca?.name || "",
        }
        onAgregarProducto(item)
        setOpenModalProducto(false)
    }

    const handleProductoCreado = (producto: Producto) => {
        const item: ItemBuscado = {
            id: producto.id,
            codigo: producto.cod_producto || "",
            nombre: producto.name || "",
            cantidad: 1,
            unidad: producto.unidad_medida?.name || "UND",
            stock: producto.producto_en_almacenes?.[0]?.stock_fraccion || 0,
            marca: producto.marca?.name || "",
        }
        onAgregarProducto(item)
    }

    const handleAgregarManual = () => {
        if (!manualProducto.nombre.trim()) {
            return
        }

        const item: ItemBuscado = {
            id: null,
            codigo: "N/A",
            nombre: manualProducto.nombre,
            cantidad: manualProducto.cantidad,
            unidad: manualProducto.unidad,
        }
        
        onAgregarProducto(item)
        
        // Reset form
        setManualProducto({
            nombre: "",
            unidad: "UND",
            cantidad: 1,
        })
        setShowManualForm(false)
    }

    const getUniqueId = (p: ItemBuscado, idx: number) => {
        return p.id || `manual-${idx}-${p.nombre}`
    }

    const columnDefs: ColDef<ItemBuscado>[] = [
        {
            headerName: "Código",
            field: "codigo",
            width: 120,
            cellStyle: (params) => ({
                fontWeight: "600",
                color: params.data?.id ? "#059669" : "#d97706",
            }),
            cellRenderer: (params: any) => {
                if (!params.data) return null
                return (
                    <div className="flex items-center gap-1">
                        <span>{params.data.codigo}</span>
                        {!params.data.id && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1 rounded">Manual</span>
                        )}
                    </div>
                )
            },
        },
        {
            headerName: "Descripción",
            field: "nombre",
            flex: 1,
            minWidth: 250,
        },
        {
            headerName: "Marca",
            field: "marca",
            width: 120,
        },
        {
            headerName: "Cantidad",
            field: "cantidad",
            width: 120,
            editable: true,
            cellEditor: "agNumberCellEditor",
            cellEditorParams: { min: 1 },
            onCellValueChanged: (params) => {
                if (params.node && params.data) {
                    const uniqueId = getUniqueId(params.data, params.node.rowIndex ?? 0)
                    onCambiarCantidad(uniqueId, params.newValue)
                }
            },
            cellStyle: { textAlign: "right", fontWeight: "bold" },
        },
        {
            headerName: "Unidad",
            field: "unidad",
            width: 100,
            editable: (params) => !params.data?.id,
            onCellValueChanged: (params) => {
                if (params.node && params.data) {
                    const uniqueId = getUniqueId(params.data, params.node.rowIndex ?? 0)
                    onCambiarUnidad(uniqueId, params.newValue)
                }
            },
            cellStyle: (params) => ({
                textAlign: "center",
                fontWeight: "600",
                backgroundColor: params.data?.id ? "" : "#fef3c7",
            }),
        },
        {
            headerName: "Acciones",
            width: 100,
            cellRenderer: (params: any) => {
                if (!params.node || !params.data) return null
                const uniqueId = getUniqueId(params.data, params.node.rowIndex ?? 0)
                return (
                    <Button
                        type="text"
                        danger
                        size="small"
                        onClick={() => onQuitarProducto(uniqueId)}
                    >
                        Eliminar
                    </Button>
                )
            },
        },
    ]

    return (
        <div className="space-y-4">
            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-2">
                <Button
                    icon={<PlusOutlined />}
                    onClick={() => setShowManualForm(!showManualForm)}
                >
                    Agregar Manual
                </Button>
                <ButtonCreateProductoPlus
                    onSuccess={handleProductoCreado}
                    textDefault={textDefault}
                    setTextDefault={setTextDefault}
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setOpenModalProducto(true)}
                >
                    Buscar Producto
                </Button>
            </div>

            {/* Formulario manual */}
            {showManualForm && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-blue-900">Agregar Producto Manual</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-6">
                            <input
                                type="text"
                                placeholder="Descripción del producto *"
                                value={manualProducto.nombre}
                                onChange={(e) => setManualProducto(prev => ({ ...prev, nombre: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="number"
                                placeholder="Cantidad"
                                min={1}
                                value={manualProducto.cantidad}
                                onChange={(e) => setManualProducto(prev => ({ ...prev, cantidad: Number(e.target.value) || 1 }))}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="col-span-3">
                            <input
                                type="text"
                                placeholder="Unidad (ej: UND, KG, M)"
                                value={manualProducto.unidad}
                                onChange={(e) => setManualProducto(prev => ({ ...prev, unidad: e.target.value.toUpperCase() }))}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="col-span-1 flex gap-1">
                            <Button
                                type="primary"
                                size="middle"
                                onClick={handleAgregarManual}
                                disabled={!manualProducto.nombre.trim()}
                                className="w-full"
                            >
                                ✓
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                        Use esta opción para productos que aún no están registrados en el sistema
                    </p>
                </div>
            )}

            {errors.productos && (
                <Alert
                    message={errors.productos}
                    type="error"
                    showIcon
                />
            )}

            {/* Tabla de productos */}
            <TableWithTitle<ItemBuscado>
                tableRef={tableGridRef}
                id="requerimiento-interno.table-productos"
                title="Materiales a Solicitar"
                columnDefs={columnDefs}
                rowData={productosSeleccionados}
                loading={false}
                rowSelection={false}
                pagination={false}
                domLayout="autoHeight"
                exportExcel={false}
                exportPdf={false}
                selectColumns={false}
            />

            {/* Modal de búsqueda de productos */}
            <ModalProductoSearch
                open={openModalProducto}
                setOpen={setOpenModalProducto}
                textDefault={textDefault}
                setTextDefault={setTextDefault}
                tipoBusqueda={tipoBusqueda}
                setTipoBusqueda={setTipoBusqueda}
                onRowDoubleClicked={handleProductoSeleccionado}
                showUltimasCompras={false}
            />
        </div>
    )
}
