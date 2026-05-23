"use client"

import { useState, useEffect } from "react"
import { productosApiV2 } from '~/lib/api/producto'
import { cargosHierarchyApi } from '~/lib/api/cargos-hierarchy'
import { useAuth } from "~/lib/auth-context"

export interface ProductoDisponible {
    id: number
    codigo: string
    nombre: string
    imagen?: string
    marca?: { id: number; name: string }
    unidad_medida?: { name: string }
    stock?: number
    precio_unitario?: number
}

export function useRequerimientoData(open: boolean) {
    const { user } = useAuth()
    const [fetchedProductos, setFetchedProductos] = useState<ProductoDisponible[]>([])
    const [cargos, setCargos] = useState<{ label: string; value: string }[]>([])

    useEffect(() => {
        if (!open) return

        const fetchData = async () => {
            try {
                const [productosRes, cargosRes] = await Promise.all([
                    fetchedProductos.length === 0 ? productosApiV2.getAllByAlmacen({ almacen_id: 1 }) : Promise.resolve(null),
                    cargosHierarchyApi.getAllCargos(),
                ])

                if (productosRes && !productosRes.error) {
                    const data = productosRes.data as any
                    const list = data?.data || data || []
                    setFetchedProductos(list)
                }

                if (!cargosRes.error) {
                    const data = cargosRes.data as any
                    const list = data?.data || []
                    const userCargoLower = user?.cargo?.toLowerCase() || ''

                    const filtered = list
                        .filter((c: any) => {
                            const descLower = c.descripcion?.toLowerCase() || ''
                            if (descLower === userCargoLower) return true
                            return c.parent === userCargoLower || c.parent === null
                        })
                        .map((c: any) => ({ label: c.descripcion, value: c.descripcion }))

                    setCargos(filtered)
                }
            } catch (error) {
                console.error("Error fetching data:", error)
            }
        }

        fetchData()
    }, [open])

    return {
        fetchedProductos,
        cargos,
    }
}
