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
- `/tune` gerador de tune
- `/diagnostics` diagnóstico contextual
- `/meta` ranking técnico por classe e uso
- `/compare` comparador de carros
- `/garage` tunes salvas localmente

## Observação

O app usa regras e dados locais. Ranking comunitário, tempos reais e banco remoto ainda podem ser adicionados depois, mas o fluxo atual já funciona sem backend externo.
