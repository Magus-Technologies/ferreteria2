'use client'

import { FormInstance } from 'antd'
import { IoCodeWorkingSharp } from 'react-icons/io5'
import CheckboxBase from '~/app/_components/form/checkbox/checkbox-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import LabelBase from '~/components/form/label-base'
import { FormCreateProductoProps } from '../modals/modal-create-producto'
import { useState } from 'react'

interface FormCodProductoProps {
  form: FormInstance<FormCreateProductoProps>
}

export default function FormCodProducto({ form }: FormCodProductoProps) {
  const [disabled, setDisabled] = useState(true)

  return (
    <LabelBase
      className='relative'
      label='Cod. Producto:'
      classNames={{ labelParent: 'mb-11' }}
    >
      <InputBase
        disabled={disabled}
        propsForm={{
          name: 'cod_producto',
          rules: [
            {
              required: !disabled,
              message: 'Falta el Código del Producto',
            },
          ],
        }}
        placeholder='Código de Producto'
        prefix={
          <IoCodeWorkingSharp
            size={15}
            className={`${disabled ? 'text-gray-400' : 'text-rose-700'} mx-1`}
          />
        }
      />
      <CheckboxBase
        defaultChecked
        onChange={e => {
          setDisabled(e.target.checked)
          form.setFieldValue('cod_producto', undefined)
        }}
        className='absolute top-11 left-8'
        style={{
          zoom: 0.6,
        }}
      >
        Automático
      </CheckboxBase>
    </LabelBase>
  )
}
