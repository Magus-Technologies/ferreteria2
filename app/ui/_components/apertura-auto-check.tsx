'use client'

import { useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCajaActivaOrNull } from '~/lib/api/caja'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useRouter } from 'next/navigation'
import ModalAperturarCaja from '~/app/ui/facturacion-electronica/_components/modals/modal-aperturar-caja'
import { useConfigMode } from '~/app/ui/configuracion/permisos-visuales/_components/config-mode-context'

/**
 * Componente que muestra el modal de Distribución de Efectivo a Vendedores
 * cuando no hay apertura de caja para hoy.
 * - Si el usuario cierra el modal sin completar → NO permite cerrar (modal no se cierra)
 * - Si el usuario completa la apertura → invalida la query y el modal se cierra solo
 */
export default function AperturaGuard() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const successRef = useRef(false)

    // En el modo Configuración (vista previa de permisos visuales) las vistas reales
    // se renderizan solo para configurarlas: NO debe dispararse el modal de apertura
    // de caja ni la consulta/redirección que conlleva.
    const enModoConfig = !!useConfigMode()?.enabled

    const { data: cajaActiva, isSuccess } = useQuery({
        queryKey: [QueryKeys.CAJA_ACTIVA],
        queryFn: () => fetchCajaActivaOrNull(),
        staleTime: 30000,
        gcTime: 60000,
        retry: 1,
        enabled: !enModoConfig,
    })

    // Abrir SOLO cuando la consulta tuvo éxito y confirmó que no hay caja (null).
    // Si la consulta falla (error transitorio) `isSuccess` es false y conservamos
    // el último valor bueno: el modal NO reaparece de forma espuria.
    const shouldOpen = !enModoConfig && isSuccess && !cajaActiva

    const handleSetOpen = (val: boolean) => {
        if (!val && !successRef.current) {
            // Intentó cerrar sin completar → redirigir a /ui
            router.push('/ui')
            return
        }
    }

    const handleSuccess = () => {
        successRef.current = true
        queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJA_ACTIVA] })
        // Resetear después de un pequeño delay para asegurar que el modal se cierre correctamente
        setTimeout(() => {
            successRef.current = false
        }, 100)
    }

    return (
        <ModalAperturarCaja
            open={shouldOpen}
            setOpen={handleSetOpen}
            onSuccess={handleSuccess}
        />
    )
}
