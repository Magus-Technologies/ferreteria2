'use client'

let securityConfigured = false

/**
 * Configurar seguridad de QZ Tray con certificado digital
 * Esto elimina el diálogo "Untrusted website"
 */
export async function setupQzSecurity() {
  if (securityConfigured) {
    console.log('🔐 Seguridad de QZ Tray ya configurada')
    return
  }
  
  try {
    console.log('🔐 Configurando seguridad de QZ Tray...')
    
    // Importar QZ Tray dinámicamente
    const qz: any = (await import('qz-tray')).default
    
    // Configurar certificado
    qz.security.setCertificatePromise(async () => {
      try {
        const response = await fetch('/api/qz/certificate')
        if (!response.ok) {
          throw new Error(`Error al obtener certificado: ${response.status}`)
        }
        const certificate = await response.text()
        console.log('✅ Certificado obtenido')
        return certificate
      } catch (error) {
        console.error('❌ Error al obtener certificado:', error)
        throw error
      }
    })
    
    // Configurar algoritmo de firma
    qz.security.setSignatureAlgorithm('SHA512')
    
    // Configurar firma de peticiones
    qz.security.setSignaturePromise(async (dataToSign: string) => {
      try {
        const response = await fetch('/api/qz/sign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: dataToSign }),
        })
        
        if (!response.ok) {
          throw new Error(`Error al firmar petición: ${response.status}`)
        }
        
        const signature = await response.text()
        return signature
      } catch (error) {
        console.error('❌ Error al firmar petición:', error)
        throw error
      }
    })
    
    securityConfigured = true
    console.log('✅ Seguridad de QZ Tray configurada correctamente')
    
  } catch (error) {
    console.error('❌ Error al configurar seguridad de QZ Tray:', error)
    console.warn('⚠️  Continuando sin firma digital (se mostrará diálogo de permiso)')
    // No lanzamos error para permitir fallback al flujo manual
  }
}

/**
 * Resetear configuración de seguridad (útil para testing)
 */
export function resetQzSecurity() {
  securityConfigured = false
  console.log('🔄 Configuración de seguridad reseteada')
}
