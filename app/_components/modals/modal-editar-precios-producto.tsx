'use client'

import { Form, App } from 'antd'
import { useEffect } from 'react'
import LabelBase from '~/components/form/label-base'
import SelectBase from '../form/selects/select-base'
import InputNumberBase from '../form/inputs/input-number-base'
import InputBase from '../form/inputs/input-base'
import { FaWeightHanging, FaMoneyBill } from 'react-icons/fa6'
import { FaBarcode } from 'react-icons/fa'
import { DetalleDePreciosProps } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/tables/columns-detalle-de-precios'
import { productosApiV2 } from '~/lib/api/producto'
import { useQueryClient } from '@tanstack/react-query'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'

interface ModalEditarPreciosProductoProps {
  open: boolean
  setOpen: (open: boolean) => void
  detallePrecio: DetalleDePreciosProps | null
  almacen_id: number
}

export default function ModalEditarPreciosProducto({
  open,
  setOpen,
  detallePrecio,
  almacen_id,
}: ModalEditarPreciosProductoProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const productoSeleccionado = useStoreProductoSeleccionadoSearch(store => store.producto)
  const setProductoSeleccionado = useStoreProductoSeleccionadoSearch(store => store.setProducto)

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open && detallePrecio) {
      form.setFieldsValue({
        unidad_derivada_id: detallePrecio.unidad_derivada.id,
        factor: detallePrecio.factor,
        precio_compra: Number(detallePrecio.producto_almacen.costo) * Number(detallePrecio.factor),
        precio_publico: detallePrecio.precio_publico,
        comision_publico: detallePrecio.comision_publico,
        precio_especial: detallePrecio.precio_especial,
        comision_especial: detallePrecio.comision_especial,
        precio_minimo: detallePrecio.precio_minimo,
        comision_minimo: detallePrecio.comision_minimo,
        precio_ultimo: detallePrecio.precio_ultimo,
        comision_ultimo: detallePrecio.comision_ultimo,
        cod_barra: detallePrecio.producto.cod_barra || '',
      })
    }
  }, [open, detallePrecio, form])

  const handleSubmit = async (values: any) => {
    try {
      if (!productoSeleccionado) {
        throw new Error('No hay producto seleccionado')
      }

      // Obtener todas las unidades derivadas del producto en este almacén desde el store
      const productoEnAlmacen = (productoSeleccionado as any).producto_en_almacenes?.find(
        (pa: any) => pa.almacen_id === almacen_id
      )

      if (!productoEnAlmacen || !productoEnAlmacen.unidades_derivadas) {
        throw new Error('No se encontraron unidades derivadas para este producto')
      }

      // Mapear todas las unidades derivadas, actualizando solo la que se está editando
      const todasLasUnidadesDerivadas = productoEnAlmacen.unidades_derivadas.map((ud: any) => {
        // Si es la unidad derivada que estamos editando, usar los nuevos valores
        if (ud.unidad_derivada.id === values.unidad_derivada_id) {
          return {
            unidad_derivada_id: values.unidad_derivada_id,
            factor: values.factor,
            precio_publico: values.precio_publico,
            comision_publico: values.comision_publico || 0,
            precio_especial: values.precio_especial || 0,
            comision_especial: values.comision_especial || 0,
            activador_especial: ud.activador_especial,
            precio_minimo: values.precio_minimo || 0,
            comision_minimo: values.comision_minimo || 0,
            activador_minimo: ud.activador_minimo,
            precio_ultimo: values.precio_ultimo || 0,
            comision_ultimo: values.comision_ultimo || 0,
            activador_ultimo: ud.activador_ultimo,
            costo: values.precio_compra,
          }
        }
        
        // Si no es la que estamos editando, mantener los valores originales
        return {
          unidad_derivada_id: ud.unidad_derivada.id,
          factor: ud.factor,
          precio_publico: ud.precio_publico,
          comision_publico: ud.comision_publico || 0,
          precio_especial: ud.precio_especial || 0,
          comision_especial: ud.comision_especial || 0,
          activador_especial: ud.activador_especial,
          precio_minimo: ud.precio_minimo || 0,
          comision_minimo: ud.comision_minimo || 0,
          activador_minimo: ud.activador_minimo,
          precio_ultimo: ud.precio_ultimo || 0,
          comision_ultimo: ud.comision_ultimo || 0,
          activador_ultimo: ud.activador_ultimo,
          costo: Number(productoEnAlmacen.costo) * Number(ud.factor),
        }
      })

      // Preparar datos para actualizar
      const updateData = {
        almacen_id,
        producto_almacen: {
          ubicacion_id: productoEnAlmacen.ubicacion.id,
        },
        unidades_derivadas: todasLasUnidadesDerivadas,
        // Campos del producto
        cod_producto: productoSeleccionado.cod_producto,
        cod_barra: values.cod_barra || null,
        name: productoSeleccionado.name,
        name_ticket: productoSeleccionado.name_ticket,
        categoria_id: productoSeleccionado.categoria_id,
        marca_id: productoSeleccionado.marca_id,
        unidad_medida_id: productoSeleccionado.unidad_medida_id,
        accion_tecnica: productoSeleccionado.accion_tecnica,
        img: productoSeleccionado.img,
        ficha_tecnica: productoSeleccionado.ficha_tecnica,
        stock_min: productoSeleccionado.stock_min,
        stock_max: productoSeleccionado.stock_max,
        unidades_contenidas: productoSeleccionado.unidades_contenidas,
        estado: productoSeleccionado.estado,
        permitido: productoSeleccionado.permitido,
      }

      const response = await productosApiV2.update(productoSeleccionado.id, updateData)

      if (response.error) {
        throw new Error(response.error.message)
      }

      message.success('Precios actualizados correctamente')
      
      // Actualizar el store con los nuevos datos
      const productoActualizado = { ...productoSeleccionado } as any
      const productoEnAlmacenIndex = productoActualizado.producto_en_almacenes.findIndex(
        (pa: any) => pa.almacen_id === almacen_id
      )
      
      if (productoEnAlmacenIndex !== -1) {
        // Actualizar las unidades derivadas en el store
        productoActualizado.producto_en_almacenes[productoEnAlmacenIndex].unidades_derivadas = 
          productoActualizado.producto_en_almacenes[productoEnAlmacenIndex].unidades_derivadas.map((ud: any) => {
            if (ud.unidad_derivada.id === values.unidad_derivada_id) {
              return {
                ...ud,
                precio_publico: values.precio_publico,
                comision_publico: values.comision_publico || 0,
                precio_especial: values.precio_especial || 0,
                comision_especial: values.comision_especial || 0,
                precio_minimo: values.precio_minimo || 0,
                comision_minimo: values.comision_minimo || 0,
                precio_ultimo: values.precio_ultimo || 0,
                comision_ultimo: values.comision_ultimo || 0,
              }
            }
            return ud
          })
        
        // Actualizar el código de barra si cambió
        if (values.cod_barra !== productoActualizado.cod_barra) {
          productoActualizado.cod_barra = values.cod_barra || null
        }
      }
      
      // Actualizar el store para que la tabla se refresque inmediatamente
      setProductoSeleccionado(productoActualizado)
      
      // Invalidar queries para refrescar datos en otras partes
      queryClient.invalidateQueries({ queryKey: ['productos-by-almacen'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      
      setOpen(false)
      form.resetFields()
    } catch (error: any) {
      message.error(error.message || 'Error al actualizar precios')
    }
  }

  // Calcular utilidad
  const precio_compra = Form.useWatch('precio_compra', form)
  const precio_publico = Form.useWatch('precio_publico', form)
  const utilidad = precio_publico && precio_compra 
    ? ((Number(precio_publico) - Number(precio_compra)) / Number(precio_compra) * 100).toFixed(2)
    : '0.00'

  return (
    <ModalForm
      modalProps={{
        title: <TitleForm>Modificar Precios de venta de productos</TitleForm>,
        width: 700,
        centered: true,
        okText: 'Modificar',
      }}
      open={open}
      setOpen={setOpen}
      onCancel={() => {
        form.resetFields()
      }}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: 'vertical',
      }}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <LabelBase label="*Unidad Medida:" orientation="column">
            <SelectBase
              propsForm={{
                name: 'unidad_derivada_id',
                rules: [{ required: true, message: 'Requerido' }],
              }}
              prefix={<FaWeightHanging size={15} className="text-rose-700 mx-1" />}
              disabled
              options={
                detallePrecio
                  ? [
                      {
                        value: detallePrecio.unidad_derivada.id,
                        label: detallePrecio.unidad_derivada.name,
                      },
                    ]
                  : []
              }
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="*Factor:" orientation="column">
            <InputNumberBase
              propsForm={{
                name: 'factor',
                rules: [{ required: true, message: 'Requerido' }],
              }}
              disabled
              precision={3}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="*P Compra:" orientation="column">
            <InputNumberBase
              propsForm={{
                name: 'precio_compra',
                rules: [{ required: true, message: 'Requerido' }],
              }}
              prefix={<FaMoneyBill size={15} className="text-rose-700 mx-1" />}
              precision={4}
              min={0}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="*% Venta:" orientation="column">
            <div className="flex items-center h-8 px-3 bg-yellow-200 rounded border border-gray-300 font-bold text-sm">
              {utilidad}%
            </div>
          </LabelBase>
        </div>

        <div>
          <LabelBase label="*Precio público:" orientation="column">
            <InputNumberBase
              propsForm={{
                name: 'precio_publico',
                rules: [{ required: true, message: 'Requerido' }],
              }}
              prefix={<span className="text-blue-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Comisión P. Público:" orientation="column">
            <InputNumberBase
              propsForm={{
                name: 'comision_publico',
              }}
              prefix={<span className="text-cyan-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Precio Especial:" orientation="column">
            <InputNumberBase
              propsForm={{
                name: 'precio_especial',
              }}
              prefix={<span className="text-cyan-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Comisión P. Especial:" orientation="column">
            <InputNumberBase
              propsForm={{
                name: 'comision_especial',
              }}
              prefix={<span className="text-cyan-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Precio Ultimo:" orientation="column">
            <InputNumberBase
              propsForm={{
                name: 'precio_ultimo',
              }}
              prefix={<span className="text-cyan-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Comisión P. Último:" orientation="column">
            <InputNumberBase
              propsForm={{
                name: 'comision_ultimo',
              }}
              prefix={<span className="text-cyan-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Precio Minimo:" orientation="column">
            <InputNumberBase
              propsForm={{
                name: 'precio_minimo',
              }}
              prefix={<span className="text-cyan-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Comisión P. Mínimo:" orientation="column">
            <InputNumberBase
              propsForm={{
                name: 'comision_minimo',
              }}
              prefix={<span className="text-cyan-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
            />
          </LabelBase>
        </div>

        <div className="col-span-2">
          <LabelBase label="*Barra Medida:" orientation="column">
            <InputBase
              propsForm={{
                name: 'cod_barra',
              }}
              prefix={<FaBarcode size={15} className="text-cyan-600 mx-1" />}
              placeholder="Código de barra"
            />
          </LabelBase>
        </div>
      </div>
    </ModalForm>
  )
}
