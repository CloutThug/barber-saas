# Supabase CLI - Guia de Uso

Este projeto está configurado para usar o Supabase CLI para gerenciar o banco de dados e serviços.

## Instalação

Se ainda não tem o Supabase CLI instalado:

### Windows (PowerShell)
```powershell
scoop install supabase
```

Ou via npm:
```bash
npm install -g supabase
```

### Outras plataformas
```bash
# macOS
brew install supabase/tap/supabase

# Linux
brew install supabase/tap/supabase
```

## Configuração

O access token já está configurado no arquivo `.env.local`:
```
SUPABASE_ACCESS_TOKEN="sbp_5cfe0bfe91460c37e2b96a44eef6fe13eb885626"
```

## Comandos Úteis

### Login
```bash
# Login com access token (já configurado via .env.local)
npm run supabase:login

# Verificar projetos disponíveis
npm run supabase:status
```

### Link com o projeto remoto
```bash
npm run supabase:link
```

### Migrations (Migrações)

```bash
# Criar nova migration
npm run supabase migration new nome_da_migration

# Aplicar migrations localmente
npm run supabase db push

# Ver diferenças entre local e remoto
npm run supabase db diff

# Gerar migration a partir das diferenças
npm run supabase db diff --schema public | npm run supabase migration new schema_changes
```

### Banco de Dados

```bash
# Conectar ao banco remoto via psql
npm run supabase:db

# Ou executar comandos SQL diretamente
npx supabase db query "SELECT * FROM tenants LIMIT 10"

# Resetar o banco de dados local
npx supabase db reset
```

### Funções Edge

```bash
# Servir funções localmente
npx supabase functions serve

# Deployar função específica
npx supabase functions deploy nome-da-funcao

# Ver logs das funções
npx supabase functions logs nome-da-funcao
```

### Tipagens TypeScript

```bash
# Gerar tipos TypeScript a partir do schema remoto
npm run supabase:gen-types
```

### Qualquer comando Supabase

```bash
# Usar o CLI diretamente
npm run supabase -- <comando>

# Exemplo: listar branches
npm run supabase -- branches list
```

## Desenvolvimento Local

Para rodar o Supabase localmente (Docker necessário):

```bash
# Iniciar serviços locais
supabase start

# Parar serviços
supabase stop

# Ver status dos serviços
supabase status
```

## Documentação

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Migrations Guide](https://supabase.com/docs/guides/cli/local-development)
- [Edge Functions](https://supabase.com/docs/guides/functions)
