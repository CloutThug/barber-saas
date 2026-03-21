'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { ScissorsIcon } from 'lucide-react'

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

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciais invalidas. Verifique seu email e senha.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form className="space-y-4" onSubmit={handleLogin}>
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}
      <div className="space-y-3">
        <input
          type="email"
          autoComplete="email"
          required
          className="block w-full rounded-md border-0 px-3 py-2.5 bg-secondary text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-primary sm:text-sm transition-all duration-200"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          autoComplete="current-password"
          required
          className="block w-full rounded-md border-0 px-3 py-2.5 bg-secondary text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-primary sm:text-sm transition-all duration-200"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}

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
      setError('As senhas nao conferem.')
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
      <div className="rounded-md bg-primary/10 border border-primary/20 p-4 text-center animate-fade-in">
        <h3 className="text-lg font-medium text-primary">Cadastro realizado!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos um link de confirmacao para o seu email. Verifique sua caixa de entrada para ativar sua conta.
        </p>
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSignUp}>
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}
      <div className="space-y-3">
        <input
          type="text"
          required
          className="block w-full rounded-md border-0 px-3 py-2.5 bg-secondary text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-primary sm:text-sm transition-all duration-200"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          required
          className="block w-full rounded-md border-0 px-3 py-2.5 bg-secondary text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-primary sm:text-sm transition-all duration-200"
          placeholder="Nome da Barbearia"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
        />
        <input
          type="email"
          autoComplete="email"
          required
          className="block w-full rounded-md border-0 px-3 py-2.5 bg-secondary text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-primary sm:text-sm transition-all duration-200"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          className="block w-full rounded-md border-0 px-3 py-2.5 bg-secondary text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-primary sm:text-sm transition-all duration-200"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          required
          className="block w-full rounded-md border-0 px-3 py-2.5 bg-secondary text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-primary sm:text-sm transition-all duration-200"
          placeholder="Confirme a Senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
      >
        {loading ? 'Criando conta...' : 'Criar conta gratis'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        {/* Logo e titulo */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ScissorsIcon className="size-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Barber SaaS
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeTab === 'login'
              ? 'Entre para gerenciar sua barbearia'
              : 'Crie sua conta e comece a usar'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('login')}
              className={`${
                activeTab === 'login'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              } whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-all duration-200`}
            >
              Entrar
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`${
                activeTab === 'signup'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              } whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-all duration-200`}
            >
              Cadastrar
            </button>
          </nav>
        </div>

        {/* Formulario */}
        <div className="animate-slide-up">
          {activeTab === 'login' ? <LoginForm /> : <SignUpForm />}
        </div>
      </div>
    </div>
  )
}
