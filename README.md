# Forza Tune Lab

Aplicativo de tunagens para Forza Horizon 6. O projeto combina uma base local de carros sincronizada do Forza Wiki com um motor de regras para gerar peças, ajustes finos, ranking técnico, comparação e diagnóstico de comportamento.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/Base UI

## Dados dos carros

A lista de carros vem da página:

https://forza.fandom.com/wiki/Forza_Horizon_6/Cars

O script `sync:fandom-cars` lê a tabela principal da página, entra nas páginas individuais dos carros quando elas existem e gera `src/data/cars.generated.json` com:

- nome, ano, classe e PI
- performance oficial da tabela
- valor, raridade e disponibilidade
- ficha técnica extra da página do carro
- imagem oficial `FH6_*` quando publicada no Fandom

Algumas linhas do Fandom ainda apontam para páginas não criadas. Esses carros continuam no app usando os dados da tabela e ficam sem imagem oficial até a página existir.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run sync:fandom-cars
```

## Rotas

- `/` visão geral
- `/cars` banco completo de carros
- `/login` login por email ou Google via Supabase
- `/tune` gerador de tune
- `/diagnostics` diagnóstico contextual
- `/meta` ranking técnico por classe e uso
- `/compare` comparador de carros
- `/garage` tunes salvas localmente

## Autenticação

O app usa Supabase Auth. Para habilitar login por email e Google, crie um projeto no Supabase e configure:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

No painel do Supabase, em Authentication, adicione as URLs de callback:

```text
http://localhost:3000/auth/callback
https://SEU-DOMINIO/auth/callback
```

Ative o provider Google no Supabase com as credenciais OAuth do Google Cloud.

Para persistir tunes salvas por usuário, execute o SQL em `supabase/schema.sql` no editor SQL do Supabase.

## Observação

O app usa regras e dados locais para gerar tunes. Com Supabase configurado, login e garagem remota ficam ativos; sem Supabase, o app mostra o estado de configuração pendente nas áreas protegidas.
