import { TimeRangePickerProps } from 'antd'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
dayjs.extend(isoWeek)

export const presetsRangePicker: TimeRangePickerProps['presets'] = [
  {
    label: 'Esta semana',
    value: [dayjs().startOf('week'), dayjs()],
  },
  {
    label: 'Semana Pasada',
    value: [
      dayjs().subtract(1, 'week').startOf('isoWeek'),
      dayjs().subtract(1, 'week').endOf('isoWeek'),
    ],
  },
  {
    label: 'Este mes',
    value: [dayjs().startOf('month'), dayjs()],
  },
  {
    label: 'Mes Pasado',
    value: [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ],
  },
  {
    label: 'Este año',
    value: [dayjs().startOf('year'), dayjs()],
  },
  {
    label: 'Año Pasado',
    value: [
      dayjs().subtract(1, 'year').startOf('year'),
      dayjs().subtract(1, 'year').endOf('year'),
    ],
  },
]
