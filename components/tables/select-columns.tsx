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
  if (!gridApi) return;
  const gridColumns = gridApi.getAllGridColumns() ?? [];
  
  const toHide = gridColumns
    .filter((col) => !checkedList.includes(col.getColDef().headerName!))
    .map((col) => col.getColId());
    
  const toShow = gridColumns
    .filter((col) => checkedList.includes(col.getColDef().headerName!))
    .map((col) => col.getColId());

  if (toHide.length > 0) gridApi.setColumnsVisible(toHide, false);
  if (toShow.length > 0) gridApi.setColumnsVisible(toShow, true);
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
      setVisibilityColumns({ gridApi, checkedList: list });
      setDefaultColumns(list);
    };

    const onCheckAllChange: CheckboxProps["onChange"] = (e) => {
      const list = e.target.checked ? plainOptions : [];
      setCheckedList(list);
      setVisibilityColumns({ gridApi, checkedList: list });
      setDefaultColumns(list);
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

        // If we have visible columns from the grid, use them
        // Otherwise, use saved default columns or all available columns
        const initialColumns =
          visibleColumns.length > 0
            ? visibleColumns
            : defaultColumns.length > 0
              ? defaultColumns.filter((col) => plainOptions.includes(col))
              : plainOptions;

        // Ensure all available columns are shown if no saved state exists
        const columnsToShow = initialColumns.length > 0 ? initialColumns : plainOptions;
        setCheckedList(columnsToShow);
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

    // Sincronización final si checkedList se desfasa, aunque ya manejamos en onChange
    useEffect(() => {
      if (!gridRef.current) return;
      // Ya no forzamos setVisibilityColumns aquí para interacciones (es manejado por onChange)
      // pero sí lo dejamos para la carga inicial o sincronización externa.
      setVisibilityColumns({ gridApi, checkedList });
      setDefaultColumns(checkedList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridApi, gridRef, setDefaultColumns]);

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
                    setVisibilityColumns({ gridApi, checkedList: option.columns });
                    setDefaultColumns(option.columns);
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
