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
import { RefObject, useMemo } from "react";
import useColumnTypes from "./hooks/use-column-types";
import { usePathname } from "next/navigation";

ModuleRegistry.registerModules([AllCommunityModule]);

// Generar ID único para cada tabla
let tableIdCounter = 0;
const generateTableId = () => `ag-table-${++tableIdCounter}`;

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
  selectionColor?: string; // Color para la fila seleccionada
  headerColor?: string; // Color para el header de la tabla
}

export default function TableBase<T>({
  ref,
  paramsOfThemeTable,
  className = "",
  rowSelection = true, // Volver a true para que funcione el resaltado
  columnDefs,
  withNumberColumn = true,
  selectionColor = "#005f78", // Color por defecto (azul)
  headerColor, // Color del header (opcional)
  ...props
}: TableBaseProps<T>) {
  const { columnTypes } = useColumnTypes();
  const pathname = usePathname();
  
  // Generar un ID único para esta instancia de tabla
  const tableId = useMemo(() => generateTableId(), []);

  // Detectar automáticamente el color del header según la ruta
  const autoHeaderColor = headerColor || (() => {
    if (pathname?.includes('facturacion-electronica')) {
      return 'var(--color-amber-600)'; // Naranja/ámbar para facturación
    }
    if (pathname?.includes('gestion-comercial-e-inventario')) {
      return 'var(--color-emerald-600)'; // Verde esmeralda para gestión comercial
    }
    return 'var(--color-slate-600)'; // Gris por defecto
  })();

  return (
    <>
      <style>
        {`
      /* Estilos específicos para esta tabla usando su ID único */
      #${tableId} .ag-selection-checkbox,
      #${tableId} .ag-checkbox,
      #${tableId} .ag-checkbox-input-wrapper,
      #${tableId} .ag-cell[col-id="ag-Grid-AutoColumn"] {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        opacity: 0 !important;
      }
      
      #${tableId} .ag-header-cell[col-id="ag-Grid-AutoColumn"],
      #${tableId} .ag-cell[col-id="ag-Grid-AutoColumn"] {
        display: none !important;
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
      }
      
      #${tableId} .ag-cell-focus,
      #${tableId} .ag-cell-focus:focus,
      #${tableId} .ag-cell:focus,
      #${tableId} .ag-cell:focus-within {
        border: none !important;
        outline: none !important;
      }
      
      /* Estilos para fila seleccionada - ESPECÍFICOS PARA ESTA TABLA */
      #${tableId} .ag-row-selected,
      #${tableId} .ag-row.ag-row-selected,
      #${tableId}.ag-theme-quartz .ag-row-selected,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected {
        background-color: ${selectionColor} !important;
      }
      
      #${tableId} .ag-row-selected .ag-cell,
      #${tableId} .ag-row.ag-row-selected .ag-cell,
      #${tableId}.ag-theme-quartz .ag-row-selected .ag-cell,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected .ag-cell {
        background-color: ${selectionColor} !important;
      }
      
      #${tableId} .ag-row-selected:hover,
      #${tableId} .ag-row.ag-row-selected:hover,
      #${tableId}.ag-theme-quartz .ag-row-selected:hover,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected:hover {
        background-color: ${selectionColor} !important;
      }
      
      #${tableId} .ag-row-selected:hover .ag-cell,
      #${tableId} .ag-row.ag-row-selected:hover .ag-cell,
      #${tableId}.ag-theme-quartz .ag-row-selected:hover .ag-cell,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected:hover .ag-cell {
        background-color: ${selectionColor} !important;
      }
      
      #${tableId} .ag-row[aria-selected="true"],
      #${tableId} .ag-row[aria-selected="true"] .ag-cell {
        background-color: ${selectionColor} !important;
      }
    `}
      </style>

      <div id={tableId} className="h-full w-full">
        <AgGridReact<T>
        {...props}
        ref={ref}
        theme={themeTable.withParams({
          ...paramsOfThemeTable,
          headerBackgroundColor: autoHeaderColor, // Usar el color detectado automáticamente
        })}
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
      </div>
    </>
  );
}
