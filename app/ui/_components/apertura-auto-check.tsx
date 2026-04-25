'use client'

import { useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cajaApi } from '~/lib/api/caja'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useRouter } from 'next/navigation'
import ModalAperturarCaja from '~/app/ui/facturacion-electronica/_components/modals/modal-aperturar-caja'

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

    const { data: cajaActiva, isLoading } = useQuery({
        queryKey: [QueryKeys.CAJA_ACTIVA],
        queryFn: async () => {
            const response = await cajaApi.cajaActiva()
            return response.data?.data || null
        },
    })

    const shouldOpen = !isLoading && !cajaActiva

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
