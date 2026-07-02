import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, CheckCircle, XCircle, UserCheck } from 'lucide-react'
import { useRoleCheck } from '../../hooks/useRoleCheck'
import {
  getAllUsers,
  updateUserApprovalStatus,
  updateUserRole,
} from '../../api/userProfiles'
import Card from '../../components/ui/Card'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const isAdmin = useRoleCheck('admin')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null) // user_id em processo

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAdmin, navigate])

  useEffect(() => {
    if (!isAdmin) return
    loadUsers()
  }, [isAdmin])

  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (err) {
      setError(err.message ?? 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  async function handleApproval(userId, isApproved) {
    setActionLoading(userId)
    try {
      const updated = await updateUserApprovalStatus(userId, isApproved)
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, ...updated } : u))
      )
    } catch (err) {
      alert(`Erro: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRoleChange(userId, role) {
    if (!window.confirm(`Tornar este usuário "${role}"?`)) return
    setActionLoading(userId)
    try {
      const updated = await updateUserRole(userId, role)
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, ...updated } : u))
      )
    } catch (err) {
      alert(`Erro: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  if (!isAdmin) return null

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Shield size={22} className="text-ink/70" />
        <div>
          <h1 className="text-xl font-semibold text-ink">Administração de Usuários</h1>
          <p className="text-sm text-ink/60">Gerencie aprovações e papéis dos usuários do sistema</p>
        </div>
      </div>

      {/* Conteúdo */}
      <Card className="overflow-hidden">
        {loading && (
          <div className="p-8 text-ink/60 text-sm text-center">Carregando usuários...</div>
        )}

        {error && (
          <div className="p-6 text-red-600 text-sm">{error}</div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="p-8 text-ink/40 text-sm text-center">Nenhum usuário encontrado.</div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-subtle">
                  <th className="px-6 py-3 text-left font-medium text-ink/70">E-mail</th>
                  <th className="px-6 py-3 text-left font-medium text-ink/70">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-ink/70">Papel</th>
                  <th className="px-6 py-3 text-left font-medium text-ink/70 hidden md:table-cell">Cadastrado em</th>
                  <th className="px-6 py-3 text-right font-medium text-ink/70">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {users.map((u) => {
                  const busy = actionLoading === u.user_id
                  return (
                    <tr key={u.id} className="hover:bg-surface-subtle transition-colors">
                      <td className="px-6 py-4 text-sm text-ink/80 max-w-[240px] truncate">
                        {u.email ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        {u.is_approved ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                            <CheckCircle size={12} />
                            Aprovado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                            <XCircle size={12} />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 text-accent-purple bg-accent-purple-soft border border-accent-purple/20 rounded-full px-2.5 py-0.5 text-xs font-medium">
                            <Shield size={11} />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-ink/60 bg-surface-subtle border border-surface-border rounded-full px-2.5 py-0.5 text-xs font-medium">
                            Usuário
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-ink/60 hidden md:table-cell">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {u.is_approved ? (
                            <button
                              disabled={busy}
                              onClick={() => handleApproval(u.user_id, false)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                              Bloquear
                            </button>
                          ) : (
                            <button
                              disabled={busy}
                              onClick={() => handleApproval(u.user_id, true)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                            >
                              Aprovar
                            </button>
                          )}
                          {u.role !== 'admin' && (
                            <button
                              disabled={busy}
                              onClick={() => handleRoleChange(u.user_id, 'admin')}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-accent-purple/30 text-accent-purple hover:bg-accent-purple-soft disabled:opacity-50 transition-colors"
                            >
                              <UserCheck size={12} />
                              Tornar Admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
