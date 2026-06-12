import { NavLink } from 'react-router-dom'
import {
  Home,
  Users,
  ShoppingCart,
  MapPin,
  Calendar,
  FileText,
  Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: Home },
  { to: '/brothers', label: 'Irmãos', Icon: Users },
  { to: '/carts', label: 'Carrinhos', Icon: ShoppingCart },
  { to: '/locations', label: 'Locais', Icon: MapPin },
  { to: '/schedule', label: 'Programação', Icon: Calendar },
  { to: '/report', label: 'Relatório', Icon: FileText },
]

function NavItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-slate-700 text-white'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-800 flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-white font-semibold text-base leading-tight">
          Testemunho Público
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">Controle de Arranjo</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`
          }
        >
          <Settings size={18} />
          Preferências
        </NavLink>
      </div>
    </aside>
  )
}
