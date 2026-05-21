'use client'

import { Suspense, lazy, useState } from 'react'
import { Form, Spin } from 'antd'
import { FaExchangeAlt, FaSearch, FaCalendar, FaPlusCircle } from 'react-icons/fa'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import ButtonBase from '~/components/buttons/button-base'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import { useStoreAlmacen } from '~/store/store-almacen'

import ModalTransferirStock from '../_components/modals/modal-transferir-stock'

const TableTransferenciasStock = lazy(
  () => import('./_components/tables/table-transferencias-stock'),
)

const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

interface FilterValues {
  almacen_id?: number
  desde?: Dayjs
  hasta?: Dayjs
}

export interface TransferenciasFilters {
  almacen_id?: number
  desde?: string
  hasta?: string
}

export default function MisTransferenciasPage() {
  const [form] = Form.useForm<FilterValues>()
  const almacenId = useStoreAlmacen((s) => s.almacen_id)
  const [openTransferir, setOpenTransferir] = useState(false)
  const [filters, setFilters] = useState<TransferenciasFilters>({
    almacen_id: almacenId || undefined,
    desde: dayjs().format('YYYY-MM-DD'),
    hasta: dayjs().format('YYYY-MM-DD'),
  })

  return (
    <ContenedorGeneral>
      <ModalTransferirStock open={openTransferir} setOpen={setOpenTransferir} />

      <FormBase
        form={form}
        name="filtros-mis-transferencias"
        initialValues={{
          almacen_id: almacenId,
          desde: dayjs(),
          hasta: dayjs(),
        }}
        className="w-full"
        onFinish={(values: FilterValues) => {
          setFilters({
            almacen_id: values.almacen_id || undefined,
            desde: values.desde ? values.desde.format('YYYY-MM-DD') : undefined,
            hasta: values.hasta ? values.hasta.format('YYYY-MM-DD') : undefined,
          })
        }}
      >
        <TituloModulos
          title="Mis Transferencias"
          icon={<FaExchangeAlt className="text-emerald-600" />}
        >
          <ButtonBase
            color="success"
            size="md"
            type="button"
            onClick={() => setOpenTransferir(true)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <FaPlusCircle />
            Transferir Stock
          </ButtonBase>
        </TituloModulos>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <SelectAlmacen
            propsForm={{
              name: 'almacen_id',
              hasFeedback: false,
              className: '!min-w-[220px] !w-[220px] !max-w-[220px]',
            }}
            className="w-full"
            formWithMessage={false}
            afecta_store={false}
            form={form}
          />
          <LabelBase label="Desde:">
            <DatePickerBase
              propsForm={{
                name: 'desde',
                hasFeedback: false,
                className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
              }}
              placeholder="Desde"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-cyan-600 mx-1" />}
              allowClear
            />
          </LabelBase>
          <LabelBase label="Hasta:">
            <DatePickerBase
              propsForm={{
                name: 'hasta',
                hasFeedback: false,
                className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
              }}
              placeholder="Hasta"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-cyan-600 mx-1" />}
              allowClear
            />
          </LabelBase>
          <ButtonBase
            color="info"
            size="md"
            type="submit"
            className="flex items-center gap-2"
          >
            <FaSearch />
            Buscar
          </ButtonBase>
        </div>
      </FormBase>

      {/* Tablas */}
      <div className="w-full mt-4 flex flex-col gap-4">
        <Suspense fallback={<ComponentLoading />}>
          <TableTransferenciasStock filters={filters} />
        </Suspense>
      </div>
    </ContenedorGeneral>
  )
}
