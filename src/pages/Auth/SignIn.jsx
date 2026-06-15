import { useState } from 'react'
import { Mail, Lock, LogIn } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import { validateEmail, validatePassword } from './authValidation'

/**
 * Formulário de login (US-05).
 *
 * Props:
 *   onSwitchMode — callback chamado quando o usuário quer ir para Sign Up
 */
export default function SignIn({ onSwitchMode }) {
  const signIn = useAuthStore((s) => s.signIn)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // Validação frontend antes de qualquer chamada à API
    const emailError = validateEmail(email)
    if (emailError) { setError(emailError); return }

    const passwordError = validatePassword(password)
    if (passwordError) { setError(passwordError); return }

    setLoading(true)
    try {
      const result = await signIn(email.trim(), password)
      if (!result.ok) {
        // Exibe a mensagem do backend sem revelar se o email existe
        setError(result.error ?? 'Email ou senha incorretos.')
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
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label
          htmlFor="signin-email"
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
            id="signin-email"
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
          htmlFor="signin-password"
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
            id="signin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
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
        <LogIn size={16} />
        {loading ? 'Entrando…' : 'Entrar'}
      </button>

      <p className="text-center text-sm text-ink/60">
        Não tem uma conta?{' '}
        <button
          type="button"
          onClick={onSwitchMode}
          className="font-medium text-ink underline underline-offset-2 hover:text-brand transition-colors"
        >
          Criar conta
        </button>
      </p>
    </form>
  )
}
