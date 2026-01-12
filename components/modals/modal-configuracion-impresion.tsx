import { Modal, Select, InputNumber, Button, Space, Divider, message, List, Tag } from 'antd'
import { useState } from 'react'
import { BoldOutlined, DeleteOutlined } from '@ant-design/icons'
import { TipoDocumento, ConfiguracionCampo } from '~/store/store-configuracion-impresion'
import { useConfiguracionImpresion } from '~/hooks/use-configuracion-impresion'
import ButtonBase from '../buttons/button-base'

interface ModalConfiguracionImpresionProps {
  open: boolean
  setOpen: (open: boolean) => void
  tipoDocumento: TipoDocumento
}

const fontFamilies = [
  { label: 'Arial (Por defecto)', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
]

export default function ModalConfiguracionImpresion({
  open,
  setOpen,
  tipoDocumento,
}: ModalConfiguracionImpresionProps) {
  const [campoSeleccionado, setCampoSeleccionado] = useState<string | null>(null)
  const [fontFamily, setFontFamily] = useState<string>('Arial')
  const [fontSize, setFontSize] = useState<number>(10)
  const [isBold, setIsBold] = useState<boolean>(false)
  
  const {
    camposDisponibles,
    getConfiguracionCampo,
    updateConfiguracionCampo,
    resetConfiguracionCampo,
    resetConfiguracionesCompletas,
    isUpdating,
    isResetting,
    isLoading,
  } = useConfiguracionImpresion({ 
    tipoDocumento,
    enabled: open,
  })

  // Obtener lista de campos configurados (que no tienen valores por defecto)
  const camposConfigurados = Object.keys(camposDisponibles).filter(campo => {
    const config = getConfiguracionCampo(campo)
    // Un campo está configurado si tiene valores diferentes a los defaults
    return config.font_size !== 8 || config.font_weight !== 'normal' || config.font_family !== 'Arial'
  })

  // Cuando se selecciona un campo, cargar su configuración actual
  const handleCampoChange = (campo: string) => {
    if (!campo) return
    
    setCampoSeleccionado(campo)
    const config = getConfiguracionCampo(campo)
    setFontFamily(config.font_family)
    setFontSize(config.font_size)
    setIsBold(config.font_weight === 'bold')
  }

  // Cuando se hace click en un campo de la lista, cargarlo en el editor
  const handleEditarCampo = (campo: string) => {
    handleCampoChange(campo)
  }

  const handleAplicar = async () => {
    if (!campoSeleccionado) {
      message.warning('Seleccione un campo primero')
      return
    }

    try {
      await updateConfiguracionCampo(campoSeleccionado, {
        font_family: fontFamily,
        font_size: fontSize,
        font_weight: isBold ? 'bold' : 'normal',
      })
      message.success(`Formato aplicado a "${camposDisponibles[campoSeleccionado]}"`)
      // Limpiar selección después de aplicar
      setCampoSeleccionado(null)
      setFontFamily('Arial')
      setFontSize(10)
      setIsBold(false)
    } catch (error) {
      console.error('Error al aplicar formato:', error)
      message.error('Error al aplicar formato')
    }
  }

  const handleResetCampo = async (campo: string) => {
    try {
      await resetConfiguracionCampo(campo)
      message.success(`Formato reseteado para "${camposDisponibles[campo]}"`)
      // Si era el campo seleccionado, limpiar selección
      if (campoSeleccionado === campo) {
        setCampoSeleccionado(null)
        setFontFamily('Arial')
        setFontSize(10)
        setIsBold(false)
      }
    } catch (error) {
      console.error('Error al resetear:', error)
      message.error('Error al resetear formato')
    }
  }

  const handleResetAll = async () => {
    try {
      await resetConfiguracionesCompletas()
      message.success('Todos los formatos reseteados')
      // Resetear valores del formulario
      setFontFamily('Arial')
      setFontSize(10)
      setIsBold(false)
      setCampoSeleccionado(null)
    } catch (error) {
      console.error('Error al resetear:', error)
      message.error('Error al resetear formatos')
    }
  }

  const handleClose = () => {
    setCampoSeleccionado(null)
    setFontFamily('Arial')
    setFontSize(10)
    setIsBold(false)
    setOpen(false)
  }

  // Obtener lista de campos como opciones para el Select
  const camposOptions = Object.entries(camposDisponibles).map(([key, label]) => ({
    label,
    value: key,
  }))

  return (
    <Modal
      centered
      open={open}
      title='Configuración de Formato de Impresión'
      onCancel={handleClose}
      maskClosable={false}
      keyboard={false}
      width={900}
      zIndex={2000}
      footer={[
        <Button
          key='reset-all'
          onClick={handleResetAll}
          danger
          loading={isResetting}
          className='mr-auto'
          disabled={camposConfigurados.length === 0}
        >
          Resetear Todo
        </Button>,
        <ButtonBase
          key='close'
          onClick={handleClose}
          className='rounded-xl'
        >
          Cerrar
        </ButtonBase>,
      ]}
    >
      <div className='py-2 max-h-[70vh] overflow-y-auto'>
        {/* Lista de configuraciones guardadas */}
        {camposConfigurados.length > 0 ? (
          <div className='mb-4'>
            <h3 className='text-sm font-semibold text-gray-700 mb-2'>
              Configuraciones Guardadas:
            </h3>
            <List
              size='small'
              bordered
              dataSource={camposConfigurados}
              className='bg-white'
              renderItem={(campo) => {
                const config = getConfiguracionCampo(campo)
                return (
                  <List.Item
                    className='hover:bg-gray-50 cursor-pointer'
                    onClick={() => handleEditarCampo(campo)}
                    actions={[
                      <Button
                        key='reset'
                        type='text'
                        size='small'
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleResetCampo(campo)
                        }}
                        danger
                      >
                        Resetear
                      </Button>,
                    ]}
                  >
                    <div className='flex items-center gap-3 flex-1 flex-wrap'>
                      <span className='font-medium text-gray-700 min-w-[140px]'>
                        {camposDisponibles[campo]}:
                      </span>
                      <div className='flex items-center gap-2'>
                        <Tag color='blue'>{config.font_family}</Tag>
                        <Tag color='green'>{config.font_size}px</Tag>
                        {config.font_weight === 'bold' && (
                          <Tag color='orange'>Negrita</Tag>
                        )}
                      </div>
                      <div
                        className='ml-auto text-sm'
                        style={{
                          fontFamily: config.font_family,
                          fontSize: `${config.font_size}px`,
                          fontWeight: config.font_weight,
                        }}
                      >
                        Vista previa
                      </div>
                    </div>
                  </List.Item>
                )
              }}
            />
          </div>
        ) : (
          <div className='mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center'>
            <p className='text-sm text-gray-500'>
              No hay configuraciones guardadas. Selecciona un campo abajo para comenzar.
            </p>
          </div>
        )}

        <Divider className='my-3'>Agregar/Editar Formato</Divider>

        {/* Toolbar de formato */}
        <div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
          <div className='mb-3'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Seleccionar campo a formatear:
            </label>
            <Select
              placeholder='Seleccione un campo del documento'
              value={campoSeleccionado}
              onChange={handleCampoChange}
              options={camposOptions}
              className='w-full'
              size='large'
              showSearch
              allowClear
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-3 items-end'>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>Fuente:</label>
              <Select
                value={fontFamily}
                onChange={setFontFamily}
                options={fontFamilies}
                className='w-full'
                disabled={!campoSeleccionado}
              />
            </div>

            <div>
              <label className='block text-xs text-gray-600 mb-1'>Tamaño:</label>
              <InputNumber
                value={fontSize}
                onChange={(val) => setFontSize(val || 8)}
                min={5}
                max={16}
                className='w-full'
                disabled={!campoSeleccionado}
              />
            </div>

            <div>
              <Button
                type={isBold ? 'primary' : 'default'}
                icon={<BoldOutlined />}
                onClick={() => setIsBold(!isBold)}
                disabled={!campoSeleccionado}
                size='large'
                className='w-full'
                style={{ fontWeight: 'bold' }}
              >
                Negrita
              </Button>
            </div>

            <div>
              <Button
                type='primary'
                onClick={handleAplicar}
                disabled={!campoSeleccionado}
                loading={isUpdating}
                size='large'
                className='w-full'
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>

        {/* Vista previa del formato */}
        {campoSeleccionado && (
          <div className='mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200'>
            <p className='text-xs text-gray-600 mb-1'>Vista previa:</p>
            <div
              style={{
                fontFamily: fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight: isBold ? 'bold' : 'normal',
              }}
            >
              {camposDisponibles[campoSeleccionado]} - Texto de ejemplo
            </div>
          </div>
        )}

        {/* Instrucciones */}
        {/* <div className='mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
          <p className='text-xs font-semibold text-gray-700 mb-1'>
            Instrucciones:
          </p>
          <ul className='text-xs text-gray-600 space-y-0.5 list-disc list-inside'>
            <li>Las configuraciones guardadas se muestran arriba con vista previa</li>
            <li>Selecciona un campo del dropdown para agregar o editar su formato</li>
            <li>Ajusta el formato y haz click en "Aplicar"</li>
            <li>Usa "Resetear" para eliminar el formato de un campo específico</li>
          </ul>
        </div> */}
      </div>
    </Modal>
  )
}
