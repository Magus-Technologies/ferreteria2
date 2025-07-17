'use client'

import { AgGridReact } from 'ag-grid-react'
import { Checkbox, Divider } from 'antd'
import { CheckboxProps } from 'antd/lib'
import { RefObject, useEffect, useState } from 'react'
const CheckboxGroup = Checkbox.Group

export default function SelectColumns({
  gridRef,
}: {
  gridRef: RefObject<AgGridReact | null>
}) {
  const gridApi = gridRef?.current?.api
  const plainOptions =
    gridApi?.getAllGridColumns()?.map(col => col.getColDef().headerName!) ?? []

  const [checkedList, setCheckedList] = useState<string[]>(plainOptions)

  const checkAll = plainOptions.length === checkedList.length
  const indeterminate =
    checkedList.length > 0 && checkedList.length < plainOptions.length

  const onChange = (list: string[]) => {
    setCheckedList(list)
  }

  const onCheckAllChange: CheckboxProps['onChange'] = e => {
    setCheckedList(e.target.checked ? plainOptions : [])
  }

  useEffect(() => {
    if (!gridRef.current) return
    const gridColumns = gridApi?.getAllGridColumns() ?? []
    gridApi?.setColumnsVisible(
      gridColumns.filter(col =>
        checkedList.includes(col.getColDef().headerName!)
      ),
      true
    )
    gridApi?.setColumnsVisible(
      gridColumns.filter(
        col => !checkedList.includes(col.getColDef().headerName!)
      ),
      false
    )
  }, [checkedList, gridApi, gridRef])

  return (
    <>
      <Checkbox
        indeterminate={indeterminate}
        onChange={onCheckAllChange}
        checked={checkAll}
        className='font-bold'
      >
        Ver Todo
      </Checkbox>
      <Divider className='!my-2' />
      <CheckboxGroup
        options={plainOptions}
        value={checkedList}
        onChange={onChange}
        style={{ display: 'flex', flexDirection: 'column' }}
      />
    </>
  )
}
