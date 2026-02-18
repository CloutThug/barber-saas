# 📋 Resumo de Alterações - Debug de Agendamentos

## Arquivos Modificados

### 1. [app/dashboard/appointments/new/page.tsx](app/dashboard/appointments/new/page.tsx) ✨ **Melhorado**

**Principais Changes:**

- ✅ **Try-catch** envolvendo toda a server action
- ✅ **Logging detalhado** em cada etapa:
  - Busca de tenant_id
  - Validação de dados
  - Verificação de customer e service
  - Inserção do agendamento

- ✅ **Verificação adicional** antes de inserir:
  - Valida se customer_id existe e pertence ao tenant
  - Valida se service_id existe e pertence ao tenant
  - Previne inserção de dados inválidos

- ✅ **Mensagens de erro precisas**:
  - `error.message` - Mensagem do Supabase
  - `error.details` - Detalhes técnicos
  - `error.hint` - Dica de solução
  - `error.code` - Código do erro

- ✅ **JSON.stringify** para erros complexos

**Antes:**
```javascript
if (error) {
  console.error('Erro ao criar agendamento:', error)  // ❌ Vago
  throw new Error('Erro ao criar agendamento')         // ❌ Genérico
}
```

**Depois:**
```javascript
if (error) {
  console.error('Erro completo ao criar agendamento:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    fullError: JSON.stringify(error, null, 2)
  })
  throw new Error(`Erro ao criar agendamento: ${error.message}...`)  // ✅ Específico
}
```

### 2. [package.json](package.json)

**Scripts Adicionados:**
```json
"debug:appointments": "npx ts-node -O {...} supabase/debug-appointments.ts"
```

### 3. 📄 Novos Arquivos

#### [supabase/debug-appointments.ts](supabase/debug-appointments.ts)
- Script Node.js para investigar a tabela
- Valida estrutura e dados
- Testa inserções

#### [DEBUG_APPOINTMENTS.md](DEBUG_APPOINTMENTS.md)
- Guia completo de debug
- Causas comuns de erro
- Passos de investigação
- Estrutura esperada da tabela
- Mensagens de erro comuns

#### [supabase/inspect-appointments.sql](supabase/inspect-appointments.sql)
- Queries SQL para inspecionar tabela
- Verifica politicas RLS
- Valida constraints

## 🎯 Próximos Passos

1. **Testee o formulário** em `/dashboard/appointments/new`
2. **Abra DevTools** (F12) → Console
3. **Submeta o formulário com erro**
4. **Copie a mensagem de erro** do console
5. **Execute o debug script:**
   ```bash
   npm run debug:appointments
   ```
6. **Compartilhe os logs** para análise

## 🔍 O que Agora Você Vai Ver

Quando houver erro:

✅ **No Console do Navegador (F12):**
```
Criando agendamento para tenant: xxx-xxx
Dados validados: { customer_id, service_id, scheduled_at, tenant_id }
Cliente e serviço validados com sucesso
Erro completo ao criar agendamento: {
  message: "new row violates row-level security policy",
  code: "42501",
  details: "...",
  hint: "..."
}
```

✅ **Quando rodar `npm run debug:appointments`:**
```
🔍 Investigando tabela appointments...

1️⃣  Verificando estrutura da tabela:
   ✅ Tabela acessível. Colunas: [...]

2️⃣  Testando inserção:
   ❌ Erro de inserção:
      Mensagem: null value in column "X" violates not-null constraint
      Dica: Ensure this column has a default value or you insert a value
```

## ⭐ Benefícios

| Antes | Depois |
|-------|--------|
| ❌ Mensagem genérica | ✅ Mensagem específica com código e dica |
| ❌ Sem validação | ✅ Valida customer e service antes de inserir |
| ❌ Um único console.error | ✅ Múltiplos logs detalhados |
| ❌ Sem script de teste | ✅ Script debug automático |
| ❌ Sem documentação | ✅ Guia completo de troubleshooting |

## 💬 Comunicação

Assim que testar e capturar uma mensagem de erro, você terá informações suficientes para:
- Identificar a causa exata
- Saber como corrigir
- Ou compartilhar comigo com tudo documentado

Boa sorte! 🚀
