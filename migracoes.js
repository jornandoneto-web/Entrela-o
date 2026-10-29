/* Portal Entrelaço — migrações de dados (versão 6 → 7) e dados de exemplo das melhorias. Carregado por último: também inicia o app. */
'use strict';

// Catálogo inicial de formações. "chaves" ajudam a reconhecer o curso no texto livre que existia antes.
const FORMACOES_PADRAO = [
  { id: 'f1', nome: 'Licenciatura em Matemática', disciplinas: ['d1'], chaves: ['matematica'] },
  { id: 'f2', nome: 'Licenciatura em Física', disciplinas: ['d6', 'd1'], chaves: ['fisica'] },
  { id: 'f3', nome: 'Letras — Português', disciplinas: ['d2'], chaves: ['letras', 'portugues'] },
  { id: 'f4', nome: 'Letras — Inglês', disciplinas: ['d7'], chaves: ['letras', 'ingles'] },
  { id: 'f5', nome: 'Licenciatura em História', disciplinas: ['d3'], chaves: ['historia'] },
  { id: 'f6', nome: 'Licenciatura em Geografia', disciplinas: ['d4'], chaves: ['geografia'] },
  { id: 'f7', nome: 'Ciências Biológicas', disciplinas: ['d5'], chaves: ['biolog'] },
  { id: 'f8', nome: 'Licenciatura em Química', disciplinas: ['d8'], chaves: ['quimica'] },
  { id: 'f9', nome: 'Direito', disciplinas: [], chaves: ['direito'] },
  { id: 'f10', nome: 'Pedagogia', disciplinas: [], chaves: ['pedagogia'] }
];
const ALIMENTOS_PADRAO = [
  ['al1', 'Carne bovina', 'kg'], ['al2', 'Frango', 'kg'], ['al3', 'Arroz', 'kg'], ['al4', 'Feijão', 'kg'], ['al5', 'Macarrão', 'kg'],
  ['al6', 'Flocão de milho', 'kg'], ['al7', 'Leite', 'L'], ['al8', 'Ovos', 'dz'], ['al9', 'Frutas', 'kg']
].map(([id, nome, unidade]) => ({ id, nome, unidade }));

// Converte as disciplinas marcadas à mão em formações:
// 1) formações reconhecidas no texto do curso que cobrem alguma disciplina do professor;
// 2) para o que sobrar, a formação que cobre mais disciplinas restantes (marcada como "deduzida");
// 3) o que nenhuma formação cobre fica listado para revisão.
function migrarFormacao(p, formacoes) {
  const txt = norm(p.formacao || p.instituicao || ''); const alvo = p.disciplinas || [];
  const escolhidas = formacoes.filter(f => f.chaves?.some(k => txt.includes(k)) && (!alvo.length || f.disciplinas.some(d => alvo.includes(d))));
  const inferidas = [];
  let resto = alvo.filter(d => !escolhidas.some(f => f.disciplinas.includes(d)));
  while (resto.length) {
    const best = formacoes.filter(f => !escolhidas.includes(f)).map(f => [f, f.disciplinas.filter(d => resto.includes(d)).length]).sort((a, b) => b[1] - a[1])[0];
    if (!best || !best[1]) break;
    escolhidas.push(best[0]); inferidas.push(best[0].nome); resto = resto.filter(d => !best[0].disciplinas.includes(d));
  }
  return { formacoes: escolhidas.map(f => f.id), inferidas, semCobertura: resto, status: inferidas.length || resto.length ? 'revisar' : 'ok' };
}

function migrar(db) {
  if (db.v < 7) migrarV7(db);
  if (db.v < 8) migrarV8(db);
  if (db.v < 9 && typeof migrarV9 === 'function') migrarV9(db);
  // Versão 10: sem mudança de formato; as telas passam a ler e gravar só pelos serviços (dadosService)
  if (db.v < 10) { db.migracoes = db.migracoes || []; db.migracoes.push({ versao: 10, data: new Date().toISOString(), nota: 'Telas leem e gravam só pelos serviços (dadosService).' }); db.v = 10; }
}
function migrarV7(db) {
  const rel = [];
  // 1. Formações e disciplinas habilitadas
  if (!db.disciplinas.some(d => d.id === 'd8')) db.disciplinas.push({ id: 'd8', nome: 'Química', area: 'Ciências da Natureza', ch: 120 });
  db.formacoes = db.formacoes || JSON.parse(JSON.stringify(FORMACOES_PADRAO));
  db.professores.forEach(p => {
    if (!p.formacoes) {
      const r = migrarFormacao(p, db.formacoes);
      p.formacoes = r.formacoes; p.disciplinasLegado = p.disciplinas || [];
      rel.push(Object.assign({ professorId: p.id, antes: p.disciplinasLegado, curso: p.formacao || '' }, r));
    }
    if (p.instituicao == null) p.instituicao = p.formacao || '';
    delete p.disciplinas; delete p.formacao;
    // 3. Dados de RH: quem já existia entra como Concurso até o RH corrigir
    p.ingresso = p.ingresso || 'Concurso';
    p.cargaHoraria = p.cargaHoraria || Math.max(20, db.aulas.filter(a => a.professorId === p.id).length);
  });
  // 2. Perfis e permissões
  db.perfis = db.perfis || JSON.parse(JSON.stringify(PERFIS_PADRAO));
  db.talentos = db.talentos || [];
  // 4. Estoque da merenda
  db.alimentos = db.alimentos || JSON.parse(JSON.stringify(ALIMENTOS_PADRAO));
  db.entradas = db.entradas || []; db.consumos = db.consumos || [];
  if (db.config.alertaEstoque == null) db.config.alertaEstoque = 50;
  // 5. Transporte: paradas estruturadas a partir do texto
  (db.rotas || []).forEach(r => { if (!r.paradas) r.paradas = parseParadas(r.pontos); });
  db.embarques = db.embarques || []; db.ausencias = db.ausencias || [];
  db.migracoes = db.migracoes || [];
  db.migracoes.push({ versao: 7, data: new Date().toISOString(), formacoes: rel });
  if (db.demo !== false) exemplosV7(db);
  db.v = 7;
}

// Dados de exemplo para demonstrar cada melhoria (só em bases de demonstração)
function exemplosV7(db) {
  const P = id => db.professores.find(p => p.id === id);
  // RH: formas de ingresso, um contrato encerrado e um vencendo
  Object.assign(P('p1'), { ingresso: 'Concurso', cargaHoraria: 40 });
  Object.assign(P('p2'), { ingresso: 'Concurso', cargaHoraria: 40 });
  Object.assign(P('p3'), { ingresso: 'Contrato', contratoInicio: '2026-02-02', contratoFim: '2026-12-18', cargaHoraria: 20 });
  Object.assign(P('p4'), { ingresso: 'Contrato', contratoInicio: '2026-02-02', contratoFim: addDays(23), cargaHoraria: 20 });
  Object.assign(P('p5'), { ingresso: 'Contrato', contratoInicio: '2026-02-02', contratoFim: addDays(-8), cargaHoraria: 12 });
  db.professores.push(
    { id: 'p6', nome: 'Renata Moura', email: 'renata.moura@entrelaco.edu.br', telefone: '(81) 99654-1203', escolaId: 'e2', formacoes: ['f3', 'f4'], instituicao: 'UFPE, 2015', ingresso: 'Concurso', cargaHoraria: 20 },
    { id: 'p7', nome: 'André Siqueira', email: 'andre.siqueira@entrelaco.edu.br', telefone: '(81) 98832-7741', escolaId: 'e1', formacoes: ['f2'], instituicao: 'UFRPE, 2010', ingresso: 'Cedido', orgaoOrigem: 'Prefeitura do Recife', cargaHoraria: 20 },
    { id: 'p8', nome: 'Patrícia Lemos', email: 'patricia.lemos@entrelaco.edu.br', telefone: '(81) 99410-5528', escolaId: 'e1', formacoes: ['f7', 'f8'], instituicao: 'UPE, 2018', ingresso: 'Contrato', contratoInicio: '2026-03-02', contratoFim: addDays(48), cargaHoraria: 16 }
  );
  db.talentos = [
    ['Larissa Campos', 'f4', '(81) 99120-4410', 3], ['Diego Albuquerque', 'f4', '(81) 98877-2031', 5], ['Fernanda Rocha', 'f7', '(81) 99302-8890', 2],
    ['Marcos Vinícius Lira', 'f7', '(81) 98544-1207', 6], ['Juliana Prado', 'f1', '(81) 99781-3355', 4], ['Tatiane Souza', 'f3', '(81) 98123-6640', 8], ['Henrique Matos', 'f8', '(81) 99456-0917', 1]
  ].map(([nome, formacaoId, telefone, classificacao]) => ({ id: uid(), nome, formacaoId, telefone, email: norm(nome).replace(/\s+/g, '.') + '@email.com', processo: 'Seleção Simplificada SEE 2025, professor temporário', classificacao, situacao: 'Aguardando chamada' }));
  // Merenda: entradas da Seduc há 15 dias e consumo dos últimos dias letivos
  const R = mulberry32(77); const escolas = db.escolas.map(e => e.id);
  const base = { al1: 100, al2: 80, al3: 150, al4: 90, al5: 50, al6: 60, al7: 120, al8: 40, al9: 120 };
  const porte = { e1: 1, e2: .8, e3: 1.4, e4: 1.3, e5: .9 };
  const uso = { 'e1|al1': .6, 'e2|al2': .7, 'e3|al4': .58, 'e5|al7': .9 };
  const diasLetivos = []; for (let n = -14; n <= -1; n++) { const d = addDays(n); const w = dOf(d).getDay(); if (w > 0 && w < 6) diasLetivos.push(d); }
  escolas.forEach(e => db.alimentos.forEach(a => {
    const q = Math.round(base[a.id] * (porte[e] || 1));
    db.entradas.push({ id: uid(), escolaId: e, alimentoId: a.id, quantidade: q, data: addDays(-15), origem: 'Seduc', guia: `GR-${2026}-${String(Math.floor(R() * 9000) + 1000)}` });
    const frac = uso[e + '|' + a.id] ?? (.18 + R() * .27);
    diasLetivos.forEach(d => { const v = Math.round(q * frac / diasLetivos.length * (.8 + R() * .4) * 10) / 10; if (v > 0) db.consumos.push({ id: uid(), escolaId: e, alimentoId: a.id, quantidade: v, data: d }); });
  }));
  // Transporte: coordenadas das paradas, casa dos alunos, avisos e embarques
  const E = id => db.escolas.find(e => e.id === id);
  Object.assign(E('e1'), { lat: -8.0597, lng: -34.8843 }); Object.assign(E('e2'), { lat: -8.1196, lng: -34.8986 });
  const r1 = db.rotas.find(r => r.id === 'ro1'), r2 = db.rotas.find(r => r.id === 'ro2');
  if (r1) { r1.pontos = '06:20 Praça da Várzea | -8.0466, -34.9573\n06:35 Av. Caxangá, 4000 | -8.0428, -34.9330\n06:50 Iputinga, Rua Vila Nova | -8.0338, -34.9262\n07:00 Cordeiro, Praça do Derby do Cordeiro | -8.0496, -34.9178\n07:15 Chegada à escola | -8.0597, -34.8843'; r1.paradas = parseParadas(r1.pontos); }
  if (r2) { r2.pontos = '12:10 Pina, Rua Herculano Bandeira | -8.0890, -34.8828\n12:30 Av. Conselheiro Aguiar, 2000 | -8.1078, -34.8925\n12:50 Chegada à escola | -8.1196, -34.8986'; r2.paradas = parseParadas(r2.pontos); }
  const casas = { 'João Pedro Silva': [-8.0441, -34.9349, 'ro1'], 'Pedro Arthur Santos': [-8.0472, -34.9555, 'ro1'], 'Samuel Batista': [-8.0329, -34.9281, 'ro1'], 'Bruno Henrique Alves': [-8.0489, -34.9160, 'ro1'], 'Thiago Ramos': [-8.0455, -34.9590, 'ro1'], 'Daniel Araújo': [-8.0901, -34.8810, 'ro2'], 'Gustavo Pires': [-8.1069, -34.8940, 'ro2'] };
  db.alunos.forEach(a => { const c = casas[a.nome]; if (c) { a.casa = { lat: c[0], lng: c[1] }; a.rotaId = c[2]; } });
  const al = n => db.alunos.find(a => a.nome === n);
  if (al('Samuel Batista')) db.ausencias.push({ id: uid(), alunoId: al('Samuel Batista').id, data: TODAY_ISO, sentido: 'Volta', motivo: 'Vai de carona com o tio', por: 'Responsável', criado: new Date().toISOString() });
  if (al('Thiago Ramos')) db.ausencias.push({ id: uid(), alunoId: al('Thiago Ramos').id, data: addDays(1), sentido: 'Ida e volta', motivo: 'Consulta médica', por: 'Aluno', criado: new Date().toISOString() });
  ['Pedro Arthur Santos', 'João Pedro Silva'].forEach((n, i) => { const a = al(n); if (a) db.embarques.push({ id: uid(), alunoId: a.id, rotaId: 'ro1', data: addDays(-1), hora: i ? '06:36' : '06:21', sentido: 'Ida', como: 'QR code' }); });
}

// Versão 8: rotas de exemplo em Aracaju, a caminho da Universidade Tiradentes (campus Farolândia)
function migrarV8(db) {
  if (db.demo !== false) {
    const r1 = db.rotas.find(r => r.id === 'ro1'), r2 = db.rotas.find(r => r.id === 'ro2');
    const UNIT = 'Chegada à Universidade Tiradentes, campus Farolândia | -10.9677, -37.0585';
    if (r1) { r1.nome = 'Rota 1 — Centro e Farolândia'; r1.pontos = `06:20 Praça Fausto Cardoso, Centro | -10.9112, -37.0496\n06:35 Av. Hermes Fontes, São José | -10.9318, -37.0562\n06:45 Shopping Jardins, Jardins | -10.9431, -37.0546\n06:55 Av. Beira Mar, Treze de Julho | -10.9505, -37.0489\n07:15 ${UNIT}`; r1.paradas = parseParadas(r1.pontos); }
    if (r2) { r2.nome = 'Rota 2 — Siqueira Campos e Ponto Novo'; r2.pontos = `12:10 Praça Dom José Thomaz, Siqueira Campos | -10.9268, -37.0712\n12:25 Av. Augusto Franco, Ponto Novo | -10.9452, -37.0748\n12:35 Av. Tancredo Neves, Inácio Barbosa | -10.9585, -37.0662\n12:50 ${UNIT}`; r2.paradas = parseParadas(r2.pontos); }
    const casas = { 'João Pedro Silva': [-10.9329, -37.0581], 'Pedro Arthur Santos': [-10.9105, -37.0510], 'Samuel Batista': [-10.9440, -37.0531], 'Bruno Henrique Alves': [-10.9498, -37.0470], 'Thiago Ramos': [-10.9122, -37.0478], 'Daniel Araújo': [-10.9275, -37.0730], 'Gustavo Pires': [-10.9460, -37.0735] };
    db.alunos.forEach(a => { const c = casas[a.nome]; if (c) a.casa = { lat: c[0], lng: c[1] }; });
  }
  db.migracoes = db.migracoes || []; db.migracoes.push({ versao: 8, data: new Date().toISOString(), nota: 'Rotas de exemplo em Aracaju' });
  db.v = 8;
}

if (!ARMAZEM.v || ARMAZEM.v < 10) { migrar(ARMAZEM); persistirArmazem(); }

// ---------- Início ----------
dadosService.carregar().then(() => { applyA11y(); render(); });
