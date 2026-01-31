"use client";

import { Table, Tag, Space, Button, message } from "antd";
import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { prestamoVendedorApi } from "~/lib/api/prestamo-vendedor";
import ModalAprobarSolicitudEfectivo from "~/app/ui/facturacion-electronica/gestion-cajas/_components/modal-aprobar-solicitud-efectivo";

import type { SolicitudEfectivo } from "~/lib/api/prestamo-vendedor";

const formatCurrency = (amount: number) => {
  return `S/ ${amount.toFixed(2)}`;
};

export default function TablaSolicitudesEfectivo() {
  const [solicitudes, setSolicitudes] = useState<SolicitudEfectivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEfectivo | null>(null);
  const [openAprobar, setOpenAprobar] = useState(false);

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await prestamoVendedorApi.listarSolicitudes();
      setSolicitudes(response.data as SolicitudEfectivo[] || []);
    } catch (error) {
      message.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const handleAprobar = (solicitud: SolicitudEfectivo) => {
    setSelectedSolicitud(solicitud);
    setOpenAprobar(true);
  };

  const handleRechazar = async (id: string) => {
    try {
      await prestamoVendedorApi.rechazarSolicitud(id);
      message.success("Solicitud rechazada");
      cargarSolicitudes();
    } catch (error) {
      message.error("Error al rechazar solicitud");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Vendedor Solicitante",
      dataIndex: ["vendedor_solicitante", "name"],
      key: "vendedor",
    },
    {
      title: "Monto Solicitado",
      dataIndex: "monto_solicitado",
      key: "monto",
      render: (monto: number) => formatCurrency(monto),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado: string) => {
        const colors = {
          pendiente: "orange",
          aprobada: "green",
          rechazada: "red",
        };
        return (
          <Tag color={colors[estado as keyof typeof colors]}>
            {estado.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Motivo",
      dataIndex: "motivo",
      key: "motivo",
      render: (motivo: string) => motivo || "-",
    },
    {
      title: "Fecha",
      dataIndex: "created_at",
      key: "fecha",
      render: (fecha: string) => new Date(fecha).toLocaleString(),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_: any, record: SolicitudEfectivo) => {
        if (record.estado !== "pendiente") return null;
        
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircle className="h-4 w-4" />}
              onClick={() => handleAprobar(record)}
            >
              Aprobar
            </Button>
            <Button
              danger
              size="small"
              icon={<XCircle className="h-4 w-4" />}
              onClick={() => handleRechazar(record.id)}
            >
              Rechazar
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={solicitudes}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} solicitudes`,
        }}
      />

      {selectedSolicitud && (
        <ModalAprobarSolicitudEfectivo
          open={openAprobar}
          setOpen={setOpenAprobar}
          solicitudId={selectedSolicitud.id}
          montoSolicitado={selectedSolicitud.monto_solicitado}
          solicitanteNombre={selectedSolicitud.vendedor_solicitante.name}
          onSuccess={cargarSolicitudes}
        />
      )}
    </>
  );
}
