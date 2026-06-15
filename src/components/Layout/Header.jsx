import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/brothers': 'Irmãos',
  '/carts': 'Carrinhos',
  '/locations': 'Locais',
  '/schedule': 'Programação',
  '/report': 'Relatório',
  '/settings': 'Preferências',
}

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [loggingOut, setLoggingOut] = useState(false)

  const title = PAGE_TITLES[pathname] ?? 'Testemunho Público'

  // Logout otimista + redirecionamento explícito para /auth (US-06)
  async function handleSignOut() {
    setLoggingOut(true)
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <header className="bg-surface-card border-b border-surface-border px-6 py-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 rounded-lg hover:bg-surface-subtle">
          <Menu size={20} className="text-ink" />
        </button>
        <h2 className="text-ink font-semibold text-lg">{title}</h2>
      </div>

      {/* Área do usuário — US-09 (email) e US-06 (sair) */}
      <div className="flex items-center gap-3">
        {user?.email && (
          <span className="text-gray-500 text-sm hidden sm:block">{user.email}</span>
        )}
        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          title="Sair"
          aria-label="Sair da conta"
          className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut size={16} />
          <span className="hidden sm:block">{loggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </header>
  )
}
