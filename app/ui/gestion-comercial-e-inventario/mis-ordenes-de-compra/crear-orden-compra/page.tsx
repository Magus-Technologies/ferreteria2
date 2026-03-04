'use client'

import { useState, useMemo } from 'react'
import { Form, Tag, Modal, App } from 'antd'
import { TbShoppingCartPlus } from 'react-icons/tb'
import { FaClipboardList, FaCalendar } from 'react-icons/fa'
import { IoIosDocument } from 'react-icons/io'
import { IoDocumentAttach } from 'react-icons/io5'
import { MdDelete } from 'react-icons/md'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectTipoMoneda from '~/app/_components/form/selects/select-tipo-moneda'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import SelectTipoDocumento from '~/app/_components/form/selects/select-tipo-documento'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectFormaDePago from '~/app/_components/form/selects/select-forma-de-pago'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import TableBase from '~/components/tables/table-base'
import CellFocusWithoutStyle from '~/components/tables/cell-focus-without-style'
import ModalSolicitudes, { type RequerimientoSeleccionado } from './_components/modals/modal-solicitudes'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Tooltip } from 'antd'
import { ordenCompraApi, type CreateOrdenCompraRequest } from '~/lib/api/orden-compra'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'

export default function CrearOrdenCompraPage() {
    const router = useRouter()
    const { message } = App.useApp()
    const [form] = Form.useForm()
    const [openModalSolicitudes, setOpenModalSolicitudes] = useState(false)
    const [reqSeleccionado, setReqSeleccionado] = useState<RequerimientoSeleccionado | null>(null)
    const [productos, setProductos] = useState<any[]>([])
    const [openModalAgregar, setOpenModalAgregar] = useState(false)
    const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)

    const handleSeleccionarReq = (req: RequerimientoSeleccionado) => {
        setReqSeleccionado(req)

        // Rellenar proveedor si existe sugerido
        if (req.proveedor_sugerido) {
            form.setFieldsValue({
                proveedor_id: req.proveedor_sugerido.id,
                proveedor_ruc: req.proveedor_sugerido.ruc,
                proveedor_razon_social: req.proveedor_sugerido.razon_social
            })
        }

        // Los productos vienen desde el requerimiento (mapeados en modal-solicitudes)
        const prods = req.productos || []
        setProductos(prods.map(p => ({ ...p, subtotal: p.cantidad * p.precio_compra })))
    }

    const handleRemoveProducto = (index: number) => {
        setProductos(prev => prev.filter((_, i) => i !== index))
    }

    const subTotal = useMemo(() => productos.reduce((acc, p) => acc + (p.cantidad * p.precio_compra), 0), [productos])

    const handleSubmit = async (values: any) => {
        if (productos.length === 0) {
            message.warning('Debe agregar al menos un producto')
            return
        }

        setSubmitting(true)
        try {
            const requestData: CreateOrdenCompraRequest = {
                requerimiento_id: reqSeleccionado?.id,
                proveedor_id: values.proveedor_id,
                fecha: values.fecha?.format?.('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
                tipo_moneda: values.tipo_moneda,
                tipo_de_cambio: values.tipo_de_cambio,
                ruc: values.proveedor_ruc,
                tipo_documento: values.tipo_documento,
                serie: values.serie,
                numero: values.numero?.toString(),
                guia: values.guia,
                percepcion: values.percepcion,
                forma_de_pago: values.forma_de_pago,
                numero_dias: values.numero_dias,
                fecha_vencimiento: values.fecha_vencimiento?.format?.('YYYY-MM-DD'),
                egreso_dinero_id: values.egreso_dinero_id,
                despliegue_de_pago_id: values.despliegue_de_pago_id,
                almacen_id: values.almacen_id || 1, // Default almacen
                productos: productos.map(p => ({
                    producto_id: p.producto_id || p.id,
                    codigo: p.codigo,
                    nombre: p.nombre || p.name,
                    marca: p.marca,
                    unidad: p.unidad,
                    cantidad: p.cantidad,
                    precio: p.precio_compra,
                    subtotal: p.cantidad * p.precio_compra,
                    flete: p.flete || 0,
                    vencimiento: p.vencimiento,
                    lote: p.lote,
                })),
            }

            const response = await ordenCompraApi.create(requestData)
            message.success(response.data?.message || 'Orden de compra creada exitosamente')
            router.push('/ui/gestion-comercial-e-inventario/mis-ordenes-de-compra')
        } catch (error: any) {
            message.error(error?.message || 'Error al crear la orden de compra')
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    // Columnas ag-grid
    const columns: ColDef[] = [
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
            cellRenderer: ({ data, node }: ICellRendererParams) => (
                <div className='flex items-center h-full'>
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
    ]

    return (
        <ContenedorGeneral className="h-full">
            {/* HEADER */}
            <TituloModulos
                title="Crear Orden de Compra"
                icon={<TbShoppingCartPlus className="text-cyan-600" />}
                extra={
                    <div className="pl-8 flex items-center gap-4">
                        <SelectProductos
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
                            handleOnlyOneResult={(producto) => {
                                setProductoSeleccionado(producto)
                                if (producto) setOpenModalAgregar(true)
                            }}
                            onChange={(_, producto) => {
                                setProductoSeleccionado(producto)
                                if (producto) setOpenModalAgregar(true)
                            }}
                        />
                    </div>
                }
            >
                <ButtonBase
                    color="default"
                    size="sm"
                    onClick={() => setOpenModalSolicitudes(true)}
                    className="flex items-center gap-2"
                >
                    <FaClipboardList className="text-emerald-600" />
                    Solicitudes
                </ButtonBase>
                {reqSeleccionado && (
                    <div className="flex items-center gap-2 text-sm">
                        <Tag color="green">{reqSeleccionado.codigo}</Tag>
                        <span className="text-slate-600">{reqSeleccionado.area}</span>
                    </div>
                )}
            </TituloModulos>

            {/* BODY */}
            <FormBase
                form={form}
                name="orden-compra"
                className="flex flex-col xl:flex-row gap-4 xl:gap-6 w-full h-full"
                onFinish={handleSubmit}
            >
                {/* LEFT COLUMN: Tabla + Form fields */}
                <div className="flex-1 flex flex-col gap-2 xl:gap-3 min-w-0 min-h-0">
                    {/* TABLA DE PRODUCTOS (ag-grid) */}
                    <div className="flex-1 min-h-0">
                        <CellFocusWithoutStyle />
                        <TableBase
                            className='h-full'
                            rowSelection={false}
                            rowData={productos}
                            columnDefs={columns}
                            withNumberColumn={true}
                        />
                    </div>

                    {/* CAMPOS DEL FORMULARIO */}
                    <div className='flex flex-col'>
                        <div className='flex gap-6'>
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
                        <div className='flex gap-6'>
                            <LabelBase label='Tipo Documento:' classNames={{ labelParent: 'mb-6' }}>
                                <SelectTipoDocumento
                                    propsForm={{
                                        name: 'tipo_documento',
                                        hasFeedback: false,
                                        className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
                                        rules: [{ required: true, message: 'Selecciona el tipo de documento' }],
                                    }}
                                    className='w-full'
                                    classNameIcon='text-rose-700 mx-1'
                                />
                            </LabelBase>
                            <LabelBase label='Serie:' classNames={{ labelParent: 'mb-6' }}>
                                <InputBase
                                    prefix={<IoIosDocument className='text-rose-700 mr-1' size={20} />}
                                    className='!w-[120px] !min-w-[120px] !max-w-[120px]'
                                    placeholder='Serie'
                                    propsForm={{ name: 'serie' }}
                                />
                            </LabelBase>
                            <LabelBase label='N°:' classNames={{ labelParent: 'mb-6' }}>
                                <InputNumberBase
                                    prefix={<IoIosDocument className='text-rose-700 mr-1' size={20} />}
                                    className='!w-[120px] !min-w-[120px] !max-w-[120px]'
                                    placeholder='Número'
                                    propsForm={{ name: 'numero' }}
                                    precision={0}
                                    min={0}
                                />
                            </LabelBase>
                            <LabelBase label='Guía:' classNames={{ labelParent: 'mb-6' }}>
                                <InputBase
                                    prefix={<IoDocumentAttach className='text-cyan-600 mr-1' size={20} />}
                                    className='!w-[120px] !min-w-[120px] !max-w-[120px]'
                                    placeholder='Guía'
                                    propsForm={{ name: 'guia' }}
                                />
                            </LabelBase>
                            <LabelBase label='Percepción:' classNames={{ labelParent: 'mb-6' }}>
                                <InputNumberBase
                                    prefix={<IoIosDocument className='text-cyan-600 mr-1' size={20} />}
                                    className='!w-[120px] !min-w-[120px] !max-w-[120px]'
                                    placeholder='Percepción'
                                    propsForm={{ name: 'percepcion' }}
                                    precision={2}
                                    min={0}
                                />
                            </LabelBase>
                        </div>
                        <div className='flex flex-wrap gap-6'>
                            <LabelBase label='Forma de Pago:' classNames={{ labelParent: 'mb-6' }}>
                                <SelectFormaDePago
                                    classNameIcon='text-rose-700 mx-1'
                                    className='!w-[135px] !min-w-[135px] !max-w-[135px]'
                                    propsForm={{
                                        name: 'forma_de_pago',
                                        rules: [{ required: true, message: 'Selecciona la forma de pago' }],
                                    }}
                                />
                            </LabelBase>
                            <LabelBase label='N° Días:' classNames={{ labelParent: 'mb-6' }}>
                                <InputNumberBase
                                    prefix={<IoIosDocument className='text-rose-700 mr-1' size={20} />}
                                    className='!w-[90px] !min-w-[90px] !max-w-[90px]'
                                    placeholder='N° Días'
                                    propsForm={{ name: 'numero_dias' }}
                                    precision={0}
                                    min={0}
                                />
                            </LabelBase>
                            <LabelBase label='Fecha Vencimiento:' classNames={{ labelParent: 'mb-6' }}>
                                <DatePickerBase
                                    propsForm={{ name: 'fecha_vencimiento' }}
                                    placeholder='Fecha de Vencimiento'
                                    prefix={<FaCalendar size={15} className='text-rose-700 mx-1' />}
                                    className='!w-[160px] !min-w-[160px] !max-w-[160px]'
                                />
                            </LabelBase>
                            <LabelBase label='Egreso Asociado:' classNames={{ labelParent: 'mb-6' }}>
                                <InputBase
                                    propsForm={{
                                        name: 'egreso_dinero_id',
                                        className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
                                    }}
                                    placeholder='Egreso Dinero'
                                    className='w-full'
                                />
                            </LabelBase>
                            <LabelBase label='Despliegue de Pago:' classNames={{ labelParent: 'mb-6' }}>
                                <InputBase
                                    propsForm={{
                                        name: 'despliegue_de_pago_id',
                                        className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
                                    }}
                                    placeholder='Método de Pago'
                                    className='w-full'
                                />
                            </LabelBase>
                        </div>
                    </div>
                </div>

                {/* SIDEBAR — CARDS INFO */}
                <div className="flex flex-col gap-4 w-full xl:w-64">
                    {reqSeleccionado && (
                        <div className="flex flex-col gap-1 px-4 py-3 border rounded-lg shadow-md w-full bg-emerald-50 border-emerald-200">
                            <h3 className="text-xs font-semibold text-emerald-600 uppercase">Requerimiento</h3>
                            <p className="text-lg font-bold text-slate-800">{reqSeleccionado.codigo}</p>
                            <p className="text-xs text-slate-500">{reqSeleccionado.area} — {reqSeleccionado.solicitante}</p>
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
                        <TbShoppingCartPlus className="min-w-fit" size={30} /> {submitting ? 'Creando...' : 'Crear Orden de Compra'}
                    </ButtonBase>
                </div>
            </FormBase>

            {/* Modal de solicitudes */}
            <ModalSolicitudes
                open={openModalSolicitudes}
                onClose={() => setOpenModalSolicitudes(false)}
                onSeleccionar={handleSeleccionarReq}
            />

            {/* Modal agregar producto */}
            <Modal
                open={openModalAgregar}
                onCancel={() => setOpenModalAgregar(false)}
                footer={null}
                title={
                    <div className="text-xl font-bold text-left text-balance mb-3">
                        <span className="text-slate-400 block">AGREGAR:</span>{' '}
                        {productoSeleccionado?.name}
                    </div>
                }
                width={300}
                classNames={{ content: 'min-w-fit' }}
                destroyOnHidden
                maskClosable={false}
                keyboard={false}
            >
                <p className="text-sm text-slate-500">Funcionalidad de agregar producto (vista)</p>
            </Modal>
        </ContenedorGeneral>
    )
}
