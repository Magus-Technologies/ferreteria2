'use client'

import { Modal, Spin, Empty, Alert } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { FaUser } from 'react-icons/fa'
import { transaccionesCajaApi } from '~/lib/api/transacciones-caja'
import type { SubCaja } from '~/lib/api/caja-principal'

interface ModalDetalleNoCerradoProps {
    open: boolean
    setOpen: (open: boolean) => void
    subCaja: SubCaja | null
}

interface FilaDetalle {
    despliegue_pago_id: string | null
    despliegue_nombre: string
    user_id: string
    user_nombre: string
    ingresos: number
    egresos: number
    monto: number
}

const soles = (n: number) => `S/. ${Number(n).toFixed(2)}`

/**
 * Desglose del "Saldo No Cerrado" de una sub-caja.
 *
 * Se agrupa por despliegue de pago y, dentro de cada uno, por usuario: una
 * sub-caja acepta varios métodos y sobre cada uno puede haber varios vendedores
 * con sesión abierta. El total sale del mismo cálculo que la columna del listado,
 * así que siempre cuadra con el monto que se ve ahí.
 */
export default function ModalDetalleNoCerrado({
    open,
    setOpen,
    subCaja,
}: ModalDetalleNoCerradoProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['detalle-no-cerrado', subCaja?.id],
        queryFn: async () => {
            if (!subCaja) return null
            const response = await transaccionesCajaApi.getDetalleNoCerrado(subCaja.id)
            return response.data?.data ?? null
        },
        enabled: open && !!subCaja,
    })

    // Agrupar por método conservando el orden que ya trae el backend
    // (método alfabético, y dentro de él el mayor monto primero).
    const grupos = useMemo(() => {
        const filas = (data?.detalle ?? []) as FilaDetalle[]
        const mapa = new Map<string, FilaDetalle[]>()

        for (const fila of filas) {
            const clave = fila.despliegue_nombre
            if (!mapa.has(clave)) mapa.set(clave, [])
            mapa.get(clave)!.push(fila)
        }

        return Array.from(mapa.entries())
    }, [data])

    return (
        <Modal
            title={
                <div className='flex items-center gap-3'>
                    <span className='text-lg font-bold'>Detalle de Saldo No Cerrado</span>
                    {subCaja && (
                        <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-sm'>
                            {subCaja.codigo}
                        </span>
                    )}
                </div>
            }
            open={open}
            onCancel={() => setOpen(false)}
            width={760}
            footer={null}
            centered
            destroyOnHidden
        >
            <div className='mt-4'>
                <p className='text-sm text-slate-500 mb-4'>
                    Dinero de las sesiones <strong>abiertas</strong> en{' '}
                    <strong>{subCaja?.nombre}</strong>, repartido por método de pago y vendedor.
                    No se puede trasladar hasta que cada uno cierre su caja.
                </p>

                {data?.total_aplanado && (
                    <Alert
                        type='warning'
                        showIcon
                        className='mb-4'
                        message='El neto de las sesiones es negativo'
                        description={`La suma real es ${soles(data.total)}, pero la columna muestra S/. 0.00 porque no se admiten saldos negativos.`}
                    />
                )}

                {isLoading ? (
                    <div className='flex justify-center items-center h-[200px]'>
                        <Spin size='large' />
                    </div>
                ) : grupos.length === 0 ? (
                    <Empty description='Esta sub-caja no tiene saldo en sesiones abiertas' />
                ) : (
                    <div className='space-y-4'>
                        {grupos.map(([metodo, filas]) => {
                            const subtotal = filas.reduce((acc, f) => acc + f.monto, 0)

                            return (
                                <div key={metodo} className='border border-slate-200 rounded-lg overflow-hidden'>
                                    <div className='flex justify-between items-center px-4 py-2 bg-slate-50 border-b border-slate-200'>
                                        <span className='font-semibold text-slate-700'>{metodo}</span>
                                        <span className='font-bold text-blue-600'>{soles(subtotal)}</span>
                                    </div>

                                    <table className='w-full text-sm'>
                                        <thead>
                                            <tr className='text-xs text-slate-500 border-b border-slate-100'>
                                                <th className='text-left font-medium px-4 py-1.5'>Vendedor</th>
                                                <th className='text-right font-medium px-4 py-1.5'>Ingresos</th>
                                                <th className='text-right font-medium px-4 py-1.5'>Egresos</th>
                                                <th className='text-right font-medium px-4 py-1.5'>Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filas.map((f) => (
                                                <tr key={`${f.despliegue_pago_id}-${f.user_id}`} className='border-b border-slate-50 last:border-0'>
                                                    <td className='px-4 py-2'>
                                                        <span className='flex items-center gap-2'>
                                                            <FaUser className='text-slate-400 text-xs' />
                                                            {f.user_nombre}
                                                        </span>
                                                    </td>
                                                    <td className='px-4 py-2 text-right text-emerald-600'>
                                                        {soles(f.ingresos)}
                                                    </td>
                                                    <td className='px-4 py-2 text-right text-red-500'>
                                                        {soles(f.egresos)}
                                                    </td>
                                                    <td className='px-4 py-2 text-right font-semibold text-blue-600'>
                                                        {soles(f.monto)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        })}

                        <div className='flex justify-between items-center px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg'>
                            <span className='font-semibold text-slate-700'>Total No Cerrado</span>
                            <span className='text-lg font-bold text-blue-700'>
                                {soles(Math.max(data?.total ?? 0, 0))}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}
