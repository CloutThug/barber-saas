# Barber SaaS - Sistema de Gestao e Agendamento para Barbearias

**Projeto academico desenvolvido para a disciplina de Projeto do curso de Analise e Desenvolvimento de Sistemas (ADS) da Univali.**

O Barber SaaS e um Software as a Service (SaaS) que digitaliza a gestao de barbearias locais, substituindo agendas manuais por um sistema automatizado de agendamentos, controle de clientes e fidelizacao por assinatura (plano mensalista).

---

## Stack Tecnologica

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Linguagem** | TypeScript |
| **Estilizacao** | Tailwind CSS 4 + ShadcnUI |
| **Backend / Banco de Dados** | Supabase (PostgreSQL) |
| **Autenticacao** | Supabase Auth |
| **Deploy** | Vercel |
| **Metodologia** | SCRUM (gerenciado via Notion) |

## Arquitetura Multi-tenant

O sistema utiliza uma arquitetura **multi-tenant com isolamento por `tenant_id`**, permitindo que multiplas barbearias utilizem a mesma instancia da aplicacao com total separacao de dados.

- **Isolamento de dados:** Cada registro nas tabelas principais (`customers`, `appointments`, `services`, `subscriptions`) possui um `tenant_id` vinculado a barbearia proprietaria.
- **Row Level Security (RLS):** Politicas no Supabase garantem que cada usuario autenticado so acesse dados do seu proprio tenant.
- **Funcao auxiliar:** A funcao `is_my_tenant(row_tenant_id)` valida o acesso em nivel de banco de dados.

## Funcionalidades

- Calendario mensal com visualizacao de agendamentos
- Agenda diaria com slots de horario (oculta horarios passados)
- Cadastro de clientes (avulso ou mensalista)
- CRUD de servicos com preco e duracao
- Gestao de planos mensais (mensalistas)
- Controle de assinaturas e renovacao
- Autenticacao com email/senha
- Tema dark premium com acentos dourados
- Interface responsiva (desktop e mobile com sidebar colapsavel)

## Como Executar

### Pre-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Instalacao

```bash
# Clone o repositorio
git clone https://github.com/CloutThug/barber-saas.git
cd barber-saas

# Instale as dependencias
npm install

# Configure as variaveis de ambiente
cp .env.example .env.local
# Edite .env.local com as credenciais do seu projeto Supabase

# Execute o servidor de desenvolvimento
npm run dev
```

O sistema estara disponivel em `http://localhost:3000`.

### Variaveis de Ambiente

Consulte o arquivo `.env.example` para a lista completa de variaveis necessarias.

## Estrutura do Projeto

```
app/                    # Rotas (Next.js App Router)
  dashboard/            # Area autenticada (agenda, clientes, servicos, planos)
  login/                # Autenticacao
  auth/                 # Callbacks e signout
components/             # Componentes React (UI, dashboard, sidebar, header)
lib/                    # Clientes Supabase (server/browser) e utilitarios
types/                  # Tipos TypeScript gerados do Supabase
supabase/               # Migracoes SQL e funcoes de banco
docs/                   # Documentacao academica (relatorio PDF)
```

## Documentacao Academica

O relatorio completo do projeto esta disponivel na pasta [`/docs`](./docs) deste repositorio.

## Autor

Desenvolvido por **Joao Pedro Possan Foschiera** como projeto academico para a Univali - Campus Florianopolis.

## Licenca

Projeto academico - uso educacional.
