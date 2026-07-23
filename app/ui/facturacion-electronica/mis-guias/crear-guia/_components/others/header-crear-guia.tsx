'use client'

import { Form, Modal, type FormInstance } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { TbTruckDelivery } from 'react-icons/tb'
import { MdOutlineLocalShipping } from 'react-icons/md'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import SelectBase from '~/app/_components/form/selects/select-base'
import SelectProductos, { type RefSelectProductosProps } from '~/app/_components/form/selects/select-productos'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import CardAgregarProductoGuia from '../cards/card-agregar-producto-guia'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'

export default function HeaderCrearGuia({
  guia,
  form,
}: {
  guia?: any
  form: FormInstance
}) {
  const { can } = usePermissionHook()

  // SUNAT (gob.pe/7899): la GRE-Transportista SOLO se usa cuando el traslado
  // es por transporte público. No existe GRE-Transportista privada — eso es
  // siempre una GRE-Remitente. Por eso, al elegir GRE-Transportista se fuerza
  // modalidad = PUBLICO y se bloquea el selector.
  const tipoGuia = Form.useWatch('tipo_guia', form) as string | undefined
  const esTransportista = tipoGuia === 'ELECTRONICA_TRANSPORTISTA'

  useEffect(() => {
    if (esTransportista) {
      form.setFieldValue('modalidad_transporte', 'PUBLICO')
    }
  }, [esTransportista, form])

  const selectProductosRef = useRef<RefSelectProductosProps>(null)

  const [openModalAgregarProducto, _setOpenModalAgregarProducto] =
    useState(false)

  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto
  )
  const setSearchText = useStoreProductoSeleccionadoSearch(
    (store) => store.setSearchText
  )
  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.producto
  )

  const setOpenModalAgregarProducto = (open: boolean) => {
    _setOpenModalAgregarProducto(open)
    if (!open) setSearchText('')
  }

  const handleAfterCloseModal = () => {
    selectProductosRef.current?.focus()
  }

  return (
    <TituloModulos
      title={`${guia ? 'Editar' : 'Crear'} Guía de Remisión`}
      icon={
        guia ? (
          <MdOutlineLocalShipping className='text-orange-600' />
        ) : (
          <TbTruckDelivery className='text-cyan-600' />
        )
      }
      extra={
        <div className='pl-0 lg:pl-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:gap-4 w-full lg:w-auto'>
          <div data-select-productos="crear-guia" className="contents">
          <SelectProductos
            ref={selectProductosRef}
            allowClear
            size='large'
            className='w-full lg:!min-w-[400px] lg:!w-[400px] lg:!max-w-[400px] font-normal!'
            classNameIcon='text-cyan-600 mx-1'
            classIconSearch='!mb-0'
            classIconPlus='mb-0!'
            showButtonCreate={can(permissions.PRODUCTO_CREATE)}
            withSearch
            withTipoBusqueda
            showCardAgregarProductoGuia
            showUltimasCompras={false}
            requireSearchToShow
            handleOnlyOneResult={(producto) => {
              setProductoSeleccionadoSearchStore(producto)
              if (producto) setOpenModalAgregarProducto(true)
            }}
            onChange={(_, producto) => {
              setProductoSeleccionadoSearchStore(producto)
              if (producto) setOpenModalAgregarProducto(true)
            }}
          />
          </div>
          {/* Tipo de Guía y Modalidad junto al buscador: son las dos decisiones
              que condicionan el resto del formulario. Requieren estar dentro
              del FormBase (ver body-crear-guia) para conectarse al form. */}
          <SelectBase
            propsForm={{
              name: 'tipo_guia',
              rules: [
                {
                  required: true,
                  message: 'Selecciona el tipo de guía',
                },
              ],
              className: '!mb-0',
            }}
            placeholder='Tipo de Guía...'
            size='large'
            className='w-full sm:!min-w-[230px] sm:!w-[230px] font-normal!'
            prefix={<TbTruckDelivery className='text-cyan-700 mx-1' />}
            options={[
              { label: 'GRE - Remitente', value: 'ELECTRONICA_REMITENTE' },
              { label: 'GRE - Transportista', value: 'ELECTRONICA_TRANSPORTISTA' },
              // { label: 'Guía Física', value: 'FISICA' },
            ]}
          />
          {/* La Modalidad solo se elige en GRE-Remitente (privado = vehículo
              propio, público = transportista tercero). En GRE-Transportista
              SUNAT exige siempre transporte público (el emisor transporta
              mercadería DE UN CLIENTE): el selector queda bloqueado en
              "Transporte público" (valor forzado vía useEffect). */}
          <ConfigurableElement
            componentId='crear-guia.modalidad'
            label='Campo Modalidad'
          >
            <SelectBase
              propsForm={{
                name: 'modalidad_transporte',
                rules: [
                  {
                    required: true,
                    message: 'Selecciona la modalidad',
                  },
                ],
                className: '!mb-0',
              }}
              placeholder='Modalidad...'
              size='large'
              disabled={esTransportista}
              className='w-full sm:!min-w-[190px] sm:!w-[190px] font-normal!'
              options={[
                { label: 'Transporte privado', value: 'PRIVADO' },
                { label: 'Transporte público', value: 'PUBLICO' },
              ]}
            />
          </ConfigurableElement>
        </div>
      }
    >
      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4'>
        {/* SelectAlmacen ahora se configura desde el dropdown global de Sucursales */}
        {/* <SelectAlmacen className='w-full' disabled={!!guia} /> */}

        <Modal
          open={openModalAgregarProducto}
          onCancel={() => setOpenModalAgregarProducto(false)}
          footer={null}
          title={
            <div className='text-xl font-bold text-left text-balance mb-3'>
              <span className='text-slate-400 block'>AGREGAR:</span>{' '}
              {productoSeleccionadoSearchStore?.name}
            </div>
          }
          width={typeof window !== 'undefined' && window.innerWidth >= 640 ? 300 : '95vw'}
          classNames={{ content: 'min-w-fit' }}
          destroyOnHidden
          maskClosable={false}
          keyboard={false}
          focusTriggerAfterClose={false}
          afterClose={handleAfterCloseModal}
        >
          <CardAgregarProductoGuia setOpen={setOpenModalAgregarProducto} />
        </Modal>
      </div>
    </TituloModulos>
  )
}
