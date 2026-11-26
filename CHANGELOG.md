# Histórico de versões

As versões seguem a numeração em que o protótipo foi publicado.

## v24 — Mentoria de 26/11/2026
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

## v23 — Respostas da mentoria de 19/11/2026
- A escola de destino escolhe a turma do aluno transferido dentro da rede. Depois do deferimento, o aluno aparece em "Chegando por transferência", na tela Pedidos de transferência da escola de destino. Ela escolhe uma turma da mesma série e do mesmo ano letivo, com as vagas livres de cada uma, ou a fila de espera.
- Dados de exemplo: Renata Moura, André Siqueira e Patrícia Lemos passam a ter horas livres para lotar. Marina Costa e Juliana Freitas continuam sem saldo, para mostrar o aviso.
- Confirmadas e registradas no README as regras da integração, das situações de notas externas e da edição de Pessoas.
- Migração para a versão 14 dos dados.

## v22 — Mentoria de 19/11/2026
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

## v21 — Mentoria de 12/11/2026
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

## v20 — Sem o enfeite sob os títulos
- Removidos os dois fios entrelaçados que apareciam sob o título de cada página e na tela de entrada.

## v19 — Mentoria de 29/10/2026
- Regra "tudo que está em tela deve ser gerenciado": as opções de selects e caixas vêm de listas gerenciáveis, com tela de Cadastros auxiliares no menu do perfil responsável. Novas telas de Faixas de horário e Alimentos.
- Diretorias Regionais DEA e DR1 a DR10 com os 75 municípios de Sergipe. Só a DEA está confirmada; o restante está marcado como TODO em `mock/sergipe.js`.
- Modalidades básicas: Anos Iniciais, Anos Finais e Ensino Médio.
- Professor: nova aba Formação, com formação, instituição e ano de conclusão validado. A formação saiu do vínculo.
- Grade horária refeita: montagem por turma em colunas, professor filtrado por disciplina e lotação, conflitos bloqueados, visão por professor e lista do que falta preencher com base na matriz.
- Diário de classe: aulas do dia, frequência, conteúdo e resumo com o cálculo explicado.
- Matrícula: cadastro básico do estudante em etapas, solicitação de vaga com reserva, fila de espera, cancelamento e chamada automática do primeiro da fila.
- Perfil do calendário escolar (nome provisório) assume a edição do calendário. O Diretor e a Gestão cadastram vagas.
- Migração para a versão 11 dos dados, testada a partir de um banco da v18.

## v18 — Listas no lugar de texto digitado
- Estado e cidade em lista: ao escolher o estado, a cidade mostra só os municípios dele. Sergipe vem completo (75 municípios); os outros estados vêm da API do IBGE e, se ela não responder, o campo volta a aceitar texto.
- Cadastro de professor: naturalidade e endereço com estado e cidade em lista; cargo e órgão de origem (cedidos) em lista.
- Novo padrão "lista com Outro…": quando a resposta não está na lista, abre um campo para digitar.
- Também viraram lista: "Para quem" do evento, "Assinado por" do comunicado, restrição alimentar do aluno, sala da turma, motorista da rota, processo seletivo do banco de talentos, componente curricular da matriz, motivo da transferência e motivo da ausência no transporte.
- Tipos de laboratório da infraestrutura em caixas de marcar.
- Novo `services/municipioService.js`.

## v17 — Todas as telas pelos serviços
- Separação entre o armazenamento do back-end simulado (`ARMAZEM`, usado só pelos serviços e migrações) e os dados de cada tela (`DADOS`).
- Novo `services/dadosService.js` (unidade de trabalho): antes de cada tela abrir, carrega os dados pelos serviços. Ao salvar, envia aos serviços só o que mudou, e o serviço de cada coleção valida e grava.
- As telas antigas (boletim, notas, chamada, frequência, merenda, transporte, vagas, relatórios etc.) deixam de acessar o armazenamento.
- As validações dos serviços específicos (escola, professor, lotação, curso, matriz) passam a valer também para as gravações feitas pelas telas antigas.
- Os dados de exemplo da rede saíram de `rede.js` e foram para `mock/redeSeed.js`.
- Migração para a versão 10 dos dados, sem mudança de formato.

## v16 — Mentoria de 15/10/2026
- Camada de dados: modelos (`models/`), dados simulados (`mock/`) e serviços assíncronos (`services/`). Os cadastros gravam pelos serviços.
- Escolas: Diretoria Regional e município em cascata, endereço com "Salvar endereço", diretor escolhido entre pessoas cadastradas e cursos ofertados com botão "+". A acessibilidade saiu do cadastro.
- Listagem de escolas com filtro DR → Município → Escola.
- Infraestrutura da escola, preenchida pelo Diretor, com os recursos de acessibilidade.
- Perfis DED, Secretário e Diretoria Regional.
- Gestão de matrizes: curso → séries → componentes → carga horária.
- Cadastro de professor em abas: Dados pessoais, Dependentes e Vínculos (vários por professor). A escola de lotação saiu do cadastro.
- Gerir lotações: professor em várias escolas, controle de carga horária por vínculo e histórico.
- Migração dos dados para a versão 9.

## v15 — Estilo e rota em Aracaju
- Escala tipográfica e fios entrelaçados sob os títulos, como assinatura visual.
- Tela de entrada com os perfis agrupados.
- Rotas de exemplo em Aracaju, até a Universidade Tiradentes.

## v14 — Professores, perfis, merenda e transporte
- Formações que habilitam disciplinas, com migração das disciplinas cadastradas antes.
- Perfis Diretor (calendário), RH, DAE e Motorista, com permissões configuráveis.
- RH: forma de ingresso, necessidade de professores, contratos a vencer e banco de talentos.
- Merenda: estoque por escola, consumo diário, alerta "Estoque na metade" e painel do DAE.
- Transporte: mapa das rotas, ponto mais próximo, QR de embarque, aviso de ausência e tela do motorista.

## v13 — Escola definida pelo usuário
- A escola passa a ser definida no login, sem seletor de escola dentro do sistema.

## v12 — Versão para celular
- Barra de navegação inferior, topo compacto, janelas em tela cheia e tabelas em cartões.

## v11 — Relatórios
- Relatório da gestão organizado por seções.

## v8 a v10 — Painel inicial
- Cartões da página inicial empilhados e indicadores lado a lado, numa linha.

## v7 — Trocar de perfil no celular
- Botão de perfil no topo da tela, no celular.

## v6 — Rede pública
- Vagas da rede, pré-matrícula online, transferências entre escolas e integrações (API e planilha).
- Busca ativa e Bolsa Família, educação especial (AEE), merenda e transporte escolar.
- Perfil Responsável.

## v5 — Novo estilo
- "Fio do dia" nas páginas iniciais, sem rótulos em maiúsculas.

## v2 a v4 — Ajustes de uso
- Modo claro, calendário mensal, notificações, gráfico de desempenho do aluno, sem financeiro (escola pública) e sem atalhos com Alt.

## v1 — Protótipo inicial
- Perfis Gestão, Professor e Aluno, com cadastros, notas, frequência, atividades, comunicados e recursos de acessibilidade.
