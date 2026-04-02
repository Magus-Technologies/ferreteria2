'use client'

import { BsFillCartDashFill } from 'react-icons/bs'
import ButtonBase from '~/components/buttons/button-base'
import CardInfo from '../cards/card-info'
import { TbShoppingCartCog, TbShoppingCartPlus } from 'react-icons/tb'
import { Form, FormInstance } from 'antd'
import { FormCreateCompra } from './body-comprar'
import { IGV } from '~/lib/constantes'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '~/lib/api'
import type { GastoExtraDisponible } from '~/app/_components/form/selects/select-egresos-dinero'
import { CompraConUnidadDerivadaNormal } from './header'
import { EstadoDeCompra, FormaDePago, TipoMoneda } from '~/types'
import InputBase from '~/app/_components/form/inputs/input-base'
import ButtonRecuperarCompraEnEspera from '../buttons/button-recuperar-compra-en-espera'
import ButtonRecuperarCompraAnulada from '../buttons/button-recuperar-compra-anulada'
import ButtonRecuperarOrdenCompra from '../buttons/button-recuperar-orden-compra'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalMetodosPagoCompra from '../modals/modal-metodos-pago-compra'
import useApp from 'antd/es/app/useApp'

export default function CardsInfoCompra({
  form,
  compra,
  onPonerEnEspera,
}: {
  form: FormInstance
  compra?: CompraConUnidadDerivadaNormal
  onPonerEnEspera?: () => void
}) {
  const { message } = useApp()
  const [modalPagoOpen, setModalPagoOpen] = useState(false)

  const tipo_moneda = Form.useWatch('tipo_moneda', form) as TipoMoneda
  const tipo_de_cambio = Form.useWatch('tipo_de_cambio', form)
  const percepcion = Form.useWatch('percepcion', form)
  const gasto_extra_id = Form.useWatch('gasto_extra_id', form)
  const forma_de_pago = Form.useWatch('forma_de_pago', form)
  const productos = Form.useWatch('productos', form) as FormCreateCompra['productos']

  const { data: egresos = [] } = useQuery({
    queryKey: [QueryKeys.EGRESOS_DINERO, compra?.id],
    queryFn: async () => {
      const response = await apiRequest<{ success: boolean; data: GastoExtraDisponible[] }>(
        '/gastos-extras/disponibles',
        { params: compra?.id ? { excluir_compra_id: compra.id } : undefined }
      )
      return response.data?.data || []
    },
    staleTime: 0,
    enabled: !!gasto_extra_id,
  })

  const gastoExtraInfo = useMemo(
    () => egresos.find(g => g.id === gasto_extra_id),
    [egresos, gasto_extra_id]
  )

  const montoGastoExtra = gastoExtraInfo ? Number(gastoExtraInfo.monto) : 0

  const subTotal = useMemo(
    () => (productos || []).reduce((acc, item) => acc + (item?.subtotal ?? 0) * (item?.bonificacion ? 0 : 1), 0),
    [productos]
  )

  const flete = useMemo(
    () => (productos || []).reduce((acc, item) => acc + (item?.flete ?? 0), 0),
    [productos]
  )

  const totalAPagar = subTotal + flete * (tipo_de_cambio || 1) + (percepcion ?? 0)
  const esContado = forma_de_pago === FormaDePago.Contado

  const handleCrearCompra = async () => {
    form.setFieldValue('estado_de_compra', EstadoDeCompra.Creado)
    try {
      await form.validateFields()
    } catch {
      return
    }

    if (esContado) {
      if (totalAPagar <= 0) {
        message.warning('Agrega productos a la compra primero')
        return
      }
      setModalPagoOpen(true)
    } else {
      form.submit()
    }
  }

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
        <CardInfo title='Sub Total' value={subTotal / (IGV + 1)} moneda={tipo_moneda} />
      </ConfigurableElement>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.card-igv' label='Card IGV'>
        <CardInfo title='IGV' value={subTotal - subTotal / (IGV + 1) + (percepcion ?? 0)} moneda={tipo_moneda} />
      </ConfigurableElement>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.card-flete' label='Card Flete'>
        <CardInfo title='Flete' value={flete} />
      </ConfigurableElement>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.card-percepcion' label='Card Percepción'>
        <CardInfo title='Percepción' value={percepcion ?? 0} moneda={tipo_moneda} />
      </ConfigurableElement>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.card-total' label='Card Total'>
        <CardInfo title='Total' value={totalAPagar} moneda={tipo_moneda} />
      </ConfigurableElement>
      {montoGastoExtra > 0 && (
        <>
          <ConfigurableElement componentId='gestion-comercial.crear-compra.card-egreso-asociado' label='Card Egreso Asociado'>
            <CardInfo title='Egreso Asociado' value={montoGastoExtra} moneda={tipo_moneda} className='border-amber-400 border-2' />
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-comercial.crear-compra.card-saldo-pagar' label='Card Saldo a Pagar'>
            <CardInfo title='Saldo a Pagar' value={Math.max(0, totalAPagar - montoGastoExtra)} moneda={tipo_moneda} className='border-rose-500 border-2' />
          </ConfigurableElement>
        </>
      )}
      {(compra?.recepciones_almacen_count ?? 0) > 0 ||
      (compra?.pagos_de_compras_count ?? 0) > 0 ||
      compra?.estado_de_compra === EstadoDeCompra.Creado ? null : (
        <ConfigurableElement componentId='gestion-comercial.crear-compra.boton-poner-espera' label='Botón Poner en Espera'>
          <ButtonBase
            onClick={() => {
              const productos = form.getFieldValue('productos')
              if (!productos || productos.length === 0) {
                message.warning('Agrega al menos un producto')
                return
              }
              onPonerEnEspera?.()
            }}
            color='warning'
            className='flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance'
          >
            <InputBase propsForm={{ name: 'estado_de_compra', hidden: true }} hidden />
            <BsFillCartDashFill className='min-w-fit' size={30} /> Poner en Espera
          </ButtonBase>
        </ConfigurableElement>
      )}
      <ConfigurableElement componentId='gestion-comercial.crear-compra.boton-crear-compra' label='Botón Crear/Editar Compra'>
        <ButtonBase
          onClick={handleCrearCompra}
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

      <ModalMetodosPagoCompra
        open={modalPagoOpen}
        onCancel={() => setModalPagoOpen(false)}
        form={form}
        totalAPagar={totalAPagar}
        montoEgresoAsociado={montoGastoExtra}
        gastoExtraInfo={gastoExtraInfo}
        tipo_moneda={tipo_moneda ?? TipoMoneda.Soles}
        onContinuar={() => {
          form.setFieldValue('estado_de_compra', EstadoDeCompra.Creado)
          form.submit()
        }}
      />
    </div>
  )
}
