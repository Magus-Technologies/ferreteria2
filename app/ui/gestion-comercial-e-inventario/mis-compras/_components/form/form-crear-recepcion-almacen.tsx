import { FormInstance, Modal, Form as AntForm, Input, Tooltip, message } from 'antd'
import { useState, useEffect, useCallback } from 'react'
import { BsFillPostcardFill } from 'react-icons/bs'
import { FaAddressCard, FaIdCardAlt } from 'react-icons/fa'
import { FaPlus } from 'react-icons/fa6'
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

  // ── Crear vehículo / chofer del proveedor desde el botón "+" ──
  const [openCarroModal, setOpenCarroModal] = useState(false)
  const [openChoferModal, setOpenChoferModal] = useState(false)
  const [savingCarro, setSavingCarro] = useState(false)
  const [savingChofer, setSavingChofer] = useState(false)
  const [carroForm] = AntForm.useForm<{ placa: string }>()
  const [choferForm] = AntForm.useForm<{ dni: string; name: string; licencia: string }>()

  const handleCrearCarro = async (values: { placa: string }) => {
    if (!proveedor?.id) return
    setSavingCarro(true)
    try {
      const res = await proveedorApi.addCarro(proveedor.id, { placa: values.placa })
      if (res.error) throw new Error(res.error.message)
      const nuevo = res.data?.data
      if (nuevo) {
        setProveedor(prev =>
          prev ? { ...prev, carros: [...(prev.carros ?? []), nuevo] } : prev
        )
        setCarroId(nuevo.id)
        form.setFieldValue('transportista_placa', nuevo.placa)
      }
      message.success('Vehículo agregado correctamente')
      carroForm.resetFields()
      setOpenCarroModal(false)
    } catch (e) {
      message.error((e as Error)?.message || 'Error al agregar el vehículo')
    } finally {
      setSavingCarro(false)
    }
  }

  const handleCrearChofer = async (values: {
    dni: string
    name: string
    licencia: string
  }) => {
    if (!proveedor?.id) return
    setSavingChofer(true)
    try {
      const res = await proveedorApi.addChofer(proveedor.id, values)
      if (res.error) throw new Error(res.error.message)
      const nuevo = res.data?.data
      if (nuevo) {
        setProveedor(prev =>
          prev ? { ...prev, choferes: [...(prev.choferes ?? []), nuevo] } : prev
        )
        setChoferId(nuevo.id)
        form.setFieldValue('transportista_name', nuevo.name)
        form.setFieldValue('transportista_licencia', nuevo.licencia)
        form.setFieldValue('transportista_dni', nuevo.dni)
      }
      message.success('Chofer agregado correctamente')
      choferForm.resetFields()
      setOpenChoferModal(false)
    } catch (e) {
      message.error((e as Error)?.message || 'Error al agregar el chofer')
    } finally {
      setSavingChofer(false)
    }
  }

  // Botón "+" reutilizable para crear vehículo / chofer del proveedor.
  const BotonAgregar = ({
    onClick,
    title,
  }: {
    onClick: () => void
    title: string
  }) => (
    <Tooltip title={proveedor ? title : 'Selecciona un proveedor primero'}>
      <button
        type='button'
        disabled={!proveedor}
        onClick={onClick}
        className='flex items-center justify-center w-8 h-8 shrink-0 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
      >
        <FaPlus size={13} />
      </button>
    </Tooltip>
  )

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
            <div className='flex items-center gap-1'>
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
              <BotonAgregar
                title='Agregar vehículo'
                onClick={() => setOpenCarroModal(true)}
              />
            </div>
          </LabelBase>

          <LabelBase label='Chofer:' orientation='column'>
            <div className='flex items-center gap-1'>
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
              <BotonAgregar
                title='Agregar chofer'
                onClick={() => setOpenChoferModal(true)}
              />
            </div>
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

      {/* Modal: crear vehículo del proveedor */}
      <Modal
        title='Agregar Vehículo'
        open={openCarroModal}
        onCancel={() => setOpenCarroModal(false)}
        onOk={() => carroForm.submit()}
        okText='Agregar'
        confirmLoading={savingCarro}
        destroyOnHidden
      >
        <AntForm form={carroForm} layout='vertical' onFinish={handleCrearCarro}>
          <AntForm.Item
            name='placa'
            label='Placa'
            rules={[{ required: true, message: 'Ingresa la placa' }]}
          >
            <Input placeholder='Placa' />
          </AntForm.Item>
        </AntForm>
      </Modal>

      {/* Modal: crear chofer del proveedor */}
      <Modal
        title='Agregar Chofer'
        open={openChoferModal}
        onCancel={() => setOpenChoferModal(false)}
        onOk={() => choferForm.submit()}
        okText='Agregar'
        confirmLoading={savingChofer}
        destroyOnHidden
      >
        <AntForm form={choferForm} layout='vertical' onFinish={handleCrearChofer}>
          <InputConsultaRuc
            form={choferForm}
            nameWatch='dni'
            maxLength={8}
            prefix={<FaAddressCard className='text-cyan-600 mx-1' />}
            placeholder='DNI (se consulta automáticamente)'
            propsForm={{
              name: 'dni',
              label: 'DNI',
              rules: [
                { required: true, message: 'Ingresa el DNI' },
                { len: 8, message: 'El DNI debe tener 8 dígitos' },
              ],
            }}
            onSuccess={res => {
              const dniData = (res as ConsultaDni)?.dni
                ? (res as ConsultaDni)
                : undefined
              if (dniData) {
                choferForm.setFieldValue(
                  'name',
                  `${dniData.nombres} ${dniData.apellidoPaterno} ${dniData.apellidoMaterno}`
                )
              }
            }}
          />
          <AntForm.Item
            name='name'
            label='Nombres y Apellidos'
            rules={[{ required: true, message: 'Ingresa los nombres y apellidos' }]}
          >
            <Input placeholder='Nombres y Apellidos' />
          </AntForm.Item>
          <AntForm.Item
            name='licencia'
            label='Licencia'
            rules={[{ required: true, message: 'Ingresa la licencia' }]}
          >
            <Input placeholder='Licencia' />
          </AntForm.Item>
        </AntForm>
      </Modal>
    </>
  )
}
