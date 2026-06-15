import { useNavigate } from 'react-router-dom'
import { Users, ShoppingCart, MapPin, Clock, Calendar, ArrowRight } from 'lucide-react'
import useAppStore from '../store/useAppStore'

function StatCard({ icon: Icon, value, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-left hover:shadow-md transition-shadow group w-full`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <ArrowRight
          size={16}
          className="text-gray-300 group-hover:text-slate-500 transition-colors"
        />
      </div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </button>
  )
}

export default function Dashboard() {
  const store = useAppStore()
  const { brothers, carts, locations, slots, scheduleWeeks, loading, error } = store
  const navigate = useNavigate()

  if (loading) return <div className="p-8 text-slate-500">Carregando...</div>

  const activeBrothers  = brothers.length
  const activeCarts     = carts.length
  const activeLocations = locations.length
  const activeSlots     = slots.length
  const scheduledWeeks  = scheduleWeeks.length

  const cards = [
    {
      icon: Users,
      value: activeBrothers,
      label: 'Irmãos ativos',
      color: 'bg-blue-500',
      route: '/brothers',
    },
    {
      icon: ShoppingCart,
      value: activeCarts,
      label: 'Carrinhos ativos',
      color: 'bg-emerald-500',
      route: '/carts',
    },
    {
      icon: MapPin,
      value: activeLocations,
      label: 'Locais ativos',
      color: 'bg-violet-500',
      route: '/locations',
    },
    {
      icon: Clock,
      value: activeSlots,
      label: 'Turnos configurados',
      color: 'bg-orange-500',
      route: '/locations',
    },
  ]

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Visão geral do arranjo de testemunho público
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} onClick={() => navigate(card.route)} />
        ))}
      </div>

      {/* Ações rápidas */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">
          Ações rápidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <QuickBtn
            icon={Calendar}
            label="Nova semana"
            desc="Abrir programação da semana atual"
            onClick={() => navigate('/schedule')}
          />
          <QuickBtn
            icon={Users}
            label="Cadastrar irmão"
            desc="Adicionar novo participante"
            onClick={() => navigate('/brothers')}
          />
          <QuickBtn
            icon={MapPin}
            label="Configurar local"
            desc="Locais e turnos de TP"
            onClick={() => navigate('/locations')}
          />
        </div>
      </div>

      {/* Info de semanas */}
      {scheduledWeeks > 0 && (
        <p className="text-xs text-slate-400 mt-6 text-center">
          {scheduledWeeks} semana{scheduledWeeks !== 1 ? 's' : ''} com programação registrada
        </p>
      )}
    </div>
  )
}

function QuickBtn({ icon: Icon, label, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-slate-400 hover:bg-gray-50 transition-colors text-left"
    >
      <Icon size={16} className="text-slate-500 shrink-0" />
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </button>
  )
}
