'use client'

import { Form, Drawer, Badge } from 'antd'
import { FaBoxOpen, FaSearch, FaFilter } from 'react-icons/fa'
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
import { useEffect, useState, useMemo } from 'react'
import type { GetProductosParams } from '~/app/_types/producto'

interface FiltersMiAlmacenProps {
  // marca_predeterminada?: number // Ya no se usa
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

export default function FiltersMiAlmacen({}: FiltersMiAlmacenProps) {
  const [form] = Form.useForm<ValuesFiltersMiAlmacen>()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const setFiltros = useStoreFiltrosProductos(state => state.setFiltros)
  const filtros = useStoreFiltrosProductos(state => state.filtros)

  // Limpiar marca_id del store al montar el componente
  useEffect(() => {
    if (filtros?.marca_id) {
      const { marca_id, ...restoFiltros } = filtros
      setFiltros(restoFiltros)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Inicializar filtros automáticamente al montar el componente
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!filtros) {
        form.submit()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    const values = form.getFieldsValue()
    let count = 0
    if (values.ubicacion_id) count++
    if (values.categoria_id) count++
    if (values.accion_tecnica) count++
    if (values.unidad_medida_id) count++
    if (values.cs_stock && values.cs_stock !== CSStock.ALL) count++
    if (values.cs_comision && values.cs_comision !== CSComision.ALL) count++
    return count
  }, [form])

  const handleFinish = (values: ValuesFiltersMiAlmacen) => {
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
    setDrawerOpen(false)
  }

  return (
    <FormBase
      form={form}
      name='filtros-mi-almacen'
      initialValues={{
        almacen_id: 1,
        estado: 1,
        cs_stock: CSStock.ALL,
        cs_comision: CSComision.ALL,
        // marca_id: marca_predeterminada, // Removido para mostrar todos los productos por defecto
      }}
      className='w-full'
      onFinish={handleFinish}
    >
      <TituloModulos
        title='Mi Almacén'
        icon={<PiWarehouseFill className='text-cyan-600' />}
      >
        {/* Filtros principales - Siempre visibles pero responsivos */}
        <div className='flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 w-full'>
          <InputBase
            size='large'
            propsForm={{
              name: 'cod_producto',
              hasFeedback: false,
              className: 'flex-1 !min-w-[200px] sm:!min-w-[250px] md:!min-w-[300px]',
            }}
            autoFocus
            placeholder='Código / Producto'
            prefix={<FaBoxOpen size={15} className='text-cyan-600 mx-1' />}
            formWithMessage={false}
            allowClear
          />
          
          {/* Desktop: Mostrar todos los filtros principales */}
          <div className='hidden lg:flex items-center gap-4'>
            <SelectMarcas
              size='large'
              propsForm={{
                name: 'marca_id',
                hasFeedback: false,
                className: '!min-w-[200px] !w-[200px]',
              }}
              className='w-full'
              formWithMessage={false}
              allowClear
            />
            <SelectAlmacen
              propsForm={{
                name: 'almacen_id',
                hasFeedback: false,
                className: '!min-w-[220px] !w-[220px]',
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
                className: '!min-w-[120px] !w-[120px]',
              }}
              className='w-full'
              formWithMessage={false}
            />
          </div>

          {/* Mobile/Tablet: Botón para abrir drawer */}
          <div className='flex lg:hidden items-center gap-2'>
            <ButtonBase
              color='info'
              size='md'
              type='submit'
              className='flex items-center gap-2'
            >
              <FaSearch />
            </ButtonBase>
            <Badge count={activeFiltersCount} offset={[-5, 5]}>
              <ButtonBase
                color='warning'
                size='md'
                type='button'
                onClick={() => setDrawerOpen(true)}
                className='flex items-center gap-2 whitespace-nowrap'
              >
                <FaFilter />
                Filtros
              </ButtonBase>
            </Badge>
          </div>
        </div>
      </TituloModulos>

      {/* Filtros secundarios - Solo desktop */}
      <div className='hidden lg:flex items-center gap-4 mt-4 flex-wrap'>
        <LabelBase label='Ubicación:'>
          <SelectUbicaciones
            propsForm={{
              name: 'ubicacion_id',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px]',
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
              className: '!min-w-[150px] !w-[150px]',
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
              className: '!min-w-[180px] !w-[180px]',
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
              className: '!min-w-[150px] !w-[150px]',
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
              className: '!min-w-[110px] !w-[110px]',
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
              className: '!min-w-[110px] !w-[110px]',
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

      {/* Drawer para móvil/tablet */}
      <Drawer
        title={
          <div className='flex items-center gap-2'>
            <FaFilter className='text-cyan-600' />
            <span>Filtros de Búsqueda</span>
          </div>
        }
        placement='right'
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={Math.min(400, window.innerWidth - 40)}
      >
        <div className='flex flex-col gap-4'>
          <LabelBase label='Marca:'>
            <SelectMarcas
              size='large'
              propsForm={{
                name: 'marca_id',
                hasFeedback: false,
              }}
              className='w-full'
              formWithMessage={false}
              allowClear
            />
          </LabelBase>

          <LabelBase label='Almacén:'>
            <SelectAlmacen
              propsForm={{
                name: 'almacen_id',
                hasFeedback: false,
                rules: [{ required: true, message: 'Requerido' }],
              }}
              className='w-full'
              formWithMessage={false}
              form={form}
            />
          </LabelBase>

          <LabelBase label='Estado:'>
            <SelectEstado
              size='large'
              propsForm={{
                name: 'estado',
                hasFeedback: false,
              }}
              className='w-full'
              formWithMessage={false}
            />
          </LabelBase>

          <LabelBase label='Ubicación:'>
            <SelectUbicaciones
              propsForm={{
                name: 'ubicacion_id',
                hasFeedback: false,
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
              }}
              className='w-full'
              formWithMessage={false}
              allowClear
            />
          </LabelBase>

          <LabelBase label='Acción Técnica:'>
            <InputBase
              propsForm={{
                name: 'accion_tecnica',
                hasFeedback: false,
              }}
              placeholder='Acción Técnica'
              prefix={<IoDocumentText size={15} className='text-cyan-600 mx-1' />}
              formWithMessage={false}
              allowClear
            />
          </LabelBase>

          <LabelBase label='Unidad de Medida:'>
            <SelectUnidadDeMedida
              propsForm={{
                name: 'unidad_medida_id',
                hasFeedback: false,
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
              }}
              className='w-full'
              formWithMessage={false}
            />
          </LabelBase>

          <div className='flex gap-2 mt-4'>
            <ButtonBase
              color='default'
              size='md'
              type='button'
              onClick={() => {
                form.resetFields()
                form.submit()
              }}
              className='flex-1'
            >
              Limpiar
            </ButtonBase>
            <ButtonBase
              color='info'
              size='md'
              type='submit'
              className='flex-1 flex items-center justify-center gap-2'
            >
              <FaSearch />
              Aplicar
            </ButtonBase>
          </div>
        </div>
      </Drawer>
    </FormBase>
  )
}
