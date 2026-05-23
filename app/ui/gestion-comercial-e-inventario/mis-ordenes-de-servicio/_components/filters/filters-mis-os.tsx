'use client'

import { Form, Select, Drawer, Badge, Input } from 'antd'
import { FaSearch, FaFilter, FaPlusCircle } from 'react-icons/fa'
import { FaWrench, FaCalendar } from 'react-icons/fa6'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import { useStoreFiltrosMisOS } from '../../_store/store-filtros-mis-os'
import { useState } from 'react'
import type { RequerimientoFilters } from '~/lib/api/requerimiento-interno'
import dayjs, { type Dayjs } from 'dayjs'

interface ValuesFiltersMisOS {
  desde?: Dayjs
  hasta?: Dayjs
  approval_state?: string
  prioridad?: string
  search?: string
}

const APPROVAL_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Aprobado', value: 'aprobado' },
]

const PRIORIDAD_OPTIONS = [
  { label: 'Todas', value: '' },
  { label: 'Baja', value: 'BAJA' },
  { label: 'Media', value: 'MEDIA' },
  { label: 'Alta', value: 'ALTA' },
  { label: 'Urgente', value: 'URGENTE' },
]

export default function FiltersMisOS({
  onNueva,
}: {
  onNueva: () => void
}) {
  const [form] = Form.useForm<ValuesFiltersMisOS>()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const setFiltros = useStoreFiltrosMisOS(state => state.setFiltros)

  const handleFinish = (values: ValuesFiltersMisOS) => {
    const filtros: RequerimientoFilters = {
      tipo_solicitud: 'OS',
      approval_state: values.approval_state || undefined,
      prioridad: values.prioridad || undefined,
      search: values.search,
      desde: values.desde ? values.desde.format('YYYY-MM-DD') : undefined,
      hasta: values.hasta ? values.hasta.format('YYYY-MM-DD') : undefined,
      searchTrigger: Date.now(),
    }
    setFiltros(filtros)
    setDrawerOpen(false)
  }

  return (
    <FormBase
      form={form}
      name="filtros-mis-os"
      initialValues={{
        desde: dayjs().startOf('day'),
        hasta: dayjs().endOf('day'),
        approval_state: '',
        prioridad: '',
      }}
      className="w-full"
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Mis Órdenes de Servicio"
        icon={<FaWrench className="text-emerald-600" />}
      />

      {/* Desktop filters */}
      <div className="flex items-center justify-between w-full mt-2 gap-2 flex-wrap">
        <div className="hidden lg:flex items-center gap-1.5 flex-nowrap shrink-0">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Desde:</span>
            <DatePickerBase
              propsForm={{ name: "desde", hasFeedback: false, className: "!mb-0" }}
              className="!w-[140px]"
              prefix={<FaCalendar size={12} className="text-emerald-600" />}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Hasta:</span>
            <DatePickerBase
              propsForm={{ name: "hasta", hasFeedback: false, className: "!mb-0" }}
              className="!w-[140px]"
              prefix={<FaCalendar size={12} className="text-emerald-600" />}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Form.Item name="search" className="!mb-0">
              <Input
                placeholder="Buscar (Título, Código, Cargo)"
                prefix={<FaSearch className="text-slate-400" />}
                className="!w-[250px]"
                allowClear
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Aprobación:</span>
            <Form.Item name="approval_state" className="!mb-0">
              <Select
                placeholder="Todos"
                allowClear
                options={APPROVAL_OPTIONS}
                className="!w-[130px]"
              />
            </Form.Item>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Prioridad:</span>
            <Form.Item name="prioridad" className="!mb-0">
              <Select
                placeholder="Todas"
                allowClear
                options={PRIORIDAD_OPTIONS}
                className="!w-[120px]"
              />
            </Form.Item>
          </div>

          {/* Botón buscador desktop */}
          <ButtonBase color="info" size="md" type="button" onClick={() => form.submit()} className="flex items-center gap-2 shrink-0">
            <FaSearch />
            Buscar
          </ButtonBase>
        </div>

        {/* Desktop: button nueva */}
        <div className="hidden lg:block shrink-0">
          <ButtonBase color="success" size="md" type="button" onClick={onNueva} className="flex items-center gap-2 whitespace-nowrap py-1.5">
            <FaPlusCircle />
            Nueva Orden de Servicio
          </ButtonBase>
        </div>

        {/* Mobile controls */}
        <div className="flex lg:hidden items-center gap-2 w-full">
          <div className="flex-1">
            <Badge count={0} offset={[-5, 5]} className="w-full">
              <ButtonBase color="warning" size="md" type="button" onClick={() => setDrawerOpen(true)} className="w-full flex items-center justify-center gap-2">
                <FaFilter />
                Filtros
              </ButtonBase>
            </Badge>
          </div>
          <ButtonBase color="info" size="md" type="button" onClick={() => form.submit()}>
            <FaSearch />
          </ButtonBase>
          <ButtonBase color="success" size="md" type="button" onClick={onNueva}>
            <FaPlusCircle />
          </ButtonBase>
        </div>
      </div>

      <Drawer
        title="Filtros de Búsqueda"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        <div className="flex flex-col gap-4">
          <LabelBase label="Desde:">
            <DatePickerBase
              propsForm={{ name: "desde", hasFeedback: false, className: "!mb-0 w-full" }}
              className="w-full"
              prefix={<FaCalendar size={12} className="text-emerald-600" />}
            />
          </LabelBase>
          <LabelBase label="Hasta:">
            <DatePickerBase
              propsForm={{ name: "hasta", hasFeedback: false, className: "!mb-0 w-full" }}
              className="w-full"
              prefix={<FaCalendar size={12} className="text-emerald-600" />}
            />
          </LabelBase>
          <LabelBase label="Buscar:">
            <Form.Item name="search" className="!mb-0 w-full">
              <Input
                placeholder="Título, Código, Cargo"
                prefix={<FaSearch className="text-slate-400" />}
                className="w-full"
                allowClear
              />
            </Form.Item>
          </LabelBase>
          <LabelBase label="Aprobación:">
            <Form.Item name="approval_state" className="!mb-0 w-full">
              <Select placeholder="Todos" allowClear options={APPROVAL_OPTIONS} className="w-full" />
            </Form.Item>
          </LabelBase>
          <LabelBase label="Prioridad:">
            <Form.Item name="prioridad" className="!mb-0 w-full">
              <Select placeholder="Todas" allowClear options={PRIORIDAD_OPTIONS} className="w-full" />
            </Form.Item>
          </LabelBase>
          <div className="flex gap-2 mt-4">
            <ButtonBase color="default" className="flex-1" onClick={() => form.resetFields()}>Limpiar</ButtonBase>
            <ButtonBase color="info" className="flex-1" type="submit">Aplicar</ButtonBase>
          </div>
        </div>
      </Drawer>
    </FormBase>
  )
}
