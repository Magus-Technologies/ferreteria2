'use client'

import DatePickerBase, {
  DatePickerBaseProps,
} from '~/app/_components/form/fechas/date-picker-base'
import dayjs from 'dayjs'

export default function YearPicker({
  defaultValue = dayjs(),
  variant = 'filled',
  placeholder = 'Año',
  className = 'w-24',
  picker = 'year',
  ...props
}: DatePickerBaseProps) {
  return (
    <DatePickerBase
      {...props}
      format='YYYY'
      defaultValue={defaultValue}
      variant={variant}
      placeholder={placeholder}
      className={className}
      picker={picker}
    />
  )
}
