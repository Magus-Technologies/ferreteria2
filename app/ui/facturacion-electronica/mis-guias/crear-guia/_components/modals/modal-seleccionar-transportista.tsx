'use client'

import { Modal, Table } from 'antd'
import { useState } from 'react'
import { useDebounce } from 'use-debounce'
import { useQuery } from '@tanstack/react-query'
import InputBase from '~/app/_components/form/inputs/input-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { Transportista, transportistaApi } from '~/lib/api/transportista'

type ModalSeleccionarTransportistaProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onSelect: (transportista: Transportista) => void
}

export default function ModalSeleccionarTransportista({
  open,
  setOpen,
  onSelect,
}: ModalSeleccionarTransportistaProps) {
  const [text, setText] = useState('')

  const [value] = useDebounce(text, 500)

  const { data: response, isLoading: loading } = useQuery({
    queryKey: [QueryKeys.TRANSPORTISTAS, value],
    queryFn: async () => {
      const result = await transportistaApi.list({ search: value, per_page: 20 })
      return result.data?.data || []
    },
    enabled: open,
    placeholderData: previousData => previousData,
  })

  function handleSelect(transportista: Transportista) {
    onSelect(transportista)
    setOpen(false)
    setText('')
  }

  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title='Buscar Transportista'
      footer={null}
      cancelText='Cerrar'
      onCancel={() => {
        setOpen(false)
        setText('')
      }}
      maskClosable={false}
      keyboard={false}
      destroyOnHidden
    >
      <InputBase
        placeholder='Buscar por RUC o razón social'
        value={text}
        onChange={e => setText(e.target.value)}
        className='max-w-[500px]'
        uppercase={false}
      />
      <div className='mt-4 min-w-[700px]'>
        <Table<Transportista>
          rowKey='id'
          loading={loading}
          dataSource={response || []}
          pagination={{ pageSize: 10, showTotal: total => `Total: ${total} transportistas` }}
          onRow={record => ({
            onClick: () => handleSelect(record),
            className: 'cursor-pointer',
          })}
          columns={[
            { title: 'RUC', dataIndex: 'ruc', key: 'ruc', width: 140 },
            { title: 'Razón Social', dataIndex: 'razon_social', key: 'razon_social' },
            { title: 'N° MTC', dataIndex: 'nro_mtc', key: 'nro_mtc', width: 140, render: (v: string | null) => v || '-' },
          ]}
        />
      </div>
    </Modal>
  )
}
