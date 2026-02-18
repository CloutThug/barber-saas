-- Script para inspecionar a tabela appointments

-- 1. Estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'appointments'
ORDER BY ordinal_position;

-- 2. Constraints (chaves estrangeiras, etc)
SELECT
  constraint_name,
  constraint_type,
  table_name,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' AND tc.table_name = 'appointments'
ORDER BY constraint_name;

-- 3. Políticas RLS ativas
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'appointments'
ORDER BY policyname;

-- 4. RLS ativado na tabela?
SELECT 
  tablename,
  rowsecurity
FROM pg_class c 
JOIN pg_tables t ON c.relname = t.tablename
WHERE schemaname = 'public' AND tablename = 'appointments';
