"use client";

import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { formatFechaPeru } from "~/utils/fechas";
import { ValeCompra, cambiarEstadoVale, valesCompraKeys } from "~/lib/api/vales-compra";
import { Tag, Tooltip, Popconfirm, message } from "antd";
import { FaFilePdf, FaPause, FaPlay, FaStop, FaEdit } from "react-icons/fa";
import ButtonBase from "~/components/buttons/button-base";
import { useStoreModalPdfVale } from "../../_store/store-modal-pdf-vale";
import { useRouter } from 'next/navigation';
import { useQueryClient } from "@tanstack/react-query";

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
    DOS_POR_UNO: '2x1 (Mismo Prod.)',
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

// Cell Renderer para usos disponibles (antes "Stock")
function CellStock({ data }: { data: ValeCompra }) {
  if (!data.usa_limite_stock) {
    return <div className="flex items-center justify-center h-full">Ilimitado</div>;
  }

  const usos = data.stock_disponible || 0;
  const color = usos > 10 ? 'text-green-600' : usos > 0 ? 'text-orange-600' : 'text-red-600';

  return (
    <div className={`flex items-center justify-center h-full font-semibold ${color} keep-text-color`}>
      {usos} usos
    </div>
  );
}

// Cell Renderer para Acciones
function CellAcciones({ data }: { data: ValeCompra }) {
  const openModal = useStoreModalPdfVale((state) => state.openModal);
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleVerPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal(data.id);
  };

  const handleEditar = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/ui/facturacion-electronica/vales-compra/editar-vale/${data.id}`);
  };

  const handleCambiarEstado = async (nuevoEstado: 'ACTIVO' | 'PAUSADO' | 'FINALIZADO') => {
    try {
      const res = await cambiarEstadoVale(data.id, { estado: nuevoEstado });
      if (res.error) {
        message.error(res.error.message || 'Error al cambiar estado');
        return;
      }
      message.success(`Vale ${nuevoEstado.toLowerCase()} correctamente`);
      queryClient.invalidateQueries({ queryKey: valesCompraKeys.lists() });
    } catch {
      message.error('Error al cambiar estado');
    }
  };

  return (
    <div className="flex items-center justify-center gap-1 h-full">
      <Tooltip title="Ver Ticket">
        <ButtonBase
          color="danger"
          size="sm"
          onClick={handleVerPDF}
          className="!px-2"
        >
          <FaFilePdf size={12} />
        </ButtonBase>
      </Tooltip>

      <Tooltip title="Editar">
        <ButtonBase
          color="info"
          size="sm"
          onClick={handleEditar}
          className="!px-2"
        >
          <FaEdit size={12} />
        </ButtonBase>
      </Tooltip>

      {data.estado === 'ACTIVO' && (
        <Tooltip title="Pausar">
          <Popconfirm
            title="¿Pausar este vale?"
            onConfirm={() => handleCambiarEstado('PAUSADO')}
            okText="Sí"
            cancelText="No"
          >
            <ButtonBase
              color="warning"
              size="sm"
              className="!px-2"
              onClick={(e) => e.stopPropagation()}
            >
              <FaPause size={12} />
            </ButtonBase>
          </Popconfirm>
        </Tooltip>
      )}

      {data.estado === 'PAUSADO' && (
        <Tooltip title="Activar">
          <Popconfirm
            title="¿Activar este vale?"
            onConfirm={() => handleCambiarEstado('ACTIVO')}
            okText="Sí"
            cancelText="No"
          >
            <ButtonBase
              color="success"
              size="sm"
              className="!px-2"
              onClick={(e) => e.stopPropagation()}
            >
              <FaPlay size={12} />
            </ButtonBase>
          </Popconfirm>
        </Tooltip>
      )}

      {data.estado !== 'FINALIZADO' && (
        <Tooltip title="Finalizar">
          <Popconfirm
            title="¿Finalizar este vale? Esta acción no se puede deshacer."
            onConfirm={() => handleCambiarEstado('FINALIZADO')}
            okText="Sí, finalizar"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <ButtonBase
              color="danger"
              size="sm"
              className="!px-2"
              onClick={(e) => e.stopPropagation()}
            >
              <FaStop size={12} />
            </ButtonBase>
          </Popconfirm>
        </Tooltip>
      )}
    </div>
  );
}

export function useColumnsValesCompra(): ColDef<ValeCompra>[] {
  return [
    {
      colId: 'codigo',
      headerName: "Código",
      field: "codigo",
      width: 110,
      pinned: 'left',
    },
    {
      colId: 'nombre',
      headerName: "Nombre",
      field: "nombre",
      flex: 1,
      minWidth: 250,
    },
    {
      colId: 'tipo',
      headerName: "Tipo",
      field: "tipo_promocion",
      width: 180,
      cellRenderer: CellTipoPromocion,
    },
    {
      colId: 'modalidad',
      headerName: "Modalidad",
      field: "modalidad",
      width: 140,
      cellRenderer: CellModalidad,
    },
    {
      colId: 'cantidad_minima',
      headerName: "Mínimo",
      headerTooltip: "Umbral mínimo para activar el vale: en unidades (Producto Gratis, Por Productos o Mixto) o en soles (resto de casos).",
      field: "cantidad_minima",
      width: 110,
      valueFormatter: (params) => {
        if (!params.value) return '-'
        const data = params.data as any
        // PRODUCTO_GRATIS / DOS_POR_UNO siempre por unidades; si no, respetar tipo_umbral;
        // y para vales viejos sin tipo_umbral, inferir por modalidad.
        const esUnidad =
          data?.tipo_promocion === 'PRODUCTO_GRATIS' ||
          data?.tipo_promocion === 'DOS_POR_UNO' ||
          (data?.tipo_umbral
            ? data.tipo_umbral === 'CANTIDAD'
            : data?.modalidad === 'POR_PRODUCTOS' || data?.modalidad === 'MIXTO')
        return esUnidad ? `${Number(params.value)} und.` : `S/ ${Number(params.value).toFixed(2)}`
      },
      cellStyle: { textAlign: 'center' },
    },
    {
      colId: 'descuento',
      headerName: "Descuento",
      width: 120,
      cellRenderer: CellDescuento,
      cellRendererParams: (params: any) => ({ data: params.data }),
    },
    {
      colId: 'stock',
      headerName: "Usos disp.",
      width: 100,
      cellRenderer: CellStock,
      cellRendererParams: (params: any) => ({ data: params.data }),
    },
    {
      colId: 'fecha_inicio',
      headerName: "Fecha Inicio",
      field: "fecha_inicio",
      width: 120,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
    },
    {
      colId: 'fecha_fin',
      headerName: "Fecha Fin",
      field: "fecha_fin",
      width: 120,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "Sin límite",
    },
    {
      colId: 'estado',
      headerName: "Estado",
      field: "estado",
      width: 120,
      cellRenderer: CellEstado,
    },
    {
      colId: 'created_at',
      headerName: "Creado",
      field: "created_at",
      width: 160,
      valueFormatter: (params) =>
        params.value ? formatFechaPeru(params.value, "DD/MM/YYYY hh:mm:ss A") : "",
    },
    {
      colId: 'acciones',
      headerName: "Acciones",
      width: 150,
      pinned: 'right',
      cellRenderer: CellAcciones,
      cellRendererParams: (params: any) => ({ data: params.data }),
      sortable: false,
      filter: false,
    },
  ];
}
