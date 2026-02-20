'use client'

import { List, Button, Badge, Tooltip, Popconfirm, Empty } from 'antd'
import { EditOutlined, DeleteOutlined, StarOutlined, StarFilled, EnvironmentOutlined } from '@ant-design/icons'
import { type DireccionCliente } from '~/lib/api/cliente'

interface ListaDireccionesProps {
  direcciones: DireccionCliente[]
  onEditar: (direccion: DireccionCliente) => void
  onEliminar: (id: number) => void
  onMarcarPrincipal: (id: number) => void
  loading: boolean
}

export default function ListaDirecciones({
  direcciones,
  onEditar,
  onEliminar,
  onMarcarPrincipal,
  loading,
}: ListaDireccionesProps) {
  if (!loading && direcciones.length === 0) {
    return (
      <Empty
        description="No hay direcciones registradas"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }

  return (
    <List
      loading={loading}
      dataSource={direcciones}
      renderItem={(direccion) => (
        <List.Item
          key={direccion.id}
          actions={[
            <Tooltip key="editar" title="Editar dirección">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEditar(direccion)}
                size="small"
              />
            </Tooltip>,
            direccion.es_principal ? (
              <Tooltip key="principal" title="Esta es la dirección principal">
                <Button
                  type="text"
                  icon={<StarFilled style={{ color: '#faad14' }} />}
                  disabled
                  size="small"
                />
              </Tooltip>
            ) : (
              <Tooltip key="marcar-principal" title="Marcar como principal">
                <Button
                  type="text"
                  icon={<StarOutlined />}
                  onClick={() => onMarcarPrincipal(direccion.id)}
                  size="small"
                />
              </Tooltip>
            ),
            <Tooltip key="eliminar" title={direccion.es_principal ? 'No se puede eliminar la dirección principal' : 'Eliminar dirección'}>
              <Popconfirm
                title="¿Eliminar dirección?"
                description="Esta acción no se puede deshacer"
                onConfirm={() => onEliminar(direccion.id)}
                okText="Eliminar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
                disabled={direccion.es_principal}
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={direccion.es_principal}
                  size="small"
                />
              </Popconfirm>
            </Tooltip>,
          ]}
        >
          <List.Item.Meta
            avatar={
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <span className="text-blue-600 font-semibold text-sm">{direccion.tipo}</span>
              </div>
            }
            title={
              <div className="flex items-center gap-2">
                <span>{direccion.direccion}</span>
                {direccion.es_principal && (
                  <Badge count="Principal" style={{ backgroundColor: '#faad14' }} />
                )}
                {direccion.latitud && direccion.longitud && (
                  <Tooltip title={`Coordenadas: ${direccion.latitud.toFixed(6)}, ${direccion.longitud.toFixed(6)}`}>
                    <EnvironmentOutlined style={{ color: '#52c41a' }} />
                  </Tooltip>
                )}
              </div>
            }
            description={
              <div className="text-xs text-gray-500">
                {direccion.latitud && direccion.longitud ? (
                  <span>📍 Con ubicación GPS</span>
                ) : (
                  <span>📍 Sin ubicación GPS</span>
                )}
              </div>
            }
          />
        </List.Item>
      )}
    />
  )
}
