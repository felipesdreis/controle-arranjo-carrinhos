import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, KeyRound } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import { validatePassword, validatePasswordMatch } from './authValidation'
import Card from '../../components/ui/Card'

/**
 * Tela de definição de nova senha, acessada pelo link de recuperação do email.
 * O Supabase autentica uma sessão de recuperação ao clicar no link (evento
 * PASSWORD_RECOVERY) — esta tela só chama updateUser({ password }) nessa sessão.
 */
export default function UpdatePassword() {
  const navigate = useNavigate()
  const updatePassword = useAuthStore((s) => s.updatePassword)
  const signOut = useAuthStore((s) => s.signOut)

  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const passwordError = validatePassword(password)
    if (passwordError) { setError(passwordError); return }

    const matchError = validatePasswordMatch(password, confirmation)
    if (matchError) { setError(matchError); return }

    setLoading(true)
    try {
      const result = await updatePassword(password)
      if (!result.ok) {
        setError(result.error ?? 'Não foi possível atualizar a senha.')
        return
      }
      await signOut()
      navigate('/auth', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-ink">Definir nova senha</h1>
          <p className="text-ink/60 text-sm mt-1">Controle de Arranjo de Carrinhos</p>
        </div>

        <Card className="overflow-hidden">
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="update-password" className="block text-sm font-medium text-ink">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none"
                  />
                  <input
                    id="update-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-surface-border text-sm text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="update-password-confirm" className="block text-sm font-medium text-ink">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none"
                  />
                  <input
                    id="update-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-surface-border text-sm text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <KeyRound size={16} />
                {loading ? 'Salvando…' : 'Salvar nova senha'}
              </button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
