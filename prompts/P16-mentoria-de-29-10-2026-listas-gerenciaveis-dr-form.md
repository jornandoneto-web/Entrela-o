# P16 — Mentoria de 29/10/2026 (listas gerenciáveis, DR, formação, grade, diário, matrícula, perfis)

| Campo | Valor |
| --- | --- |
| Data | 2026-10-30 |
| Versão | v19 |
| Commit | [`9c5db9d`](https://github.com/jornandoneto-web/Entrela-o/commit/9c5db9d6dfa0b81a47e9a1ff186060ac454612cf) |
| Release | [v19](https://github.com/jornandoneto-web/Entrela-o/releases/tag/v19) |
| Situação | Parcial |
| Como foi verificado | Teste automático de atualização a partir de um banco da v18; pegou uma migração que apagaria as formações antes de publicar. |

## Prompt original

Texto como foi enviado, sem correções.

**2026-10-30 15:07** (mensagem)

```text
Etapa 1 — Regra geral: "tudo que está em tela deve ser gerenciado"

O mentor deixou isso como princípio do sistema: toda lista, select, combo ou grupo de checkboxes que aparece numa tela precisa ter, em algum outro lugar do sistema, uma funcionalidade de cadastro (CRUD) que gerencia esses itens. Nada de opções fixas no código.

Varra o projeto e liste todos os selects, combos e checkboxes que hoje têm opções fixas.
Para cada um, crie uma tela de gerenciamento simples: listagem, botão Novo, editar e excluir/inativar. Exemplos obrigatórios:
Recursos de acessibilidade (ex.: rampa, banheiro adaptado, aparelhos auditivos — o usuário deve poder cadastrar novos quando surgirem).
Formações (ver Etapa 3).
Cargos, formas de ingresso, modalidades/cursos, componentes curriculares/disciplinas, faixas de horário e quaisquer outras listas que existirem.
Os formulários passam a buscar essas opções no serviço correspondente.
Coloque essas telas no menu do perfil responsável (ex.: RH gerencia cargos e formações; DED gerencia cursos e disciplinas; Gestão Escolar gerencia recursos de acessibilidade). Se não estiver claro, agrupe num menu "Cadastros auxiliares" e me avise.
Etapa 2 — Cadastro de Escola: DR, municípios e modalidades
2.1 Corrigir o combo de cidades
O campo Município ainda não virou uma lista: a tentativa anterior deu erro na hora de publicar. Transforme-o num select/combo de verdade, investigue e corrija o erro de build/publicação, e garanta que funciona na versão publicada.
2.2 Filtro em cascata DR → Município (manter essa ordem)
O usuário escolhe primeiro a Diretoria Regional pelo número/sigla (DEA, DR1, DR2 … DR10) e então o combo de Município mostra só as cidades daquela DR.
Não inverta a ordem (cidade primeiro, DR depois). O mentor confirmou: para quem trabalha na educação é natural saber a regional, e todo mundo quer saber a qual regional a escola pertence.
Popule o mock de DRs e municípios usando o filtro por diretoria do site da Secretaria (SEDUC/SE). Referências citadas: DEA = só Aracaju; a DR8 reúne os municípios em volta de Aracaju. Monte a associação completa DR → municípios num arquivo de dados fácil de revisar, e deixe marcado com TODO qualquer município que não conseguir confirmar.
2.3 Modalidades: só o básico
Não traga todas as modalidades do site da SEDUC. Use apenas: Anos Iniciais, Anos Finais e Ensino Médio (via cadastro de modalidades/cursos da Etapa 1, para poder adicionar outras depois).
2.4 Recursos de acessibilidade
Os checkboxes de acessibilidade devem vir do CRUD de Recursos de Acessibilidade (Etapa 1).
Etapa 3 — Professor (perfil RH): formação
Formações viram cadastro próprio (CRUD). Ao cadastrar uma formação, informe quais componentes curriculares ela habilita a lecionar (ex.: Licenciatura em Química → pode lecionar Química).
No cadastro do professor, na seção de formação, os campos devem ser separados: Formação (select vindo do CRUD), Instituição (ex.: Universidade Tiradentes) e Ano de conclusão.
Ano de conclusão é um campo digitado (não select), com validação: 4 dígitos, entre 1950 e o ano atual.
Forma de ingresso (concurso, contrato…) vem do CRUD correspondente.
Use as formações do professor para filtrar quem pode dar cada disciplina (usado na Etapa 4).
Etapa 4 — Grade horária: refazer a montagem

Hoje a tela de horário mistura tudo ("uma miscelânea"). Reestruture com base nos dois pilares da grade: Turmas e Professores. O que eles têm em comum são os componentes curriculares.

4.1 Montagem pela turma
O usuário escolhe a turma primeiro (ex.: 2º ano A).
Mostre a grade em formato de colunas (estilo quadro Kanban): uma coluna por dia (segunda a sexta) e, em cada coluna, as faixas de horário (1º horário, 2º horário… com hora de início, ex.: 7h30).
Em cada faixa há um botão "+": o usuário seleciona a disciplina e o combo de professor já vem filtrado pelos professores habilitados naquela disciplina (pela formação) e lotados naquela escola.
Permita editar/remover a aula de uma faixa (arrastar entre faixas é opcional, um bônus).
4.2 Regras de conflito
Uma turma não pode ter duas aulas na mesma faixa de horário.
Um professor não pode estar em duas turmas na mesma faixa/dia. Professores diferentes no mesmo horário em turmas diferentes é permitido.
Ao detectar conflito, bloqueie e mostre uma mensagem clara (qual turma/professor já ocupa o horário).
4.3 Duas visões do mesmo dado
Visão por turma: a grade completa da turma e uma lista das disciplinas sem professor ou com carga horária semanal ainda não preenchida (com base na matriz do curso).
Visão por professor: selecionar um professor e ver a grade semanal dele, com o indicador de horas alocadas × carga horária do vínculo/lotação — completo, sobrecarga ou horas sobrando.
Etapa 5 — Diário do professor (novo)

Depois que o horário está montado, o professor usa o diário:

O professor vê as aulas do dia (vindas da grade horária) e seleciona uma.
Lança a frequência: lista dos alunos da turma com presente/falta (padrão: todos presentes).
Registra o conteúdo ministrado (texto).
Salva a aula.
Resumo da chamada: mostre por aluno o total de aulas, presenças, faltas e o % de frequência, deixando o cálculo explícito na tela (ex.: "18 presenças de 20 aulas = 90%"). O mentor perguntou "como você chegou nesse cálculo?" — o usuário tem que conseguir entender de onde veio o número.
Etapa 6 — Matrícula do aluno (novo fluxo)

Use como referência (não como cópia) o Portal da Matrícula da SEDUC/SE. Os dados que precisam ser capturados no Cadastro Básico do aluno são:

Nome completo (sem abreviações) *, Data de nascimento *, Sexo *
Filiação 01 — nome completo da mãe ou responsável legal *
CPF do estudante *, NIS do estudante, Cartão SUS
Cor/Raça * (lista gerenciável), Recebe Bolsa Família? * (sim/não)
Termo de vacinação * (status Assinado/Não assinado, com botão "Assinar")
RG, Órgão emissor (lista), UF (lista), Data de emissão
E-mail * (para recuperação de senha), Senha * e Repetir senha *

O mentor incentivou inovar: se algo no fluxo do portal for difícil, redesenhe para ficar mais simples (ex.: formulário em etapas), desde que todos esses dados sejam capturados. Valide CPF, datas, e-mail e senhas iguais.

Depois do cadastro, o fluxo da vaga:

O responsável escolhe escola e série e solicita a vaga.
Se houver vaga disponível na turma/série → a vaga é reservada para o aluno.
Se não houver → o aluno entra na fila de espera daquela escola/série, com sua posição.
Quando uma vaga for aberta, o primeiro da fila é chamado.
O responsável pode cancelar a solicitação a qualquer momento e entrar em outras filas/escolas.
Para isso, a escola precisa ter quantidade de vagas por série/turma cadastrada (perfil Diretor ou Gestão Escolar).
Etapa 7 — Perfis
O cadastro de escola que já existe na "Gestão Escolar" pode continuar lá.
Crie o perfil DED, responsável pela gestão de cursos (cursos, modalidades, matrizes e componentes curriculares) — ainda não foi feito.
A gestão do calendário escolar fica com outro departamento (o mentor citou uma sigla que não ficou clara no áudio). Crie o perfil com um nome provisório e deixe um TODO para confirmar a sigla.
O RH segue com professores, formações, vínculos e lotações.
Critérios de aceite
 Nenhum select/checkbox com opções fixas no código; cada lista tem sua tela de gerenciamento.
 Combo de Município funcionando na versão publicada, filtrado pela DR escolhida antes.
 Associação DR → municípios completa (DEA = Aracaju) e só 3 modalidades básicas.
 Formação com CRUD próprio ligado às disciplinas; instituição e ano de conclusão separados; ano digitado e validado.
 Grade horária montada por turma em colunas (seg–sex × faixas), professor filtrado pela disciplina, conflitos bloqueados, visões por turma e por professor.
 Diário com aulas do dia, frequência, conteúdo e resumo com o cálculo explicado.
 Cadastro do aluno com todos os campos listados, solicitação de vaga e fila de espera funcionando.
 Perfil DED criado com a gestão de cursos.
 Projeto compila, publica e as telas anteriores continuam funcionando.

Ao terminar, me mostre um resumo do que foi alterado (arquivos e telas), o que ficou pendente e as dúvidas de regra de negócio.
```

**2026-10-30 15:07** (enviada durante a tarefa)

```text
https://seduc.se.gov.br/escolas/
```

**2026-10-30 15:08** (enviada durante a tarefa)

```text
(imagem anexada: print do Portal da Matrícula, Cadastro Básico)
```

**2026-10-30 15:21** (mensagem)

```text
publicou ?
```

## Resultado

Do CHANGELOG:

### v19 — Mentoria de 29/10/2026
- Regra "tudo que está em tela deve ser gerenciado": as opções de selects e caixas vêm de listas gerenciáveis, com tela de Cadastros auxiliares no menu do perfil responsável. Novas telas de Faixas de horário e Alimentos.
- Diretorias Regionais DEA e DR1 a DR10 com os 75 municípios de Sergipe. Só a DEA está confirmada; o restante está marcado como TODO em `mock/sergipe.js`.
- Modalidades básicas: Anos Iniciais, Anos Finais e Ensino Médio.
- Professor: nova aba Formação, com formação, instituição e ano de conclusão validado. A formação saiu do vínculo.
- Grade horária refeita: montagem por turma em colunas, professor filtrado por disciplina e lotação, conflitos bloqueados, visão por professor e lista do que falta preencher com base na matriz.
- Diário de classe: aulas do dia, frequência, conteúdo e resumo com o cálculo explicado.
- Matrícula: cadastro básico do estudante em etapas, solicitação de vaga com reserva, fila de espera, cancelamento e chamada automática do primeiro da fila.
- Perfil do calendário escolar (nome provisório) assume a edição do calendário. O Diretor e a Gestão cadastram vagas.
- Migração para a versão 11 dos dados, testada a partir de um banco da v18.

## Observações e pendências

Pendente: municípios de DR1 a DR10 sem fonte oficial (só a DEA confirmada). Pendente: o mapa do transporte não abre desde esta versão.

## Arquivos alterados

Diferença entre v18 e v19.

| Arquivo | Mudança |
| --- | --- |
| `CHANGELOG.md` | alterado |
| `README.md` | alterado |
| `app.js` | alterado |
| `index.html` | alterado |
| `migracoes-v11.js` | novo |
| `migracoes-v9.js` | alterado |
| `migracoes.js` | alterado |
| `mock/listas.js` | novo |
| `mock/redeSeed.js` | alterado |
| `mock/sergipe.js` | alterado |
| `models/modelos.js` | alterado |
| `pages.js` | alterado |
| `professores.js` | alterado |
| `rede.js` | alterado |
| `services/listaService.js` | novo |
| `services/matriculaService.js` | novo |
| `services/professorService.js` | alterado |
| `telas/cadastros.js` | novo |
| `telas/diario.js` | novo |
| `telas/escolas.js` | alterado |
| `telas/grade.js` | novo |
| `telas/infraestrutura.js` | alterado |
| `telas/matricula.js` | novo |
| `telas/matrizes.js` | alterado |
| `telas/professor.js` | alterado |
| `transporte.js` | alterado |
