'use client'

import { useEffect, useState } from 'react'
import { Form, message } from 'antd'
import { FaBox, FaCalendar, FaWeightHanging, FaExchangeAlt } from 'react-icons/fa'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import LabelBase from '~/components/form/label-base'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import SelectBase from '~/app/_components/form/selects/select-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import { useStoreAlmacen } from '~/store/store-almacen'
import { transferenciaStockApi, type TransferenciaStock } from '~/lib/api/transferencia-stock'
import { getStock } from '~/app/_utils/get-stock'
import { toUTCBD } from '~/utils/fechas'
import type { Producto } from '~/app/_types/producto'
import ModalDocTransferenciaStock from './modal-doc-transferencia-stock'

type FormTransferirStock = {
  fecha: Dayjs
  almacen_origen_id: number
  almacen_destino_id: number
  producto_id: number
  unidad_derivada_id: number
  cantidad: number
  descripcion?: string
}

type ModalTransferirStockProps = {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function ModalTransferirStock({
  open,
  setOpen,
}: ModalTransferirStockProps) {
  const [form] = Form.useForm<FormTransferirStock>()
  const queryClient = useQueryClient()
  const almacenId = useStoreAlmacen((s) => s.almacen_id)

  const [producto, setProducto] = useState<Producto | undefined>()
  const [factor, setFactor] = useState(0)
  const [openDoc, setOpenDoc] = useState(false)
  const [docData, setDocData] = useState<TransferenciaStock | undefined>()

  const almacenOrigenId = Form.useWatch('almacen_origen_id', form)
  const cantidad = Form.useWatch('cantidad', form)

  // Obtener producto_en_almacen del origen
  const productoEnAlmacenOrigen = producto?.producto_en_almacenes?.find(
    (item) => item.almacen_id === almacenOrigenId,
  )
  const unidadesDerivadas = productoEnAlmacenOrigen?.unidades_derivadas

  // Auto-seleccionar primera unidad derivada cuando cambia el producto
  useEffect(() => {
    if (unidadesDerivadas?.length) {
      form.setFieldValue('unidad_derivada_id', unidadesDerivadas[0].unidad_derivada.id)
      setFactor(Number(unidadesDerivadas[0].factor ?? 0))
    } else {
      form.setFieldValue('unidad_derivada_id', undefined)
      setFactor(0)
    }
  }, [form, unidadesDerivadas])

  // Reset cuando se cierra
  useEffect(() => {
    if (!open) {
      setProducto(undefined)
      setFactor(0)
    }
  }, [open])

  // Calcular stocks
  const stockActualOrigen = Number(productoEnAlmacenOrigen?.stock_fraccion ?? 0)
  const cantidadFraccion = Number(cantidad ?? 0) * factor
  const stockNuevoOrigen = stockActualOrigen - cantidadFraccion
  const unidadesContenidas = Number(producto?.unidades_contenidas ?? 0)

  const mutation = useMutation({
    mutationFn: async (values: FormTransferirStock) => {
      const result = await transferenciaStockApi.create({
        almacen_origen_id: values.almacen_origen_id,
        almacen_destino_id: values.almacen_destino_id,
        producto_id: values.producto_id,
        unidad_derivada_id: values.unidad_derivada_id,
        cantidad: values.cantidad,
        fecha: values.fecha ? toUTCBD({ date: values.fecha }) : undefined,
        descripcion: values.descripcion,
      })

      if (result.error) throw new Error(result.error.message)
      // Backend wraps in { data: ... } and apiRequest wraps again
      const transferencia = (result.data as any)?.data || result.data
      return transferencia as TransferenciaStock
    },
    onSuccess: (data) => {
      message.success('Transferencia de stock creada correctamente')
      queryClient.invalidateQueries({ queryKey: ['productos-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['transferencias-stock'] })
      setOpen(false)
      form.resetFields()
      setDocData(data)
      setOpenDoc(true)
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al crear la transferencia')
    },
  })

  return (
    <>
    <ModalDocTransferenciaStock open={openDoc} setOpen={setOpenDoc} data={docData} />
    <ModalForm
      modalProps={{
        title: (
          <TitleForm>
            <FaExchangeAlt className="inline mr-2" />
            Transferir Stock
          </TitleForm>
        ),
        className: 'w-[95vw] xl:w-auto xl:min-w-[650px] max-w-[750px]',
        wrapClassName: '!flex !items-center',
        centered: true,
        okButtonProps: { loading: mutation.isPending, disabled: mutation.isPending },
        okText: 'Transferir',
        styles: {
          body: {
            maxHeight: 'calc(100vh - 150px)',
            overflowY: 'auto',
          },
        },
      }}
      onCancel={() => form.resetFields()}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: (values: FormTransferirStock) => mutation.mutate(values),
        initialValues: {
          fecha: dayjs(),
          almacen_origen_id: almacenId ?? 1,
        },
      }}
    >
      {/* Fecha */}
      <LabelBase label="Fecha:" classNames={{ labelParent: 'mb-6' }}>
        <DatePickerBase
          prefix={<FaCalendar className="text-cyan-600 mx-1" />}
          propsForm={{ name: 'fecha' }}
          placeholder="Fecha"
          className="w-full"
        />
      </LabelBase>

      {/* Almacén Origen y Destino */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <LabelBase label="Almacén Origen:" className="w-full" classNames={{ labelParent: 'mb-6' }}>
          <SelectAlmacen
            size="middle"
            className="w-full"
            classNameIcon="text-emerald-700 mx-1"
            afecta_store={false}
            propsForm={{
              name: 'almacen_origen_id',
              rules: [{ required: true, message: 'Selecciona almacén origen' }],
            }}
            form={form}
            onChange={() => {
              // Reset producto cuando cambia el almacén origen
              setProducto(undefined)
              form.setFieldsValue({
                producto_id: undefined,
                unidad_derivada_id: undefined,
                cantidad: undefined,
              })
            }}
          />
        </LabelBase>
        <LabelBase label="Almacén Destino:" className="w-full" classNames={{ labelParent: 'mb-6' }}>
          <SelectAlmacen
            size="middle"
            className="w-full"
            classNameIcon="text-blue-700 mx-1"
            afecta_store={false}
            propsForm={{
              name: 'almacen_destino_id',
              rules: [
                { required: true, message: 'Selecciona almacén destino' },
                ({ getFieldValue }: { getFieldValue: (name: string) => any }) => ({
                  validator(_: any, value: number) {
                    if (!value || getFieldValue('almacen_origen_id') !== value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('Debe ser diferente al origen'))
                  },
                }),
              ],
            }}
            form={form}
          />
        </LabelBase>
      </div>

      {/* Producto */}
      <LabelBase label="Producto:" classNames={{ labelParent: 'mb-6' }}>
        <SelectProductos
          className="w-full"
          classNameIcon="text-rose-700 mx-1"
          onChange={(_, product) => {
            setProducto(product)
            form.setFieldValue('producto_id', product?.id)
          }}
          propsForm={{
            name: 'producto_id',
            rules: [{ required: true, message: 'Selecciona un producto' }],
          }}
          withSearch
          form={form}
          limpiarOnChange
        />
      </LabelBase>

      {/* Unidad Derivada + Cantidad + Stock */}
      <div className="flex gap-4 items-start">
        <LabelBase label="Unidad Derivada:" className="w-full" orientation="column">
          <SelectBase
            prefix={<FaWeightHanging className="text-rose-700 mx-1" size={14} />}
            variant="filled"
            placeholder="Unidad Derivada"
            options={unidadesDerivadas?.map((item) => ({
              value: item.unidad_derivada.id,
              label: item.unidad_derivada.name,
            }))}
            onChange={(val) => {
              const ud = unidadesDerivadas?.find((item) => item.unidad_derivada.id === val)
              setFactor(Number(ud?.factor ?? 0))
            }}
            propsForm={{
              name: 'unidad_derivada_id',
              rules: [{ required: true, message: 'Selecciona unidad' }],
            }}
          />
        </LabelBase>
        <LabelBase label="Cantidad:" className="w-full" orientation="column">
          <InputNumberBase
            propsForm={{ name: 'cantidad' }}
            placeholder="Cantidad"
            precision={3}
            min={0.001}
            prefix={<FaBox size={15} className="text-rose-600 mx-1" />}
          />
        </LabelBase>

        {/* Preview de stock */}
        <div className="flex flex-col items-center justify-center gap-2 min-w-[120px]">
          <div className="flex flex-col items-center">
            <div className="font-bold text-sm">Stock Origen</div>
            <div className="font-bold text-yellow-600 text-2xl text-nowrap">
              {getStock({ stock_fraccion: stockActualOrigen, unidades_contenidas: unidadesContenidas }).stock}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="font-bold text-sm">Después</div>
            <div className={`font-bold text-2xl text-nowrap ${stockNuevoOrigen < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {getStock({ stock_fraccion: stockNuevoOrigen, unidades_contenidas: unidadesContenidas }).stock}
            </div>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <LabelBase label="Observaciones:" classNames={{ labelParent: 'mt-4' }} orientation="column">
        <TextareaBase propsForm={{ name: 'descripcion' }} />
      </LabelBase>
    </ModalForm>
    </>
  )
}
