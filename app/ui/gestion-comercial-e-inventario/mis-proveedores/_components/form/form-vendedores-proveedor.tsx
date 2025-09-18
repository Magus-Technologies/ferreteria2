import { Button, Form } from 'antd'
import { FormInstance } from 'antd/lib'
import { BsGeoAltFill, BsPlusCircleDotted } from 'react-icons/bs'
import { FaAddressCard } from 'react-icons/fa'
import { FaMobileButton } from 'react-icons/fa6'
import { MdCelebration, MdDelete, MdEmail, MdFactory } from 'react-icons/md'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputConsultaRuc from '~/app/_components/form/inputs/input-consulta-ruc'
import SelectEstado from '~/app/_components/form/selects/select-estado'
import { ConsultaDni } from '~/app/_types/consulta-ruc'
import LabelBase from '~/components/form/label-base'

export default function FormVendedoresProveedor({
  form,
}: {
  form: FormInstance
}) {
  return (
    <Form.List name='vendedores'>
      {(fields, { add, remove }) => (
        <div className='pr-4 flex flex-col gap-6 max-h-[255px] overflow-y-auto'>
          {fields.map(({ name }) => (
            <div className='border rounded-xl p-4 shadow' key={name}>
              <div className='flex justify-center items-center pb-4 gap-6'>
                <h2 className='text-lg font-bold text-slate-600'>
                  VENDEDOR {name + 1}
                </h2>
                <MdDelete
                  size={20}
                  onClick={() => remove(name)}
                  className='text-rose-700 hover:scale-110 cursor-pointer transition-all'
                />
              </div>
              <div className='flex gap-4 items-center justify-center'>
                <LabelBase
                  label='DNI:'
                  className='w-full'
                  classNames={{ labelParent: 'mb-6' }}
                >
                  <InputConsultaRuc
                    prefix={<FaAddressCard className='text-rose-700 mx-1' />}
                    propsForm={{
                      name: [name, 'dni'],
                      rules: [
                        {
                          required: true,
                          message: 'Por favor, ingresa el DNI',
                        },
                        {
                          pattern: /^[0-9]{8}$/,
                          message: 'Por favor, ingresa un DNI válido',
                        },
                      ],
                    }}
                    placeholder='DNI'
                    onSuccess={res => {
                      const dniData = res as ConsultaDni
                      form.resetFields([
                        ['vendedores', name, 'nombres'],
                        ['vendedores', name, 'cumple'],
                        ['vendedores', name, 'direccion'],
                        ['vendedores', name, 'telefono'],
                        ['vendedores', name, 'email'],
                      ])
                      if (dniData.success)
                        form.setFieldValue(
                          ['vendedores', name, 'nombres'],
                          `${dniData?.nombres} ${dniData?.apellidoPaterno} ${dniData?.apellidoMaterno}`
                        )
                    }}
                    form={form}
                    nameWatch={['vendedores', name, 'dni']}
                  />
                </LabelBase>
                <LabelBase
                  label='Estado:'
                  className='w-full'
                  classNames={{ labelParent: 'mb-6' }}
                >
                  <SelectEstado
                    classNameIcon='text-rose-700 mx-1'
                    propsForm={{
                      name: [name, 'estado'],
                      rules: [
                        {
                          required: true,
                          message: 'Por favor, selecciona un estado',
                        },
                      ],
                    }}
                  />
                </LabelBase>
              </div>
              <div className='flex gap-4 items-center justify-center'>
                <LabelBase
                  label='Nombres:'
                  className='w-full'
                  orientation='column'
                >
                  <InputBase
                    prefix={<MdFactory className='text-rose-700 mx-1' />}
                    propsForm={{
                      name: [name, 'nombres'],
                      rules: [
                        {
                          required: true,
                          message: 'Por favor, ingresa los nombres',
                        },
                      ],
                    }}
                    placeholder='Nombres'
                  />
                </LabelBase>
                <LabelBase
                  label='Cumpleaños:'
                  className='min-w-[160px]'
                  orientation='column'
                >
                  <DatePickerBase
                    propsForm={{
                      name: [name, 'cumple'],
                    }}
                    placeholder='Cumpleaños'
                    prefix={
                      <MdCelebration size={15} className='text-cyan-600 mx-1' />
                    }
                  />
                </LabelBase>
              </div>
              <LabelBase
                label='Direccion:'
                classNames={{ labelParent: 'mb-6' }}
              >
                <InputBase
                  prefix={<BsGeoAltFill className='text-cyan-600 mx-1' />}
                  propsForm={{
                    name: [name, 'direccion'],
                  }}
                  placeholder='Direccion'
                />
              </LabelBase>
              <div className='flex gap-4 items-center justify-center'>
                <LabelBase
                  label='Telefono:'
                  className='w-full'
                  classNames={{ labelParent: 'mb-6' }}
                >
                  <InputBase
                    prefix={<FaMobileButton className='text-cyan-600 mx-1' />}
                    propsForm={{
                      name: [name, 'telefono'],
                    }}
                    placeholder='Telefono'
                  />
                </LabelBase>
                <LabelBase
                  label='Email:'
                  className='w-full'
                  classNames={{ labelParent: 'mb-6' }}
                >
                  <InputBase
                    type='email'
                    prefix={<MdEmail className='text-cyan-600 mx-1' />}
                    propsForm={{
                      name: [name, 'email'],
                      rules: [
                        {
                          type: 'email',
                          message: 'Ingresa un email valido',
                        },
                      ],
                    }}
                    placeholder='Email'
                  />
                </LabelBase>
              </div>
            </div>
          ))}
          <Form.Item>
            <Button
              className='font-semibold! opacity-70'
              type='dashed'
              onClick={() =>
                add({
                  estado: 1,
                })
              }
              block
              icon={<BsPlusCircleDotted />}
            >
              Agregar vendedor
            </Button>
          </Form.Item>
        </div>
      )}
    </Form.List>
  )
}
