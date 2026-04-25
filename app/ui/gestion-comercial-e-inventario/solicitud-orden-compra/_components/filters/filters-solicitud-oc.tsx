'use client'

import { Form, Select, Drawer, Badge, Input } from 'antd'
import { FaSearch, FaFilter, FaPlusCircle } from 'react-icons/fa'
import { FaClipboardList, FaCalendar } from 'react-icons/fa6'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import { useStoreFiltrosSolicitudOC } from '../../_store/store-filtros-solicitud-oc'
import { useEffect, useState, useMemo } from 'react'
import type { RequerimientoFilters } from '~/lib/api/requerimiento-interno'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import dayjs, { Dayjs } from 'dayjs'
import { useDebounce } from 'use-debounce'

interface ValuesFiltersSolicitudOC {
  estado?: string
  prioridad?: string
  search?: string
  desde?: Dayjs
  hasta?: Dayjs
}

const ESTADO_OPTIONS = [
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Aprobado', value: 'aprobado' },
  { label: 'Rechazado', value: 'rechazado' },
  { label: 'Anulado', value: 'anulado' },
]

const PRIORIDAD_OPTIONS = [
  { label: 'Baja', value: 'BAJA' },
  { label: 'Media', value: 'MEDIA' },
  { label: 'Alta', value: 'ALTA' },
  { label: 'Urgente', value: 'URGENTE' },
]

export default function FiltersSolicitudOC({
  onNueva,
}: {
  onNueva: () => void
}) {
  const [form] = Form.useForm<ValuesFiltersSolicitudOC>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue] = useDebounce(searchValue, 500)
  
  const setFiltros = useStoreFiltrosSolicitudOC(state => state.setFiltros)

  // Contar filtros activos (excluyendo el default de tipo_solicitud)
  const activeFiltersCount = useMemo(() => {
    const values = form.getFieldsValue()
    let count = 0
    if (values.estado) count++
    if (values.prioridad) count++
    if (values.search) count++
    if (values.desde) count++
    if (values.hasta) count++
    return count
  }, [form])

  // Inicializar con filtro de hoy por defecto
  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD')
    const initialFilters: RequerimientoFilters = {
      desde: today,
      hasta: today,
    }
    setFiltros(initialFilters)
    form.setFieldsValue({
      desde: dayjs(),
      hasta: dayjs(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Trigger search when debounced value changes
  useEffect(() => {
    form.submit()
  }, [debouncedSearchValue, form])

  const handleFinish = (values: ValuesFiltersSolicitudOC) => {
    const { desde, hasta, ...rest } = values
    const filtros: RequerimientoFilters = {
      ...rest,
      desde: desde ? desde.format('YYYY-MM-DD') : undefined,
      hasta: hasta ? hasta.format('YYYY-MM-DD') : undefined,
      search: values.search || searchValue || undefined
    }
    setFiltros(filtros)
    setDrawerOpen(false)
  }

  return (
    <FormBase
      form={form}
      name="filtros-solicitud-oc"
      className="w-full"
      initialValues={{}}
      onValuesChange={(changedValues) => {
        if ('search' in changedValues) {
          setSearchValue(changedValues.search)
        } else {
          form.submit()
        }
      }}
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Solicitudes de Compras"
        icon={<FaClipboardList className="text-emerald-600" />}
      >
        <div className="hidden lg:flex items-center gap-4 ml-auto">
           <ButtonBase color="success" size="md" type="button" onClick={onNueva} className="flex items-center gap-2 whitespace-nowrap py-1.5">
            <FaPlusCircle />
            Nueva Solicitud
          </ButtonBase>
        </div>
      </TituloModulos>

      {/* Desktop filters bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between w-full mt-2 gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Real-time search */}
          <Form.Item name="search" className="!mb-0 flex-1 lg:flex-none">
            <Input
              placeholder="Buscar por código, título o cargo..."
              prefix={<FaSearch className="text-slate-400" />}
              className="!w-full lg:!w-[300px]"
              allowClear
            />
          </Form.Item>

          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] font-medium text-slate-500">Desde:</span>
              <DatePickerBase
                propsForm={{ name: 'desde', className: '!mb-0' }}
                placeholder="Desde"
                className="!w-[130px]"
                size="middle"
                prefix={<FaCalendar className="text-emerald-600" />}
                allowClear
              />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] font-medium text-slate-500">Hasta:</span>
              <DatePickerBase
                propsForm={{ name: 'hasta', className: '!mb-0' }}
                placeholder="Hasta"
                className="!w-[130px]"
                size="middle"
                prefix={<FaCalendar className="text-emerald-600" />}
                allowClear
              />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] font-medium text-slate-500">Estado:</span>
              <Form.Item name="estado" className="!mb-0">
                <Select
                  placeholder="Todos"
                  allowClear
                  options={ESTADO_OPTIONS}
                  className="!w-[120px]"
                />
              </Form.Item>
            </div>
          </div>

          <ButtonBase 
            color="info" 
            size="md" 
            type="button" 
            onClick={() => {
              form.setFieldsValue({
                desde: undefined,
                hasta: undefined,
                estado: undefined,
                prioridad: undefined,
                search: '',
              })
              setSearchValue('')
              const filtros: RequerimientoFilters = {}
              setFiltros(filtros)
            }}
            className="hidden lg:flex items-center gap-2 py-1.5"
          >
            <FaSearch size={14} />
            Refrescar
          </ButtonBase>
        </div>

        {/* Mobile controls */}
        <div className="flex lg:hidden items-center gap-2 w-full mt-2">
          <div className="flex-1">
            <Badge count={activeFiltersCount} offset={[-5, 5]} className="w-full">
              <ButtonBase color="warning" size="md" type="button" onClick={() => setDrawerOpen(true)} className="w-full flex items-center justify-center gap-2">
                <FaFilter />
                Filtros
              </ButtonBase>
            </Badge>
          </div>
          <ButtonBase color="success" size="md" type="button" onClick={onNueva} className="flex-shrink-0">
            <FaPlusCircle />
          </ButtonBase>
        </div>
      </div>

      <Drawer
        title="Filtros Solicitud OC"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        <div className="flex flex-col gap-4">
          <LabelBase label="Fecha Desde:">
            <DatePickerBase
              propsForm={{ name: 'desde' }}
              placeholder="Fecha Desde"
              className="w-full"
            />
          </LabelBase>
          <LabelBase label="Fecha Hasta:">
            <DatePickerBase
              propsForm={{ name: 'hasta' }}
              placeholder="Fecha Hasta"
              className="w-full"
            />
          </LabelBase>
          <LabelBase label="Estado:">
            <Form.Item name="estado" className="!mb-0 w-full">
              <Select placeholder="Todos" allowClear options={ESTADO_OPTIONS} className="w-full" />
            </Form.Item>
          </LabelBase>
          <LabelBase label="Prioridad:">
            <Form.Item name="prioridad" className="!mb-0 w-full">
              <Select placeholder="Todas" allowClear options={PRIORIDAD_OPTIONS} className="w-full" />
            </Form.Item>
          </LabelBase>
          <div className="flex gap-2 mt-4">
            <ButtonBase 
              color="default" 
              className="flex-1" 
              onClick={() => {
                form.resetFields()
                setSearchValue('')
                form.submit()
              }}
            >
              Limpiar
            </ButtonBase>
            <ButtonBase color="info" className="flex-1" type="submit">Aplicar</ButtonBase>
          </div>
        </div>
      </Drawer>
    </FormBase>
  )
}

