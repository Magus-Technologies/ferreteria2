'use client'

import ButtonBase from '~/components/buttons/button-base'
import { FaCalendarTimes } from 'react-icons/fa'
import { useStoreProductosVencidos } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-productos-vencidos'
import ModalProductosVencidos from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/modals/modal-productos-vencidos'

export default function ButtonProductosVencidos() {
    const setOpenModal = useStoreProductosVencidos(state => state.setOpenModal)

    return (
        <>
            <ModalProductosVencidos />
            <ButtonBase
                className='flex items-center justify-center gap-2 !rounded-md w-full lg:h-full h-10 bg-rose-50 hover:bg-rose-100 !text-rose-600 border border-rose-200'
                size='sm'
                onClick={() => setOpenModal(true)}
            >
                <FaCalendarTimes className='text-rose-600' size={15} /> Proximos Vencer / Vencidos
            </ButtonBase>
        </>
    )
}
