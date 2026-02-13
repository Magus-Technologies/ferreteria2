'use client'

import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { App, Space } from 'antd'
import { FaPlus, FaDoorOpen, FaExchangeAlt, FaArrowsAltH } from 'react-icons/fa'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { cajaPrincipalApi, type CajaPrincipal } from '~/lib/api/caja-principal'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalCrearCaja from '~/app/ui/facturacion-electronica/_components/modals/modal-crear-caja'
import ModalVerSubCajas from '~/app/ui/facturacion-electronica/gestion-cajas/_components/modal-ver-sub-cajas'
import ModalAperturarCaja from '~/app/ui/facturacion-electronica/_components/modals/modal-aperturar-caja'
import ModalTransferirEntreCajasPrincipales from './modal-transferir-entre-cajas-principales'
import ModalMoverDineroSubCajas from './modal-mover-dinero-subcajas'
import ButtonBase from '~/components/buttons/button-base'
import TableBase from '~/components/tables/table-base'
import { AgGridReact } from 'ag-grid-react'
import { useColumnsCajasPrincipales } from './columns-cajas-principales'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'

export default function TableCajasPrincipales() {
  const { modal, message } = App.useApp()
  const [openCrearCaja, setOpenCrearCaja] = useState(false)
  const [openAperturarCaja, setOpenAperturarCaja] = useState(false)
  const [openTransferirCajas, setOpenTransferirCajas] = useState(false)
  const [openMoverDinero, setOpenMoverDinero] = useState(false)
  const [cajaSeleccionada, setCajaSeleccionada] = useState<CajaPrincipal | null>(null)
  const [openVerSubCajas, setOpenVerSubCajas] = useState(false)
  const gridRef = useRef<AgGridReact<CajaPrincipal>>(null)

  // Verificar si tiene permiso para crear cajas
  const canCreateCaja = usePermission(permissions.CAJA_CREATE)

  const { data, isLoading, refetch } = useQuery({
    queryKey: [QueryKeys.CAJAS_PRINCIPALES],
    queryFn: async () => {
      const response = await cajaPrincipalApi.getAll()
      return response.data?.data || []
    },
  })

  const handleVerSubCajas = (caja: CajaPrincipal) => {
    setCajaSeleccionada(caja)
    setOpenVerSubCajas(true)
  }

  const handleMoverDinero = (caja: CajaPrincipal) => {
    setCajaSeleccionada(caja)
    setOpenMoverDinero(true)
  }

  const handleEliminarCaja = (caja: CajaPrincipal) => {
    modal.confirm({
      title: '¿Eliminar Caja Principal?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>¿Estás seguro de eliminar la caja <strong>{caja.nombre}</strong>?</p>
          <p className='text-sm text-slate-600 mt-2'>
            Responsable: {caja.user.name}
          </p>
          <p className='text-sm text-red-600 mt-2'>
            <strong>Advertencia:</strong> Esta acción eliminará todas las sub-cajas asociadas.
          </p>
        </div>
      ),
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          const response = await cajaPrincipalApi.delete(caja.id)

          if (response.error) {
            message.error(response.error.message || 'Error al eliminar la caja')
            return
          }

          message.success('Caja eliminada exitosamente')
          refetch()
        } catch (error) {
          console.error('Error al eliminar caja:', error)
          message.error('Error inesperado al eliminar la caja')
        }
      },
    })
  }

  const columns = useColumnsCajasPrincipales({
    onVerSubCajas: handleVerSubCajas,
    onEliminar: handleEliminarCaja,
  })

  return (
    <div className='w-full'>
      <div className='flex justify-between items-center mb-4'>
        <div className='text-lg font-semibold text-slate-700'>
          Cajas Principales
        </div>
        <Space>
          <ButtonBase
            color='warning'
            onClick={() => setOpenTransferirCajas(true)}
            className='flex items-center gap-2'
            disabled={!data || data.length < 2}
          >
            <FaExchangeAlt />
            Préstamo entre Cajas
          </ButtonBase>
          <ButtonBase
            color='info'
            onClick={() => {
              if (data && data.length > 0) {
                handleMoverDinero(data[0])
              }
            }}
            className='flex items-center gap-2'
            disabled={!data || data.length === 0}
          >
            <FaArrowsAltH />
            Mover entre Sub-Cajas
          </ButtonBase>
          <ButtonBase
            color='info'
            onClick={() => setOpenAperturarCaja(true)}
            className='flex items-center gap-2'
          >
            <FaDoorOpen />
            Agregar Efectivo
          </ButtonBase>
          {canCreateCaja && (
            <ButtonBase
              color='success'
              onClick={() => setOpenCrearCaja(true)}
              className='flex items-center gap-2'
            >
              <FaPlus />
              Nueva Caja
            </ButtonBase>
          )}
        </Space>
      </div>

      <div className='h-[500px] w-full'>
        <TableBase<CajaPrincipal>
          ref={gridRef}
          rowData={data}
          columnDefs={columns}
          loading={isLoading}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
        />
      </div>

      <ModalCrearCaja
        open={openCrearCaja}
        setOpen={setOpenCrearCaja}
        onSuccess={refetch}
      />

      <ModalAperturarCaja
        open={openAperturarCaja}
        setOpen={setOpenAperturarCaja}
        onSuccess={refetch}
      />

      {cajaSeleccionada && (
        <ModalVerSubCajas
          open={openVerSubCajas}
          setOpen={setOpenVerSubCajas}
          cajaPrincipal={cajaSeleccionada}
          onSuccess={refetch}
        />
      )}

      <ModalTransferirEntreCajasPrincipales
        open={openTransferirCajas}
        onClose={() => setOpenTransferirCajas(false)}
        cajasPrincipales={data || []}
      />

      <ModalMoverDineroSubCajas
        open={openMoverDinero}
        setOpen={setOpenMoverDinero}
        onSuccess={refetch}
      />
    </div>
  )
}
