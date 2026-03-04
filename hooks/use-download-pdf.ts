import { pdf } from '@react-pdf/renderer'

export const useDownloadPdf = () => {
  const downloadPdf = async (
    pdfDocument: React.ReactElement,
    filename: string
  ) => {
    try {
      const blob = await pdf(pdfDocument as any).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al generar PDF:', error)
      throw error
    }
  }

  return { downloadPdf }
}
