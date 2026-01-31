'use client'

import { Form } from 'antd'
import { useStoreFiltrosMisGuias } from '../../_store/store-filtros-mis-guias'
import FormBase from '~/components/form/form-base'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import { FaCalendar, FaSearch, FaTruckLoading } from 'react-icons/fa'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import ButtonBase from '~/components/buttons/button-base'
import dayjs from 'dayjs'
import { useEffect } from 'react'

export default function FiltersMisGuias() {
  const [form] = Form.useForm()
  const { setFiltros } = useStoreFiltrosMisGuias()

  useEffect(() => {
    // Inicializar con fechas por defecto
    const data = {
      fecha_desde: dayjs().startOf('day'),
      fecha_hasta: dayjs().endOf('day'),
    }
    setFiltros(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFinish = (values: any) => {
    const { fecha_desde, fecha_hasta, ...rest } = values

    const data: any = {
      ...rest,
      ...(fecha_desde ? { fecha_desde } : {}),
      ...(fecha_hasta ? { fecha_hasta } : {}),
    }

    // Limpiar valores undefined, null o vacíos
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined || data[key] === null || data[key] === '') {
        delete data[key]
      }
    })

    console.log('🔍 Filtros aplicados:', data)
    setFiltros(data)
  }

  return (
    <FormBase
      form={form}
      name='filtros-mis-guias'
      initialValues={{
        fecha_desde: dayjs().startOf('day'),
        fecha_hasta: dayjs().endOf('day'),
      }}
      className='w-full'
      onFinish={handleFinish}
    >
      <TituloModulos
        title='Mis Guías'
        icon={<FaTruckLoading className='text-orange-600' />}
      />

      {/* Filtros Desktop */}
      <div className='mt-4'>
        <div className='grid grid-cols-12 gap-x-3 gap-y-2.5'>
          {/* Fila 1 */}
          <div className='col-span-2 flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Fecha Desde:
            </label>
            <ConfigurableElement
              componentId='mis-guias.filtro-fecha-desde'
              label='Campo Fecha Desde'
            >
              <DatePickerBase
                propsForm={{
                  name: 'fecha_desde',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                placeholder='Fecha'
                formWithMessage={false}
                prefix={
                  <FaCalendar size={15} className='text-orange-600 mx-1' />
                }
                allowClear
              />
            </ConfigurableElement>
          </div>

          <div className='col-span-2 flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Hasta:
            </label>
            <ConfigurableElement
              componentId='mis-guias.filtro-fecha-hasta'
              label='Campo Fecha Hasta'
            >
              <DatePickerBase
                propsForm={{
                  name: 'fecha_hasta',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                placeholder='Hasta'
                formWithMessage={false}
                prefix={
                  <FaCalendar size={15} className='text-orange-600 mx-1' />
                }
                allowClear
              />
            </ConfigurableElement>
          </div>

          <div className='col-span-2 flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Estado:
            </label>
            <ConfigurableElement
              componentId='mis-guias.filtro-estado'
              label='Campo Estado'
            >
              <SelectBase
                propsForm={{
                  name: 'estado',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                className='w-full'
                formWithMessage={false}
                allowClear
                placeholder='Todos'
                options={[
                  { label: 'Borrador', value: 'BORRADOR' },
                  { label: 'Emitida', value: 'EMITIDA' },
                  { label: 'Anulada', value: 'ANULADA' },
                ]}
              />
            </ConfigurableElement>
          </div>

          <div className='col-span-3 flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Tipo de Guía:
            </label>
            <ConfigurableElement
              componentId='mis-guias.filtro-tipo-guia'
              label='Campo Tipo de Guía'
            >
              <SelectBase
                propsForm={{
                  name: 'tipo_guia',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                className='w-full'
                formWithMessage={false}
                allowClear
                placeholder='Todos'
                options={[
                  { label: 'E-Remitente', value: 'ELECTRONICA_REMITENTE' },
                  { label: 'E-Transportista', value: 'ELECTRONICA_TRANSPORTISTA' },
                  { label: 'Física', value: 'FISICA' },
                ]}
              />
            </ConfigurableElement>
          </div>

          <div className='col-span-2 flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Buscar:
            </label>
            <ConfigurableElement
              componentId='mis-guias.filtro-buscar'
              label='Campo Buscar'
            >
              <InputBase
                propsForm={{
                  name: 'search',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                placeholder='Serie, cliente...'
                formWithMessage={false}
              />
            </ConfigurableElement>
          </div>

          <div className='col-span-1 flex items-center gap-2'>
            <ConfigurableElement
              componentId='mis-guias.boton-buscar'
              label='Botón Buscar'
            >
              <ButtonBase
                color='info'
                size='md'
                type='submit'
                className='flex items-center gap-2 w-full justify-center'
              >
                <FaSearch />
                Buscar
              </ButtonBase>
            </ConfigurableElement>
          </div>
        </div>
      </div>
    </FormBase>
  )
}
