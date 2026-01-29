"use client";

import { AgGridReact } from "ag-grid-react";
import { Checkbox, Divider } from "antd";
import { CheckboxProps } from "antd/lib";
import { GridApi } from "ag-grid-community";
import {
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
const CheckboxGroup = Checkbox.Group;

export function setVisibilityColumns({
  gridApi,
  checkedList,
}: {
  gridApi?: GridApi;
  checkedList: string[];
}) {
  const gridColumns = gridApi?.getAllGridColumns() ?? [];
  gridApi?.setColumnsVisible(
    gridColumns.filter((col) => {
      return !checkedList.includes(col.getColDef().headerName!);
    }),
    false,
  );
  gridApi?.setColumnsVisible(
    gridColumns.filter((col) =>
      checkedList.includes(col.getColDef().headerName!),
    ),
    true,
  );
}

export interface SelectColumnsRef {
  setCheckedList: Dispatch<SetStateAction<string[]>>;
}

interface SelectColumnsProps {
  defaultColumns: string[];
  setDefaultColumns: (
    value: string[] | ((value: string[]) => string[]),
  ) => void;
  gridRef: RefObject<AgGridReact | null>;
  children?: React.ReactNode;
  ref?: React.RefObject<SelectColumnsRef | null>;
}

export default function SelectColumns({
  defaultColumns,
  setDefaultColumns,
  gridRef,
  children,
  ref,
}: SelectColumnsProps) {
  const gridApi = gridRef?.current?.api;

  // Filtrar valores undefined o null de las columnas
  const plainOptions =
    gridApi
      ?.getAllGridColumns()
      ?.map((col) => col.getColDef().headerName)
      .filter(
        (name): name is string =>
          name !== undefined && name !== null && name !== "",
      ) ?? [];

  const [checkedList, setCheckedList] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkAll =
    plainOptions.length > 0 && plainOptions.length === checkedList.length;
  const indeterminate =
    checkedList.length > 0 && checkedList.length < plainOptions.length;

  const onChange = (list: string[]) => {
    setCheckedList(list);
  };

  const onCheckAllChange: CheckboxProps["onChange"] = (e) => {
    setCheckedList(e.target.checked ? plainOptions : []);
  };

  useImperativeHandle(ref, () => ({
    setCheckedList,
  }));

  // Inicializar checkedList cuando plainOptions esté disponible
  useEffect(() => {
    if (plainOptions.length > 0 && !isInitialized) {
      // Obtener el estado REAL de visibilidad desde AG Grid
      const visibleColumns =
        gridApi
          ?.getAllGridColumns()
          ?.filter((col) => col.isVisible())
          ?.map((col) => col.getColDef().headerName)
          ?.filter(
            (name): name is string =>
              name !== undefined && name !== null && name !== "",
          ) ?? [];

      // Si hay columnas visibles según AG Grid, usar esas
      // Si no, usar defaultColumns o todas las columnas
      const initialColumns =
        visibleColumns.length > 0
          ? visibleColumns
          : defaultColumns.length > 0
            ? defaultColumns.filter((col) => plainOptions.includes(col))
            : plainOptions;

      setCheckedList(initialColumns.length > 0 ? initialColumns : plainOptions);
      setIsInitialized(true);
    }
  }, [plainOptions.length, isInitialized, defaultColumns, gridApi]);

  // Aplicar visibilidad de columnas cuando cambia checkedList
  useEffect(() => {
    if (!gridRef.current) return;
    if (checkedList.length === 0) return;

    setVisibilityColumns({ gridApi, checkedList });
    setDefaultColumns(checkedList);
  }, [checkedList, gridApi, gridRef, setDefaultColumns]);

  return (
    <>
      {children}
      <Checkbox
        indeterminate={indeterminate}
        onChange={onCheckAllChange}
        checked={checkAll}
        className="font-bold"
      >
        Ver Todo
      </Checkbox>
      <Divider className="!my-2" />
      {plainOptions.length > 0 && (
        <CheckboxGroup
          options={plainOptions}
          value={checkedList.filter((col) => plainOptions.includes(col))}
          onChange={onChange}
          style={{ display: "flex", flexDirection: "column" }}
        />
      )}
    </>
  );
}
