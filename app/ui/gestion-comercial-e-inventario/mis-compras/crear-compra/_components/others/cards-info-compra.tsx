'use client'

import {
  BsCartXFill,
  BsFillCartCheckFill,
  BsFillCartDashFill,
} from 'react-icons/bs'
import ButtonBase from '~/components/buttons/button-base'
import CardInfo from '../cards/card-info'
import { TbShoppingCartCog, TbShoppingCartPlus } from 'react-icons/tb'
import { Form, FormInstance } from 'antd'
import { FormCreateCompra } from './body-comprar'
import { IGV } from '~/lib/constantes'
import { useMemo } from 'react'
import { CompraConUnidadDerivadaNormal } from './header'
import { EstadoDeCompra } from '@prisma/client'
import InputBase from '~/app/_components/form/inputs/input-base'

export default function CardsInfoCompra({
  form,
  compra,
}: {
  form: FormInstance
  compra?: CompraConUnidadDerivadaNormal
}) {
  console.log('🚀 ~ file: cards-info-compra.tsx:25 ~ compra:', compra)
  const tipo_moneda = Form.useWatch('tipo_moneda', form)
  const tipo_de_cambio = Form.useWatch('tipo_de_cambio', form)
  const percepcion = Form.useWatch('percepcion', form)
  const productos = Form.useWatch(
    'productos',
    form
  ) as FormCreateCompra['productos']

  const subTotal = useMemo(
    () =>
      (productos || []).reduce(
        (acc, item) =>
          acc + (item?.subtotal ?? 0) * (item?.bonificacion ? 0 : 1),
        0
      ),
    [productos]
  )

  const flete = useMemo(
    () => (productos || []).reduce((acc, item) => acc + (item?.flete ?? 0), 0),
    [productos]
  )

  return (
    <div className='flex flex-col gap-4 max-w-64'>
      {compra ? null : (
        <>
          <ButtonBase className='flex items-center justify-center gap-4 !rounded-md w-full h-full text-balance border-orange-500'>
            <BsFillCartCheckFill
              className='text-orange-600 min-w-fit'
              size={30}
            />{' '}
            Recuperar Orden de Compra
          </ButtonBase>
          <ButtonBase className='flex items-center justify-center gap-4 !rounded-md w-full h-full text-balance border-rose-500'>
            <BsCartXFill className='text-rose-600 min-w-fit' size={30} />{' '}
            Recuperar Compra Anulada
          </ButtonBase>
          <ButtonBase className='flex items-center justify-center gap-4 !rounded-md w-full h-full text-balance border-yellow-500'>
            <BsFillCartDashFill
              className='text-yellow-600 min-w-fit'
              size={30}
            />{' '}
            Recuperar Compra en Espera
          </ButtonBase>
        </>
      )}
      <CardInfo title='V. Bruto' value={subTotal} moneda={tipo_moneda} />
      <CardInfo
        title='Sub Total'
        value={subTotal / (IGV + 1)}
        moneda={tipo_moneda}
      />
      <CardInfo
        title='IGV'
        value={subTotal - subTotal / (IGV + 1) + (percepcion ?? 0)}
        moneda={tipo_moneda}
      />
      <CardInfo title='Flete' value={flete} />
      <CardInfo
        title='Percepción'
        value={percepcion ?? 0}
        moneda={tipo_moneda}
      />
      <CardInfo
        title='Total'
        value={subTotal + flete * tipo_de_cambio + (percepcion ?? 0)}
        moneda={tipo_moneda}
      />
      {(compra?._count?.recepciones_almacen ?? 0) > 0 ||
      compra?.estado_de_compra === EstadoDeCompra.Creado ? null : (
        <ButtonBase
          onClick={() => {
            form.setFieldValue('estado_de_compra', EstadoDeCompra.EnEspera)
            form.submit()
          }}
          color='warning'
          className='flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance'
        >
          <InputBase
            propsForm={{
              name: 'estado_de_compra',
              hidden: true,
            }}
            hidden
          />
          <BsFillCartDashFill className='min-w-fit' size={30} /> Poner en Espera
        </ButtonBase>
      )}
      <ButtonBase
        type='submit'
        color={compra ? 'info' : 'success'}
        className='flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance'
      >
        {compra ? (
          <TbShoppingCartCog className='min-w-fit' size={30} />
        ) : (
          <TbShoppingCartPlus className='min-w-fit' size={30} />
        )}{' '}
        {compra ? 'Editar' : 'Crear'} Compra
      </ButtonBase>
    </div>
  )
}
