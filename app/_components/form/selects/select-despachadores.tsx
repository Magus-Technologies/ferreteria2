'use client'

import { useEffect, useState } from 'react'
import { Input, Form, FormInstance } from 'antd'
import { FaSearch, FaTruck } from 'react-icons/fa'
import { IoClose } from 'react-icons/io5'
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

interface SelectDespachadoresProps {
  placeholder?: string
  classNameIcon?: string
  sizeIcon?: number
  onChange?: (value: string, despachador?: Usuario) => void
  classIconSearch?: string
  form?: FormInstance
  propsForm?: { name: string; [key: string]: any }
  className?: string
  allowClear?: boolean
  [key: string]: any
}

export default function SelectDespachadores({
  placeholder = 'Buscar Despachador por DNI...',
  classNameIcon = 'text-cyan-600',
  sizeIcon = 16,
  onChange,
  classIconSearch = '',
  form,
  propsForm,
  className = '',
  allowClear = false,
}: SelectDespachadoresProps) {
  const [openModal, setOpenModal] = useState(false)
  const [despachadorSeleccionado, setDespachadorSeleccionado] = useState<Usuario>()
  const [text, setText] = useState('')
  const [debouncedText] = useDebounce(text, 800)

  // Buscar despachador por DNI exacto
  const { data: despachadores = [] } = useQuery({
    queryKey: [QueryKeys.USUARIOS, debouncedText, 'DESPACHADOR'],
    queryFn: async () => {
      const result = await usuariosApi.getAll({
        search: debouncedText,
        rol_sistema: 'DESPACHADOR',
        estado: true,
      })
      return (result.data?.data || []) as Usuario[]
    },
    enabled: !!debouncedText && debouncedText.length >= 3 && !despachadorSeleccionado,
  })

  // Autoseleccionar si el DNI coincide exactamente
  useEffect(() => {
    if (despachadores.length === 1 && despachadores[0].numero_documento === text) {
      handleSelect(despachadores[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [despachadores])

  function handleSelect(despachador?: Usuario) {
    if (despachador) {
      setDespachadorSeleccionado(despachador)
      setText('')

      if (form && propsForm?.name) {
        form.setFieldValue(propsForm.name, despachador.id)
      }

      setOpenModal(false)
      onChange?.(despachador.id, despachador)
    }
  }

  function handleClear() {
    setDespachadorSeleccionado(undefined)
    setText('')
    if (form && propsForm?.name) {
      form.setFieldValue(propsForm.name, undefined)
    }
    onChange?.('', undefined)
  }

  const displayValue = despachadorSeleccionado
    ? `${despachadorSeleccionado.numero_documento} : ${despachadorSeleccionado.name}`
    : ''

  return (
    <>
      {propsForm && (
        <div style={{ display: 'none' }}>
          <Form.Item name={propsForm.name}>
            <Input />
          </Form.Item>
        </div>
      )}

      <div className={`flex items-center gap-2 ${className}`}>
        {despachadorSeleccionado ? (
          <Input
            readOnly
            value={displayValue}
            prefix={<FaTruck className={classNameIcon} size={sizeIcon} />}
            suffix={
              allowClear ? (
                <IoClose
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  size={16}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                />
              ) : undefined
            }
            className="cursor-pointer"
            onClick={() => setOpenModal(true)}
          />
        ) : (
          <Input
            value={text}
            placeholder={placeholder}
            prefix={<FaTruck className={classNameIcon} size={sizeIcon} />}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                setOpenModal(true)
              }
            }}
          />
        )}
        <FaSearch
          className={`text-yellow-600 cursor-pointer flex-shrink-0 ${classIconSearch}`}
          size={16}
          onClick={() => setOpenModal(true)}
        />
      </div>

      <ModalDespachadorSearch
        open={openModal}
        setOpen={setOpenModal}
        onOk={() => {}}
        textDefault={text}
        onRowDoubleClicked={handleSelect}
        onSuccess={(despachador) => {
          handleSelect(despachador)
        }}
      />
    </>
  )
}
