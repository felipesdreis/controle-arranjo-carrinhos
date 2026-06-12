import { useState } from 'react'
import SignIn from './SignIn'
import SignUp from './SignUp'

const MODES = /** @type {const} */ ({ signIn: 'signIn', signUp: 'signUp' })

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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        {/* Cabeçalho da marca */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Testemunho Público</h1>
          <p className="text-slate-500 text-sm mt-1">Controle de Arranjo de Carrinhos</p>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Abas de navegação */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setMode(MODES.signIn)}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors focus:outline-none ${
                isSignIn
                  ? 'text-slate-800 border-b-2 border-slate-800 bg-white'
                  : 'text-slate-400 hover:text-slate-600 bg-slate-50'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode(MODES.signUp)}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors focus:outline-none ${
                !isSignIn
                  ? 'text-slate-800 border-b-2 border-slate-800 bg-white'
                  : 'text-slate-400 hover:text-slate-600 bg-slate-50'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Conteúdo do formulário ativo */}
          <div className="px-6 py-6">
            {isSignIn
              ? <SignIn onSwitchMode={() => setMode(MODES.signUp)} />
              : <SignUp onSwitchMode={() => setMode(MODES.signIn)} />
            }
          </div>
        </div>
      </div>
    </div>
  )
}
