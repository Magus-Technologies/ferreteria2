"use client";

import { Card, Badge, Button, DatePicker, Select, Input, Table } from "antd";
import {
  FaSearch,
  FaFilter,
  FaCalendar,
  FaFilePdf,
  FaEye,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { FaCartShopping, FaTruckFast } from "react-icons/fa6";
import type { UIComponent } from "~/lib/ui-permissions-metadata";
import { useState } from "react";

interface VistaSimuladaMisVentasProps {
  permisosActivos: Set<string>;
  onTogglePermiso: (permiso: string) => void;
  componentes: UIComponent[];
}

/**
 * Componente que simula la vista de "Mis Ventas" con overlays clickeables
 * para configurar permisos visualmente
 */
export default function VistaSimuladaMisVentas({
  permisosActivos,
  onTogglePermiso,
  componentes,
}: VistaSimuladaMisVentasProps) {
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  // Helper para obtener componente por ID
  const getComponente = (id: string) => componentes.find((c) => c.id === id);

  // Helper para verificar si un permiso está activo
  const isActive = (componentId: string) => {
    const comp = getComponente(componentId);
    return comp ? permisosActivos.has(comp.permiso) : false;
  };

  // Helper para renderizar overlay clickeable
  const ClickableOverlay = ({
    componentId,
    children,
    className = "",
  }: {
    componentId: string;
    children: React.ReactNode;
    className?: string;
  }) => {
    const comp = getComponente(componentId);
    if (!comp) return <>{children}</>;

    const active = isActive(componentId);
    const isHovered = hoveredComponent === componentId;

    return (
      <div
        className={`relative cursor-pointer transition-all ${className}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTogglePermiso(comp.permiso);
        }}
        onMouseEnter={() => setHoveredComponent(componentId)}
        onMouseLeave={() => setHoveredComponent(null)}
      >
        {/* Contenido original */}
        <div className={`${!active ? "opacity-30 grayscale" : ""}`}>
          {children}
        </div>

        {/* Overlay de hover */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none border-2 border-blue-500 rounded bg-blue-500/10 z-10">
            <div className="absolute -top-8 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {comp.label} {active ? "✓" : "✗"}
            </div>
          </div>
        )}

        {/* Badge de estado */}
        {!isHovered && (
          <div
            className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 border-white ${active ? "bg-green-500" : "bg-red-500"} z-10`}
          >
            {active ? (
              <span className="text-white text-xs flex items-center justify-center">
                ✓
              </span>
            ) : (
              <span className="text-white text-xs flex items-center justify-center">
                ✗
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Datos simulados para la tabla
  const dataSource = [
    {
      key: "1",
      serie: "F001",
      numero: "00001234",
      fecha: "2024-01-15",
      cliente: "Juan Pérez",
      total: "S/ 1,250.00",
      estado: "Pagado",
      tipo: "Factura",
    },
    {
      key: "2",
      serie: "B001",
      numero: "00005678",
      fecha: "2024-01-15",
      cliente: "María García",
      total: "S/ 850.50",
      estado: "Pendiente",
      tipo: "Boleta",
    },
  ];

  // Columnas simuladas de la tabla
  const columns = [
    {
      title: (
        <ClickableOverlay componentId="column-serie-numero">
          <span>Serie-Número</span>
        </ClickableOverlay>
      ),
      dataIndex: "serie",
      key: "serie",
      render: (_: any, record: any) => (
        <span className={!isActive("column-serie-numero") ? "opacity-30" : ""}>
          {record.serie}-{record.numero}
        </span>
      ),
    },
    {
      title: (
        <ClickableOverlay componentId="column-fecha">
          <span>Fecha</span>
        </ClickableOverlay>
      ),
      dataIndex: "fecha",
      key: "fecha",
      render: (text: string) => (
        <span className={!isActive("column-fecha") ? "opacity-30" : ""}>
          {text}
        </span>
      ),
    },
    {
      title: (
        <ClickableOverlay componentId="column-cliente">
          <span>Cliente</span>
        </ClickableOverlay>
      ),
      dataIndex: "cliente",
      key: "cliente",
      render: (text: string) => (
        <span className={!isActive("column-cliente") ? "opacity-30" : ""}>
          {text}
        </span>
      ),
    },
    {
      title: (
        <ClickableOverlay componentId="column-tipo-documento">
          <span>Tipo Doc.</span>
        </ClickableOverlay>
      ),
      dataIndex: "tipo",
      key: "tipo",
      render: (text: string) => (
        <span
          className={!isActive("column-tipo-documento") ? "opacity-30" : ""}
        >
          {text}
        </span>
      ),
    },
    {
      title: (
        <ClickableOverlay componentId="column-total">
          <span>Total</span>
        </ClickableOverlay>
      ),
      dataIndex: "total",
      key: "total",
      render: (text: string) => (
        <span className={!isActive("column-total") ? "opacity-30" : ""}>
          {text}
        </span>
      ),
    },
    {
      title: (
        <ClickableOverlay componentId="column-estado">
          <span>Estado</span>
        </ClickableOverlay>
      ),
      dataIndex: "estado",
      key: "estado",
      render: (text: string) => (
        <Badge
          status={text === "Pagado" ? "success" : "warning"}
          text={
            <span className={!isActive("column-estado") ? "opacity-30" : ""}>
              {text}
            </span>
          }
        />
      ),
    },
    {
      title: (
        <ClickableOverlay componentId="column-acciones">
          <span>Acciones</span>
        </ClickableOverlay>
      ),
      key: "acciones",
      render: () => (
        <div className="flex gap-1">
          <ClickableOverlay componentId="button-ver-pdf">
            <Button size="small" icon={<FaFilePdf />} type="primary" />
          </ClickableOverlay>
          <ClickableOverlay componentId="button-entregar">
            <Button size="small" icon={<FaTruckFast />} />
          </ClickableOverlay>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Información de ayuda */}
      <Card size="small" className="bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <FaEye className="text-blue-600" />
          <span>
            <strong>Haz clic</strong> sobre cualquier elemento (botones, campos,
            columnas) para activar/desactivar su permiso. Los elementos{" "}
            <span className="text-green-600 font-semibold">verdes ✓</span> están
            activos, los{" "}
            <span className="text-red-600 font-semibold">rojos ✗</span> están
            inactivos.
          </span>
        </div>
      </Card>

      {/* Header - Título */}
      <Card size="small" className="shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaCartShopping className="text-amber-600 text-2xl" />
            <h2 className="text-xl font-bold text-gray-800">Mis Ventas</h2>
          </div>
          <div className="flex items-center gap-2">
            <Select
              placeholder="Almacén Principal"
              style={{ width: 200 }}
              disabled
            />
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <Card size="small" className="shadow">
        <div className="grid grid-cols-12 gap-3">
          {/* Fila 1 */}
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Fecha Venta:
            </label>
            <ClickableOverlay componentId="field-fecha-desde">
              <DatePicker className="w-full" placeholder="Fecha" disabled />
            </ClickableOverlay>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Hasta:
            </label>
            <ClickableOverlay componentId="field-fecha-hasta">
              <DatePicker className="w-full" placeholder="Hasta" disabled />
            </ClickableOverlay>
          </div>
          <div className="col-span-4">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Cliente:
            </label>
            <ClickableOverlay componentId="field-cliente">
              <Select
                className="w-full"
                placeholder="Digite nombre del cliente"
                disabled
              />
            </ClickableOverlay>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              T.Doc:
            </label>
            <ClickableOverlay componentId="field-tipo-documento">
              <Select className="w-full" placeholder="Todos" disabled />
            </ClickableOverlay>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Serie N°:
            </label>
            <ClickableOverlay componentId="field-serie-numero">
              <Input className="w-full" placeholder="000-0000000" disabled />
            </ClickableOverlay>
          </div>

          {/* Fila 2 */}
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              F.Pago:
            </label>
            <ClickableOverlay componentId="field-forma-pago">
              <Select className="w-full" placeholder="Todos" disabled />
            </ClickableOverlay>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Estado:
            </label>
            <ClickableOverlay componentId="field-estado-venta">
              <Select className="w-full" placeholder="Todos" disabled />
            </ClickableOverlay>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Vendedor:
            </label>
            <ClickableOverlay componentId="field-vendedor">
              <Select className="w-full" placeholder="Todos" disabled />
            </ClickableOverlay>
          </div>
          <div className="col-span-5"></div>
          <div className="col-span-1">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              &nbsp;
            </label>
            <ClickableOverlay componentId="button-buscar">
              <Button type="primary" icon={<FaSearch />} className="w-full">
                Buscar
              </Button>
            </ClickableOverlay>
          </div>

          {/* Fila 3 - Botones de acción */}
          <div className="col-span-2">
            <ClickableOverlay componentId="button-entregar">
              <Button icon={<FaTruckFast />} className="w-full">
                Entregar
              </Button>
            </ClickableOverlay>
          </div>
          <div className="col-span-2">
            <ClickableOverlay componentId="button-ver-entregas">
              <Button icon={<FaTruckFast />} className="w-full">
                Ver Entregas
              </Button>
            </ClickableOverlay>
          </div>
          <div className="col-span-2">
            <ClickableOverlay componentId="button-ver-calendario">
              <Button icon={<FaCalendar />} className="w-full">
                Ver Calendario
              </Button>
            </ClickableOverlay>
          </div>
        </div>
      </Card>

      {/* Tabla de ventas */}
      <Card size="small" className="shadow">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Listado de Ventas
          </h3>
        </div>
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          size="small"
          rowClassName={(record) =>
            record.estado === "Pagado" ? "bg-green-50" : "bg-orange-50"
          }
        />
      </Card>

      {/* Sección de detalle (simulada) */}
      <ClickableOverlay componentId="section-detalle-productos">
        <Card size="small" className="shadow">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Detalle de Productos
          </h3>
          <div className="text-sm text-gray-500 text-center py-8">
            Selecciona una venta para ver sus productos
          </div>
        </Card>
      </ClickableOverlay>
    </div>
  );
}
