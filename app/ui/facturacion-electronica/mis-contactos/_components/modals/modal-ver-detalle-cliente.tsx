"use client";

import { Descriptions, Tag, Spin } from "antd";
import { Cliente, TipoCliente, clienteApi, type DireccionCliente } from "~/lib/api/cliente";
import { FaUser, FaBuilding, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaIdCard } from "react-icons/fa";
import ModalForm from "~/components/modals/modal-form";
import TitleForm from "~/components/form/title-form";
import { useQuery } from "@tanstack/react-query";

interface ModalVerDetalleClienteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  cliente: Cliente | null;
}

export default function ModalVerDetalleCliente({
  open,
  setOpen,
  cliente,
}: ModalVerDetalleClienteProps) {
  // Cargar direcciones del cliente cuando se abre el modal
  const { data: direccionesData, isLoading: cargandoDirecciones } = useQuery({
    queryKey: ['direcciones-cliente', cliente?.id],
    queryFn: () => clienteApi.listarDirecciones(cliente!.id),
    enabled: open && !!cliente?.id,
  });

  if (!cliente) return null;

  const esPersona = cliente.tipo_cliente === TipoCliente.PERSONA;
  const esEmpresa = cliente.tipo_cliente === TipoCliente.EMPRESA;

  const getNombreCompleto = () => {
    if (esEmpresa && cliente.razon_social) {
      return cliente.razon_social;
    }
    return `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim();
  };

  const items = [
    {
      key: "tipo",
      label: "Tipo de Cliente",
      children: (
        <div className="flex items-center gap-2">
          {esPersona ? <FaUser className="text-blue-600" /> : <FaBuilding className="text-green-600" />}
          <Tag color={esPersona ? "blue" : "green"}>
            {esPersona ? "Persona Natural" : "Empresa"}
          </Tag>
        </div>
      ),
    },
    {
      key: "documento",
      label: esPersona ? "DNI" : "RUC",
      children: (
        <div className="flex items-center gap-2">
          <FaIdCard className="text-gray-600" />
          <span className="font-mono">{cliente.numero_documento}</span>
        </div>
      ),
    },
    {
      key: "nombre",
      label: esPersona ? "Nombre Completo" : "Razón Social",
      children: (
        <span className="font-medium">{getNombreCompleto()}</span>
      ),
    },
  ];

  // Información de contacto
  if (cliente.telefono) {
    items.push({
      key: "telefono",
      label: "Teléfono",
      children: (
        <div className="flex items-center gap-2">
          <FaPhone className="text-green-600" />
          <span>{cliente.telefono}</span>
        </div>
      ),
    });
  }

  if (cliente.celular) {
    items.push({
      key: "celular",
      label: "Celular",
      children: (
        <div className="flex items-center gap-2">
          <FaPhone className="text-blue-600" />
          <span>{cliente.celular}</span>
        </div>
      ),
    });
  }

  if (cliente.email) {
    items.push({
      key: "email",
      label: "Email",
      children: (
        <div className="flex items-center gap-2">
          <FaEnvelope className="text-red-600" />
          <span>{cliente.email}</span>
        </div>
      ),
    });
  }

  // Direcciones
  const direcciones: DireccionCliente[] = direccionesData?.data?.data || [];

  if (direcciones.length > 0) {
    items.push({
      key: "direcciones",
      label: "Direcciones",
      children: cargandoDirecciones ? (
        <Spin size="small" />
      ) : (
        <div className="space-y-2">
          {direcciones.map((dir) => (
            <div key={dir.id} className="flex items-start gap-2">
              <FaMapMarkerAlt className="text-red-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Tag color={dir.es_principal ? "blue" : "default"} className="!m-0">
                    {dir.tipo}
                  </Tag>
                  {dir.es_principal && (
                    <Tag color="green" className="!m-0">Principal</Tag>
                  )}
                </div>
                <span className="block mt-1">{dir.direccion}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    });
  }

  // Información adicional
  if (cliente.horario_atencion) {
    items.push({
      key: "horario",
      label: "Horario de Atención",
      children: (
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-purple-600" />
          <span>{cliente.horario_atencion}</span>
        </div>
      ),
    });
  }

  if (cliente.fecha_nacimiento) {
    items.push({
      key: "nacimiento",
      label: "Fecha de Nacimiento",
      children: (
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-pink-600" />
          <span>{new Date(cliente.fecha_nacimiento).toLocaleDateString()}</span>
        </div>
      ),
    });
  }

  if (cliente.contacto_referencia) {
    items.push({
      key: "referencia",
      label: "Contacto de Referencia",
      children: (
        <span>{cliente.contacto_referencia}</span>
      ),
    });
  }

  // Estado y puntos
  items.push({
    key: "estado",
    label: "Estado",
    children: (
      <Tag color={cliente.estado ? "green" : "red"}>
        {cliente.estado ? "Activo" : "Inactivo"}
      </Tag>
    ),
  });

  if (cliente.puntos > 0 || cliente.centimos > 0) {
    items.push({
      key: "puntos",
      label: "Puntos Acumulados",
      children: (
        <div className="flex items-center gap-4">
          <span>Puntos: <strong>{cliente.puntos}</strong></span>
          <span>Centimos: <strong>{cliente.centimos}</strong></span>
        </div>
      ),
    });
  }

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className="!pb-0">
            <div className="flex items-center gap-2">
              {esPersona ? <FaUser className="text-blue-600" /> : <FaBuilding className="text-green-600" />}
              <span>Detalles del Cliente</span>
            </div>
          </TitleForm>
        ),
        className: "min-w-[700px]",
        wrapClassName: "!flex !items-center",
        centered: true,
        footer: null,
      }}
      open={open}
      setOpen={setOpen}
      onCancel={() => setOpen(false)}
    >
      <div className="py-4">
        <Descriptions
          items={items}
          column={1}
          size="middle"
          bordered
          labelStyle={{
            backgroundColor: "#f8fafc",
            fontWeight: "500",
            width: "200px",
          }}
          contentStyle={{
            backgroundColor: "#ffffff",
          }}
        />
      </div>
    </ModalForm>
  );
}