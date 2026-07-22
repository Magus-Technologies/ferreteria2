'use client'

// Reutiliza la página de facturación electrónica: misma vista, ahora accesible
// desde el módulo de Finanzas. El wrapper .theme-finanzas re-colorea los acentos
// ámbar al rosa del módulo (ver app/globals.css); las tablas se tematizan solas
// por ruta (TableBase detecta el módulo con usePathname).
import MovimientosCajaPage from '~/app/ui/facturacion-electronica/movimientos-caja/page'

export default function MovimientosCajaFinanzasPage() {
  return (
    <div className='theme-finanzas w-full'>
      <MovimientosCajaPage />
    </div>
  )
}
