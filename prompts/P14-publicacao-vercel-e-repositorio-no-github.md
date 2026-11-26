# P14 — Publicação: Vercel e repositório no GitHub

| Campo | Valor |
| --- | --- |
| Data | 2026-10-29 |
| Versão | v16 |
| Commit | [`0fda461`](https://github.com/jornandoneto-web/Entrela-o/commit/0fda46143146119c3ff989244a06fe66be6be908) |
| Release | — |
| Situação | Atendido |
| Como foi verificado | Site no ar em portal-entrelaco.vercel.app e versões no GitHub. |

## Prompt original

Texto como foi enviado, sem correções.

**2026-10-29 19:26** (mensagem)

```text
publique
```

**2026-10-29 19:28** (mensagem)

```text
publique na vercel
```

**2026-10-29 19:30** (mensagem)

```text
Eu crie um repositorio com o nome : entrelaço. preciso que publique as versões desse sistema lá
```

**2026-10-29 19:33** (mensagem)

```text
https://github.com/jornandoneto-web/Entrela-o
```

**2026-10-29 19:34** (mensagem)

```text
tornei publico
```

**2026-10-29 19:36** (mensagem)

```text
feito
```

**2026-10-29 20:15** (mensagem)

```text
publicou na vercel?
```

## Resultado

Do CHANGELOG:

### v16 — Mentoria de 15/10/2026
- Camada de dados: modelos (`models/`), dados simulados (`mock/`) e serviços assíncronos (`services/`). Os cadastros gravam pelos serviços.
- Escolas: Diretoria Regional e município em cascata, endereço com "Salvar endereço", diretor escolhido entre pessoas cadastradas e cursos ofertados com botão "+". A acessibilidade saiu do cadastro.
- Listagem de escolas com filtro DR → Município → Escola.
- Infraestrutura da escola, preenchida pelo Diretor, com os recursos de acessibilidade.
- Perfis DED, Secretário e Diretoria Regional.
- Gestão de matrizes: curso → séries → componentes → carga horária.
- Cadastro de professor em abas: Dados pessoais, Dependentes e Vínculos (vários por professor). A escola de lotação saiu do cadastro.
- Gerir lotações: professor em várias escolas, controle de carga horária por vínculo e histórico.
- Migração dos dados para a versão 9.

## Observações e pendências

Prompt de operação, sem mudança no sistema.

## Arquivos alterados

Versão anterior ao uso do Git: o registro está só no CHANGELOG.
