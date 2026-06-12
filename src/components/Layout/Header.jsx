import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/brothers': 'Irmãos',
  '/carts': 'Carrinhos',
  '/locations': 'Locais',
  '/schedule': 'Programação',
  '/report': 'Relatório',
  '/settings': 'Preferências',
}

export default function Header() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'Testemunho Público'

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
      <h2 className="text-gray-800 font-semibold text-lg">{title}</h2>
      <span className="text-gray-400 text-sm">Testemunho Público</span>
    </header>
  )
}
