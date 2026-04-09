import { useState, useEffect } from "react"
import { productosApiV2 } from "~/lib/api/producto"
import { proveedorApi } from "~/lib/api/proveedor"
import { tipoServicioApi, type TipoServicio } from "~/lib/api/tipo-servicio"
import { catalogosGeneralesApi } from "~/lib/api/catalogos-generales"

export interface ProductoDisponible {
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

export function useRequerimientoData(open: boolean) {
    const [fetchedProductos, setFetchedProductos] = useState<ProductoDisponible[]>([])
    const [fetchedProveedores, setFetchedProveedores] = useState<{ label: string; value: number }[]>([])
    const [tiposServicio, setTiposServicio] = useState<{ label: string; value: number }[]>([])
    const [cargos, setCargos] = useState<{ label: string; value: string }[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && fetchedProductos.length === 0) {
            loadInitialData()
        }
    }, [open, fetchedProductos.length])

    const loadInitialData = async () => {
        setLoading(true)
        try {
            // Cargar productos
            const resProd = await productosApiV2.getAllByAlmacen({ almacen_id: 1, per_page: 500 })
            if (resProd.data?.data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mapped = resProd.data.data.map((p: any) => ({
                    id: p.id,
                    cod_producto: p.cod_producto,
                    codigo: p.cod_producto,
                    name: p.name,
                    nombre: p.name,
                    stock_fraccion: p.producto_en_almacenes?.[0]?.stock_fraccion || 0,
                    stock: p.producto_en_almacenes?.[0]?.stock_fraccion || 0,
                    unidad_medida: p.unidad_medida,
                    unidad: p.unidad_medida?.name || 'UND',
                    marca: p.marca
                }))
                setFetchedProductos(mapped)
            }

            // Cargar proveedores
            const resProv = await proveedorApi.getAll({ per_page: 100 })
            if (resProv.data?.data) {
                setFetchedProveedores(resProv.data.data.map(p => ({ label: p.razon_social, value: p.id })))
            }

            // Cargar tipos de servicio
            const resTipos = await tipoServicioApi.getAll()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tiposData: TipoServicio[] = (resTipos as any).data?.data ?? resTipos.data ?? []
            if (Array.isArray(tiposData)) {
                setTiposServicio(tiposData.map(t => ({ label: t.nombre, value: t.id })))
            }

            // Cargar cargos
            const resCargos = await catalogosGeneralesApi.getCargos()
            if (resCargos.data?.data) {
                setCargos(resCargos.data.data.map(c => ({ label: c.descripcion, value: c.descripcion })))
            }
        } catch (error) {
            console.error("Error al cargar datos iniciales del modal:", error)
        } finally {
            setLoading(false)
        }
    }

    const addTipoServicio = (nuevoTipo: { nombre: string; id: number }) => {
        setTiposServicio(prev => [...prev, { label: nuevoTipo.nombre, value: nuevoTipo.id }])
    }

    return {
        fetchedProductos,
        fetchedProveedores,
        tiposServicio,
        cargos,
        loading,
        addTipoServicio,
    }
}
