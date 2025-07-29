import { Tooltip } from 'antd'
import { useState } from 'react'
import { FaPlusCircle } from 'react-icons/fa'
import { createMarca } from '~/app/_actions/marca'
import { QueryKeys } from '~/app/_lib/queryKeys'
import FormWithName from '~/components/modals/modal-form-with-name'

export default function ButtonCreateMarca() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <FormWithName
        title='Marca'
        open={open}
        setOpen={setOpen}
        propsUseServerMutation={{
          action: createMarca,
          queryKey: [QueryKeys.MARCAS],
          msgSuccess: 'Marca creada exitosamente',
        }}
      />
      <Tooltip title='Crear Marca'>
        <FaPlusCircle
          className='text-emerald-600 hover:text-emerald-700 cursor-pointer active:scale-95 hover:scale-110 transition-all mb-7'
          size={18}
          onClick={() => setOpen(true)}
        />
      </Tooltip>
    </>
  )
}
