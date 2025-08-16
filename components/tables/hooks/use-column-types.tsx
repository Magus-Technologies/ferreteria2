import { ColTypeDef, DoesFilterPassParams } from 'ag-grid-community'
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
      cellRenderer: (params: { value: number | string }) =>
        !params.value
          ? ''
          : `$. ${Number(params.value).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
    },
    pen: {
      cellRenderer: (params: { value: number | string }) =>
        !params.value
          ? ''
          : `S/. ${Number(params.value).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
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
      cellRenderer: (params: { value: number | string }) =>
        !params.value
          ? ''
          : `${Number(params.value).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}%`,
    },
  }

  return { columnTypes }
}
