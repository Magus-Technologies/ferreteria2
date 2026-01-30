'use client'

import { Form } from 'antd'
import { FaCalendar, FaSearch, FaTruck } from 'react-icons/fa'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import { useStoreFiltrosMisEntregas } from '../../_store/store-filtros-mis-entregas'
import dayjs from 'dayjs'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

interface ValuesFiltersMisEntregas {
  fecha_desde?: dayjs.Dayjs
  fecha_hasta?: dayjs.Dayjs
  estado_entrega?: 'PENDIENTE' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO'
  tipo_despacho?: 'INMEDIATO' | 'PROGRAMADO'
  search?: string
}

export default function FiltersMisEntregas() {
  const [form] = Form.useForm<ValuesFiltersMisEntregas>()
  const setFiltros = useStoreFiltrosMisEntregas((state) => state.setFiltros)

  const handleFinish = (values: ValuesFiltersMisEntregas) => {
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

    setFiltros(data)
  }

  return (
    <FormBase
      form={form}
      name="filtros-mis-entregas"
      initialValues={{
        fecha_desde: dayjs().startOf('month'),
        fecha_hasta: dayjs().endOf('month'),
      }}
      className="w-full"
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Mis Entregas"
        icon={<FaTruck className="text-amber-600" />}
      />

      {/* Filtros Desktop */}
      <div className="mt-4">
        <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
          {/* Fila 1 */}
          <ConfigurableElement
            componentId="mis-entregas.filtro-fecha-desde"
            label="Filtro Fecha Desde"
          >
            <div className="col-span-2 flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                Fecha Desde:
              </label>
              <DatePickerBase
                propsForm={{
                  name: 'fecha_desde',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                placeholder="Fecha"
                formWithMessage={false}
                prefix={
                  <FaCalendar size={15} className="text-amber-600 mx-1" />
                }
                allowClear
              />
            </div>
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-entregas.filtro-fecha-hasta"
            label="Filtro Fecha Hasta"
          >
            <div className="col-span-2 flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                Hasta:
              </label>
              <DatePickerBase
                propsForm={{
                  name: 'fecha_hasta',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                placeholder="Hasta"
                formWithMessage={false}
                prefix={
                  <FaCalendar size={15} className="text-amber-600 mx-1" />
                }
                allowClear
              />
            </div>
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-entregas.filtro-estado"
            label="Filtro Estado"
          >
            <div className="col-span-2 flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                Estado:
              </label>
              <SelectBase
                propsForm={{
                  name: 'estado_entrega',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                className="w-full"
                formWithMessage={false}
                allowClear
                placeholder="Todos"
                options={[
                  { value: 'PENDIENTE', label: '⏳ Pendiente' },
                  { value: 'EN_CAMINO', label: '🚚 En Camino' },
                  { value: 'ENTREGADO', label: '✅ Entregado' },
                  { value: 'CANCELADO', label: '❌ Cancelado' },
                ]}
              />
            </div>
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-entregas.filtro-tipo-despacho"
            label="Filtro Tipo Despacho"
          >
            <div className="col-span-2 flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                Tipo:
              </label>
              <SelectBase
                propsForm={{
                  name: 'tipo_despacho',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                className="w-full"
                formWithMessage={false}
                allowClear
                placeholder="Todos"
                options={[
                  { value: 'INMEDIATO', label: '⚡ Inmediato' },
                  { value: 'PROGRAMADO', label: '📅 Programado' },
                ]}
              />
            </div>
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-entregas.filtro-buscar"
            label="Filtro Buscar"
          >
            <div className="col-span-3 flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                Buscar:
              </label>
              <InputBase
                propsForm={{
                  name: 'search',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                placeholder="Cliente, N° Venta..."
                formWithMessage={false}
                prefix={<FaSearch size={14} className="text-amber-600 mx-1" />}
              />
            </div>
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-entregas.boton-buscar"
            label="Botón Buscar"
          >
            <div className="col-span-1 flex items-center gap-2">
              <ButtonBase
                color="info"
                size="md"
                type="submit"
                className="flex items-center gap-2 w-full justify-center"
              >
                <FaSearch />
                Buscar
              </ButtonBase>
            </div>
          </ConfigurableElement>
        </div>
      </div>
    </FormBase>
  )
}
