import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export function toUTCString({
  date,
  format = 'YYYY-MM-DD HH:mm:ss',
}: {
  date?: Dayjs
  format?: string
}) {
  return date?.utc().format(format)
}
