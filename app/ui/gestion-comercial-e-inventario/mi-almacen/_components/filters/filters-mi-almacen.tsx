import { FaBoxOpen, FaFilter } from 'react-icons/fa'
import { IoDocumentText } from 'react-icons/io5'
import { PiWarehouseFill } from 'react-icons/pi'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import SelectCSStock from '~/app/_components/form/selects/select-c-s-stock'
import SelectCategorias from '~/app/_components/form/selects/select-categorias'
import SelectEstado from '~/app/_components/form/selects/select-estado'
import SelectMarcas from '~/app/_components/form/selects/select-marcas'
import SelectUbicaciones from '~/app/_components/form/selects/select-ubicaciones'
import SelectUnidadDeMedida from '~/app/_components/form/selects/select-unidad-de-medida'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'

export default function FiltersMiAlmacen() {
  return (
    <FormBase
      name='filtros-mi-almacen'
      initialValues={{ estado: 'activo', cs_stock: 'all' }}
      className='w-full'
    >
      <TituloModulos
        title='Mi Almacén'
        icon={<PiWarehouseFill className='text-cyan-600' />}
      >
        <div className='flex items-center gap-4'>
          <InputBase
            size='large'
            propsForm={{
              name: 'codigo_producto',
              hasFeedback: false,
              className: '!min-w-[300px]',
            }}
            placeholder='Código / Producto'
            prefix={<FaBoxOpen size={15} className='text-cyan-600 mx-1' />}
            formWithMessage={false}
          />
          <SelectMarcas
            size='large'
            propsForm={{
              name: 'marca',
              hasFeedback: false,
              className: '!min-w-[300px]',
            }}
            className='w-full'
            formWithMessage={false}
          />
          <SelectAlmacen
            propsForm={{
              name: 'almacen',
              hasFeedback: false,
              className: '!w-fit',
            }}
            formWithMessage={false}
          />
          <SelectEstado
            size='large'
            propsForm={{
              name: 'estado',
              hasFeedback: false,
              className: '!min-w-[120px]',
            }}
            formWithMessage={false}
          />
        </div>
      </TituloModulos>
      <div className='flex items-center gap-4 mt-4'>
        <LabelBase label='Ubicación:'>
          <SelectUbicaciones
            propsForm={{
              name: 'ubicacion',
              hasFeedback: false,
            }}
            className='w-full'
            formWithMessage={false}
          />
        </LabelBase>
        <LabelBase label='Categoría:'>
          <SelectCategorias
            propsForm={{
              name: 'categoria',
              hasFeedback: false,
            }}
            className='w-full'
            formWithMessage={false}
          />
        </LabelBase>
        <LabelBase label='Acc. Técnica:'>
          <InputBase
            propsForm={{
              name: 'accion_tecnica',
              hasFeedback: false,
            }}
            placeholder='Acción Técnica'
            prefix={<IoDocumentText size={15} className='text-cyan-600 mx-1' />}
            formWithMessage={false}
          />
        </LabelBase>
        <LabelBase label='U. de Medida:'>
          <SelectUnidadDeMedida
            propsForm={{
              name: 'unidad_de_medida',
              hasFeedback: false,
            }}
            className='w-full'
            formWithMessage={false}
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
        <ButtonBase
          color='info'
          size='md'
          type='submit'
          className='flex items-center gap-2 w-fit'
        >
          <FaFilter />
          Filtrar
        </ButtonBase>
      </div>
    </FormBase>
  )
}
