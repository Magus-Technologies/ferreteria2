import { FaBoxOpen, FaSearch } from 'react-icons/fa'
import { IoDocumentText } from 'react-icons/io5'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectCategorias from '~/app/_components/form/selects/select-categorias'
import SelectEstado from '~/app/_components/form/selects/select-estado'
import SelectMarcas from '~/app/_components/form/selects/select-marcas'
import SelectUbicaciones from '~/app/_components/form/selects/select-ubicaciones'
import SelectUnidadDeMedida from '~/app/_components/form/selects/select-unidad-de-medida'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'

export default function FiltersMiAlmacen() {
  return (
    <FormBase
      name='filtros-mi-almacen'
      initialValues={{ estado: 'activo' }}
      className='w-full'
    >
      <div className='grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-8 gap-y-3'>
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
        <LabelBase label='Cod / Producto:'>
          <InputBase
            propsForm={{
              name: 'codigo_producto',
              hasFeedback: false,
            }}
            placeholder='Código / Producto'
            prefix={<FaBoxOpen size={15} className='text-cyan-600 mx-1' />}
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
        <LabelBase label='Marca:'>
          <SelectMarcas
            propsForm={{
              name: 'marca',
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
        <LabelBase label='Estado:'>
          <SelectEstado
            propsForm={{
              name: 'estado',
              hasFeedback: false,
            }}
            className='w-full'
            formWithMessage={false}
          />
        </LabelBase>
        <ButtonBase
          color='info'
          size='sm'
          type='submit'
          className='flex items-center gap-2 w-fit'
        >
          <FaSearch />
          Filtrar
        </ButtonBase>
      </div>
    </FormBase>
  )
}
