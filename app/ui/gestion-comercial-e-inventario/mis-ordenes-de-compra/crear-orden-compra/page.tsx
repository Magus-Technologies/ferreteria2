'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Form, Tag, App, Modal } from 'antd'
import { useSearchParams } from 'next/navigation'

import { TbShoppingCartPlus } from 'react-icons/tb'
import { FaCalendar } from 'react-icons/fa'
import { MdDelete } from 'react-icons/md'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectTipoMoneda from '~/app/_components/form/selects/select-tipo-moneda'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectTipoDocumento from '~/app/_components/form/selects/select-tipo-documento'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import FormFormaDePagoCompra from '~/app/ui/gestion-comercial-e-inventario/mis-compras/crear-compra/_components/form/form-forma-de-pago-compra'
import { useStoreProductoAgregadoCompra } from '~/app/_stores/store-producto-agregado-compra'
import TableWithTitle from '~/components/tables/table-with-title'
import { AgGridReact } from 'ag-grid-react'
import CellFocusWithoutStyle from '~/components/tables/cell-focus-without-style'
import SidebarSolicitudes, { type ProductoSidebarSelection } from './_components/sidebar-solicitudes'
import ModalCreateProducto from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/modals/modal-create-producto'
import { useStoreEditOrCopyProducto } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-edit-or-copy-producto'

interface ProductoEnOC {
  id: number
  producto_id: number | null
  codigo: string
  nombre: string
  marca: string
  unidad: string
  cantidad: number
  precio_compra: number
  flete: number
  vencimiento: string | null
  lote: string
  subtotal: number
  stock_max?: number | null
  stock_actual?: number
  unidad_factor?: number
}
import type { RequerimientoInterno } from '~/lib/api/requerimiento-interno'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Tooltip } from 'antd'
import { ordenCompraApi, type CreateOrdenCompraRequest } from '~/lib/api/orden-compra'
import { requerimientoInternoApi } from '~/lib/api/requerimiento-interno'
import { productosApiV2 } from '~/lib/api/producto'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { fechaSubmit } from '~/utils/fechas'

export default function CrearOrdenCompraPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const searchParams = useSearchParams()
  const [form] = Form.useForm()
  const [reqSeleccionado, setReqSeleccionado] = useState<RequerimientoInterno | null>(null)
  const [productos, setProductos] = useState<ProductoEnOC[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [openModalCreation, setOpenModalCreation] = useState(false)
  const [productosPendientesCrear, setProductosPendientesCrear] = useState<ProductoSidebarSelection[]>([])
  const [currentProductoIndex, setCurrentProductoIndex] = useState(0)
  const [productoManualActual, setProductoManualActual] = useState<ProductoSidebarSelection | null>(null)
  const [proveedorDefault, setProveedorDefault] = useState<{ id: number; ruc: string; razon_social: string }[]>([])
  const [proveedorRucInicial, setProveedorRucInicial] = useState('')
  
  // Store para manejar el modal de crear producto
  const setOpenModalProducto = useStoreEditOrCopyProducto(state => state.setOpenModal)
  const setProducto = useStoreEditOrCopyProducto(state => state.setProducto)

  // Detectar modo: crear, editar o duplicar
  const ordenId = searchParams.get('id') ? Number(searchParams.get('id')) : null
  const duplicateFromId = searchParams.get('duplicate_from') ? Number(searchParams.get('duplicate_from')) : null
  const isEditMode = !!ordenId
  const isDuplicateMode = !!duplicateFromId

  // Función compartida para cargar datos de una orden en el formulario
  const loadOrdenIntoForm = useCallback(async (id: number, isDuplicate: boolean) => {
    setLoading(true)
    try {
      const response = await ordenCompraApi.getById(id)
      const orden = response.data?.data

      if (!orden) {
        message.error('No se pudo cargar la orden de compra')
        return
      }

      // Pre-cargar proveedor como opción del select para que muestre el RUC
      if (orden.proveedor) {
        const ruc = orden.proveedor.ruc || orden.ruc || ''
        setProveedorDefault([{
          id: orden.proveedor.id ?? orden.proveedor_id,
          ruc,
          razon_social: orden.proveedor.razon_social || '',
        }])
        setProveedorRucInicial(ruc)
      }

      form.setFieldsValue({
        fecha: orden.fecha ? dayjs(orden.fecha) : undefined,
        tipo_moneda: orden.tipo_moneda,
        tipo_de_cambio: orden.tipo_de_cambio,
        proveedor_id: orden.proveedor_id,
        proveedor_ruc: orden.proveedor?.ruc || orden.ruc,
        proveedor_razon_social: orden.proveedor?.razon_social,
        almacen_id: orden.almacen_id,
        tipo_documento: orden.tipo_documento || '01',
        forma_de_pago: orden.forma_de_pago || 'co',
        numero_dias: orden.numero_dias,
        fecha_vencimiento: orden.fecha_vencimiento ? dayjs(orden.fecha_vencimiento) : undefined,
      })

      if (orden.productos && orden.productos.length > 0) {
        const productosData: ProductoEnOC[] = orden.productos.map(p => ({
          id: p.producto_id,
          producto_id: p.producto_id,
          codigo: p.codigo || '',
          nombre: p.nombre || '',
          marca: p.marca || '',
          unidad: p.unidad || 'UND',
          cantidad: p.cantidad,
          precio_compra: p.precio,
          flete: p.flete || 0,
          vencimiento: p.vencimiento,
          lote: p.lote || '',
          subtotal: p.cantidad * p.precio,
        }))
        setProductos(productosData)
      }

      if (isDuplicate) {
        message.info(`Duplicando orden ${orden.codigo} — revisa y guarda como nueva orden`)
      } else {
        message.info(`Editando orden ${orden.codigo}`)
      }
    } catch (error) {
      message.error('Error al cargar la orden de compra')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [form, message])

  // Cargar datos si estamos en modo editar
  useEffect(() => {
    if (!ordenId) return
    loadOrdenIntoForm(ordenId, false)
  }, [ordenId, loadOrdenIntoForm])

  // Cargar datos si estamos en modo duplicar
  useEffect(() => {
    if (!duplicateFromId) return
    loadOrdenIntoForm(duplicateFromId, true)
  }, [duplicateFromId, loadOrdenIntoForm])

  // Limpiar el store de producto agregado cuando se monta el componente en modo edición
  const clearProductoAgregado = useStoreProductoAgregadoCompra(s => s.clearProductoAgregado)
  useEffect(() => {
    if (isEditMode || isDuplicateMode) {
      clearProductoAgregado()
    } else {
      // Valores por defecto para nueva orden
      form.setFieldsValue({
        fecha: dayjs(),
        tipo_moneda: 's',
        tipo_de_cambio: 1,
        tipo_documento: '01',
        forma_de_pago: 'co',
        almacen_id: 1,
      })
    }
  }, [isEditMode, isDuplicateMode, clearProductoAgregado, form])

  const handleRemoveProducto = useCallback((index: number) => {
    setProductos(prev => prev.filter((_, i) => i !== index))
  }, [])

  const productoAgregadoCompra = useStoreProductoAgregadoCompra(s => s.productoAgregado)

  useEffect(() => {
    const p = productoAgregadoCompra
    if (!p?.producto_id) return

    const newProduct: ProductoEnOC = {
      id: p.producto_id,
      producto_id: p.producto_id,
      codigo: p.producto_codigo || '',
      nombre: p.producto_name || '',
      marca: p.marca_name || '',
      unidad: p.unidad_derivada_name || 'UND',
      cantidad: Number(p.cantidad ?? 1),
      precio_compra: Number(p.precio_compra ?? 0),
      flete: Number(p.flete ?? 0),
      vencimiento: p.vencimiento ? (typeof p.vencimiento === 'string' ? p.vencimiento : p.vencimiento.format('YYYY-MM-DD')) : null,
      lote: p.lote ?? '',
      subtotal: Number(p.cantidad ?? 1) * Number(p.precio_compra ?? 0),
      stock_max: (p as any).stock_max,
      stock_actual: (p as any).stock_fraccion,
      unidad_factor: (p as any).unidad_derivada_factor,
    }

    setProductos(prev => {
      const existingIndex = prev.findIndex(e => e.producto_id === p.producto_id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        const existing = updated[existingIndex]
        const nuevaCantidad = existing.cantidad + newProduct.cantidad
        updated[existingIndex] = {
          ...existing,
          cantidad: nuevaCantidad,
          precio_compra: newProduct.precio_compra || existing.precio_compra,
          flete: newProduct.flete || existing.flete,
          lote: newProduct.lote || existing.lote,
          vencimiento: newProduct.vencimiento || existing.vencimiento,
          subtotal: nuevaCantidad * (newProduct.precio_compra || existing.precio_compra),
        }
        return updated
      }
      return [...prev, newProduct]
    })
  }, [productoAgregadoCompra])

  const subTotal = useMemo(() => productos.reduce((acc, p) => acc + (p.cantidad * p.precio_compra), 0), [productos])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (values: Record<string, any>) => {
    if (productos.length === 0) {
      message.warning('Debe agregar al menos un producto')
      return
    }

    setSubmitting(true)
    try {
      const requestData: CreateOrdenCompraRequest = {
        requerimiento_id: reqSeleccionado?.id,
        proveedor_id: values.proveedor_id,
        fecha: values.fecha ? fechaSubmit(values.fecha) : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        tipo_moneda: values.tipo_moneda,
        tipo_de_cambio: values.tipo_de_cambio,
        ruc: values.proveedor_ruc,
        tipo_documento: values.tipo_documento,
        forma_de_pago: values.forma_de_pago,
        numero_dias: values.numero_dias,
        fecha_vencimiento: values.fecha_vencimiento ? fechaSubmit(values.fecha_vencimiento) : undefined,
        almacen_id: values.almacen_id || 1, // Default almacen
        productos: productos.map(p => ({
          producto_id: p.producto_id || p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          marca: p.marca,
          unidad: p.unidad,
          cantidad: p.cantidad,
          precio: p.precio_compra,
          subtotal: p.cantidad * p.precio_compra,
          flete: p.flete || 0,
          vencimiento: p.vencimiento ?? undefined,
          lote: p.lote,
        })),
      }

      let response
      let ordenCompraId
      let ordenCompraCodigo

      if (isEditMode && ordenId) {
        // Modo edición: actualizar orden existente
        response = await ordenCompraApi.update(ordenId, requestData)
        ordenCompraId = response.data?.data?.id
        ordenCompraCodigo = response.data?.data?.codigo
      } else {
        // Modo creación o duplicación: crear nueva orden
        response = await ordenCompraApi.create(requestData)
        ordenCompraId = response.data?.data?.id
        ordenCompraCodigo = response.data?.data?.codigo
      }

      // Actualizar cantidad_ordenada para cada producto de la solicitud (solo en creación)
      if (!isEditMode && reqSeleccionado?.productos && ordenCompraId) {
        const updatePromises = reqSeleccionado.productos.map(productoSolicitud => {
          // Encontrar si este producto está en la OC que se acaba de crear
          const productoEnOC = productos.find(p => p.id === productoSolicitud.id)
          if (productoEnOC) {
            return requerimientoInternoApi.actualizarCantidadOrdenada(
              productoSolicitud.id,
              productoEnOC.cantidad,
              ordenCompraId,
              ordenCompraCodigo
            )
          }
          return Promise.resolve()
        })

        await Promise.all(updatePromises)
      }

      // Refrescar datos del sidebar
      queryClient.invalidateQueries({ queryKey: ['requerimientos-internos'] })

      const successMessage = isEditMode
        ? response.data?.message || 'Orden de compra actualizada exitosamente'
        : isDuplicateMode
          ? response.data?.message || 'Orden de compra duplicada exitosamente'
          : response.data?.message || 'Orden de compra creada exitosamente'
      
      message.success(successMessage)
      router.push('/ui/gestion-comercial-e-inventario/mis-ordenes-de-compra')
    } catch (error: unknown) {
      const errorMessage = isEditMode
        ? (error as { message?: string })?.message || 'Error al actualizar la orden de compra'
        : (error as { message?: string })?.message || 'Error al crear la orden de compra'
      message.error(errorMessage)
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  // Columnas ag-grid
  const columns = useMemo<ColDef[]>(() => [
    {
      headerName: 'Código',
      field: 'codigo',
      minWidth: 70,
      width: 70,
      cellRenderer: ({ data }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <Tooltip classNames={{ body: 'text-center!' }} title={data?.codigo}>
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>{data?.codigo}</div>
          </Tooltip>
        </div>
      ),
    },
    {
      headerName: 'Producto',
      field: 'nombre',
      minWidth: 250,
      width: 250,
      cellRenderer: ({ data }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <Tooltip classNames={{ body: 'text-center!' }} title={data?.nombre}>
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>{data?.nombre}</div>
          </Tooltip>
        </div>
      ),
    },
    {
      headerName: 'Marca',
      field: 'marca',
      minWidth: 120,
      width: 120,
      cellRenderer: ({ data }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <Tooltip classNames={{ body: 'text-center!' }} title={data?.marca || 'SIN MARCA'}>
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>{data?.marca || 'SIN MARCA'}</div>
          </Tooltip>
        </div>
      ),
    },
    {
      headerName: 'Unidad',
      field: 'unidad',
      minWidth: 90,
      width: 90,
      cellRenderer: ({ data }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <Tooltip classNames={{ body: 'text-center!' }} title={data?.unidad}>
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>{data?.unidad}</div>
          </Tooltip>
        </div>
      ),
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      minWidth: 85,
      width: 85,
      wrapText: true,
      autoHeight: true,
      cellRenderer: ({ data, node }: ICellRendererParams) => (
        <div className='flex flex-col justify-center w-full py-2'>
          <InputNumberBase
            size="small"
            precision={2}
            min={1}
            value={data?.cantidad}
            formWithMessage={false}
            onChange={val => {
              const value = Math.max(1, Number(val ?? 1))
              setProductos(prev => prev.map((p, i) => i === node.rowIndex! ? { ...p, cantidad: value, subtotal: value * p.precio_compra } : p))
            }}
          />
          {data?.stock_max && (() => {
            const addedFraccion = Number(data.cantidad || 0) * Number(data.unidad_factor || 1);
            const stockActual = Number(data.stock_actual || 0);
            const stockTotalPostCompra = stockActual + addedFraccion;
            const stockMax = Number(data.stock_max);
            
            if (stockTotalPostCompra > stockMax) {
              return (
                <div className='text-red-600 text-[11px] mt-1 font-medium leading-tight text-center'>
                  <Tooltip title={`Stock: ${Math.round(stockTotalPostCompra)} excede máximo: ${Math.round(stockMax)}`}>
                    <span className='cursor-help'>⚠️ Stock Máx: {Math.round(stockMax)}</span>
                  </Tooltip>
                </div>
              );
            }
            return null;
          })()}
        </div>
      ),
    },
    {
      headerName: 'Precio',
      field: 'precio_compra',
      minWidth: 100,
      width: 110,
      cellRenderer: ({ data, node }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            size="small"
            prefix="S/. "
            min={0}
            precision={4}
            value={data?.precio_compra}
            formWithMessage={false}
            onChange={val => {
              const value = Math.max(0, Number(val ?? 0))
              setProductos(prev => prev.map((p, i) => i === node.rowIndex! ? { ...p, precio_compra: value, subtotal: p.cantidad * value } : p))
            }}
          />
        </div>
      ),
    },
    {
      headerName: 'SubTotal',
      field: 'subtotal',
      minWidth: 100,
      width: 110,
      cellRenderer: ({ data }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            size="small"
            variant="borderless"
            prefix="S/. "
            readOnly
            value={data?.cantidad * data?.precio_compra}
            formWithMessage={false}
            precision={2}
          />
        </div>
      ),
    },
    {
      headerName: 'Flete',
      field: 'flete',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ data, node }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            size="small"
            prefix="S/. "
            min={0}
            precision={4}
            value={data?.flete ?? 0}
            formWithMessage={false}
            onChange={val => {
              const value = Math.max(0, Number(val ?? 0))
              setProductos(prev => prev.map((p, i) => i === node.rowIndex! ? { ...p, flete: value } : p))
            }}
          />
        </div>
      ),
    },
    {
      headerName: 'F. Vencimiento',
      field: 'vencimiento',
      minWidth: 150,
      width: 150,
      cellRenderer: ({ data, node }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <DatePickerBase
            size="small"
            placeholder="Vencimiento"
            value={data?.vencimiento ? dayjs(data.vencimiento) : null}
            formWithMessage={false}
            onChange={date => {
              setProductos(prev => prev.map((p, i) => i === node.rowIndex! ? { ...p, vencimiento: date?.format('YYYY-MM-DD') || null } : p))
            }}
          />
        </div>
      ),
    },
    {
      headerName: 'Lote',
      field: 'lote',
      minWidth: 120,
      width: 120,
      cellRenderer: ({ data, node }: ICellRendererParams) => (
        <div className='flex items-center h-full'>
          <InputBase
            size="small"
            placeholder="Lote"
            value={data?.lote ?? ''}
            formWithMessage={false}
            onChange={e => {
              setProductos(prev => prev.map((p, i) => i === node.rowIndex! ? { ...p, lote: e.target.value } : p))
            }}
          />
        </div>
      ),
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 40,
      minWidth: 40,
      cellRenderer: ({ node }: ICellRendererParams) => (
        <div className='flex items-center gap-2 h-full'>
          <Tooltip title='Eliminar'>
            <MdDelete
              onClick={() => handleRemoveProducto(node.rowIndex!)}
              size={15}
              className='cursor-pointer text-rose-700 hover:scale-105 transition-all active:scale-95'
            />
          </Tooltip>
        </div>
      ),
    },
  ], [handleRemoveProducto])

  const handleAddProductFromSidebar = async (product: ProductoSidebarSelection) => {
    // Si el producto no existe en el sistema (producto_id es null o undefined), intentar buscarlo
    if (!product.producto_id) {
      try {
        message.loading({ content: 'Verificando producto en catálogo...', key: 'verificandoProducto' })
        const almacenId = form.getFieldValue('almacen_id') || 1
        
        // Buscar producto por nombre
        const res = await productosApiV2.getAllByAlmacen({
          almacen_id: almacenId,
          search: product.nombre,
          estado: 1,
          per_page: 5
        })
        
        let productoMatch = null
        if (res.data?.data && res.data.data.length > 0) {
          // Tratar de buscar coincidencia exacta (case-insensitive)
          productoMatch = res.data.data.find((p: any) => p.name.toLowerCase().trim() === product.nombre.toLowerCase().trim())
        }
        
        if (productoMatch) {
          message.success({ content: 'Producto auto-enlazado desde catálogo', key: 'verificandoProducto' })
          
          const precio_compra = productoMatch.producto_en_almacenes?.[0]?.costo || 0
          
          const newProduct: ProductoEnOC = {
            id: product.id,
            producto_id: productoMatch.id,
            codigo: productoMatch.cod_producto,
            nombre: productoMatch.name,
            marca: productoMatch.marca?.name || product.marca,
            unidad: productoMatch.unidad_medida?.name || product.unidad,
            cantidad: product.cantidad,
            precio_compra: Number(precio_compra),
            flete: product.flete,
            vencimiento: product.vencimiento,
            lote: product.lote,
            subtotal: product.cantidad * Number(precio_compra),
            stock_max: productoMatch.stock_max,
            stock_actual: Number(productoMatch.producto_en_almacenes?.[0]?.stock_fraccion ?? 0),
            unidad_factor: Number(productoMatch.unidades_contenidas ?? 1),
          }
          
          setProductos(prev => {
            const existingIndex = prev.findIndex(p => p.producto_id === newProduct.producto_id)
            if (existingIndex >= 0) {
              const updated = [...prev]
              const existing = updated[existingIndex]
              const nuevaCantidad = existing.cantidad + newProduct.cantidad
              updated[existingIndex] = {
                ...existing,
                cantidad: nuevaCantidad,
                subtotal: nuevaCantidad * existing.precio_compra,
              }
              return updated
            } else {
              return [...prev, newProduct]
            }
          })
          
          return // Salimos y NO abrimos el modal
        } else {
           message.destroy('verificandoProducto')
        }
      } catch (e) {
        message.destroy('verificandoProducto')
        console.error("Error buscando producto auto-enlazado", e)
      }

      setProductosPendientesCrear([product])
      setCurrentProductoIndex(0)
      setProductoManualActual(product)
      
      // No pre-llenar nada en el store, solo guardar el producto manual
      setProducto(undefined)
      
      setOpenModalCreation(true)
      return
    }

    // Si el producto SÍ existe (ya tiene ID)
    let precio_compra_actual = product.precio_compra
    
    try {
      message.loading({ content: 'Cargando datos adicionales del producto...', key: 'cargandoExtra' })
      const res = await productosApiV2.getById(product.producto_id)
      if (res.data) {
        const prodData = res.data
        const almacenId = form.getFieldValue('almacen_id') || 1
        const stockAlmacen = prodData.producto_en_almacenes?.find((pa: any) => pa.almacen_id === almacenId) || prodData.producto_en_almacenes?.[0]
        
        if (stockAlmacen && stockAlmacen.costo) {
          precio_compra_actual = Number(stockAlmacen.costo)
        }
        
        // Agregar info de stock
        (product as any).stock_max = prodData.stock_max;
        (product as any).stock_actual = Number(stockAlmacen?.stock_fraccion ?? 0);
        (product as any).unidad_factor = Number(prodData.unidades_contenidas ?? 1);
      }
      message.destroy('cargandoExtra')
    } catch (e) {
      message.destroy('cargandoExtra')
      console.error(e)
    }

    const newProduct = {
      id: product.id,
      producto_id: product.producto_id,
      codigo: product.codigo,
      nombre: product.nombre,
      marca: product.marca,
      unidad: product.unidad,
      cantidad: product.cantidad,
      precio_compra: precio_compra_actual,
      flete: product.flete,
      vencimiento: product.vencimiento,
      lote: product.lote,
      subtotal: product.cantidad * precio_compra_actual,
      stock_max: (product as any).stock_max,
      stock_actual: (product as any).stock_actual,
      unidad_factor: (product as any).unidad_factor,
    }
    
    setProductos(prev => {
      const existingIndex = prev.findIndex(p => p.producto_id === product.producto_id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        const existing = updated[existingIndex]
        const nuevaCantidad = existing.cantidad + product.cantidad
        updated[existingIndex] = {
          ...existing,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * existing.precio_compra,
        }
        return updated
      } else {
        return [...prev, newProduct]
      }
    })
  }

  const handleAddAllFromSidebar = async (products: ProductoSidebarSelection[]) => {
    // Separar productos existentes de productos manuales
    const productosExistentes = products.filter(p => !!p.producto_id)
    const manuales = products.filter(p => !p.producto_id)
    
    let productosParaAgregar = [...productosExistentes]
    const productosManualesNoEncontrados: ProductoSidebarSelection[] = []
    
    if (manuales.length > 0) {
       message.loading({ content: 'Verificando catálogo...', key: 'verificandoVarios' })
       const almacenId = form.getFieldValue('almacen_id') || 1
       
       for (const manualProd of manuales) {
         try {
           const res = await productosApiV2.getAllByAlmacen({
             almacen_id: almacenId,
             search: manualProd.nombre,
             estado: 1,
             per_page: 5
           })
           
           const productoMatch = res.data?.data?.find((p: any) => p.name.toLowerCase().trim() === manualProd.nombre.toLowerCase().trim())
           
           if (productoMatch) {
             // Agregamos con los datos del catálogo
             productosParaAgregar.push({
               ...manualProd, // conservamos id de solicitud, cantidad, etc.
               producto_id: productoMatch.id,
               codigo: productoMatch.cod_producto,
               nombre: productoMatch.name,
               marca: productoMatch.marca?.name || manualProd.marca,
               unidad: productoMatch.unidad_medida?.name || manualProd.unidad,
             })
           } else {
             productosManualesNoEncontrados.push(manualProd)
           }
         } catch (e) {
           productosManualesNoEncontrados.push(manualProd)
         }
       }
       message.destroy('verificandoVarios')
    }
    
    // Si hay productos manuales no encontrados, iniciar flujo
    if (productosManualesNoEncontrados.length > 0) {
      setProductosPendientesCrear(productosManualesNoEncontrados)
      setCurrentProductoIndex(0)
      setProductoManualActual(productosManualesNoEncontrados[0])
      
      // No pre-llenar, dejar que el modal use textDefault
      setProducto(undefined)
      
      setOpenModalCreation(true)
      
      // Agregar los productos existentes inmediatamente
      if (productosParaAgregar.length > 0) {
        await agregarProductosExistentes(productosParaAgregar)
      }
      return
    }

    // Si no hay productos manuales sin enlazar, agregar todos normalmente
    if (productosParaAgregar.length > 0) {
      await agregarProductosExistentes(productosParaAgregar)
    }
  }

  const agregarProductosExistentes = async (products: ProductoSidebarSelection[]) => {
    message.loading({ content: 'Obteniendo costos de productos...', key: 'cargandoCostos' })
    const almacenId = form.getFieldValue('almacen_id') || 1
    
    const newProductsPromises = products.map(async (p) => {
      let precio_compra_actual = p.precio_compra

      if (p.producto_id) {
        try {
          const res = await productosApiV2.getById(p.producto_id)
          if (res.data) {
            const stockAlmacen = res.data.producto_en_almacenes?.find((pa: any) => pa.almacen_id === almacenId) || res.data.producto_en_almacenes?.[0]
            if (stockAlmacen && stockAlmacen.costo) {
              precio_compra_actual = Number(stockAlmacen.costo)
            }
          }
        } catch (e) {
          console.error("Error al obtener precio", e)
        }
      }

      return {
        id: p.id,
        producto_id: p.producto_id!,
        codigo: p.codigo,
        nombre: p.nombre,
        marca: p.marca,
        unidad: p.unidad,
        cantidad: p.cantidad,
        precio_compra: precio_compra_actual,
        flete: p.flete,
        vencimiento: p.vencimiento,
        lote: p.lote,
        subtotal: p.cantidad * precio_compra_actual,
      }
    })

    const newProducts = await Promise.all(newProductsPromises)
    message.destroy('cargandoCostos')
    
    setProductos(prev => {
      let updated = [...prev]
      
      for (const newProduct of newProducts) {
        const existingIndex = updated.findIndex(p => p.producto_id === newProduct.producto_id)
        if (existingIndex >= 0) {
          const existing = updated[existingIndex]
          const nuevaCantidad = existing.cantidad + newProduct.cantidad
          updated[existingIndex] = {
            ...existing,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * existing.precio_compra,
          }
        } else {
          updated = [...updated, newProduct]
        }
      }
      
      return updated
    })
  }


  const agGridRef = useRef<AgGridReact>(null)

  return (
    <div className="self-stretch w-full flex flex-row overflow-hidden animate-fade animate-ease-in-out animate-delay-[250ms]">
      {/* Modal de crear producto */}
      {productoManualActual && (
        <ModalCreateProducto
          key={`manual-producto-${productoManualActual.id}-${currentProductoIndex}`}
          open={openModalCreation}
          setOpen={setOpenModalCreation}
          textDefault={productoManualActual.nombre}
          setTextDefault={() => {}}
          onSuccess={(productoCreado) => {
            const productoOriginal = productosPendientesCrear[currentProductoIndex]
            
            // Agregar el producto recién creado a la lista
            const newProduct: ProductoEnOC = {
              id: productoOriginal.id,
              producto_id: productoCreado.id,
              codigo: productoCreado.cod_producto || '',
              nombre: productoCreado.name || '',
              marca: productoCreado.marca?.name || '',
              unidad: productoCreado.unidad_medida?.name || 'UND',
              cantidad: productoOriginal.cantidad,
              precio_compra: 0,
              flete: 0,
              vencimiento: null,
              lote: '',
              subtotal: 0,
            }
            
            setProductos(prev => [...prev, newProduct])
            
            // Si hay más productos pendientes, abrir el modal para el siguiente
            if (currentProductoIndex < productosPendientesCrear.length - 1) {
              const siguienteIndex = currentProductoIndex + 1
              setCurrentProductoIndex(siguienteIndex)
              setProductoManualActual(productosPendientesCrear[siguienteIndex])
              
              // Limpiar el producto para el siguiente
              setProducto(undefined)
              
              setTimeout(() => setOpenModalCreation(true), 300)
            } else {
              // Ya no hay más productos pendientes
              setProductosPendientesCrear([])
              setCurrentProductoIndex(0)
              setProductoManualActual(null)
              message.success('Todos los productos han sido creados')
            }
          }}
        />
      )}

      {/* SIDEBAR */}
      <SidebarSolicitudes
        onAddProduct={handleAddProductFromSidebar}
        onAddAll={handleAddAllFromSidebar}
        productosAgregados={productos}
        onSeleccionarRequerimiento={setReqSeleccionado}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden p-4 gap-4">
        {/* HEADER */}
        <TituloModulos
          title={isEditMode ? "Editar Orden de Compra" : isDuplicateMode ? "Duplicar Orden de Compra" : "Crear Orden de Compra"}
          icon={<TbShoppingCartPlus className="text-cyan-600" />}
          extra={
            <div className="pl-8 flex items-center gap-4">
              <SelectProductos
                autoFocus
                allowClear
                size="large"
                className="!min-w-[400px] !w-[400px] !max-w-[400px] font-normal!"
                classNameIcon="text-cyan-600 mx-1"
                classIconSearch="!mb-0"
                classIconPlus="mb-0!"
                withSearch
                withTipoBusqueda
                showButtonCreate
                showCardAgregarProducto
                autoFillPrecioCompraWithCosto
                ignoreAlmacen
                showFiltrosAvanzados
              />
            </div>
          }
        >
          {reqSeleccionado && (
            <div className="flex items-center gap-2 text-sm">
              <Tag color="green">{reqSeleccionado.codigo}</Tag>
              <span className="text-slate-600">{reqSeleccionado.cargo}</span>
            </div>
          )}
        </TituloModulos>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-slate-500">Cargando datos...</div>
          </div>
        ) : (
          <FormBase
            form={form}
            name="orden-compra"
            className="flex-1 flex flex-col xl:flex-row gap-4 xl:gap-6 w-full h-full overflow-hidden"
            onFinish={handleSubmit}
          >
          {/* LEFT COLUMN: Tabla + Form fields */}
          <div className="flex-1 flex flex-col gap-2 xl:gap-3 min-w-0 min-h-0 overflow-hidden">
            {/* TABLA DE PRODUCTOS (ag-grid) */}
            <div className="flex-1 min-h-0">
              <CellFocusWithoutStyle />
              <TableWithTitle
                id="crear-orden-compra-productos"
                title="Productos de Orden de Compra"
                tableRef={agGridRef}
                className='h-full'
                rowSelection={false}
                rowData={productos}
                columnDefs={columns}
                withNumberColumn={true}
                getRowId={(params) => String(params.data.producto_id ?? params.data.id)}
              />
            </div>

            {/* CAMPOS DEL FORMULARIO */}
            <div className='flex flex-col gap-2'>
              <div className='flex flex-wrap gap-x-6 gap-y-2'>
                <LabelBase label='Fecha:' classNames={{ labelParent: 'mb-6' }}>
                  <DatePickerBase
                    propsForm={{
                      name: 'fecha',
                      rules: [{ required: true, message: 'Ingresa la fecha' }],
                    }}
                    placeholder='Fecha'
                    className='!w-[160px] !min-w-[160px] !max-w-[160px]'
                    prefix={<FaCalendar size={15} className='text-rose-700 mx-1' />}
                  />
                </LabelBase>
                <LabelBase label='Tipo Moneda:' classNames={{ labelParent: 'mb-6' }}>
                  <SelectTipoMoneda
                    classNameIcon='text-rose-700 mx-1'
                    className='!w-[120px] !min-w-[120px] !max-w-[120px]'
                    propsForm={{
                      name: 'tipo_moneda',
                      rules: [{ required: true, message: 'Selecciona el tipo de moneda' }],
                    }}
                    onChangeTipoDeCambio={value => form.setFieldValue('tipo_de_cambio', value)}
                  />
                </LabelBase>
                <LabelBase label='Tipo de Cambio:' classNames={{ labelParent: 'mb-6' }}>
                  <InputNumberBase
                    propsForm={{
                      name: 'tipo_de_cambio',
                      rules: [{ required: true, message: 'Ingresa el tipo de cambio' }],
                    }}
                    prefix={<span className='text-rose-700 font-bold'>S/. </span>}
                    precision={4}
                    min={1}
                    className='!w-[100px] !min-w-[100px] !max-w-[100px]'
                  />
                </LabelBase>
                <LabelBase label='RUC:' classNames={{ labelParent: 'mb-6' }}>
                  <SelectProveedores
                    form={form}
                    showOnlyDocument={true}
                    proveedorOptionsDefault={proveedorDefault}
                    initialSearchText={proveedorRucInicial}
                    propsForm={{
                      name: 'proveedor_id',
                      hasFeedback: false,
                      className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
                    }}
                    className='w-full'
                    classNameIcon='text-cyan-600 mx-1'
                    placeholder='RUC'
                    onChange={(_, proveedor) => {
                      if (proveedor) {
                        if (proveedor.ruc) form.setFieldValue('proveedor_ruc', proveedor.ruc)
                        form.setFieldValue('proveedor_razon_social', proveedor.razon_social || '')
                      } else {
                        form.setFieldValue('proveedor_ruc', '')
                        form.setFieldValue('proveedor_razon_social', '')
                      }
                    }}
                  />
                </LabelBase>
                <LabelBase label='Proveedor:' classNames={{ labelParent: 'mb-6' }}>
                  <InputBase
                    propsForm={{
                      name: 'proveedor_razon_social',
                      hasFeedback: false,
                      className: '!min-w-[250px] !w-[250px] !max-w-[250px]',
                    }}
                    placeholder='Razón Social del proveedor'
                    className='w-full'
                    readOnly
                    uppercase={false}
                  />
                </LabelBase>
              </div>

              <div className='flex flex-wrap gap-x-6 gap-y-2'>
                <LabelBase label='Tipo Documento:' classNames={{ labelParent: 'mb-6' }}>
                  <SelectTipoDocumento
                    propsForm={{
                      name: 'tipo_documento',
                      rules: [{ required: true, message: 'Selecciona el tipo de documento' }],
                    }}
                    className='!w-[150px] !min-w-[150px] !max-w-[150px]'
                  />
                </LabelBase>
              </div>

              <div className='flex flex-wrap gap-x-6 gap-y-2'>
                <FormFormaDePagoCompra form={form} />
              </div>
            </div>
          </div>

          {/* SIDEBAR RIGHT - CARDS INFO */}
          <div className="flex flex-col gap-4 w-full xl:w-64 overflow-y-auto">
            {reqSeleccionado && (
              <div className="flex flex-col gap-1 px-4 py-3 border rounded-lg shadow-md w-full bg-emerald-50 border-emerald-200">
                <h3 className="text-xs font-semibold text-emerald-600 uppercase">Requerimiento</h3>
                <p className="text-lg font-bold text-slate-800">{reqSeleccionado.codigo}</p>
                <p className="text-xs text-slate-500">{reqSeleccionado.cargo} — {reqSeleccionado.user?.name}</p>
                <Tag className="mt-1 w-fit" color={reqSeleccionado.prioridad === 'URGENTE' ? 'red' : reqSeleccionado.prioridad === 'ALTA' ? 'volcano' : 'blue'}>
                  {reqSeleccionado.prioridad}
                </Tag>
              </div>
            )}

            <div className="flex gap-4 justify-center px-4 py-2 border rounded-lg shadow-md w-full bg-white">
              <h3 className="text-base font-medium text-right text-slate-600 text-nowrap">V. Bruto:</h3>
              <p className="text-xl font-bold text-left text-slate-800 text-nowrap">
                S/. {subTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="flex gap-4 justify-center px-4 py-2 border rounded-lg shadow-md w-full bg-white">
              <h3 className="text-base font-medium text-right text-slate-600 text-nowrap">Sub Total:</h3>
              <p className="text-xl font-bold text-left text-slate-800 text-nowrap">
                S/. {(subTotal / 1.18).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="flex gap-4 justify-center px-4 py-2 border rounded-lg shadow-md w-full bg-white">
              <h3 className="text-base font-medium text-right text-slate-600 text-nowrap">IGV:</h3>
              <p className="text-xl font-bold text-left text-slate-800 text-nowrap">
                S/. {(subTotal - subTotal / 1.18).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="flex gap-4 justify-center px-4 py-2 border rounded-lg shadow-md w-full bg-white">
              <h3 className="text-base font-medium text-right text-slate-600 text-nowrap">Total:</h3>
              <p className="text-xl font-bold text-left text-slate-800 text-nowrap">
                S/. {subTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <ButtonBase
              color="success"
              onClick={() => form.submit()}
              className="flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance"
              disabled={productos.length === 0 || submitting}
            >
              <TbShoppingCartPlus className="min-w-fit" size={30} /> 
              {submitting
                ? (isEditMode ? 'Actualizando...' : 'Guardando...')
                : (isEditMode ? 'Actualizar Orden de Compra' : isDuplicateMode ? 'Guardar Orden Duplicada' : 'Crear Orden de Compra')
              }
            </ButtonBase>
          </div>
        </FormBase>
        )}
      </div>

    </div>
  )
}
