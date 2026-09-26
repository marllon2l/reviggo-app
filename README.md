# Reviggo

**Reviggo** é o aplicativo do **Protocolo Corpo Revigorado**.

> 300 receitas para você que não aguenta mais conviver com dores e quer voltar a ter energia e liberdade.

## O que já está implementado

- PWA React + TypeScript, mobile-first
- autenticação Supabase por e-mail e senha
- onboarding simples
- tela **Hoje** com o plano real de 21 dias
- biblioteca com as 300 receitas de `receitas_300.json`
- busca e filtros pelas 7 áreas editoriais, categoria e tags práticas
- ficha completa de cada receita
- favoritos e receitas concluídas
- troca por outra receita da mesma categoria
- Protocolo Corpo Revigorado com os 21 dias de `plano_21_dias.json`
- lista de compras semanal
- Troca Fácil, Cozinha SOS, Modo Família e Freezer
- tracker opcional não clínico
- perfil/preferências
- rota `/upgrade` preparada para pagamento futuro
- manifest e service worker PWA

## Configuração local

```bash
npm install
cp .env.example .env
npm run dev
```

## Supabase

1. Crie um projeto no Supabase.
2. Rode `supabase_schema.sql` no SQL Editor.
3. Em Authentication, habilite Email.
4. Crie um arquivo `.env`:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

Sem essas variáveis, o app abre em modo local de demonstração para facilitar preview; dados ficam no `localStorage`.

## Build

```bash
npm run build
```

## Segurança editorial

As áreas “dores”, “energia”, “sono”, “intestino”, “peso”, “circulação” e “memória” são apenas filtros editoriais. O app não apresenta receitas como diagnóstico, tratamento, cura ou prevenção de doenças.
