'use client'

import { useState, type ReactNode } from 'react'
import { Segmented } from 'antd'
import { MobileOutlined, TabletOutlined, DesktopOutlined } from '@ant-design/icons'

type DeviceWidth = 'mobile' | 'tablet' | 'desktop'

// Anchos de previsualización. 'desktop' = 100% del panel (sin marco).
const DEVICE_WIDTHS: Record<DeviceWidth, number | null> = {
  mobile: 390,
  tablet: 768,
  desktop: null,
}

/**
 * Lienzo responsivo para previsualizar una vista real dentro del modo configuración.
 *
 * Resuelve el "entrecortado": antes la vista se montaba en un contenedor con altura
 * fija y `overflow-hidden`, por lo que todo lo más alto que la caja quedaba recortado
 * y las vistas que usan `h-[calc(100vh-…)]` se desbordaban. Aquí el lienzo tiene
 * `overflow-auto`, así nada se corta — se puede hacer scroll — y se puede acotar el
 * ancho (Móvil/Tablet/Escritorio) para revisar cómo se comporta el layout.
 *
 * Nota: los breakpoints de Tailwind (`sm:`/`md:`/`lg:`) siguen al ancho real de la
 * ventana, no al del marco, así que esto acota el ancho y el desbordamiento, pero no
 * conmuta los breakpoints como lo haría un iframe.
 */
export default function ConfigPreviewViewport({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<DeviceWidth>('desktop')
  const width = DEVICE_WIDTHS[device]

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] min-h-[420px] border border-slate-200 rounded-lg overflow-hidden">
      {/* Barra de tamaños */}
      <div className="flex items-center justify-center gap-2 py-1.5 border-b border-slate-200 bg-slate-50">
        <span className="text-xs text-gray-500">Previsualizar en:</span>
        <Segmented
          size="small"
          value={device}
          onChange={(v) => setDevice(v as DeviceWidth)}
          options={[
            { label: 'Móvil', value: 'mobile', icon: <MobileOutlined /> },
            { label: 'Tablet', value: 'tablet', icon: <TabletOutlined /> },
            { label: 'Escritorio', value: 'desktop', icon: <DesktopOutlined /> },
          ]}
        />
        {width && <span className="text-xs text-gray-400 w-12 text-right">{width}px</span>}
      </div>

      {/* Lienzo con scroll: nada se recorta, solo se desplaza */}
      <div className="flex-1 overflow-auto bg-slate-100 p-3 flex justify-center">
        <div
          className="bg-white shadow-sm rounded-lg min-h-full"
          style={{
            width: width ? `${width}px` : '100%',
            maxWidth: '100%',
            flexShrink: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
