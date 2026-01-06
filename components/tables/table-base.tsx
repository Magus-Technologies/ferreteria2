"use client";

import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import { themeTable } from "./table-theme";
import { AG_GRID_LOCALE_ES } from "~/lib/ag-grid-es";
import {
  AllCommunityModule,
  ButtonStyleParams,
  CheckboxStyleParams,
  CoreParams,
  InputStyleParams,
  ModuleRegistry,
  TabStyleParams,
  ValueGetterParams,
} from "ag-grid-community";
import { RefObject } from "react";
import useColumnTypes from "./hooks/use-column-types";

ModuleRegistry.registerModules([AllCommunityModule]);

export interface TableBaseProps<T>
  extends Omit<
    AgGridReactProps<T>,
    | "theme"
    | "columnTypes"
    | "localeText"
    | "enableFilterHandlers"
    | "rowSelection"
    | "children"
  > {
  ref?: RefObject<AgGridReact<T> | null>;
  paramsOfThemeTable?: Partial<
    CoreParams &
      ButtonStyleParams &
      CheckboxStyleParams &
      TabStyleParams &
      InputStyleParams
  >;
  rowSelection?: boolean;
  withNumberColumn?: boolean;
}

export default function TableBase<T>({
  ref,
  paramsOfThemeTable,
  className = "",
  rowSelection = true, // Volver a true para que funcione el resaltado
  columnDefs,
  withNumberColumn = true,
  ...props
}: TableBaseProps<T>) {
  const { columnTypes } = useColumnTypes();

  return (
    <>
      <style>
        {`
      /* Ocultar completamente los checkboxes de selección */
      .ag-selection-checkbox,
      .ag-checkbox,
      .ag-checkbox-input-wrapper,
      .ag-cell[col-id="ag-Grid-AutoColumn"] {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        opacity: 0 !important;
      }
      
      /* Ocultar la columna de selección completa */
      .ag-header-cell[col-id="ag-Grid-AutoColumn"],
      .ag-cell[col-id="ag-Grid-AutoColumn"] {
        display: none !important;
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
      }
      
      /* Estilos para fila seleccionada */
      .ag-row-selected {
        background-color: #005f78 !important;
      }
      .ag-row-selected .ag-cell {
        color: white !important;
        font-weight: 700;
        background-color: #005f78 !important;
      }
      .ag-row-selected:hover {
        background-color: #005f78 !important;
      }
      .ag-row-selected:hover .ag-cell {
        background-color: #005f78 !important;
      }
    `}
      </style>

      <AgGridReact<T>
        {...props}
        ref={ref}
        theme={themeTable.withParams(paramsOfThemeTable ?? {})}
        columnTypes={columnTypes}
        localeText={AG_GRID_LOCALE_ES}
        enableFilterHandlers={true}
        className={`shadow-lg rounded-xl overflow-hidden ${className}`}
        rowSelection={rowSelection ? { 
          mode: "singleRow",
          checkboxes: false, // Ocultar checkboxes
          enableClickSelection: true // Permitir selección con click
        } : undefined}
        // Scroll infinito sin paginación (desactivada por defecto)
        pagination={props.pagination ?? false}
        // Si necesitas paginación en alguna tabla específica, pasa: pagination={true}
        // paginationPageSize={props.paginationPageSize ?? 50}
        // paginationPageSizeSelector={props.paginationPageSizeSelector ?? [25, 50, 100, 200]}
        // paginationAutoPageSize={false}
        // Optimizaciones de rendimiento para scroll infinito
        suppressRowVirtualisation={false}
        suppressColumnVirtualisation={false}
        rowBuffer={20}
        debounceVerticalScrollbar={true}
        suppressAnimationFrame={false}
        suppressRowTransform={true}
        // Altura de fila optimizada para mejor rendimiento
        rowHeight={props.rowHeight ?? 42}
        // Mejora el scroll suave
        suppressScrollOnNewData={true}
        columnDefs={[
          ...(withNumberColumn
            ? [
                {
                  headerName: "#",
                  colId: "#",
                  width: props.rowDragManaged ? 65 : 50,
                  valueGetter: (params: ValueGetterParams<T>) =>
                    (params.node?.rowIndex ?? 0) + 1,
                  type: "numberColumn",
                  rowDrag: props.rowDragManaged,
                  suppressNavigable: true,
                },
              ]
            : []),
          ...(columnDefs ?? []),
        ]}
      />
    </>
  );
}
