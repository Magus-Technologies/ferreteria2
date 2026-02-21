'use client'

import SelectBase, { RefSelectBaseProps, SelectBaseProps } from './select-base'
import { useEffect, useRef, useState } from 'react'
import { FaSearch, FaUser } from 'react-icons/fa'
import iterarChangeValue from '~/app/_utils/iterar-change-value'
import { Cliente } from '~/lib/api/cliente'
import useSearchClientes from '~/app/ui/facturacion-electronica/mis-ventas/_hooks/use-search-clientes'
import { useDebounce } from 'use-debounce'
import ButtonCreateCliente from '../buttons/button-create-cliente'
import ModalClienteSearch from '../../modals/modal-cliente-search'
import { useStoreClienteSeleccionado } from '~/app/ui/facturacion-electronica/mis-ventas/store/store-cliente-seleccionado'
import { FormInstance } from 'antd'

interface SelectClientesProps extends Omit<SelectBaseProps, 'onChange'> {
  classNameIcon?: string
  sizeIcon?: number
  onChange?: (value: number, cliente?: Cliente) => void
  onSearchChange?: (text: string) => void // Nuevo: callback para capturar el texto de búsqueda
  showButtonCreate?: boolean
  classIconSearch?: string
  classIconCreate?: string
  clienteOptionsDefault?: Pick<Cliente, 'id' | 'numero_documento' | 'razon_social' | 'nombres' | 'apellidos'>[]
  form?: FormInstance
  showOnlyDocument?: boolean
  autoFocus?: boolean
  open?: boolean // Permitir controlar si se abre el dropdown
}

export default function SelectClientes({
  placeholder = 'Buscar Cliente',
  variant = 'filled',
  classNameIcon = 'text-cyan-600 mx-1',
  sizeIcon = 18,
  showButtonCreate = false,
  classIconSearch = '',
  classIconCreate = '',
  clienteOptionsDefault = [],
  onChange,
  onSearchChange, // Nuevo
  form,
  showOnlyDocument = false,
  autoFocus = false,
  open, // Nueva prop para controlar el dropdown
  ...props
}: SelectClientesProps) {
  const selectClientesRef = useRef<RefSelectBaseProps>(null)
  const [text, setText] = useState('')
  const [lastSelectedDocument, setLastSelectedDocument] = useState('')
  const clienteSeleccionadoRef = useRef(false)

  // Aplicar autoFocus cuando el componente se monta
  useEffect(() => {
    if (autoFocus && selectClientesRef.current) {
      const timer = setTimeout(() => {
        selectClientesRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  const [openModalClienteSearch, setOpenModalClienteSearch] = useState(false)

  const [clienteCreado, setClienteCreado] = useState<Cliente>()
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente>()

  const clienteSeleccionadoStore = useStoreClienteSeleccionado(
    store => store.cliente
  )
  const setClienteSeleccionadoStore = useStoreClienteSeleccionado(
    store => store.setCliente
  )

  const [textDefault, setTextDefault] = useState('')
  useEffect(() => {
    if (text) {
      setTextDefault(text)
      // Notificar al componente padre del cambio de texto
      onSearchChange?.(text)
    }
  }, [text, onSearchChange])

  // Detectar cuando el usuario modifica manualmente el texto y limpiar campos relacionados
  useEffect(() => {
    // Solo limpiar si: hay un documento previo seleccionado, el usuario está escribiendo algo diferente,
    // y realmente hay un cliente seleccionado que limpiar
    if (!showOnlyDocument || !lastSelectedDocument || !clienteSeleccionadoRef.current) return
    // No limpiar si text está vacío (blur del Select) o es igual al documento seleccionado
    if (!text || text === lastSelectedDocument) return

    // El usuario está escribiendo algo diferente → limpiar campos
    clienteSeleccionadoRef.current = false
    if (form) {
      form.setFieldValue('cliente_nombre', '')
      form.setFieldValue('direccion', '')
      form.setFieldValue('telefono', '')
      form.setFieldValue('email', '')
      form.setFieldValue('_cliente_direccion_1', '')
      form.setFieldValue('_cliente_direccion_2', '')
      form.setFieldValue('_cliente_direccion_3', '')
      form.setFieldValue('_cliente_direccion_4', '')
    }
    setClienteSeleccionado(undefined)
    iterarChangeValue({
      refObject: selectClientesRef,
      value: undefined,
    })
  }, [text, lastSelectedDocument, showOnlyDocument, form])

  function handleSelect({ data }: { data?: Cliente } = {}) {
    const cliente = data || clienteSeleccionadoStore
    if (cliente) {
      // Marcar que hay un cliente seleccionado
      clienteSeleccionadoRef.current = true

      setClienteSeleccionado(cliente)

      // Mostrar solo el documento o el formato completo según la prop
      const clienteLabel = showOnlyDocument
        ? cliente.numero_documento || ''
        : cliente.razon_social
        ? `${cliente.numero_documento} : ${cliente.razon_social}`
        : `${cliente.numero_documento} : ${cliente.nombres} ${cliente.apellidos}`
      setText(clienteLabel)

      // Guardar el documento seleccionado para detectar cambios
      if (showOnlyDocument && cliente.numero_documento) {
        setLastSelectedDocument(cliente.numero_documento)
      }

      iterarChangeValue({
        refObject: selectClientesRef,
        value: cliente.id,
      })

      // Autocompletar campos del formulario si se proporciona form
      if (form) {
        if (cliente.numero_documento) {
          form.setFieldValue('ruc_dni', cliente.numero_documento)
        }
        if (cliente.telefono) {
          form.setFieldValue('telefono', cliente.telefono)
        }

        // Cargar direcciones desde la tabla direcciones_cliente
        cargarDireccionesCliente(cliente.id)
      }

      setClienteSeleccionadoStore(undefined)
      setOpenModalClienteSearch(false)
      onChange?.(cliente.id, cliente)
    }
  }

  // Función para cargar direcciones desde la API
  const cargarDireccionesCliente = async (clienteId: number) => {
    if (!form) return

    try {
      const { clienteApi } = await import('~/lib/api/cliente')
      const response = await clienteApi.listarDirecciones(clienteId)
      
      if (response.data?.data) {
        const direcciones = response.data.data

        // Limpiar direcciones previas
        form.setFieldValue('_cliente_direccion_1', '')
        form.setFieldValue('_cliente_direccion_2', '')
        form.setFieldValue('_cliente_direccion_3', '')
        form.setFieldValue('_cliente_direccion_4', '')

        // Mapear direcciones por tipo
        direcciones.forEach((dir) => {
          switch (dir.tipo) {
            case 'D1':
              form.setFieldValue('_cliente_direccion_1', dir.direccion)
              break
            case 'D2':
              form.setFieldValue('_cliente_direccion_2', dir.direccion)
              break
            case 'D3':
              form.setFieldValue('_cliente_direccion_3', dir.direccion)
              break
            case 'D4':
              form.setFieldValue('_cliente_direccion_4', dir.direccion)
              break
          }
        })

        // Llenar campo de dirección según el checkbox seleccionado (por defecto D1)
        const direccionSeleccionada = form.getFieldValue('direccion_seleccionada') || 'D1'
        const direccionKey = `_cliente_direccion_${direccionSeleccionada.replace('D', '')}`
        const direccionActual = form.getFieldValue(direccionKey)

        if (direccionActual) {
          form.setFieldValue('direccion', direccionActual)
        } else {
          // Fallback a dirección 1 si la seleccionada no existe
          const direccion1 = form.getFieldValue('_cliente_direccion_1')
          if (direccion1) {
            form.setFieldValue('direccion', direccion1)
          }
        }
      }
    } catch (error) {
      console.error('Error cargando direcciones del cliente:', error)
    }
  }

  const [value] = useDebounce(text, 300) // Reducir de 1000ms a 300ms

  const { response, loading } = useSearchClientes({ value })

  useEffect(() => {
    if (!response || response.length === 0) return
    const textoLimpio = text.trim()
    if (!textoLimpio) return

    // Buscar coincidencia exacta del documento entre todos los resultados
    const exactMatch = response.find(c => c.numero_documento === textoLimpio)
    if (exactMatch) {
      handleSelect({ data: exactMatch })
      return
    }

    // Si hay exactamente 1 resultado y el texto es suficientemente largo, autoseleccionar
    if (response.length === 1) {
      const cliente = response[0]
      if (textoLimpio.length >= 8 && cliente.numero_documento.startsWith(textoLimpio)) {
        handleSelect({ data: cliente })
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response])

  const getLabel = (cliente: Pick<Cliente, 'numero_documento' | 'razon_social' | 'nombres' | 'apellidos'>) => {
      if (showOnlyDocument) return cliente.numero_documento || ''
      if (cliente.razon_social) return `${cliente.numero_documento} : ${cliente.razon_social}`
      return `${cliente.numero_documento} : ${cliente.nombres} ${cliente.apellidos}`
  }

  // Label completo para el dropdown (siempre mostrar nombre para identificar)
  const getDropdownLabel = (cliente: Pick<Cliente, 'numero_documento' | 'razon_social' | 'nombres' | 'apellidos'>) => {
      if (cliente.razon_social) return `${cliente.numero_documento} : ${cliente.razon_social}`
      return `${cliente.numero_documento} : ${cliente.nombres} ${cliente.apellidos}`
  }

  return (
    <div className='flex items-center gap-4 w-full'>
      <SelectBase
        ref={selectClientesRef}
        form={form}
        showSearch
        uppercase={true}
        filterOption={false}
        onSearch={(val) => {
          // Evitar que el blur del Select resetee el texto a vacío cuando ya hay un cliente seleccionado
          if (val === '' && clienteSeleccionadoRef.current) return
          setText(val)
        }}
        searchValue={text}
        prefix={<FaUser className={classNameIcon} size={sizeIcon} />}
        variant={variant}
        placeholder={placeholder}
        loading={loading}
        autoFocus={autoFocus}
        optionRender={showOnlyDocument ? (option) => {
          // En el dropdown siempre mostrar el label completo con nombre
          return <span>{(option.data as any).fullLabel || option.label}</span>
        } : undefined}
        options={[
          ...(clienteCreado
            ? [
                {
                  value: clienteCreado.id,
                  label: getLabel(clienteCreado),
                  fullLabel: getDropdownLabel(clienteCreado),
                },
              ]
            : []),
          ...(clienteSeleccionado
            ? [
                {
                  value: clienteSeleccionado.id,
                  label: getLabel(clienteSeleccionado),
                  fullLabel: getDropdownLabel(clienteSeleccionado),
                },
              ]
            : []),
          ...clienteOptionsDefault.map(cliente => ({
            value: cliente.id,
            label: getLabel(cliente),
            fullLabel: getDropdownLabel(cliente),
          })),
          // Agregar resultados de búsqueda si están disponibles
          ...(response || []).map(cliente => ({
            value: cliente.id,
            label: getLabel(cliente),
            fullLabel: getDropdownLabel(cliente),
          })),
        ].filter(
          (item, index, self) =>
            self.findIndex(i => i.value === item.value) === index
        )}
        onKeyUp={e => {
          if (e.key === 'Enter') setOpenModalClienteSearch(true)
        }}
        open={open !== undefined ? open : undefined} // Usar la prop open si se proporciona, sino usar comportamiento por defecto
        {...props}
      />
      <FaSearch
        className={`text-yellow-600 mb-7 cursor-pointer z-10 ${classIconSearch}`}
        size={15}
        onClick={() => setOpenModalClienteSearch(true)}
      />
      <ModalClienteSearch
        open={openModalClienteSearch}
        setOpen={setOpenModalClienteSearch}
        onOk={() => handleSelect()}
        textDefault={textDefault}
        onRowDoubleClicked={handleSelect}
      />
      {showButtonCreate && (
        <ButtonCreateCliente
          onSuccess={res => {
            setClienteCreado(res)
            iterarChangeValue({
              refObject: selectClientesRef,
              value: res.id,
            })
          }}
          textDefault={textDefault}
          setTextDefault={setTextDefault}
          className={classIconCreate}
        />
      )}
    </div>
  )
}
