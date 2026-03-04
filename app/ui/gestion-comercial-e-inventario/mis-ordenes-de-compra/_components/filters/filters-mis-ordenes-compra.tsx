'use client'

import { Form, Drawer, Badge } from 'antd'
import { FaPlusCircle, FaSearch, FaFilter } from 'react-icons/fa'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import { useStoreFiltrosOrdenesCompra } from '../../_store/store-filtros-ordenes-compra'
import { FaCalendar } from 'react-icons/fa6'
import { TbShoppingCartPlus } from 'react-icons/tb'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useEffect, useState, useMemo } from 'react'
import { useStoreAlmacen } from '~/store/store-almacen'
import Link from 'next/link'
import SelectEstadoDeCompra from '~/app/_components/form/selects/select-estado-de-compra'

interface ValuesFiltersMisOrdenesCompra {
    almacen_id: number
    proveedor_id?: number
    desde?: Dayjs
    hasta?: Dayjs
    estado?: string
}

export default function FiltersMisOrdenesCompra() {
    const [form] = Form.useForm<ValuesFiltersMisOrdenesCompra>()
    const [drawerOpen, setDrawerOpen] = useState(false)

    const almacen_id = useStoreAlmacen(state => state.almacen_id)
    const setFiltros = useStoreFiltrosOrdenesCompra(state => state.setFiltros)

    // Contar filtros activos
    const activeFiltersCount = useMemo(() => {
        const values = form.getFieldsValue()
        let count = 0
        if (values.proveedor_id) count++
        if (values.desde) count++
        if (values.hasta) count++
        if (values.estado) count++
        return count
    }, [form])

    useEffect(() => {
        const data = {
            almacen_id,
            desde: dayjs().startOf('month').format('YYYY-MM-DD'),
            hasta: dayjs().endOf('day').format('YYYY-MM-DD'),
        }
        setFiltros(data)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [almacen_id])

    return (
        <FormBase
            form={form}
            name='filtros-mis-ordenes-compra'
            initialValues={{
                almacen_id,
                desde: dayjs().startOf('month'),
                hasta: dayjs().endOf('day'),
            }}
            className='w-full'
            onFinish={values => {
                const { desde, hasta, ...rest } = values
                setFiltros({
                    ...rest,
                    desde: desde ? desde.format('YYYY-MM-DD') : undefined,
                    hasta: hasta ? hasta.format('YYYY-MM-DD') : undefined,
                })
                setDrawerOpen(false)
            }}
        >
            {/* Fila 1: Título */}
            <TituloModulos
                title='Mis Órdenes de Compra'
                icon={<TbShoppingCartPlus className='text-cyan-600' />}
            />

            {/* Fila 2: Filtros + Botón Crear */}
            <div className='flex items-center justify-between w-full mt-2 gap-2 flex-wrap'>

                {/* Grupo de Filtros Desktop */}
                <div className='hidden lg:flex items-center gap-1.5 flex-nowrap shrink-0'>
                    <div className='flex items-center gap-1 shrink-0'>
                        <span className='text-[10px] font-medium text-slate-500'>Desde:</span>
                        <DatePickerBase
                            propsForm={{ name: 'desde' }}
                            placeholder='Desde'
                            formWithMessage={false}
                            className='!w-[110px]'
                            prefix={<FaCalendar size={12} className='text-cyan-600 mx-1' />}
                            allowClear
                        />
                    </div>

                    <div className='flex items-center gap-1 shrink-0'>
                        <span className='text-[10px] font-medium text-slate-500'>Hasta:</span>
                        <DatePickerBase
                            propsForm={{ name: 'hasta' }}
                            placeholder='Hasta'
                            formWithMessage={false}
                            className='!w-[110px]'
                            prefix={<FaCalendar size={12} className='text-cyan-600 mx-1' />}
                            allowClear
                        />
                    </div>

                    <div className='flex items-center gap-1 shrink-0'>
                        <span className='text-[10px] font-medium text-slate-500'>Estado:</span>
                        <SelectEstadoDeCompra
                            propsForm={{
                                name: 'estado',
                                className: '!mb-0 !min-w-[120px] !w-[120px]',
                            }}
                            formWithMessage={false}
                            allowClear
                        />
                    </div>

                    <ConfigurableElement componentId='mis-ordenes-compra.filtro-proveedor' label='Filtro Proveedor'>
                        <div className='w-[200px] shrink-0'>
                            <SelectProveedores
                                propsForm={{
                                    name: 'proveedor_id',
                                    hasFeedback: false,
                                    className: '!mb-0 w-full',
                                }}
                                className='w-full'
                                classIconSearch='hidden'
                                formWithMessage={false}
                                allowClear
                                form={form}
                            />
                        </div>
                    </ConfigurableElement>

                    <ButtonBase color='info' size='md' type='submit' className='flex items-center gap-2 shrink-0 py-1.5'>
                        <FaSearch size={14} />
                        Buscar
                    </ButtonBase>
                </div>

                {/* Botón Crear Desktop */}
                <div className='hidden lg:block shrink-0'>
                    <Link href='/ui/gestion-comercial-e-inventario/mis-ordenes-de-compra/crear-orden-compra'>
                        <ButtonBase color='success' size='md' type='button' className='flex items-center gap-2 whitespace-nowrap py-1.5'>
                            <FaPlusCircle />
                            Crear Orden de Compra
                        </ButtonBase>
                    </Link>
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
                    <Link href='/ui/gestion-comercial-e-inventario/mis-ordenes-de-compra/crear-orden-compra'>
                        <ButtonBase color='success' size='md' type='button'>
                            <FaPlusCircle />
                        </ButtonBase>
                    </Link>
                </div>
            </div>

            <Drawer
                title='Filtros de Búsqueda'
                placement='right'
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
            >
                <div className='flex flex-col gap-4'>
                    <LabelBase label='Proveedor:'>
                        <SelectProveedores
                            propsForm={{ name: 'proveedor_id' }}
                            className='w-full'
                            classIconSearch='hidden'
                            allowClear
                            form={form}
                        />
                    </LabelBase>
                    <LabelBase label='Desde:'>
                        <DatePickerBase propsForm={{ name: 'desde' }} className='w-full' allowClear />
                    </LabelBase>
                    <LabelBase label='Hasta:'>
                        <DatePickerBase propsForm={{ name: 'hasta' }} className='w-full' allowClear />
                    </LabelBase>
                    <LabelBase label='Estado:'>
                        <SelectEstadoDeCompra propsForm={{ name: 'estado' }} className='w-full' allowClear />
                    </LabelBase>
                    <div className='flex gap-2 mt-4'>
                        <ButtonBase color='default' className='flex-1' onClick={() => form.resetFields()}>Limpiar</ButtonBase>
                        <ButtonBase color='info' className='flex-1' type='submit'>Aplicar</ButtonBase>
                    </div>
                </div>
            </Drawer>
        </FormBase >
    )
}