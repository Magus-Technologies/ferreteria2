import { App, Upload } from 'antd'
import { UploadProps } from 'antd/lib'
import { FaCloudUploadAlt } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import { read, utils } from 'xlsx-js-style'
import { AgGridReact } from 'ag-grid-react'
import { ReactNode, RefObject, useState } from 'react'
import { Column } from 'ag-grid-community'
import { BiLoaderAlt } from 'react-icons/bi'
import {
  UseMutationActionProps,
  useServerMutation,
} from '~/hooks/use-server-mutation'
import {
  ZodFirstPartyTypeKind,
  ZodIssue,
  ZodObjectDef,
  ZodRawShape,
  ZodType,
  ZodTypeAny,
} from 'zod'
import { EstadoLabel, ValorBooleanoString } from '~/lib/constantes'

function setNestedValue(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  path: string,
  value: unknown
) {
  let val = value
  if (path === EstadoLabel)
    val = value ? value === ValorBooleanoString.true : undefined
  const keys = path.split('.')
  if (keys.length === 1) {
    obj[path] = val
  } else {
    obj[keys[0]] = {
      connectOrCreate: {
        where: {
          [keys[1]]: `${val}`,
        },
        create: {
          [keys[1]]: `${val}`,
        },
      },
    }
  }
}

function getBaseType(type: ZodTypeAny) {
  // Quita optional y nullable hasta llegar al tipo base
  while (
    type._def.typeName === ZodFirstPartyTypeKind.ZodOptional ||
    type._def.typeName === ZodFirstPartyTypeKind.ZodNullable
  ) {
    type = type._def.innerType
  }
  return type
}

function transformDataXLSXtoPrismaCreate<schemaType>({
  columnas,
  data,
  schema,
  fieldsIgnored = [],
}: {
  columnas: { headerName?: string; field?: string }[]
  data: Record<string, unknown>[]
  schema: ZodType<schemaType>
  fieldsIgnored?: string[]
}) {
  const schemaShape = (schema._def as ZodObjectDef<ZodRawShape>).shape()

  return data.map(row => {
    const newRow = {}
    columnas.forEach(({ headerName, field }) => {
      if (!headerName || !field || fieldsIgnored.includes(field)) return
      const cellValue = row[headerName]

      let finalValue = cellValue
      const schemaField = schemaShape[field]
      if (schemaField) {
        const baseType = getBaseType(schemaField)
        const typeName = baseType._def.typeName

        if (typeName === ZodFirstPartyTypeKind.ZodString && cellValue != null) {
          finalValue = String(cellValue)
        } else if (
          typeName === ZodFirstPartyTypeKind.ZodNumber &&
          cellValue != null
        ) {
          const parsed = Number(cellValue)
          finalValue = isNaN(parsed) ? cellValue : parsed
        }
      }

      setNestedValue(newRow, field, finalValue)
    })
    return newRow
  })
}

interface InputImportProps<TParams, TResult, schemaType>
  extends Omit<UploadProps, 'action'> {
  tableRef: RefObject<AgGridReact | null>
  propsUseServerMutation: UseMutationActionProps<TParams, TResult>
  schema: ZodType<schemaType>
  title?: ReactNode
  preProcessData?: (
    data: Record<string, unknown>[]
  ) => Promise<Record<string, unknown>[]>
  columnasExtra?: { headerName: string; field: string }[]
  fieldsIgnored?: string[]
}

function useInputImport<TParams, TResult>({
  tableRef,
  propsUseServerMutation,
}: {
  tableRef: RefObject<AgGridReact | null>
  propsUseServerMutation: UseMutationActionProps<TParams, TResult>
}) {
  const [loading, setLoading] = useState(false)
  const { notification } = App.useApp()
  const { execute } = useServerMutation({
    ...propsUseServerMutation,
    showNotificationError: false,
    onErrorControled: err => {
      const error = err?.data
      if (!Array.isArray(error))
        return notification.error({
          message: 'Error',
          description: err?.message,
        })
      const errors = error as ZodIssue[]
      const filas = errors.reduce((acc, error) => {
        const fila = error.path[0]
        if (!acc[fila]) acc[fila] = []
        acc[fila].push(error.path[1] as string)
        return acc
      }, {} as Record<string, string[]>)

      const colDefsPrev = tableRef.current?.api.getAllGridColumns() as Column[]
      const columnDefs = colDefsPrev.map(col => ({
        headerName: col.getColDef().headerName,
        field: col.getColDef().field,
      }))

      notification.error({
        message: 'Se encontraron los siguientes errores',
        description: (
          <div className='max-h-[60dvh] overflow-y-auto'>
            {Object.entries(filas).map(([fila, columnas], index) => (
              <div key={index} className='pr-4'>
                <strong>Fila {Number(fila) + 2}:</strong>
                <div className='grid grid-cols-3 gap-x-4 pl-8'>
                  {columnas.map((columna, index) => (
                    <span className='text-red-500 text-nowrap' key={index}>
                      {
                        columnDefs.find(col => col.field === columna)
                          ?.headerName
                      }
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ),
        duration: 0,
      })
    },
  })

  async function handleImport<schemaType>({
    gridApi,
    file,
    schema,
    preProcessData = data => Promise.resolve(data),
    columnasExtra = [],
    fieldsIgnored = [],
  }: {
    gridApi: AgGridReact['api']
    file: File
    schema: ZodType<schemaType>
    preProcessData?: (
      data: Record<string, unknown>[]
    ) => Promise<Record<string, unknown>[]>
    columnasExtra?: { headerName: string; field: string }[]
    fieldsIgnored?: string[]
  }) {
    try {
      setLoading(true)

      const colDefs = gridApi.getAllGridColumns() as Column[]
      const columnas = colDefs.map(col => ({
        headerName: col.getColDef().headerName,
        field: col.getColDef().field,
      }))

      const arrayBuffer = await file.arrayBuffer()
      const wb = read(arrayBuffer, { type: 'array' })

      const ws = wb.Sheets[wb.SheetNames[0]]
      const preData = utils.sheet_to_json(ws) as Record<string, unknown>[]
      const data = await preProcessData(preData)

      const newData = transformDataXLSXtoPrismaCreate({
        columnas: [...columnas, ...columnasExtra],
        data,
        schema,
        fieldsIgnored,
      })
      await execute({ data: newData } as TParams)
    } catch (error) {
      console.error('Error al importar:', error)
      notification.error({
        message: 'Error al importar',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo importar el archivo',
      })
    } finally {
      setLoading(false)
    }
  }

  return { handleImport, loading }
}

export default function InputImport<TParams, TResult, schemaType>({
  tableRef,
  propsUseServerMutation,
  schema,
  title = 'Importar',
  preProcessData = data => Promise.resolve(data),
  columnasExtra = [],
  fieldsIgnored = [],
  ...props
}: InputImportProps<TParams, TResult, schemaType>) {
  const { handleImport, loading } = useInputImport({
    tableRef,
    propsUseServerMutation,
  })
  const { notification } = App.useApp()
  return (
    <Upload
      accept='.xlsx, .xls'
      disabled={loading}
      showUploadList={false}
      maxCount={1}
      beforeUpload={() => false}
      onChange={({ file }) => {
        try {
          const gridApi = tableRef.current?.api
          if (!gridApi)
            throw new Error('No se ha encontrado la tabla de referencia')

          const originFileObj = file as unknown as File
          if (!originFileObj) throw new Error('No hay archivo para importar')

          handleImport({
            gridApi,
            file: originFileObj,
            schema,
            preProcessData,
            columnasExtra,
            fieldsIgnored,
          })
        } catch (error: Error | unknown) {
          notification.error({
            message: 'Error al importar',
            description:
              error instanceof Error ? error.message : 'Error inesperado',
          })
        }
      }}
      {...props}
    >
      <ButtonBase
        disabled={loading}
        className='flex gap-2 items-center'
        color='success'
        size='sm'
      >
        {loading ? (
          <BiLoaderAlt className='animate-spin' />
        ) : (
          <FaCloudUploadAlt />
        )}
        {title}
      </ButtonBase>
    </Upload>
  )
}
