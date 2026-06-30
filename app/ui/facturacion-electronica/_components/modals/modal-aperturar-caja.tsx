'use client'

import { Form, Button, message } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import LabelBase from '~/components/form/label-base'
import { useState, useMemo, useEffect } from 'react'
import SelectCajaPrincipal from '~/app/ui/facturacion-electronica/_components/selects/select-caja-principal'
import SelectVendedor from '~/app/ui/facturacion-electronica/_components/selects/select-vendedor'
import useAperturarCaja from '../../_hooks/use-aperturar-caja'
import { FaPlus, FaTrash, FaWallet } from 'react-icons/fa'
import ConteoDinero from '~/app/ui/facturacion-electronica/_components/others/conteo-dinero'
import { useQuery } from '@tanstack/react-query'
import { cajaPrincipalApi } from '~/lib/api/caja-principal'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useAuth } from '~/lib/auth-context'
import ModalTicketApertura from './modal-ticket-apertura'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { apiRequest } from '~/lib/api'

type ModalAperturarCajaProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
}

interface VendedorAsignacion {
  id: string
  user_id?: string
  caja_principal_id?: number
  monto: number
  conteo_billetes_monedas?: any
}

export interface AperturarCajaFormValues {
  caja_origen_id: number
  vendedores: VendedorAsignacion[]
}

export default function ModalAperturarCaja({
  open,
  setOpen,
  onSuccess,
}: ModalAperturarCajaProps) {
  const { user } = useAuth()
  const { data: empresaData } = useEmpresaPublica()
  const [form] = Form.useForm<AperturarCajaFormValues>()
  const [vendedores, setVendedores] = useState<VendedorAsignacion[]>([
    { id: Date.now().toString(), user_id: undefined, caja_principal_id: undefined, monto: 0 }
  ])
  const [vendedorSeleccionadoId, setVendedorSeleccionadoId] = useState<string | null>(
    Date.now().toString()
  )
  const [enviarTicket, setEnviarTicket] = useState<boolean>(true)
  const [emailDestino, setEmailDestino] = useState<string>('') // Email para enviar ticket
  const [ticketModal, setTicketModal] = useState<{
    open: boolean
    data: any | null
  }>({
    open: false,
    data: null
  })

  // Cargar todas las cajas principales para mapear user_id -> caja_principal_id
  const { data: cajasPrincipales } = useQuery({
    queryKey: [QueryKeys.CAJAS_PRINCIPALES],
    queryFn: async () => {
      const response = await cajaPrincipalApi.getAll()
      return response.data?.data || []
    },
    enabled: open,
  })

  // Obtener efectivo de apertura asignado al usuario actual
  const { data: efectivoAsignadoData } = useQuery({
    queryKey: ['efectivo-asignado-para-mi'],
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: { total_asignado: number } }>(
        '/cajas/cierre/efectivo-asignado-para-mi',
      )
      return res.data?.data
    },
    enabled: open,
  })

  const efectivoAsignadoTotal = efectivoAsignadoData?.total_asignado || 0
  const [efectivoAsignadoUsado, setEfectivoAsignadoUsado] = useState(false)

  // Auto-completar con el usuario actual cuando se abre el modal (solo si NO es admin)
  useEffect(() => {
    if (open && user) {
      // Auto-completar email con el del usuario
      setEmailDestino((user as any).email || '')

      // Verificar si el usuario es admin
      const esAdmin = (user as any).roles?.some((role: any) =>
        role.name?.toLowerCase() === 'admin' ||
        role.name?.toLowerCase() === 'administrador'
      )

      // Si NO es admin, auto-completar con su usuario (vendedor)
      if (!esAdmin) {
        const nuevoId = Date.now().toString()
        setVendedores([{
          id: nuevoId,
          user_id: user.id,
          caja_principal_id: undefined, // Los vendedores no tienen caja asignada
          monto: 0
        }])
        setVendedorSeleccionadoId(nuevoId)
      }
      // Si es admin, dejar el vendedor vacío para que pueda seleccionar
    }
  }, [open, user])

  // Auto-seleccionar la primera caja principal cuando se cargan
  useEffect(() => {
    if (open && cajasPrincipales && cajasPrincipales.length > 0) {
      const cajaOrigenActual = form.getFieldValue('caja_origen_id')
      if (!cajaOrigenActual) {
        form.setFieldValue('caja_origen_id', cajasPrincipales[0].id)
      }
    }
  }, [open, cajasPrincipales, form])

  const { crearAperturarCaja, loading } = useAperturarCaja({
    onSuccess: async (data) => {
      // Si se usó el efectivo asignado, marcarlo como consumido para que no reaparezca.
      if (efectivoAsignadoUsado) {
        try {
          await apiRequest('/cajas/cierre/consumir-efectivo-asignado', { method: 'POST' })
        } catch {
          // No bloquear la apertura si falla el marcado
        }
        setEfectivoAsignadoUsado(false)
      }
      // Primero llamar a onSuccess para marcar el éxito
      onSuccess?.()
      // Luego cerrar el modal
      setOpen(false)
      handleReset()
      // Mostrar modal de ticket con datos
      setTicketModal({
        open: true,
        data: data
      })
    },
  })

  const handleReset = () => {
    form.resetFields()
    const nuevoId = Date.now().toString()
    setVendedores([{ id: nuevoId, user_id: undefined, caja_principal_id: undefined, monto: 0 }])
    setVendedorSeleccionadoId(nuevoId)
    setEfectivoAsignadoUsado(false)
  }

  const vendedorSeleccionado = vendedores.find(v => v.id === vendedorSeleccionadoId)

  const cajaOrigenId = Form.useWatch('caja_origen_id', form)

  const totalAsignado = useMemo(() =>
    vendedores.reduce((sum, v) => sum + (v.monto || 0), 0),
    [vendedores]
  )

  const esValido = useMemo(() => {
    const tieneOrigen = !!cajaOrigenId
    const tieneMonto = totalAsignado > 0
    const vendedoresValidos = vendedores.every(v => v.user_id && v.monto > 0)

    return tieneOrigen && tieneMonto && vendedoresValidos
  }, [cajaOrigenId, totalAsignado, vendedores])

  const agregarVendedor = () => {
    // Verificar si el usuario es admin
    const esAdmin = (user as any)?.roles?.some((role: any) =>
      role.name?.toLowerCase() === 'admin' ||
      role.name?.toLowerCase() === 'administrador'
    )

    // Solo permitir agregar más vendedores si es admin
    if (!esAdmin) {
      return
    }

    const nuevoId = Date.now().toString()
    setVendedores([...vendedores, {
      id: nuevoId,
      user_id: undefined,
      caja_principal_id: undefined,
      monto: 0
    }])
    setVendedorSeleccionadoId(nuevoId)
  }

  const eliminarVendedor = (id: string) => {
    // Verificar si el usuario es admin
    const esAdmin = (user as any)?.roles?.some((role: any) =>
      role.name?.toLowerCase() === 'admin' ||
      role.name?.toLowerCase() === 'administrador'
    )

    // Solo permitir eliminar si es admin y hay más de un vendedor
    if (!esAdmin || vendedores.length <= 1) {
      return
    }

    const nuevosVendedores = vendedores.filter(v => v.id !== id)
    setVendedores(nuevosVendedores)
    // Si se elimina el vendedor seleccionado, seleccionar el primero
    if (vendedorSeleccionadoId === id) {
      setVendedorSeleccionadoId(nuevosVendedores[0]?.id || null)
    }
  }

  const seleccionarVendedor = (id: string) => {
    setVendedorSeleccionadoId(id)
  }

  const actualizarVendedor = (id: string, campo: keyof VendedorAsignacion, valor: number | string | undefined) => {
    setVendedores(prevVendedores => {
      const updated = prevVendedores.map(v => {
        if (v.id === id) {
          const updatedVendedor = { ...v, [campo]: valor }

          // Si se actualiza el user_id, buscar la caja_principal_id correspondiente
          if (campo === 'user_id' && valor) {
            const caja = cajasPrincipales?.find(c => c.user.id === valor)
            if (caja) {
              updatedVendedor.caja_principal_id = caja.id
            }
          }

          return updatedVendedor
        }
        return v
      })

      return updated
    })
  }

  const actualizarConteoDenominaciones = (id: string, conteo: any) => {
    setVendedores(prevVendedores => prevVendedores.map(v =>
      v.id === id ? { ...v, conteo_billetes_monedas: conteo } : v
    ))
  }

  // Aplicar el efectivo de apertura asignado al vendedor seleccionado (ya viene contado
  // del cierre anterior, así que se carga directo como su monto de distribución).
  const usarEfectivoAsignado = () => {
    if (efectivoAsignadoTotal <= 0) return
    if (!vendedorSeleccionadoId) {
      message.warning('Selecciona primero un vendedor en la lista')
      return
    }
    actualizarVendedor(vendedorSeleccionadoId, 'monto', efectivoAsignadoTotal)
    setEfectivoAsignadoUsado(true)
    message.success(`S/ ${efectivoAsignadoTotal.toFixed(2)} aplicado a la distribución del vendedor`)
  }

  const handleSubmit = (values: AperturarCajaFormValues) => {
    if (!cajaOrigenId) {
      message.error('Debes seleccionar la caja de origen')
      return
    }

    const vendedorSinMonto = vendedores.find(v => !v.monto || v.monto <= 0)
    if (vendedorSinMonto || totalAsignado <= 0) {
      message.error('El monto de cada vendedor debe ser mayor a S/. 0.00')
      return
    }

    const vendedorSinUsuario = vendedores.find(v => !v.user_id)
    if (vendedorSinUsuario) {
      message.error('Todos los vendedores deben tener un usuario asignado')
      return
    }

    // Validar duplicados una última vez
    const userIds = vendedores.map(v => v.user_id).filter(Boolean)
    const uniqueUserIds = new Set(userIds)
    if (userIds.length !== uniqueUserIds.size) {
      message.error('No se puede asignar el mismo vendedor más de una vez')
      return
    }

    const vendedoresValidos = vendedores.filter(v => v.user_id && v.monto > 0)

    crearAperturarCaja(
      {
        caja_origen_id: values.caja_origen_id,
        vendedores: vendedoresValidos,
        enviarTicket,
        emailDestino: emailDestino.trim() || undefined
      },
      empresaData // Pasar datos de empresa para generar el PDF
    )
  }

  return (
    <>
      <ModalForm
        modalProps={{
          width: 800,
          title: <TitleForm>Distribución de Efectivo a Vendedores</TitleForm>,
          centered: true,
          okButtonProps: { loading, disabled: loading || !esValido },
          okText: 'Guardar Distribución',
        }}
        onCancel={handleReset}
        open={open}
        setOpen={setOpen}
        formProps={{
          form,
          onFinish: handleSubmit,
          layout: 'vertical',
        }}
      >
        {/* Encabezado con Origen y Destino */}
        <div className='mb-1 p-0.5 bg-orange-50 rounded-lg border border-orange-200'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex-1'>
              <LabelBase label='Origen' orientation='column'>
                <SelectCajaPrincipal
                  placeholder='Selecciona la caja de origen'
                  propsForm={{
                    name: 'caja_origen_id',
                    rules: [{ required: true, message: 'Selecciona la caja de origen' }],
                  }}
                />
              </LabelBase>
            </div>
            <div className='flex items-center text-xl text-orange-600 font-bold'>→</div>
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-center'>
                <div className='text-xs text-slate-600 mb-1'>Destino</div>
                <div className='font-semibold text-slate-800'>Caja Chica</div>
              </div>
            </div>
          </div>
        </div>

        {/* Efectivo de Apertura asignado */}
        {efectivoAsignadoTotal > 0 && (
          <div className='p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <FaWallet className='text-emerald-600 text-lg' />
              <div>
                <p className='text-sm text-slate-700'>
                  Tienes <strong className='text-emerald-700'>S/ {efectivoAsignadoTotal.toFixed(2)}</strong> asignado como efectivo de apertura
                </p>
                <p className='text-xs text-slate-500'>
                  Este monto fue dejado al cerrar caja y asignado a ti. Aplícalo al vendedor seleccionado.
                </p>
              </div>
            </div>
            <Button
              type='primary'
              size='small'
              onClick={usarEfectivoAsignado}
              disabled={efectivoAsignadoUsado}
              className='!bg-emerald-600 hover:!bg-emerald-700'
            >
              {efectivoAsignadoUsado ? 'Aplicado ✓' : `Usar S/ ${efectivoAsignadoTotal.toFixed(2)}`}
            </Button>
          </div>
        )}

        {/* Layout de dos columnas */}
        <div className='grid grid-cols-2 gap-3'>
          {/* COLUMNA IZQUIERDA: Distribución a Vendedores */}
          <div className='border border-slate-200 rounded-lg overflow-hidden'>
            <div className='bg-orange-50 p-2 border-b border-slate-200'>
              <div className='flex justify-between items-center mb-2'>
                <div>
                  <h3 className='font-semibold text-slate-800 text-sm'>
                    Distribución a Vendedores
                  </h3>
                  <p className='text-xs text-slate-600'>Click en vendedor para asignar</p>
                </div>
                <Button
                  onClick={agregarVendedor}
                  icon={<FaPlus />}
                  size='small'
                  type='primary'
                  disabled={!(user as any)?.roles?.some((role: any) =>
                    role.name?.toLowerCase() === 'admin' ||
                    role.name?.toLowerCase() === 'administrador'
                  )}
                >
                  Agregar
                </Button>
              </div>
              <div className='pt-2 border-t border-orange-200 space-y-2'>
                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id='enviar-ticket'
                    checked={enviarTicket}
                    onChange={(e) => setEnviarTicket(e.target.checked)}
                    className='w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500'
                  />
                  <label htmlFor='enviar-ticket' className='text-xs text-slate-700 cursor-pointer'>
                    Enviar ticket y correo al completar
                  </label>
                </div>
                {enviarTicket && (
                  <input
                    type='email'
                    placeholder='Correo electrónico (opcional)'
                    value={emailDestino}
                    onChange={(e) => setEmailDestino(e.target.value)}
                    className='w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                  />
                )}
              </div>
            </div>
            <div className='p-2 space-y-2 max-h-[350px] overflow-y-auto'>
              {vendedores.map((vendedor, index) => (
                <div
                  key={vendedor.id}
                  className={`flex gap-2 items-center p-2 rounded-lg border-2 cursor-pointer transition-all ${vendedorSeleccionadoId === vendedor.id
                    ? 'bg-orange-50 border-orange-500 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:border-orange-300'
                    }`}
                  onClick={() => seleccionarVendedor(vendedor.id)}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs ${vendedorSeleccionadoId === vendedor.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-400 text-white'
                    }`}>
                    {index + 1}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <SelectVendedor
                      placeholder='Seleccionar vendedor'
                      value={vendedor.user_id}
                      soloVendedores={false}
                      mostrarDocumento={false}
                      excludeIds={vendedores
                        .filter(v => v.id !== vendedor.id && v.user_id)
                        .map(v => v.user_id as string)
                      }
                      disabled={
                        // Bloquear si NO es admin Y es el usuario actual
                        !(user as any)?.roles?.some((role: any) =>
                          role.name?.toLowerCase() === 'admin' ||
                          role.name?.toLowerCase() === 'administrador'
                        ) && vendedor.user_id === user?.id
                      }
                      onChange={(value) => {
                        const userId = value as string
                        const caja = cajasPrincipales?.find(c => c.user.id === userId)

                        setVendedores(vendedores.map(v =>
                          v.id === vendedor.id
                            ? { ...v, user_id: userId, caja_principal_id: caja?.id }
                            : v
                        ))
                        seleccionarVendedor(vendedor.id)
                      }}
                    />
                  </div>
                  <div className='w-24 text-right'>
                    <span className={`font-bold ${vendedor.monto <= 0 ? 'text-red-500' : 'text-orange-600'}`}>
                      S/. {vendedor.monto.toFixed(2)}
                    </span>
                    {vendedor.monto <= 0 && (
                      <div className='text-red-500 text-xs'>Requerido &gt; 0</div>
                    )}
                  </div>
                  {vendedores.length > 1 && (user as any)?.roles?.some((role: any) =>
                    role.name?.toLowerCase() === 'admin' ||
                    role.name?.toLowerCase() === 'administrador'
                  ) && (
                      <Button
                        danger
                        icon={<FaTrash />}
                        onClick={(e) => {
                          e.stopPropagation()
                          eliminarVendedor(vendedor.id)
                        }}
                        size='small'
                      />
                    )}
                </div>
              ))}
            </div>
            {/* Total con validación visual */}
            <div className={`p-2 border-t text-sm font-semibold flex justify-between items-center ${totalAsignado <= 0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
              <span>Total a distribuir:</span>
              <span>S/. {totalAsignado.toFixed(2)}</span>
            </div>
            {totalAsignado <= 0 && (
              <div className='p-1.5 bg-red-50 text-red-600 text-xs text-center'>
                El total debe ser mayor a S/. 0.00 para guardar
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: Desglose de Denominaciones */}
          <div className='border border-slate-200 rounded-lg overflow-hidden'>
            <div className='bg-orange-50 p-2 border-b border-slate-200'>
              <h3 className='font-semibold text-slate-800 text-sm'>
                Desglose de Denominaciones
              </h3>
              <p className='text-xs text-slate-600'>
                {vendedorSeleccionado
                  ? 'Ingrese billetes y monedas'
                  : 'Seleccione un vendedor'}
              </p>
            </div>
            <div className='p-1 flex justify-center max-h-[350px] overflow-y-auto'>
              {vendedorSeleccionado ? (
                <ConteoDinero
                  key={vendedorSeleccionado.id}
                  onChange={(totalFinal: number, conteoData: any) => {
                    actualizarVendedor(vendedorSeleccionado.id, 'monto', totalFinal)
                    actualizarConteoDenominaciones(vendedorSeleccionado.id, conteoData)
                  }}
                  className='w-full'
                />
              ) : (
                <div className='flex items-center justify-center h-full text-slate-400 text-sm'>
                  Seleccione un vendedor
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalForm>

      {/* Modal de Ticket de Apertura */}
      <ModalTicketApertura
        open={ticketModal.open}
        onClose={() => setTicketModal(prev => ({ ...prev, open: false }))}
        apertura={ticketModal.data}
      />
    </>
  )
}
