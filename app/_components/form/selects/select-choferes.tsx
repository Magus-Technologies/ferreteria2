'use client'

import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useEffect, useRef, useState } from 'react'
import { FaSearch, FaUserTie } from 'react-icons/fa'
import iterarChangeValue from '~/app/_utils/iterar-change-value'
import { Chofer, choferApi } from '~/lib/api/chofer'
import { useDebounce } from 'use-debounce'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalChoferSearch from '../../modals/modal-chofer-search'

interface SelectChoferesProps extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  onChange?: (value: number, chofer?: Chofer) => void
  classIconSearch?: string
}

export default function SelectChoferes({
  placeholder = 'Buscar Chofer',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  onChange,
  classIconSearch = '',
  form,
  propsForm,
  ...props
}: SelectChoferesProps) {
  const selectChoferesRef = useRef<RefSelectBaseProps>(null)
  const [text, setText] = useState('')
  const [openModalChoferSearch, setOpenModalChoferSearch] = useState(false)
  const [choferCreado, setChoferCreado] = useState<Chofer>()
  const [choferSeleccionado, setChoferSeleccionado] = useState<Chofer>()

  const [textDefault, setTextDefault] = useState('')
  useEffect(() => {
    if (text) setTextDefault(text)
  }, [text])

  // Sincronizar valor inicial del formulario
  useEffect(() => {
    if (form && propsForm?.name) {
      const valorInicial = form.getFieldValue(propsForm.name as string);
      console.log('🔄 Sincronizando valor inicial del formulario:', valorInicial);
      if (valorInicial && !choferSeleccionado) {
        // Si hay un valor pero no hay chofer seleccionado, necesitamos buscarlo
        console.log('⚠️ Hay valor inicial pero no hay chofer seleccionado');
      }
    }
  }, [form, propsForm, choferSeleccionado]);

  const [value] = useDebounce(text, 1000)

  // Buscar choferes
  const { data: response, isLoading: loading } = useQuery({
    queryKey: [QueryKeys.CHOFERES, value],
    queryFn: async () => {
      const result = await choferApi.getAll({
        search: value,
        per_page: 20,
      })
      return result.data?.data || []
    },
    enabled: !!value && value.length >= 2,
  })

  function handleSelect({ data }: { data?: Chofer } = {}) {
    const chofer = data
    if (chofer) {
      setChoferSeleccionado(chofer)

      const choferLabel = `${chofer.dni} : ${chofer.nombres} ${chofer.apellidos}`
      setText(choferLabel)

      console.log('🔍 handleSelect llamado con chofer:', chofer);
      console.log('🔍 form disponible?:', !!form);
      console.log('🔍 propsForm disponible?:', !!propsForm);
      console.log('🔍 propsForm.name:', propsForm?.name);

      // Si hay form y propsForm.name, actualizar directamente
      if (form && propsForm?.name) {
        console.log('✅ Actualizando chofer_id directamente en el form:', chofer.id);
        form.setFieldValue(propsForm.name as string, chofer.id);
      } else {
        // Fallback al método anterior
        console.log('⚠️ Usando iterarChangeValue (fallback)');
        console.log('⚠️ Razón: form=', !!form, 'propsForm=', !!propsForm, 'name=', propsForm?.name);
        iterarChangeValue({
          refObject: selectChoferesRef,
          value: chofer.id,
        })
      }

      setOpenModalChoferSearch(false)
      onChange?.(chofer.id, chofer)
    }
  }

  // Autoseleccionar si hay exactamente un resultado y coincide exactamente con el DNI
  useEffect(() => {
    if (response && response.length === 1) {
      const chofer = response[0]
      if (chofer.dni === text) {
        handleSelect({ data: chofer })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response])

  const getLabel = (chofer: Pick<Chofer, 'dni' | 'nombres' | 'apellidos'>) => {
    return `${chofer.dni} : ${chofer.nombres} ${chofer.apellidos}`
  }

  return (
    <div className='flex items-center gap-4 w-full'>
      <SelectBase
        ref={selectChoferesRef}
        showSearch
        uppercase={true}
        filterOption={false}
        onSearch={setText}
        searchValue={text}
        prefix={<FaUserTie className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        loading={loading}
        options={[
          ...(choferCreado
            ? [
                {
                  value: choferCreado.id,
                  label: getLabel(choferCreado),
                },
              ]
            : []),
          ...(choferSeleccionado
            ? [
                {
                  value: choferSeleccionado.id,
                  label: getLabel(choferSeleccionado),
                },
              ]
            : []),
        ].filter(
          (item, index, self) =>
            self.findIndex(i => i.value === item.value) === index
        )}
        onKeyUp={e => {
          if (e.key === 'Enter') setOpenModalChoferSearch(true)
        }}
        {...props}
      />
      <FaSearch
        className={`text-yellow-600 mb-7 cursor-pointer z-10 ${classIconSearch}`}
        size={15}
        onClick={() => setOpenModalChoferSearch(true)}
      />
      <ModalChoferSearch
        open={openModalChoferSearch}
        setOpen={setOpenModalChoferSearch}
        onOk={() => handleSelect()}
        textDefault={textDefault}
        onRowDoubleClicked={handleSelect}
        onSuccess={chofer => {
          setChoferCreado(chofer)
          
          // Si hay form y propsForm.name, actualizar directamente
          if (form && propsForm?.name) {
            console.log('✅ Actualizando chofer creado directamente en el form:', chofer.id);
            form.setFieldValue(propsForm.name as string, chofer.id);
          } else {
            // Fallback al método anterior
            iterarChangeValue({
              refObject: selectChoferesRef,
              value: chofer.id,
            })
          }
        }}
      />
    </div>
  )
}
