import * as jsrsasign from 'jsrsasign'
import * as fs from 'fs'
import * as path from 'path'


// Obtener directorio de salida desde argumentos o usar directorio actual
const outputDir = process.argv[2] || path.join(process.cwd(), 'certificates')



// Crear directorio si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

try {
  // Generar par de llaves RSA de 2048 bits
  const keypair = jsrsasign.KEYUTIL.generateKeypair('RSA', 2048)

  // Exportar llave privada (PKCS8)

  // Exportar llave privada (PKCS8)
  const privateKeyPEM = jsrsasign.KEYUTIL.getPEM(keypair.prvKeyObj, 'PKCS8PRV')
  fs.writeFileSync(path.join(outputDir, 'qz-private-key.pem'), privateKeyPEM)

  // Exportar llave pública
  const publicKeyPEM = jsrsasign.KEYUTIL.getPEM(keypair.pubKeyObj)
  fs.writeFileSync(path.join(outputDir, 'qz-public-key.pem'), publicKeyPEM)

  // Crear certificado X.509
  
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

} catch (error) {
  console.error('\n❌ Error al generar certificados:', (error as Error).message)
  console.error('\nDetalles:', error)
  process.exit(1)
}
