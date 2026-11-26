# P18 — Mentoria de 12/11/2026 e união com a mudança de cores do GitHub

| Campo | Valor |
| --- | --- |
| Data | 2026-11-12 |
| Versão | v21 |
| Commit | [`4da2aa9`](https://github.com/jornandoneto-web/Entrela-o/commit/4da2aa9463973ca0e739e4983e1297da9f576ad6) |
| Release | [v21](https://github.com/jornandoneto-web/Entrela-o/releases/tag/v21) |
| Situação | Atendido |
| Como foi verificado | Teste automático de 135 telas para 17 usuários, em banco novo e atualizado da v20. |

## Prompt original

Texto como foi enviado, sem correções.

**2026-11-12 22:52** (mensagem)

```text
Baixe a atualização que foi feita no github, junte com essa que está no meu PC e hospede na vercel e publique novamente no git
```

## Resultado

Do CHANGELOG:

### v21 — Mentoria de 12/11/2026
- Ano letivo no topo, ao lado do nome da escola ("Ano letivo 2026"), com seletor. Turmas, alunos, horários, notas e diário passam a mostrar o ano escolhido. Novo modelo `AnoLetivo { id, ano, escolaId, status }`, com um ano ativo por escola. O bimestre saiu do topo.
- Perfis separados: a Secretaria de Educação (SEDUC, perfil Secretário) é a única que cadastra escolas. A Secretaria escolar perdeu o cadastro de escolas e ficou com turmas, horários, alunos, fechamento e rematrícula.
- Cadastro de turma: ano letivo preenchido pelo topo e bloqueado, série vinda da matriz do curso, identificador sem a palavra "Turma" e nome montado na hora ("1º ano B"), quantidade de vagas e bloqueio de turma repetida. Depois de criar, o sistema oferece montar o horário.
- Notas do professor: seletor de bimestre no topo, só a coluna do bimestre escolhido editável, média recalculada enquanto digita, com a conta e a regra na tela, e validação de 0 a 10 com uma casa decimal.
- Alunos com atendimento especializado aparecem nas listas do professor só com uma estrela roxa e o texto "Aluno com atendimento especializado — consulte a coordenação". O diagnóstico fica só no cadastro, para a Secretaria escolar.
- Início do professor com as aulas do dia; o diário mostra quantas aulas da disciplina já foram ministradas e quantas a matriz prevê.
- Novo Fechamento do ano: conferência por turma (componente, previstas, ministradas, situação), finalizar turma só com tudo completo, resultado Aprovado/Reprovado com a origem do cálculo, encerramento do ano e abertura do seguinte.
- Nova Rematrícula: alunos das turmas finalizadas com o destino sugerido, confirmação em lote na turma escolhida, respeitando as vagas. Aprovado na última série fica com o curso concluído.
- Novos `services/anoLetivoService.js`, `services/turmaService.js` e `services/fechamentoService.js`; novas telas `telas/turmas.js` e `telas/fechamento.js`.
- Cores dos cartões de indicadores revisadas em vários painéis (contribuição da Julia).
- Migração para a versão 12 dos dados. Nos dados de exemplo, as turmas da Unidade Centro têm o diário do ano completo, para demonstrar o fechamento.

## Observações e pendências

O texto da mentoria de 12/11 foi trabalhado fora desta sessão e não está registrado aqui: anexar. Inclui o commit "mudança de cores" feito por outra integrante no GitHub.

## Arquivos alterados

Diferença entre v20 e v21.

| Arquivo | Mudança |
| --- | --- |
| `CHANGELOG.md` | alterado |
| `README.md` | alterado |
| `app.js` | alterado |
| `estoque.js` | alterado |
| `index.html` | alterado |
| `migracoes-v12.js` | novo |
| `migracoes.js` | alterado |
| `models/modelos.js` | alterado |
| `pages.js` | alterado |
| `professores.js` | alterado |
| `rede.js` | alterado |
| `services/anoLetivoService.js` | novo |
| `services/fechamentoService.js` | novo |
| `services/turmaService.js` | novo |
| `telas/diario.js` | alterado |
| `telas/escolas.js` | alterado |
| `telas/fechamento.js` | novo |
| `telas/grade.js` | alterado |
| `telas/turmas.js` | novo |
| `transporte.js` | alterado |
