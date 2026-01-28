"use client";

import { Card } from "antd";
import { FaLock, FaUnlock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

interface PanelRestriccionesProps {
  rolNombre: string;
  permisosActivos: Set<string>;
}

/**
 * Panel que muestra qué elementos del módulo tiene/no tiene acceso el rol
 */
export default function PanelRestricciones({
  rolNombre,
  permisosActivos,
}: PanelRestriccionesProps) {
  // Permisos del módulo Facturación Electrónica organizados por sección
  const navegacion = {
    topNav: [
      { label: "Dashboard", permiso: "facturacion-electronica.dashboard.index" },
      { label: "Crear Venta", permiso: "facturacion-electronica.crear-venta.index" },
      { label: "Crear Cotización", permiso: "facturacion-electronica.crear-cotizacion.index" },
      { label: "Prestar / Pedir", permiso: "facturacion-electronica.crear-prestamo.index" },
      { label: "Crear Guía", permiso: "facturacion-electronica.crear-guia.index" },
      { label: "Crear Contacto", permiso: "cliente.create" },
      { label: "Aperturar Caja", permiso: "caja.create" },
      { label: "Crear Gasto", permiso: "egreso-dinero.create" },
      { label: "Kardex", permiso: "gestion-comercial-e-inventario.mi-almacen.index" },
    ],
    bottomNav: [
      { label: "Mis Ventas", permiso: "facturacion-electronica.mis-ventas.index" },
      { label: "Mis Cotizaciones", permiso: "facturacion-electronica.mis-cotizaciones.index" },
      { label: "Mis Guías", permiso: "facturacion-electronica.mis-guias.index" },
      { label: "Mis Préstamos", permiso: "facturacion-electronica.mis-prestamos.index" },
      { label: "Mis Notas", permiso: "facturacion-electronica.mis-notas.index" },
      { label: "Mis Contactos", permiso: "facturacion-electronica.mis-contactos.index" },
      { label: "Aperturas/Cierres", permiso: "facturacion-electronica.mis-aperturas-cierres.index" },
      { label: "Movimientos de Caja", permiso: "facturacion-electronica.movimientos-caja.index" },
    ],
  };

  const tieneAcceso = (permiso: string) => permisosActivos.has(permiso);

  const contarAccesos = (items: typeof navegacion.topNav) => {
    return items.filter((item) => tieneAcceso(item.permiso)).length;
  };

  return (
    <Card
      size="small"
      className="h-full overflow-auto"
      title={
        <div className="flex items-center gap-2">
          <FaLock className="text-red-500" />
          <span className="text-sm font-semibold">
            Restricciones de Acceso: {rolNombre}
          </span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Resumen */}
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <p className="text-xs text-blue-800 font-medium mb-2">
            📊 Resumen de Accesos
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Navegación Superior:</span>
              <span className="font-bold">
                {contarAccesos(navegacion.topNav)}/{navegacion.topNav.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Navegación Inferior:</span>
              <span className="font-bold">
                {contarAccesos(navegacion.bottomNav)}/{navegacion.bottomNav.length}
              </span>
            </div>
          </div>
        </div>

        {/* Navegación Superior */}
        <div>
          <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
            🔝 Barra de Navegación Superior
          </h4>
          <div className="space-y-1">
            {navegacion.topNav.map((item) => {
              const acceso = tieneAcceso(item.permiso);
              return (
                <div
                  key={item.permiso}
                  className={`flex items-center justify-between p-2 rounded text-xs ${
                    acceso
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {acceso ? (
                      <FaCheckCircle className="text-green-600 flex-shrink-0" />
                    ) : (
                      <FaTimesCircle className="text-red-600 flex-shrink-0" />
                    )}
                    <span className={acceso ? "text-green-800" : "text-red-800"}>
                      {item.label}
                    </span>
                  </div>
                  {acceso ? (
                    <FaUnlock className="text-green-600" />
                  ) : (
                    <FaLock className="text-red-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navegación Inferior */}
        <div>
          <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
            📑 Barra de Navegación Inferior
          </h4>
          <div className="space-y-1">
            {navegacion.bottomNav.map((item) => {
              const acceso = tieneAcceso(item.permiso);
              return (
                <div
                  key={item.permiso}
                  className={`flex items-center justify-between p-2 rounded text-xs ${
                    acceso
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {acceso ? (
                      <FaCheckCircle className="text-green-600 flex-shrink-0" />
                    ) : (
                      <FaTimesCircle className="text-red-600 flex-shrink-0" />
                    )}
                    <span className={acceso ? "text-green-800" : "text-red-800"}>
                      {item.label}
                    </span>
                  </div>
                  {acceso ? (
                    <FaUnlock className="text-green-600" />
                  ) : (
                    <FaLock className="text-red-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leyenda */}
        <div className="bg-gray-50 p-2 rounded border border-gray-200">
          <p className="text-xs font-bold text-gray-700 mb-2">Leyenda:</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <FaUnlock className="text-green-600" />
              <span className="text-gray-600">
                = El rol <strong>SÍ</strong> tiene acceso
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaLock className="text-red-600" />
              <span className="text-gray-600">
                = El rol <strong>NO</strong> tiene acceso
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
