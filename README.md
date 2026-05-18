# Forza Tune Lab

Aplicativo de tunagens para Forza Horizon 6. O projeto combina uma base local de carros sincronizada do Forza Wiki com um motor de regras para gerar peças, ajustes finos, ranking técnico, comparação e diagnóstico de comportamento.

## Stack

- Next.js 16 com export estático
- React 19
- TypeScript
- Tailwind CSS 4
- Firebase Authentication
- Cloud Firestore
- Cloudflare Pages

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
npm run preview
npm run lint
npm run sync:fandom-cars
npm run pages:deploy
```

## Rotas

- `/` visão geral
- `/cars` banco completo de carros
- `/login` login por email ou Google via Firebase
- `/tune` gerador de tune
- `/diagnostics` diagnóstico contextual
- `/meta` ranking técnico por classe e uso
- `/compare` comparador de carros
- `/garage` tunes salvas no Firestore com cópia local

## Firebase

Crie um projeto no Firebase e configure estas variáveis no `.env.local` e no Cloudflare Pages:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
```

Em Authentication, ative:

- Google
- Email link/passwordless sign-in

Adicione os domínios autorizados:

```text
localhost
SEU-PROJETO.pages.dev
SEU-DOMINIO.com
```

As tunes salvas ficam em `users/{uid}/savedTunes/{tuneId}` no Cloud Firestore. Publique as regras em `firebase/firestore.rules` para restringir leitura e escrita ao dono da conta.

## Cloudflare Pages

O app está preparado para Cloudflare Pages usando static export. Na criação do projeto, conecte o repositório do GitHub e use:

```text
Framework preset: Next.js (Static HTML Export)
Production branch: main
Build command: npm run build
Build output directory: out
```

Depois configure as variáveis `NEXT_PUBLIC_FIREBASE_*` no painel do Cloudflare Pages e inclua o domínio `*.pages.dev` nos domínios autorizados do Firebase Authentication.

## Observação

O motor de tune roda no cliente com dados locais, então o app não depende de API própria para gerar tunes. Firebase entra apenas para login e sincronização da garagem.
