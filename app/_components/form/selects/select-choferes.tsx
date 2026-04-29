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

  // Sincronizar valor inicial del formulario: si el form ya trae un chofer_id
  // (ej. al editar o pre-llenar desde mis-entregas), traer el chofer del backend
  // y mostrarlo como opción seleccionada en el SelectBase.
  const initialIdRef = useRef<number | string | undefined>(undefined)
  useEffect(() => {
    if (!form || !propsForm?.name) return
    const valorInicial = form.getFieldValue(propsForm.name as string)
    if (!valorInicial || choferSeleccionado) return
    if (initialIdRef.current === valorInicial) return // ya intentamos cargar este id
    initialIdRef.current = valorInicial

    const idNum = Number(valorInicial)
    if (!Number.isFinite(idNum)) return

    choferApi.getById(idNum).then(res => {
      const chofer = res.data?.data ?? (res.data as any)
      if (chofer && chofer.id) {
        setChoferSeleccionado(chofer)
        setText(`${chofer.dni} : ${chofer.nombres} ${chofer.apellidos}`)
      }
    }).catch(() => {
      // Silenciar errores: si no se puede traer el chofer, el select queda vacío
    })
  }, [form, propsForm, choferSeleccionado])

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

      // Si hay form y propsForm.name, actualizar directamente
      if (form && propsForm?.name) {
        form.setFieldValue(propsForm.name as string, chofer.id);
      } else {
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
        form={form}
        propsForm={propsForm}
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
