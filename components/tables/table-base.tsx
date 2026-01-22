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
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridReadyEvent,
  FirstDataRenderedEvent,
  ColDef,
  GridApi,
} from "ag-grid-community";
import { RefObject, useMemo, useCallback, useRef, useEffect } from "react";
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
  selectionColor?: string;
  headerColor?: string;
  persistColumnState?: boolean;
  tableKey?: string;
}

export default function TableBase<T>({
  ref,
  paramsOfThemeTable,
  className = "",
  rowSelection = true,
  columnDefs,
  withNumberColumn = true,
  selectionColor = "#005f78",
  headerColor,
  persistColumnState = true,
  tableKey,
  ...props
}: TableBaseProps<T>) {
  const { columnTypes } = useColumnTypes();
  const pathname = usePathname();
  const gridApiRef = useRef<GridApi | null>(null);
  const columnStateRef = useRef<any>(null);
  const isApplyingStateRef = useRef(false);
  const hasAppliedInitialStateRef = useRef(false);
  
  // Generar un ID único para esta instancia de tabla
  const tableId = useMemo(() => generateTableId(), []);

  // Generar clave de localStorage basada en la ruta o tableKey
  const storageKey = useMemo(() => {
    if (tableKey) return `ag-grid-state-${tableKey}`;
    if (pathname) return `ag-grid-state-${pathname.replace(/\//g, '-')}`;
    return `ag-grid-state-${tableId}`;
  }, [tableKey, pathname, tableId]);

  // Detectar automáticamente el color del header según la ruta
  const autoHeaderColor = headerColor || (() => {
    if (pathname?.includes('facturacion-electronica')) {
      return 'var(--color-amber-600)';
    }
    if (pathname?.includes('gestion-comercial-e-inventario')) {
      return 'var(--color-emerald-600)';
    }
    return 'var(--color-slate-600)';
  })();

  // Cargar estado guardado al inicio
  useEffect(() => {
    if (persistColumnState) {
      try {
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          columnStateRef.current = JSON.parse(savedState);
        }
      } catch (error) {
        console.error('Error cargando estado:', error);
      }
    }
  }, [persistColumnState, storageKey]);

  // Guardar estado de columnas
  const saveColumnState = useCallback(() => {
    if (!persistColumnState || !gridApiRef.current || isApplyingStateRef.current) return;
    
    try {
      const state = gridApiRef.current.getColumnState();
      columnStateRef.current = state;
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Error guardando estado:', error);
    }
  }, [persistColumnState, storageKey]);

  // Aplicar estado guardado
  const applyColumnState = useCallback(() => {
    if (!columnStateRef.current || !gridApiRef.current || isApplyingStateRef.current) return;
    
    isApplyingStateRef.current = true;
    
    try {
      gridApiRef.current.applyColumnState({ 
        state: columnStateRef.current, 
        applyOrder: true 
      });
      hasAppliedInitialStateRef.current = true;
    } catch (error) {
      console.error('Error aplicando estado:', error);
    } finally {
      setTimeout(() => {
        isApplyingStateRef.current = false;
      }, 100);
    }
  }, []);

  // Manejar cuando la grilla está lista
  const onGridReady = useCallback((event: GridReadyEvent) => {
    gridApiRef.current = event.api;
    hasAppliedInitialStateRef.current = false;
    props.onGridReady?.(event);
  }, [props]);

  // Manejar cuando se renderizan los primeros datos
  const onFirstDataRendered = useCallback((event: FirstDataRenderedEvent) => {
    if (!hasAppliedInitialStateRef.current && columnStateRef.current) {
      setTimeout(() => {
        applyColumnState();
      }, 100); // Aumentado a 100ms para dar más tiempo
    }
    props.onFirstDataRendered?.(event);
  }, [applyColumnState, props]);

  // Manejar cuando se mueve una columna
  const onColumnMoved = useCallback((event: ColumnMovedEvent) => {
    if (event.finished && !isApplyingStateRef.current) {
      saveColumnState();
    }
    props.onColumnMoved?.(event);
  }, [saveColumnState, props]);

  // Manejar cuando se redimensiona una columna
  const onColumnResized = useCallback((event: ColumnResizedEvent) => {
    if (event.finished && !isApplyingStateRef.current) {
      saveColumnState();
    }
    props.onColumnResized?.(event);
  }, [saveColumnState, props]);

  // Manejar cuando se oculta/muestra una columna
  const onColumnVisible = useCallback((event: ColumnVisibleEvent) => {
    if (!isApplyingStateRef.current) {
      saveColumnState();
    }
    props.onColumnVisible?.(event);
  }, [saveColumnState, props]);

  // Aplicar estado cuando cambian los datos
  useEffect(() => {
    if (hasAppliedInitialStateRef.current && gridApiRef.current && columnStateRef.current) {
      // Solo reaplicar si realmente hay datos
      if (!props.rowData || (Array.isArray(props.rowData) && props.rowData.length === 0)) {
        return;
      }
      
      const timeoutId = setTimeout(() => {
        applyColumnState();
      }, 200); // Aumentado a 200ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [props.rowData, applyColumnState]);

  // Memoizar columnDefs
  const memoizedColumnDefs = useMemo<ColDef<T>[]>(() => [
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
            lockPosition: 'left' as const,
          },
        ]
      : []),
    ...(columnDefs ?? []),
  ], [withNumberColumn, props.rowDragManaged, columnDefs]);

  return (
    <>
      <style>
        {`
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
      
      ${selectionColor === 'transparent' ? `
      /* Cuando selectionColor es 'transparent', eliminar TODOS los colores de selección de AG Grid */
      #${tableId} .ag-row-selected,
      #${tableId} .ag-row.ag-row-selected,
      #${tableId}.ag-theme-quartz .ag-row-selected,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected,
      #${tableId} .ag-row-selected:hover,
      #${tableId} .ag-row.ag-row-selected:hover,
      #${tableId}.ag-theme-quartz .ag-row-selected:hover,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected:hover,
      #${tableId} .ag-row[aria-selected="true"],
      #${tableId}.ag-theme-quartz .ag-row-selected:before,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected:before {
        background: none !important;
        background-color: transparent !important;
      }
      
      #${tableId} .ag-row-selected .ag-cell,
      #${tableId} .ag-row.ag-row-selected .ag-cell,
      #${tableId}.ag-theme-quartz .ag-row-selected .ag-cell,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected .ag-cell,
      #${tableId} .ag-row-selected:hover .ag-cell,
      #${tableId} .ag-row.ag-row-selected:hover .ag-cell,
      #${tableId}.ag-theme-quartz .ag-row-selected:hover .ag-cell,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected:hover .ag-cell,
      #${tableId} .ag-row[aria-selected="true"] .ag-cell {
        background: none !important;
        background-color: transparent !important;
      }
      ` : selectionColor !== 'border' ? `
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
      ` : `
      /* Cuando selectionColor es 'border', no aplicar color de fondo a filas seleccionadas */
      #${tableId} .ag-row-selected,
      #${tableId} .ag-row.ag-row-selected,
      #${tableId}.ag-theme-quartz .ag-row-selected,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected,
      #${tableId} .ag-row-selected:hover,
      #${tableId} .ag-row.ag-row-selected:hover,
      #${tableId}.ag-theme-quartz .ag-row-selected:hover,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected:hover,
      #${tableId} .ag-row[aria-selected="true"] {
        background: none !important;
      }
      
      #${tableId} .ag-row-selected .ag-cell,
      #${tableId} .ag-row.ag-row-selected .ag-cell,
      #${tableId}.ag-theme-quartz .ag-row-selected .ag-cell,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected .ag-cell,
      #${tableId} .ag-row-selected:hover .ag-cell,
      #${tableId} .ag-row.ag-row-selected:hover .ag-cell,
      #${tableId}.ag-theme-quartz .ag-row-selected:hover .ag-cell,
      #${tableId}.ag-theme-quartz .ag-row.ag-row-selected:hover .ag-cell,
      #${tableId} .ag-row[aria-selected="true"] .ag-cell {
        background: none !important;
      }
      `}
    `}
      </style>

      <div id={tableId} className="h-full w-full">
        <AgGridReact<T>
        {...props}
        ref={ref}
        theme={themeTable.withParams({
          ...paramsOfThemeTable,
          headerBackgroundColor: autoHeaderColor,
        })}
        columnTypes={columnTypes}
        localeText={AG_GRID_LOCALE_ES}
        enableFilterHandlers={true}
        className={`shadow-lg rounded-xl overflow-hidden ${className}`}
        rowSelection={rowSelection ? { 
          mode: "singleRow",
          checkboxes: false,
          enableClickSelection: true
        } : undefined}
        pagination={props.pagination ?? false}
        suppressRowVirtualisation={false}
        suppressColumnVirtualisation={false}
        rowBuffer={20}
        debounceVerticalScrollbar={true}
        suppressAnimationFrame={false}
        suppressRowTransform={true}
        rowHeight={props.rowHeight ?? 42}
        suppressScrollOnNewData={true}
        onGridReady={onGridReady}
        onFirstDataRendered={onFirstDataRendered}
        onColumnMoved={onColumnMoved}
        onColumnResized={onColumnResized}
        onColumnVisible={onColumnVisible}
        columnDefs={memoizedColumnDefs}
      />
      </div>
    </>
  );
}
