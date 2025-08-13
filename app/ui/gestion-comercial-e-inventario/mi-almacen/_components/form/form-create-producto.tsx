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

interface FormCreateProductoProps {
  form: FormInstance
}

export default function FormCreateProducto({ form }: FormCreateProductoProps) {
  return (
    <>
      <div className='grid grid-cols-2 gap-8 mb-2'>
        <div>
          <div className='grid grid-cols-2 gap-8'>
            <LabelBase label='Almacén:' classNames={{ labelParent: 'mb-6' }}>
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
              />
            </LabelBase>
            <FormCodProducto form={form} />
          </div>
          <LabelBase label='Producto:' classNames={{ labelParent: 'mb-6' }}>
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
            classNames={{ labelParent: 'mb-6' }}
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
          <div className='flex items-center gap-8'>
            <LabelBase
              label='Categoría:'
              classNames={{ labelParent: 'mb-6' }}
              className='w-full'
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
                showButtonCreate
                classNameIcon='text-rose-700 mx-1'
                form={form}
              />
            </LabelBase>
            <LabelBase label='Estado:' classNames={{ labelParent: 'mb-6' }}>
              <SelectEstado
                propsForm={{
                  name: 'estado',
                  rules: [
                    {
                      required: true,
                      message: 'Por favor, selecciona un estado',
                    },
                  ],
                  className: '!min-w-[135px] !w-[135px] !max-w-[135px]',
                }}
                classNameIcon='text-rose-700 mx-1'
              />
            </LabelBase>
          </div>
          <div className='grid grid-cols-2 gap-8'>
            <LabelBase label='Marca:' classNames={{ labelParent: 'mb-6' }}>
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
                showButtonCreate
                classNameIcon='text-rose-700 mx-1'
                form={form}
              />
            </LabelBase>
            <LabelBase
              label='U. de Medida:'
              classNames={{ labelParent: 'mb-6' }}
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
                showButtonCreate
                classNameIcon='text-rose-700 mx-1'
                form={form}
              />
            </LabelBase>
          </div>
        </div>
        <div>
          <div className='grid grid-cols-2 gap-8'>
            <LabelBase label='Ubicación:' classNames={{ labelParent: 'mb-6' }}>
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
              />
            </LabelBase>
            <LabelBase
              label='Cod. de Barra:'
              classNames={{ labelParent: 'mb-6' }}
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
          <div className='grid grid-cols-3 gap-8'>
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
                min={0}
                step={1}
                precision={0}
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
                min={1}
                step={1}
                precision={0}
                placeholder='Unidades Contenidas'
                prefix={
                  <FaBoxesStacked size={15} className='text-rose-700 mx-1' />
                }
              />
            </LabelBase>
          </div>
          <FormSectionLote form={form} />
        </div>
      </div>
      <FormSectionUnidadesDerivadas form={form} />
    </>
  )
}
