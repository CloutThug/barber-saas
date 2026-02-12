import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <h2 className="text-2xl font-bold tracking-tight text-red-800">
          Oops! Algo deu errado.
        </h2>
        <p className="mt-4 text-gray-600">
          Não conseguimos autenticar sua conta. O link de verificação pode ter
          expirado ou sido usado.
        </p>
        <p className="mt-2 text-gray-600">
          Por favor, tente fazer login novamente ou solicite um novo link de
          verificação.
        </p>
        <div className="mt-6">
          <Link href="/login">
            <a className="text-indigo-600 hover:text-indigo-500">
              Voltar para a página de Login
            </a>
          </Link>
        </div>
      </div>
    </div>
  )
}
