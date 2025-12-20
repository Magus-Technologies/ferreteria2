import { AiFillAlert } from 'react-icons/ai'
import { FaBoxOpen } from 'react-icons/fa'
import { FaBarcode, FaBoxesStacked } from 'react-icons/fa6'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectCategorias from '~/app/_components/form/selects/select-categorias'
import SelectMarcas from '~/app/_components/form/selects/select-marcas'
import SelectUbicaciones from '~/app/_components/form/selects/select-ubicaciones'
import SelectUnidadDeMedida from '~/app/_components/form/selects/select-unidad-de-medida'
import LabelBase from '~/components/form/label-base'
import FormSectionLote from '../form/form-section-lote'
import FormSectionUnidadesDerivadas from '../form/form-section-unidades-derivadas'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import FormCodProducto from '../form/form-cod-producto'
import { FormInstance } from 'antd'
import SelectEstado from '~/app/_components/form/selects/select-estado'
import { useStoreEditOrCopyProducto } from '../../_store/store-edit-or-copy-producto'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'

interface FormCreateProductoProps {
  form: FormInstance
}

export default function FormCreateProducto({ form }: FormCreateProductoProps) {
  const can = usePermission()
  const producto = useStoreEditOrCopyProducto(state => state.producto)
  return (
    <>
      {/* Grid: 1 columna hasta xl (1280px), luego 2 columnas */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5 xl:gap-8 mb-2'>
        <div className='space-y-4 md:space-y-5 xl:space-y-0'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 xl:gap-8'>
            <LabelBase label='Almacén:' classNames={{ labelParent: 'mb-4 xl:mb-6' }}>
              <SelectAlmacen
                size='middle'
                className='w-full'
                classNameIcon='text-rose-700 mx-1'
                propsForm={{
                  name: 'almacen_id',
                  rules: [
                    {
                      required: true,
                      message: 'Por favor, selecciona un Almacén',
                    },
                  ],
                }}
                form={form}
                {...(producto?.id && { disabled: true, variant: 'borderless' })}
              />
            </LabelBase>
            <FormCodProducto form={form} />
          </div>
          <LabelBase label='Producto:' classNames={{ labelParent: 'mb-4 xl:mb-6' }}>
            <InputBase
              onChange={e =>
                form.setFieldsValue({ name_ticket: e.target.value })
              }
              propsForm={{
                name: 'name',
                rules: [
                  {
                    required: true,
                    message: 'Por favor, ingresa el nombre del producto',
                  },
                ],
              }}
              placeholder='Producto'
              prefix={<FaBoxOpen size={15} className='text-rose-700 mx-1' />}
            />
          </LabelBase>
          <LabelBase
            label='Descrip. Ticket:'
            classNames={{ labelParent: 'mb-4 xl:mb-6' }}
          >
            <InputBase
              propsForm={{
                name: 'name_ticket',
                rules: [
                  {
                    required: true,
                    message: 'Por favor, ingresa la descripción del ticket',
                  },
                ],
              }}
              placeholder='Descripción Ticket'
              prefix={<FaBoxOpen size={15} className='text-rose-700 mx-1' />}
            />
          </LabelBase>
          <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 md:gap-5 xl:gap-8'>
            <LabelBase
              label='Categoría:'
              classNames={{ labelParent: 'mb-4 xl:mb-6' }}
            >
              <SelectCategorias
                propsForm={{
                  name: 'categoria_id',
                  rules: [
                    {
                      required: true,
                      message: 'Por favor, selecciona una categoría',
                    },
                  ],
                }}
                showButtonCreate={can(permissions.CATEGORIA_CREATE)}
                classNameIcon='text-rose-700 mx-1'
                form={form}
              />
            </LabelBase>
            <LabelBase label='Estado:' classNames={{ labelParent: 'mb-4 xl:mb-6' }}>
              <SelectEstado
                propsForm={{
                  name: 'estado',
                  rules: [
                    {
                      required: true,
                      message: 'Por favor, selecciona un estado',
                    },
                  ],
                  className: 'w-full sm:!min-w-[135px] sm:!w-[135px]',
                }}
                classNameIcon='text-rose-700 mx-1'
              />
            </LabelBase>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 xl:gap-8'>
            <LabelBase label='Marca:' classNames={{ labelParent: 'mb-4 xl:mb-6' }}>
              <SelectMarcas
                propsForm={{
                  name: 'marca_id',
                  rules: [
                    {
                      required: true,
                      message: 'Por favor, selecciona una marca',
                    },
                  ],
                }}
                showButtonCreate={can(permissions.MARCA_CREATE)}
                classNameIcon='text-rose-700 mx-1'
                form={form}
              />
            </LabelBase>
            <LabelBase
              label='U. de Medida:'
              classNames={{ labelParent: 'mb-4 xl:mb-6' }}
            >
              <SelectUnidadDeMedida
                propsForm={{
                  name: 'unidad_medida_id',
                  rules: [
                    {
                      required: true,
                      message: 'Falta la Unidad de Medida',
                    },
                  ],
                }}
                showButtonCreate={can(permissions.UNIDAD_MEDIDA_CREATE)}
                classNameIcon='text-rose-700 mx-1'
                form={form}
              />
            </LabelBase>
          </div>
        </div>
        <div className='space-y-4 md:space-y-5 xl:space-y-0'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 xl:gap-8'>
            <LabelBase label='Ubicación:' classNames={{ labelParent: 'mb-4 xl:mb-6' }}>
              <SelectUbicaciones
                propsForm={{
                  name: ['producto_almacen', 'ubicacion_id'],
                  rules: [
                    {
                      required: true,
                      message: 'Falta la Ubicación',
                    },
                  ],
                }}
                showButtonCreate
                classNameIcon='text-rose-700 mx-1'
                form={form}
                tieneValorPorDefecto
              />
            </LabelBase>
            <LabelBase
              label='Cod. de Barra:'
              classNames={{ labelParent: 'mb-4 xl:mb-6' }}
            >
              <InputBase
                propsForm={{
                  name: 'cod_barra',
                }}
                placeholder='Código de Barra'
                prefix={<FaBarcode size={15} className='text-cyan-600 mx-1' />}
              />
            </LabelBase>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 xl:gap-8'>
            <LabelBase orientation='column' label='Stock Min:'>
              <InputNumberBase
                propsForm={{
                  name: 'stock_min',
                  rules: [
                    {
                      required: true,
                      message: 'Falta el Stock Mínimo',
                    },
                  ],
                }}
                className='w-full'
                min={0}
                precision={2}
                placeholder='Stock Mínimo'
                prefix={
                  <AiFillAlert size={15} className='text-rose-700 mx-1' />
                }
              />
            </LabelBase>
            <LabelBase orientation='column' label='Stock Max:'>
              <InputNumberBase
                propsForm={{
                  name: 'stock_max',
                }}
                className='w-full'
                min={0}
                step={1}
                precision={0}
                placeholder='Stock Máximo'
                prefix={
                  <AiFillAlert size={15} className='text-cyan-600 mx-1' />
                }
              />
            </LabelBase>
            <LabelBase
              orientation='column'
              label='U. Contenidas:'
              infoTooltip='Por defecto las Unidades contenidas son 1'
            >
              <InputNumberBase
                propsForm={{
                  name: 'unidades_contenidas',
                  rules: [
                    {
                      required: true,
                      message: 'Falta las Unidades Contenidas',
                    },
                  ],
                }}
                className='w-full'
                min={0}
                precision={2}
                placeholder='Unidades Contenidas'
                prefix={
                  <FaBoxesStacked size={15} className='text-rose-700 mx-1' />
                }
              />
            </LabelBase>
          </div>
          {!producto?.id && <FormSectionLote form={form} />}
        </div>
      </div>
      <FormSectionUnidadesDerivadas form={form} />
    </>
  )
}
