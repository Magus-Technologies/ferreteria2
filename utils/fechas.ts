import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export function toLocalString({
  date,
  format = 'YYYY-MM-DD HH:mm:ss',
}: {
  date?: Dayjs
  format?: string
}) {
  return date?.format(format)
}

export function toUTCString({
  date,
  format = 'YYYY-MM-DD HH:mm:ss',
}: {
  date?: Dayjs
  format?: string
}) {
  return date?.utc().format(format)
}

export function toUTCBD({ date }: { date: Dayjs }) {
  return date.utc().toDate().toISOString()
}
