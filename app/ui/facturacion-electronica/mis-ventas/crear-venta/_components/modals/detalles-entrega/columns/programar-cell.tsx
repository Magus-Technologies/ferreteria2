'use client'

import { InputNumber } from 'antd'
import { memo, useEffect, useState } from 'react'

interface ProgramarCellProps {
  id: number
  initialValue: number
  max: number
  onCommit: (id: number, value: number | null) => void
}

/**
 * Celda editable para AG Grid — el usuario tipea la cantidad a "programar"
 * y el valor se commitea al hacer blur o presionar Enter.
 *
 * Usa un buffer local (useState) para no triggerar re-render del row data
 * en cada keystroke. Cuando el `initialValue` externo cambia (ej. al cargar
 * datos del form), se resincroniza.
 *
 * Memoizada para evitar re-renders en grandes listas — una celda solo se
 * re-renderiza cuando sus props cambian.
 */
export const ProgramarCell = memo(function ProgramarCell({
  id,
  initialValue,
  max,
  onCommit,
}: ProgramarCellProps) {
  const [value, setValue] = useState<number | null>(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return (
    <div className="flex items-center h-full">
      <InputNumber
        size="small"
        value={value}
        min={0}
        max={max}
        precision={2}
        onChange={setValue}
        onBlur={() => onCommit(id, value)}
        onPressEnter={() => onCommit(id, value)}
        style={{ width: '100%' }}
      />
    </div>
  )
})
