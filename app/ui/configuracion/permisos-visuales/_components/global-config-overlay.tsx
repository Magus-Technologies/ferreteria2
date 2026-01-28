"use client";

import { useEffect, useRef } from "react";

interface GlobalConfigOverlayProps {
  enabled: boolean;
}

/**
 * Overlay global que bloquea TODAS las interacciones del usuario
 * cuando está en modo configuración.
 *
 * Usa event listeners nativos con capture=true para interceptar
 * TODOS los eventos antes que lleguen a React.
 */
export default function GlobalConfigOverlay({ enabled }: GlobalConfigOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const preventAllEvents = (e: Event) => {
      // Solo prevenir eventos del usuario, no eventos programáticos
      if (e.isTrusted) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    // Lista de TODOS los eventos que queremos bloquear
    const eventsToBlock = [
      'click',
      'dblclick',
      'mousedown',
      'mouseup',
      'mousemove',
      'touchstart',
      'touchend',
      'touchmove',
      'keydown',
      'keyup',
      'keypress',
      'submit',
      'focus',
      'blur',
      'contextmenu',
      'drag',
      'drop',
      'input',
      'change',
      'wheel',
    ];

    // Agregar listeners a nivel de documento con capture=true
    // Esto intercepta TODOS los eventos antes que lleguen a cualquier componente
    eventsToBlock.forEach((eventType) => {
      document.addEventListener(eventType, preventAllEvents, {
        capture: true,
        passive: false,
      });
    });

    return () => {
      // Limpiar listeners
      eventsToBlock.forEach((eventType) => {
        document.removeEventListener(eventType, preventAllEvents, {
          capture: true,
        });
      });
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-transparent pointer-events-auto"
      style={{
        zIndex: 999999,
        cursor: 'not-allowed',
      }}
    >
      {/* Mensaje visual cuando intenta interactuar */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-2xl opacity-0 hover:opacity-100 transition-opacity">
          <p className="font-bold">🚫 Modo Configuración Activo</p>
          <p className="text-sm">Haz clic en los badges ✓/✗ para configurar permisos</p>
        </div>
      </div>
    </div>
  );
}
