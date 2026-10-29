/* Mock: dados de exemplo da rede (escolas parceiras, vagas, responsáveis, pedidos, merenda, transporte).
   Preenche o armazenamento do back-end simulado; as telas recebem esses dados só pelos serviços. */
'use strict';

// ---------- Dados de exemplo da rede ----------
function seedRede(db) {
  const E = id => db.escolas.find(x => x.id === id);
  const ago = h => new Date(Date.now() - h * 36e5).toISOString();
  Object.assign(E('e1'), { bairro: 'Boa Vista', integracao: 'Sistema Entrelaço', recursos: ['Acessível para cadeirantes', 'Sala de recursos (AEE)', 'Material em braille', 'Piso tátil'], ultimaSync: ago(0) });
  Object.assign(E('e2'), { bairro: 'Boa Viagem', integracao: 'Sistema Entrelaço', recursos: ['Acessível para cadeirantes', 'Intérprete de Libras'], ultimaSync: ago(0) });
  db.escolas.push(
    { id: 'e3', nome: 'Escola Estadual Jardim das Acácias', inep: '26140011', cidade: 'Recife, PE', bairro: 'Casa Amarela', endereco: 'Rua das Acácias, 88', telefone: '(81) 3183-2200', diretor: 'Sônia Figueiredo', integracao: 'API', recursos: ['Acessível para cadeirantes', 'Sala de recursos (AEE)'], ultimaSync: ago(2) },
    { id: 'e4', nome: 'Escola de Referência Parque das Mangueiras', inep: '26140022', cidade: 'Recife, PE', bairro: 'Várzea', endereco: 'Av. Afonso Olindense, 1500', telefone: '(81) 3184-7710', diretor: 'Marcos Tenório', integracao: 'API', recursos: ['Acessível para cadeirantes', 'Intérprete de Libras', 'Piso tátil'], ultimaSync: ago(5) },
    { id: 'e5', nome: 'Escola Estadual Vila Nova', inep: '26140033', cidade: 'Recife, PE', bairro: 'Iputinga', endereco: 'Rua Vila Nova, 230', telefone: '(81) 3182-4090', diretor: 'Cláudia Moraes', integracao: 'Planilha CSV', recursos: [], ultimaSync: ago(30) }
  );
  const S1 = '1º ano — Ensino médio', S2 = '2º ano — Ensino médio', S3 = '3º ano — Ensino médio';
  const v = (escolaId, serie, turno, total, ocupadasExt = 0) => ({ id: uid(), escolaId, serie, turno, total, ocupadasExt });
  db.vagas = [v('e1', S1, 'Manhã', 10), v('e1', S2, 'Manhã', 8), v('e1', S3, 'Manhã', 10), v('e2', S2, 'Tarde', 12),
    v('e3', '6º ano — Fundamental', 'Tarde', 35, 30), v('e3', S1, 'Manhã', 45, 41), v('e3', S2, 'Manhã', 45, 45), v('e3', S2, 'Tarde', 40, 33),
    v('e4', S1, 'Integral', 40, 36), v('e4', S2, 'Integral', 40, 38), v('e4', S3, 'Integral', 40, 40),
    v('e5', '9º ano — Fundamental', 'Manhã', 30, 24), v('e5', S1, 'Noite', 35, 20), v('e5', S2, 'Tarde', 35, 30), v('e5', S3, 'Noite', 35, 29)];
  const vid = (e, s, t) => db.vagas.find(x => x.escolaId === e && x.serie === s && x.turno === t).id;
  const aid = n => db.alunos.find(a => a.nome === n)?.id;
  const joao = db.alunos.find(a => a.id === 'a1'); joao.responsavel = 'Maria Silva'; joao.telResp = '(81) 99876-1234';
  db.responsaveis = [
    { id: 'r1', nome: 'Maria Silva', cpf: '123.456.789-09', telefone: '(81) 99876-1234', email: 'maria.silva@email.com', bairro: 'Boa Vista', filhos: ['a1'] },
    { id: 'r2', nome: 'Paulo Andrade', cpf: '987.654.321-00', telefone: '(81) 98765-4321', email: 'paulo.andrade@email.com', bairro: 'Iputinga', filhos: [] }
  ];
  db.prematriculas = [
    { id: uid(), protocolo: 'PM-2026-00038', responsavelId: 'r2', responsavel: 'Paulo Andrade', telefone: '(81) 98765-4321', estudante: 'Lucas Andrade', nascimento: '2011-03-14', serie: S1, turno: 'Manhã', escola1: 'e1', escola2: 'e3', escolaId: 'e1', bairro: 'Iputinga', acess: 'Nenhuma', docs: DOCS.slice(0, 4), status: 'Em análise', data: addDays(-2), obs: '' },
    { id: uid(), protocolo: 'PM-2026-00031', responsavelId: null, responsavel: 'Joana Santos', telefone: '(81) 99111-2233', estudante: 'Beatriz Santos', nascimento: '2010-07-02', serie: S2, turno: 'Manhã', escola1: 'e1', escola2: '', escolaId: 'e1', bairro: 'Boa Vista', acess: 'Baixa visão', docs: DOCS.slice(), status: 'Lista de espera', data: addDays(-9), obs: 'A turma está completa. Avisaremos quando abrir uma vaga.' },
    { id: uid(), protocolo: 'PM-2026-00035', responsavelId: null, responsavel: 'Carla Lima', telefone: '(81) 99222-3344', estudante: 'Rafael Lima', nascimento: '2010-11-20', serie: S2, turno: 'Tarde', escola1: 'e2', escola2: '', escolaId: 'e2', bairro: 'Pina', acess: 'Nenhuma', docs: ['Certidão de nascimento', 'Histórico escolar ou declaração'], status: 'Documentos pendentes', data: addDays(-5), obs: 'Envie o comprovante de residência, o cartão de vacina e o CPF.' }
  ];
  db.transferencias = [
    { id: uid(), alunoId: aid('Felipe Cavalcanti'), origemId: 'e1', destinoId: 'e3', vagaId: vid('e3', S1, 'Manhã'), serie: S1, turno: 'Manhã', motivo: 'Mudança de endereço para Casa Amarela.', solicitante: 'Escola', status: 'Aguardando escola de destino', data: addDays(-3), resposta: '' },
    { id: uid(), alunoId: aid('Rafaela Gomes'), origemId: 'e1', destinoId: 'e2', vagaId: vid('e2', S2, 'Tarde'), serie: S2, turno: 'Tarde', motivo: 'A aluna começou como jovem aprendiz no turno da manhã.', solicitante: 'Responsável', status: 'Aguardando escola de origem', data: addDays(-1), resposta: '' }
  ];
  db.contatos = [{ id: uid(), alunoId: aid('Samuel Batista'), data: addDays(-6), meio: 'Telefone', resultado: 'A mãe contou que o aluno está ajudando no trabalho da família. Combinamos o retorno às aulas.', encaminhamento: 'Nenhum' }];
  db.cardapio = {
    1: 'Arroz, feijão, frango ao molho e salada de tomate. Sobremesa: banana.',
    2: 'Macarrão com carne moída e salada de cenoura. Sobremesa: laranja.',
    3: 'Cuscuz com ovo mexido e leite com achocolatado.',
    4: 'Baião de dois, abóbora cozida e suco de acerola.',
    5: 'Sopa de legumes com carne e pão. Sobremesa: melancia.',
    obs: 'Cardápio elaborado pela nutricionista do PNAE. Quem tem restrição alimentar recebe refeição adaptada.'
  };
  db.rotas = [
    { id: 'ro1', nome: 'Rota 1 — Várzea e Iputinga', escolaId: 'e1', turno: 'Manhã', motorista: 'Severino Alves', veiculo: 'Ônibus escolar, placa PEB-4C21', capacidade: 44, pontos: '06:20 Praça da Várzea\n06:35 Av. Caxangá, 4000\n06:50 Iputinga, Rua Vila Nova\n07:15 Chegada à escola' },
    { id: 'ro2', nome: 'Rota 2 — Pina e Boa Viagem', escolaId: 'e2', turno: 'Tarde', motorista: 'Josenildo Ferreira', veiculo: 'Micro-ônibus, placa PEC-7A09', capacidade: 28, pontos: '12:10 Pina, Rua Herculano Bandeira\n12:30 Av. Conselheiro Aguiar\n12:50 Chegada à escola' }
  ];
  const bolsa = ['Samuel Batista', 'Mateus Oliveira', 'Yasmin Freitas', 'Camila Rocha', 'Igor Nascimento', 'Davi Lucas Martins'];
  const rotas = { 'Pedro Arthur Santos': 'ro1', 'Samuel Batista': 'ro1', 'Bruno Henrique Alves': 'ro1', 'Thiago Ramos': 'ro1', 'Daniel Araújo': 'ro2', 'Gustavo Pires': 'ro2' };
  const restr = { 'Sofia Carvalho': 'Intolerância à lactose', 'Caio Pereira': 'Doença celíaca (sem glúten)', 'Elisa Teixeira': 'Alergia a amendoim' };
  const peis = {
    'João Pedro Silva': { recursos: ['Material ampliado', 'Ledor nas provas', 'Tempo adicional em provas'], sala: 'Terça e quinta, 14h às 15h30', apoio: '', obs: 'Sentar nas primeiras fileiras. Lousa com contraste alto e fonte grande.' },
    'Camila Rocha': { recursos: ['Material em braille', 'Ledor nas provas', 'Transcritor', 'Tempo adicional em provas', 'Leitor de tela', 'Profissional de apoio'], sala: 'Segunda, quarta e sexta, 14h às 16h', apoio: 'Rita Barros', obs: 'Usa leitor de tela no laboratório de informática. Descrever imagens em voz alta.' }
  };
  db.alunos.forEach(a => { a.bolsaFamilia = bolsa.includes(a.nome) ? 'Sim' : 'Não'; a.rotaId = rotas[a.nome] || ''; a.restricao = restr[a.nome] || ''; if (peis[a.nome]) a.pei = peis[a.nome]; });
  db.egressos = [];
}
if (!ARMAZEM.vagas) { seedRede(ARMAZEM); persistirArmazem(); }
