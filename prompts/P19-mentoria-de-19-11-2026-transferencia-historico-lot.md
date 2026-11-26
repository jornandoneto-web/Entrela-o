# P19 — Mentoria de 19/11/2026 (transferência, histórico, lotação, ajustes)

| Campo | Valor |
| --- | --- |
| Data | 2026-11-19 |
| Versão | v22 |
| Commit | [`b185513`](https://github.com/jornandoneto-web/Entrela-o/commit/b185513fd98c5254ba3dc64433dea15684243fb6) |
| Release | [v22](https://github.com/jornandoneto-web/Entrela-o/releases/tag/v22) |
| Situação | Atendido |
| Como foi verificado | Teste automático de 131 telas para 16 usuários e dos fluxos de transferência, em banco novo e atualizado da v21; lotação testada em todas as escolas. |

## Prompt original

Texto como foi enviado, sem correções.

**2026-11-19 13:50** (mensagem)

```text
Na mentoria, o mentor revisou o sistema e pediu as alterações abaixo. Implemente todas no projeto em que já estamos trabalhando, etapa por etapa, aproveitando as telas, componentes e padrões que já existem. Não troque bibliotecas, não refaça telas fora desta lista e não quebre o que já funciona. Os dados continuam mockados: use os modelos/objetos e a camada de serviço mock, como no resto do sistema.

Etapa 1 — Solicitação de transferência (perfil Responsável / Aluno)

Hoje a tela de transferência lista as escolas antes de saber para onde o aluno vai. Refaça o fluxo nesta ordem:

Tipo de transferência:
Dentro da rede estadual (padrão).
Transferência para fora da rede: para outro estado, para escola particular ou municipal. Nesse caso não se escolhe escola do sistema; o responsável só informa o destino em texto (estado, cidade e nome da escola, se souber).
Cidade (só para dentro da rede): um select com os municípios de Sergipe (o estado é sempre Sergipe, não precisa de campo de estado). Venha pré-selecionada a cidade atual do aluno, mas permita trocar, porque a família pode estar se mudando (ex.: os pais mudaram de emprego).
Escola: só depois de escolher a cidade, liste as escolas daquela cidade (de preferência mostrando se há vaga na série do aluno).
Motivo (opcional) e botão Enviar pedido.
O pedido fica com status Pendente e o responsável acompanha o andamento (Pendente → Deferido / Indeferido → Concluído).

Modelo sugerido: Transferencia { id, alunoId, escolaOrigemId, tipo: 'rede' | 'fora_da_rede', municipioDestinoId?, escolaDestinoId?, destinoExterno?, motivo?, status, dataSolicitacao, dataDecisao?, declaracaoEmitida, historicoEmitido }.

Etapa 2 — Aprovação da transferência pela escola de origem (perfil Secretaria Escolar)
Crie a tela Pedidos de transferência na escola de origem, com a lista de pedidos e os filtros por status.
A escola pode Deferir ou Indeferir (com justificativa obrigatória no indeferimento).
Ao deferir, a escola emite:
Declaração de transferência: gerada na hora, para o responsável levar à nova escola. Gere um documento simples para visualizar/imprimir (nome do aluno, série, ano letivo, escola de origem, data, situação de matrícula).
Histórico escolar: pode sair depois. Por lei a escola tem até 30 dias. Mostre o prazo (data limite = data do deferimento + 30 dias) e um aviso quando estiver perto de vencer. A declaração não depende do histórico.
Transferência dentro da rede: ao deferir, o aluno é desvinculado da turma de origem e matriculado na escola de destino (respeitando vagas; se não houver vaga, vai para a fila de espera da escola de destino), e as notas e médias dele seguem automaticamente para a nova escola. Ninguém precisa redigitar nada.
Transferência para fora da rede: ao deferir, o aluno sai da turma com situação "Transferido" e a escola emite a declaração e o histórico.
Etapa 3 — Histórico escolar
Crie a geração do Histórico escolar do aluno: para cada ano letivo / série / escola, os componentes curriculares com notas, média final, frequência e situação (aprovado / reprovado / transferido).
O histórico reúne toda a vida escolar do aluno, não só a escola atual. Para isso:
Dados das escolas da rede vêm automaticamente do sistema.
Crie um cadastro de notas externas (perfil Secretaria Escolar) para lançar manualmente o que veio de fora da rede: escola particular, escola municipal ou de outro estado. Campos: escola de origem, cidade/UF, ano, série, componente, nota/média final, carga horária, situação. Marque esses registros como "Lançamento externo", porque o sistema não garante a integridade desses dados.
Permita visualizar e imprimir o histórico.
Etapa 4 — Correção na lotação
O mentor viu um erro na nova lotação de professor: ao lotar numa determinada escola/município, o sistema não estava permitindo a lotação.
Teste a lotação em escolas de vários municípios e DRs diferentes, encontre a causa (filtro DR → município → escola, vínculo da escola com o município, validação de carga horária etc.) e corrija, para que funcione com qualquer escola cadastrada.
Etapa 5 — Pequenos ajustes já validados
Aluno com atendimento especial: o mentor aprovou a estrelinha roxa sem mostrar a deficiência. Garanta que ela aparece de forma igual em todas as listas de alunos (notas, chamada, diário, lista do diretor/coordenação).
CPF nos cadastros: valide o CPF pelos dígitos verificadores (no front-end), com máscara. Para testes, use CPFs gerados por um gerador de CPF válido.
Cadastro de pessoa: confira se os dados pessoais estão completos (estado civil, parentesco/responsáveis etc.) em todos os perfis que cadastram pessoas.
Critérios de aceite
[ ] Transferência: tipo (rede / fora da rede) → cidade pré-selecionada → escolas da cidade → enviar pedido, com acompanhamento de status.
[ ] Escola de origem defere ou indefere; ao deferir, emite declaração na hora e controla o prazo de 30 dias do histórico.
[ ] Dentro da rede, aluno vai para a nova escola com notas e médias migradas automaticamente.
[ ] Histórico escolar com toda a vida escolar, incluindo cadastro manual de notas externas marcadas como externas.
[ ] Lotação funcionando em escolas de qualquer município/DR.
[ ] Estrelinha roxa consistente em todas as listas; CPF validado.
[ ] Projeto compila, publica e as telas anteriores continuam funcionando.

Ao terminar, me mostre um resumo do que foi alterado (arquivos e telas), o que ficou pendente e as dúvidas de regra de negócio.
```

## Resultado

Do CHANGELOG:

### v22 — Mentoria de 19/11/2026
- Pedido de transferência pelo responsável e pelo aluno. É feito dentro da rede estadual (cidade de Sergipe já preenchida com a do aluno e escolas com as vagas na série) ou fora dela (tipo de escola, UF, cidade e nome), com motivo opcional. O responsável acompanha cada etapa: Pendente, Deferido ou Indeferido, e Concluído.
- Nova tela Pedidos de transferência na Secretaria escolar:
  - filtro por situação;
  - deferir, ou indeferir com justificativa obrigatória;
  - declaração de transferência para imprimir, emitida no deferimento;
  - prazo de 30 dias para o histórico, com aviso quando está perto.
- No deferimento, um aluno que fica na rede passa para uma turma da mesma série na escola de destino, ou para a fila de espera se não houver vaga. As notas seguem com ele. Para fora da rede, o aluno sai da turma como Transferido.
- Novo Histórico escolar:
  - todos os anos do aluno, por série e escola, com componentes, média final, carga horária, frequência e situação;
  - pode ser aberto para impressão.
- Nova tela Notas externas, um cadastro das notas de anos cursados fora da rede. Esses lançamentos aparecem no histórico como "Lançamento externo".
- Lotações: o botão Nova lotação não fica mais desativado sem explicação. A tela avisa quando o vínculo não tem horas livres, e o erro aparece dentro do formulário. As mensagens de aviso agora aparecem por cima das janelas (antes ficavam escondidas atrás delas em todos os formulários).
- Estrela roxa de atendimento especializado igual em todas as listas de alunos (cadastro, boletins, frequência, busca ativa, fechamento, diário e chamada).
- CPF com máscara e validação pelos dígitos verificadores em todos os cadastros.
- Dados pessoais completos:
  - aluno com CPF, sexo, cor/raça, filiação e parentesco do responsável;
  - nova tela Pessoas no perfil Secretário, com estado civil;
  - parentesco também na matrícula.
- Novos `services/transferenciaService.js`, `telas/transferencia.js`, `telas/historico.js` e `telas/pessoas.js`. Migração para a versão 13 dos dados, testada a partir de um banco da v21.

## Arquivos alterados

Diferença entre v21 e v22.

| Arquivo | Mudança |
| --- | --- |
| `CHANGELOG.md` | alterado |
| `README.md` | alterado |
| `app.js` | alterado |
| `index.html` | alterado |
| `migracoes-v13.js` | novo |
| `migracoes.js` | alterado |
| `mock/listas.js` | alterado |
| `models/modelos.js` | alterado |
| `pages.js` | alterado |
| `rede.js` | alterado |
| `services/transferenciaService.js` | novo |
| `telas/fechamento.js` | alterado |
| `telas/historico.js` | novo |
| `telas/lotacoes.js` | alterado |
| `telas/matricula.js` | alterado |
| `telas/pessoas.js` | novo |
| `telas/professor.js` | alterado |
| `telas/transferencia.js` | novo |
