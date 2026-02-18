# 🔍 Guia de Debug - Erro ao Criar Agendamento

## Problema
Erro genérico "Erro ao criar agendamento" ao submeter o formulário.

## Causas Comuns em Multi-Tenancy com RLS

1. ❌ **Tenant ID não passado corretamente**
   - O `tenant_id` do usuário não está sendo recuperado
   - A política RLS rejeita inserts sem tenant_id válido

2. ❌ **Violação de Chave Estrangeira**
   - O `customer_id` ou `service_id` não existe no banco
   - Pertencem a outro tenant

3. ❌ **Política RLS Bloqueando Insert**
   - O usuário não tem permissão para inserir appointments
   - A política exige que `tenant_id` bata com o do usuário

4. ❌ **Coluna Obrigatória Faltando**
   - Há colunas `NOT NULL` na tabela que não estão sendo preenchidas
   - Ex: `created_at`, `id` (se não tiver default)

## 🛠️ Como Debugar

### Passo 1: Ativar Logging no Navegador
1. Abra a página `/dashboard/appointments/new`
2. Pressione `F12` para abrir DevTools
3. Vá para a aba **Console**
4. Submeta o formulário
5. **Verifique as mensagens de erro** no console

O novo código agora loga:
- ✅ Tenant ID encontrado
- ✅ Dados validados
- ✅ Verificação de customer e service
- ❌ Erro específico com mensagem, código e dica

### Passo 2: Investigar a Tabela

Execute o script de debug:

```bash
npm run debug:appointments
```

Este script irá:
1. Verificar se a tabela é acessível
2. Tentar uma inserção de teste
3. Mostrar clientes e serviços disponíveis
4. Exibir mensagens de erro específicas

### Passo 3: Verificar no Dashboard

Acesse o Dashboard do Supabase:
https://supabase.com/dashboard/project/wpzrexrxlmcstzzmnoni

📍 **Dados > appointments**
- Visualizar estrutura exata da tabela
- Ver quais colunas são obrigatórias
- Conferir defaults

📍 **Autenticação > Políticas (RLS)**
- Verificar políticas ativas em `appointments`
- Confirmar que INSERT está permitido para seu role

## 📋 Estrutura Esperada da Tabela

A tabela `appointments` deve ter estas colunas **no mínimo**:

```sql
id              UUID        (PRIMARY KEY, DEFAULT gen_random_uuid())
customer_id     UUID        (FOREIGN KEY -> customers.id)
service_id      UUID        (FOREIGN KEY -> services.id)
tenant_id       UUID        (FOREIGN KEY -> tenants.id)
scheduled_at    TIMESTAMP   (NOT NULL)
status          TEXT        (DEFAULT 'scheduled')
created_at      TIMESTAMP   (DEFAULT NOW())
```

## 🔐 Políticas RLS Esperadas

Deve haver uma política para **INSERT** algo como:

```sql
CREATE POLICY "Permissão insert para usuários"
  ON appointments
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid()::text);
```

Ou usando uma função que busca tenant_id do usuário:

```sql
WITH CHECK (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));
```

## 📝 Mensagens de Erro Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `new row violates row-level security policy` | RLS rejeita insert | Verificar política e tenant_id |
| `violates foreign key constraint` | customer_id ou service_id inválido | Usar IDs do mesmo tenant |
| `null value in column "X" violates not-null constraint` | Coluna obrigatória não preenchida | Adicionar coluna ao insert |
| `permission denied for schema public` | Sem permissão de escrita | Verificar RLS e role do usuário |

## 🚀 Próximos Passos

1. **Rode o script de debug:**
   ```bash
   npm run debug:appointments
   ```

2. **Compartilhe a saída** (pode estar em português)

3. **Verifique o Console do Navegador** (F12 → Console)

4. **Acesse o Dashboard** para confirmar estrutura

5. **Vou ajustar o código** conforme necessário

## 💡 Dicas

- Os **logs agora incluem tenant_id, customer_id, service_id** que estão sendo enviados
- O **error.hint do Supabase** frequentemente dá pista sobre a solução
- Se o erro for de RLS, o **status HTTP é 403 (Forbidden)**

Boa sorte! 🍀
