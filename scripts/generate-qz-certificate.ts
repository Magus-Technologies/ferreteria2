import * as jsrsasign from 'jsrsasign'
import * as fs from 'fs'
import * as path from 'path'

console.log('🔐 Generando certificados para QZ Tray...\n')

// Obtener directorio de salida desde argumentos o usar directorio actual
const outputDir = process.argv[2] || path.join(process.cwd(), 'certificates')

console.log('📁 Directorio de salida:', outputDir)
console.log('')
console.log('💡 Uso:')
console.log('   npx tsx scripts/generate-qz-certificate.ts [directorio]')
console.log('')
console.log('   Ejemplos:')
console.log('   - npx tsx scripts/generate-qz-certificate.ts ./temp-certs')
console.log('   - npx tsx scripts/generate-qz-certificate.ts /var/www/backend/storage/certificates')
console.log('')

// Crear directorio si no existe
if (!fs.existsSync(outputDir)) {
  console.log('📁 Creando directorio...')
  fs.mkdirSync(outputDir, { recursive: true })
  console.log('✅ Directorio creado')
}

try {
  // Generar par de llaves RSA de 2048 bits
  console.log('⏳ Generando par de llaves RSA (2048 bits)...')
  const keypair = jsrsasign.KEYUTIL.generateKeypair('RSA', 2048)
  console.log('✅ Par de llaves generado')

  // Exportar llave privada (PKCS8)
  console.log('⏳ Exportando llave privada...')
  const privateKeyPEM = jsrsasign.KEYUTIL.getPEM(keypair.prvKeyObj, 'PKCS8PRV')
  fs.writeFileSync(path.join(outputDir, 'qz-private-key.pem'), privateKeyPEM)
  console.log('✅ Llave privada guardada')

  // Exportar llave pública
  console.log('⏳ Exportando llave pública...')
  const publicKeyPEM = jsrsasign.KEYUTIL.getPEM(keypair.pubKeyObj)
  fs.writeFileSync(path.join(outputDir, 'qz-public-key.pem'), publicKeyPEM)
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
  fs.writeFileSync(path.join(outputDir, 'qz-certificate.pem'), certPEM)
  console.log('✅ Certificado X.509 generado')

  console.log('\n✅ ¡Certificados generados exitosamente!\n')
  console.log('📁 Archivos creados en:', outputDir)
  console.log('   - qz-private-key.pem  (⚠️  MANTENER EN SECRETO)')
  console.log('   - qz-public-key.pem   (compartir con clientes)')
  console.log('   - qz-certificate.pem  (certificado X.509)\n')
  console.log('📅 Válido desde:', now.toLocaleDateString())
  console.log('📅 Válido hasta:', expiry.toLocaleDateString(), '(10 años)\n')
  console.log('⚠️  IMPORTANTE:')
  console.log('   - NO subas qz-private-key.pem a Git')
  console.log('   - Guarda una copia de seguridad en lugar seguro\n')
  console.log('🚀 Siguiente paso (Servidores Separados):')
  console.log('   1. Copiar al servidor backend:')
  console.log('      scp ' + path.join(outputDir, '*.pem') + ' usuario@backend:/var/www/backend/storage/certificates/')
  console.log('   2. Ajustar permisos en backend:')
  console.log('      chmod 600 qz-private-key.pem')
  console.log('      chmod 644 qz-certificate.pem')
  console.log('   3. Verificar:')
  console.log('      curl https://backend.tudominio.com/api/qz/status\n')

} catch (error) {
  console.error('\n❌ Error al generar certificados:', (error as Error).message)
  console.error('\nDetalles:', error)
  process.exit(1)
}
