'use client'

import { useEffect, useRef, useState } from 'react'
import { Form, message } from 'antd'
import { FaBuilding } from 'react-icons/fa6'
import { FaSearch } from 'react-icons/fa'
import { useDebounce } from 'use-debounce'
import { useQuery } from '@tanstack/react-query'
import SelectBase, { SelectBaseProps } from './select-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { transportistaApi, type Transportista } from '~/lib/api/transportista'
import { useServerMutation } from '~/hooks/use-server-mutation'
import { consultaRuc } from '~/app/_actions/consulta-reniec'
import type { ConsultaRuc } from '~/app/_types/consulta-ruc'
import ModalTransportistaSearch from '../../modals/modal-transportista-search'
import { useStoreTransportistaSeleccionado } from '../../modals/store-transportista-seleccionado'

/** Forma mínima que necesita el form de guía para el transportista tercero. */
export type TransportistaSeleccionado = {
  ruc: string
  razon_social: string
  nro_mtc?: string | null
}

interface SelectTransportistasProps
  extends Omit<SelectBaseProps, 'onChange' | 'options'> {
  classNameIcon?: string
  sizeIcon?: number
  classIconSearch?: string
  /**
   * Se dispara al elegir un transportista del catálogo o al resolver un RUC
   * nuevo vía consulta SUNAT. El padre rellena los campos hermanos
   * (razón social / MTC) con estos datos.
   */
  onChange?: (transportista: TransportistaSeleccionado) => void
}

/**
 * Select con búsqueda de transportistas (empresas de transporte para
 * Guía de Remisión con transporte PÚBLICO — Catálogo N° 18 SUNAT).
 *
 * Mismo flujo que el select de clientes:
 * - Escribí 2+ caracteres → busca en el catálogo guardado (RUC o razón social).
 * - Escribí un RUC de 11 dígitos sin match → consulta SUNAT y autocompleta.
 *   Al crear la guía, el backend lo registra en el catálogo (updateOrCreate).
 */
export default function SelectTransportistas({
  placeholder = 'Buscar RUC o razón social',
  classNameIcon = 'text-amber-600 mx-1',
  sizeIcon = 15,
  classIconSearch = '',
  onChange,
  propsForm,
  ...props
}: SelectTransportistasProps) {
  const form = Form.useFormInstance()
  const [text, setText] = useState('')
  const [value] = useDebounce(text, 500)
  const [seleccionado, setSeleccionado] = useState<TransportistaSeleccionado>()

  // Modal de búsqueda (catálogo completo, con creación) — se abre con la
  // lupa o presionando Enter dentro del select, igual que SelectChoferes.
  const [openModalTransportistaSearch, setOpenModalTransportistaSearch] =
    useState(false)
  const [textDefault, setTextDefault] = useState('')
  useEffect(() => {
    if (text) setTextDefault(text)
  }, [text])

  const transportistaSeleccionadoStore = useStoreTransportistaSeleccionado(
    store => store.transportista
  )

  const { data: resultados = [], isFetching } = useQuery({
    queryKey: [QueryKeys.TRANSPORTISTAS, 'select', value],
    queryFn: async () => {
      // Solo activos: el select del formulario no debe ofrecer
      // transportistas desactivados desde el catálogo de administración.
      const res = await transportistaApi.list({
        search: value,
        per_page: 20,
        solo_activos: true,
      })
      return res.data?.data ?? []
    },
    enabled: value.length >= 2,
  })

  // Si el form ya trae un RUC (edición), mostrarlo como opción seleccionada
  // con la razón social que acompaña al registro.
  useEffect(() => {
    if (!propsForm?.name || seleccionado) return
    const ruc = form.getFieldValue(propsForm.name as string)
    const razon = form.getFieldValue('transportista_razon_social')
    if (ruc && razon) setSeleccionado({ ruc, razon_social: razon })
  }, [form, propsForm, seleccionado])

  // Consulta SUNAT para RUCs de 11 dígitos que no están en el catálogo.
  const ultimaConsultaRef = useRef('')
  const { execute: consultarRuc, loading: consultando } = useServerMutation({
    action: consultaRuc,
    onSuccess: res => {
      const data = res.data as ConsultaRuc | undefined
      if (data?.ruc) {
        seleccionar({
          ruc: data.ruc,
          razon_social: data.razonSocial,
          nro_mtc: null,
        })
        // Autocompletar N° Registro MTC desde el portal del MTC (async, no
        // bloquea). Solo se usa un registro HABILITADO — un RUC puede tener
        // varios registros y solo alguno vigente (renovaciones/vencidos).
        transportistaApi.consultaMtc(data.ruc).then(resp => {
          const registros = (resp.data as any)?.data ?? []
          const habilitado = registros.find((r: any) => r.habilitado && r.codigo)
          if (habilitado) {
            seleccionar({
              ruc: data.ruc,
              razon_social: data.razonSocial,
              nro_mtc: habilitado.codigo,
            })
          }
        }).catch(() => { /* portal MTC caído: el campo queda manual */ })
      } else {
        message.warning('No se encontró información para el RUC ingresado')
      }
    },
  })

  function seleccionar(transportista: TransportistaSeleccionado) {
    setSeleccionado(transportista)
    if (propsForm?.name) {
      form.setFieldValue(propsForm.name as string, transportista.ruc)
    }
    onChange?.(transportista)
  }

  // Selección desde el modal de búsqueda: usa la fila pasada por doble click
  // o, si viene del botón "Seleccionar", cae al valor del store (llenado por
  // la tabla en onSelectionChanged).
  function handleSelect({ data }: { data?: Transportista } = {}) {
    const transportista = data || transportistaSeleccionadoStore
    if (transportista) {
      seleccionar(transportista)
      setText(getLabel(transportista))
      setOpenModalTransportistaSearch(false)
    }
  }

  useEffect(() => {
    const esRuc = /^\d{11}$/.test(value)
    if (!esRuc || isFetching || consultando) return
    if (value === seleccionado?.ruc) return

    // Match exacto en catálogo → autoseleccionar sin ir a SUNAT.
    const enCatalogo = resultados.find((t: Transportista) => t.ruc === value)
    if (enCatalogo) {
      seleccionar(enCatalogo)
      return
    }
    if (resultados.length === 0 && ultimaConsultaRef.current !== value) {
      ultimaConsultaRef.current = value
      consultarRuc({ search: value })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, resultados, isFetching])

  const getLabel = (t: TransportistaSeleccionado) =>
    `${t.ruc} : ${t.razon_social}`

  const options = [
    ...resultados.map((t: Transportista) => ({
      value: t.ruc,
      label: getLabel(t),
    })),
    ...(seleccionado
      ? [{ value: seleccionado.ruc, label: getLabel(seleccionado) }]
      : []),
  ].filter(
    (item, index, self) =>
      self.findIndex(i => i.value === item.value) === index
  )

  return (
    <div className='flex items-center gap-4 w-full'>
      <SelectBase
        propsForm={propsForm}
        showSearch
        filterOption={false}
        onSearch={setText}
        searchValue={text}
        allowClear
        prefix={<FaBuilding className={classNameIcon} size={sizeIcon} />}
        placeholder={placeholder}
        loading={isFetching || consultando}
        options={options}
        onChange={ruc => {
          if (!ruc) return
          const t =
            resultados.find((r: Transportista) => r.ruc === ruc) ??
            (seleccionado?.ruc === ruc ? seleccionado : undefined)
          if (t) seleccionar(t)
        }}
        onKeyUp={e => {
          if (e.key === 'Enter') setOpenModalTransportistaSearch(true)
        }}
        {...props}
      />
      <FaSearch
        className={`text-amber-600 mb-7 cursor-pointer z-10 ${classIconSearch}`}
        size={15}
        onClick={() => setOpenModalTransportistaSearch(true)}
      />
      <ModalTransportistaSearch
        open={openModalTransportistaSearch}
        setOpen={setOpenModalTransportistaSearch}
        onOk={() => handleSelect()}
        textDefault={textDefault}
        onRowDoubleClicked={handleSelect}
        onSuccess={transportista => {
          seleccionar(transportista)
          setText(getLabel(transportista))
        }}
      />
    </div>
  )
}
