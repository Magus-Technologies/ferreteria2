'use client'

import { Form, Switch } from 'antd'
import { FaSearch, FaTruck } from 'react-icons/fa'
import FilterDateRangeFields from '~/app/_components/filters/filter-date-range-fields'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import { useStoreFiltrosMisEntregas } from '../../_store/store-filtros-mis-entregas'
import { useStoreEntregaSeleccionada } from '../tables/table-mis-entregas'
import { getEntregaOperativa } from '../../_lib/entregas-parciales'
import dayjs from 'dayjs'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import NotificationPermissionButton from '~/components/notifications/notification-permission-button'
import { useAuth } from '~/lib/auth-context'
import { useDebounce } from 'use-debounce'
import { useState, useEffect, useRef } from 'react'
import { blueColors, greenColors, redColors, orangeColors } from '~/lib/colors'
import {
  TIPO_ENTREGA_LABEL_CON_ICON,
  TIPO_DESPACHO_LABEL_CON_ICON,
  ESTADO_ENTREGA_LABEL_FILTER,
  optionsFromMap,
} from '~/app/_lib/entrega-labels'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import type { TipoDespacho, TipoEntrega } from '~/lib/api/entrega-producto'

interface ValuesFiltersMisEntregas {
  fecha_desde?: dayjs.Dayjs
  fecha_hasta?: dayjs.Dayjs
  estado_entrega?: string[]
  tipo_despacho?: TipoDespacho
  tipo_entrega?: TipoEntrega
  search?: string
  solo_sin_entregas?: boolean
}

export default function FiltersMisEntregas() {
  const [form] = Form.useForm<ValuesFiltersMisEntregas>()
  const setFiltros = useStoreFiltrosMisEntregas((state) => state.setFiltros)
  const { user } = useAuth()
  const esDespachador = user?.rol_sistema === 'DESPACHADOR'
  const esAdmin = user?.rol_sistema === 'ADMINISTRADOR'

  // Sync the form UI once when user loads: non-admin defaults to ['pe']
  const defaultApplied = useRef(false)
  useEffect(() => {
    if (!user || defaultApplied.current) return
    defaultApplied.current = true
    if (!esAdmin) {
      form.setFieldsValue({ estado_entrega: ['pe'] })
    }
  }, [user, esAdmin, form])
  const entregaSeleccionada = useStoreEntregaSeleccionada((s) => s.entrega)
  const triggerAccion = useStoreEntregaSeleccionada((s) => s.triggerAccion)
  const openUpdateModal = useStoreEntregaSeleccionada((s) => s.openUpdateModal)

  // Botón principal "Entregar/Despachar/Confirmar" — cambia según el estado
  // de la entrega seleccionada y el tipo de entrega. Cada tipo abre un modal
  // distinto SIN PDF embebido (el PDF solo se ve desde el dropdown):
  //   - rt (Recojo en Tienda) → ModalMarcarEntregada (acción 'marcar')
  //   - pa (Parcial)          → ModalEntregarParcial   (acción 'parcial')
  //   - de (Despacho)         → ModalMarcarEntregada (acción 'marcar')
  const botonPrincipal = (() => {
    if (!entregaSeleccionada) return null
    const estado = entregaSeleccionada.estado_entrega
    const tipoEntrega = entregaSeleccionada.tipo_entrega

    if (estado === 'pe') {
      if (tipoEntrega === 'pa') {
        return entregaSeleccionada.tipo_despacho === 'pr'
          ? { label: 'Confirmar Entrega', accion: 'parcial' as const }
          : { label: 'Entregar Parcial', accion: 'parcial' as const }
      }
      if (tipoEntrega === 'rt') {
        // Recojo en tienda: actualiza la entrega directamente (sin crear hija)
        return { label: 'Entregar', accion: 'marcar' as const }
      }
      // Despacho (de): siempre crea una hija vía el modal restante
      return { label: 'Despachar', accion: 'restante' as const }
    }

    // Para 'ec' y 'en': detectar UDV pendiente real (nivel hija ya descontado)
    const detalles = entregaSeleccionada.productos_entregados || []
    const tienePendiente = detalles.some(
      (p: any) => Number(p.unidad_derivada_venta?.cantidad_pendiente ?? 0) > 0,
    )
    // Detectar si esta fila es una HIJA (tiene grupo_entrega_id diferente a su id)
    const grupoId = (entregaSeleccionada as any).grupo_entrega_id
    const esHija = grupoId && Number(grupoId) !== Number((entregaSeleccionada as any).id)

    if (estado === 'ec') {
      if (esHija) {
        // Hija en camino → el chofer o admin confirma la entrega
        return { label: 'Confirmar Entrega', accion: 'confirmar' as const }
      }
      // Madre con actividad parcial → programar el siguiente despacho
      return tienePendiente
        ? { label: 'Despachar Restante', accion: 'restante' as const }
        : null
    }

    if (estado === 'en') {
      // Hija: ya cumplió su porción; el UDV pendiente pertenece a la madre.
      if (esHija) return null
      if (tienePendiente) return { label: 'Despachar Restante', accion: 'restante' as const }
    }

    return null
  })()

  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearch] = useDebounce(searchValue, 500)
 
  useEffect(() => {
    form.submit()
  }, [debouncedSearch, form])

  const queryClient = useQueryClient()

  const handleFinish = (values: ValuesFiltersMisEntregas) => {
    const estados = values.estado_entrega
    const estadoFinal = Array.isArray(estados) && estados.length > 0 ? estados : undefined

    // Si el usuario borra las fechas y le da Buscar, NO filtrar por fecha
    // (comportamiento igual a mis-ventas). Antes hacía fallback a "hoy",
    // lo que confundía al usuario porque parecía que el filtro ignoraba
    // su acción de limpiar el campo.
    setFiltros({
      fecha_desde: values.fecha_desde || undefined,
      fecha_hasta: values.fecha_hasta || undefined,
      estado_entrega: estadoFinal,
      tipo_despacho:     values.tipo_despacho || undefined,
      tipo_entrega:      values.tipo_entrega || undefined,
      search:            values.search || undefined,
      solo_sin_entregas: values.solo_sin_entregas || undefined,
    })

    // Forzar refetch aunque los filtros no hayan cambiado, para que se vea
    // el overlay "Cargando..." siempre que el usuario presiona Buscar.
    queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
  }

  return (
    <FormBase
      form={form}
      name="filtros-mis-entregas"
      initialValues={{
        fecha_desde: dayjs().startOf('day'),
        fecha_hasta: dayjs().endOf('day'),
      }}
      className="w-full"
      onFinish={handleFinish}
    >
      <div className="flex items-center justify-between">
        <TituloModulos
          title="Mis Entregas"
          icon={<FaTruck className="text-amber-600" />}
        />
        {/* Botón de notificaciones para despachadores */}
        {esDespachador && (
          <NotificationPermissionButton showLabel size="small" />
        )}
      </div>

      {/* Filtros Desktop */}
      <div className="mt-4">
        <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
          {/* Fila 1 */}
          <ConfigurableElement
            componentId="mis-entregas.filtro-rango-fechas"
            label="Filtro Rango Fechas"
          >
            <div className="col-span-4 grid grid-cols-2 gap-3">
              <FilterDateRangeFields
                fromName="fecha_desde"
                toName="fecha_hasta"
                itemClassName="flex items-center gap-2"
                inputReadOnly
              />
            </div>
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-entregas.filtro-estado"
            label="Filtro Estado"
          >
            <div className="col-span-2 flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                Estado:
              </label>
              <SelectBase
                propsForm={{
                  name: 'estado_entrega',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                className="w-full"
                formWithMessage={false}
                allowClear
                mode="multiple"
                placeholder="Todos"
                maxTagCount="responsive"
                options={optionsFromMap(ESTADO_ENTREGA_LABEL_FILTER)}
              />
            </div>
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-entregas.filtro-tipo-entrega"
            label="Filtro Tipo Entrega"
          >
            <div className="col-span-2 flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                Entrega:
              </label>
              <SelectBase
                propsForm={{
                  name: 'tipo_entrega',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                className="w-full"
                formWithMessage={false}
                allowClear
                placeholder="Todos"
                options={optionsFromMap(TIPO_ENTREGA_LABEL_CON_ICON)}
              />
            </div>
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-entregas.filtro-tipo-despacho"
            label="Filtro Tipo Despacho"
          >
            <div className="col-span-2 flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                Despacho:
              </label>
              <SelectBase
                propsForm={{
                  name: 'tipo_despacho',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                className="w-full"
                formWithMessage={false}
                allowClear
                placeholder="Todos"
                options={optionsFromMap(TIPO_DESPACHO_LABEL_CON_ICON)}
              />
            </div>
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-entregas.filtro-buscar"
            label="Filtro Buscar"
          >
            <div className="col-span-3 flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                Buscar:
              </label>
              <InputBase
                propsForm={{
                  name: 'search',
                  hasFeedback: false,
                  className: '!w-full',
                }}
                placeholder="Cliente, N° Venta..."
                formWithMessage={false}
                prefix={<FaSearch size={14} className="text-amber-600 mx-1" />}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </ConfigurableElement>

          <ConfigurableElement
            componentId="mis-entregas.boton-buscar"
            label="Botón Buscar"
          >
            <div className="col-span-1 flex items-center gap-2">
              <ButtonBase
                color="info"
                size="md"
                type="submit"
                className="flex items-center gap-2 w-full justify-center"
              >
                <FaSearch />
                Buscar
              </ButtonBase>
            </div>
          </ConfigurableElement>


          {/* Botón principal "Entregar/Despachar/Confirmar" — actúa sobre la
              entrega seleccionada en la tabla. Cambia su texto según estado. */}
          {/* <ConfigurableElement
            componentId="mis-entregas.boton-entregar-principal"
            label="Botón Entregar Principal"
          >
            <div className="col-span-2 flex items-center gap-2">
              <ButtonBase
                color="success"
                size="md"
                type="button"
                disabled={!botonPrincipal}
                className="flex items-center gap-2 whitespace-nowrap w-full justify-center"
                onClick={() => {
                  if (!botonPrincipal || !entregaSeleccionada) return
                  const entregaOperativa =
                    getEntregaOperativa(entregaSeleccionada) || entregaSeleccionada
                  const entregaParaModal =
                    (entregaSeleccionada as any)?.__esParcialAgrupado
                      ? entregaSeleccionada
                      : entregaOperativa

                  if (
                    botonPrincipal.accion === 'marcar' ||
                    botonPrincipal.accion === 'parcial'
                  ) {
                    openUpdateModal(entregaParaModal as any, false)
                    return
                  }

                  if (botonPrincipal.accion === 'restante') {
                    openUpdateModal(entregaParaModal as any, true)
                    return
                  }

                  triggerAccion(botonPrincipal.accion)
                }}
              >
                <FaTruck />
                {botonPrincipal ? botonPrincipal.label : 'Entregar'}
              </ButtonBase>
            </div>
          </ConfigurableElement> */}

          {/* Leyenda de colores (al estilo mis-ventas) */}
          <div className="col-span-12 flex items-center gap-5 text-xs border-t border-gray-100 pt-2">
            <span className="font-semibold text-gray-700">Leyenda:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: orangeColors[2] }} />
              <span className="text-gray-600">Pendiente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: blueColors[2] }} />
              <span className="text-gray-600">En Camino</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: greenColors[2] }} />
              <span className="text-gray-600">Entregado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: redColors[2] }} />
              <span className="text-gray-600">Cancelado</span>
            </div>
          </div>
        </div>
      </div>
    </FormBase>
  )
}
