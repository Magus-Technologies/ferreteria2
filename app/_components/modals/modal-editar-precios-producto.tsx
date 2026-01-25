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

// Función para calcular comisión de un precio específico
function calcularComision(form: any, tipo: 'especial' | 'minimo' | 'ultimo', precioNuevo: any) {
  const precioPublico = form.getFieldValue('precio_publico')
  const comisionPublico = form.getFieldValue('comision_publico')
  
  const precioPublicoNum = Number(precioPublico)
  const precioNuevoNum = Number(precioNuevo)
  const comisionPublicoNum = Number(comisionPublico)
  
  // Si algún valor es NaN o undefined, establecer comisión en 0
  if (isNaN(precioPublicoNum) || isNaN(precioNuevoNum) || isNaN(comisionPublicoNum)) {
    form.setFieldValue(`comision_${tipo}`, 0)
    return
  }
  
  const comision = comisionPublicoNum - (precioPublicoNum - precioNuevoNum)
  form.setFieldValue(`comision_${tipo}`, comision > 0 ? comision : 0)
}

// Función para recalcular todas las comisiones cuando cambia el precio público
function recalcularComisiones(form: any, precioPublicoNuevo: any) {
  const comisionPublico = form.getFieldValue('comision_publico')
  const precioEspecial = form.getFieldValue('precio_especial')
  const precioMinimo = form.getFieldValue('precio_minimo')
  const precioUltimo = form.getFieldValue('precio_ultimo')
  
  const precioPublicoNum = Number(precioPublicoNuevo)
  const comisionPublicoNum = Number(comisionPublico)
  
  if (isNaN(precioPublicoNum) || isNaN(comisionPublicoNum)) return
  
  // Recalcular comisión especial
  if (precioEspecial !== undefined && precioEspecial !== null) {
    const comisionEspecial = comisionPublicoNum - (precioPublicoNum - Number(precioEspecial))
    form.setFieldValue('comision_especial', comisionEspecial > 0 ? comisionEspecial : 0)
  }
  
  // Recalcular comisión mínimo
  if (precioMinimo !== undefined && precioMinimo !== null) {
    const comisionMinimo = comisionPublicoNum - (precioPublicoNum - Number(precioMinimo))
    form.setFieldValue('comision_minimo', comisionMinimo > 0 ? comisionMinimo : 0)
  }
  
  // Recalcular comisión último
  if (precioUltimo !== undefined && precioUltimo !== null) {
    const comisionUltimo = comisionPublicoNum - (precioPublicoNum - Number(precioUltimo))
    form.setFieldValue('comision_ultimo', comisionUltimo > 0 ? comisionUltimo : 0)
  }
}

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

  // Obtener todas las unidades derivadas del producto en el almacén
  const productoEnAlmacen = (productoSeleccionado as any)?.producto_en_almacenes?.find(
    (pa: any) => pa.almacen_id === almacen_id
  )
  const unidadesDerivadas = productoEnAlmacen?.unidades_derivadas || []

  // Watch para actualizar el factor cuando cambie la unidad derivada
  const unidad_derivada_id = Form.useWatch('unidad_derivada_id', form)

  useEffect(() => {
    if (unidad_derivada_id && unidadesDerivadas.length > 0) {
      const unidadSeleccionada = unidadesDerivadas.find(
        (ud: any) => ud.unidad_derivada.id === unidad_derivada_id
      )
      if (unidadSeleccionada) {
        form.setFieldValue('factor', unidadSeleccionada.factor)
        // Recalcular precio de compra con el nuevo factor
        const costoBase = Number(productoEnAlmacen?.costo || 0)
        form.setFieldValue('precio_compra', costoBase * Number(unidadSeleccionada.factor))
      }
    }
  }, [unidad_derivada_id, unidadesDerivadas, form, productoEnAlmacen])
  useEffect(() => {
    if (open && detallePrecio) {
      const precioCompra = Number(detallePrecio.producto_almacen.costo) * Number(detallePrecio.factor)
      const precioPublico = Number(detallePrecio.precio_publico) || 0
      const gananciaInicial = precioPublico - precioCompra
      const pVentaInicial = precioCompra > 0 ? (gananciaInicial * 100) / precioCompra : 0
      
      form.setFieldsValue({
        unidad_derivada_id: detallePrecio.unidad_derivada.id,
        factor: detallePrecio.factor,
        precio_compra: isNaN(precioCompra) ? 0 : precioCompra,
        p_venta: pVentaInicial,
        precio_publico: precioPublico,
        ganancia: gananciaInicial,
        comision_publico: Number(detallePrecio.comision_publico) || 0,
        precio_especial: Number(detallePrecio.precio_especial) || 0,
        comision_especial: Number(detallePrecio.comision_especial) || 0,
        precio_minimo: Number(detallePrecio.precio_minimo) || 0,
        comision_minimo: Number(detallePrecio.comision_minimo) || 0,
        precio_ultimo: Number(detallePrecio.precio_ultimo) || 0,
        comision_ultimo: Number(detallePrecio.comision_ultimo) || 0,
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
        console.log('🔵 PROCESANDO UNIDAD DERIVADA:', ud.unidad_derivada.name, 'ID:', ud.unidad_derivada.id)
        console.log('🔵 VALORES ORIGINALES:', {
          precio_publico: ud.precio_publico,
          precio_especial: ud.precio_especial,
          precio_minimo: ud.precio_minimo,
          precio_ultimo: ud.precio_ultimo,
        })
        
        // Si es la unidad derivada que estamos editando, usar los nuevos valores
        if (ud.unidad_derivada.id === values.unidad_derivada_id) {
          console.log('✅ ES LA QUE ESTAMOS EDITANDO')
          const precioPublico = Number(values.precio_publico)
          const comisionPublico = Number(values.comision_publico)
          const precioEspecial = Number(values.precio_especial)
          const comisionEspecial = Number(values.comision_especial)
          const precioMinimo = Number(values.precio_minimo)
          const comisionMinimo = Number(values.comision_minimo)
          const precioUltimo = Number(values.precio_ultimo)
          const comisionUltimo = Number(values.comision_ultimo)
          const costo = Number(values.precio_compra)
          
          console.log('🔵 VALORES DEL FORM:', {
            precio_publico: precioPublico,
            precio_especial: precioEspecial,
            precio_minimo: precioMinimo,
            precio_ultimo: precioUltimo,
          })
          
          const resultado = {
            unidad_derivada_id: values.unidad_derivada_id,
            factor: Number(values.factor),
            precio_publico: isNaN(precioPublico) ? 0 : precioPublico,
            comision_publico: isNaN(comisionPublico) ? 0 : comisionPublico,
            precio_especial: isNaN(precioEspecial) ? 0 : precioEspecial,
            comision_especial: isNaN(comisionEspecial) ? 0 : comisionEspecial,
            activador_especial: isNaN(Number(ud.activador_especial)) ? 0 : Number(ud.activador_especial),
            precio_minimo: isNaN(precioMinimo) ? 0 : precioMinimo,
            comision_minimo: isNaN(comisionMinimo) ? 0 : comisionMinimo,
            activador_minimo: isNaN(Number(ud.activador_minimo)) ? 0 : Number(ud.activador_minimo),
            precio_ultimo: isNaN(precioUltimo) ? 0 : precioUltimo,
            comision_ultimo: isNaN(comisionUltimo) ? 0 : comisionUltimo,
            activador_ultimo: isNaN(Number(ud.activador_ultimo)) ? 0 : Number(ud.activador_ultimo),
            costo: isNaN(costo) ? 0 : costo,
          }
          
          console.log('🟢 RESULTADO FINAL:', resultado)
          return resultado
        }
        
        console.log('⚪ NO ES LA QUE ESTAMOS EDITANDO, MANTENER VALORES')
        // Si no es la que estamos editando, mantener los valores originales
        const costoCalculado = Number(productoEnAlmacen.costo) * Number(ud.factor)
        const precioPublico = Number(ud.precio_publico)
        const comisionPublico = Number(ud.comision_publico)
        const precioEspecial = Number(ud.precio_especial)
        const comisionEspecial = Number(ud.comision_especial)
        const precioMinimo = Number(ud.precio_minimo)
        const comisionMinimo = Number(ud.comision_minimo)
        const precioUltimo = Number(ud.precio_ultimo)
        const comisionUltimo = Number(ud.comision_ultimo)
        
        const resultado = {
          unidad_derivada_id: ud.unidad_derivada.id,
          factor: isNaN(Number(ud.factor)) ? 0 : Number(ud.factor),
          precio_publico: isNaN(precioPublico) ? 0 : precioPublico,
          comision_publico: isNaN(comisionPublico) ? 0 : comisionPublico,
          precio_especial: isNaN(precioEspecial) ? 0 : precioEspecial,
          comision_especial: isNaN(comisionEspecial) ? 0 : comisionEspecial,
          activador_especial: isNaN(Number(ud.activador_especial)) ? 0 : Number(ud.activador_especial),
          precio_minimo: isNaN(precioMinimo) ? 0 : precioMinimo,
          comision_minimo: isNaN(comisionMinimo) ? 0 : comisionMinimo,
          activador_minimo: isNaN(Number(ud.activador_minimo)) ? 0 : Number(ud.activador_minimo),
          precio_ultimo: isNaN(precioUltimo) ? 0 : precioUltimo,
          comision_ultimo: isNaN(comisionUltimo) ? 0 : comisionUltimo,
          activador_ultimo: isNaN(Number(ud.activador_ultimo)) ? 0 : Number(ud.activador_ultimo),
          costo: isNaN(costoCalculado) ? 0 : costoCalculado,
        }
        
        console.log('🟢 RESULTADO FINAL (NO EDITADA):', resultado)
        return resultado
      })

      // Preparar datos para actualizar
      const updateData = {
        id: productoSeleccionado.id,
        almacen_id,
        producto_almacen: {
          ubicacion_id: productoEnAlmacen.ubicacion.id,
        },
        unidades_derivadas: todasLasUnidadesDerivadas,
        // Campos del producto
        cod_producto: productoSeleccionado.cod_producto,
        cod_barra: values.cod_barra || productoSeleccionado.cod_barra || null,
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

      console.log('🔴 RESPONSE DEL BACKEND:', response)

      if (response.error) {
        throw new Error(response.error.message)
      }

      console.log('🟢 DATOS DEL BACKEND:', response.data)

      message.success('Precios actualizados correctamente')
      
      // El backend ahora devuelve el producto completo con todas las relaciones
      // Actualizar el store directamente con los datos del backend
      if (response.data) {
        console.log('🟢 ACTUALIZANDO STORE CON DATOS DEL BACKEND')
        setProductoSeleccionado(response.data as any)
      }
      
      // Invalidar queries para refrescar datos en otras partes
      queryClient.invalidateQueries({ queryKey: ['productos-by-almacen'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      
      setOpen(false)
      form.resetFields()
    } catch (error: any) {
      message.error(error.message || 'Error al actualizar precios')
    }
  }

  // Watch para cálculos automáticos
  const precio_compra = Form.useWatch('precio_compra', form)
  const precio_publico = Form.useWatch('precio_publico', form)
  const p_venta = Form.useWatch('p_venta', form)
  const ganancia = Form.useWatch('ganancia', form)
  
  // Calcular % Venta automáticamente
  const utilidadCalculada = precio_publico && precio_compra && Number(precio_compra) > 0
    ? ((Number(precio_publico) - Number(precio_compra)) / Number(precio_compra) * 100)
    : 0
  
  // Calcular Ganancia automáticamente
  const gananciaCalculada = precio_publico && precio_compra
    ? Number(precio_publico) - Number(precio_compra)
    : 0

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
          <LabelBase label="*Unidad Medida:" classNames={{ labelParent: 'mb-4' }}>
            <SelectBase
              propsForm={{
                name: 'unidad_derivada_id',
                rules: [{ required: true, message: 'Requerido' }],
              }}
              prefix={<FaWeightHanging size={15} className="text-rose-700 mx-1" />}
              options={
                unidadesDerivadas.map((ud: any) => ({
                  value: ud.unidad_derivada.id,
                  label: ud.unidad_derivada.name,
                }))
              }
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="*Factor:" classNames={{ labelParent: 'mb-4' }}>
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
          <LabelBase label="*P Compra:" classNames={{ labelParent: 'mb-4' }}>
            <InputNumberBase
              propsForm={{
                name: 'precio_compra',
                rules: [{ required: true, message: 'Requerido' }],
              }}
              prefix={<FaMoneyBill size={15} className="text-rose-700 mx-1" />}
              precision={4}
              min={0}
              onChange={(val) => {
                const precioPublico = form.getFieldValue('precio_publico')
                if (!precioPublico) return

                const costo = val ? Number(val) : 0
                
                // Validar que el costo sea un número válido
                if (isNaN(costo) || costo === 0) {
                  form.setFieldValue('p_venta', 0)
                  form.setFieldValue('ganancia', precioPublico)
                  return
                }
                
                const ganancia = precioPublico - costo
                const pVenta = (ganancia * 100) / costo
                form.setFieldValue('p_venta', pVenta)
                form.setFieldValue('ganancia', ganancia)
              }}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="*% Venta:" classNames={{ labelParent: 'mb-4' }}>
            <InputNumberBase
              propsForm={{
                name: 'p_venta',
              }}
              suffix="%"
              precision={2}
              onChange={(val) => {
                const costo = form.getFieldValue('precio_compra')
                
                // Validar que el costo sea un número válido y mayor que 0
                const costoNum = Number(costo)
                if (!costo || isNaN(costoNum) || costoNum === 0) return

                const pVenta = val ? Number(val) : 0
                const precioPublico = costoNum + costoNum * (pVenta / 100)
                form.setFieldValue('precio_publico', precioPublico)
                
                // Copiar a otros precios
                form.setFieldValue('precio_especial', precioPublico)
                form.setFieldValue('precio_minimo', precioPublico)
                form.setFieldValue('precio_ultimo', precioPublico)
                
                const ganancia = precioPublico - costoNum
                form.setFieldValue('ganancia', ganancia)
                
                // Recalcular comisiones
                recalcularComisiones(form, precioPublico)
              }}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="*Precio público:" classNames={{ labelParent: 'mb-4' }}>
            <InputNumberBase
              propsForm={{
                name: 'precio_publico',
                rules: [{ required: true, message: 'Requerido' }],
              }}
              prefix={<span className="text-blue-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
              onChange={(val) => {
                // Copiar a otros precios
                form.setFieldValue('precio_especial', val)
                form.setFieldValue('precio_minimo', val)
                form.setFieldValue('precio_ultimo', val)

                const costo = form.getFieldValue('precio_compra')
                
                // Validar que el costo sea un número válido y mayor que 0
                const costoNum = Number(costo)
                if (!costo || isNaN(costoNum) || costoNum === 0) {
                  return
                }

                const precioPublico = val ? Number(val) : 0
                const ganancia = precioPublico - costoNum
                const pVenta = (ganancia * 100) / costoNum
                
                form.setFieldValue('p_venta', pVenta)
                form.setFieldValue('ganancia', ganancia)
                
                // Recalcular comisiones
                recalcularComisiones(form, precioPublico)
              }}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="*Ganancia:" classNames={{ labelParent: 'mb-4' }}>
            <InputNumberBase
              propsForm={{
                name: 'ganancia',
              }}
              prefix={<span className="text-green-600 font-bold mx-1">S/.</span>}
              precision={2}
              onChange={(val) => {
                const costo = form.getFieldValue('precio_compra')
                
                // Validar que el costo sea un número válido y mayor que 0
                const costoNum = Number(costo)
                if (!costo || isNaN(costoNum) || costoNum === 0) return

                const ganancia = val ? Number(val) : 0
                const precioPublico = costoNum + ganancia
                const pVenta = (ganancia * 100) / costoNum
                
                form.setFieldValue('precio_publico', precioPublico)
                form.setFieldValue('p_venta', pVenta)
                
                // Copiar a otros precios
                form.setFieldValue('precio_especial', precioPublico)
                form.setFieldValue('precio_minimo', precioPublico)
                form.setFieldValue('precio_ultimo', precioPublico)
                
                // Recalcular comisiones
                recalcularComisiones(form, precioPublico)
              }}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Comisión P. Público:" classNames={{ labelParent: 'mb-4' }}>
            <InputNumberBase
              propsForm={{
                name: 'comision_publico',
              }}
              prefix={<span className="text-cyan-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
              onChange={(val) => {
                // Recalcular todas las comisiones cuando cambia la comisión pública
                const precioPublico = form.getFieldValue('precio_publico')
                const precioEspecial = form.getFieldValue('precio_especial')
                const precioMinimo = form.getFieldValue('precio_minimo')
                const precioUltimo = form.getFieldValue('precio_ultimo')
                
                const comisionPublicoNum = Number(val)
                const precioPublicoNum = Number(precioPublico)
                
                if (isNaN(comisionPublicoNum) || isNaN(precioPublicoNum)) return
                
                // Recalcular comisión especial
                if (precioEspecial !== undefined && precioEspecial !== null) {
                  const comisionEspecial = comisionPublicoNum - (precioPublicoNum - Number(precioEspecial))
                  form.setFieldValue('comision_especial', comisionEspecial > 0 ? comisionEspecial : 0)
                }
                
                // Recalcular comisión mínimo
                if (precioMinimo !== undefined && precioMinimo !== null) {
                  const comisionMinimo = comisionPublicoNum - (precioPublicoNum - Number(precioMinimo))
                  form.setFieldValue('comision_minimo', comisionMinimo > 0 ? comisionMinimo : 0)
                }
                
                // Recalcular comisión último
                if (precioUltimo !== undefined && precioUltimo !== null) {
                  const comisionUltimo = comisionPublicoNum - (precioPublicoNum - Number(precioUltimo))
                  form.setFieldValue('comision_ultimo', comisionUltimo > 0 ? comisionUltimo : 0)
                }
              }}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Precio Especial:" classNames={{ labelParent: 'mb-4' }}>
            <InputNumberBase
              propsForm={{
                name: 'precio_especial',
              }}
              prefix={<span className="text-cyan-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
              onChange={(val) => {
                calcularComision(form, 'especial', val)
              }}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Comisión P. Especial:" classNames={{ labelParent: 'mb-4' }}>
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
          <LabelBase label="Precio Ultimo:" classNames={{ labelParent: 'mb-4' }}>
            <InputNumberBase
              propsForm={{
                name: 'precio_ultimo',
              }}
              prefix={<span className="text-cyan-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
              onChange={(val) => {
                calcularComision(form, 'ultimo', val)
              }}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Comisión P. Último:" classNames={{ labelParent: 'mb-4' }}>
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
          <LabelBase label="Precio Minimo:" classNames={{ labelParent: 'mb-4' }}>
            <InputNumberBase
              propsForm={{
                name: 'precio_minimo',
              }}
              prefix={<span className="text-cyan-600 font-bold mx-1">S/.</span>}
              precision={2}
              min={0}
              onChange={(val) => {
                calcularComision(form, 'minimo', val)
              }}
            />
          </LabelBase>
        </div>

        <div>
          <LabelBase label="Comisión P. Mínimo:" classNames={{ labelParent: 'mb-4' }}>
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
          <LabelBase label="*Barra Medida:" classNames={{ labelParent: 'mb-4' }}>
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
