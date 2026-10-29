# Histórico de versões

As versões seguem a numeração em que o protótipo foi publicado.

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
