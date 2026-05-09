"use client";

import { useState } from "react";
import { Table, Tag, Button, message, Modal, Input, Space, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { facturacionElectronicaApi, ComprobanteElectronico, DetalleComunicacionBaja } from "~/lib/api/facturacion-electronica";
import useApp from "antd/es/app/useApp";
import CardDashboard from "~/app/_components/cards/card-dashboard";
import { FaFileAlt, FaPaperPlane, FaClock } from "react-icons/fa";

export default function Page() {
  const { modal } = useApp();
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [comprobantes, setComprobantes] = useState<ComprobanteElectronico[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [motivoGlobal, setMotivoGlobal] = useState("");

  const loadComprobantes = async () => {
    setLoading(true);
    try {
      const result = await facturacionElectronicaApi.buscarComprobantes({
        query: searchQuery || ".",
        limit: 50,
      });

      if (result.error) {
        message.error("Error al cargar comprobantes: " + result.error.message);
        return;
      }

      if (result.data?.data) {
        const pendientes = result.data.data.filter(
          (c: ComprobanteElectronico) =>
            c.estado_sunat === "PENDIENTE" &&
            (c.tipo_comprobante === "01" || c.tipo_comprobante === "03")
        );
        setComprobantes(pendientes);
      }
    } catch (error: any) {
      message.error("Error al cargar comprobantes: " + error?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarBaja = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Selecciona al menos un comprobante");
      return;
    }

    if (!motivoGlobal.trim()) {
      message.warning("Ingresa un motivo para la comunicación de baja");
      return;
    }

    const detalles: DetalleComunicacionBaja[] = selectedRowKeys.map((key) => {
      const comp = comprobantes.find((c) => c.id === key);
      return {
        tipo_doc: comp?.tipo_comprobante as "01" | "03",
        serie: comp?.serie || "",
        correlativo: String(comp?.correlativo || ""),
        motivo: motivoGlobal,
      };
    });

    modal.confirm({
      title: "Enviar Comunicación de Baja",
      content: `¿Estás seguro de enviar la comunicación de baja para ${selectedRowKeys.length} comprobante(s)? Esta acción no se puede deshacer.`,
      okText: "Sí, enviar",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      onOk: async () => {
        setEnviando(true);
        try {
          const result = await facturacionElectronicaApi.enviarBajaSunat(detalles);

          if (result.error) {
            message.error(result.error.message || "Error al enviar comunicación de baja");
            return;
          }

          if (result.data?.success) {
            message.success({
              content: `Comunicación de baja enviada exitosamente. Código: ${result.data.codigo_sunat || "0"}`,
              duration: 5,
            });
            setModalOpen(false);
            setSelectedRowKeys([]);
            setMotivoGlobal("");
            loadComprobantes();
          } else {
            message.error(result.data?.message || "Error al enviar comunicación de baja");
          }
        } catch (error: any) {
          message.error("Error: " + error?.message);
        } finally {
          setEnviando(false);
        }
      },
    });
  };

  const columns: ColumnsType<ComprobanteElectronico> = [
    {
      title: "Tipo",
      dataIndex: "tipo_comprobante",
      width: 100,
      render: (tipo: string) => (
        <Tag color={tipo === "01" ? "blue" : "green"}>
          {tipo === "01" ? "Factura" : "Boleta"}
        </Tag>
      ),
    },
    {
      title: "Serie-Número",
      dataIndex: "serie_numero",
      render: (_, record) => `${record.serie}-${String(record.correlativo).padStart(8, "0")}`,
    },
    {
      title: "Fecha",
      dataIndex: "fecha_emision",
      width: 120,
    },
    {
      title: "Cliente",
      dataIndex: "cliente_razon_social",
      ellipsis: true,
    },
    {
      title: "Total",
      dataIndex: "total",
      width: 120,
      render: (total: number) => `S/. ${total?.toFixed(2) || "0.00"}`,
    },
    {
      title: "Estado SUNAT",
      dataIndex: "estado_sunat",
      width: 130,
      render: (estado: string) => (
        <Tag color={estado === "PENDIENTE" ? "orange" : "default"}>
          {estado}
        </Tag>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Comunicación de Baja - SUNAT</h2>
        <Space>
          <Input
            placeholder="Buscar comprobante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 250 }}
            onPressEnter={() => loadComprobantes()}
          />
          <Button icon={<FaFileAlt />} onClick={loadComprobantes} loading={loading}>
            Buscar Pendientes
          </Button>
          <Button
            type="primary"
            danger
            icon={<FaPaperPlane />}
            onClick={() => setModalOpen(true)}
            disabled={selectedRowKeys.length === 0}
          >
            Enviar Baja ({selectedRowKeys.length})
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <CardDashboard
          title="Pendientes"
          value={comprobantes.length}
          icon={<FaClock className="text-orange-500" />}
        />
      </div>

      <Table
        columns={columns}
        dataSource={comprobantes.map((c) => ({ ...c, key: c.id }))}
        rowSelection={rowSelection}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      <Modal
        title="Enviar Comunicación de Baja"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>,
          <Button
            key="send"
            type="primary"
            danger
            loading={enviando}
            onClick={handleEnviarBaja}
          >
            Enviar a SUNAT
          </Button>,
        ]}
      >
        <div className="flex flex-col gap-4 py-4">
          <div>
            <label className="block mb-2 font-medium">
              Motivo de la comunicación de baja:
            </label>
            <Input.TextArea
              value={motivoGlobal}
              onChange={(e) => setMotivoGlobal(e.target.value)}
              placeholder="Ej: Documento anulado por error del usuario"
              rows={3}
            />
          </div>

          <div>
            <p className="font-medium mb-2">
              Comprobantes seleccionados ({selectedRowKeys.length}):
            </p>
            <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
              {selectedRowKeys.map((key) => {
                const comp = comprobantes.find((c) => c.id === key);
                return (
                  <li key={key}>
                    {comp?.serie}-{String(comp?.correlativo).padStart(8, "0")} -{" "}
                    {comp?.cliente_razon_social || "Sin cliente"}
                  </li>
                );
              })}
            </ul>
          </div>

          {enviando && (
            <div className="flex items-center gap-2 text-blue-600">
              <Spin size="small" />
              <span>Enviando comunicación de baja a SUNAT...</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}