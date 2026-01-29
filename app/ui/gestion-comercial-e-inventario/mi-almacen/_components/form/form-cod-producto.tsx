'use client'

import { Form, FormInstance, Spin } from 'antd'
import { IoCodeWorkingSharp } from 'react-icons/io5'
import CheckboxBase from '~/app/_components/form/checkbox/checkbox-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import LabelBase from '~/components/form/label-base'
import { FormCreateProductoProps } from '../modals/modal-create-producto'
import { useEffect, useRef } from 'react'
import { useStoreEditOrCopyProducto } from '../../_store/store-edit-or-copy-producto'
import { useStoreCodigoAutomatico } from '../../_store/store-codigo-automatico'
import useValidarCodigoProducto from '../../_hooks/use-validar-codigo-producto'

interface FormCodProductoProps {
  form: FormInstance<FormCreateProductoProps>
}

export default function FormCodProducto({ form }: FormCodProductoProps) {
  const disabled = useStoreCodigoAutomatico(state => state.disabled)
  const setDisabled = useStoreCodigoAutomatico(state => state.setDisabled)
  const producto = useStoreEditOrCopyProducto(state => state.producto)
  const primera_vez = useRef(true)
  const primera_vez_validar = useRef(0)

  const cod_producto = Form.useWatch('cod_producto', form)

  const { validar, loading, response } = useValidarCodigoProducto(producto?.id)

  useEffect(() => {
    if (primera_vez_validar.current >= (producto ? 2 : 1)) {
      if (cod_producto) validar(cod_producto)
    }
    primera_vez_validar.current += 1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cod_producto])

  useEffect(() => {
    if (!(producto?.id && primera_vez.current)) {
      if (disabled) form.setFieldValue('cod_producto', '')
      else if (producto?.cod_producto)
        form.setFieldValue('cod_producto', producto.cod_producto)
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
              required: !disabled,
              message: 'Falta el Código del Producto',
            },
            // Solo validar si NO estamos editando un producto
            ...(!producto?.id ? [{
              validator: () => {
                if (response) {
                  return Promise.reject(
                    new Error(`El código ${response} ya existe`)
                  )
                }
                return Promise.resolve()
              },
            }] : []),
          ],
        }}
        placeholder='Código de Producto'
        prefix={
          <IoCodeWorkingSharp
            size={15}
            className={`${disabled ? 'text-gray-400' : 'text-rose-700'} mx-1`}
          />
        }
        suffix={loading ? <Spin size='small' /> : null}
      />
      <CheckboxBase
        defaultChecked
        onChange={e => setDisabled(e.target.checked)}
        className='absolute top-11 left-8'
        style={{
          zoom: 0.6,
        }}
        checked={disabled}
      >
        Automático
      </CheckboxBase>
    </LabelBase>
  )
}
