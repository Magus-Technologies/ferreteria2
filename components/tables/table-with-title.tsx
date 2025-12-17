"use client";

import { AgGridReact } from "ag-grid-react";
import TableBase, { TableBaseProps } from "./table-base";
import { useImperativeHandle, useRef } from "react";
import ButtonBase, { ButtonBaseProps } from "../buttons/button-base";
import { exportAGGridDataToJSON, exportAGGridDataToPDF } from "~/utils/ag-grid";
import { RiFileExcel2Fill } from "react-icons/ri";
import { Divider, Popover, Tooltip } from "antd";
import { FaFilePdf } from "react-icons/fa6";
import { PiFilePdfFill } from "react-icons/pi";
import { HiMiniViewColumns } from "react-icons/hi2";
import SelectColumns, {
  SelectColumnsRef,
  setVisibilityColumns,
} from "./select-columns";
import { useLocalStorage } from "~/hooks/use-local-storage";
import { ZodType } from "zod";

export interface TableWithTitleProps<T, schemaType = unknown>
  extends TableBaseProps<T> {
  id: string;
  title: string;
  extraTitle?: React.ReactNode;
  className?: string;
  classNames?: {
    titleParent?: string;
  };
  exportExcel?: boolean;
  exportPdf?: boolean;
  selectColumns?: boolean;
  optionsSelectColumns?: {
    color?: ButtonBaseProps["color"];
    label: string;
    columns: string[];
  }[];
  tableRef?: React.RefObject<AgGridReact<T> | null>;
  schema?: ZodType<schemaType>;
  headersRequired?: string[];
  children?: React.ReactNode;
}

export default function TableWithTitle<T, schemaType = unknown>({
  id,
  title,
  extraTitle,
  exportExcel = true,
  exportPdf = true,
  selectColumns = true,
  classNames = {},
  className = "",
  optionsSelectColumns = [],
  tableRef,
  schema,
  headersRequired = [],
  children,
  ...props
}: TableWithTitleProps<T, schemaType>) {
  const tableRefInterno = useRef<AgGridReact<T>>(null);
  const [defaultColumns, setDefaultColumns] = useLocalStorage<string[]>(
    `table-columns-${id}`,
    []
  );

  useImperativeHandle(tableRef, () => tableRefInterno.current!);

  const selectColumnsRef = useRef<SelectColumnsRef>(null);

  const { titleParent = "" } = classNames;

  return (
    <div className={`flex flex-col gap-1 h-full ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div
          className={`font-semibold text-slate-700 text-base flex items-center gap-2 ${titleParent}`}
        >
          {title}
          {extraTitle}
        </div>
        <div className="flex gap-2 items-center">
          {selectColumns && (
            <Tooltip title="Ver Columnas">
              <Popover
                content={
                  <SelectColumns
                    defaultColumns={defaultColumns}
                    setDefaultColumns={setDefaultColumns}
                    gridRef={tableRefInterno}
                    ref={selectColumnsRef}
                  >
                    <div className="grid gap-2">
                      {optionsSelectColumns.map((option, index) => (
                        <ButtonBase
                          onClick={() => {
                            selectColumnsRef.current?.setCheckedList(
                              option.columns
                            );
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
                    {optionsSelectColumns.length > 0 && (
                      <Divider className="!my-2" />
                    )}
                  </SelectColumns>
                }
                trigger="click"
              >
                <ButtonBase color="warning" size="md" className="!px-3">
                  <HiMiniViewColumns />
                </ButtonBase>
              </Popover>
            </Tooltip>
          )}
          {exportExcel && (
            <Tooltip title="Exportar a Excel">
              <ButtonBase
                onClick={() => {
                  if (tableRefInterno.current)
                    exportAGGridDataToJSON({
                      gridOptions: tableRefInterno.current,
                      nameFile: title,
                      schema,
                      headersRequired,
                    });
                }}
                color="success"
                size="md"
                className="!px-3"
              >
                <RiFileExcel2Fill />
              </ButtonBase>
            </Tooltip>
          )}
          {exportPdf && (
            <>
              <Tooltip title="Exportar a PDF Vertical">
                <ButtonBase
                  onClick={() => {
                    if (tableRefInterno.current)
                      exportAGGridDataToPDF(
                        tableRefInterno.current,
                        title,
                        "vertical"
                      );
                  }}
                  color="danger"
                  size="md"
                  className="!px-3"
                >
                  <FaFilePdf />
                </ButtonBase>
              </Tooltip>
              <Tooltip title="Exportar a PDF Horizontal">
                <ButtonBase
                  onClick={() => {
                    if (tableRefInterno.current)
                      exportAGGridDataToPDF(
                        tableRefInterno.current,
                        title,
                        "horizontal"
                      );
                  }}
                  color="danger"
                  size="md"
                  className="!px-3"
                >
                  <PiFilePdfFill />
                </ButtonBase>
              </Tooltip>
            </>
          )}
        </div>
      </div>
      <TableBase<T>
        ref={tableRefInterno}
        {...props}
        onGridReady={(params) => {
          if (defaultColumns.length) {
            setVisibilityColumns({
              gridApi: params.api,
              checkedList: defaultColumns,
            });
            setTimeout(() => {
              params.api.refreshHeader();
            }, 100);
          }
        }}
      />
      {children}
    </div>
  );
}
