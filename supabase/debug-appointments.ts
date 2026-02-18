#!/usr/bin/env node

/**
 * Script para investigar a tabela appointments e suas políticas RLS
 * Uso: npx ts-node supabase/debug-appointments.ts
 */

import { createClient } from '@supabase/supabase-js'

async function inspectAppointmentsTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrados')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('🔍 Investigando tabela appointments...\n')

  // 1. Verificar se a tabela existe
  console.log('1️⃣  Verificando estrutura da tabela:')
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .limit(1)

    if (error) {
      console.error(`   ❌ Erro ao acessar tabela: ${error.message}`)
    } else {
      console.log('   ✅ Tabela acessível. Primeiras colunas:', Object.keys(data?.[0] || {}))
    }
  } catch (err) {
    console.error(`   ❌ Erro geral:`, err)
  }

  // 2. Tentar inserir um registro de teste
  console.log('\n2️⃣  Testando inserção:')
  try {
    // Primeiro, precisamos de um tenant_id válido
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .limit(1)

    if (profileError || !profiles || profiles.length === 0) {
      console.error('   ❌ Nenhum perfil encontrado')
      return
    }

    const tenantId = profiles[0].tenant_id
    console.log(`   ✓ Usando tenant_id: ${tenantId}`)

    // Tentar uma inserção vazia para ver qual campo está faltando
    const testInsert = await supabase
      .from('appointments')
      .insert({
        tenant_id: tenantId,
      })
      .select()

    if (testInsert.error) {
      console.error(`   ❌ Erro de inserção:`)
      console.error(`      Mensagem: ${testInsert.error.message}`)
      console.error(`      Código: ${testInsert.error.code}`)
      console.error(`      Detalhes: ${testInsert.error.details}`)
      console.error(`      Dica: ${testInsert.error.hint}`)
    } else {
      console.log('   ✅ Inserção vazia bem-sucedida')
    }
  } catch (err) {
    console.error(`   ❌ Erro na tentativa de inserção:`, err)
  }

  // 3. Verificar dados de exemplo
  console.log('\n3️⃣  Verificando dados de exemplo:')
  try {
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, name, tenant_id')
      .limit(2)

    if (custError) {
      console.error(`   ❌ Erro ao buscar customers: ${custError.message}`)
    } else if (!customers || customers.length === 0) {
      console.error('   ⚠️  Nenhum customer encontrado')
    } else {
      console.log('   ✅ Customers encontrados:')
      customers.forEach((c: any) => {
        console.log(`      - ID: ${c.id}, Nome: ${c.name}, Tenant: ${c.tenant_id}`)
      })
    }

    const { data: services, error: svcError } = await supabase
      .from('services')
      .select('id, name, price, tenant_id')
      .limit(2)

    if (svcError) {
      console.error(`   ❌ Erro ao buscar services: ${svcError.message}`)
    } else if (!services || services.length === 0) {
      console.error('   ⚠️  Nenhum service encontrado')
    } else {
      console.log('   ✅ Services encontrados:')
      services.forEach((s: any) => {
        console.log(`      - ID: ${s.id}, Nome: ${s.name}, Preço: ${s.price}, Tenant: ${s.tenant_id}`)
      })
    }
  } catch (err) {
    console.error(`   ❌ Erro geral:`, err)
  }

  console.log('\n✨ Investigação concluída!')
}

inspectAppointmentsTable().catch(console.error)
