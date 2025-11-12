import { Button, Form } from 'antd'
import { FormInstance } from 'antd/lib'
import { BsPlusCircleDotted } from 'react-icons/bs'
import { FaAddressCard, FaIdCardAlt } from 'react-icons/fa'
import { MdDelete } from 'react-icons/md'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputConsultaRuc from '~/app/_components/form/inputs/input-consulta-ruc'
import { ConsultaDni } from '~/app/_types/consulta-ruc'
import LabelBase from '~/components/form/label-base'
import { IoMdPerson } from 'react-icons/io'
import { getProveedorResponseProps } from '~/app/_actions/proveedor'

export default function FormChoferesProveedor({
  form,
  dataEdit,
}: {
  form: FormInstance
  dataEdit?: getProveedorResponseProps
}) {
  return (
    <Form.List name='choferes'>
      {(fields, { add, remove }) => (
        <div className='pr-4 flex flex-col gap-6 max-h-[255px] overflow-y-auto'>
          {fields.map(({ name }) => (
            <div className='border rounded-xl p-4 shadow' key={name}>
              <div className='flex justify-center items-center pb-4 gap-6'>
                <h2 className='text-lg font-bold text-slate-600'>
                  CHOFER {name + 1}
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
                    automatico={dataEdit ? false : true}
                    placeholder='DNI'
                    onSuccess={res => {
                      const dniData = res as ConsultaDni
                      form.resetFields([['choferes', name, 'name']])
                      if (dniData.success)
                        form.setFieldValue(
                          ['choferes', name, 'name'],
                          `${dniData?.nombres} ${dniData?.apellidoPaterno} ${dniData?.apellidoMaterno}`
                        )
                    }}
                    form={form}
                    nameWatch={['choferes', name, 'dni']}
                  />
                </LabelBase>
                <LabelBase
                  label='Licencia:'
                  className='w-full'
                  classNames={{ labelParent: 'mb-6' }}
                >
                  <InputBase
                    prefix={<FaIdCardAlt className='text-rose-700 mx-1' />}
                    propsForm={{
                      name: [name, 'licencia'],
                      rules: [
                        {
                          required: true,
                          message: 'Por favor, ingresa la licencia',
                        },
                      ],
                    }}
                    placeholder='Licencia'
                  />
                </LabelBase>
              </div>
              <LabelBase
                label='Nombres:'
                className='w-full'
                classNames={{ labelParent: 'mb-6' }}
              >
                <InputBase
                  prefix={<IoMdPerson className='text-rose-700 mx-1' />}
                  propsForm={{
                    name: [name, 'name'],
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
            </div>
          ))}
          <Form.Item>
            <Button
              className='font-semibold! opacity-70'
              type='dashed'
              onClick={() => add()}
              block
              icon={<BsPlusCircleDotted />}
            >
              Agregar chofer
            </Button>
          </Form.Item>
        </div>
      )}
    </Form.List>
  )
}
