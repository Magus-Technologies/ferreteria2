'use client'

import { useState } from 'react'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import { useStoreProductosVencidos } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-productos-vencidos'
import TableProductosPorVencer from '~/app/ui/gestion-comercial-e-inventario/_components/tables/table-productos-por-vencer'
import { InputNumber, Tag, Space, Card } from 'antd'
import { FaCalendarAlt } from 'react-icons/fa'

export default function ModalProductosVencidos() {
    const open = useStoreProductosVencidos(state => state.openModal)
    const setOpen = useStoreProductosVencidos(state => state.setOpenModal)
    // Usamos null para representar "Todos" (sin filtros)
    const [dias, setDias] = useState<number | null>(null)

    return (
        <ModalForm
            open={open}
            setOpen={setOpen}
            modalProps={{
                title: (
                    <TitleForm className='!pb-0'>
                        Vencimientos de Productos
                    </TitleForm>
                ),
                width: 1200,
                footer: null,
                centered: true,
            }}
        >
            <div className='flex flex-col gap-6 py-2'>
                <Card
                    variant="borderless"
                    className='bg-rose-50/30 border border-rose-100 rounded-xl'
                    size="small"
                >
                    <div className='flex flex-wrap items-center justify-between gap-4'>
                        <div className='flex items-center gap-3'>
                            <div className='bg-rose-100 text-rose-600 p-2 rounded-lg'>
                                <FaCalendarAlt size={18} />
                            </div>
                            <div>
                                <h4 className='text-sm font-semibold text-slate-800 m-0'>
                                    {dias === null ? 'Vista General de Vencimientos' :
                                        dias === 0 ? 'Vista de Productos Vencidos' : 'Vista de Vencimientos Próximos'}
                                </h4>
                                <p className='text-xs text-slate-500 m-0'>
                                    {dias === null
                                        ? 'Mostrando todos los productos con fecha de vencimiento (vencidos y por vencer)'
                                        : dias === 0
                                            ? 'Mostrando solo productos que ya expiraron o vencen hoy'
                                            : `Mostrando solo productos por vencer en los próximos ${dias} días (excluyendo ya vencidos)`}
                                </p>
                            </div>
                        </div>

                        <Space align="center" size="middle">
                            <span className='text-sm font-medium text-slate-600'>Ver próximos:</span>
                            <InputNumber
                                min={0}
                                max={365}
                                placeholder="Todos"
                                value={dias}
                                onChange={(val) => setDias(val)}
                                addonAfter="días"
                                className='w-32'
                                variant="filled"
                            />
                            <Tag color={dias === null ? "blue" : dias === 0 ? "error" : "orange"} className='font-medium px-3 py-1 rounded-full'>
                                {dias === null ? 'Ver Todo' : dias === 0 ? 'Solo Vencidos' : `Próximos ${dias} d.`}
                            </Tag>
                        </Space>
                    </div>
                </Card>

                <div className='h-[600px] w-full bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm'>
                    <TableProductosPorVencer dias={dias ?? -1} />
                </div>
            </div>
        </ModalForm>
    )
}
