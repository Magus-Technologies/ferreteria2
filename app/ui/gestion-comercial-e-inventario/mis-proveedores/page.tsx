'use client'

import { useState, useRef, useCallback } from 'react'
import { Input, Select, Button, Spin } from 'antd'
import { FaTruck, FaSearch, FaPlus } from 'react-icons/fa'
import { ReloadOutlined } from '@ant-design/icons'
import { AgGridReact } from 'ag-grid-react'
import { useQuery } from '@tanstack/react-query'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import TableBase from '~/components/tables/table-base'
import { proveedorApi, type Proveedor } from '~/lib/api/proveedor'
import { useColumnsProveedores } from './_components/tables/columns-proveedores'
import ModalCreateProveedor from './_components/modals/modal-create-proveedor'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { greenColors } from '~/lib/colors'

export default function MisProveedoresPage() {
    const gridRef = useRef<AgGridReact<Proveedor>>(null)

    // Estado de filtros
    const [search, setSearch] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [estadoFiltro, setEstadoFiltro] = useState<string | undefined>(undefined)

    // Estado del modal
    const [modalOpen, setModalOpen] = useState(false)
    const [dataEdit, setDataEdit] = useState<Proveedor | undefined>(undefined)

    // Query para obtener proveedores
    const { data: proveedores = [], isLoading, refetch } = useQuery({
        queryKey: [QueryKeys.PROVEEDORES, search, estadoFiltro],
        queryFn: async () => {
            const result = await proveedorApi.getAll({
                search: search || undefined,
                estado: estadoFiltro,
                per_page: 100,
            })

            if (result.error) {
                throw new Error(result.error.message)
            }

            return result.data?.data || []
        },
    })

    // Columnas con acciones
    const columns = useColumnsProveedores({
        setDataEdit: (data) => {
            setDataEdit(data)
            setModalOpen(true)
        },
        setOpen: setModalOpen,
        onReactivar: refetch,
    })

    // Handlers
    const handleBuscar = useCallback(() => {
        setSearch(searchInput)
    }, [searchInput])

    const handleLimpiar = useCallback(() => {
        setSearchInput('')
        setSearch('')
        setEstadoFiltro(undefined)
    }, [])

    const handleCrearNuevo = useCallback(() => {
        setDataEdit(undefined)
        setModalOpen(true)
    }, [])

    const handleModalSuccess = useCallback(() => {
        setModalOpen(false)
        setDataEdit(undefined)
        refetch()
    }, [refetch])

    return (
        <ContenedorGeneral>
            <TituloModulos
                title='Mis Proveedores'
                icon={<FaTruck className='text-green-600' />}
            />

            <div className='mt-4 w-full space-y-4'>
                {/* Filtros */}
                <div>
                    <div className='flex items-center gap-3 mb-3'>
                        <FaSearch className='text-green-600' />
                        <span className='font-semibold text-slate-700'>Filtros</span>
                    </div>
                    <div className='grid grid-cols-12 gap-x-3 gap-y-2.5'>
                        {/* Búsqueda por texto */}
                        <div className='col-span-4 flex items-center gap-2'>
                            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
                                Buscar:
                            </label>
                            <Input
                                placeholder='RUC, Razón Social, Teléfono...'
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onPressEnter={handleBuscar}
                                allowClear
                                size='middle'
                                variant='filled'
                            />
                        </div>

                        {/* Filtro por estado */}
                        <div className='col-span-2 flex items-center gap-2'>
                            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
                                Estado:
                            </label>
                            <Select
                                className='w-full'
                                value={estadoFiltro}
                                onChange={(value) => setEstadoFiltro(value)}
                                allowClear
                                placeholder='Todos'
                                options={[
                                    { label: 'Activos', value: '1' },
                                    { label: 'Inactivos', value: '0' },
                                ]}
                                size='middle'
                                variant='filled'
                            />
                        </div>

                        {/* Botones */}
                        <div className='col-span-6 flex items-center gap-2'>
                            <Button
                                type='primary'
                                icon={<FaSearch />}
                                onClick={handleBuscar}
                                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                                className='flex items-center gap-1'
                            >
                                Buscar
                            </Button>
                            <Button
                                type='primary'
                                icon={<ReloadOutlined />}
                                onClick={handleLimpiar}
                                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                                className='flex items-center gap-1'
                            >
                                Limpiar
                            </Button>
                            <div className='flex-1' />
                            <Button
                                type='primary'
                                icon={<FaPlus />}
                                onClick={handleCrearNuevo}
                                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                                className='flex items-center gap-1'
                            >
                                Nuevo Proveedor
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Info de resultados */}
                <div className='flex items-center justify-between'>
                    <span className='text-lg font-semibold text-slate-700'>
                        Lista de Proveedores
                    </span>
                    <span className='text-sm text-slate-500'>
                        Total: {proveedores.length} proveedores
                    </span>
                </div>

                {/* Tabla */}
                {isLoading ? (
                    <div className='flex justify-center items-center h-[500px]'>
                        <Spin size='large'>
                            <div className='p-12'>Cargando proveedores...</div>
                        </Spin>
                    </div>
                ) : (
                    <div className='h-[500px] w-full'>
                        <TableBase<Proveedor>
                            ref={gridRef}
                            rowData={proveedores}
                            columnDefs={columns}
                            rowSelection={false}
                            withNumberColumn={true}

                        />
                    </div>
                )}
            </div>

            {/* Modal Crear/Editar Proveedor */}
            <ModalCreateProveedor
                open={modalOpen}
                setOpen={setModalOpen}
                dataEdit={dataEdit}
                onSuccess={handleModalSuccess}
            />
        </ContenedorGeneral>
    )
}
