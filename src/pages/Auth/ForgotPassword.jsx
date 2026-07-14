import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import { validateEmail } from './authValidation'

/**
 * Formulário de "esqueci minha senha": envia link de recuperação por email.
 *
 * Props:
 *   onBack — callback chamado quando o usuário quer voltar para o login
 */
export default function ForgotPassword({ onBack }) {
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset)

  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const emailError = validateEmail(email)
    if (emailError) { setError(emailError); return }

    setLoading(true)
    try {
      await requestPasswordReset(email.trim())
      // Sempre mostra sucesso — nunca revela se o email existe no sistema
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700"
        >
          Se este email estiver cadastrado, você vai receber um link para redefinir a senha.
        </div>
        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-sm font-medium text-ink underline underline-offset-2 hover:text-brand transition-colors"
        >
          Voltar para o login
        </button>
      </div>
    )
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

      <p className="text-sm text-ink/60">
        Informe seu email cadastrado e enviaremos um link para redefinir sua senha.
      </p>

      <div className="space-y-1">
        <label
          htmlFor="forgot-email"
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
            id="forgot-email"
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

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={16} />
        {loading ? 'Enviando…' : 'Enviar link de recuperação'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-sm text-ink/60 underline underline-offset-2 hover:text-brand transition-colors"
      >
        Voltar para o login
      </button>
    </form>
  )
}
