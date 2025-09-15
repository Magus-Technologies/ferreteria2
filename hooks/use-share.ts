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

  const data = {
    files: [
      new File([blob], fileName, {
        type: blob.type,
      }),
    ],
    title: fileName,
    text: fileName,
  }

  try {
    if (!navigator.canShare(data)) {
      console.error("Can't share")
    }
    await navigator.share(data)
  } catch (err) {
    console.error(err)
  }
}
