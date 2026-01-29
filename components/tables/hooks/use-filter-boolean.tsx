import { FilterWrapperParams, IAfterGuiAttachedParams } from 'ag-grid-community'
import { CustomFilterDisplayProps, useGridFilterDisplay } from 'ag-grid-react'
import { Radio, RadioChangeEvent } from 'antd'
import { useCallback, useRef } from 'react'
import { ValorBooleanoString } from '~/lib/constantes'

export default function useFilterBoolean({
  trueText = ValorBooleanoString.true,
  falseText = ValorBooleanoString.false,
  allText = 'Todos',
}: {
  trueText?: string
  falseText?: string
  allText?: string
} = {}) {
  return function FilterBoolean({
    state,
    onStateChange,
    onAction,
    buttons,
  }: CustomFilterDisplayProps<boolean, boolean, boolean> &
    FilterWrapperParams) {
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
            { value: 'all', label: allText },
            { value: 'true', label: trueText },
            { value: 'false', label: falseText },
          ]}
        />
      </div>
    )
  }
}
