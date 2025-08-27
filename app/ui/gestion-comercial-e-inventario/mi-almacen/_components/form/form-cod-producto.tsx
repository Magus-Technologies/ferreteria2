'use client'

import { FormInstance } from 'antd'
import { IoCodeWorkingSharp } from 'react-icons/io5'
import CheckboxBase from '~/app/_components/form/checkbox/checkbox-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import LabelBase from '~/components/form/label-base'
import { FormCreateProductoProps } from '../modals/modal-create-producto'
import { useEffect, useRef, useState } from 'react'
import { useStoreEditOrCopyProducto } from '../../store/store-edit-or-copy-producto'

interface FormCodProductoProps {
  form: FormInstance<FormCreateProductoProps>
}

export default function FormCodProducto({ form }: FormCodProductoProps) {
  const [disabled, setDisabled] = useState(true)
  const producto = useStoreEditOrCopyProducto(state => state.producto)
  const primera_vez = useRef(true)

  useEffect(() => {
    if (!(producto?.id && primera_vez.current)) {
      const randomCode =
        Math.random().toString(36).substring(2, 10) +
        (Math.random() * 10000000).toFixed(0).substring(0, 4)
      if (disabled) form.setFieldValue('cod_producto', randomCode)
      else form.setFieldValue('cod_producto', undefined)
    }
    primera_vez.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, form])

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
              required: true,
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
        onChange={e => setDisabled(e.target.checked)}
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
