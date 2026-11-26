# P13 — Mentoria de 15/10/2026 (Etapas 0 a 6)

| Campo | Valor |
| --- | --- |
| Data | 2026-10-15 |
| Versão | v16 e v17 |
| Commit | [`67c460b`](https://github.com/jornandoneto-web/Entrela-o/commit/67c460b5d51c2ade570403ffb5be4edd81967eb7) |
| Release | [v17](https://github.com/jornandoneto-web/Entrela-o/releases/tag/v17) |
| Situação | Atendido |
| Como foi verificado | Os 32 testes dos critérios de aceite passaram, e todas as telas de 13 usuários abriram sem erro. |

## Prompt original

Texto como foi enviado, sem correções.

**2026-10-15 20:58** (mensagem)

```text
Contexto

Na mentoria de hoje, o professor revisou as telas do nosso sistema e pediu as alterações abaixo. Implemente todas elas no projeto em que já estamos trabalhando, etapa por etapa, aproveitando as telas, componentes e padrões que já existem. Não troque bibliotecas nem refaça telas que não estão nesta lista, e não quebre o que já funciona.

Etapa 0 — Arquitetura dos dados: objetos em vez de mocks soltos na tela

O professor pediu que nenhuma tela traga dados mockados direto no componente. Toda tela deve trabalhar com objetos/modelos tipados, e o mock deve apenas preencher esses objetos, simulando um back-end.

Crie (ou organize) uma camada de modelos/tipos: Escola, DiretoriaRegional, Municipio, Curso, Matriz, Serie, ComponenteCurricular, InfraestruturaEscola, Pessoa, Professor, Dependente, Vinculo, Formacao, Lotacao.
Crie uma camada de serviço mock (ex.: services/escolaService, services/professorService...) com funções assíncronas como listar, buscarPorId, salvar, atualizar e remover, que leem e gravam arrays em memória (ou no armazenamento que o projeto já usa). As telas chamam só esses serviços. Quando existir um back-end real, basta trocar a implementação.
Use composição entre objetos, como o professor explicou: "a pessoa é um objeto, e os olhos são um objeto dentro dela". Exemplos: Professor tem Pessoa, uma lista de Vinculo e uma lista de Dependente; Lotacao referencia um Professor e uma Escola, mas não fica dentro do cadastro do professor.
Os formulários devem montar o objeto completo e enviá-lo ao serviço ao salvar.
Etapa 1 — Cadastro de Escola
1.1 Diretoria Regional + filtro em cascata
Adicione o campo Diretoria Regional (DR) como um select, posicionado antes do campo Município.
Faça o filtro em cascata: ao escolher a DR, o select de Município mostra somente os municípios daquela DR. Se a DR for trocada, limpe o município selecionado.
O campo Município deve ser uma lista (select), não um texto livre.
Popule o mock de DRs e municípios com base na lista oficial do site da Secretaria de Educação de Sergipe (seed.se.gov.br). Por exemplo, a DEA (Diretoria de Educação de Aracaju) contém só o município de Aracaju; as demais DRs (DRE 1 a DRE 10) têm cada uma o seu grupo de municípios. Se não for possível confirmar a lista completa, deixe a estrutura pronta, com alguns exemplos, num arquivo de mock fácil de completar, e me avise.
Modelo sugerido: DiretoriaRegional { id, sigla, nome, municipios: Municipio[] }.
1.2 Endereço e diretor
Mantenha ou ajuste os campos de endereço (incluindo bairro) e garanta que o botão Salvar endereço funcione.
Mantenha o campo Diretor da escola, de preferência como um select de pessoas cadastradas.
1.3 Cursos ofertados pela escola
No cadastro da escola, adicione a seleção dos cursos que a escola oferta (seleção múltipla).
Se o curso já existe, o usuário só o seleciona. Se não existe, deve haver um botão "+" ao lado que abre um modal ou formulário rápido para cadastrar um novo curso na hora. O curso novo já aparece selecionado.
Exemplos de cursos para o mock: Ensino Fundamental – Anos Iniciais; Ensino Fundamental – Anos Finais; Ensino Médio; Ensino Médio em Tempo Integral; Ensino Técnico; Ensino Médio com Técnico (ex.: Programação para Internet, Mobile, Redes).
1.4 Remover acessibilidade do cadastro
Retire os recursos de acessibilidade do cadastro de escola. Eles passam para o módulo de Infraestrutura (Etapa 2).
1.5 Listagem/filtro de escolas
Na listagem de escolas, coloque os filtros nesta ordem: DR → Município → Escola, também em cascata. Verifique que o filtro funciona de fato.
Etapa 2 — Infraestrutura da Escola (nova área)
Crie uma área Infraestrutura da Escola, separada do cadastro da escola.
Quem preenche é o Diretor da própria escola, então essa área fica no painel do perfil Diretor, que acessa apenas a sua escola.
Campos (numéricos ou sim/não):
Quantidade de salas de aula
Quantidade de salas de informática/TI
Quantidade de laboratórios (opcionalmente com o tipo)
Quantidade de banheiros
Quantidade de salas de professores
Possui ginásio/quadra? (sim/não)
Recursos de acessibilidade (lista de checkboxes, ex.: rampa, banheiro adaptado, piso tátil, elevador, sala de recursos multifuncionais; com opção de adicionar outro)
Modelo sugerido: InfraestruturaEscola { escolaId, salasAula, salasTI, laboratorios, banheiros, salasProfessores, possuiGinasio, recursosAcessibilidade: string[] }.
Etapa 3 — Perfis / departamentos

Organize o acesso por perfis. O professor pediu para trabalhar só com 3 ou 4 departamentos por enquanto:

DED (Departamento de Educação): gerencia cursos e matrizes (Etapa 4).
RH: gerencia professores, vínculos e lotações (Etapas 5 e 6).
Diretor: gerencia a infraestrutura da sua escola (Etapa 2).
Secretário e Diretoria Regional: deixe a estrutura dos perfis criada, mesmo que com poucas telas.

Use o mecanismo de perfis/menus que o projeto já tem.

Etapa 4 — Gestão de Matrizes (perfil DED)
Crie a tela Gestão de Matrizes, na qual o DED detalha cada curso.
Fluxo: selecionar um curso → cadastrar as séries (ex.: Ensino Médio → 1ª, 2ª e 3ª série) → em cada série, cadastrar os componentes curriculares (Português, Matemática, História, Física, Química...) → para cada componente, informar a carga horária (ex.: Matemática – 80 h).
Mostre o total de carga horária por série.
Modelo sugerido: Matriz { cursoId, series: Serie[] }, Serie { nome, componentes: ComponenteCurricular[] }, ComponenteCurricular { nome, cargaHoraria }.
Não implemente agora o conteúdo/assuntos de cada disciplina. Isso será detalhado futuramente pelo perfil Professor; se quiser, deixe só um comentário/TODO.
Etapa 5 — Cadastro de Professor (perfil RH), reorganizado

O cadastro do professor deve ser dividido em seções/abas separadas, cada uma montando sua parte do objeto Professor:

5.1 Dados pessoais (Pessoa)
Nome completo, CPF, data de nascimento, sexo, estado civil, telefone(s), e-mail, naturalidade (cidade e UF de nascimento) e endereço.
Esses dados são importantes porque são informados a órgãos como a Receita Federal.
5.2 Dependentes (área separada)
Seção própria de Dependentes (ex.: filhos), com nome, parentesco e data de nascimento, permitindo adicionar e remover vários. Não coloque "filhos" nos dados básicos.
5.3 Vínculo empregatício (Vinculo)

Um professor pode ter mais de um vínculo, então essa seção deve permitir uma lista. Cada vínculo tem:

Cargo (ex.: Professor)
Formações, em seleção múltipla (ex.: Direito, Ciências Biológicas, Licenciatura em Física)
Disciplina(s) que leciona
Forma de ingresso: Concurso, Contrato etc.
Data de início e data de fim, esta opcional
Carga horária do vínculo: o padrão é 25 h, o integral é 40 h; permita outros valores
Anexo do contrato (upload de arquivo; no mock, guarde só o nome do arquivo)
5.4 Remover a lotação do cadastro
Retire o campo "Escola de lotação" do cadastro do professor. Cadastro e lotação são coisas diferentes, e a lotação vai para a Etapa 6.
Etapa 6 — Gerir Lotações (nova tela, perfil RH)
Crie a tela Gerir Lotações.
O usuário filtra/seleciona um professor e vê todas as lotações dele.
Um professor pode estar lotado em mais de uma escola ao mesmo tempo. Exemplo real: um professor de Artes com 25 h dá 10 h numa escola que só tem 10 turmas, depois mais 10 h em outra e 5 h numa terceira, até completar as 25 h.
Cada lotação tem: professor, vínculo, escola (com filtro DR → Município → Escola), carga horária na escola, data de início e data de fim.
Validação: a soma da carga horária das lotações ativas de um vínculo não pode passar a carga horária desse vínculo. Mostre o saldo de horas disponíveis.
Mostre o histórico de lotações, ou seja, as escolas onde o professor passou e as que deixou (lotações encerradas). Mantenha isso simples, sem complexidade extra.
Modelo sugerido: Lotacao { id, professorId, vinculoId, escolaId, cargaHoraria, dataInicio, dataFim? }.
Critérios de aceite (verifique no final)
 Cadastro de escola: DR antes de Município, cascata funcionando, município como select, acessibilidade removida e cursos com seleção mais botão "+".
 Listagem de escolas filtrando por DR → Município → Escola.
 Infraestrutura da Escola disponível no painel do Diretor, com acessibilidade incluída.
 Gestão de Matrizes (DED): curso → séries → componentes → carga horária.
 Cadastro de professor dividido em Dados pessoais, Dependentes e Vínculos (múltiplos), sem escola de lotação.
 Gerir Lotações com várias escolas por professor, validação de carga horária e histórico.
 Nenhuma tela com mock embutido: todas usam modelos e serviços mock.
 O projeto compila/roda sem erros e as telas antigas continuam funcionando.

Ao terminar, me mostre um resumo do que foi alterado (arquivos e telas), o que ficou pendente e qualquer dúvida sobre regra de negócio.
```

**2026-10-29 19:15** (mensagem)

```text
O prompt está pronto no arquivo **Prompt_Alteracoes_Mentoria_15102026.md**, para colar no seu assistente de código (Claude Code, Cursor etc.) com o projeto aberto. Ele pede que o assistente primeiro analise o projeto e apresente um plano, e só depois faça as mudanças, em 7 etapas:

1. **Organização dos dados:** as telas passam a usar objetos, e os dados de teste ficam numa camada que simula o back-end.
2. **Cadastro de escola:** filtro em cascata Diretoria Regional → município, cursos com botão "+" e acessibilidade fora desse cadastro.
3. **Infraestrutura da escola:** nova área, no painel do Diretor.
4. **Perfis:** DED, RH, Diretor, Secretário e Diretoria Regional.
5. **Gestão de Matrizes:** curso → série → componente → carga horária.
6. **Cadastro de professor:** dividido em dados pessoais, dependentes e vínculos, sem a escola de lotação.
7. **Gerir Lotações:** nova tela, com professor em várias escolas, controle de carga horária e histórico.

No final há uma lista de critérios de aceite para você conferir o resultado.

Alguns detalhes eu completei por conta própria, porque a transcrição não deixava claro ou estava com erros:
- **Siglas:** usei "DED" para o departamento que cuida das matrizes.
- **Nomes de etapas:** dei nomes às etapas de ensino na lista de cursos.
- **Lotação:** acrescentei a regra de que a soma das horas nas escolas não pode passar a carga horária do vínculo.
- **Diretorias e municípios:** a lista completa deve sair do site da Secretaria de Educação. Só confirmei pela gravação que a DEA corresponde a Aracaju.

Vale revisar esses pontos antes de rodar o prompt.
```

**2026-10-29 19:40** (mensagem)

```text
Contexto

Na mentoria de hoje, o professor revisou as telas do nosso sistema e pediu as alterações abaixo. Implemente todas elas no projeto em que já estamos trabalhando, etapa por etapa, aproveitando as telas, componentes e padrões que já existem. Não troque bibliotecas nem refaça telas que não estão nesta lista, e não quebre o que já funciona.

Etapa 0 — Arquitetura dos dados: objetos em vez de mocks soltos na tela

O professor pediu que nenhuma tela traga dados mockados direto no componente. Toda tela deve trabalhar com objetos/modelos tipados, e o mock deve apenas preencher esses objetos, simulando um back-end.

Crie (ou organize) uma camada de modelos/tipos: Escola, DiretoriaRegional, Municipio, Curso, Matriz, Serie, ComponenteCurricular, InfraestruturaEscola, Pessoa, Professor, Dependente, Vinculo, Formacao, Lotacao.
Crie uma camada de serviço mock (ex.: services/escolaService, services/professorService...) com funções assíncronas como listar, buscarPorId, salvar, atualizar e remover, que leem e gravam arrays em memória (ou no armazenamento que o projeto já usa). As telas chamam só esses serviços. Quando existir um back-end real, basta trocar a implementação.
Use composição entre objetos, como o professor explicou: "a pessoa é um objeto, e os olhos são um objeto dentro dela". Exemplos: Professor tem Pessoa, uma lista de Vinculo e uma lista de Dependente; Lotacao referencia um Professor e uma Escola, mas não fica dentro do cadastro do professor.
Os formulários devem montar o objeto completo e enviá-lo ao serviço ao salvar.
Etapa 1 — Cadastro de Escola
1.1 Diretoria Regional + filtro em cascata
Adicione o campo Diretoria Regional (DR) como um select, posicionado antes do campo Município.
Faça o filtro em cascata: ao escolher a DR, o select de Município mostra somente os municípios daquela DR. Se a DR for trocada, limpe o município selecionado.
O campo Município deve ser uma lista (select), não um texto livre.
Popule o mock de DRs e municípios com base na lista oficial do site da Secretaria de Educação de Sergipe (seed.se.gov.br). Por exemplo, a DEA (Diretoria de Educação de Aracaju) contém só o município de Aracaju; as demais DRs (DRE 1 a DRE 10) têm cada uma o seu grupo de municípios. Se não for possível confirmar a lista completa, deixe a estrutura pronta, com alguns exemplos, num arquivo de mock fácil de completar, e me avise.
Modelo sugerido: DiretoriaRegional { id, sigla, nome, municipios: Municipio[] }.
1.2 Endereço e diretor
Mantenha ou ajuste os campos de endereço (incluindo bairro) e garanta que o botão Salvar endereço funcione.
Mantenha o campo Diretor da escola, de preferência como um select de pessoas cadastradas.
1.3 Cursos ofertados pela escola
No cadastro da escola, adicione a seleção dos cursos que a escola oferta (seleção múltipla).
Se o curso já existe, o usuário só o seleciona. Se não existe, deve haver um botão "+" ao lado que abre um modal ou formulário rápido para cadastrar um novo curso na hora. O curso novo já aparece selecionado.
Exemplos de cursos para o mock: Ensino Fundamental – Anos Iniciais; Ensino Fundamental – Anos Finais; Ensino Médio; Ensino Médio em Tempo Integral; Ensino Técnico; Ensino Médio com Técnico (ex.: Programação para Internet, Mobile, Redes).
1.4 Remover acessibilidade do cadastro
Retire os recursos de acessibilidade do cadastro de escola. Eles passam para o módulo de Infraestrutura (Etapa 2).
1.5 Listagem/filtro de escolas
Na listagem de escolas, coloque os filtros nesta ordem: DR → Município → Escola, também em cascata. Verifique que o filtro funciona de fato.
Etapa 2 — Infraestrutura da Escola (nova área)
Crie uma área Infraestrutura da Escola, separada do cadastro da escola.
Quem preenche é o Diretor da própria escola, então essa área fica no painel do perfil Diretor, que acessa apenas a sua escola.
Campos (numéricos ou sim/não):
Quantidade de salas de aula
Quantidade de salas de informática/TI
Quantidade de laboratórios (opcionalmente com o tipo)
Quantidade de banheiros
Quantidade de salas de professores
Possui ginásio/quadra? (sim/não)
Recursos de acessibilidade (lista de checkboxes, ex.: rampa, banheiro adaptado, piso tátil, elevador, sala de recursos multifuncionais; com opção de adicionar outro)
Modelo sugerido: InfraestruturaEscola { escolaId, salasAula, salasTI, laboratorios, banheiros, salasProfessores, possuiGinasio, recursosAcessibilidade: string[] }.
Etapa 3 — Perfis / departamentos

Organize o acesso por perfis. O professor pediu para trabalhar só com 3 ou 4 departamentos por enquanto:

DED (Departamento de Educação): gerencia cursos e matrizes (Etapa 4).
RH: gerencia professores, vínculos e lotações (Etapas 5 e 6).
Diretor: gerencia a infraestrutura da sua escola (Etapa 2).
Secretário e Diretoria Regional: deixe a estrutura dos perfis criada, mesmo que com poucas telas.

Use o mecanismo de perfis/menus que o projeto já tem.

Etapa 4 — Gestão de Matrizes (perfil DED)
Crie a tela Gestão de Matrizes, na qual o DED detalha cada curso.
Fluxo: selecionar um curso → cadastrar as séries (ex.: Ensino Médio → 1ª, 2ª e 3ª série) → em cada série, cadastrar os componentes curriculares (Português, Matemática, História, Física, Química...) → para cada componente, informar a carga horária (ex.: Matemática – 80 h).
Mostre o total de carga horária por série.
Modelo sugerido: Matriz { cursoId, series: Serie[] }, Serie { nome, componentes: ComponenteCurricular[] }, ComponenteCurricular { nome, cargaHoraria }.
Não implemente agora o conteúdo/assuntos de cada disciplina. Isso será detalhado futuramente pelo perfil Professor; se quiser, deixe só um comentário/TODO.
Etapa 5 — Cadastro de Professor (perfil RH), reorganizado

O cadastro do professor deve ser dividido em seções/abas separadas, cada uma montando sua parte do objeto Professor:

5.1 Dados pessoais (Pessoa)
Nome completo, CPF, data de nascimento, sexo, estado civil, telefone(s), e-mail, naturalidade (cidade e UF de nascimento) e endereço.
Esses dados são importantes porque são informados a órgãos como a Receita Federal.
5.2 Dependentes (área separada)
Seção própria de Dependentes (ex.: filhos), com nome, parentesco e data de nascimento, permitindo adicionar e remover vários. Não coloque "filhos" nos dados básicos.
5.3 Vínculo empregatício (Vinculo)

Um professor pode ter mais de um vínculo, então essa seção deve permitir uma lista. Cada vínculo tem:

Cargo (ex.: Professor)
Formações, em seleção múltipla (ex.: Direito, Ciências Biológicas, Licenciatura em Física)
Disciplina(s) que leciona
Forma de ingresso: Concurso, Contrato etc.
Data de início e data de fim, esta opcional
Carga horária do vínculo: o padrão é 25 h, o integral é 40 h; permita outros valores
Anexo do contrato (upload de arquivo; no mock, guarde só o nome do arquivo)
5.4 Remover a lotação do cadastro
Retire o campo "Escola de lotação" do cadastro do professor. Cadastro e lotação são coisas diferentes, e a lotação vai para a Etapa 6.
Etapa 6 — Gerir Lotações (nova tela, perfil RH)
Crie a tela Gerir Lotações.
O usuário filtra/seleciona um professor e vê todas as lotações dele.
Um professor pode estar lotado em mais de uma escola ao mesmo tempo. Exemplo real: um professor de Artes com 25 h dá 10 h numa escola que só tem 10 turmas, depois mais 10 h em outra e 5 h numa terceira, até completar as 25 h.
Cada lotação tem: professor, vínculo, escola (com filtro DR → Município → Escola), carga horária na escola, data de início e data de fim.
Validação: a soma da carga horária das lotações ativas de um vínculo não pode passar a carga horária desse vínculo. Mostre o saldo de horas disponíveis.
Mostre o histórico de lotações, ou seja, as escolas onde o professor passou e as que deixou (lotações encerradas). Mantenha isso simples, sem complexidade extra.
Modelo sugerido: Lotacao { id, professorId, vinculoId, escolaId, cargaHoraria, dataInicio, dataFim? }.
Critérios de aceite (verifique no final)
 Cadastro de escola: DR antes de Município, cascata funcionando, município como select, acessibilidade removida e cursos com seleção mais botão "+".
 Listagem de escolas filtrando por DR → Município → Escola.
 Infraestrutura da Escola disponível no painel do Diretor, com acessibilidade incluída.
 Gestão de Matrizes (DED): curso → séries → componentes → carga horária.
 Cadastro de professor dividido em Dados pessoais, Dependentes e Vínculos (múltiplos), sem escola de lotação.
 Gerir Lotações com várias escolas por professor, validação de carga horária e histórico.
 Nenhuma tela com mock embutido: todas usam modelos e serviços mock.
 O projeto compila/roda sem erros e as telas antigas continuam funcionando.

Ao terminar, me mostre um resumo do que foi alterado (arquivos e telas), o que ficou pendente e qualquer dúvida sobre regra de negócio.
```

**2026-10-29 19:43** (mensagem)

```text
faça e publique
```

**2026-10-29 20:00** (mensagem)

```text
Na mentoria de hoje, o professor revisou as telas do nosso sistema e pediu as alterações abaixo. Implemente todas elas no projeto em que já estamos trabalhando, etapa por etapa, aproveitando as telas, componentes e padrões que já existem. Não troque bibliotecas nem refaça telas que não estão nesta lista, e não quebre o que já funciona.

Etapa 0 — Arquitetura dos dados: objetos em vez de mocks soltos na tela

O professor pediu que nenhuma tela traga dados mockados direto no componente. Toda tela deve trabalhar com objetos/modelos tipados, e o mock deve apenas preencher esses objetos, simulando um back-end.

Crie (ou organize) uma camada de modelos/tipos: Escola, DiretoriaRegional, Municipio, Curso, Matriz, Serie, ComponenteCurricular, InfraestruturaEscola, Pessoa, Professor, Dependente, Vinculo, Formacao, Lotacao.
Crie uma camada de serviço mock (ex.: services/escolaService, services/professorService...) com funções assíncronas como listar, buscarPorId, salvar, atualizar e remover, que leem e gravam arrays em memória (ou no armazenamento que o projeto já usa). As telas chamam só esses serviços. Quando existir um back-end real, basta trocar a implementação.
Use composição entre objetos, como o professor explicou: "a pessoa é um objeto, e os olhos são um objeto dentro dela". Exemplos: Professor tem Pessoa, uma lista de Vinculo e uma lista de Dependente; Lotacao referencia um Professor e uma Escola, mas não fica dentro do cadastro do professor.
Os formulários devem montar o objeto completo e enviá-lo ao serviço ao salvar.
Etapa 1 — Cadastro de Escola
1.1 Diretoria Regional + filtro em cascata
Adicione o campo Diretoria Regional (DR) como um select, posicionado antes do campo Município.
Faça o filtro em cascata: ao escolher a DR, o select de Município mostra somente os municípios daquela DR. Se a DR for trocada, limpe o município selecionado.
O campo Município deve ser uma lista (select), não um texto livre.
Popule o mock de DRs e municípios com base na lista oficial do site da Secretaria de Educação de Sergipe (seed.se.gov.br). Por exemplo, a DEA (Diretoria de Educação de Aracaju) contém só o município de Aracaju; as demais DRs (DRE 1 a DRE 10) têm cada uma o seu grupo de municípios. Se não for possível confirmar a lista completa, deixe a estrutura pronta, com alguns exemplos, num arquivo de mock fácil de completar, e me avise.
Modelo sugerido: DiretoriaRegional { id, sigla, nome, municipios: Municipio[] }.
1.2 Endereço e diretor
Mantenha ou ajuste os campos de endereço (incluindo bairro) e garanta que o botão Salvar endereço funcione.
Mantenha o campo Diretor da escola, de preferência como um select de pessoas cadastradas.
1.3 Cursos ofertados pela escola
No cadastro da escola, adicione a seleção dos cursos que a escola oferta (seleção múltipla).
Se o curso já existe, o usuário só o seleciona. Se não existe, deve haver um botão "+" ao lado que abre um modal ou formulário rápido para cadastrar um novo curso na hora. O curso novo já aparece selecionado.
Exemplos de cursos para o mock: Ensino Fundamental – Anos Iniciais; Ensino Fundamental – Anos Finais; Ensino Médio; Ensino Médio em Tempo Integral; Ensino Técnico; Ensino Médio com Técnico (ex.: Programação para Internet, Mobile, Redes).
1.4 Remover acessibilidade do cadastro
Retire os recursos de acessibilidade do cadastro de escola. Eles passam para o módulo de Infraestrutura (Etapa 2).
1.5 Listagem/filtro de escolas
Na listagem de escolas, coloque os filtros nesta ordem: DR → Município → Escola, também em cascata. Verifique que o filtro funciona de fato.
Etapa 2 — Infraestrutura da Escola (nova área)
Crie uma área Infraestrutura da Escola, separada do cadastro da escola.
Quem preenche é o Diretor da própria escola, então essa área fica no painel do perfil Diretor, que acessa apenas a sua escola.
Campos (numéricos ou sim/não):
Quantidade de salas de aula
Quantidade de salas de informática/TI
Quantidade de laboratórios (opcionalmente com o tipo)
Quantidade de banheiros
Quantidade de salas de professores
Possui ginásio/quadra? (sim/não)
Recursos de acessibilidade (lista de checkboxes, ex.: rampa, banheiro adaptado, piso tátil, elevador, sala de recursos multifuncionais; com opção de adicionar outro)
Modelo sugerido: InfraestruturaEscola { escolaId, salasAula, salasTI, laboratorios, banheiros, salasProfessores, possuiGinasio, recursosAcessibilidade: string[] }.
Etapa 3 — Perfis / departamentos

Organize o acesso por perfis. O professor pediu para trabalhar só com 3 ou 4 departamentos por enquanto:

DED (Departamento de Educação): gerencia cursos e matrizes (Etapa 4).
RH: gerencia professores, vínculos e lotações (Etapas 5 e 6).
Diretor: gerencia a infraestrutura da sua escola (Etapa 2).
Secretário e Diretoria Regional: deixe a estrutura dos perfis criada, mesmo que com poucas telas.

Use o mecanismo de perfis/menus que o projeto já tem.

Etapa 4 — Gestão de Matrizes (perfil DED)
Crie a tela Gestão de Matrizes, na qual o DED detalha cada curso.
Fluxo: selecionar um curso → cadastrar as séries (ex.: Ensino Médio → 1ª, 2ª e 3ª série) → em cada série, cadastrar os componentes curriculares (Português, Matemática, História, Física, Química...) → para cada componente, informar a carga horária (ex.: Matemática – 80 h).
Mostre o total de carga horária por série.
Modelo sugerido: Matriz { cursoId, series: Serie[] }, Serie { nome, componentes: ComponenteCurricular[] }, ComponenteCurricular { nome, cargaHoraria }.
Não implemente agora o conteúdo/assuntos de cada disciplina. Isso será detalhado futuramente pelo perfil Professor; se quiser, deixe só um comentário/TODO.
Etapa 5 — Cadastro de Professor (perfil RH), reorganizado

O cadastro do professor deve ser dividido em seções/abas separadas, cada uma montando sua parte do objeto Professor:

5.1 Dados pessoais (Pessoa)
Nome completo, CPF, data de nascimento, sexo, estado civil, telefone(s), e-mail, naturalidade (cidade e UF de nascimento) e endereço.
Esses dados são importantes porque são informados a órgãos como a Receita Federal.
5.2 Dependentes (área separada)
Seção própria de Dependentes (ex.: filhos), com nome, parentesco e data de nascimento, permitindo adicionar e remover vários. Não coloque "filhos" nos dados básicos.
5.3 Vínculo empregatício (Vinculo)

Um professor pode ter mais de um vínculo, então essa seção deve permitir uma lista. Cada vínculo tem:

Cargo (ex.: Professor)
Formações, em seleção múltipla (ex.: Direito, Ciências Biológicas, Licenciatura em Física)
Disciplina(s) que leciona
Forma de ingresso: Concurso, Contrato etc.
Data de início e data de fim, esta opcional
Carga horária do vínculo: o padrão é 25 h, o integral é 40 h; permita outros valores
Anexo do contrato (upload de arquivo; no mock, guarde só o nome do arquivo)
5.4 Remover a lotação do cadastro
Retire o campo "Escola de lotação" do cadastro do professor. Cadastro e lotação são coisas diferentes, e a lotação vai para a Etapa 6.
Etapa 6 — Gerir Lotações (nova tela, perfil RH)
Crie a tela Gerir Lotações.
O usuário filtra/seleciona um professor e vê todas as lotações dele.
Um professor pode estar lotado em mais de uma escola ao mesmo tempo. Exemplo real: um professor de Artes com 25 h dá 10 h numa escola que só tem 10 turmas, depois mais 10 h em outra e 5 h numa terceira, até completar as 25 h.
Cada lotação tem: professor, vínculo, escola (com filtro DR → Município → Escola), carga horária na escola, data de início e data de fim.
Validação: a soma da carga horária das lotações ativas de um vínculo não pode passar a carga horária desse vínculo. Mostre o saldo de horas disponíveis.
Mostre o histórico de lotações, ou seja, as escolas onde o professor passou e as que deixou (lotações encerradas). Mantenha isso simples, sem complexidade extra.
Modelo sugerido: Lotacao { id, professorId, vinculoId, escolaId, cargaHoraria, dataInicio, dataFim? }.
Critérios de aceite (verifique no final)
 Cadastro de escola: DR antes de Município, cascata funcionando, município como select, acessibilidade removida e cursos com seleção mais botão "+".
 Listagem de escolas filtrando por DR → Município → Escola.
 Infraestrutura da Escola disponível no painel do Diretor, com acessibilidade incluída.
 Gestão de Matrizes (DED): curso → séries → componentes → carga horária.
 Cadastro de professor dividido em Dados pessoais, Dependentes e Vínculos (múltiplos), sem escola de lotação.
 Gerir Lotações com várias escolas por professor, validação de carga horária e histórico.
 Nenhuma tela com mock embutido: todas usam modelos e serviços mock.
 O projeto compila/roda sem erros e as telas antigas continuam funcionando.

Ao terminar, me mostre um resumo do que foi alterado (arquivos e telas), o que ficou pendente e qualquer dúvida sobre regra de negócio.
```

**2026-10-29 20:03** (mensagem)

```text
2 qualquer pessoa cadastrada

3 sim
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

### v17 — Todas as telas pelos serviços
- Separação entre o armazenamento do back-end simulado (`ARMAZEM`, usado só pelos serviços e migrações) e os dados de cada tela (`DADOS`).
- Novo `services/dadosService.js` (unidade de trabalho): antes de cada tela abrir, carrega os dados pelos serviços. Ao salvar, envia aos serviços só o que mudou, e o serviço de cada coleção valida e grava.
- As telas antigas (boletim, notas, chamada, frequência, merenda, transporte, vagas, relatórios etc.) deixam de acessar o armazenamento.
- As validações dos serviços específicos (escola, professor, lotação, curso, matriz) passam a valer também para as gravações feitas pelas telas antigas.
- Os dados de exemplo da rede saíram de `rede.js` e foram para `mock/redeSeed.js`.
- Migração para a versão 10 dos dados, sem mudança de formato.

## Observações e pendências

Respostas do usuário: o diretor pode ser qualquer pessoa cadastrada; a carga do vínculo é semanal e a da matriz é anual. A v16 é o primeiro commit no Git, por isso a lista de arquivos é a do projeto inteiro.

## Arquivos alterados

Diferença entre o início e v17.

| Arquivo | Mudança |
| --- | --- |
| `CHANGELOG.md` | alterado |
| `README.md` | alterado |
| `app.js` | alterado |
| `estoque.js` | alterado |
| `index.html` | alterado |
| `migracoes-v9.js` | alterado |
| `migracoes.js` | alterado |
| `mock/redeSeed.js` | novo |
| `pages.js` | alterado |
| `professores.js` | alterado |
| `rede.js` | alterado |
| `services/base.js` | alterado |
| `services/cursoService.js` | alterado |
| `services/dadosService.js` | novo |
| `services/escolaService.js` | alterado |
| `services/infraestruturaService.js` | alterado |
| `services/lotacaoService.js` | alterado |
| `services/pessoaService.js` | alterado |
| `services/professorService.js` | alterado |
| `telas/escolas.js` | alterado |
| `telas/matrizes.js` | alterado |
| `telas/perfis.js` | alterado |
| `telas/professor.js` | alterado |
| `transporte.js` | alterado |
