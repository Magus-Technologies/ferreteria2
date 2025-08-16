import {
  ColTypeDef,
  DoesFilterPassParams,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community'
import useFilterBoolean from './use-filter-boolean'
import TagBoolean from '~/components/tags/tag-boolean'
import { ValorBooleanoString } from '~/lib/constantes'

export const doesFilterPass: ({
  model,
  node,
  handlerParams,
}: DoesFilterPassParams<unknown, boolean, boolean>) => boolean = ({
  model,
  node,
  handlerParams,
}) => {
  if (model === null) return true
  return handlerParams.getValue(node) === model
}

export default function useColumnTypes() {
  const FilterBoolean = useFilterBoolean()

  const columnTypes: {
    [key: string]: ColTypeDef
  } = {
    usd: {
      cellRenderer: (params: ICellRendererParams) => {
        const { column, value } = params
        const colDef = column!.getColDef()
        let formatted

        if (typeof colDef.valueFormatter === 'function')
          formatted = colDef.valueFormatter(params as ValueFormatterParams)
        else formatted = value
        return !formatted
          ? ''
          : `$. ${Number(formatted).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
      },
    },
    pen: {
      cellRenderer: (params: ICellRendererParams) => {
        const { column, value } = params
        const colDef = column!.getColDef()
        let formatted

        if (typeof colDef.valueFormatter === 'function')
          formatted = colDef.valueFormatter(params as ValueFormatterParams)
        else formatted = value
        return !formatted
          ? ''
          : `S/. ${Number(formatted).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
      },
    },
    boolean: {
      filter: {
        component: FilterBoolean,
        doesFilterPass: doesFilterPass,
      },
      valueFormatter: ({ value }) =>
        value ? ValorBooleanoString.true : ValorBooleanoString.false,
      cellRenderer: (params: { value: boolean }) => (
        <div className='h-full flex items-center'>
          <TagBoolean booleano={params.value} className='w-24 ' />
        </div>
      ),
    },
    link: {
      cellRenderer: (params: { value: string }) => (
        <div className='h-full flex items-center'>
          <a href={params.value} target='_blank' rel='noreferrer'>
            {params.value}
          </a>
        </div>
      ),
    },
    percent: {
      cellRenderer: (params: ICellRendererParams) => {
        const { column, value } = params
        const colDef = column!.getColDef()
        let formatted

        if (typeof colDef.valueFormatter === 'function')
          formatted = colDef.valueFormatter(params as ValueFormatterParams)
        else formatted = value
        return !formatted
          ? ''
          : `${Number(formatted).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}%`
      },
    },
  }

  return { columnTypes }
}
