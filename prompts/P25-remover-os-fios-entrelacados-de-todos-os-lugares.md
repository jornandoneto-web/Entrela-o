# P25 — Remover os fios entrelaçados de todos os lugares

| Campo | Valor |
| --- | --- |
| Data | 2026-11-26 |
| Versão | v26 |
| Commit | commit desta entrega |
| Release | — |
| Situação | Atendido |
| Como foi verificado | Teste automático de 135 telas para 16 usuários, sem erro; captura da linha do dia conferida. |

## Prompt original

Texto como foi enviado, sem correções.

**2026-11-26 19:50** (mensagem)

```text
remova de todos lugares. ( eles ficam abaixo dos nomes)
```

## Resultado

Do CHANGELOG:

### v26 — Sem os fios entrelaçados
- A linha do dia do painel inicial (aluno e professor) troca os dois fios entrelaçados por uma linha simples entre os horários. Os fios sob os títulos já tinham saído na v20.
- Repositório de prompts: PDF completo, horários em Brasília, verificações conferidas no histórico e quadro de papéis da equipe e da IA.

A linha do dia do painel inicial passou a usar uma linha simples entre os horários, no lugar dos dois fios entrelaçados.

## Observações e pendências

Enviado com um print do título da tela de entrada. Os fios sob os títulos já tinham saído na v20 e não estavam mais no código; o print deve ser de uma versão guardada no cache do navegador. Os fios entrelaçados que restavam, na linha do dia do painel inicial, foram trocados por uma linha simples.

## Arquivos alterados

Diferença entre 02b5d37 e esta entrega.

| Arquivo | Mudança |
| --- | --- |
| `CHANGELOG.md` | alterado |
| `index.html` | alterado |
| `pages.js` | alterado |
| `prompts/P13-mentoria-de-15-10-2026-etapas-0-a-6.md` | alterado |
| `prompts/P23-repositorio-de-prompts-com-rastreabilidade.md` | alterado |
| `prompts/P24-pdf-do-repositorio-conferencia-dos-dados-e-papeis.md` | novo |
| `prompts/P25-remover-os-fios-entrelacados-de-todos-os-lugares.md` | novo |
| `prompts/RASTREABILIDADE.md` | alterado |
