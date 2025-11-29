'use client'

import { DescuentoTipo } from '@prisma/client'
import { Form, FormInstance } from 'antd'
import { useMemo, useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { FormCreateVenta } from '../others/body-vender'
import CardInfoVenta from './card-info-venta'
import { FaMoneyBillWave } from 'react-icons/fa'
import ModalMetodosPagoVenta from '../modals/modal-metodos-pago-venta'

export default function CardsInfoVenta({ form }: { form: FormInstance }) {
  const tipo_moneda = Form.useWatch('tipo_moneda', form)
  const forma_de_pago = Form.useWatch('forma_de_pago', form)
  const productos = Form.useWatch(
    'productos',
    form
  ) as FormCreateVenta['productos']

  const [modalOpen, setModalOpen] = useState(false)

  // Calcular SubTotal (suma de productos sin descuento)
  const subTotal = useMemo(
    () =>
      (productos || []).reduce(
        (acc, item) =>
          acc +
          (Number(item?.precio_venta ?? 0) + Number(item?.recargo ?? 0)) *
            Number(item?.cantidad ?? 0),
        0
      ),
    [productos]
  )

  // Calcular Total Descuento
  const totalDescuento = useMemo(
    () =>
      (productos || []).reduce((acc, item) => {
        const descuento_tipo = item?.descuento_tipo ?? DescuentoTipo.Monto
        const descuento = Number(item?.descuento ?? 0)
        const precio_venta = Number(item?.precio_venta ?? 0)
        const recargo = Number(item?.recargo ?? 0)
        const cantidad = Number(item?.cantidad ?? 0)

        if (descuento_tipo === DescuentoTipo.Porcentaje) {
          return acc + ((precio_venta + recargo) * descuento * cantidad) / 100
        } else {
          return acc + descuento
        }
      }, 0),
    [productos]
  )

  // Calcular Total Cobrado
  const totalCobrado = useMemo(
    () => subTotal - totalDescuento,
    [subTotal, totalDescuento]
  )

  // Total Comisión (por ahora en 0)
  const totalComision = 0

  return (
    <>
      <div className='flex flex-col gap-4 max-w-64'>
        <CardInfoVenta title='SubTotal' value={subTotal} moneda={tipo_moneda} />
        <CardInfoVenta
          title='Total Dscto'
          value={totalDescuento}
          moneda={tipo_moneda}
        />
        <CardInfoVenta
          title='Total Cobrado'
          value={totalCobrado}
          moneda={tipo_moneda}
          className='border-rose-500 border-2'
        />
        <CardInfoVenta
          title='Total Comisión'
          value={totalComision}
          moneda={tipo_moneda}
        />
        <ButtonBase
          onClick={() => setModalOpen(true)}
          disabled={forma_de_pago === 'Crédito'}
          color='success'
          className='flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance'
        >
          <FaMoneyBillWave className='min-w-fit' size={30} />
          Cobrar
        </ButtonBase>
      </div>

      <ModalMetodosPagoVenta
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        form={form}
        totalCobrado={totalCobrado}
        tipo_moneda={tipo_moneda}
      />
    </>
  )
}
