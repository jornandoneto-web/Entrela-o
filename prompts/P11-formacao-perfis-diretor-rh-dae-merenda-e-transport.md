# P11 — Formação, perfis Diretor/RH/DAE, merenda e transporte

| Campo | Valor |
| --- | --- |
| Data | 2026-10-08 |
| Versão | v14 |
| Commit | anterior ao Git |
| Release | — |
| Situação | Atendido |
| Como foi verificado | Teste automático das telas no navegador. |

## Prompt original

Texto como foi enviado, sem correções.

**2026-10-08 23:50** (mensagem)

```text
1. FORMAÇÃO DO PROFESSOR → DISCIPLINAS HABILITADAS
- Crie o cadastro de "Formação" (ex.: Biologia, Matemática, Química, Direito) e ligue cada
  uma às disciplinas que ela habilita.
- O professor pode ter mais de uma formação.
- No cadastro do professor, troque a associação manual de disciplinas pela seleção de
  formações. As disciplinas habilitadas passam a ser calculadas automaticamente.
- Para os professores que já estão cadastrados com disciplinas associadas, proponha uma
  forma de migrar esses dados.
- Ao atribuir professor a uma turma ou disciplina, só permita disciplinas habilitadas pelas
  formações dele.

2. PERFIS DE ACESSO
- Ajuste ou crie o perfil Diretor, responsável pelo calendário escolar. Deixe a estrutura
  pronta para receber mais permissões depois.
- Crie o perfil RH, com acesso somente ao que diz respeito a professores (item 3).
- Crie o perfil DAE, responsável pela gestão da merenda (item 4).

3. RH – GESTÃO DE PROFESSORES
- Acrescente ao cadastro do professor:
  - forma de ingresso: Contrato, Concurso ou Cedido;
  - se Cedido: órgão de origem;
  - se Contrato: data de início e data de término.
- Painel de necessidade de professores, por escola e disciplina:
  - carga horária necessária, carga coberta e saldo (ex.: "Matemática – Escola X: faltam 4h");
  - quando um contrato termina, as horas daquele professor viram necessidade em aberto;
  - indicar se outro professor habilitado tem horas disponíveis para cobrir o saldo, ou se
    será preciso contratar.
- Relatório de contratos a vencer, com filtro por período e por disciplina
  (ex.: contratos de Português que terminam no próximo mês).
- Banco de talentos: candidatos classificados em processos seletivos que não foram
  chamados (nome, formação, contato, processo seletivo, classificação), para consulta quando
  surgir uma vaga ou um afastamento.

4. MERENDA – CONTROLE DE ESTOQUE (aproveite o módulo de merenda que já existe)
- Registrar as entradas de alimentos distribuídos pela Seduc para cada escola
  (ex.: 100 kg de carne).
- A escola registra o consumo diário.
- Quando um item chegar a 50% da última entrada, gerar alerta para o DAE e para a sede:
  "Estoque na metade". O percentual deve ser configurável.
- Painel do DAE com o estoque de todas as escolas, os alertas ativos e o histórico de
  consumo, para planejar compras e redistribuição.

5. TRANSPORTE ESCOLAR (aproveite as rotas que já existem)
- Mostrar as rotas e os pontos de parada num mapa. Se o projeto ainda não tiver
  biblioteca de mapas, use Leaflet com OpenStreetMap.
- Na área do aluno, mostrar a rota que atende ele e o ponto de parada mais próximo.
- QR code individual por aluno. Ao entrar no ônibus, o QR é lido e o embarque fica
  registrado (aluno, rota/ônibus, data, hora, ida ou volta).
- O aluno ou o responsável pode avisar que não vai usar a ida ou a volta num dia.
- Tela do motorista com a lista de alunos esperados em cada trecho, já sem quem avisou
  que não vai, para ele não ficar esperando.

ORDEM SUGERIDA: 1 → 2 → 3 → 4 → 5. Teste cada item antes de passar para o próximo.

AO FINAL, ENTREGUE
- lista dos arquivos criados ou alterados;
- migrações criadas;
- dados de exemplo para demonstrar cada melhoria;
- o que ficou pendente e as decisões que você tomou por conta própria.
```

**2026-10-09 00:11** (mensagem)

```text
tente novamente
```

## Resultado

Do CHANGELOG:

### v14 — Professores, perfis, merenda e transporte
- Formações que habilitam disciplinas, com migração das disciplinas cadastradas antes.
- Perfis Diretor (calendário), RH, DAE e Motorista, com permissões configuráveis.
- RH: forma de ingresso, necessidade de professores, contratos a vencer e banco de talentos.
- Merenda: estoque por escola, consumo diário, alerta "Estoque na metade" e painel do DAE.
- Transporte: mapa das rotas, ponto mais próximo, QR de embarque, aviso de ausência e tela do motorista.

## Arquivos alterados

Versão anterior ao uso do Git: o registro está só no CHANGELOG.
