import { Form } from 'antd'
import { Dispatch, SetStateAction } from 'react'
import { AiFillAlert } from 'react-icons/ai'
import { FaBoxOpen } from 'react-icons/fa'
import { FaBarcode, FaBoxesStacked } from 'react-icons/fa6'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectCategorias from '~/app/_components/form/selects/select-categorias'
import SelectMarcas from '~/app/_components/form/selects/select-marcas'
import SelectUbicaciones from '~/app/_components/form/selects/select-ubicaciones'
import SelectUnidadDeMedida from '~/app/_components/form/selects/select-unidad-de-medida'
import { Producto } from '~/app/_types/producto'
import LabelBase from '~/components/form/label-base'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import { toUTCString } from '~/utils/fechas'
import { Dayjs } from 'dayjs'
import FormSectionLote from '../form/form-section-lote'
import { Lote, ProductoLote } from '~/app/_types/lote'
import { DetalleDePreciosProps } from '../tables/columns-detalle-de-precios'
import FormSectionUnidadesDerivadas from '../form/form-section-unidades-derivadas'
import ButtonCreateMarca from '../buttons/button-create-marca'

interface ModalCreateProductoProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export type FormCreateProductoProps = Omit<
  Producto,
  'id' | 'created_at' | 'updated_at'
> & {
  lote: Partial<
    Pick<Lote, 'name'> & {
      vencimiento: Dayjs
      productos: Pick<ProductoLote, 'stock_entero' | 'stock_fraccion'>
    }
  >
} & {
  unidades_derivadas: DetalleDePreciosProps[]
}

export default function ModalCreateProducto({
  open,
  setOpen,
}: ModalCreateProductoProps) {
  const [form] = Form.useForm<FormCreateProductoProps>()

  return (
    <ModalForm
      modalProps={{
        title: <TitleForm>Agregar Producto</TitleForm>,
        className: 'min-w-[1600px]',
        wrapClassName: '!flex !items-center',
        centered: true,
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        initialValues: {
          unidades_contenidas: 1,
          unidades_derivadas: [],
        },
        onFinish: values => {
          const data = {
            ...values,
            lote: {
              ...values.lote,
              vencimiento: values.lote.vencimiento
                ? toUTCString({ date: values.lote.vencimiento })
                : null,
            },
          }
          console.log('🚀 ~ file: modal-create-producto.tsx:65 ~ data:', data)
        },
      }}
    >
      <div className='grid grid-cols-2 gap-8 mb-2'>
        <div>
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
          <LabelBase label='Categoría:' classNames={{ labelParent: 'mb-6' }}>
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
              classNameIcon='text-rose-700 mx-1'
            />
          </LabelBase>
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
                classNameIcon='text-rose-700 mx-1'
              />
              <ButtonCreateMarca />
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
                      message: 'Falta Unidad de Medida',
                    },
                  ],
                }}
                classNameIcon='text-rose-700 mx-1'
              />
            </LabelBase>
          </div>
        </div>
        <div>
          <LabelBase label='Ubicación:' classNames={{ labelParent: 'mb-6' }}>
            <SelectUbicaciones
              propsForm={{
                name: 'ubicacion_id',
                rules: [
                  {
                    required: true,
                    message: 'Por favor, selecciona una ubicación',
                  },
                ],
              }}
              classNameIcon='text-rose-700 mx-1'
            />
          </LabelBase>
          <div className='grid grid-cols-2 gap-8'>
            <LabelBase label='Stock Min:' classNames={{ labelParent: 'mb-6' }}>
              <InputNumberBase
                propsForm={{
                  name: 'stock_min',
                  rules: [
                    {
                      required: true,
                      message: 'Por favor, ingresa el stock mínimo',
                    },
                  ],
                }}
                min={0}
                placeholder='Stock Mínimo'
                prefix={
                  <AiFillAlert size={15} className='text-rose-700 mx-1' />
                }
              />
            </LabelBase>
            <LabelBase
              label='U. Contenidas:'
              classNames={{ labelParent: 'mb-6' }}
              infoTooltip='Por defecto las Unidades contenidas son 1'
            >
              <InputNumberBase
                propsForm={{
                  name: 'unidades_contenidas',
                  rules: [
                    {
                      required: true,
                      message: 'Falta Unidades Contenidas',
                    },
                  ],
                }}
                min={1}
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
    </ModalForm>
  )
}
