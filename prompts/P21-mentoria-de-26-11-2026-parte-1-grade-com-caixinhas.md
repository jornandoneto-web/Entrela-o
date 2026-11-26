# P21 — Mentoria de 26/11/2026, parte 1 (grade com caixinhas, boletins, cadastro do professor)

| Campo | Valor |
| --- | --- |
| Data | 2026-11-26 |
| Versão | v24 |
| Commit | [`c821a89`](https://github.com/jornandoneto-web/Entrela-o/commit/c821a89cc39f230dbdec813b094b0998bf68e1a5) |
| Release | [v24](https://github.com/jornandoneto-web/Entrela-o/releases/tag/v24) |
| Situação | Atendido |
| Como foi verificado | Teste automático de 135 telas para 16 usuários e de cada critério de aceite, em banco novo e atualizado da v23. |

## Prompt original

Texto como foi enviado, sem correções.

**2026-11-26 22:06** (mensagem)

```text
Etapa 1 — Grade horária: quem monta e quem vê
A montagem da grade horária fica na Secretaria Escolar (e também acessível ao Diretor), no menu "Grade horária". O mentor teve dificuldade de encontrar onde o horário era criado: deixe o caminho claro no menu e no painel desses perfis.
O professor não cria horário: no perfil Professor, ele só visualiza a grade dele (somente leitura). Remova do perfil Professor qualquer botão ou tela que permita criar ou editar horário.
A grade pode ser vista por turma ou por professor, como já combinado.
Etapa 2 — Grade horária com "arrastar e soltar" a partir da matriz

O mentor pediu para facilitar a vida de quem monta o horário:

Ao escolher a turma, mostre ao lado da grade uma lista de "caixinhas" de aulas a distribuir, gerada a partir da quantidade de aulas semanais de cada componente cadastrada na matriz/gestão de curso do perfil DED. Exemplo para uma turma:
Português ×3, Matemática ×3, Física ×2, Química ×2, Biologia ×2, História ×2, Geografia ×2…
Cada aula é uma caixinha (3 de Português = 3 caixinhas).
Se a quantidade de aulas por semana ainda não estiver cadastrada na matriz, adicione esse campo ao componente curricular da matriz (ex.: aulasPorSemana), no perfil DED.
O usuário arrasta cada caixinha para um dia (segunda a sexta) e uma faixa de horário (1º, 2º horário…).
Ao soltar, abra a escolha do professor, já filtrado pelos professores habilitados naquela disciplina e lotados na escola. Se só houver um, preencha automaticamente.
Cada caixinha usada sai da lista; o contador do componente diminui (ex.: "História 1 de 2 restantes"). Ao remover uma aula da grade, a caixinha volta para a lista.
Mantenha as regras de conflito: a turma não pode ter duas aulas na mesma faixa e o professor não pode estar em duas turmas na mesma faixa/dia. Se houver conflito ao soltar, recuse e mostre o motivo.
Mostre um indicador da turma: "Grade completa" quando todas as caixinhas forem distribuídas, ou "Faltam X aulas".
Use uma biblioteca de drag-and-drop que já exista no projeto ou uma leve e compatível com a stack. Garanta que também funcione no celular/touch ou ofereça uma alternativa por clique (selecionar a caixinha e clicar na faixa).
Etapa 3 — Notas e boletins
O mentor testou a tela Notas e boletins e as notas lançadas pelo professor não apareciam (ex.: a aluna Ana Clara estava com 8 e não aparecia).
Garanta que as notas lançadas no perfil Professor usam a mesma fonte de dados que a tela Notas e boletins da escola: ao salvar uma nota no professor, ela aparece no boletim na hora, no bimestre correto.
Em Notas e boletins:
Filtro por turma e bimestre (ex.: 2º bimestre).
Para cada aluno: notas por componente e bimestre, média e o resultado final do aluno (Aprovado / Reprovado / Em andamento), usando a mesma regra de média e frequência do fechamento do ano letivo.
Por enquanto, a integração é só em um sentido: do professor para o boletim. A tela de boletim é de consulta; a edição de notas continua no perfil Professor.
Mantenha a estrelinha roxa dos alunos com atendimento especial também nessa tela.
Etapa 4 — Cadastro do professor
O cadastro do professor é feito pelo RH (como combinado nas mentorias anteriores). Garanta que ele não está duplicado em perfis de escola ou de matrícula; a escola só vê os professores lotados nela.
Revise as validações do cadastro de pessoa: CPF válido (dígitos verificadores) e data de nascimento coerente (ex.: idade mínima para professor de 18 anos; não aceitar datas futuras).
Critérios de aceite
[ ] Grade horária montada na Secretaria Escolar/Diretor, com caminho claro no menu; professor só visualiza a própria grade.
[ ] Caixinhas por componente geradas da matriz (aulas por semana), arrastadas para dia/faixa, com professor filtrado e contador de aulas restantes.
[ ] Conflitos de turma e de professor bloqueados; indicador de grade completa.
[ ] Notas lançadas pelo professor aparecem em Notas e boletins, por turma e bimestre, com média e resultado final.
[ ] Cadastro do professor só no RH, com CPF e data de nascimento validados.
[ ] Projeto compila, publica e as telas anteriores continuam funcionando.

Ao terminar, me mostre um resumo do que foi alterado (arquivos e telas), o que ficou pendente e as dúvidas de regra de negócio.

Parte 2 — Preparar a entrega final (usar num chat comum)

Estou fechando o projeto final de um sistema de gestão escolar para a rede estadual de Sergipe, desenvolvido com apoio de IA. Preciso de ajuda com três entregas, para trazer ao mentor na próxima semana:

1. Relatório de engenharia de prompts. O mentor quer que o relatório registre os prompts que falharam e como resolvemos. Monte um modelo de seção para cada caso com:

O que pedimos (o prompt original).
O que aconteceu de errado (ex.: pedimos uma matrícula e saiu só um cadastro).
O que fizemos para resolver (o novo prompt ou a mudança de abordagem), mesmo que não tenha resolvido por completo.
O que aprendemos. Inclua também uma seção curta sobre revisão de código: por que outra pessoa (e não quem escreveu) deve revisar o código antes da entrega, e como isso se aplica ao revisar o que a IA gerou. Cada integrante deve contribuir com os casos da sua parte. Eu vou te mandar os prompts e as falhas para você organizar.

2. Slides da apresentação (10 minutos). O foco é vender os diferenciais, não explicar tela por tela (nada de "por que esse botão" ou "por que essa cor"). Pontos a destacar:

Um ecossistema escolar completo, com muitos perfis diferentes (Secretaria de Educação, Diretorias Regionais, direção, secretaria escolar, coordenação, RH, DED, professores, alunos, pais/responsáveis, motoristas, merendeiras).
Facilidade para o aluno e para o professor.
Acessibilidade (ex.: sinalização discreta de alunos com atendimento especial, sem expor diagnóstico).
Como a IA potencializou o desenvolvimento (sem ela, precisaríamos de mais gente e mais tempo). Sugira a sequência de slides, o texto de cada um e o que mostrar do sistema em cada momento.

3. Roteiro de fala para dois apresentadores, dividindo os 10 minutos, com marcação de tempo e uma dica de ensaio: um apresenta enquanto o outro critica (velocidade da fala, diferenciais esquecidos etc.).
```

## Resultado

Do CHANGELOG:

### v24 — Mentoria de 26/11/2026
- Grade horária com caixinhas:
  - ao escolher a turma, aparece a lista "Aulas a distribuir", com uma caixinha por aula, gerada pelas aulas por semana da matriz;
  - a caixinha pode ser arrastada para o dia e o horário; no celular, toca-se na caixinha e depois em "Colocar aqui";
  - o professor vem filtrado pela disciplina e pela lotação na escola, e é escolhido automaticamente se houver um só;
  - cada componente mostra quantas aulas ainda faltam, e a aula tirada da grade volta para a lista;
  - choque de horário da turma e do professor é recusado com o motivo;
  - a turma mostra "Grade completa" ou "Faltam X aulas".
- Grade horária no menu e no painel da Secretaria escolar e do Diretor, com as turmas que ainda faltam montar. O professor continua só consultando o horário dele. Nova permissão "Montar a grade horária".
- Matriz (DED): novo campo "Aulas por semana" em cada componente.
- Notas e boletins refeitos:
  - filtro por turma e bimestre;
  - nota de cada componente no bimestre, média, frequência e resultado final (Aprovado, Reprovado ou Em andamento) pela regra do fechamento;
  - só consulta, com a estrela roxa;
  - o Diretor também tem acesso. A tela antiga só mostrava a média dos 4 bimestres, e por isso a nota lançada num bimestre parecia não aparecer.
- Professores: a escola vê só os lotados nela e não cadastra (o cadastro é do RH). A data de nascimento não aceita data futura e exige pelo menos 18 anos para o professor.
- Dados de exemplo:
  - matriz do Ensino Médio com 25 aulas por semana;
  - novos professores de Educação Física (Fábio Rezende) e de Filosofia e Sociologia (Lívia Prado);
  - grade da Unidade Centro refeita: 1º e 2º ano completos, 3º ano com 5 aulas para distribuir.
- Migração para a versão 15 dos dados.

## Observações e pendências

Dúvidas abertas: limite de aulas da mesma disciplina por dia; choque de professor entre turnos; tendência no resultado "Em andamento"; idade máxima do professor.

## Arquivos alterados

Diferença entre v23 e v24.

| Arquivo | Mudança |
| --- | --- |
| `CHANGELOG.md` | alterado |
| `README.md` | alterado |
| `app.js` | alterado |
| `index.html` | alterado |
| `migracoes-v15.js` | novo |
| `migracoes.js` | alterado |
| `models/modelos.js` | alterado |
| `pages.js` | alterado |
| `services/professorService.js` | alterado |
| `t24.html` | novo |
| `telas/boletins.js` | novo |
| `telas/grade.js` | alterado |
| `telas/matrizes.js` | alterado |
| `telas/pessoas.js` | alterado |
| `telas/professor.js` | alterado |
| `teste-up.html` | novo |
| `teste.html` | novo |
