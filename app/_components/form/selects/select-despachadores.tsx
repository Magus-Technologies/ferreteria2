'use client'

import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useEffect, useRef, useState } from 'react'
import { FaSearch, FaTruck } from 'react-icons/fa'
import iterarChangeValue from '~/app/_utils/iterar-change-value'
import { useDebounce } from 'use-debounce'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { usuariosApi } from '~/lib/api/usuarios'
import ModalDespachadorSearch from '../../modals/modal-despachador-search'

interface Usuario {
  id: string
  name: string
  numero_documento: string
  rol_sistema: string
}

interface SelectDespachadoresProps extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  onChange?: (value: string, despachador?: Usuario) => void
  classIconSearch?: string
}

export default function SelectDespachadores({
  placeholder = 'Buscar Despachador',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  onChange,
  classIconSearch = '',
  form,
  propsForm,
  ...props
}: SelectDespachadoresProps) {
  const selectDespachadoresRef = useRef<RefSelectBaseProps>(null)
  const [text, setText] = useState('')
  const [openModalDespachadorSearch, setOpenModalDespachadorSearch] = useState(false)
  const [despachadorSeleccionado, setDespachadorSeleccionado] = useState<Usuario>()

  const [textDefault, setTextDefault] = useState('')
  useEffect(() => {
    if (text) setTextDefault(text)
  }, [text])

  // Sincronizar valor inicial del formulario
  useEffect(() => {
    if (form && propsForm?.name) {
      const valorInicial = form.getFieldValue(propsForm.name as string);
      if (valorInicial && !despachadorSeleccionado) {
        console.log('⚠️ Hay valor inicial pero no hay despachador seleccionado');
      }
    }
  }, [form, propsForm, despachadorSeleccionado]);

  const [value] = useDebounce(text, 1000)

  // Buscar despachadores (usuarios con rol DESPACHADOR)
  const { data: response, isLoading: loading } = useQuery({
    queryKey: [QueryKeys.USUARIOS, value, 'DESPACHADOR'],
    queryFn: async () => {
      const result = await usuariosApi.getAll({
        search: value,
        rol_sistema: 'DESPACHADOR',
        estado: true,
      })
      return result.data || []
    },
    enabled: !!value && value.length >= 2,
  })

  function handleSelect(despachador?: Usuario) {
    if (despachador) {
      setDespachadorSeleccionado(despachador)

      const despachadorLabel = `${despachador.numero_documento} : ${despachador.name}`
      setText(despachadorLabel)

      // Si hay form y propsForm.name, actualizar directamente
      if (form && propsForm?.name) {
        console.log('✅ Actualizando despachador_id directamente en el form:', despachador.id);
        form.setFieldValue(propsForm.name as string, despachador.id);
      } else {
        // Fallback al método anterior
        console.log('⚠️ Usando iterarChangeValue (fallback)');
        iterarChangeValue({
          refObject: selectDespachadoresRef,
          value: despachador.id,
        })
      }

      setOpenModalDespachadorSearch(false)
      onChange?.(despachador.id, despachador)
    }
  }

  // Autoseleccionar si hay exactamente un resultado y coincide exactamente con el DNI
  useEffect(() => {
    if (Array.isArray(response) && response.length === 1) {
      const despachador = response[0] as Usuario
      if (despachador.numero_documento === text) {
        handleSelect(despachador)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response])

  const getLabel = (despachador: Pick<Usuario, 'numero_documento' | 'name'>) => {
    return `${despachador.numero_documento} : ${despachador.name}`
  }

  return (
    <div className='flex items-center gap-4 w-full'>
      <SelectBase
        ref={selectDespachadoresRef}
        form={form}
        propsForm={propsForm}
        showSearch
        uppercase={true}
        filterOption={false}
        onSearch={setText}
        searchValue={text}
        prefix={<FaTruck className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        loading={loading}
        options={[
          ...(despachadorSeleccionado
            ? [
                {
                  value: despachadorSeleccionado.id,
                  label: getLabel(despachadorSeleccionado),
                },
              ]
            : []),
          ...(Array.isArray(response) ? response : []).map((d: Usuario) => ({
            value: d.id,
            label: getLabel(d),
          })),
        ].filter(
          (item, index, self) =>
            self.findIndex(i => i.value === item.value) === index
        )}
        onChange={(value) => {
          const despachador = Array.isArray(response) ? response.find((d: Usuario) => d.id === value) : undefined
          if (despachador) {
            handleSelect(despachador)
          }
        }}
        onKeyUp={e => {
          if (e.key === 'Enter') setOpenModalDespachadorSearch(true)
        }}
        {...props}
      />
      <FaSearch
        className={`text-yellow-600 mb-7 cursor-pointer z-10 ${classIconSearch}`}
        size={15}
        onClick={() => setOpenModalDespachadorSearch(true)}
      />
      <ModalDespachadorSearch
        open={openModalDespachadorSearch}
        setOpen={setOpenModalDespachadorSearch}
        onOk={() => handleSelect()}
        textDefault={textDefault}
        onRowDoubleClicked={handleSelect}
        onSuccess={despachador => {
          // Si hay form y propsForm.name, actualizar directamente
          if (form && propsForm?.name) {
            console.log('✅ Actualizando despachador creado directamente en el form:', despachador.id);
            form.setFieldValue(propsForm.name as string, despachador.id);
          } else {
            // Fallback al método anterior
            iterarChangeValue({
              refObject: selectDespachadoresRef,
              value: despachador.id,
            })
          }
        }}
      />
    </div>
  )
}
