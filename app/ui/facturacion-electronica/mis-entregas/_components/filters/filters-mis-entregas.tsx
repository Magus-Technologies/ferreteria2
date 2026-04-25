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
import NotificationPermissionButton from '~/components/notifications/notification-permission-button'
import { useAuth } from '~/lib/auth-context'
import { useDebounce } from 'use-debounce'
import { useState, useEffect } from 'react'

interface ValuesFiltersMisEntregas {
  fecha_desde?: dayjs.Dayjs
  fecha_hasta?: dayjs.Dayjs
  estado_entrega?: string[]
  tipo_despacho?: 'in' | 'pr'
  tipo_entrega?: 'rt' | 'de' | 'pa'
  search?: string
}

export default function FiltersMisEntregas() {
  const [form] = Form.useForm<ValuesFiltersMisEntregas>()
  const setFiltros = useStoreFiltrosMisEntregas((state) => state.setFiltros)
  const { user } = useAuth()
  const esDespachador = user?.rol_sistema === 'DESPACHADOR'
 
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearch] = useDebounce(searchValue, 500)
 
  useEffect(() => {
    form.submit()
  }, [debouncedSearch, form])

  const handleFinish = (values: ValuesFiltersMisEntregas) => {
    const estados = values.estado_entrega
    const estadoFinal = Array.isArray(estados) && estados.length > 0 ? estados : undefined

    setFiltros({
      fecha_desde: values.fecha_desde || dayjs().startOf('day'),
      fecha_hasta: values.fecha_hasta || dayjs().endOf('day'),
      estado_entrega: estadoFinal,
      tipo_despacho: values.tipo_despacho || undefined,
      tipo_entrega: values.tipo_entrega || undefined,
      search: values.search || undefined,
    })
  }

  return (
    <FormBase
      form={form}
      name="filtros-mis-entregas"
      initialValues={{
        fecha_desde: dayjs().startOf('day'),
        fecha_hasta: dayjs().endOf('day'),
        estado_entrega: ['pe', 'ec', 'en'],
      }}
      className="w-full"
      onValuesChange={() => form.submit()}
      onFinish={handleFinish}
    >
      <div className="flex items-center justify-between">
        <TituloModulos
          title="Mis Entregas"
          icon={<FaTruck className="text-amber-600" />}
        />
        {/* Botón de notificaciones para despachadores */}
        {esDespachador && (
          <NotificationPermissionButton showLabel size="small" />
        )}
      </div>

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
                mode="multiple"
                placeholder="Todos"
                maxTagCount="responsive"
                options={[
                  { value: 'pe', label: '⏳ Pendiente' },
                  { value: 'ec', label: '🚚 En Camino' },
                  { value: 'en', label: '✅ Entregado' },
                  { value: 'ca', label: '❌ Cancelado' },
                ]}
              />
            </div>
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-entregas.filtro-tipo-entrega"
            label="Filtro Tipo Entrega"
          >
            <div className="col-span-2 flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                Entrega:
              </label>
              <SelectBase
                propsForm={{
                  name: 'tipo_entrega',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                className="w-full"
                formWithMessage={false}
                allowClear
                placeholder="Todos"
                options={[
                  { value: 'rt', label: '🏪 Recojo Tienda' },
                  { value: 'de', label: '🏠 Despacho' },
                  { value: 'pa', label: '🔀 Parcial' },
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
                Despacho:
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
                  { value: 'in', label: '⚡ Inmediato' },
                  { value: 'pr', label: '📅 Programado' },
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
                onChange={(e) => setSearchValue(e.target.value)}
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
