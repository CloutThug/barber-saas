import { createServer } from '@/lib/supabase-server'

export default async function Home() {
  const supabase = await createServer()
  // Testando a conexão buscando as barbearias cadastradas
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')

  if (error) {
    console.error('Erro ao conectar:', error.message)
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Conexão Supabase</h1>
      
      {error && <p className="text-red-500">Erro: {error.message}</p>}
      
      {!error && tenants && tenants.length === 0 && (
        <p className="text-yellow-600">Conectado com sucesso, mas a tabela 'tenants' está vazia.</p>
      )}

      <ul className="list-disc pl-5">
        {tenants?.map((tenant) => (
          <li key={tenant.id}>{tenant.name}</li>
        ))}
      </ul>
    </main>
  )
}