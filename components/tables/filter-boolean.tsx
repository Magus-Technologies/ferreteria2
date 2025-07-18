import React, { useCallback, useRef } from 'react'

import type {
  FilterWrapperParams,
  IAfterGuiAttachedParams,
} from 'ag-grid-community'
import type { CustomFilterDisplayProps } from 'ag-grid-react'
import { useGridFilterDisplay } from 'ag-grid-react'
import { Radio } from 'antd'
import { RadioChangeEvent } from 'antd/lib'

export default function FilterBoolean({
  state,
  onStateChange,
  onAction,
  buttons,
}: CustomFilterDisplayProps<boolean, boolean, boolean> & FilterWrapperParams) {
  const refInput = useRef<HTMLInputElement>(null)

  const afterGuiAttached = useCallback((params?: IAfterGuiAttachedParams) => {
    if (!params?.suppressFocus) {
      refInput.current?.focus()
    }
  }, [])

  useGridFilterDisplay({ afterGuiAttached })

  const onValueChange = ({ target: { value } }: RadioChangeEvent) => {
    let parsedValue: boolean | null = null
    if (value === 'true') parsedValue = true
    else if (value === 'false') parsedValue = false
    else parsedValue = null

    onStateChange({ model: parsedValue })
    if (!buttons?.includes('apply')) {
      onAction('apply')
    }
  }

  return (
    <div className='py-2 px-4'>
      <div className='font-semibold pb-2'>Mostrar:</div>
      <Radio.Group
        style={{ display: 'flex', flexDirection: 'column' }}
        defaultValue={
          state.model === null ? 'all' : state.model ? 'true' : 'false'
        }
        onChange={onValueChange}
        options={[
          { value: 'all', label: 'Todos' },
          { value: 'true', label: 'Activos' },
          { value: 'false', label: 'Inactivos' },
        ]}
      />
    </div>
  )
}
