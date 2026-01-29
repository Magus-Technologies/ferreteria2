'use client'

import { Button, Space, Typography } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  loading?: boolean
  onNextPage: () => void
  onPrevPage: () => void
}

const { Text } = Typography

export default function PaginationControls({
  currentPage,
  totalPages,
  total,
  pageSize,
  loading = false,
  onNextPage,
  onPrevPage,
}: PaginationControlsProps) {
  const startItem = currentPage * pageSize + 1
  const endItem = Math.min((currentPage + 1) * pageSize, total)

  // No mostrar si solo hay una página o menos
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border-t">
      <Text className="text-sm text-gray-600">
        Mostrando {startItem}-{endItem} de {total} elementos
      </Text>
      
      <Space>
        <Button
          size="small"
          icon={<LeftOutlined />}
          onClick={onPrevPage}
          disabled={currentPage === 0 || loading}
        >
          Anterior
        </Button>
        
        <Text className="text-sm">
          Página {currentPage + 1} de {Math.max(totalPages, 1)}
        </Text>
        
        <Button
          size="small"
          icon={<RightOutlined />}
          onClick={onNextPage}
          disabled={currentPage >= totalPages - 1 || loading}
        >
          Siguiente
        </Button>
      </Space>
    </div>
  )
}