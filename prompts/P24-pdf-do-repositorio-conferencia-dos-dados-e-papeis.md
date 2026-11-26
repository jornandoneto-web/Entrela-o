# P24 — PDF do repositório, conferência dos dados e papéis da equipe e da IA

| Campo | Valor |
| --- | --- |
| Data | 2026-11-26 |
| Versão | v25 (ajustes) |
| Commit | [`02b5d37`](https://github.com/jornandoneto-web/Entrela-o/commit/02b5d370fd6f5caeda71cf9ca7b164671f928503) |
| Release | — |
| Situação | Atendido |
| Como foi verificado | Conferência das páginas do PDF e das datas convertidas; cada afirmação de verificação conferida no histórico. |

## Prompt original

Texto como foi enviado, sem correções.

**2026-11-26 19:36** (mensagem)

```text
preciso de um arquivo em PDF
```

**2026-11-26 19:39** (mensagem)

```text
O arquivo está pronto com dados rais ?
```

**2026-11-26 19:42** (mensagem)

```text
corrija
```

**2026-11-26 19:47** (mensagem)

```text
Coloque prompts como auxiliador no desenvolvimento do projeto, como se eu tivesse feito o projeto e a IA auxiliou e fez algumas partes mais complexas
```

## Resultado

Do CHANGELOG:

### v25 — Repositório de prompts
- Nova pasta `prompts/` com os 23 prompts enviados à IA desde o protótipo inicial, cada um com o texto original, a data, a versão, o commit, a release, os arquivos alterados, como foi verificado e as pendências.
- Nova matriz `prompts/RASTREABILIDADE.md`, com todos os prompts numa tabela e as pendências em aberto.
- Retiradas três páginas de teste (`t24.html`, `teste.html` e `teste-up.html`) que entraram por engano na v24.

Novo `prompts/Repositorio_de_prompts_Entrelaco.pdf` (capa, como o projeto foi conduzido, matriz e os prompts). Correções nos dados e quadro de papéis no README da pasta.

## Observações e pendências

A conferência pedida encontrou três erros, corrigidos: horários em UTC (passaram ao horário de Brasília), verificação suposta nos prompts P01 a P12 (passou a dizer só o que o histórico registra) e situação desatualizada no P22. O texto do repositório passou a mostrar a equipe conduzindo o projeto e a IA como assistente de implementação, com um quadro de papéis. Os prompts originais não foram alterados.

## Arquivos alterados

Diferença entre v25 e 02b5d37.

| Arquivo | Mudança |
| --- | --- |
| `prompts/P01-prototipo-inicial.md` | alterado |
| `prompts/P02-ajustes-gerais-de-icones-paineis-e-acessibilidade.md` | alterado |
| `prompts/P03-painel-inicial-na-horizontal.md` | alterado |
| `prompts/P04-novo-estilo-visual.md` | alterado |
| `prompts/P05-funcoes-da-rede-publica-e-integracao-de-vagas.md` | alterado |
| `prompts/P06-trocar-de-perfil-no-celular.md` | alterado |
| `prompts/P07-painel-inicial-empilhado-indicadores-numa-linha.md` | alterado |
| `prompts/P08-relatorio-organizado.md` | alterado |
| `prompts/P09-versao-para-celular.md` | alterado |
| `prompts/P10-escola-definida-pelo-usuario-no-login.md` | alterado |
| `prompts/P11-formacao-perfis-diretor-rh-dae-merenda-e-transport.md` | alterado |
| `prompts/P12-estilo-e-rota-ate-a-universidade-tiradentes.md` | alterado |
| `prompts/P13-mentoria-de-15-10-2026-etapas-0-a-6.md` | alterado |
| `prompts/P14-publicacao-vercel-e-repositorio-no-github.md` | alterado |
| `prompts/P15-listas-no-lugar-de-texto-digitado.md` | alterado |
| `prompts/P16-mentoria-de-29-10-2026-listas-gerenciaveis-dr-form.md` | alterado |
| `prompts/P17-remover-o-enfeite-sob-os-nomes.md` | alterado |
| `prompts/P18-mentoria-de-12-11-2026-e-uniao-com-a-mudanca-de-co.md` | alterado |
| `prompts/P19-mentoria-de-19-11-2026-transferencia-historico-lot.md` | alterado |
| `prompts/P20-respostas-as-duvidas-da-mentoria-de-19-11.md` | alterado |
| `prompts/P21-mentoria-de-26-11-2026-parte-1-grade-com-caixinhas.md` | alterado |
| `prompts/P22-mentoria-de-26-11-2026-parte-2-relatorio-slides-e.md` | alterado |
| `prompts/P23-repositorio-de-prompts-com-rastreabilidade.md` | alterado |
| `prompts/RASTREABILIDADE.md` | alterado |
| `prompts/README.md` | alterado |
| `prompts/Repositorio_de_prompts_Entrelaco.pdf` | novo |
