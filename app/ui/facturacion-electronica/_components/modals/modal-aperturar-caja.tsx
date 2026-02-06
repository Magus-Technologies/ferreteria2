'use client'

import { Form, Button, Alert } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import LabelBase from '~/components/form/label-base'
import { useState, useMemo, useEffect } from 'react'
import SelectCajaPrincipal from '~/app/ui/facturacion-electronica/_components/selects/select-caja-principal'
import SelectVendedor from '~/app/ui/facturacion-electronica/_components/selects/select-vendedor'
import useAperturarCaja from '../../_hooks/use-aperturar-caja'
import { FaPlus, FaTrash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'
import ConteoDinero from '~/app/ui/facturacion-electronica/_components/others/conteo-dinero'
import { useQuery } from '@tanstack/react-query'
import { cajaPrincipalApi } from '~/lib/api/caja-principal'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useAuth } from '~/lib/auth-context'

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
  const [form] = Form.useForm<AperturarCajaFormValues>()
  const [vendedores, setVendedores] = useState<VendedorAsignacion[]>([
    { id: Date.now().toString(), user_id: undefined, caja_principal_id: undefined, monto: 0 }
  ])
  const [vendedorSeleccionadoId, setVendedorSeleccionadoId] = useState<string | null>(
    Date.now().toString()
  )

  // Cargar todas las cajas principales para mapear user_id -> caja_principal_id
  const { data: cajasPrincipales } = useQuery({
    queryKey: [QueryKeys.CAJAS_PRINCIPALES],
    queryFn: async () => {
      const response = await cajaPrincipalApi.getAll()
      return response.data?.data || []
    },
    enabled: open,
  })

  // Auto-completar con el usuario actual cuando se abre el modal (solo si NO es admin)
  useEffect(() => {
    if (open && user) {
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

  const { crearAperturarCaja, loading } = useAperturarCaja({
    onSuccess: () => {
      setOpen(false)
      handleReset()
      onSuccess?.()
    },
  })

  const handleReset = () => {
    form.resetFields()
    const nuevoId = Date.now().toString()
    setVendedores([{ id: nuevoId, user_id: undefined, caja_principal_id: undefined, monto: 0 }])
    setVendedorSeleccionadoId(nuevoId)
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
    setVendedores(vendedores.map(v => {
      if (v.id === id) {
        const updated = { ...v, [campo]: valor }

        // Si se actualiza el user_id, buscar la caja_principal_id correspondiente
        if (campo === 'user_id' && valor) {
          const caja = cajasPrincipales?.find(c => c.user.id === valor)
          if (caja) {
            updated.caja_principal_id = caja.id
          }
        }

        return updated
      }
      return v
    }))
  }

  const handleSubmit = (values: AperturarCajaFormValues) => {
    if (!esValido) {
      return
    }

    const vendedoresValidos = vendedores.filter(v => v.user_id && v.monto > 0)

    crearAperturarCaja({
      caja_origen_id: values.caja_origen_id,
      vendedores: vendedoresValidos
    })
  }

  return (
    <ModalForm
      modalProps={{
        width: 1000,
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

      {/* Layout de dos columnas */}
      <div className='grid grid-cols-2 gap-3 mb-2'>
        {/* COLUMNA IZQUIERDA: Distribución a Vendedores */}
        <div className='border border-slate-200 rounded-lg overflow-hidden'>
          <div className='bg-orange-50 p-2 border-b border-slate-200 flex justify-between items-center'>
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
                <div className='w-28'>
                  <InputNumberBase
                    prefix='S/. '
                    placeholder='0.00'
                    value={vendedor.monto}
                    onChange={(value) => actualizarVendedor(vendedor.id, 'monto', Number(value) || 0)}
                    precision={2}
                    min={0}
                    className='w-full'
                    readOnly
                  />
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
          <div className='p-1 flex justify-center max-h-[280px] overflow-y-auto'>
            {vendedorSeleccionado ? (
              <ConteoDinero
                key={vendedorSeleccionado.id}
                onChange={(total: number) => actualizarVendedor(vendedorSeleccionado.id, 'monto', total)}
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

      {/* Resumen de Operación */}
      <div className={`border-2 rounded-lg p-2 ${totalAsignado > 0
        ? 'border-orange-500 bg-orange-50'
        : 'border-slate-300 bg-slate-50'
        }`}>
        <h3 className='font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm'>
          {totalAsignado > 0 ? (
            <FaCheckCircle className='text-orange-600' />
          ) : (
            <FaExclamationTriangle className='text-slate-600' />
          )}
          RESUMEN DE OPERACIÓN
        </h3>
        <div className='space-y-1'>
          <div className='flex justify-between items-center py-1 border-b border-slate-200'>
            <span className='text-slate-700 text-sm'>Total Asignado:</span>
            <span className='font-bold text-lg text-orange-600'>S/. {totalAsignado.toFixed(2)}</span>
          </div>
          <div className='flex justify-between items-center py-1'>
            <span className='text-slate-700 text-sm'>Vendedores:</span>
            <span className='font-bold text-slate-800'>{vendedores.length}</span>
          </div>
          {totalAsignado > 0 && esValido && (
            <Alert
              message="✓ Listo para procesar la distribución."
              type="success"
              showIcon
              className='mt-2'
            />
          )}
          {totalAsignado === 0 && (
            <Alert
              message="⚠ Asigne montos a los vendedores."
              type="warning"
              showIcon
              className='mt-2'
            />
          )}
        </div>
      </div>
    </ModalForm>
  )
}
