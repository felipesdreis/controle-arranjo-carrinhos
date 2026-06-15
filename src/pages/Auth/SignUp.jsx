import { useState } from 'react'
import { Mail, Lock, UserPlus } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import { validateEmail, validatePassword, validatePasswordMatch } from './authValidation'

/**
 * Formulário de registro de nova conta (US-04).
 *
 * Props:
 *   onSwitchMode — callback chamado quando o usuário quer ir para Sign In
 */
export default function SignUp({ onSwitchMode }) {
  const signUp = useAuthStore((s) => s.signUp)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState(null)
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setEmailAlreadyExists(false)

    // Validação frontend — nenhuma chamada HTTP se inválido
    const emailError = validateEmail(email)
    if (emailError) { setError(emailError); return }

    const passwordError = validatePassword(password)
    if (passwordError) { setError(passwordError); return }

    const matchError = validatePasswordMatch(password, confirmation)
    if (matchError) { setError(matchError); return }

    setLoading(true)
    try {
      const result = await signUp(email.trim(), password)
      if (!result.ok) {
        setError(result.error ?? 'Não foi possível criar a conta.')
        // Detecta email já registrado para oferecer atalho de login
        const mensagem = (result.error ?? '').toLowerCase()
        if (mensagem.includes('já') || mensagem.includes('registrado') || mensagem.includes('already')) {
          setEmailAlreadyExists(true)
        }
      }
      // Em sucesso o roteamento reage ao store user ≠ null — nada a fazer aqui
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          <p>{error}</p>
          {emailAlreadyExists && (
            <p className="mt-1">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={onSwitchMode}
                className="font-medium underline underline-offset-2 hover:text-red-900 transition-colors"
              >
                Faça login aqui.
              </button>
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <label
          htmlFor="signup-email"
          className="block text-sm font-medium text-ink"
        >
          Email
        </label>
        <div className="relative">
          <Mail
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none"
          />
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-surface-border text-sm text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="signup-password"
          className="block text-sm font-medium text-ink"
        >
          Senha
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none"
          />
          <input
            id="signup-password"
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
        <label
          htmlFor="signup-confirmation"
          className="block text-sm font-medium text-ink"
        >
          Confirmar senha
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none"
          />
          <input
            id="signup-confirmation"
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
        <UserPlus size={16} />
        {loading ? 'Criando conta…' : 'Criar Conta'}
      </button>

      <p className="text-center text-sm text-ink/60">
        Já tem uma conta?{' '}
        <button
          type="button"
          onClick={onSwitchMode}
          className="font-medium text-ink underline underline-offset-2 hover:text-brand transition-colors"
        >
          Entrar
        </button>
      </p>
    </form>
  )
}
