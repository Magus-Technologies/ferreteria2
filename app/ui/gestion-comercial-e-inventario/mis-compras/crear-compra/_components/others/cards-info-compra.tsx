'use client'

import { BsFillCartCheckFill, BsFillCartDashFill } from 'react-icons/bs'
import ButtonBase from '~/components/buttons/button-base'
import CardInfo from '../cards/card-info'
import { TbShoppingCartCog, TbShoppingCartPlus } from 'react-icons/tb'
import { Form, FormInstance } from 'antd'
import { FormCreateCompra } from './body-comprar'
import { IGV } from '~/lib/constantes'
import { useMemo } from 'react'
import { CompraConUnidadDerivadaNormal } from './header'
import { EstadoDeCompra } from '~/types'
import InputBase from '~/app/_components/form/inputs/input-base'
import ButtonRecuperarCompraEnEspera from '../buttons/button-recuperar-compra-en-espera'
import ButtonRecuperarCompraAnulada from '../buttons/button-recuperar-compra-anulada'
import ButtonRecuperarOrdenCompra from '../buttons/button-recuperar-orden-compra'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import type { GastoExtraDisponible } from '~/app/_components/form/selects/select-egresos-dinero'

export default function CardsInfoCompra({
  form,
  compra,
}: {
  form: FormInstance
  compra?: CompraConUnidadDerivadaNormal
}) {
  const tipo_moneda = Form.useWatch('tipo_moneda', form)
  const tipo_de_cambio = Form.useWatch('tipo_de_cambio', form)
  const percepcion = Form.useWatch('percepcion', form)
  const gasto_extra_id = Form.useWatch('gasto_extra_id', form)
  const productos = Form.useWatch(
    'productos',
    form
  ) as FormCreateCompra['productos']

  const queryClient = useQueryClient()

  // Obtener monto del gasto extra seleccionado desde el cache
  const montoGastoExtra = useMemo(() => {
    if (!gasto_extra_id) return 0
    const cached = queryClient.getQueryData<GastoExtraDisponible[]>([QueryKeys.EGRESOS_DINERO, undefined])
      ?? queryClient.getQueryData<GastoExtraDisponible[]>([QueryKeys.EGRESOS_DINERO, compra?.id])
    const gasto = cached?.find(g => g.id === gasto_extra_id)
    return gasto ? Number(gasto.monto) : 0
  }, [gasto_extra_id, queryClient, compra?.id])

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
    <div className='flex flex-col gap-4 w-full xl:w-64'>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.boton-recuperar-orden' label='Botón Recuperar Orden de Compra'>
        <ButtonRecuperarOrdenCompra form={form} />
      </ConfigurableElement>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.boton-recuperar-anulada' label='Botón Recuperar Compra Anulada'>
        <ButtonRecuperarCompraAnulada />
      </ConfigurableElement>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.boton-recuperar-en-espera' label='Botón Recuperar Compra en Espera'>
        <ButtonRecuperarCompraEnEspera />
      </ConfigurableElement>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.card-v-bruto' label='Card V. Bruto'>
        <CardInfo title='V. Bruto' value={subTotal} moneda={tipo_moneda} />
      </ConfigurableElement>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.card-subtotal' label='Card Sub Total'>
        <CardInfo
          title='Sub Total'
          value={subTotal / (IGV + 1)}
          moneda={tipo_moneda}
        />
      </ConfigurableElement>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.card-igv' label='Card IGV'>
        <CardInfo
          title='IGV'
          value={subTotal - subTotal / (IGV + 1) + (percepcion ?? 0)}
          moneda={tipo_moneda}
        />
      </ConfigurableElement>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.card-flete' label='Card Flete'>
        <CardInfo title='Flete' value={flete} />
      </ConfigurableElement>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.card-percepcion' label='Card Percepción'>
        <CardInfo
          title='Percepción'
          value={percepcion ?? 0}
          moneda={tipo_moneda}
        />
      </ConfigurableElement>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.card-total' label='Card Total'>
        <CardInfo
          title='Total'
          value={subTotal + flete * tipo_de_cambio + (percepcion ?? 0)}
          moneda={tipo_moneda}
        />
      </ConfigurableElement>
      {montoGastoExtra > 0 && (
        <>
          <ConfigurableElement componentId='gestion-comercial.crear-compra.card-egreso-asociado' label='Card Egreso Asociado'>
            <CardInfo
              title='Egreso Asociado'
              value={montoGastoExtra}
              moneda={tipo_moneda}
              className='border-amber-400 border-2'
            />
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-comercial.crear-compra.card-saldo-pagar' label='Card Saldo a Pagar'>
            <CardInfo
              title='Saldo a Pagar'
              value={Math.max(0, subTotal + flete * tipo_de_cambio + (percepcion ?? 0) - montoGastoExtra)}
              moneda={tipo_moneda}
              className='border-rose-500 border-2'
            />
          </ConfigurableElement>
        </>
      )}
      {(compra?.recepciones_almacen_count ?? 0) > 0 ||
      (compra?.pagos_de_compras_count ?? 0) > 0 ||
      compra?.estado_de_compra === EstadoDeCompra.Creado ? null : (
        <ConfigurableElement componentId='gestion-comercial.crear-compra.boton-poner-espera' label='Botón Poner en Espera'>
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
        </ConfigurableElement>
      )}
      <ConfigurableElement componentId='gestion-comercial.crear-compra.boton-crear-compra' label='Botón Crear/Editar Compra'>
        <ButtonBase
          onClick={async () => {
            form.setFieldValue('estado_de_compra', EstadoDeCompra.Creado)
            
            try {
              const values = await form.validateFields()
              form.submit()
            } catch (error) {
              // Validation errors are shown by Ant Design automatically
            }
          }}
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
      </ConfigurableElement>
    </div>
  )
}
