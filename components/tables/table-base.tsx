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
import {
  RefObject,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import useColumnTypes from "./hooks/use-column-types";
import { usePathname } from "next/navigation";

ModuleRegistry.registerModules([AllCommunityModule]);

// Generar ID único para cada tabla
let tableIdCounter = 0;
const generateTableId = () => `ag-table-${++tableIdCounter}`;

export interface TableBaseProps<T> extends Omit<
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
    if (pathname) return `ag-grid-state-${pathname.replace(/\//g, "-")}`;
    return `ag-grid-state-${tableId}`;
  }, [tableKey, pathname, tableId]);

  // Función helper para cargar estado desde localStorage
  const loadColumnStateFromStorage = useCallback(() => {
    if (!persistColumnState) return null;
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // console.log(
        //   "🔵 [TableBase] Estado cargado desde localStorage:",
        //   parsed?.map((c: any) => c.colId),
        // );
        return parsed;
      }
    } catch (error) {
      console.error("Error cargando estado:", error);
    }
    return null;
  }, [persistColumnState, storageKey]);

  // CRÍTICO: Estado para las columnas (actualizable cuando isVisible cambia)
  // Usamos useState para que pueda actualizarse dinámicamente
  const [columnStateForRender, setColumnStateForRender] = useState<any>(() =>
    loadColumnStateFromStorage(),
  );

  // Referencia mutable para el estado de columnas (para operaciones internas)
  const columnStateRef = useRef<any>(columnStateForRender);

  // Detectar automáticamente el color del header según la ruta
  const autoHeaderColor =
    headerColor ||
    (() => {
      if (pathname?.includes("facturacion-electronica")) {
        return "var(--color-amber-600)";
      }
      if (pathname?.includes("gestion-comercial-e-inventario")) {
        return "var(--color-emerald-600)";
      }
      if (pathname?.includes("gestion-contable-y-financiera")) {
        return "var(--color-rose-600)";
      }
      return "var(--color-slate-600)";
    })();

  // Mantener columnStateRef sincronizado con columnStateForRender
  useEffect(() => {
    if (columnStateForRender) {
      columnStateRef.current = columnStateForRender;
    }
  }, [columnStateForRender]);

  // Guardar estado de columnas con debounce
  const saveColumnState = useCallback(() => {
    if (
      !persistColumnState ||
      !gridApiRef.current ||
      isApplyingStateRef.current
    )
      return;

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
        // console.log(
        //   "🟢 [TableBase] Estado GUARDADO en localStorage:",
        //   storageKey,
        //   state?.map((c: any) => c.colId),
        // );
      } catch (error) {
        console.error("Error guardando estado:", error);
      }
    }, 300);
  }, [persistColumnState, storageKey]);

  // Aplicar estado guardado
  const applyColumnState = useCallback(() => {
    if (
      !columnStateRef.current ||
      !gridApiRef.current ||
      isApplyingStateRef.current
    ) {
      console.log("🟡 [TableBase] applyColumnState SALTADO:", {
        hasState: !!columnStateRef.current,
        hasApi: !!gridApiRef.current,
        isApplying: isApplyingStateRef.current,
      });
      return;
    }

    isApplyingStateRef.current = true;
    // console.log(
    //   "🟣 [TableBase] APLICANDO estado:",
    //   columnStateRef.current?.map((c: any) => c.colId),
    // );

    try {
      gridApiRef.current.applyColumnState({
        state: columnStateRef.current,
        applyOrder: true,
      });
      hasAppliedInitialStateRef.current = true;
      // console.log("🟣 [TableBase] Estado APLICADO exitosamente");
    } catch (error) {
      console.error("Error aplicando estado:", error);
    } finally {
      setTimeout(() => {
        isApplyingStateRef.current = false;
      }, 100);
    }
  }, []);

  // Manejar cuando la grilla está lista
  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      // console.log(
      //   "🔶 [TableBase] onGridReady llamado, storageKey:",
      //   storageKey,
      // );
      gridApiRef.current = event.api;
      // Si ya aplicamos el estado en los columnDefs (reordenamiento inicial),
      // marcar como aplicado para evitar re-aplicación innecesaria
      hasAppliedInitialStateRef.current = !!columnStateForRender;
      setIsGridReady(true);
      props.onGridReady?.(event);
    },
    [props, storageKey, columnStateForRender],
  );

  // Manejar cuando se renderizan los primeros datos
  const onFirstDataRendered = useCallback(
    (event: FirstDataRenderedEvent) => {
      // console.log("🔶 [TableBase] onFirstDataRendered llamado:", {
      //   hasAppliedInitial: hasAppliedInitialStateRef.current,
      //   hasColumnState: !!columnStateRef.current,
      //   storageKey,
      // });
      if (!hasAppliedInitialStateRef.current && columnStateRef.current) {
        setTimeout(() => {
          applyColumnState();
        }, 100);
      }
      props.onFirstDataRendered?.(event);
    },
    [applyColumnState, props, storageKey],
  );

  // Manejar cuando se mueve una columna
  const onColumnMoved = useCallback(
    (event: ColumnMovedEvent) => {
      if (event.finished && !isApplyingStateRef.current) {
        // console.log(
        //   "🟠 [TableBase] Columna MOVIDA, guardando estado...",
        //   event.source,
        // );

        // Solo guardar si es un movimiento real del usuario (uiColumnMoved)
        if (event.source === "uiColumnMoved") {
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
            // console.log(
            //   "🟢 [TableBase] Estado GUARDADO INMEDIATAMENTE en localStorage:",
            //   storageKey,
            //   state?.map((c: any) => c.colId),
            // );
          } catch (error) {
            console.error("Error guardando estado:", error);
          }
        }
      }
      props.onColumnMoved?.(event);
    },
    [storageKey, props],
  );

  // Manejar cuando se redimensiona una columna
  const onColumnResized = useCallback(
    (event: ColumnResizedEvent) => {
      if (event.finished && !isApplyingStateRef.current) {
        saveColumnState();
      }
      props.onColumnResized?.(event);
    },
    [saveColumnState, props],
  );

  // Manejar cuando se oculta/muestra una columna
  const onColumnVisible = useCallback(
    (event: ColumnVisibleEvent) => {
      if (!isApplyingStateRef.current) {
        saveColumnState();
      }
      props.onColumnVisible?.(event);
    },
    [saveColumnState, props],
  );

  // Referencia para trackear el conteo anterior de filas
  const previousRowCountRef = useRef<number>(0);

  // Aplicar estado cuando cambian los datos SOLO si es un cambio completo (no incremental)
  useEffect(() => {
    if (
      hasAppliedInitialStateRef.current &&
      gridApiRef.current &&
      columnStateRef.current
    ) {
      // Solo reaplicar si realmente hay datos
      if (
        !props.rowData ||
        (Array.isArray(props.rowData) && props.rowData.length === 0)
      ) {
        previousRowCountRef.current = 0;
        return;
      }

      const currentRowCount = Array.isArray(props.rowData)
        ? props.rowData.length
        : 0;
      const previousRowCount = previousRowCountRef.current;

      // Actualizar el conteo
      previousRowCountRef.current = currentRowCount;

      // NO reaplicar estado si solo se agregaron más filas (infinite scroll)
      // Solo reaplicar si los datos se reemplazaron completamente (ej: cambio de filtros)
      if (previousRowCount > 0 && currentRowCount > previousRowCount) {
        // Es una carga incremental (infinite scroll), no reaplicar estado
        // console.log(
        //   "🔵 [TableBase] Carga incremental detectada, manteniendo estado de filtros",
        // );
        return;
      }

      const timeoutId = setTimeout(() => {
        applyColumnState();
      }, 200); // Aumentado a 200ms

      return () => clearTimeout(timeoutId);
    }
  }, [props.rowData, applyColumnState]);

  // Recargar y aplicar estado cuando el componente se vuelve visible (modal se abre/reabre)
  useEffect(() => {
    // Detectar cuando isVisible cambia de false a true (modal se reabre)
    const wasHidden = previousVisibleRef.current === false;
    const isNowVisible = isVisible === true;
    const isReopening = wasHidden && isNowVisible;

    // Actualizar el ref ANTES de procesar para evitar ejecuciones duplicadas
    previousVisibleRef.current = isVisible || false;

    if (isReopening && persistColumnState) {
      // Usar requestAnimationFrame para asegurar que el DOM esté listo
      requestAnimationFrame(() => {
        if (!gridApiRef.current) {
          console.log("🔴 [TableBase] gridApiRef no disponible al reabrir");
          return;
        }

        try {
          const savedState = localStorage.getItem(storageKey);
          if (savedState) {
            const parsedState = JSON.parse(savedState);
            columnStateRef.current = parsedState;

            // También actualizar el estado para consistencia
            setColumnStateForRender(parsedState);

            // Aplicar el estado a AG Grid
            isApplyingStateRef.current = true;
            gridApiRef.current.applyColumnState({
              state: parsedState,
              applyOrder: true,
            });
            gridApiRef.current.refreshHeader();

            console.log(
              "🟣 [TableBase] Estado aplicado al reabrir modal:",
              parsedState?.map((c: any) => c.colId),
            );

            setTimeout(() => {
              isApplyingStateRef.current = false;
            }, 100);
          }
        } catch (error) {
          console.error("Error aplicando estado al reabrir:", error);
        }
      });
    }
  }, [isVisible, persistColumnState, storageKey]);

  // Memoizar columnDefs CON reordenamiento basado en estado guardado
  const memoizedColumnDefs = useMemo<ColDef<T>[]>(() => {
    // Columnas base (incluyendo # si está habilitado)
    const baseColumns: ColDef<T>[] = [
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
              lockPosition: "left" as const,
            },
          ]
        : []),
      ...(columnDefs ?? []),
    ];

    // Si hay estado guardado, reordenar las columnas ANTES del primer render
    if (columnStateForRender && Array.isArray(columnStateForRender)) {
      const orderMap = new Map<string, number>();
      columnStateForRender.forEach((state: any, index: number) => {
        if (state.colId) {
          orderMap.set(state.colId, index);
        }
      });

      // Solo reordenar si tenemos un mapeo válido
      if (orderMap.size > 0) {
        const sortedColumns = [...baseColumns].sort((a, b) => {
          const colIdA = (a as any).colId || (a as any).field || "";
          const colIdB = (b as any).colId || (b as any).field || "";

          const orderA = orderMap.get(colIdA) ?? 999;
          const orderB = orderMap.get(colIdB) ?? 999;

          return orderA - orderB;
        });

        // Aplicar el ancho desde el estado guardado (NO la visibilidad, eso lo maneja SelectColumns)
        sortedColumns.forEach((col) => {
          const colId = (col as any).colId || (col as any).field;
          const savedState = columnStateForRender.find(
            (s: any) => s.colId === colId,
          );
          // NO aplicar hide aquí porque SelectColumns maneja la visibilidad
          if (savedState && savedState.width !== undefined) {
            (col as any).width = savedState.width;
          }
        });

        // console.log(
        //   "🟢 [TableBase] Columnas reordenadas ANTES del render:",
        //   sortedColumns.map((c) => (c as any).colId || (c as any).field),
        // );
        return sortedColumns;
      }
    }

    return baseColumns;
  }, [
    withNumberColumn,
    props.rowDragManaged,
    columnDefs,
    columnStateForRender,
  ]);

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

      ${
        selectionColor === "transparent"
          ? `
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
      `
          : selectionColor !== "border"
            ? `
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
      `
            : `
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
      `
      }
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
          defaultColDef={{
            filter: true, // Habilita filtros para todas las columnas por defecto
            floatingFilter: false, // Desactiva filtros flotantes (opcionales)
            sortable: true, // Habilita ordenamiento
            resizable: true, // Habilita redimensionamiento
            ...props.defaultColDef, // Permite sobrescribir desde props
          }}
          localeText={AG_GRID_LOCALE_ES}
          enableFilterHandlers={true}
          className={`shadow-lg rounded-xl overflow-hidden ${className}`}
          rowSelection={
            rowSelection
              ? {
                  mode: "singleRow",
                  checkboxes: false,
                  enableClickSelection: true,
                }
              : undefined
          }
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
