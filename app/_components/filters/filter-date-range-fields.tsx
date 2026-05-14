'use client'

import { FaCalendar } from 'react-icons/fa'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'

interface FilterDateRangeFieldsProps {
  fromName: string
  toName: string
  fromLabel?: string
  toLabel?: string
  fromPlaceholder?: string
  toPlaceholder?: string
  fromFieldClassName?: string
  toFieldClassName?: string
  itemClassName?: string
  stacked?: boolean
  inputReadOnly?: boolean
  allowClear?: boolean
}

export default function FilterDateRangeFields({
  fromName,
  toName,
  fromLabel = 'Fecha Desde:',
  toLabel = 'Hasta:',
  fromPlaceholder = 'Fecha',
  toPlaceholder = 'Hasta',
  fromFieldClassName = '!w-full',
  toFieldClassName = '!w-full',
  itemClassName = 'flex items-center gap-2',
  stacked = false,
  inputReadOnly = false,
  allowClear = true,
}: FilterDateRangeFieldsProps) {
  const labelClassName = stacked
    ? 'text-sm font-semibold text-gray-700 block mb-2'
    : 'text-xs font-semibold text-gray-700 whitespace-nowrap'

  return (
    <>
      <div className={itemClassName}>
        <label className={labelClassName}>{fromLabel}</label>
        <DatePickerBase
          propsForm={{
            name: fromName,
            hasFeedback: false,
            className: fromFieldClassName,
          }}
          placeholder={fromPlaceholder}
          formWithMessage={false}
          prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
          allowClear={allowClear}
          inputReadOnly={inputReadOnly}
          className={stacked ? 'w-full' : undefined}
        />
      </div>
      <div className={itemClassName}>
        <label className={labelClassName}>{toLabel}</label>
        <DatePickerBase
          propsForm={{
            name: toName,
            hasFeedback: false,
            className: toFieldClassName,
          }}
          placeholder={toPlaceholder}
          formWithMessage={false}
          prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
          allowClear={allowClear}
          inputReadOnly={inputReadOnly}
          className={stacked ? 'w-full' : undefined}
        />
      </div>
    </>
  )
}
