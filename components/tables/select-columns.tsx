"use client";

import { AgGridReact } from "ag-grid-react";
import { Checkbox, Divider } from "antd";
import { CheckboxProps } from "antd/lib";
import { GridApi } from "ag-grid-community";
import ButtonBase, { ButtonBaseProps } from "../buttons/button-base";
import {
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useImperativeHandle,
  useState,
  forwardRef,
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
  hideIndividualColumns?: boolean;
  optionsSelectColumns?: {
    color?: ButtonBaseProps["color"];
    label: string;
    columns: string[];
  }[];
  isOpen?: boolean;
  availableColumns?: string[]; // Columnas pasadas desde onGridReady
}

const SelectColumns = forwardRef<SelectColumnsRef, SelectColumnsProps>(
  function SelectColumns(
    {
      defaultColumns,
      setDefaultColumns,
      gridRef,
      children,
      hideIndividualColumns = false,
      optionsSelectColumns = [],
      isOpen = false,
      availableColumns = [],
    },
    ref
  ) {
  const gridApi = gridRef?.current?.api;

  const plainOptions = availableColumns;

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
      const visibleColumns =
        gridApi
          ?.getAllGridColumns()
          ?.filter((col) => col.isVisible())
          ?.map((col) => col.getColDef().headerName)
          ?.filter(
            (name): name is string =>
              name !== undefined && name !== null && name !== "",
          ) ?? [];

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

  // Re-inicializar cuando el popover se abre (para reflejar visibilidad actual)
  useEffect(() => {
    if (isOpen && plainOptions.length > 0) {
      const visibleColumns =
        gridApi
          ?.getAllGridColumns()
          ?.filter((col) => col.isVisible())
          ?.map((col) => col.getColDef().headerName)
          ?.filter(
            (name): name is string =>
              name !== undefined && name !== null && name !== "",
          ) ?? [];
      if (visibleColumns.length > 0) {
        setCheckedList(visibleColumns);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
      {optionsSelectColumns.length > 0 && (
        <>
          <div className="grid gap-2">
            {optionsSelectColumns.map((option, index) => (
              <ButtonBase
                onClick={() => {
                  setCheckedList(option.columns);
                }}
                color={option.color ?? "info"}
                size="sm"
                className="!px-3 w-full"
                key={index}
              >
                {option.label}
              </ButtonBase>
            ))}
          </div>
          <Divider className="!my-2" />
        </>
      )}
      {!hideIndividualColumns && (
        <>
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
      )}
    </>
  );
});

export default SelectColumns;
