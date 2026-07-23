'use client'

// Reutiliza la página de facturación electrónica: misma vista, ahora accesible
// desde el módulo de Finanzas. El wrapper .theme-finanzas re-colorea los acentos
// ámbar al rosa del módulo (ver app/globals.css); las tablas se tematizan solas
// por ruta (TableBase detecta el módulo con usePathname).
import ArqueosDiariosPage from '~/app/ui/facturacion-electronica/arqueos-diarios/page'

export default function ArqueosDiariosFinanzasPage() {
  return (
    <div className='theme-finanzas w-full'>
      <ArqueosDiariosPage />
    </div>
  )
}
