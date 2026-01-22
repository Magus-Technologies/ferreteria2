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
import { RefObject, useMemo, useCallback, useRef, useEffect, useState } from "react";
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
  isVisible?: boolean; // Para saber si el componente es visible (modal abierto)
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
  isVisible,
  ...props
}: TableBaseProps<T>) {
  const { columnTypes } = useColumnTypes();
  const pathname = usePathname();
  const gridApiRef = useRef<GridApi | null>(null);
  const columnStateRef = useRef<any>(null);
  const isApplyingStateRef = useRef(false);
  const hasAppliedInitialStateRef = useRef(false);
  const [isGridReady, setIsGridReady] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMoveSourceRef = useRef<string | null>(null);
  const previousVisibleRef = useRef<boolean | undefined>(undefined);

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
        console.log('🔵 [TableBase] Cargando estado de localStorage:', storageKey, savedState ? 'ENCONTRADO' : 'NO ENCONTRADO');
        if (savedState) {
          columnStateRef.current = JSON.parse(savedState);
          console.log('🔵 [TableBase] Estado cargado:', columnStateRef.current?.map((c: any) => c.colId));
        }
      } catch (error) {
        console.error('Error cargando estado:', error);
      }
    }
  }, [persistColumnState, storageKey]);

  // Guardar estado de columnas con debounce
  const saveColumnState = useCallback(() => {
    if (!persistColumnState || !gridApiRef.current || isApplyingStateRef.current) return;

    // Cancelar el timeout anterior si existe
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Guardar después de 300ms de inactividad
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const state = gridApiRef.current!.getColumnState();
        columnStateRef.current = state;
        localStorage.setItem(storageKey, JSON.stringify(state));
        console.log('🟢 [TableBase] Estado GUARDADO en localStorage:', storageKey, state?.map((c: any) => c.colId));
      } catch (error) {
        console.error('Error guardando estado:', error);
      }
    }, 300);
  }, [persistColumnState, storageKey]);

  // Aplicar estado guardado
  const applyColumnState = useCallback(() => {
    if (!columnStateRef.current || !gridApiRef.current || isApplyingStateRef.current) {
      console.log('🟡 [TableBase] applyColumnState SALTADO:', {
        hasState: !!columnStateRef.current,
        hasApi: !!gridApiRef.current,
        isApplying: isApplyingStateRef.current
      });
      return;
    }

    isApplyingStateRef.current = true;
    console.log('🟣 [TableBase] APLICANDO estado:', columnStateRef.current?.map((c: any) => c.colId));

    try {
      gridApiRef.current.applyColumnState({
        state: columnStateRef.current,
        applyOrder: true
      });
      hasAppliedInitialStateRef.current = true;
      console.log('🟣 [TableBase] Estado APLICADO exitosamente');
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
    console.log('🔶 [TableBase] onGridReady llamado, storageKey:', storageKey);
    gridApiRef.current = event.api;
    hasAppliedInitialStateRef.current = false;
    setIsGridReady(true);
    props.onGridReady?.(event);
  }, [props, storageKey]);

  // Manejar cuando se renderizan los primeros datos
  const onFirstDataRendered = useCallback((event: FirstDataRenderedEvent) => {
    console.log('🔶 [TableBase] onFirstDataRendered llamado:', {
      hasAppliedInitial: hasAppliedInitialStateRef.current,
      hasColumnState: !!columnStateRef.current,
      storageKey
    });
    if (!hasAppliedInitialStateRef.current && columnStateRef.current) {
      setTimeout(() => {
        applyColumnState();
      }, 100);
    }
    props.onFirstDataRendered?.(event);
  }, [applyColumnState, props, storageKey]);

  // Manejar cuando se mueve una columna
  const onColumnMoved = useCallback((event: ColumnMovedEvent) => {
    if (event.finished && !isApplyingStateRef.current) {
      console.log('🟠 [TableBase] Columna MOVIDA, guardando estado...', event.source);
      
      // Solo guardar si es un movimiento real del usuario (uiColumnMoved)
      if (event.source === 'uiColumnMoved') {
        // Cancelar cualquier guardado pendiente
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        
        // Guardar INMEDIATAMENTE sin debounce
        try {
          const state = gridApiRef.current!.getColumnState();
          columnStateRef.current = state;
          localStorage.setItem(storageKey, JSON.stringify(state));
          console.log('🟢 [TableBase] Estado GUARDADO INMEDIATAMENTE en localStorage:', storageKey, state?.map((c: any) => c.colId));
        } catch (error) {
          console.error('Error guardando estado:', error);
        }
      }
    }
    props.onColumnMoved?.(event);
  }, [storageKey, props]);

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

  // Recargar y aplicar estado cuando el componente se vuelve visible (modal se abre)
  useEffect(() => {
    console.log('🔍 [TableBase] useEffect isVisible disparado:', {
      isVisible,
      previousVisible: previousVisibleRef.current,
      persistColumnState,
      isGridReady,
      hasGridApi: !!gridApiRef.current,
      storageKey
    });
    
    // Detectar cuando isVisible cambia de false a true (modal se reabre)
    const wasHidden = previousVisibleRef.current === false;
    const isNowVisible = isVisible === true;
    const isFirstLoad = previousVisibleRef.current === undefined;
    
    // Aplicar en dos casos:
    // 1. Primera carga (isFirstLoad y isVisible es true)
    // 2. Modal se reabre (wasHidden y isNowVisible)
    const shouldApply = (isFirstLoad && isNowVisible) || (wasHidden && isNowVisible);
    
    console.log('🔍 [TableBase] Condiciones:', {
      wasHidden,
      isNowVisible,
      isFirstLoad,
      shouldApply
    });
    
    if (shouldApply && persistColumnState && isGridReady && gridApiRef.current) {
      const action = isFirstLoad ? 'PRIMERA CARGA' : 'REABIERTO';
      console.log(`🔵 [TableBase] Modal ${action}, recargando estado desde localStorage`);
      
      // Recargar estado desde localStorage
      try {
        const savedState = localStorage.getItem(storageKey);
        console.log('🔵 [TableBase] Estado en localStorage:', storageKey, savedState ? 'ENCONTRADO' : 'NO ENCONTRADO');
        if (savedState) {
          columnStateRef.current = JSON.parse(savedState);
          // Aplicar el estado después de que los datos se hayan renderizado
          setTimeout(() => {
            if (gridApiRef.current && columnStateRef.current) {
              isApplyingStateRef.current = true;
              console.log('🟣 [TableBase] Aplicando estado:', columnStateRef.current?.map((c: any) => c.colId));
              gridApiRef.current.applyColumnState({
                state: columnStateRef.current,
                applyOrder: true
              });
              // Forzar refresh del header
              gridApiRef.current.refreshHeader();
              setTimeout(() => {
                isApplyingStateRef.current = false;
              }, 200);
            }
          }, 300);
        }
      } catch (error) {
        console.error('Error recargando estado:', error);
      }
    }
    
    // Actualizar el ref con el valor actual
    previousVisibleRef.current = isVisible || false;
  }, [isVisible, persistColumnState, storageKey, isGridReady]);

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
