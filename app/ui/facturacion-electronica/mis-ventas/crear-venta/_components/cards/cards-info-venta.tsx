'use client'

import { DescuentoTipo, EstadoDeVenta } from '~/lib/api/venta'
import { Form, FormInstance } from 'antd'
import { useMemo, useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { FormCreateVenta } from '../others/body-vender'
import CardInfoVenta from './card-info-venta'
import { FaMoneyBillWave } from 'react-icons/fa'
import ModalMetodosPagoVenta from '../modals/modal-metodos-pago-venta'
import InputBase from '~/app/_components/form/inputs/input-base'
import { VentaConUnidadDerivadaNormal } from '../others/header-crear-venta'
import { MdOutlineSell, MdSell } from 'react-icons/md'
import { FaPause } from 'react-icons/fa6'

export default function CardsInfoVenta({
  form,
  venta,
}: {
  form: FormInstance
  venta?: VentaConUnidadDerivadaNormal
}) {
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

  // Calcular Total Recargo
  const totalRecargo = useMemo(
    () =>
      (productos || []).reduce(
        (acc, item) =>
          acc + Number(item?.recargo ?? 0) * Number(item?.cantidad ?? 0),
        0
      ),
    [productos]
  )

  // Calcular Total Descuento
  const totalDescuento = useMemo(
    () =>
      (productos || []).reduce((acc, item) => {
        const descuento_tipo = item?.descuento_tipo ?? DescuentoTipo.MONTO
        const descuento = Number(item?.descuento ?? 0)
        const precio_venta = Number(item?.precio_venta ?? 0)
        const recargo = Number(item?.recargo ?? 0)
        const cantidad = Number(item?.cantidad ?? 0)

        if (descuento_tipo === DescuentoTipo.PORCENTAJE) {
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

  // Total Comisión
  const totalComision = useMemo(
    () =>
      (productos || []).reduce((acc, item) => {
        const comision = Number(item?.comision ?? 0)
        const cantidad = Number(item?.cantidad ?? 0)
        const descuento = Number(item?.descuento ?? 0)
        const descuento_tipo = item?.descuento_tipo ?? DescuentoTipo.MONTO
        const precio_venta = Number(item?.precio_venta ?? 0)
        const recargo = Number(item?.recargo ?? 0)

        const total_comision_bruta = comision * cantidad

        let descuento_monto = 0
        if (descuento_tipo === DescuentoTipo.PORCENTAJE) {
          descuento_monto =
            ((precio_venta + recargo) * descuento * cantidad) / 100
        } else {
          descuento_monto = descuento
        }

        const comision_final = Math.max(
          0,
          total_comision_bruta - descuento_monto
        )

        return acc + comision_final
      }, 0),
    [productos]
  )

  return (
    <>
      {/* Campo oculto para métodos de pago */}
      <InputBase
        propsForm={{
          name: 'metodos_de_pago',
          hidden: true,
        }}
        hidden
      />

      <div className='flex flex-col gap-4 max-w-64'>
        <CardInfoVenta title='SubTotal' value={subTotal} moneda={tipo_moneda} />
        <CardInfoVenta
          title='Total Recargo'
          value={totalRecargo}
          moneda={tipo_moneda}
        />
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
          disabled={forma_de_pago === 'cr'}
          color='info'
          className='flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance'
        >
          <FaMoneyBillWave className='min-w-fit' size={30} />
          Cobrar
        </ButtonBase>
        {/* {(compra?._count?.recepciones_almacen ?? 0) > 0 ||
              (compra?._count?.pagos_de_compras ?? 0) > 0 ||
              compra?.estado_de_compra === EstadoDeCompra.Creado ? null : ( */}
        <ButtonBase
          onClick={() => {
            form.setFieldValue('estado_de_venta', EstadoDeVenta.EN_ESPERA)
            form.submit()
          }}
          color='warning'
          className='flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance'
        >
          <InputBase
            propsForm={{
              name: 'estado_de_venta',
              hidden: true,
            }}
            hidden
          />
          <FaPause className='min-w-fit' size={30} /> Poner en Espera
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
