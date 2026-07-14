import { useState } from 'react'
import SignIn from './SignIn'
import SignUp from './SignUp'
import ForgotPassword from './ForgotPassword'
import Card from '../../components/ui/Card'

const MODES = /** @type {const} */ ({ signIn: 'signIn', signUp: 'signUp', forgotPassword: 'forgotPassword' })

/**
 * Container público de autenticação.
 *
 * Alterna entre as abas "Entrar" (SignIn) e "Criar Conta" (SignUp) via estado
 * local `mode`. O redirecionamento pós-autenticação é responsabilidade do
 * roteamento declarativo do Agente A (reage ao store user ≠ null).
 *
 * Este é o componente importado pelo App.jsx como rota pública.
 */
export default function AuthPage() {
  const [mode, setMode] = useState(MODES.signIn)

  const isSignIn = mode === MODES.signIn

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg px-4">
      <div className="w-full max-w-sm">
        {/* Cabeçalho da marca */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-ink">Testemunho Público</h1>
          <p className="text-ink/60 text-sm mt-1">Controle de Arranjo de Carrinhos</p>
        </div>

        {/* Card principal */}
        <Card className="overflow-hidden">
          {/* Abas de navegação — ocultas na tela de recuperação de senha */}
          {mode !== MODES.forgotPassword && (
            <div className="flex border-b border-surface-border">
              <button
                type="button"
                onClick={() => setMode(MODES.signIn)}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors focus:outline-none ${
                  isSignIn
                    ? 'text-ink border-b-2 border-brand bg-surface-card'
                    : 'text-ink/50 hover:text-ink/80 bg-surface-subtle'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode(MODES.signUp)}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors focus:outline-none ${
                  !isSignIn
                    ? 'text-ink border-b-2 border-brand bg-surface-card'
                    : 'text-ink/50 hover:text-ink/80 bg-surface-subtle'
                }`}
              >
                Criar Conta
              </button>
            </div>
          )}

          {/* Conteúdo do formulário ativo */}
          <div className="px-6 py-6">
            {mode === MODES.signIn && (
              <SignIn
                onSwitchMode={() => setMode(MODES.signUp)}
                onForgotPassword={() => setMode(MODES.forgotPassword)}
              />
            )}
            {mode === MODES.signUp && (
              <SignUp onSwitchMode={() => setMode(MODES.signIn)} />
            )}
            {mode === MODES.forgotPassword && (
              <ForgotPassword onBack={() => setMode(MODES.signIn)} />
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
