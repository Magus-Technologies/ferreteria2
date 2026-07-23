'use client'

// Reutiliza la página de facturación electrónica: misma vista, ahora accesible
// desde el módulo de Finanzas. El wrapper .theme-finanzas re-colorea los acentos
// ámbar al rosa del módulo (ver app/globals.css); las tablas se tematizan solas
// por ruta (TableBase detecta el módulo con usePathname).
import MisAperturasCierresPage from '~/app/ui/facturacion-electronica/mis-aperturas-cierres/page'

export default function MisAperturasCierresFinanzasPage() {
  return (
    <div className='theme-finanzas w-full'>
      <MisAperturasCierresPage />
    </div>
  )
}
