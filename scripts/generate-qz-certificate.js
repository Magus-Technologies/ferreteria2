const jsrsasign = require('jsrsasign')
const fs = require('fs')
const path = require('path')

console.log('🔐 Generando certificados para QZ Tray...\n')

// Directorio de certificados en el backend
const certDir = path.join(__dirname, '../../ferreteria-backend/storage/certificates')

// Verificar que el directorio existe
if (!fs.existsSync(certDir)) {
  console.error('❌ Error: El directorio de certificados no existe')
  console.error(`   Ruta esperada: ${certDir}`)
  console.error('   Crea el directorio primero: mkdir -p ferreteria-backend/storage/certificates')
  process.exit(1)
}

try {
  // Generar par de llaves RSA de 2048 bits
  console.log('⏳ Generando par de llaves RSA (2048 bits)...')
  const keypair = jsrsasign.KEYUTIL.generateKeypair('RSA', 2048)
  console.log('✅ Par de llaves generado')

  // Exportar llave privada (PKCS8)
  console.log('⏳ Exportando llave privada...')
  const privateKeyPEM = jsrsasign.KEYUTIL.getPEM(keypair.prvKeyObj, 'PKCS8PRV')
  fs.writeFileSync(path.join(certDir, 'qz-private-key.pem'), privateKeyPEM)
  console.log('✅ Llave privada guardada')

  // Exportar llave pública
  console.log('⏳ Exportando llave pública...')
  const publicKeyPEM = jsrsasign.KEYUTIL.getPEM(keypair.pubKeyObj)
  fs.writeFileSync(path.join(certDir, 'qz-public-key.pem'), publicKeyPEM)
  console.log('✅ Llave pública guardada')

  // Crear certificado X.509
  console.log('⏳ Generando certificado X.509...')
  
  // Fechas en formato YYMMDDHHMMSSZ (formato UTC)
  const now = new Date()
  const year = now.getUTCFullYear().toString().slice(-2)
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  const hours = String(now.getUTCHours()).padStart(2, '0')
  const minutes = String(now.getUTCMinutes()).padStart(2, '0')
  const seconds = String(now.getUTCSeconds()).padStart(2, '0')
  const notBefore = `${year}${month}${day}${hours}${minutes}${seconds}Z`
  
  // Fecha de expiración (10 años)
  const expiry = new Date(now.getTime() + (10 * 365 * 24 * 60 * 60 * 1000))
  const expYear = expiry.getUTCFullYear().toString().slice(-2)
  const expMonth = String(expiry.getUTCMonth() + 1).padStart(2, '0')
  const expDay = String(expiry.getUTCDate()).padStart(2, '0')
  const expHours = String(expiry.getUTCHours()).padStart(2, '0')
  const expMinutes = String(expiry.getUTCMinutes()).padStart(2, '0')
  const expSeconds = String(expiry.getUTCSeconds()).padStart(2, '0')
  const notAfter = `${expYear}${expMonth}${expDay}${expHours}${expMinutes}${expSeconds}Z`
  
  const cert = new jsrsasign.KJUR.asn1.x509.Certificate({
    version: 3,
    serial: { int: Date.now() },
    issuer: { str: '/CN=Ferreteria System/O=Ferreteria/C=PE' },
    notbefore: { str: notBefore },
    notafter: { str: notAfter },
    subject: { str: '/CN=Ferreteria System/O=Ferreteria/C=PE' },
    sbjpubkey: keypair.pubKeyObj,
    ext: [
      { extname: 'basicConstraints', cA: true },
      { extname: 'keyUsage', names: ['digitalSignature', 'keyEncipherment'] }
    ],
    sigalg: 'SHA256withRSA',
    cakey: keypair.prvKeyObj
  })

  const certPEM = cert.getPEM()
  fs.writeFileSync(path.join(certDir, 'qz-certificate.pem'), certPEM)
  console.log('✅ Certificado X.509 generado')

  console.log('\n✅ ¡Certificados generados exitosamente!\n')
  console.log('📁 Archivos creados en:', certDir)
  console.log('   - qz-private-key.pem  (⚠️  MANTENER EN SECRETO)')
  console.log('   - qz-public-key.pem   (compartir con clientes)')
  console.log('   - qz-certificate.pem  (certificado X.509)\n')
  console.log('📅 Válido desde:', now.toLocaleDateString())
  console.log('📅 Válido hasta:', expiry.toLocaleDateString(), '(10 años)\n')
  console.log('⚠️  IMPORTANTE:')
  console.log('   - NO subas qz-private-key.pem a Git')
  console.log('   - Ya está en .gitignore')
  console.log('   - Guarda una copia de seguridad en lugar seguro\n')
  console.log('🚀 Siguiente paso:')
  console.log('   - Reinicia el servidor Laravel')
  console.log('   - Prueba: http://localhost:8000/api/qz/status\n')

} catch (error) {
  console.error('\n❌ Error al generar certificados:', error.message)
  console.error('\nDetalles:', error)
  process.exit(1)
}
