'use client'

import { Form } from 'antd'
import { FaSearch, FaArchive } from 'react-icons/fa'
import { FaCalendar } from 'react-icons/fa6'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectUsuarios from '~/app/_components/form/selects/select-usuarios'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect } from 'react'
import { useStoreFiltrosArqueos } from '../_store/store-filtros-arqueos'

interface ValuesFiltersFiltrosArqueos {
  fecha_inicio?: Dayjs
  fecha_fin?: Dayjs
  user_id?: string
}

export default function FiltrosArqueos() {
  const [form] = Form.useForm<ValuesFiltersFiltrosArqueos>()
  const setFiltros = useStoreFiltrosArqueos(state => state.setFiltros)

  useEffect(() => {
    setFiltros({
      fecha_inicio: dayjs().format('YYYY-MM-DD'),
      fecha_fin: dayjs().format('YYYY-MM-DD'),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormBase
      form={form}
      name='filtros-arqueos-diarios'
      initialValues={{
        fecha_inicio: dayjs(),
        fecha_fin: dayjs(),
      }}
      className='w-full'
      onFinish={values => {
        setFiltros({
          fecha_inicio: values.fecha_inicio?.format('YYYY-MM-DD'),
          fecha_fin: values.fecha_fin?.format('YYYY-MM-DD'),
          user_id: values.user_id,
        })
      }}
    >
      <TituloModulos
        title='Arqueos Diarios'
        icon={<FaArchive className='text-amber-600' />}
      />

      <div className='flex items-center gap-2 w-full mt-4 overflow-x-auto'>
        <div className='hidden lg:flex items-end gap-3 flex-nowrap min-w-max w-full'>
          <ConfigurableElement componentId='facturacion.arqueos-diarios.filtro-fecha-desde' label='Filtro Fecha Desde'>
            <LabelBase label='Fecha:'>
              <DatePickerBase
                propsForm={{
                  name: 'fecha_inicio',
                  hasFeedback: false,
                  className: '!min-w-[140px] !w-[140px] !max-w-[140px]',
                }}
                placeholder='Desde'
                formWithMessage={false}
                prefix={<FaCalendar size={15} className='text-amber-600 mx-1' />}
                allowClear
              />
            </LabelBase>
          </ConfigurableElement>

          <ConfigurableElement componentId='facturacion.arqueos-diarios.filtro-fecha-hasta' label='Filtro Fecha Hasta'>
            <LabelBase label='Hasta:'>
              <DatePickerBase
                propsForm={{
                  name: 'fecha_fin',
                  hasFeedback: false,
                  className: '!min-w-[140px] !w-[140px] !max-w-[140px]',
                }}
                placeholder='Hasta'
                formWithMessage={false}
                prefix={<FaCalendar size={15} className='text-amber-600 mx-1' />}
                allowClear
              />
            </LabelBase>
          </ConfigurableElement>

          <ConfigurableElement componentId='facturacion.arqueos-diarios.filtro-usuario' label='Filtro Usuario'>
            <LabelBase label='Usuario:'>
              <Form.Item name='user_id' className='!mb-0'>
                <SelectUsuarios
                  placeholder='Todos los usuarios'
                  allowClear
                  className='!min-w-[200px] !w-[200px] !max-w-[200px]'
                />
              </Form.Item>
            </LabelBase>
          </ConfigurableElement>

          <ConfigurableElement componentId='facturacion.arqueos-diarios.boton-buscar' label='Botón Buscar'>
            <ButtonBase
              type='submit'
              color='info'
              size='sm'
              className='flex items-center gap-1 px-2 !h-[32px]'
            >
              <FaSearch size={12} />
              BUSCAR
            </ButtonBase>
          </ConfigurableElement>
        </div>

        <div className='flex lg:hidden items-center gap-2 w-full'>
          <div className='flex-1' />
          <ButtonBase
            type='submit'
            color='info'
            size='md'
            className='flex items-center gap-2 flex-shrink-0'
          >
            <FaSearch />
            BUSCAR
          </ButtonBase>
        </div>
      </div>
    </FormBase>
  )
}
