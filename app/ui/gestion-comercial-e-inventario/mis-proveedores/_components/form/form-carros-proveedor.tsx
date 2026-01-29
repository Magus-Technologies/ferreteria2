import { Button, Form } from 'antd'
import { BsPlusCircleDotted } from 'react-icons/bs'
import { FaCar } from 'react-icons/fa6'
import { MdDelete } from 'react-icons/md'
import InputBase from '~/app/_components/form/inputs/input-base'
import LabelBase from '~/components/form/label-base'

export default function FormCarrosProveedor() {
  return (
    <Form.List name='carros'>
      {(fields, { add, remove }) => (
        <div className='pr-4 flex flex-col gap-6 max-h-[255px] overflow-y-auto'>
          {fields.map(({ name }) => (
            <div className='border rounded-xl p-4 shadow' key={name}>
              <div className='flex justify-center items-center pb-4 gap-6'>
                <h2 className='text-lg font-bold text-slate-600'>
                  CARRO {name + 1}
                </h2>
                <MdDelete
                  size={20}
                  onClick={() => remove(name)}
                  className='text-rose-700 hover:scale-110 cursor-pointer transition-all'
                />
              </div>
              <LabelBase
                label='Placa:'
                className='w-full'
                classNames={{ labelParent: 'mb-6' }}
              >
                <InputBase
                  prefix={<FaCar className='text-rose-700 mx-1' />}
                  propsForm={{
                    name: [name, 'placa'],
                    rules: [
                      {
                        required: true,
                        message: 'Por favor, ingresa la placa',
                      },
                    ],
                  }}
                  placeholder='Placa'
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
              Agregar carro
            </Button>
          </Form.Item>
        </div>
      )}
    </Form.List>
  )
}
