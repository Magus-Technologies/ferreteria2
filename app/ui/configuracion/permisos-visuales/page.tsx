'use client';

import { useState, useMemo } from 'react';
import { Card, Divider, Alert, Spin, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

import ContenedorGeneral from '~/app/_components/containers/contenedor-general';
import TituloModulos from '~/app/_components/others/titulo-modulos';
import { usePermission } from '~/hooks/use-permission';
import { permissions } from '~/lib/permissions';
import NoAutorizado from '~/components/others/no-autorizado';
import { ConfigModeProvider } from './_components/config-mode-context';
import { FaUsers, FaCheck, FaLock, FaTimes } from 'react-icons/fa';
import { permissionsApi } from '~/lib/api/permissions';
import { autorizacionesApi, autorizacionesKeys } from '~/lib/api/autorizaciones';
import { MODULE_LABELS } from './_constants';
import { resolveVistaComponent } from './_constants/component-map';

import SelectorBar from './_components/selector-bar';
import ModuloCard from './_components/modulo-card';
import DecisionModal, { type AceptarData } from './_components/decision-modal';
import ConfigPreviewViewport from './_components/config-preview-viewport';

import { useRoles } from './_hooks/use-roles';
import { useAuthConfigs } from './_hooks/use-auth-configs';

import facturacionElectronicaNav from '~/lib/navigation/module-navs/facturacion-electronica.json';
import gestionComercialNav from '~/lib/navigation/module-navs/gestion-comercial-e-inventario.json';
import gestionContableNav from '~/lib/navigation/module-navs/gestion-contable-y-financiera.json';
import reportesNav from '~/lib/navigation/module-navs/reportes.json';
import configuracionNav from '~/lib/navigation/module-navs/configuracion.json';

import type { NavItem } from './_types';

const ConfigVistaPlaceholder = lazy(() => import('./_components/config-vista-placeholder'));

export default function PermisosVisualesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rolIdStr = searchParams.get('rol');
  const area = searchParams.get('area') || 'facturacion-electronica';
  const rolId = rolIdStr ? parseInt(rolIdStr, 10) : null;

  const canAccess = usePermission(permissions.CONFIGURACION_PERMISOS_INDEX);
  const queryClient = useQueryClient();

  const { roles, loading: loadingRoles, rolData, restriccionesActivas } = useRoles(rolId);
  const { authConfigs, users, isRequiereAuth, getAutorizadorId, getTipoAutorizador, getCargoAutorizador } = useAuthConfigs(rolId);

  const [vistaActiva, setVistaActiva] = useState<{
    label: string;
    permission: string;
    component: React.LazyExoticComponent<any>;
  } | null>(null);
  // Identificador ÚNICO por tarjeta (sección + índice). No usar item.permission:
  // hay permisos duplicados en el nav, lo que hacía que se expandieran varias a la vez.
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<{ label: string; permission: string } | null>(null);
  // Solo las vistas de navegación pueden requerir autorización de acceso.
  const [esNavSeleccionado, setEsNavSeleccionado] = useState(false);

  const rolNombre = rolData?.descripcion || 'Sin seleccionar';

  // Config de autorización de ACCESO (accion='acceso') del elemento seleccionado.
  const accesoConfig = useMemo(
    () =>
      authConfigs.find(
        (c) => c.modulo === itemSeleccionado?.permission && c.accion === 'acceso'
      ),
    [authConfigs, itemSeleccionado]
  );

  // componentIds que requieren autorización de acceso para el rol (marcados en naranja
  // en el modo configuración).
  const componentesConAutorizacion = useMemo(
    () =>
      new Set(
        authConfigs
          .filter((c) => c.accion === 'acceso' && c.requiere_autorizacion)
          .map((c) => c.modulo)
      ),
    [authConfigs]
  );

  // Aplica el estado elegido en el modal: visibilidad (restricción) + autorización
  // en una sola confirmación ("Aceptar").
  const aceptarMutation = useMutation({
    mutationFn: async ({ estado, tipo_autorizador, autorizador_id, cargo_autorizador }: AceptarData) => {
      if (!rolId || !itemSeleccionado) throw new Error('Datos incompletos');
      // Visibilidad y autorización son independientes → en paralelo para reducir latencia
      // a la mitad (antes eran dos await secuenciales).
      await Promise.all([
        // Visibilidad: solo 'oculto' restringe; los demás lo dejan visible.
        permissionsApi.toggleRestriction(rolId, itemSeleccionado.permission, estado !== 'oculto'),
        // Autorización: solo el estado 'autorizacion' la requiere.
        autorizacionesApi.saveConfig({
          role_id: rolId,
          modulo: itemSeleccionado.permission,
          accion: 'acceso',
          requiere_autorizacion: estado === 'autorizacion',
          tipo_autorizador,
          autorizador_id,
          cargo_autorizador,
        }),
      ]);
    },
    // Optimista: refleja bloqueo/desbloqueo/autorización al instante en las tarjetas y en
    // la vista en vivo, sin esperar la red ni el refetch. La red corre en segundo plano.
    onMutate: async ({ estado, tipo_autorizador, autorizador_id, cargo_autorizador }: AceptarData) => {
      if (!rolId || !itemSeleccionado) return;
      const permission = itemSeleccionado.permission;
      const rolesKey = ['roles'] as const;
      const configsKey = autorizacionesKeys.configs(rolId ?? undefined);

      await Promise.all([
        queryClient.cancelQueries({ queryKey: rolesKey }),
        queryClient.cancelQueries({ queryKey: configsKey }),
      ]);

      const prevRoles = queryClient.getQueryData(rolesKey);
      const prevConfigs = queryClient.getQueryData(configsKey);

      const ocultar = estado === 'oculto';
      const requiereAuth = estado === 'autorizacion';

      // --- cache de roles (restricciones de visibilidad) ---
      queryClient.setQueryData(rolesKey, (old: any) => {
        if (!old) return old;
        const mapRole = (r: any) => {
          if (r?.id !== rolId) return r;
          const restrictions = Array.isArray(r.restrictions) ? r.restrictions : [];
          const sinEste = restrictions.filter((x: any) => x?.name !== permission);
          return { ...r, restrictions: ocultar ? [...sinEste, { name: permission }] : sinEste };
        };
        // Soporta las formas { data: Role[] } y { data: { data: Role[] } }.
        if (Array.isArray(old?.data?.data)) return { ...old, data: { ...old.data, data: old.data.data.map(mapRole) } };
        if (Array.isArray(old?.data)) return { ...old, data: old.data.map(mapRole) };
        if (Array.isArray(old)) return old.map(mapRole);
        return old;
      });

      // --- cache de configs (requiere_autorizacion para accion 'acceso') ---
      queryClient.setQueryData(configsKey, (old: any) => {
        if (!old) return old;
        const upsert = (arr: any[]) => {
          const idx = arr.findIndex((c) => c?.modulo === permission && c?.accion === 'acceso');
          if (idx >= 0) {
            const next = arr.slice();
            next[idx] = { ...next[idx], requiere_autorizacion: requiereAuth, tipo_autorizador, autorizador_id, cargo_autorizador };
            return next;
          }
          // No existía config previa: crear una sintética para marcar/desmarcar al instante.
          return [...arr, { id: -Date.now(), role_id: rolId, modulo: permission, accion: 'acceso', requiere_autorizacion: requiereAuth, tipo_autorizador, autorizador_id, cargo_autorizador }];
        };
        if (Array.isArray(old?.data?.data)) return { ...old, data: { ...old.data, data: upsert(old.data.data) } };
        if (Array.isArray(old?.data)) return { ...old, data: upsert(old.data) };
        if (Array.isArray(old)) return upsert(old);
        return old;
      });

      // Cierre inmediato del modal para que se sienta instantáneo.
      // OJO: NO limpiar `itemSeleccionado` aquí. Hacerlo provoca un re-render
      // que React Query usa para releer `options.mutationFn` ANTES de ejecutarlo,
      // por lo que el closure pasa a tener itemSeleccionado=null y mutationFn
      // lanza "Datos incompletos" (revierte el optimista → la tarjeta vuelve a verde).
      // Se limpia en onSettled, cuando la mutación ya leyó el valor.
      setModalVisible(false);

      return { prevRoles, prevConfigs };
    },
    onError: (error: any, _vars, context: any) => {
      // Revertir el cambio optimista si la red falla.
      if (context?.prevRoles !== undefined) queryClient.setQueryData(['roles'], context.prevRoles);
      if (context?.prevConfigs !== undefined) queryClient.setQueryData(autorizacionesKeys.configs(rolId ?? undefined), context.prevConfigs);
      console.error(error?.message || 'Error al guardar');
    },
    onSettled: () => {
      // Limpiar la selección recién aquí: la mutación ya leyó itemSeleccionado.
      setItemSeleccionado(null);
      // Reconciliar con el servidor en segundo plano (no bloquea la UI).
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: autorizacionesKeys.configs(rolId ?? undefined) });
    },
  });

  const handleRolChange = (value: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('rol', value.toString());
    } else {
      params.delete('rol');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
    setExpandedKey(null);
    if (vistaActiva) setVistaActiva(null);
  };

  const handleAreaChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('area', value);
    router.replace(`?${params.toString()}`, { scroll: false });
    setExpandedKey(null);
    if (vistaActiva) setVistaActiva(null);
  };

  const extraerItems = (items: any[]): NavItem[] => {
    const resultado: NavItem[] = [];
    items.forEach((item) => {
      if (item.permission && item.label) {
        resultado.push({ label: item.label, permission: item.permission, route: item.route, icon: item.icon });
      }
      if (item.items && Array.isArray(item.items)) {
        resultado.push(...extraerItems(item.items));
      }
    });
    return resultado;
  };

  // Muestra una sola tarjeta por módulo de negocio (authModulo). Varias vistas
  // del nav comparten authModulo (ej. "Mis Ventas" e "Historial de Ventas" → ventas),
  // por lo que su switch de autorización es el mismo; mostrarlas todas se veía como
  // "copia". Los items sin módulo de negocio se conservan (quitando duplicados exactos).
  const dedupePorModulo = (items: NavItem[]): NavItem[] => {
    const vistos = new Set<string>();
    return items.filter((item) => {
      // Cada item del nav se muestra como su propia tarjeta. Solo se descartan
      // duplicados EXACTOS (misma ruta + permiso + label), no por módulo de
      // autorización (eso ocultaba vistas distintas como "Movimientos de Caja").
      const clave = `${item.permission ?? ''}|${item.route ?? ''}|${item.label ?? ''}`;
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    });
  };

  const obtenerModulos = () => {
    if (area === 'facturacion-electronica') {
      return {
        topNav: dedupePorModulo(extraerItems(facturacionElectronicaNav.topNav.items)),
        bottomNav: dedupePorModulo(extraerItems(facturacionElectronicaNav.bottomNav.items)),
      };
    }
    if (area === 'gestion-comercial-e-inventario') {
      return {
        topNav: dedupePorModulo(extraerItems(gestionComercialNav.topNav.items)),
        bottomNav: dedupePorModulo(extraerItems(gestionComercialNav.bottomNav.items)),
      };
    }
    if (area === 'gestion-contable-y-financiera') {
      return {
        topNav: dedupePorModulo(extraerItems(gestionContableNav.topNav.items)),
        bottomNav: dedupePorModulo(extraerItems(gestionContableNav.bottomNav.items)),
      };
    }
    if (area === 'reportes') {
      return {
        topNav: dedupePorModulo(extraerItems(reportesNav.topNav.items)),
        bottomNav: dedupePorModulo(extraerItems(reportesNav.bottomNav.items)),
      };
    }
    if (area === 'configuracion') {
      return {
        topNav: dedupePorModulo(extraerItems(configuracionNav.topNav.items)),
        bottomNav: dedupePorModulo(extraerItems(configuracionNav.bottomNav.items)),
      };
    }
    return { topNav: [], bottomNav: [] };
  };

  const modulos = obtenerModulos();

  const handleModuloClick = (item: NavItem) => {
    if (!rolId) return;
    const label = item.label || '';
    const permission = item.permission!;
    const component = resolveVistaComponent(item);
    if (component) {
      setVistaActiva({ label, permission, component });
    } else {
      setItemSeleccionado({ label, permission });
      setModalVisible(true);
    }
  };

  const estaVisible = (permission: string) => !rolId || !restriccionesActivas.has(permission);

  if (!canAccess) return <NoAutorizado />;

  return (
    <ContenedorGeneral>
      <TituloModulos title="Configurar Acceso a Módulos" icon={<FaUsers className="text-blue-600" />} />

      {!vistaActiva && (
        <Card className="mb-4">
          <SelectorBar
            roles={roles}
            loading={loadingRoles}
            rolId={rolId}
            area={area}
            onRolChange={handleRolChange}
            onAreaChange={handleAreaChange}
            rolNombre={rolNombre}
          />
        </Card>
      )}

      {!rolId ? (
        <Card>
          <div className="text-center text-gray-500 py-8">Selecciona un rol para empezar a configurar</div>
        </Card>
      ) : vistaActiva ? (
        <Card className="w-full">
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button icon={<ArrowLeftOutlined />} onClick={() => setVistaActiva(null)}>
                Volver
              </Button>
              <span className="text-lg font-bold">{vistaActiva.label}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm bg-blue-50 px-3 py-2 rounded border border-blue-200">
                <span className="text-gray-600">Rol:</span>{' '}
                <strong className="text-blue-600">{rolNombre}</strong>
                <Divider type="vertical" />
                <span className="text-gray-600">Área:</span>{' '}
                <strong>{MODULE_LABELS[area] ?? area}</strong>
              </div>
              <Alert
                message="Modo Configuración Activo"
                description="Haz click en cualquier elemento para configurarlo"
                type="info"
                showIcon
                className="mb-0"
              />
            </div>
          </div>

          {/* Leyenda de estados (siempre visible) */}
          <div className="mb-3 flex items-center gap-4 flex-wrap text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <span className="font-semibold text-gray-600">Leyenda:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[8px]"><FaCheck /></span>
              Visible
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-[8px]"><FaLock /></span>
              Requiere autorización
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[8px]"><FaTimes /></span>
              Oculto
            </span>
          </div>

          <ConfigModeProvider enabled={true} onTogglePermiso={(id, label) => { setItemSeleccionado({ label, permission: id }); setEsNavSeleccionado(false); setModalVisible(true); }} permisosActivos={restriccionesActivas} autorizacionesActivas={componentesConAutorizacion}>
            <ConfigPreviewViewport>
              <Suspense fallback={<Spin size="large" tip="Cargando vista real..." />}>
                <vistaActiva.component />
              </Suspense>
            </ConfigPreviewViewport>
          </ConfigModeProvider>
        </Card>
      ) : (
        <Card>
          <div className="mb-6">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <span className="text-blue-500">🔼</span> Barra Superior (Top Nav)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 items-start">
              {modulos.topNav.map((item, idx) => {
                const cardKey = `top-${idx}`;
                return (
                <ModuloCard
                  key={cardKey}
                  item={item}
                  isExpanded={expandedKey === cardKey}
                  onToggleExpand={() => setExpandedKey(expandedKey === cardKey ? null : cardKey)}
                  onConfigurar={() => handleModuloClick(item)}
                  onVerToggle={() => { setItemSeleccionado({ label: item.label || '', permission: item.permission! }); setEsNavSeleccionado(true); setModalVisible(true); }}
                  visible={estaVisible(item.permission!)}
                  isRequiereAuth={isRequiereAuth}
                  getAutorizadorId={getAutorizadorId}
                  getTipoAutorizador={getTipoAutorizador}
                  getCargoAutorizador={getCargoAutorizador}
                  rolId={rolId}
                  users={users}
                  authConfigs={authConfigs as any}
                />
                );
              })}
            </div>
          </div>

          <Divider />

          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <span className="text-purple-500">🔽</span> Barra Inferior (Bottom Nav)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 items-start">
              {modulos.bottomNav.map((item, idx) => {
                const cardKey = `bottom-${idx}`;
                return (
                <ModuloCard
                  key={cardKey}
                  item={item}
                  isExpanded={expandedKey === cardKey}
                  onToggleExpand={() => setExpandedKey(expandedKey === cardKey ? null : cardKey)}
                  onConfigurar={() => handleModuloClick(item)}
                  onVerToggle={() => { setItemSeleccionado({ label: item.label || '', permission: item.permission! }); setEsNavSeleccionado(true); setModalVisible(true); }}
                  visible={estaVisible(item.permission!)}
                  isRequiereAuth={isRequiereAuth}
                  getAutorizadorId={getAutorizadorId}
                  getTipoAutorizador={getTipoAutorizador}
                  getCargoAutorizador={getCargoAutorizador}
                  rolId={rolId}
                  users={users}
                  authConfigs={authConfigs as any}
                />
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 m-0">
              <strong>Nota:</strong> Haz click en un módulo para configurar sus autorizaciones (crear/editar/eliminar).
              Si no se selecciona un aprobador específico, cualquier administrador podrá aprobar.
            </p>
          </div>
        </Card>
      )}

      <DecisionModal
        visible={modalVisible}
        itemLabel={itemSeleccionado?.label || ''}
        rolNombre={rolNombre}
        loading={aceptarMutation.isPending}
        visibleActual={itemSeleccionado ? estaVisible(itemSeleccionado.permission) : true}
        requiereAcceso={!!accesoConfig?.requiere_autorizacion}
        tipoAutorizador={accesoConfig?.tipo_autorizador ?? 'jerarquia'}
        cargoAutorizador={accesoConfig?.cargo_autorizador ?? null}
        autorizadorId={accesoConfig?.autorizador_id ?? null}
        users={users}
        permitirAcceso={true}
        onAceptar={(data: AceptarData) => aceptarMutation.mutate(data)}
        onCancel={() => { setModalVisible(false); setItemSeleccionado(null); }}
      />
    </ContenedorGeneral>
  );
}