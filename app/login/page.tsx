'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

// Componente para o formulário de Login
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Credenciais inválidas. Verifique seu email e senha.')
      console.error('Erro no login:', error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form className="space-y-6" onSubmit={handleLogin}>
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <input
            id="email-address-login"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="relative block w-full rounded-t-md border-0 px-3 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <input
            id="password-login"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="relative block w-full rounded-b-md border-0 px-3 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {loading ? 'Carregando...' : 'Entrar'}
        </button>
      </div>
    </form>
  )
}

// Componente para o formulário de Cadastro
function SignUpForm() {
  const [name, setName] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          tenant_name: tenantName,
        },
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-center">
        <h3 className="text-lg font-medium text-green-800">Cadastro realizado!</h3>
        <p className="mt-2 text-sm text-green-700">
          Enviamos um link de confirmação para o seu email. Por favor, verifique sua caixa de entrada para ativar sua conta.
        </p>
      </div>
    )
  }
  
  return (
    <form className="space-y-6" onSubmit={handleSignUp}>
       {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}
      <div className="rounded-md shadow-sm -space-y-px">
         <div>
          <input
            name="name"
            type="text"
            required
            className="relative block w-full rounded-t-md border-0 px-3 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <input
            name="tenantName"
            type="text"
            required
            className="relative block w-full border-0 px-3 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Nome da Barbearia"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
          />
        </div>
        <div>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="relative block w-full border-0 px-3 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <input
            name="password"
            type="password"
            required
            className="relative block w-full border-0 px-3 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <input
            name="confirmPassword"
            type="password"
            required
            className="relative block w-full rounded-b-md border-0 px-3 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Confirme a Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {loading ? 'Criando conta...' : 'Criar conta grátis'}
        </button>
      </div>
    </form>
  )
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Barber SaaS
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {activeTab === 'login'
              ? 'Entre para gerenciar sua barbearia'
              : 'Crie sua conta e comece a usar'}
          </p>
        </div>
        
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('login')}
              className={`${
                activeTab === 'login'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
            >
              Entrar
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`${
                activeTab === 'signup'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
            >
              Cadastrar
            </button>
          </nav>
        </div>

        <div>
          {activeTab === 'login' ? <LoginForm /> : <SignUpForm />}
        </div>
      </div>
    </div>
  )
}