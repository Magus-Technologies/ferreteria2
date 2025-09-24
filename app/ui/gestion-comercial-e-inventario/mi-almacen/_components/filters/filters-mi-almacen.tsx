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
import { Prisma } from '@prisma/client'
import { useEffect } from 'react'

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

  return (
    <FormBase
      form={form}
      name='filtros-mi-almacen'
      initialValues={{
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
          ...rest
        } = values
        const data = {
          ...rest,
          producto_en_almacenes: {
            some: {
              almacen_id,
              ubicacion_id,
              ...(cs_stock === CSStock.CON_STOCK
                ? { stock_fraccion: { gt: 0 } }
                : cs_stock === CSStock.SIN_STOCK
                ? { stock_fraccion: { lte: 0 } }
                : {}),
              ...(cs_comision === CSComision.CON_COMISION
                ? {
                    unidades_derivadas: {
                      some: {
                        OR: [
                          {
                            comision_publico: {
                              gt: 0,
                            },
                          },
                          {
                            comision_especial: {
                              gt: 0,
                            },
                          },
                          {
                            comision_minimo: {
                              gt: 0,
                            },
                          },
                          {
                            comision_ultimo: {
                              gt: 0,
                            },
                          },
                        ],
                      },
                    },
                  }
                : cs_comision === CSComision.SIN_COMISION
                ? {
                    unidades_derivadas: {
                      some: {
                        AND: [
                          {
                            OR: [
                              { comision_publico: { lte: 0 } },
                              { comision_publico: null },
                            ],
                          },
                          {
                            OR: [
                              { comision_especial: { lte: 0 } },
                              { comision_especial: null },
                            ],
                          },
                          {
                            OR: [
                              { comision_minimo: { lte: 0 } },
                              { comision_minimo: null },
                            ],
                          },
                          {
                            OR: [
                              { comision_ultimo: { lte: 0 } },
                              { comision_ultimo: null },
                            ],
                          },
                        ],
                      },
                    },
                  }
                : {}),
            },
          },
          estado: estado === 1,
          ...(cod_producto
            ? {
                OR: [
                  {
                    cod_producto: {
                      contains: cod_producto,
                      mode: 'insensitive',
                    },
                  },
                  {
                    name: {
                      contains: cod_producto,
                      mode: 'insensitive',
                    },
                  },
                ],
              }
            : {}),
          ...(accion_tecnica
            ? {
                accion_tecnica: {
                  contains: accion_tecnica,
                  mode: 'insensitive',
                },
              }
            : {}),
        } satisfies Prisma.ProductoWhereInput
        setFiltros(data)
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
