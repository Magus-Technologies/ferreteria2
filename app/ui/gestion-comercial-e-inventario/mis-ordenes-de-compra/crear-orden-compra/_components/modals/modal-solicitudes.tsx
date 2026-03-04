import { useState, useEffect, useMemo } from 'react'
import { Modal, Tag, Input, message, ConfigProvider, App, Button, Tooltip, Form, Drawer, Badge } from 'antd'
import TitleForm from '~/components/form/title-form'
import { requerimientoInternoApi, type RequerimientoInterno } from '~/lib/api/requerimiento-interno'
import TableBase from '~/components/tables/table-base'
import type { ColDef } from 'ag-grid-community'
import { FaCheckCircle, FaSearch, FaCalendarAlt, FaFilter, FaFilePdf } from 'react-icons/fa'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import RequerimientoInternoPdf from '~/components/pdf/requerimiento-interno-pdf'
import ModalPdfViewer from '~/components/modals/modal-pdf-viewer'
import ButtonBase from '~/components/buttons/button-base'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import LabelBase from '~/components/form/label-base'
import FormBase from '~/components/form/form-base'
import dayjs, { Dayjs } from 'dayjs'
import { useDebounce } from 'use-debounce'

export interface RequerimientoSeleccionado {
    id: number
    codigo: string
    fecha: string
    area: string
    solicitante: string
    prioridad: string
    items: number
    productos: any[]
    proveedor_sugerido: { id: number; razon_social: string; ruc: string } | null
}

interface ModalSolicitudesProps {
    open: boolean
    onClose: () => void
    onSeleccionar: (requerimiento: RequerimientoSeleccionado) => void
}

interface ValuesFiltersSolicitudes {
    fechaDesde?: Dayjs
    fechaHasta?: Dayjs
    searchText?: string
}

export default function ModalSolicitudes({ open, onClose, onSeleccionar }: ModalSolicitudesProps) {
    const [form] = Form.useForm<ValuesFiltersSolicitudes>()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(dayjs().startOf('month'))
    const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(dayjs().endOf('month'))
    const [pdfModalOpen, setPdfModalOpen] = useState(false)
    const { data: empresa } = useEmpresaPublica()
    const [requerimientoSeleccionado, setRequerimientoSeleccionado] = useState<RequerimientoInterno | null>(null)

    const [debouncedSearch] = useDebounce(searchText, 500)

    const [requerimientos, setRequerimientos] = useState<RequerimientoInterno[]>([])
    const [loading, setLoading] = useState(false)

    // Contar filtros activos
    const activeFiltersCount = useMemo(() => {
        let count = 0
        if (fechaDesde) count++
        if (fechaHasta) count++
        if (searchText) count++
        return count
    }, [fechaDesde, fechaHasta, searchText])

    useEffect(() => {
        if (open) {
            fetchRequerimientos()
        }
    }, [open, fechaDesde, fechaHasta, debouncedSearch])

    const fetchRequerimientos = async () => {
        setLoading(true)
        try {
            const response = await requerimientoInternoApi.getAll({
                desde: fechaDesde?.format('YYYY-MM-DD'),
                hasta: fechaHasta?.format('YYYY-MM-DD'),
                tipo_solicitud: 'OC',
                estado: 'aprobado,pendiente',
                search: debouncedSearch,
                per_page: 100
            })
            if (response.data?.data) {
                setRequerimientos(response.data.data)
            }
        } catch (error) {
            message.error('Error al cargar los requerimientos')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const colDefs: ColDef[] = [
        {
            headerName: 'Requerimiento',
            field: 'codigo',
            width: 150,
            cellRenderer: (params: any) => (
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 italic">
                    {params.value}
                </span>
            ),
        },
        {
            headerName: 'Fecha',
            field: 'fecha_requerida',
            width: 120,
        },
        {
            headerName: 'Tipo',
            field: 'tipo_solicitud',
            width: 90,
            cellRenderer: (params: any) => (
                <Tag color={params.value === 'OC' ? 'purple' : 'cyan'} className="font-bold border-none shadow-sm">{params.value}</Tag>
            )
        },
        {
            headerName: 'Área',
            field: 'area',
            width: 130,
        },
        {
            headerName: 'Solicitante',
            field: 'user.name',
            width: 150,
            cellRenderer: (params: any) => params.value || '—',
        },
        {
            headerName: 'Prioridad',
            field: 'prioridad',
            width: 110,
            cellRenderer: (params: any) => {
                const val = params.value
                const colorMap: Record<string, string> = {
                    'URGENTE': 'bg-red-100 text-red-700 border-red-200',
                    'ALTA': 'bg-orange-100 text-orange-700 border-orange-200',
                    'MEDIA': 'bg-blue-100 text-blue-700 border-blue-200',
                    'BAJA': 'bg-slate-100 text-slate-700 border-slate-200',
                }
                const colorClass = colorMap[val] || 'bg-slate-100 text-slate-700 border-slate-200'
                return (
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${colorClass}`}>
                        {val}
                    </span>
                )
            },
        },
        {
            headerName: 'Estado',
            field: 'estado',
            width: 130,
            cellRenderer: (params: any) => {
                const val = params.value
                const colorMap: Record<string, string> = {
                    'aprobado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    'pendiente': 'bg-amber-100 text-amber-700 border-amber-200',
                    'rechazado': 'bg-red-100 text-red-700 border-red-200',
                }
                const colorClass = colorMap[val] || 'bg-slate-100 text-slate-700 border-slate-200'
                const label = val === 'aprobado' ? 'APROBADO' : val === 'pendiente' ? 'PENDIENTE' : val.toUpperCase()
                return (
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${colorClass}`}>
                        {label}
                    </span>
                )
            },
        },
        {
            headerName: 'Items',
            field: 'productos',
            width: 80,
            cellStyle: { textAlign: 'center' },
            cellRenderer: (params: any) => (
                <span className="font-bold text-slate-600">{params.value?.length || 0}</span>
            ),
        },
        {
            headerName: 'Acciones',
            width: 90,
            sortable: false,
            filter: false,
            cellStyle: { textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' },
            cellRenderer: (params: any) => {
                const record = params.data
                return (
                    <div className="flex gap-1 items-center justify-center">
                        <Tooltip title='Ver PDF'>
                            <Button
                                type='link'
                                size='small'
                                className='flex items-center gap-1'
                                onClick={() => {
                                    setRequerimientoSeleccionado(record)
                                    setPdfModalOpen(true)
                                }}
                            >
                                <FaFilePdf className="text-red-600 text-lg" />
                            </Button>
                        </Tooltip>
                        <Tooltip title='Seleccionar'>
                            <Button
                                type='link'
                                size='small'
                                className='flex items-center gap-1'
                                onClick={() => {
                                    onSeleccionar({
                                        id: record.id,
                                        codigo: record.codigo,
                                        fecha: record.fecha_requerida,
                                        area: record.area,
                                        solicitante: record.user?.name || '—',
                                        prioridad: record.prioridad,
                                        items: record.productos?.length || 0,
                                        proveedor_sugerido: record.proveedor_sugerido || null,
                                        productos: (record.productos || []).map((p: any) => ({
                                            id: p.producto_id,
                                            producto_id: p.producto_id,
                                            codigo: p.producto?.cod_producto || '',
                                            nombre: p.producto?.name || '',
                                            marca: p.producto?.marca?.name || '',
                                            unidad: p.unidad || p.producto?.unidad_medida?.name || '',
                                            cantidad: p.cantidad,
                                            precio_compra: 0,
                                            subtotal: 0,
                                            flete: 0,
                                            vencimiento: null,
                                            lote: '',
                                        })),
                                    })
                                    onClose()
                                }}
                            >
                                <FaCheckCircle className="text-emerald-600 text-lg" />
                            </Button>
                        </Tooltip>
                    </div>
                )
            },
        },
    ]

    return (
        <>
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#059669',
                        borderRadius: 8,
                    }
                }}
            >
                <App>
                    <Modal
                        open={open}
                        onCancel={onClose}
                        centered
                        width={1150}
                        title={<TitleForm className="!pb-3">Solicitudes de Requerimientos Internos</TitleForm>}
                        footer={null}
                        classNames={{
                            content: 'rounded-2xl overflow-hidden shadow-2xl border-none',
                            header: 'bg-slate-50 border-b border-slate-100 pt-6 px-6',
                            body: 'p-0',
                        }}
                    >
                        <div className="flex flex-col bg-white">
                            {/* Filtros */}
                            <FormBase
                                form={form}
                                name='filtros-solicitudes'
                                initialValues={{
                                    fechaDesde: dayjs().startOf('month'),
                                    fechaHasta: dayjs().endOf('month'),
                                }}
                                className='w-full'
                                onFinish={(values) => {
                                    setFechaDesde(values.fechaDesde || null)
                                    setFechaHasta(values.fechaHasta || null)
                                    setDrawerOpen(false)
                                }}
                            >
                                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                                    {/* Desktop Filters - Single Row */}
                                    <div className='hidden lg:flex items-center gap-2 flex-nowrap'>
                                        <div className='flex items-center gap-1 shrink-0'>
                                            <span className='text-[10px] font-medium text-slate-500'>Desde:</span>
                                            <DatePickerBase
                                                propsForm={{ name: 'fechaDesde' }}
                                                placeholder='Desde'
                                                formWithMessage={false}
                                                className='!w-[140px]'
                                                prefix={<FaCalendarAlt size={12} className='text-emerald-600 mx-1' />}
                                                allowClear
                                            />
                                        </div>

                                        <div className='flex items-center gap-1 shrink-0'>
                                            <span className='text-[10px] font-medium text-slate-500'>Hasta:</span>
                                            <DatePickerBase
                                                propsForm={{ name: 'fechaHasta' }}
                                                placeholder='Hasta'
                                                formWithMessage={false}
                                                className='!w-[140px]'
                                                prefix={<FaCalendarAlt size={12} className='text-emerald-600 mx-1' />}
                                                allowClear
                                            />
                                        </div>

                                        <div className='w-[150px] shrink-0'>
                                            <Input
                                                placeholder="Buscar..."
                                                className="!rounded-lg !h-9 !border-slate-200 !pl-8 focus:!border-emerald-500 focus:!ring-2 focus:!ring-emerald-500/10 transition-all text-sm"
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                                allowClear
                                                prefix={<FaSearch className="text-slate-400" size={12} />}
                                            />
                                        </div>

                                        <ButtonBase color='info' size='md' type='submit' className='flex items-center gap-2 shrink-0 py-1.5'>
                                            <FaSearch size={14} />
                                            Buscar
                                        </ButtonBase>
                                    </div>

                                    {/* Mobile/Tablet Controls */}
                                    <div className='flex lg:hidden items-center gap-2 w-full'>
                                        <div className='flex-1'>
                                            <Badge count={activeFiltersCount} offset={[-5, 5]} className='w-full'>
                                                <ButtonBase color='warning' size='md' type='button' onClick={() => setDrawerOpen(true)} className='w-full flex items-center justify-center gap-2'>
                                                    <FaFilter />
                                                    Filtros
                                                </ButtonBase>
                                            </Badge>
                                        </div>
                                        <ButtonBase color='info' size='md' type='submit'>
                                            <FaSearch />
                                        </ButtonBase>
                                    </div>
                                </div>

                                {/* Mobile Drawer */}
                                <Drawer
                                    title='Filtros de Búsqueda'
                                    placement='right'
                                    onClose={() => setDrawerOpen(false)}
                                    open={drawerOpen}
                                >
                                    <div className='flex flex-col gap-4'>
                                        <LabelBase label='Desde:'>
                                            <DatePickerBase propsForm={{ name: 'fechaDesde' }} className='w-full' allowClear />
                                        </LabelBase>
                                        <LabelBase label='Hasta:'>
                                            <DatePickerBase propsForm={{ name: 'fechaHasta' }} className='w-full' allowClear />
                                        </LabelBase>
                                        <div className='flex gap-2 mt-4'>
                                            <ButtonBase color='default' className='flex-1' onClick={() => form.resetFields()}>Limpiar</ButtonBase>
                                            <ButtonBase color='info' className='flex-1' type='submit'>Aplicar</ButtonBase>
                                        </div>
                                    </div>
                                </Drawer>
                            </FormBase>

                            {/* Table */}
                            <div className="px-6 py-6">
                                <div className="h-[500px] w-full border border-slate-100 rounded-2xl overflow-hidden shadow-xl bg-white ring-1 ring-slate-200/50">
                                    <TableBase
                                        columnDefs={colDefs}
                                        rowData={requerimientos}
                                        headerColor="#059669"
                                        selectionColor="#34d399"
                                        isVisible={open}
                                        loading={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    </Modal>
                </App>
            </ConfigProvider>

            {requerimientoSeleccionado && (
                <ModalPdfViewer
                    open={pdfModalOpen}
                    onClose={() => {
                        setPdfModalOpen(false)
                        setRequerimientoSeleccionado(null)
                    }}
                    document={<RequerimientoInternoPdf requerimiento={requerimientoSeleccionado} empresa={empresa} />}
                    fileName={`${requerimientoSeleccionado.codigo}-LOG-F-03`}
                    title={`PDF - ${requerimientoSeleccionado.codigo}`}
                />
            )}
        </>
    )
}



