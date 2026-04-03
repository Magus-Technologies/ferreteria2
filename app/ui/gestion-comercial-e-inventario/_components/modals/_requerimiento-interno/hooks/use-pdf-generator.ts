import { useState } from "react"
import { message } from "antd"
import { getAuthToken } from "~/lib/api"

export function usePdfGenerator() {
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [openPdfModal, setOpenPdfModal] = useState(false)

    const generatePdf = async (requerimientoId: number) => {
        setPdfLoading(true)
        try {
            const token = getAuthToken()
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pdf/requerimiento-interno/${requerimientoId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            if (!res.ok) throw new Error('Error al generar PDF')
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            setPdfBlobUrl(url)
            setOpenPdfModal(true)
        } catch (e) {
            console.error(e)
            message.error('Error al generar PDF')
        } finally {
            setPdfLoading(false)
        }
    }

    const closePdfModal = () => {
        setOpenPdfModal(false)
        if (pdfBlobUrl) {
            URL.revokeObjectURL(pdfBlobUrl)
            setPdfBlobUrl(null)
        }
    }

    return {
        pdfBlobUrl,
        pdfLoading,
        openPdfModal,
        generatePdf,
        closePdfModal,
    }
}
