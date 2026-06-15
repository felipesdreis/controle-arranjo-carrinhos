import { useNavigate } from 'react-router-dom'
import { Users, ShoppingCart, MapPin, Clock, Calendar, ArrowRight } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Dashboard() {
  const store = useAppStore()
  const { brothers, carts, locations, slots, scheduleWeeks, loading, error } = store
  const navigate = useNavigate()

  if (loading) return <div className="p-8 text-ink/60">Carregando...</div>

  const activeBrothers  = brothers.length
  const activeCarts     = carts.length
  const activeLocations = locations.length
  const activeSlots     = slots.length
  const scheduledWeeks  = scheduleWeeks.length

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-ink/60 text-sm mt-1">
          Visão geral do arranjo de testemunho público
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button onClick={() => navigate('/brothers')} className="text-left">
          <StatCard
            icon={Users}
            color="blue"
            accent="#1558D6"
            value={activeBrothers}
            label="Irmãos ativos"
          />
        </button>
        <button onClick={() => navigate('/carts')} className="text-left">
          <StatCard
            icon={ShoppingCart}
            color="green"
            accent="#1B6B4E"
            value={activeCarts}
            label="Carrinhos ativos"
          />
        </button>
        <button onClick={() => navigate('/locations')} className="text-left">
          <StatCard
            icon={MapPin}
            color="purple"
            accent="#6B3AC8"
            value={activeLocations}
            label="Locais ativos"
          />
        </button>
        <button onClick={() => navigate('/locations')} className="text-left">
          <StatCard
            icon={Clock}
            color="orange"
            accent="#C85A12"
            value={activeSlots}
            label="Turnos configurados"
          />
        </button>
      </div>

      {/* Ações rápidas */}
      <Card className="p-5 md:col-span-2">
        <h2 className="font-semibold text-ink/70 mb-4 text-sm uppercase tracking-wide">
          Ações rápidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="subtle" onClick={() => navigate('/schedule')}>
            <Calendar size={16} />
            Nova semana
          </Button>
          <Button variant="subtle" onClick={() => navigate('/brothers')}>
            <Users size={16} />
            Cadastrar irmão
          </Button>
          <Button variant="subtle" onClick={() => navigate('/locations')}>
            <MapPin size={16} />
            Configurar local
          </Button>
          <Button variant="subtle" onClick={() => navigate('/report')}>
            <ArrowRight size={16} />
            Ver relatório
          </Button>
        </div>
      </Card>

      {/* Info de semanas */}
      {scheduledWeeks > 0 && (
        <p className="text-xs text-ink/40 mt-6 text-center">
          {scheduledWeeks} semana{scheduledWeeks !== 1 ? 's' : ''} com programação registrada
        </p>
      )}
    </div>
  )
}
