"use client";

import { AgGridReact } from "ag-grid-react";
import TableBase, { TableBaseProps } from "./table-base";
import { useImperativeHandle, useRef, useState } from "react";
import ButtonBase, { ButtonBaseProps } from "../buttons/button-base";
import { exportAGGridDataToJSON, exportAGGridDataToPDF } from "~/utils/ag-grid";
import { RiFileExcel2Fill } from "react-icons/ri";
import { Tooltip, Popover } from "antd";
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
  extends Omit<TableBaseProps<T>, 'selectionColor' | 'headerColor' | 'isVisible'> {
  id: string;
  title: string;
  extraTitle?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
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
  selectionColor?: string; // Color para la fila seleccionada
  headerColor?: string; // Color para el header de la tabla
  isVisible?: boolean; // Para saber si el componente es visible (modal abierto)
  onExportExcel?: () => void | Promise<void>; // Custom Excel export handler
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
  style,
  optionsSelectColumns = [],
  tableRef,
  schema,
  headersRequired = [],
  children,
  selectionColor, // Recibir el color de selección
  headerColor, // Recibir el color del header
  isVisible, // Recibir si es visible
  onExportExcel, // Custom Excel export handler
  ...props
}: TableWithTitleProps<T, schemaType>) {
  const tableRefInterno = useRef<AgGridReact<T>>(null);
  const [defaultColumns, setDefaultColumns] = useLocalStorage<string[]>(
    `table-columns-${id}`,
    []
  );
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  useImperativeHandle(tableRef, () => tableRefInterno.current!);

  const selectColumnsRef = useRef<SelectColumnsRef>(null);

  const { titleParent = "" } = classNames;

  return (
    <div className={`flex flex-col gap-1 h-full ${className}`} style={style}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 min-w-0">
        <div
          className={`font-semibold text-slate-700 text-base min-w-0 max-w-full ${titleParent}`}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
            <span className="whitespace-nowrap">{title}</span>
            {extraTitle}
          </div>
        </div>
        <div className="flex gap-2 items-center flex-shrink-0">
          {selectColumns && (
            <Tooltip title="Ver Columnas">
              <Popover
                open={popoverOpen}
                onOpenChange={setPopoverOpen}
                content={
                  <SelectColumns
                    defaultColumns={defaultColumns}
                    setDefaultColumns={setDefaultColumns}
                    gridRef={tableRefInterno}
                    ref={selectColumnsRef}
                    hideIndividualColumns={false}
                    optionsSelectColumns={optionsSelectColumns}
                    isOpen={popoverOpen}
                    availableColumns={availableColumns}
                  />
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
                  if (onExportExcel) {
                    // Use custom export handler if provided
                    onExportExcel();
                  } else if (tableRefInterno.current) {
                    // Use default export
                    exportAGGridDataToJSON({
                      gridOptions: tableRefInterno.current,
                      nameFile: title,
                      schema,
                      headersRequired,
                    });
                  }
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
        tableKey={id} // Usar el id como tableKey único
        selectionColor={selectionColor} // Pasar el color de selección
        headerColor={headerColor} // Pasar el color del header
        isVisible={isVisible} // Pasar visibilidad
        onGridReady={(params) => {
          // Capturar nombres de columnas disponibles
          const cols = params.api
            .getAllGridColumns()
            ?.map((col) => col.getColDef().headerName)
            .filter(
              (name): name is string =>
                name !== undefined && name !== null && name !== "",
            ) ?? [];
          if (cols.length > 0) {
            setAvailableColumns(cols);
          }

          if (defaultColumns.length) {
            setVisibilityColumns({
              gridApi: params.api,
              checkedList: defaultColumns,
            });
          }
          setTimeout(() => {
            params.api.refreshHeader();
          }, 100);
        }}
      />
      {children}
    </div>
  );
}
