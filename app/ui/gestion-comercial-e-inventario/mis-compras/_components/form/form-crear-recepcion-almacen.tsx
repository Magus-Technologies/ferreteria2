import { FormInstance } from 'antd'
import { useState, useEffect, useCallback } from 'react'
import { BsFillPostcardFill } from 'react-icons/bs'
import { FaAddressCard, FaIdCardAlt } from 'react-icons/fa'
import { MdFactory } from 'react-icons/md'
import type { Proveedor } from '~/lib/api/proveedor'
import { proveedorApi } from '~/lib/api/proveedor'
import type { Compra } from '~/lib/api/compra'
import type { OrdenCompra } from '~/lib/api/orden-compra'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputConsultaRuc from '~/app/_components/form/inputs/input-consulta-ruc'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import SelectProveedorCarros from '~/app/_components/form/selects/select-proveedor-carros'
import SelectProveedorChoferes from '~/app/_components/form/selects/select-proveedor-choferes'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import { ConsultaDni, ConsultaRuc } from '~/app/_types/consulta-ruc'
import LabelBase from '~/components/form/label-base'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'

export default function FormCrearRecepcionAlmacen({
  form,
  compra,
  ordenCompra,
}: {
  form: FormInstance
  compra?: Compra
  ordenCompra?: OrdenCompra
}) {
  const { can } = usePermissionHook()
  const [proveedor, setProveedor] = useState<Proveedor | undefined>()
  // Valores controlados de los selects de vehículo y chofer, para que el
  // dropdown muestre el que se autoseleccionó al escoger el proveedor.
  const [carroId, setCarroId] = useState<number | undefined>()
  const [choferId, setChoferId] = useState<number | undefined>()

  // Aplica un proveedor completo: guarda el estado y autocompleta transportista,
  // vehículo (primer carro) y chofer (primer chofer) del proveedor.
  const aplicarProveedor = useCallback(
    (prov?: Proveedor) => {
      setProveedor(prov)

      form.setFieldValue('transportista_ruc', prov?.ruc)
      form.setFieldValue('transportista_razon_social', prov?.razon_social)

      const carro = prov?.carros?.[0]
      setCarroId(carro?.id)
      form.setFieldValue('transportista_placa', carro?.placa)

      const chofer = prov?.choferes?.[0]
      setChoferId(chofer?.id)
      form.setFieldValue('transportista_name', chofer?.name)
      form.setFieldValue('transportista_licencia', chofer?.licencia)
      form.setFieldValue('transportista_dni', chofer?.dni)
    },
    [form]
  )

  // Trae el proveedor completo (con carros/choferes) y lo aplica. Usa el
  // `fallback` (objeto liviano del select) si la consulta falla.
  const cargarProveedorCompleto = useCallback(
    async (id?: number, fallback?: Proveedor) => {
      if (!id) {
        aplicarProveedor(undefined)
        return
      }
      try {
        const res = await proveedorApi.getById(id)
        aplicarProveedor(res.data?.data ?? fallback)
      } catch {
        aplicarProveedor(fallback)
      }
    },
    [aplicarProveedor]
  )

  // Carga inicial del proveedor desde la compra / orden de compra.
  useEffect(() => {
    const prov = (compra?.proveedor || ordenCompra?.proveedor) as
      | Proveedor
      | undefined
    cargarProveedorCompleto(
      prov?.id ?? compra?.proveedor_id ?? ordenCompra?.proveedor_id ?? undefined,
      prov
    )
  }, [compra, ordenCompra, cargarProveedorCompleto])

  return (
    <>
      <div className='mt-6 flex flex-col gap-4'>
        {/* Fila de selectores: Proveedor, Vehículo y Chofer */}
        <div className='flex flex-wrap items-end gap-4'>
          <LabelBase label='Proveedor:' orientation='column'>
            <SelectProveedores
              allowClear
              showButtonCreate={can(permissions.PROVEEDOR_CREATE)}
              className='w-[350px] max-w-[350px]'
              classNameIcon='text-cyan-600 mx-1'
              classIconSearch='mb-0!'
              classIconCreate='mb-0!'
              proveedorOptionsDefault={
                compra?.proveedor
                  ? [compra.proveedor as Proveedor]
                  : ordenCompra?.proveedor
                    ? [ordenCompra.proveedor as Proveedor]
                    : undefined
              }
              propsForm={{
                name: 'proveedor_id',
                initialValue: compra?.proveedor_id,
              }}
              form={form}
              onChange={(_, prov) => {
                cargarProveedorCompleto(prov?.id, prov as Proveedor)
              }}
            />
          </LabelBase>

          <LabelBase label='Vehículo:' orientation='column'>
            <SelectProveedorCarros
              allowClear
              className='w-[220px] max-w-[220px]'
              classNameIcon='text-cyan-600 mx-1'
              value={carroId}
              onChange={(value, carro) => {
                setCarroId(value)
                form.setFieldValue('transportista_placa', carro?.placa)
              }}
              proveedor={proveedor}
            />
          </LabelBase>

          <LabelBase label='Chofer:' orientation='column'>
            <SelectProveedorChoferes
              allowClear
              className='w-[320px] max-w-[320px]'
              classNameIcon='text-cyan-600 mx-1'
              value={choferId}
              onChange={(value, chofer) => {
                setChoferId(value)
                form.setFieldValue('transportista_name', chofer?.name)
                form.setFieldValue('transportista_licencia', chofer?.licencia)
                form.setFieldValue('transportista_dni', chofer?.dni)
              }}
              proveedor={proveedor}
            />
          </LabelBase>
        </div>

        {/* Grilla uniforme con los datos del transportista */}
        <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-3'>
          <LabelBase label='Ruc Transportista:' orientation='column'>
            <InputConsultaRuc
              className='w-full'
              prefix={<FaAddressCard className='text-cyan-600 mx-1' />}
              propsForm={{
                name: 'transportista_ruc',
              }}
              placeholder='Ruc'
              onSuccess={res => {
                const rucData = (res as ConsultaRuc)?.ruc
                  ? (res as ConsultaRuc)
                  : undefined
                form.resetFields(['transportista_razon_social'])
                form.setFieldValue(
                  'transportista_razon_social',
                  rucData?.razonSocial
                )
              }}
              form={form}
              nameWatch='transportista_ruc'
            />
          </LabelBase>

          <LabelBase label='Razón Social Transportista:' orientation='column'>
            <InputBase
              className='w-full'
              prefix={<MdFactory className='text-cyan-600 mx-1' />}
              propsForm={{
                name: 'transportista_razon_social',
              }}
              placeholder='Razón Social'
            />
          </LabelBase>

          <LabelBase label='Placa Transportista:' orientation='column'>
            <InputBase
              className='w-full'
              prefix={<BsFillPostcardFill className='text-cyan-600 mx-1' />}
              propsForm={{
                name: 'transportista_placa',
              }}
              placeholder='Placa'
            />
          </LabelBase>

          <LabelBase label='Licencia Transportista:' orientation='column'>
            <InputBase
              className='w-full'
              prefix={<BsFillPostcardFill className='text-cyan-600 mx-1' />}
              propsForm={{
                name: 'transportista_licencia',
              }}
              placeholder='Licencia'
            />
          </LabelBase>

          <LabelBase label='DNI Transportista:' orientation='column'>
            <InputConsultaRuc
              className='w-full'
              prefix={<FaAddressCard className='text-cyan-600 mx-1' />}
              propsForm={{
                name: 'transportista_dni',
              }}
              placeholder='DNI'
              onSuccess={res => {
                const dniData = (res as ConsultaDni)?.dni
                  ? (res as ConsultaDni)
                  : undefined
                form.resetFields(['transportista_name'])
                form.setFieldValue(
                  'transportista_name',
                  `${dniData?.nombres} ${dniData?.apellidoPaterno} ${dniData?.apellidoMaterno}`
                )
              }}
              form={form}
              nameWatch='transportista_dni'
              automatico={false}
            />
          </LabelBase>

          <LabelBase
            label='Nombres y Apellidos Transportista:'
            orientation='column'
          >
            <InputBase
              className='w-full'
              prefix={<FaIdCardAlt className='text-cyan-600 mx-1' />}
              propsForm={{
                name: 'transportista_name',
              }}
              placeholder='Nombres y Apellidos'
            />
          </LabelBase>

          <LabelBase label='Guía Remisión Transportista:' orientation='column'>
            <InputBase
              className='w-full'
              prefix={<FaIdCardAlt className='text-cyan-600 mx-1' />}
              propsForm={{
                name: 'transportista_guia_remision',
              }}
              placeholder='Guía de Remisión'
            />
          </LabelBase>
        </div>
      </div>
      <LabelBase label='Observaciones:' orientation='column'>
        <TextareaBase
          rows={3}
          propsForm={{
            name: 'observaciones',
          }}
        />
      </LabelBase>
    </>
  )
}
