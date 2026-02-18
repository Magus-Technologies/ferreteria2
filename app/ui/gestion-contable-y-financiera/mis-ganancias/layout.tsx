import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Mis Ganancias | Ferretería',
    description: 'Gestión de ganancias y reportes financieros',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
