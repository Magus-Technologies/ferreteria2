'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Tabs, Input, Button, message, List, Popconfirm, Typography, Space } from 'antd'
import { FaDownload, FaTrash, FaLink, FaUpload, FaFonticons } from 'react-icons/fa'
import { fuentesApi, type FuentePersonalizada } from '~/lib/api/fuentes'

const { Text } = Typography

interface GestorFuentesProps {
  open: boolean
  onClose: () => void
  onFuentesChange?: () => void
}

export default function GestorFuentes({ open, onClose, onFuentesChange }: GestorFuentesProps) {
  const [fuentes, setFuentes] = useState<FuentePersonalizada[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [downloadName, setDownloadName] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cargarFuentes = async () => {
    setLoading(true)
    try {
      const res = await fuentesApi.list()
      if (res.data?.data) {
        setFuentes(res.data.data)
      }
    } catch (error) {
      console.error('Error al cargar fuentes:', error)
      message.error('Error al cargar fuentes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) cargarFuentes()
  }, [open])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleUploadSubmit = async () => {
    if (!uploadName.trim()) {
      message.warning('Ingresa un nombre para la fuente')
      return
    }
    if (!uploadFile) {
      message.warning('Selecciona un archivo')
      return
    }

    setUploading(true)
    try {
      const res = await fuentesApi.upload(uploadName.trim(), uploadFile)
      if (res.data?.success) {
        message.success('Fuente subida correctamente')
        setUploadName('')
        setUploadFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        cargarFuentes()
        onFuentesChange?.()
      } else {
        message.error(res.data?.message || 'Error al subir la fuente')
      }
    } catch (error) {
      console.error('Error al subir la fuente:', error)
      message.error('Error al subir la fuente')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async () => {
    if (!downloadName.trim() || !downloadUrl.trim()) {
      message.warning('Completa todos los campos')
      return
    }
    setDownloading(true)
    try {
      const res = await fuentesApi.download(downloadName.trim(), downloadUrl.trim())
      if (res.data?.success) {
        message.success('Fuente descargada correctamente')
        setDownloadName('')
        setDownloadUrl('')
        cargarFuentes()
        onFuentesChange?.()
      } else {
        message.error(res.data?.message || 'Error al descargar la fuente')
      }
    } catch (error) {
      console.error('Error al descargar la fuente:', error)
      message.error('Error al descargar la fuente')
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fuentesApi.delete(id)
      if (res.data?.success) {
        message.success('Fuente eliminada')
        cargarFuentes()
        onFuentesChange?.()
      } else {
        message.error(res.data?.message || 'Error al eliminar la fuente')
      }
    } catch (error) {
      console.error('Error al eliminar la fuente:', error)
      message.error('Error al eliminar la fuente')
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2">
          <FaFonticons className="text-blue-500" />
          <span className="font-semibold">Gestionar Fuentes Personalizadas</span>
        </div>
      }
      width={640}
      footer={null}
      centered
    >
      <Tabs
        items={[
          {
            key: 'list',
            label: 'Fuentes guardadas',
            children: (
              <div className="min-h-[200px]">
                {fuentes.length === 0 ? (
                  <div className="text-center text-slate-400 py-10">
                    <FaFonticons style={{ fontSize: 32, marginBottom: 8 }} className="mx-auto" />
                    <p>No hay fuentes personalizadas aún</p>
                    <Text type="secondary" className="text-xs">
                      Sube un archivo .ttf/.otf o descarga desde una URL
                    </Text>
                  </div>
                ) : (
                  <List
                    loading={loading}
                    dataSource={fuentes}
                    renderItem={(f) => (
                      <List.Item
                        actions={[
                          <Popconfirm
                            key="delete"
                            title="Eliminar fuente"
                            description={`¿Eliminar "${f.nombre}"?`}
                            onConfirm={() => handleDelete(f.id)}
                            okText="Eliminar"
                            cancelText="Cancelar"
                          >
                            <Button type="text" danger icon={<FaTrash />} />
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                              <FaFonticons className="text-blue-600" />
                            </div>
                          }
                          title={<span className="font-medium">{f.nombre}</span>}
                          description={
                            <Text type="secondary" className="text-xs">
                              {f.archivo_original} &middot; {f.tipo_mime}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </div>
            ),
          },
          {
            key: 'upload',
            label: 'Subir archivo',
            children: (
              <div className="space-y-4">
                <div>
                  <Text className="text-sm font-medium">Nombre de la fuente</Text>
                  <Input
                    placeholder="Ej: MiFuente"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    className="mt-1"
                  />
                  <Text type="secondary" className="text-xs">
                    Este nombre aparecerá en el selector de fuentes
                  </Text>
                </div>

                <div>
                  <Text className="text-sm font-medium">Archivo</Text>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <Button
                    onClick={handleUploadClick}
                    icon={<FaUpload />}
                    className="w-full mt-1"
                    disabled={uploading}
                  >
                    {uploadFile ? uploadFile.name : 'Seleccionar archivo'}
                  </Button>
                  <Text type="secondary" className="text-xs">
                    Formatos: TTF, OTF, WOFF, WOFF2 (máx 5MB)
                  </Text>
                </div>

                <Space className="w-full justify-end">
                  <Button onClick={() => {
                    setUploadName('')
                    setUploadFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}>
                    Limpiar
                  </Button>
                  <Button
                    type="primary"
                    icon={<FaUpload />}
                    onClick={handleUploadSubmit}
                    loading={uploading}
                    disabled={!uploadName.trim() || !uploadFile}
                  >
                    Guardar fuente
                  </Button>
                </Space>
              </div>
            ),
          },
          {
            key: 'download',
            label: 'Descargar desde URL',
            children: (
              <div className="space-y-4">
                <div>
                  <Text className="text-sm font-medium">Nombre de la fuente</Text>
                  <Input
                    placeholder="Ej: OpenSans"
                    value={downloadName}
                    onChange={(e) => setDownloadName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Text className="text-sm font-medium">URL del archivo</Text>
                  <Input
                    placeholder="https://ejemplo.com/fuente.ttf"
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    className="mt-1"
                    prefix={<FaLink className="text-slate-400" />}
                  />
                  <Text type="secondary" className="text-xs">
                    Enlace directo al archivo .ttf, .otf, .woff o .woff2
                  </Text>
                </div>
                <Button
                  type="primary"
                  icon={<FaDownload />}
                  onClick={handleDownload}
                  loading={downloading}
                  disabled={!downloadName.trim() || !downloadUrl.trim()}
                  className="w-full"
                >
                  Descargar e instalar fuente
                </Button>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  )
}
