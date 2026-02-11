"use client";

import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { ValeCompra } from "~/lib/api/vales-compra";
import { Tag } from "antd";
import { FaFilePdf } from "react-icons/fa6";
import ButtonBase from "~/components/buttons/button-base";
import { useStoreModalPdfVale } from "../../_store/store-modal-pdf-vale";

// Cell Renderer para Estado
function CellEstado({ value }: { value: 'ACTIVO' | 'PAUSADO' | 'FINALIZADO' }) {
  const colorMap = {
    ACTIVO: 'green',
    PAUSADO: 'orange',
    FINALIZADO: 'red',
  };

  return (
    <div className="flex items-center justify-center h-full keep-text-color">
      <Tag color={colorMap[value]} className="!m-0">
        {value}
      </Tag>
    </div>
  );
}

// Cell Renderer para Tipo de Promoción
function CellTipoPromocion({ value }: { value: string }) {
  const labelMap: Record<string, string> = {
    SORTEO: 'Sorteo',
    DESCUENTO_MISMA_COMPRA: 'Desc. Misma Compra',
    DESCUENTO_PROXIMA_COMPRA: 'Vale Próxima Compra',
    PRODUCTO_GRATIS: 'Producto Gratis',
  };

  return (
    <div className="flex items-center h-full">
      {labelMap[value] || value}
    </div>
  );
}

// Cell Renderer para Modalidad
function CellModalidad({ value }: { value: string }) {
  const labelMap: Record<string, string> = {
    CANTIDAD_MINIMA: 'Por Cantidad',
    POR_CATEGORIA: 'Por Categoría',
    POR_PRODUCTOS: 'Por Productos',
    MIXTO: 'Mixto',
  };

  return (
    <div className="flex items-center h-full">
      {labelMap[value] || value}
    </div>
  );
}

// Cell Renderer para Descuento
function CellDescuento({ data }: { data: ValeCompra }) {
  if (!data.descuento_valor) return <div className="flex items-center justify-center h-full">-</div>;

  const texto = data.descuento_tipo === 'PORCENTAJE' 
    ? `${data.descuento_valor}%`
    : `S/ ${data.descuento_valor}`;

  return (
    <div className="flex items-center justify-center h-full font-semibold text-green-600 keep-text-color">
      {texto}
    </div>
  );
}

// Cell Renderer para Stock
function CellStock({ data }: { data: ValeCompra }) {
  if (!data.usa_limite_stock) {
    return <div className="flex items-center justify-center h-full">Ilimitado</div>;
  }

  const stock = data.stock_disponible || 0;
  const color = stock > 10 ? 'text-green-600' : stock > 0 ? 'text-orange-600' : 'text-red-600';

  return (
    <div className={`flex items-center justify-center h-full font-semibold ${color} keep-text-color`}>
      {stock}
    </div>
  );
}

// Cell Renderer para Acciones
function CellAcciones({ data }: { data: ValeCompra }) {
  const openModal = useStoreModalPdfVale((state) => state.openModal);

  const handleVerPDF = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se seleccione la fila
    openModal(data.id);
  };

  return (
    <div className="flex items-center justify-center gap-2 h-full">
      <ButtonBase
        color="danger"
        size="md"
        onClick={handleVerPDF}
        className="flex items-center !px-3"
        title="Ver Ticket PDF"
      >
        <FaFilePdf />
      </ButtonBase>
    </div>
  );
}

export function useColumnsValesCompra(): ColDef<ValeCompra>[] {
  return [
    {
      headerName: "Código",
      field: "codigo",
      width: 110,
      pinned: 'left',
    },
    {
      headerName: "Nombre",
      field: "nombre",
      flex: 1,
      minWidth: 250,
    },
    {
      headerName: "Tipo",
      field: "tipo_promocion",
      width: 180,
      cellRenderer: CellTipoPromocion,
    },
    {
      headerName: "Modalidad",
      field: "modalidad",
      width: 140,
      cellRenderer: CellModalidad,
    },
    {
      headerName: "Cant. Mín.",
      field: "cantidad_minima",
      width: 110,
      valueFormatter: (params) => params.value ? `${params.value}` : '-',
      cellStyle: { textAlign: 'center' },
    },
    {
      headerName: "Descuento",
      width: 120,
      cellRenderer: CellDescuento,
      cellRendererParams: (params: any) => ({ data: params.data }),
    },
    {
      headerName: "Stock",
      width: 100,
      cellRenderer: CellStock,
      cellRendererParams: (params: any) => ({ data: params.data }),
    },
    {
      headerName: "Fecha Inicio",
      field: "fecha_inicio",
      width: 120,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
    },
    {
      headerName: "Fecha Fin",
      field: "fecha_fin",
      width: 120,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "Sin límite",
    },
    {
      headerName: "Estado",
      field: "estado",
      width: 120,
      cellRenderer: CellEstado,
    },
    {
      headerName: "Creado",
      field: "created_at",
      width: 160,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY HH:mm") : "",
    },
    {
      headerName: "Acciones",
      width: 100,
      pinned: 'right',
      cellRenderer: CellAcciones,
      cellRendererParams: (params: any) => ({ data: params.data }),
      sortable: false,
      filter: false,
    },
  ];
}
