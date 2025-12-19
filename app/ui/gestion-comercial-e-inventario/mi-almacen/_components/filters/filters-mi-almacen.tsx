'use client'

import { Form } from 'antd'
import { FaBoxOpen, FaSearch } from 'react-icons/fa'
import { IoDocumentText } from 'react-icons/io5'
import { PiWarehouseFill } from 'react-icons/pi'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import SelectCSComision, {
  CSComision,
} from '~/app/_components/form/selects/select-c-s-comision'
import SelectCSStock, {
  CSStock,
} from '~/app/_components/form/selects/select-c-s-stock'
import SelectCategorias from '~/app/_components/form/selects/select-categorias'
import SelectEstado from '~/app/_components/form/selects/select-estado'
import SelectMarcas from '~/app/_components/form/selects/select-marcas'
import SelectUbicaciones from '~/app/_components/form/selects/select-ubicaciones'
import SelectUnidadDeMedida from '~/app/_components/form/selects/select-unidad-de-medida'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import { useStoreFiltrosProductos } from '../../_store/store-filtros-productos'
import { useEffect } from 'react'
import type { GetProductosParams } from '~/app/_types/producto'

interface FiltersMiAlmacenProps {
  marca_predeterminada?: number
}

interface ValuesFiltersMiAlmacen {
  cod_producto?: string
  marca_id?: number
  almacen_id: number
  estado?: number
  ubicacion_id?: number
  categoria_id?: number
  accion_tecnica?: string
  unidad_medida_id?: number
  cs_stock?: CSStock
  cs_comision?: CSComision
}

export default function FiltersMiAlmacen({
  marca_predeterminada,
}: FiltersMiAlmacenProps) {
  const [form] = Form.useForm<ValuesFiltersMiAlmacen>()

  const setFiltros = useStoreFiltrosProductos(state => state.setFiltros)
  const filtros = useStoreFiltrosProductos(state => state.filtros)

  useEffect(() => {
    if (filtros) form.setFieldValue('marca_id', filtros.marca_id)
  }, [filtros, form])

  // Inicializar filtros automáticamente al montar el componente
  useEffect(() => {
    // Esperar a que el formulario esté listo y luego aplicar filtros iniciales
    const timer = setTimeout(() => {
      if (!filtros) {
        form.submit()
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FormBase
      form={form}
      name='filtros-mi-almacen'
      initialValues={{
        almacen_id: 1, // Almacén Principal por defecto
        estado: 1,
        cs_stock: CSStock.ALL,
        cs_comision: CSComision.ALL,
        marca_id: marca_predeterminada,
      }}
      className='w-full'
      onFinish={values => {
        const {
          cod_producto,
          almacen_id,
          estado,
          ubicacion_id,
          accion_tecnica,
          cs_stock,
          cs_comision,
          marca_id,
          categoria_id,
          unidad_medida_id,
        } = values

        const filtros: Partial<GetProductosParams> = {
          almacen_id,
          search: cod_producto || undefined,
          marca_id: marca_id || undefined,
          categoria_id: categoria_id || undefined,
          unidad_medida_id: unidad_medida_id || undefined,
          ubicacion_id: ubicacion_id || undefined,
          accion_tecnica: accion_tecnica || undefined,
          estado: estado === 1 ? 1 : estado === 0 ? 0 : undefined,
          cs_stock:
            cs_stock === CSStock.CON_STOCK
              ? 'con_stock'
              : cs_stock === CSStock.SIN_STOCK
              ? 'sin_stock'
              : 'all',
          cs_comision:
            cs_comision === CSComision.CON_COMISION
              ? 'con_comision'
              : cs_comision === CSComision.SIN_COMISION
              ? 'sin_comision'
              : 'all',
          per_page: 100,
        }

        setFiltros(filtros)
      }}
    >
      <TituloModulos
        title='Mi Almacén'
        icon={<PiWarehouseFill className='text-cyan-600' />}
      >
        <div className='flex items-center gap-4'>
          <InputBase
            size='large'
            propsForm={{
              name: 'cod_producto',
              hasFeedback: false,
              className: '!min-w-[300px]',
            }}
            autoFocus
            placeholder='Código / Producto'
            prefix={<FaBoxOpen size={15} className='text-cyan-600 mx-1' />}
            formWithMessage={false}
            allowClear
          />
          <SelectMarcas
            size='large'
            propsForm={{
              name: 'marca_id',
              hasFeedback: false,
              className: '!min-w-[200px] !w-[200px] !max-w-[200px]',
            }}
            className='w-full'
            formWithMessage={false}
            allowClear
          />
          <SelectAlmacen
            propsForm={{
              name: 'almacen_id',
              hasFeedback: false,
              className: '!min-w-[220px] !w-[220px] !max-w-[220px]',
              rules: [{ required: true, message: '' }],
            }}
            className='w-full'
            formWithMessage={false}
            form={form}
          />
          <SelectEstado
            size='large'
            propsForm={{
              name: 'estado',
              hasFeedback: false,
              className: '!min-w-[120px] !w-[120px] !max-w-[120px]',
            }}
            className='w-full'
            formWithMessage={false}
          />
        </div>
      </TituloModulos>
      <div className='flex items-center gap-4 mt-4'>
        <LabelBase label='Ubicación:'>
          <SelectUbicaciones
            propsForm={{
              name: 'ubicacion_id',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            className='w-full'
            formWithMessage={false}
            form={form}
            allowClear
          />
        </LabelBase>
        <LabelBase label='Categoría:'>
          <SelectCategorias
            propsForm={{
              name: 'categoria_id',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            className='w-full'
            formWithMessage={false}
            allowClear
          />
        </LabelBase>
        <LabelBase label='Acc. Técnica:'>
          <InputBase
            propsForm={{
              name: 'accion_tecnica',
              hasFeedback: false,
              className: '!min-w-[180px] !w-[180px] !max-w-[180px]',
            }}
            placeholder='Acción Técnica'
            prefix={<IoDocumentText size={15} className='text-cyan-600 mx-1' />}
            formWithMessage={false}
            allowClear
          />
        </LabelBase>
        <LabelBase label='U. de Medida:'>
          <SelectUnidadDeMedida
            propsForm={{
              name: 'unidad_medida_id',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            className='w-full'
            formWithMessage={false}
            allowClear
          />
        </LabelBase>
        <LabelBase label='Stock:'>
          <SelectCSStock
            propsForm={{
              name: 'cs_stock',
              hasFeedback: false,
              className: '!min-w-[110px] !w-[110px] !max-w-[110px]',
            }}
            className='w-full'
            formWithMessage={false}
          />
        </LabelBase>
        <LabelBase label='Comisión:'>
          <SelectCSComision
            propsForm={{
              name: 'cs_comision',
              hasFeedback: false,
              className: '!min-w-[110px] !w-[110px] !max-w-[110px]',
            }}
            className='w-full'
            formWithMessage={false}
          />
        </LabelBase>
        <ButtonBase
          color='info'
          size='md'
          type='submit'
          className='flex items-center gap-2 w-fit'
        >
          <FaSearch />
          Buscar
        </ButtonBase>
      </div>
    </FormBase>
  )
}
