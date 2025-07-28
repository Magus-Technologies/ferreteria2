import { ColTypeDef, DoesFilterPassParams } from 'ag-grid-community'
import useFilterBoolean from './use-filter-boolean'
import TagBoolean from '~/components/tags/tag-boolean'

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
      valueFormatter: params =>
        !params.value
          ? '-'
          : `$. ${params.value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
    },
    pen: {
      valueFormatter: params =>
        !params.value
          ? '-'
          : `S/. ${params.value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
    },
    boolean: {
      filter: {
        component: FilterBoolean,
        doesFilterPass: doesFilterPass,
      },
      valueFormatter: ({ value }) => (value ? 'Activo' : 'Inactivo'),
      cellRenderer: (params: { value: boolean }) => (
        <div className='h-full flex items-center'>
          <TagBoolean booleano={params.value} className='w-24 ' />
        </div>
      ),
    },
  }

  return { columnTypes }
}
