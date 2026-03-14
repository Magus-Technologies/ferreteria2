'use client'

import { Form, Select, Drawer, Badge } from 'antd'
import { FaSearch, FaFilter, FaPlusCircle } from 'react-icons/fa'
import { FaClipboardList } from 'react-icons/fa6'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import { useStoreFiltrosSolicitudOC } from '../../_store/store-filtros-solicitud-oc'
import { useState } from 'react'
import type { RequerimientoFilters } from '~/lib/api/requerimiento-interno'

interface ValuesFiltersSolicitudOC {
  estado?: string
  prioridad?: string
  search?: string
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
  const setFiltros = useStoreFiltrosSolicitudOC(state => state.setFiltros)

  const handleFinish = (values: ValuesFiltersSolicitudOC) => {
    const filtros: RequerimientoFilters = {
      tipo_solicitud: 'SOC',
      estado: values.estado,
      prioridad: values.prioridad,
      search: values.search,
    }
    setFiltros(filtros)
    setDrawerOpen(false)
  }

  return (
    <FormBase
      form={form}
      name="filtros-solicitud-oc"
      className="w-full"
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Solicitud de Orden de Compra"
        icon={<FaClipboardList className="text-emerald-600" />}
      />

      {/* Desktop filters */}
      <div className="flex items-center justify-between w-full mt-2 gap-2 flex-wrap">
        <div className="hidden lg:flex items-center gap-1.5 flex-nowrap shrink-0">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-medium text-slate-500">Estado:</span>
            <Form.Item name="estado" className="!mb-0">
              <Select
                placeholder="Todos"
                allowClear
                options={ESTADO_OPTIONS}
                className="!w-[130px]"
              />
            </Form.Item>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-medium text-slate-500">Prioridad:</span>
            <Form.Item name="prioridad" className="!mb-0">
              <Select
                placeholder="Todas"
                allowClear
                options={PRIORIDAD_OPTIONS}
                className="!w-[120px]"
              />
            </Form.Item>
          </div>

          <ButtonBase color="info" size="md" type="submit" className="flex items-center gap-2 shrink-0 py-1.5">
            <FaSearch size={14} />
            Buscar
          </ButtonBase>
        </div>

        {/* Desktop: button nueva */}
        <div className="hidden lg:block shrink-0">
          <ButtonBase color="success" size="md" type="button" onClick={onNueva} className="flex items-center gap-2 whitespace-nowrap py-1.5">
            <FaPlusCircle />
            Nueva Solicitud
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
          <ButtonBase color="info" size="md" type="submit">
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
            <ButtonBase color="default" className="flex-1" onClick={() => form.resetFields()}>Limpiar</ButtonBase>
            <ButtonBase color="info" className="flex-1" type="submit">Aplicar</ButtonBase>
          </div>
        </div>
      </Drawer>
    </FormBase>
  )
}
