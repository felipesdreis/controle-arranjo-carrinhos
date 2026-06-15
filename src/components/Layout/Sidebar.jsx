import { NavLink } from 'react-router-dom'
import {
  Home,
  Users,
  ShoppingCart,
  MapPin,
  Calendar,
  FileText,
  Settings,
  Shield,
} from 'lucide-react'
import AdminOnly from '../AdminOnly'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: Home },
  { to: '/brothers', label: 'Irmãos', Icon: Users },
  { to: '/carts', label: 'Carrinhos', Icon: ShoppingCart },
  { to: '/locations', label: 'Locais', Icon: MapPin },
  { to: '/schedule', label: 'Programação', Icon: Calendar },
  { to: '/report', label: 'Relatório', Icon: FileText },
]

function NavItem({ to, label, Icon, onClose }) {
  return (
    <NavLink
      to={to}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-mint/10 text-brand-mint'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-brand-dark flex flex-col shrink-0
          transform transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0 md:transform-none`}
      >
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-white font-bold text-base leading-tight">
            Testemunho Público
          </h1>
          <p className="text-white/50 text-xs mt-0.5">Controle de Arranjo</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} onClose={onClose} />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <AdminOnly>
            <NavLink
              to="/admin/users"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-mint/10 text-brand-mint'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Shield size={18} />
              Administração
            </NavLink>
          </AdminOnly>
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-mint/10 text-brand-mint'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Settings size={18} />
            Preferências
          </NavLink>
        </div>
      </aside>
    </>
  )
}
