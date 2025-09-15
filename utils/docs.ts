import { ColDef } from 'ag-grid-community'

export function getCellValue<T>(
  colDef: ColDef<T>,
  item: T
): string | number | undefined {
  if (!colDef.field) return undefined

  const value = getNestedValue(item, String(colDef.field))

  if (colDef.valueFormatter && typeof colDef.valueFormatter === 'function') {
    // `valueFormatter` espera un objeto con `value` y `data`
    return colDef.valueFormatter({
      value,
      data: item,
    } as Parameters<NonNullable<typeof colDef.valueFormatter>>[0]) as
      | string
      | number
      | undefined
  }

  return value as string | number | undefined
}

function getNestedValue<T, P extends string>(obj: T, path: P): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj as unknown)
}
