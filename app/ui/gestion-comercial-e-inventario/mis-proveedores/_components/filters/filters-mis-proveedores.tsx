'use client'

import { Form, Switch } from 'antd'
import { FaSearch, FaTruck, FaPlus } from 'react-icons/fa'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useStoreFiltrosMisProveedores } from '../../_store/store-filtros-mis-proveedores'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import ModalCreateProveedor from '../modals/modal-create-proveedor'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface ValuesFiltersMisProveedores {
  search?: string
  estado?: string
  calificacion?: string
  ordenar_por?: boolean
}

export default function FiltersMisProveedores() {
  const [form] = Form.useForm<ValuesFiltersMisProveedores>()
  const { setFiltros } = useStoreFiltrosMisProveedores()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)

  const handleFinish = (values: ValuesFiltersMisProveedores) => {
    const data: any = {}
    if (values.search) data.search = values.search
    if (values.estado !== undefined && values.estado !== '') data.estado = values.estado === 'true'
    if (values.calificacion !== undefined && values.calificacion !== '') data.calificacion = values.calificacion
    if (values.ordenar_por) data.ordenar_por = 'compras'
    setFiltros(data)
    queryClient.invalidateQueries({ queryKey: [QueryKeys.PROVEEDORES] })
  }

  return (
    <>
      <FormBase form={form} name="filtros-mis-proveedores" className="w-full" onFinish={handleFinish}>
        <TituloModulos title="Mis Proveedores" icon={<FaTruck className="text-green-600" />} />

        <div className="mt-4">
          <div className="grid grid-cols-12 gap-x-2 gap-y-2 items-center">
            {/* Buscar */}
            <div className="col-span-3 flex items-center gap-1">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Buscar:</label>
              <InputBase
                propsForm={{ name: 'search', hasFeedback: false, className: '!w-full' }}
                placeholder="RUC, Razón Social, Teléfono..."
                formWithMessage={false}
              />
            </div>

            {/* Estado */}
            <div className="col-span-2 flex items-center gap-1">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Estado:</label>
              <SelectBase
                propsForm={{ name: 'estado', hasFeedback: false, className: '!w-full' }}
                className="w-full"
                formWithMessage={false}
                allowClear
                placeholder="Todos"
                options={[
                  { value: 'true', label: 'Activo' },
                  { value: 'false', label: 'Inactivo' },
                ]}
              />
            </div>

            {/* Calificación */}
            <div className="col-span-2 flex items-center gap-1">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Calificación:</label>
              <SelectBase
                propsForm={{ name: 'calificacion', hasFeedback: false, className: '!w-full' }}
                className="w-full"
                formWithMessage={false}
                allowClear
                placeholder="Todos"
                options={[
                  { value: 'excelente', label: 'Excelente' },
                  { value: 'bueno', label: 'Bueno' },
                  { value: 'regular', label: 'Regular' },
                  { value: 'malo', label: 'Malo' },
                ]}
              />
            </div>

            {/* Switch Más Compras */}
            <div className="col-span-2 flex items-center gap-2">
              <Form.Item name="ordenar_por" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Más compras</label>
            </div>

            {/* Buscar + Crear */}
            <div className="col-span-3 flex items-center gap-2 justify-end">
              <ButtonBase color="info" size="md" type="submit" className="flex items-center gap-2 justify-center h-10">
                <FaSearch />
                Buscar
              </ButtonBase>
              <button 
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors"
                title="Crear nuevo proveedor"
              >
                <FaPlus size={12} />
              </button>
            </div>
          </div>
        </div>
      </FormBase>

      {/* Modal Crear Proveedor */}
      <ModalCreateProveedor
        open={modalOpen}
        setOpen={setModalOpen}
        onSuccess={() => {
          setModalOpen(false)
          queryClient.invalidateQueries({ queryKey: [QueryKeys.PROVEEDORES] })
        }}
      />
    </>
  )
}
