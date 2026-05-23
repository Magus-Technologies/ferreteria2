"use client"

import { useState, useEffect } from "react"
import { tipoServicioApi, type TipoServicio } from "~/lib/api/tipo-servicio"
import { vehiculosApi } from "~/lib/api/catalogos"
import { cargosHierarchyApi } from "~/lib/api/cargos-hierarchy"
import { useAuth } from "~/lib/auth-context"

export function useRequerimientoData(open: boolean) {
    const { user } = useAuth()
    const userCargo = user?.cargo?.toLowerCase() || ''
    const [tiposServicio, setTiposServicio] = useState<{ label: string; value: number }[]>([])
    const [vehiculos, setVehiculos] = useState<{ label: string; value: string }[]>([])
    const [cargos, setCargos] = useState<{ label: string; value: string }[]>([])

    const addTipoServicio = (nuevoTipo: any) => {
        setTiposServicio(prev => [...prev, { label: nuevoTipo.nombre, value: nuevoTipo.id }])
    }

    useEffect(() => {
        if (!open) return

        const fetchData = async () => {
            try {
                const [resTipos, resVehiculos, allCargosResult] = await Promise.all([
                    tiposServicio.length === 0 ? tipoServicioApi.getAll() : Promise.resolve(null),
                    vehiculos.length === 0 ? vehiculosApi.getAll() : Promise.resolve(null),
                    cargosHierarchyApi.getAllCargos(),
                ])

                if (resTipos && !(resTipos as any).error) {
                    const tiposData: TipoServicio[] = (resTipos as any).data?.data ?? (resTipos as any).data ?? []
                    if (Array.isArray(tiposData)) {
                        setTiposServicio(tiposData.map(t => ({ label: t.nombre, value: t.id })))
                    }
                }

                if (resVehiculos && !(resVehiculos as any).error) {
                    const data = (resVehiculos as any).data?.data
                    if (data) {
                        setVehiculos(data.map((v: any) => ({
                            label: `${v.name || v.placa || 'Vehículo'} (${v.tipo || 'N/A'})`,
                            value: String(v.id)
                        })))
                    }
                }

                if (!allCargosResult.error) {
                    const data = allCargosResult.data as any
                    const list = data?.data || []
                    const userCargoObj = list.find((c: any) => c.descripcion?.toLowerCase() === userCargo)
                    const userParent = userCargoObj?.parent || null

                    const filtered = list
                        .filter((c: any) => {
                            const descLower = c.descripcion?.toLowerCase() || ''
                            if (descLower === userCargo) return true
                            if (userParent && c.codigo === userParent) return true
                            return c.parent === null
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
        tiposServicio,
        vehiculos,
        cargos,
        addTipoServicio,
    }
}
