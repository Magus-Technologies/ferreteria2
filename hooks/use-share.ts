export async function compartir({
  blob,
  fileName,
}: {
  blob: Blob
  fileName: string
}) {
  if (!/\.[a-zA-Z]+$/.test(fileName)) {
    console.error('El archivo debe tener una extensión')
    return
  }

  const file = new File([blob], fileName, { type: blob.type })
  const data = { files: [file], title: fileName, text: fileName }

  try {
    // Web Share API disponible y soporta archivos
    if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare(data)) {
      await navigator.share(data)
      return
    }
  } catch (err) {
    // Si el usuario cancela el share, no hacer fallback
    if (err instanceof DOMException && err.name === 'AbortError') return
    console.error('Error en Web Share API:', err)
  }

  // Fallback: descargar el archivo directamente
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
