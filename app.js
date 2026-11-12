/* Portal Entrelaço — núcleo: utilitários, dados, acessibilidade, shell e CRUD genérico */
'use strict';

// ---------- Utilitários ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* armazenamento indisponível */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
};
const pad = n => String(n).padStart(2, '0');
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = new Date(); TODAY.setHours(12, 0, 0, 0);
const TODAY_ISO = isoOf(TODAY);
const addDays = n => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return isoOf(d); };
const dOf = iso => new Date(iso + 'T12:00:00');
const fmtD = iso => iso ? dOf(iso).toLocaleDateString('pt-BR') : '—';
const fmtLong = iso => dOf(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const daysUntil = iso => Math.round((dOf(iso) - TODAY) / 864e5);
const num = (n, d = 1) => (n == null || isNaN(n)) ? '—' : n.toFixed(d).replace('.', ',');
// Nota digitada: de 0 a 10, com no máximo uma casa decimal (vírgula ou ponto)
function lerNota(texto) {
  const t = String(texto ?? '').trim().replace(',', '.');
  if (t === '') return { vazio: true };
  if (!/^\d{1,2}(\.\d)?$/.test(t)) return { erro: 'Use um número de 0 a 10 com no máximo uma casa decimal, como 7,5.' };
  const v = Number(t); return v > 10 ? { erro: 'A nota vai de 0 a 10.' } : { v };
}
const money = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const initials = n => { const p = String(n).split(' ').filter(Boolean); return ((p[0] || '')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };
const firstName = n => String(n).split(' ')[0];
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const avg = a => { const v = a.filter(x => x != null && !isNaN(x)); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
const uniq = a => [...new Set(a)];
const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const SLOTS = { 'Manhã': ['07:30', '08:20', '09:10', '10:20', '11:10'], 'Tarde': ['13:00', '13:50', '14:40', '15:50', '16:40'], 'Noite': ['19:00', '19:45', '20:30', '21:15', '22:00'] };
const addMin = (h, m) => { const [a, b] = h.split(':').map(Number); const t = a * 60 + b + m; return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`; };
// Faixas de horário vêm do cadastro (DADOS.faixas). Integral usa as faixas da manhã até ter as próprias.
const faixasDe = turno => { const f = t => (DADOS.faixas || []).filter(x => x.turno === t).sort((a, b) => a.ordem - b.ordem); return f(turno).length ? f(turno) : f('Manhã'); };
const slotRange = (turno, i) => { const x = faixasDe(turno)[i]; return x ? `${x.inicio}–${x.fim}` : '—'; };
// Opções de selects e caixas: vêm das listas gerenciáveis (Cadastros auxiliares)
const nomes = tipo => (DADOS.listas || []).filter(x => x.tipo === tipo && x.ativo !== false).sort((a, b) => a.ordem - b.ordem).map(x => x.nome);
const L = tipo => () => nomes(tipo).map(n => [n, n]);
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

// ---------- Ícones (traço 1.75, estilo Lucide) ----------
const IC = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 21v-4h6v4M8.5 7h1M14.5 7h1M8.5 11h1M14.5 11h1"/>',
  layers: '<path d="m12 3 9 4.5-9 4.5-9-4.5z"/><path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-3.8-5.9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  teacher: '<circle cx="9" cy="7" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 11.5-4.2"/><rect x="14" y="10" width="8" height="6" rx="1"/><path d="M18 16v4"/>',
  cap: '<path d="M2 9.5 12 5l10 4.5L12 14z"/><path d="M6 11.5V16c3.5 2.5 8.5 2.5 12 0v-4.5M22 9.5V15"/>',
  book: '<path d="M2 4h7a3 3 0 0 1 3 3v14a2.5 2.5 0 0 0-2.5-2.5H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v14a2.5 2.5 0 0 1 2.5-2.5H22z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pencil: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/><path d="m15 5 4 4"/>',
  check2: '<path d="m9 11 3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  wallet: '<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M16 15h2"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 17v-5M13 17V8M18 17v-9"/>',
  clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  access: '<circle cx="12" cy="4.5" r="2"/><path d="M4 8.5 12 10l8-1.5M12 10v4.5M8.5 21l3.5-6.5 3.5 6.5"/>',
  volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4"/>',
  contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  okc: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  errc: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
  warnc: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>',
  dot: '<circle cx="12" cy="12" r="4" fill="currentColor"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${IC[n] || ''}</svg>`;

// ---------- Dados de exemplo ----------
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function seed() {
  const R = mulberry32(2026);
  const r1 = n => Math.round(n * 10) / 10;
  const clamp = n => Math.max(0, Math.min(10, n));
  const escolas = [
    { id: 'e1', nome: 'Escola Estadual Entrelaço — Unidade Centro', inep: '26123456', cidade: 'Recife, PE', endereco: 'Rua da Aurora, 1200 — Boa Vista', telefone: '(81) 3222-1100', diretor: 'Helena Albuquerque' },
    { id: 'e2', nome: 'Escola Estadual Entrelaço — Unidade Boa Viagem', inep: '26123789', cidade: 'Recife, PE', endereco: 'Av. Conselheiro Aguiar, 3400', telefone: '(81) 3325-4400', diretor: 'Rafael Menezes' }
  ];
  const disciplinas = [
    { id: 'd1', nome: 'Matemática', area: 'Matemática', ch: 200 },
    { id: 'd2', nome: 'Língua Portuguesa', area: 'Linguagens', ch: 200 },
    { id: 'd3', nome: 'História', area: 'Ciências Humanas', ch: 80 },
    { id: 'd4', nome: 'Geografia', area: 'Ciências Humanas', ch: 80 },
    { id: 'd5', nome: 'Biologia', area: 'Ciências da Natureza', ch: 120 },
    { id: 'd6', nome: 'Física', area: 'Ciências da Natureza', ch: 160 },
    { id: 'd7', nome: 'Inglês', area: 'Linguagens', ch: 80 }
  ];
  const professores = [
    { id: 'p1', nome: 'Marina Costa', email: 'marina.costa@entrelaco.edu.br', telefone: '(81) 99812-4410', escolaId: 'e1', formacao: 'Licenciatura em Matemática — UFPE', disciplinas: ['d1', 'd6'] },
    { id: 'p2', nome: 'Carlos Eduardo Lima', email: 'carlos.lima@entrelaco.edu.br', telefone: '(81) 99733-2210', escolaId: 'e1', formacao: 'Letras — UFRPE', disciplinas: ['d2'] },
    { id: 'p3', nome: 'Beatriz Nunes', email: 'beatriz.nunes@entrelaco.edu.br', telefone: '(81) 98844-9032', escolaId: 'e1', formacao: 'História — UFPE', disciplinas: ['d3', 'd4'] },
    { id: 'p4', nome: 'Tiago Ferreira', email: 'tiago.ferreira@entrelaco.edu.br', telefone: '(81) 99120-5567', escolaId: 'e2', formacao: 'Ciências Biológicas — UPE', disciplinas: ['d5'] },
    { id: 'p5', nome: 'Luiza Andrade', email: 'luiza.andrade@entrelaco.edu.br', telefone: '(81) 98701-3345', escolaId: 'e2', formacao: 'Letras Inglês — UNICAP', disciplinas: ['d7'] }
  ];
  const profDe = { d1: 'p1', d6: 'p1', d2: 'p2', d3: 'p3', d4: 'p3', d5: 'p4', d7: 'p5' };
  const turmas = [
    { id: 't1', nome: '1º ano A', escolaId: 'e1', serie: '1º ano — Ensino médio', turno: 'Manhã', ano: 2026, sala: 'Sala 12' },
    { id: 't2', nome: '2º ano A', escolaId: 'e1', serie: '2º ano — Ensino médio', turno: 'Manhã', ano: 2026, sala: 'Sala 14' },
    { id: 't3', nome: '3º ano A', escolaId: 'e1', serie: '3º ano — Ensino médio', turno: 'Manhã', ano: 2026, sala: 'Sala 16' },
    { id: 't4', nome: '2º ano B', escolaId: 'e2', serie: '2º ano — Ensino médio', turno: 'Tarde', ano: 2026, sala: 'Sala 3' }
  ];
  const nomes = {
    t2: ['João Pedro Silva', 'Larissa Barbosa', 'Mateus Oliveira', 'Nicole Farias', 'Pedro Arthur Santos', 'Rafaela Gomes', 'Samuel Batista', 'Sofia Carvalho'],
    t1: ['Ana Clara Souza', 'Bruno Henrique Alves', 'Camila Rocha', 'Davi Lucas Martins', 'Eduarda Lima', 'Felipe Cavalcanti', 'Gabriela Moura'],
    t3: ['Thiago Ramos', 'Valentina Dias', 'Vinícius Costa', 'Yasmin Freitas', 'Arthur Mendes', 'Beatriz Lopes', 'Caio Pereira'],
    t4: ['Clara Monteiro', 'Daniel Araújo', 'Elisa Teixeira', 'Gustavo Pires', 'Helena Rezende', 'Igor Nascimento', 'Júlia Marques']
  };
  const acessos = { 'João Pedro Silva': 'Baixa visão', 'Camila Rocha': 'Deficiência visual', 'Igor Nascimento': 'Daltonismo', 'Yasmin Freitas': 'TDAH' };
  const alunos = []; let k = 1;
  const base = {}, falta = {};
  Object.entries(nomes).forEach(([tid, list]) => list.forEach(n => {
    const id = 'a' + k;
    const ano = 2026 - (tid === 't1' ? 15 : tid === 't3' ? 17 : 16);
    alunos.push({ id, nome: n, matricula: '2026' + pad(k).padStart(4, '0'), nascimento: `${ano}-${pad(1 + Math.floor(R() * 12))}-${pad(1 + Math.floor(R() * 27))}`, turmaId: tid, email: norm(n).replace(/\s+/g, '.') + '@aluno.entrelaco.edu.br', responsavel: ['Maria', 'José', 'Cláudia', 'Paulo', 'Fernanda', 'Ricardo'][k % 6] + ' ' + n.split(' ').slice(-1)[0], telResp: `(81) 9${Math.floor(8000 + R() * 1999)}-${Math.floor(1000 + R() * 8999)}`, acess: acessos[n] || 'Nenhuma' });
    base[id] = 5.2 + R() * 4.3; falta[id] = 0.02 + R() * 0.1; k++;
  }));
  base.a1 = 8.1; base.a7 = 4.6; falta.a7 = 0.3; base.a3 = 5.3; base.a19 = 5.0; falta.a19 = 0.22;
  const aulas = [];
  const pesos = [['d1', 6], ['d2', 6], ['d3', 2], ['d4', 2], ['d5', 3], ['d6', 4], ['d7', 2]];
  turmas.forEach((t, ti) => {
    const seq = []; pesos.forEach(([d, n]) => { for (let i = 0; i < n; i++) seq.push(d); });
    for (let i = seq.length - 1; i > 0; i--) { const j = Math.floor(mulberry32(ti * 97 + i)() * (i + 1)); [seq[i], seq[j]] = [seq[j], seq[i]]; }
    let c = 0;
    for (let dia = 1; dia <= 5; dia++) for (let slot = 0; slot < 5; slot++) { const d = seq[c++]; aulas.push({ id: uid(), turmaId: t.id, disciplinaId: d, professorId: profDe[d], dia, slot }); }
  });
  const notas = {};
  alunos.forEach(a => disciplinas.forEach(d => {
    const off = (R() - .5) * 2.6;
    [1, 2, 3].forEach(b => {
      if (b === 3 && (d.id === 'd1' || d.id === 'd6')) return;
      notas[`${a.id}|${d.id}|${b}`] = r1(clamp(base[a.id] + off + (R() - .5) * 1.6));
    });
  }));
  notas['a1|d1|1'] = 8.2; notas['a1|d1|2'] = 8.7;
  const conteudos = {
    d1: ['Funções do 2º grau', 'Vértice da parábola', 'Inequações do 2º grau', 'Progressão aritmética', 'Exercícios de revisão'],
    d2: ['Figuras de linguagem', 'Romantismo no Brasil', 'Concordância verbal', 'Estrutura da dissertação', 'Leitura de O Cortiço'],
    d3: ['Era Vargas', 'Estado Novo', 'Segunda Guerra Mundial', 'República Populista'],
    d4: ['Urbanização brasileira', 'Matriz energética', 'Climas do Brasil', 'Cartografia'],
    d5: ['Genética mendeliana', 'Divisão celular', 'Ecologia de populações', 'Evolução'],
    d6: ['Queda livre', 'Leis de Newton', 'Trabalho e energia', 'Quantidade de movimento'],
    d7: ['Simple past', 'Reading comprehension', 'Phrasal verbs', 'Present perfect']
  };
  const chamadas = [];
  for (let n = -28; n <= -1; n++) {
    const iso = addDays(n), dia = dOf(iso).getDay();
    if (dia < 1 || dia > 5) continue;
    turmas.forEach(t => {
      uniq(aulas.filter(a => a.turmaId === t.id && a.dia === dia).map(a => a.disciplinaId)).forEach((d, i) => {
        const al = alunos.filter(a => a.turmaId === t.id);
        chamadas.push({ id: uid(), turmaId: t.id, disciplinaId: d, data: iso, conteudo: conteudos[d][(n + 40 + i) % conteudos[d].length], faltas: al.filter(a => R() < falta[a.id]).map(a => a.id) });
      });
    });
  }
  const atividades = [
    { id: 'at1', turmaId: 't2', disciplinaId: 'd1', professorId: 'p1', titulo: 'Lista 4 — Funções do 2º grau', descricao: 'Resolva os exercícios 1 a 15 da página 142. Mostre o cálculo do vértice em cada questão.', prazo: addDays(3), valor: 2 },
    { id: 'at2', turmaId: 't2', disciplinaId: 'd2', professorId: 'p2', titulo: 'Redação: mobilidade urbana no Recife', descricao: 'Texto dissertativo-argumentativo de 25 a 30 linhas, seguindo o modelo do ENEM.', prazo: addDays(1), valor: 3 },
    { id: 'at3', turmaId: 't2', disciplinaId: 'd6', professorId: 'p1', titulo: 'Relatório do experimento de queda livre', descricao: 'Apresente a tabela de medições, o gráfico e o valor encontrado para g.', prazo: addDays(6), valor: 2 },
    { id: 'at4', turmaId: 't2', disciplinaId: 'd3', professorId: 'p3', titulo: 'Resumo: Era Vargas', descricao: 'Resumo de uma página sobre as principais medidas trabalhistas do período.', prazo: addDays(-5), valor: 1 },
    { id: 'at5', turmaId: 't1', disciplinaId: 'd1', professorId: 'p1', titulo: 'Lista 3 — Conjuntos numéricos', descricao: 'Exercícios 1 a 10 da apostila.', prazo: addDays(2), valor: 1 },
    { id: 'at6', turmaId: 't4', disciplinaId: 'd1', professorId: 'p1', titulo: 'Desafio: otimização com parábolas', descricao: 'Resolva os 3 problemas de área máxima.', prazo: addDays(4), valor: 1 }
  ];
  const entregas = [];
  alunos.filter(a => a.turmaId === 't2').forEach((a, i) => {
    if (i !== 6) entregas.push({ id: uid(), atividadeId: 'at4', alunoId: a.id, texto: 'Resumo entregue em anexo.', arquivo: 'resumo-era-vargas.pdf', data: addDays(-6), nota: r1(0.6 + R() * 0.4), feedback: i === 0 ? 'Ótima síntese das leis trabalhistas.' : '' });
    if ([1, 2, 5].includes(i)) entregas.push({ id: uid(), atividadeId: 'at1', alunoId: a.id, texto: 'Segue a lista resolvida.', arquivo: 'lista4.pdf', data: addDays(-1), nota: null, feedback: '' });
  });
  const comunicados = [
    { id: uid(), titulo: 'Reunião de pais e mestres do 3º bimestre', texto: 'A reunião acontece no sábado, das 9h às 11h30, no auditório de cada unidade. A presença dos responsáveis é importante para acompanhar o desempenho dos estudantes.', publico: 'Todos', autor: 'Secretaria escolar', data: addDays(-1) },
    { id: uid(), titulo: 'Semana de provas do 3º bimestre', texto: 'As avaliações começam na próxima semana. O calendário completo por turma está disponível na aba Calendário. Estudantes com laudo de acessibilidade têm direito a tempo adicional e prova ampliada ou ledor.', publico: 'Alunos', autor: 'Coordenação pedagógica', data: addDays(-2) },
    { id: uid(), titulo: 'Conselho de classe', texto: 'O conselho de classe do 3º bimestre será na sala dos professores. Tragam as notas lançadas no portal até a véspera.', publico: 'Professores', autor: 'Coordenação pedagógica', data: addDays(-3) },
    { id: uid(), titulo: 'Novo no portal: leitura em voz alta', texto: 'Todas as páginas agora podem ser lidas em voz alta. Use o botão "Ouvir página" no topo. O painel de acessibilidade permite ajustar tamanho do texto, contraste e espaçamento.', publico: 'Todos', autor: 'Secretaria escolar', data: addDays(-6) },
    { id: uid(), titulo: 'Lista 4 disponível', texto: 'A lista de funções do 2º grau já está na aba Atividades. Dúvidas na monitoria de quarta-feira.', publico: 'turma:t2', autor: 'Marina Costa', autorId: 'p1', data: addDays(-2) }
  ];
  const eventos = [
    { id: uid(), titulo: 'Conselho de classe', data: addDays(2), tipo: 'Reunião', escopo: 'Professores' },
    { id: uid(), titulo: 'Reunião de pais e mestres', data: addDays(3), tipo: 'Reunião', escopo: 'Todas as turmas' },
    { id: uid(), titulo: 'Início das provas do 3º bimestre', data: addDays(5), tipo: 'Avaliação', escopo: 'Ensino médio' },
    { id: uid(), titulo: 'Feira de Ciências', data: addDays(13), tipo: 'Evento', escopo: 'Todas as turmas' },
    { id: uid(), titulo: 'Nossa Senhora Aparecida', data: '2026-10-12', tipo: 'Feriado', escopo: 'Sem aulas' },
    { id: uid(), titulo: 'Dia do Professor', data: '2026-10-15', tipo: 'Recesso', escopo: 'Sem aulas' },
    { id: uid(), titulo: 'Encerramento do 3º bimestre', data: '2026-10-09', tipo: 'Prazo', escopo: 'Lançamento de notas' },
    { id: uid(), titulo: 'Finados', data: '2026-11-02', tipo: 'Feriado', escopo: 'Sem aulas' }
  ];
  const solicitacoes = [
    { id: uid(), alunoId: 'a1', tipo: 'Declaração de matrícula', descricao: 'Preciso para o cadastro do passe livre estudantil.', status: 'Em análise', data: addDays(-1), resposta: '' },
    { id: uid(), alunoId: 'a2', tipo: 'Revisão de nota', descricao: 'Gostaria de revisar a prova de Física do 2º bimestre, questão 4.', status: 'Em análise', data: addDays(-3), resposta: '' },
    { id: uid(), alunoId: 'a1', tipo: 'Atestado médico', descricao: 'Atestado referente às faltas por consulta oftalmológica.', status: 'Deferido', data: addDays(-14), resposta: 'Faltas abonadas conforme o atestado apresentado.' },
    { id: uid(), alunoId: 'a10', tipo: 'Histórico escolar', descricao: 'Para inscrição em curso técnico.', status: 'Em análise', data: addDays(-2), resposta: '' }
  ];
  const ocorrencias = [
    { id: uid(), alunoId: 'a3', professorId: 'p3', tipo: 'Comportamento', descricao: 'Uso do celular durante a explicação após dois avisos.', data: addDays(-4) },
    { id: uid(), alunoId: 'a4', professorId: 'p1', tipo: 'Elogio', descricao: 'Ajudou colegas na monitoria de Matemática por iniciativa própria.', data: addDays(-2) },
    { id: uid(), alunoId: 'a7', professorId: 'p2', tipo: 'Atraso', descricao: 'Terceiro atraso na primeira aula nesta quinzena.', data: addDays(-1) }
  ];
  return { v: 6, config: { mediaMin: 6, freqMin: 75, anoLetivo: 2026, bimestreAtual: 3, escolaNome: 'Escola Estadual Entrelaço' }, escolas, disciplinas, professores, turmas, alunos, aulas, notas, chamadas, atividades, entregas, comunicados, eventos, solicitacoes, ocorrencias };
}

// ARMAZEM: o "banco de dados" do back-end simulado, guardado no navegador.
// Só a camada services/ e as migrações mexem nele. Com um back-end real, ele deixa de existir.
let ARMAZEM = LS.get('entrelaco.db', null);
if (!ARMAZEM || !ARMAZEM.v || ARMAZEM.v < 6) ARMAZEM = seed();
const persistirArmazem = () => LS.set('entrelaco.db', ARMAZEM);
persistirArmazem();
// DADOS: os dados da tela, carregados pelos serviços (services/dadosService.js) antes de cada tela abrir.
// As telas leem e alteram só esta cópia; save() envia as mudanças aos serviços.
let DADOS = {};
const save = () => dadosService.gravar();
async function resetData() { ARMAZEM = seed(); if (typeof seedRede === 'function') seedRede(ARMAZEM); if (typeof migrar === 'function') migrar(ARMAZEM); persistirArmazem(); await dadosService.carregar(); }

// ---------- Consultas ----------
const byId = (coll, id) => DADOS[coll].find(x => x.id === id);
const turmaNome = id => { const t = byId('turmas', id); return t ? t.nome : '—'; };
const turmaLong = id => { const t = byId('turmas', id); if (!t) return '—'; const e = byId('escolas', t.escolaId); return `${t.nome}, ${e ? e.nome.split('— ').pop() : ''}`; };
const discNome = id => { const d = byId('disciplinas', id); return d ? d.nome : '—'; };
const profNome = id => { const p = byId('professores', id); return p ? p.nome : '—'; };
const alunoNome = id => { const a = byId('alunos', id); return a ? a.nome : '—'; };
const alunosDaTurma = tid => DADOS.alunos.filter(a => a.turmaId === tid).sort((a, b) => a.nome.localeCompare(b.nome));
const discsDaTurma = tid => uniq(DADOS.aulas.filter(a => a.turmaId === tid).map(a => a.disciplinaId)).sort((a, b) => discNome(a).localeCompare(discNome(b)));
const nota = (aid, did, b) => DADOS.notas[`${aid}|${did}|${b}`];
const mediaDisc = (aid, did) => avg([1, 2, 3, 4].map(b => nota(aid, did, b)));
const mediaGeral = aid => { const a = byId('alunos', aid); return a ? avg(discsDaTurma(a.turmaId).map(d => mediaDisc(aid, d))) : null; };
function freqInfo(aid, did) {
  const a = byId('alunos', aid); if (!a) return { aulas: 0, faltas: 0, pct: null };
  const ch = DADOS.chamadas.filter(c => c.turmaId === a.turmaId && (!did || c.disciplinaId === did));
  const faltas = ch.filter(c => c.faltas.includes(aid)).length;
  return { aulas: ch.length, faltas, pct: ch.length ? (1 - faltas / ch.length) * 100 : null };
}
const freqPct = (aid, did) => freqInfo(aid, did).pct;
function situacao(m) {
  if (m == null) return { l: 'Sem nota', c: 'neutral', i: 'dot' };
  if (m >= DADOS.config.mediaMin) return { l: 'Aprovado', c: 'ok', i: 'okc' };
  if (m >= DADOS.config.mediaMin - 2) return { l: 'Recuperação', c: 'warn', i: 'warnc' };
  return { l: 'Reprovado', c: 'err', i: 'errc' };
}
const st = (label, cls, ic) => `<span class="st ${cls}">${icon(ic || { ok: 'okc', warn: 'warnc', err: 'errc', info: 'info', neutral: 'dot' }[cls])}${esc(label)}</span>`;
const sitHTML = m => { const s = situacao(m); return st(s.l, s.c, s.i); };
const freqHTML = p => p == null ? '—' : `<span class="${p < DADOS.config.freqMin ? 'st err' : ''} num">${num(p, 0)}%</span>`;
const solHTML = s => st(s.status, s.status === 'Deferido' ? 'ok' : s.status === 'Indeferido' ? 'err' : 'info');

// ---------- Sessão e UI ----------
let SESSION = LS.get('entrelaco.session', null);
const UI = { route: 'inicio', q: {}, f: {}, sel: {} };
// ---------- Perfis de acesso ----------
// Cada perfil tem uma lista de permissões. Para criar uma permissão nova: inclua em PERMISSOES,
// marque nos perfis que devem tê-la (PERFIS_PADRAO) e use can('chave') na tela ou na entrada do menu (4º item do NAV).
// A secretaria da rede pode ligar e desligar permissões em Configurações; o resultado fica em DADOS.perfis.
const ROLE_LABEL = { calendario: 'Calendário escolar', secretario: 'Secretaria de Educação', ded: 'DED', regional: 'Diretoria Regional', gestao: 'Secretaria escolar', diretor: 'Diretor', professor: 'Professor', aluno: 'Aluno', responsavel: 'Responsável', rh: 'RH', dae: 'DAE', motorista: 'Motorista' };
const PERMISSOES = [
  ['calendario.editar', 'Editar o calendário escolar'],
  ['comunicados.publicar', 'Publicar comunicados'],
  ['relatorios.ver', 'Ver relatórios'],
  ['boletins.ver', 'Ver notas e boletins'],
  ['ocorrencias.ver', 'Ver ocorrências'],
  ['professores.editar', 'Cadastrar e editar professores'],
  ['rh.painel', 'Ver necessidade de professores e contratos'],
  ['talentos.gerir', 'Gerir o banco de talentos'],
  ['merenda.estoque', 'Registrar entradas e consumo da merenda'],
  ['merenda.rede', 'Ver o estoque de todas as escolas'],
  ['transporte.embarque', 'Registrar embarques no transporte'],
  ['escolas.editar', 'Cadastrar e editar escolas'],
  ['infraestrutura.editar', 'Preencher a infraestrutura da escola'],
  ['cursos.gerir', 'Cadastrar cursos e matrizes curriculares'],
  ['lotacoes.gerir', 'Gerir lotações de professores'],
  ['vagas.editar', 'Cadastrar vagas por série e turma'],
  ['turmas.gerir', 'Cadastrar turmas e montar a grade horária da escola'],
  ['alunos.necessidades', 'Ver o diagnóstico dos alunos com atendimento especializado'],
  ['anoletivo.fechar', 'Finalizar turmas, encerrar o ano letivo e rematricular']
];
const PERFIS_PADRAO = {
  // Secretaria escolar: a secretaria de cada escola. Não cadastra escolas (isso é da Secretaria de Educação).
  gestao: ['comunicados.publicar', 'relatorios.ver', 'boletins.ver', 'ocorrencias.ver', 'merenda.estoque', 'vagas.editar', 'turmas.gerir', 'alunos.necessidades', 'anoletivo.fechar'],
  diretor: ['comunicados.publicar', 'relatorios.ver', 'infraestrutura.editar', 'vagas.editar'],
  calendario: ['calendario.editar', 'comunicados.publicar'], // TODO: confirmar a sigla do departamento citado na mentoria
  rh: ['professores.editar', 'rh.painel', 'talentos.gerir', 'lotacoes.gerir'],
  ded: ['cursos.gerir'],
  // Secretário: Secretaria de Estado da Educação (SEDUC), a rede inteira. Só ela cadastra escolas.
  secretario: ['relatorios.ver', 'escolas.editar'],
  regional: [],
  dae: ['merenda.estoque', 'merenda.rede'],
  motorista: ['transporte.embarque']
};
const can = perm => ((DADOS.perfis && DADOS.perfis[SESSION?.role]) || PERFIS_PADRAO[SESSION?.role] || []).includes(perm);
// Pessoas da equipe (perfis que não são aluno, professor nem responsável)
const EQUIPE = {
  'g-e1': { role: 'gestao', nome: 'Patrícia Gomes', cargo: 'Secretaria escolar, Unidade Centro', escolaId: 'e1' },
  'g-e2': { role: 'gestao', nome: 'Fábio Lins', cargo: 'Secretaria escolar, Unidade Atalaia', escolaId: 'e2' },
  'd-e1': { role: 'diretor', nome: 'Helena Albuquerque', cargo: 'Direção, Unidade Centro', escolaId: 'e1' },
  'd-e2': { role: 'diretor', nome: 'Rafael Menezes', cargo: 'Direção, Unidade Atalaia', escolaId: 'e2' },
  'sec1': { role: 'secretario', nome: 'Ricardo Matos', cargo: 'Secretário de Estado da Educação', escolaId: '' },
  'ded1': { role: 'ded', nome: 'Luciana Barreto', cargo: 'Departamento de Educação (DED)', escolaId: '' },
  'dr-dea': { role: 'regional', nome: 'Fernanda Lima', cargo: 'Diretoria de Educação de Aracaju (DEA)', drId: 'dea' },
  'dr-3': { role: 'regional', nome: 'Paulo Henrique Santos', cargo: 'Diretoria Regional de Educação 3', drId: 'dre3' },
  'cal1': { role: 'calendario', nome: 'Marta Oliveira', cargo: 'Departamento do Calendário Escolar (sigla a confirmar)', escolaId: '' },
  'rh1': { role: 'rh', nome: 'Cláudio Nery', cargo: 'Recursos Humanos da Seduc', escolaId: '' },
  'dae1': { role: 'dae', nome: 'Joana Prado', cargo: 'Diretoria de Alimentação Escolar (DAE)', escolaId: '' },
  'm-ro1': { role: 'motorista', nome: 'Severino Alves', cargo: 'Motorista, Rota 1', rotaId: 'ro1' },
  'm-ro2': { role: 'motorista', nome: 'Josenildo Ferreira', cargo: 'Motorista, Rota 2', rotaId: 'ro2' }
};
const equipeDe = role => Object.entries(EQUIPE).filter(([, p]) => p.role === role);
const GESTORES = Object.fromEntries(equipeDe('gestao'));
// Escola do usuário: definida na entrada. Vazio = toda a rede.
const escSessao = () => ['gestao', 'diretor'].includes(SESSION?.role) ? (EQUIPE[SESSION.userId]?.escolaId || '') : '';
const naEscola = (...ids) => !escSessao() || ids.includes(escSessao());
const me = () => SESSION?.role === 'professor' ? byId('professores', SESSION.userId) : SESSION?.role === 'aluno' ? byId('alunos', SESSION.userId) : SESSION?.role === 'responsavel' ? byId('responsaveis', SESSION.userId) : (EQUIPE[SESSION?.userId]?.role === SESSION?.role ? EQUIPE[SESSION.userId] : null);
// ---------- Ano letivo selecionado no topo ----------
// Escolas do usuário: a da entrada (secretaria escolar e diretor) ou as escolas onde o professor tem aulas. Os perfis da rede não têm seletor.
const escolasDoUsuario = () => escSessao() ? [escSessao()] : SESSION?.role === 'professor' ? uniq([...DADOS.aulas.filter(a => a.professorId === SESSION.userId).map(a => byId('turmas', a.turmaId)?.escolaId), me()?.escolaId].filter(Boolean)) : [];
const anosDoUsuario = () => { const es = escolasDoUsuario(); return uniq((DADOS.anosLetivos || []).filter(a => es.includes(a.escolaId)).map(a => a.ano)).sort((a, b) => b - a); };
const anoEncerrado = ano => { const es = escolasDoUsuario(); return !(DADOS.anosLetivos || []).some(a => es.includes(a.escolaId) && a.ano === ano && a.status === 'ativo'); };
function anoSel() {
  const anos = anosDoUsuario(); if (!anos.length) return DADOS.config.anoLetivo;
  if (!anos.includes(UI.ano)) UI.ano = anos.find(a => !anoEncerrado(a)) || anos[0];
  return UI.ano;
}
const anoLetivoDe = (escolaId, ano = anoSel()) => (DADOS.anosLetivos || []).find(a => a.escolaId === escolaId && a.ano === ano);
// O ano selecionado está ativo na escola (aceita turmas novas, notas e diário)?
const anoAberto = (escolaId = escSessao()) => anoLetivoDe(escolaId)?.status === 'ativo';
// A turma pertence ao ano selecionado (para os perfis da rede, todas as turmas)
const noAno = t => !!t && (!escolasDoUsuario().length || Number(t.ano) === anoSel());
function anoTopoHTML() {
  const anos = anosDoUsuario();
  if (!anos.length) return `<span class="crumb-sub">Ano letivo ${DADOS.config.anoLetivo}</span>`;
  return `<label class="ano-topo"><span class="sr-only">Ano letivo. Todas as telas da escola mostram o ano escolhido.</span>${icon('calendar')}<select id="ano-topo" data-change="anoTopo">${anos.map(a => `<option value="${a}" ${a === anoSel() ? 'selected' : ''}>Ano letivo ${a}${anoEncerrado(a) ? ' (encerrado)' : ''}</option>`).join('')}</select></label>`;
}
// Disciplinas que o professor pode lecionar: vêm das formações dele
const habilitadas = p => p ? (p.formacoes?.length ? uniq(p.formacoes.flatMap(f => (DADOS.formacoes || []).find(x => x.id === f)?.disciplinas || [])) : (p.disciplinas || [])) : [];

const TABS = {
  gestao: [['inicio', 'Início', 'home'], ['vagas', 'Vagas', 'door'], ['alunos', 'Alunos', 'users'], ['relatorios', 'Relatórios', 'chart']],
  professor: [['inicio', 'Início', 'home'], ['chamada', 'Diário', 'check2'], ['notas', 'Notas', 'pencil'], ['atividades', 'Atividades', 'clip']],
  aluno: [['inicio', 'Início', 'home'], ['boletim', 'Boletim', 'pencil'], ['atividades', 'Atividades', 'clip'], ['horario', 'Horário', 'clock']],
  responsavel: [['inicio', 'Início', 'home'], ['vagas', 'Vagas', 'door'], ['pedidos', 'Pedidos', 'file'], ['boletim', 'Boletim', 'pencil']],
  diretor: [['inicio', 'Início', 'home'], ['calendario', 'Calendário', 'calendar'], ['comunicados', 'Avisos', 'bell'], ['relatorios', 'Relatórios', 'chart']],
  rh: [['inicio', 'Necessidade', 'chart'], ['professores', 'Professores', 'teacher'], ['contratos', 'Contratos', 'calendar'], ['talentos', 'Talentos', 'users']],
  dae: [['inicio', 'Estoque', 'utensils'], ['entradas', 'Entradas', 'inbox'], ['historico', 'Consumo', 'chart']],
  motorista: [['inicio', 'Embarque', 'bus'], ['rota', 'Rota', 'pin']],
  calendario: [['inicio', 'Calendário', 'calendar'], ['comunicados', 'Avisos', 'bell'], ['cadastros', 'Listas', 'clip']],
  ded: [['inicio', 'Início', 'home'], ['cursos', 'Cursos', 'book'], ['matrizes', 'Matrizes', 'layers']],
  secretario: [['inicio', 'Painel', 'home'], ['escolas', 'Escolas', 'building'], ['relatorios', 'Relatórios', 'chart']],
  regional: [['inicio', 'Escolas', 'building'], ['infraestrutura', 'Infraestrutura', 'layers']]
};
// Menu de cada perfil: [rota, rótulo, ícone, permissão exigida (opcional)]
const navFor = role => (NAV[role] || []).filter(n => !n[3] || can(n[3]));
const NAV = {
  gestao: [['inicio', 'Início', 'home'], ['relatorios', 'Relatórios', 'chart'],
    ['§', 'Rede e matrículas'], ['vagas', 'Vagas da rede', 'door'], ['prematriculas', 'Pré-matrículas', 'inbox'], ['transferencias', 'Transferências', 'swap'], ['integracoes', 'Integrações', 'plug'],
    ['§', 'Escola'], ['turmas', 'Turmas', 'layers', 'turmas.gerir'], ['alunos', 'Alunos', 'users'], ['professores', 'Professores', 'teacher'], ['disciplinas', 'Disciplinas', 'book'], ['horarios', 'Grade horária', 'clock', 'turmas.gerir'],
    ['§', 'Ano letivo'], ['fechamento', 'Fechamento do ano', 'check2', 'anoletivo.fechar'], ['rematricula', 'Rematrícula', 'swap', 'anoletivo.fechar'],
    ['§', 'Pedagógico'], ['boletins', 'Notas e boletins', 'pencil'], ['frequencia', 'Frequência', 'check2'], ['aee', 'Educação especial (AEE)', 'access'], ['ocorrencias', 'Ocorrências', 'alert'],
    ['§', 'Programas e apoio'], ['buscaativa', 'Busca ativa', 'radar'], ['merenda', 'Merenda escolar', 'utensils'], ['transporte', 'Transporte escolar', 'bus'],
    ['§', 'Comunicação'], ['calendario', 'Calendário', 'calendar'], ['comunicados', 'Comunicados', 'bell'], ['solicitacoes', 'Solicitações', 'file'],
    ['§', 'Cadastros auxiliares'], ['cadastros', 'Listas do sistema', 'clip'], ['faixas', 'Faixas de horário', 'clock'], ['config', 'Configurações', 'gear']],
  professor: [['inicio', 'Início', 'home'], ['turmas', 'Minhas turmas', 'layers'], ['notas', 'Lançar notas', 'pencil'], ['chamada', 'Diário de classe', 'check2'], ['atividades', 'Atividades', 'clip'], ['ocorrencias', 'Ocorrências', 'alert'], ['horario', 'Meu horário', 'clock'], ['calendario', 'Calendário', 'calendar'], ['comunicados', 'Comunicados', 'bell']],
  aluno: [['inicio', 'Início', 'home'], ['boletim', 'Boletim', 'pencil'], ['atividades', 'Atividades', 'clip'], ['horario', 'Horário', 'clock'], ['calendario', 'Calendário', 'calendar'], ['merenda', 'Merenda', 'utensils'], ['comunicados', 'Comunicados', 'bell'], ['solicitacoes', 'Solicitações', 'file'], ['perfil', 'Meu perfil', 'user']],
  diretor: [['inicio', 'Início', 'home'], ['infraestrutura', 'Infraestrutura da escola', 'building', 'infraestrutura.editar'], ['vagas', 'Vagas da escola', 'door', 'vagas.editar'], ['calendario', 'Calendário escolar', 'calendar'], ['comunicados', 'Comunicados', 'bell', 'comunicados.publicar'], ['relatorios', 'Relatórios', 'chart', 'relatorios.ver'], ['boletins', 'Notas e boletins', 'pencil', 'boletins.ver'], ['ocorrencias', 'Ocorrências', 'alert', 'ocorrencias.ver']],
  rh: [['inicio', 'Necessidade de professores', 'chart'], ['professores', 'Professores', 'teacher'], ['formacoes', 'Formações', 'cap'], ['lotacoes', 'Gerir lotações', 'swap', 'lotacoes.gerir'], ['contratos', 'Contratos a vencer', 'calendar', 'rh.painel'], ['talentos', 'Banco de talentos', 'users', 'talentos.gerir'], ['cadastros', 'Cadastros auxiliares', 'clip']],
  dae: [['inicio', 'Estoque da rede', 'utensils'], ['alimentos', 'Alimentos', 'clip'], ['entradas', 'Entradas da Seduc', 'inbox', 'merenda.estoque'], ['historico', 'Histórico de consumo', 'chart'], ['cardapio', 'Cardápio', 'book'], ['cadastros', 'Cadastros auxiliares', 'clip']],
  motorista: [['inicio', 'Embarque', 'bus'], ['rota', 'Minha rota', 'pin']],
  calendario: [['inicio', 'Calendário escolar', 'calendar'], ['comunicados', 'Comunicados', 'bell'], ['cadastros', 'Cadastros auxiliares', 'clip']],
  ded: [['inicio', 'Início', 'home'], ['cursos', 'Cursos e modalidades', 'book', 'cursos.gerir'], ['matrizes', 'Gestão de matrizes', 'layers', 'cursos.gerir'], ['disciplinas', 'Componentes curriculares', 'pencil', 'cursos.gerir'], ['cadastros', 'Cadastros auxiliares', 'clip']],
  secretario: [['inicio', 'Painel da rede', 'home'], ['escolas', 'Escolas da rede', 'building'], ['relatorios', 'Relatórios', 'chart', 'relatorios.ver']],
  regional: [['inicio', 'Escolas da regional', 'building'], ['infraestrutura', 'Infraestrutura das escolas', 'layers']],
  responsavel: [['inicio', 'Início', 'home'], ['vagas', 'Vagas na rede', 'door'], ['matricula', 'Matrícula online', 'inbox'], ['transferencia', 'Pedir transferência', 'swap'], ['pedidos', 'Meus pedidos', 'file'], ['boletim', 'Boletim dos filhos', 'pencil'], ['merenda', 'Merenda', 'utensils'], ['calendario', 'Calendário', 'calendar'], ['comunicados', 'Comunicados', 'bell']]
};

// ---------- Anúncios e toast ----------
let toastT;
function toast(msg, kind = 'ok') {
  const t = $('#toast'); t.innerHTML = icon(kind === 'err' ? 'errc' : kind === 'info' ? 'info' : 'okc') + `<span>${esc(msg)}</span>`; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 4200);
  if (A.readFocus || A.readHover) TTS.speak(msg);
}
function alertSR(msg) { const r = $('#sr-alert'); r.textContent = ''; setTimeout(() => { r.textContent = msg; }, 50); if (A.readFocus) TTS.speak(msg); }

// ---------- Acessibilidade ----------
const A_DEFAULT = { scale: 100, contrast: false, theme: 'system', legible: false, spacing: false, reduce: false, underline: false, bigCursor: false, guide: false, readFocus: false, readHover: false, rate: 1 };
let A = Object.assign({}, A_DEFAULT, LS.get('entrelaco.a11y', {}));
function applyA11y() {
  const h = document.documentElement;
  h.style.fontSize = A.scale + '%';
  if (A.contrast) h.setAttribute('data-contrast', 'high'); else h.removeAttribute('data-contrast');
  h.classList.toggle('a-legible', A.legible);
  h.classList.toggle('a-spacing', A.spacing);
  h.classList.toggle('a-reduce', A.reduce);
  h.classList.toggle('a-underline', A.underline);
  h.classList.toggle('a-bigcursor', A.bigCursor);
  $('#guide').hidden = !A.guide;
  $$('.fs-val').forEach(e => { e.textContent = A.scale + '%'; });
  $$('[data-act="toggle-contrast"]').forEach(e => e.setAttribute('aria-pressed', String(A.contrast)));
  LS.set('entrelaco.a11y', A);
}
function setA(k, v, msg) { A[k] = v; applyA11y(); if (msg) toast(msg, 'info'); }
const PRESETS = {
  padrao: ['Padrão', {}],
  baixa: ['Baixa visão', { scale: 130, legible: true, spacing: true, bigCursor: true, underline: true }],
  cegueira: ['Leitor de voz', { readFocus: true, reduce: true, underline: true }],
  contraste: ['Alto contraste', { contrast: true, scale: 120, underline: true, legible: true }]
};

const TTS = {
  ok: 'speechSynthesis' in window,
  speaking: false,
  voice() { try { const v = speechSynthesis.getVoices(); return v.find(x => x.lang === 'pt-BR') || v.find(x => /^pt/i.test(x.lang)); } catch (e) { return null; } },
  chunks(t) { const out = []; String(t).replace(/\s+/g, ' ').split(/(?<=[.!?;:])\s/).forEach(s => { while (s.length > 220) { const i = s.lastIndexOf(' ', 220); out.push(s.slice(0, i)); s = s.slice(i + 1); } if (s.trim()) out.push(s); }); return out; },
  speak(t, onEnd) {
    if (!this.ok || !t) return;
    try {
      speechSynthesis.cancel();
      const parts = this.chunks(t); const v = this.voice();
      this.speaking = true; updateReadBtn();
      parts.forEach((c, i) => {
        const u = new SpeechSynthesisUtterance(c); u.lang = 'pt-BR'; u.rate = A.rate; if (v) u.voice = v;
        if (i === parts.length - 1) u.onend = () => { this.speaking = false; updateReadBtn(); onEnd && onEnd(); };
        speechSynthesis.speak(u);
      });
    } catch (e) { this.speaking = false; }
  },
  stop() { if (this.ok) speechSynthesis.cancel(); this.speaking = false; updateReadBtn(); }
};
function updateReadBtn() {
  $$('[data-act="read-page"]').forEach(b => {
    b.setAttribute('aria-label', TTS.speaking ? 'Parar leitura' : 'Ouvir página');
    b.innerHTML = icon(TTS.speaking ? 'stop' : 'volume') + `<span class="hide-sm">${TTS.speaking ? 'Parar' : 'Ouvir página'}</span>`;
  });
}
function readPage() {
  if (!TTS.ok) { toast('Seu navegador não oferece leitura em voz alta.', 'err'); return; }
  if (TTS.speaking) { TTS.stop(); return; }
  const main = $('#content') || $('#root');
  TTS.speak(main.innerText.replace(/\n+/g, '. '));
}
function accName(el) {
  if (!el) return '';
  const lab = el.getAttribute('aria-label');
  let name = lab || '';
  if (!name && el.labels && el.labels[0]) name = el.labels[0].innerText;
  if (!name) name = (el.innerText || el.value || el.getAttribute('title') || '').trim();
  const tag = el.tagName.toLowerCase(); let role = '';
  if (tag === 'button') role = 'botão';
  else if (tag === 'a') role = 'link';
  else if (tag === 'select') role = 'lista de opções, selecionado ' + (el.selectedOptions[0]?.text || 'nenhum');
  else if (tag === 'textarea') role = 'campo de texto';
  else if (tag === 'input') {
    const t = el.type;
    if (t === 'checkbox') role = el.checked ? 'caixa marcada' : 'caixa desmarcada';
    else if (t === 'radio') role = 'opção' + (el.checked ? ' selecionada' : '');
    else role = 'campo' + (el.value ? ', valor ' + el.value : ', vazio');
  }
  return `${name}${role ? ', ' + role : ''}`.slice(0, 300);
}
let hoverT, lastHover;
document.addEventListener('focusin', e => { if (A.readFocus && !e.target.matches('#content,h1[tabindex]')) TTS.speak(accName(e.target)); if (A.readFocus && e.target.matches('h1[tabindex]')) TTS.speak('Página ' + e.target.innerText); });
document.addEventListener('mouseover', e => {
  if (!A.readHover) return;
  const el = e.target.closest('button,a,label,h1,h2,h3,p,td,th,li,dt,dd,.stat');
  if (!el || el === lastHover) return;
  clearTimeout(hoverT); hoverT = setTimeout(() => { lastHover = el; TTS.speak(el.matches('button,a') ? accName(el) : el.innerText); }, 350);
});
document.addEventListener('mousemove', e => { if (A.guide) $('#guide').style.top = e.clientY + 'px'; });

// Comandos de voz
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
function voiceCommand() {
  if (!SR) { toast('Comandos de voz não estão disponíveis neste navegador. Use Chrome ou Edge.', 'err'); return; }
  try {
    rec = new SR(); rec.lang = 'pt-BR'; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = ev => handleVoice(ev.results[0][0].transcript);
    rec.onerror = () => toast('Não consegui ouvir. Verifique a permissão do microfone.', 'err');
    rec.start(); toast('Estou ouvindo. Diga, por exemplo: "abrir boletim".', 'info');
  } catch (e) { toast('O microfone não está disponível aqui.', 'err'); }
}
function handleVoice(txt) {
  const t = norm(txt);
  toast(`Você disse: "${txt}"`, 'info');
  if (/parar|silencio/.test(t)) return TTS.stop();
  if (/ler|ouvir/.test(t) && /pagina|tela/.test(t)) return readPage();
  if (/aumentar/.test(t)) return setA('scale', Math.min(200, A.scale + 10), `Texto em ${Math.min(200, A.scale + 10)}%`);
  if (/diminuir/.test(t)) return setA('scale', Math.max(80, A.scale - 10), `Texto em ${Math.max(80, A.scale - 10)}%`);
  if (/contraste/.test(t)) return setA('contrast', !A.contrast, A.contrast ? 'Alto contraste desativado' : 'Alto contraste ativado');
  if (/acessibilidade/.test(t)) return openA11y();
  if (/sair/.test(t)) return logout();
  if (!SESSION) return;
  const hit = navFor(SESSION.role).filter(n => n[0] !== '§').find(([r, l]) => t.includes(norm(l)) || t.includes(norm(l.split(' ')[0])) || t.includes(r));
  if (hit) go(hit[0]); else toast('Comando não reconhecido. Tente "abrir" e o nome de uma seção.', 'err');
}

function a11yBar() {
  return `<div class="a11y-bar" role="group" aria-label="Recursos de acessibilidade">
    <button class="icon-btn" data-act="font-dec" aria-label="Diminuir texto">${icon('minus')}</button>
    <span class="fs-val" aria-hidden="true">${A.scale}%</span>
    <button class="icon-btn" data-act="font-inc" aria-label="Aumentar texto">${icon('plus')}</button>
    <span class="sep" aria-hidden="true"></span>
    <button class="icon-btn" data-act="toggle-contrast" aria-pressed="${A.contrast}" aria-label="Alto contraste">${icon('contrast')}</button>
    <button class="icon-btn" data-act="voice" aria-label="Comando de voz">${icon('mic')}</button>
    <button class="btn ghost" data-act="read-page" aria-label="Ouvir página">${icon('volume')}<span class="hide-sm">Ouvir página</span></button>
    <button class="btn secondary" data-act="a11y" aria-haspopup="dialog" aria-label="Acessibilidade">${icon('access')}<span class="hide-sm">Acessibilidade</span></button>
  </div>`;
}

function openA11y() {
  const sw = (k, l, d) => `<div class="opt-row"><label for="a-${k}"><b>${l}</b><div class="d">${d}</div></label><input type="checkbox" role="switch" class="switch" id="a-${k}" data-a11y="${k}" ${A[k] ? 'checked' : ''}></div>`;
  openDialog({
    title: 'Acessibilidade', sheet: true,
    body: `<div class="row"><button type="button" class="btn outline" data-act="voice">${icon('mic')}Usar comando de voz</button></div><section aria-labelledby="pre-h"><h3 id="pre-h" class="lbl" style="margin-bottom:.5rem">Perfis rápidos</h3><div class="presets">${Object.entries(PRESETS).map(([k, [l]]) => `<button type="button" class="btn outline" data-act="preset" data-id="${k}">${esc(l)}</button>`).join('')}</div></section>
      <div class="field"><label for="a-scale">Tamanho do texto: <span class="fs-val">${A.scale}%</span></label><input id="a-scale" type="range" min="80" max="200" step="10" value="${A.scale}" data-a11y="scale" aria-valuetext="${A.scale} por cento"></div>
      <div>
        ${sw('contrast', 'Alto contraste', 'Fundo preto, texto branco e destaques em amarelo.')}
        ${sw('legible', 'Fonte de alta legibilidade', 'Atkinson Hyperlegible, criada para pessoas com baixa visão.')}
        ${sw('spacing', 'Espaçamento ampliado', 'Mais espaço entre letras, palavras e linhas.')}
        ${sw('underline', 'Sublinhar links', 'Links ficam identificáveis sem depender da cor.')}
        ${sw('bigCursor', 'Cursor grande', 'Ponteiro do mouse ampliado.')}
        ${sw('guide', 'Guia de leitura', 'Uma faixa acompanha o mouse e escurece o resto da tela.')}
        ${sw('reduce', 'Reduzir animações', 'Remove transições e movimentos.')}
      </div>
      <section aria-labelledby="voz-h" style="display:flex;flex-direction:column;gap:.25rem"><h3 id="voz-h" class="lbl">Voz</h3>
        ${sw('readFocus', 'Ler ao navegar pelo teclado', 'Fala o nome de cada botão, link ou campo que recebe foco (Tab).')}
        ${sw('readHover', 'Ler ao passar o mouse', 'Fala o texto sob o ponteiro.')}
        <div class="field"><label for="a-rate">Velocidade da fala: <span id="rate-v">${num(A.rate, 1)}x</span></label><input id="a-rate" type="range" min="0.6" max="1.8" step="0.1" value="${A.rate}" data-a11y="rate"></div>
        ${TTS.ok ? '' : '<p class="err-msg">Este navegador não oferece síntese de voz.</p>'}
      </section>`,
    foot: `<button type="button" class="btn ghost" data-act="preset" data-id="padrao">Restaurar padrão</button><button type="button" class="btn primary" data-act="close-dlg">Concluir</button>`
  });
}
// ---------- Diálogo ----------
let DLG = { onSubmit: null, returnKey: null, returnEl: null };
function openDialog({ title, body, foot, onSubmit, wide, sheet }) {
  const d = $('#dlg');
  const ae = document.activeElement;
  DLG = { onSubmit, returnEl: ae, returnKey: ae && ae.dataset ? { act: ae.dataset.act, id: ae.dataset.id, ent: ae.dataset.ent } : null };
  d.className = (wide ? 'wide ' : '') + (sheet ? 'sheet' : '');
  $('#dlg-title').textContent = title;
  $('#dlg-body').innerHTML = body;
  applyShowIf($('#dlg-form'));
  $('#dlg-foot').innerHTML = foot ?? `<button type="button" class="btn ghost" data-act="close-dlg">Cancelar</button><button type="submit" class="btn primary">${icon('check')}Salvar</button>`;
  if (d.open) d.close();
  d.showModal();
  hydrate($('#dlg-body'));
  const first = $('#dlg-body').querySelector('input:not([type=hidden]):not([type=radio]),select,textarea,button');
  (first || $('#dlg-title')).focus?.();
}
function closeDialog() { const d = $('#dlg'); if (d.open) d.close(); }
$('#dlg').addEventListener('close', () => {
  const { returnEl, returnKey } = DLG;
  setTimeout(() => {
    if (returnEl && returnEl.isConnected) return returnEl.focus();
    if (returnKey && returnKey.act) {
      const sel = `[data-act="${returnKey.act}"]` + (returnKey.id ? `[data-id="${returnKey.id}"]` : '') + (returnKey.ent ? `[data-ent="${returnKey.ent}"]` : '');
      const el = $(sel); if (el) return el.focus();
    }
    $('#page-title')?.focus();
  }, 0);
});
$('#dlg-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!DLG.onSubmit) return closeDialog();
  if (!validate($('#dlg-form'))) return;
  const keep = DLG.onSubmit($('#dlg-form'));
  if (keep !== false) closeDialog();
});
function validate(form) {
  let first = null;
  $$('.err-msg[data-gen]', form).forEach(e => e.remove());
  $$('[aria-invalid]', form).forEach(e => e.removeAttribute('aria-invalid'));
  $$('input,select,textarea', form).forEach(el => {
    if (el.type === 'checkbox' || el.type === 'radio' || el.closest('[hidden]')) return;
    let msg = '';
    if (el.required && !String(el.value).trim()) msg = 'Preencha este campo.';
    else if (el.type === 'email' && el.value && !/^\S+@\S+\.\S+$/.test(el.value)) msg = 'Digite um e-mail válido, como nome@escola.edu.br.';
    else if (el.dataset.nota !== undefined && el.value.trim()) msg = lerNota(el.value).erro || '';
    if (msg) {
      el.setAttribute('aria-invalid', 'true');
      const id = (el.id || uid()) + '-err';
      const p = document.createElement('p'); p.className = 'err-msg'; p.id = id; p.dataset.gen = '1'; p.textContent = msg;
      el.insertAdjacentElement('afterend', p);
      el.setAttribute('aria-describedby', id);
      first = first || el;
    }
  });
  if (first) { const aba = first.closest('[role="tabpanel"]'); if (aba && aba.classList.contains('aba-oculta')) $(`[aria-controls="${aba.id}"]`)?.click(); first.focus(); alertSR('Há campos com erro. ' + (first.labels?.[0]?.innerText || '') + ': ' + $('#' + first.id + '-err')?.textContent); return false; }
  return true;
}
function confirmBox(title, text, onOk, okLabel = 'Excluir') {
  openDialog({ title, body: `<p>${text}</p>`, foot: `<button type="button" class="btn ghost" data-act="close-dlg">Cancelar</button><button type="submit" class="btn danger">${icon('trash')}${esc(okLabel)}</button>`, onSubmit: () => { onOk(); } });
}

// ---------- Campos de formulário ----------
function fieldHTML(f, val) {
  const id = 'f-' + f.k;
  const req = f.req ? 'required' : '';
  const help = f.help ? `<p class="help" id="${id}-h">${esc(f.help)}</p>` : '';
  const desc = f.help ? `aria-describedby="${id}-h"` : '';
  const label = `${esc(f.l)}${f.req ? ' <span class="req" aria-hidden="true">*</span>' : ''}`;
  const opts = (typeof f.o === 'function' ? f.o() : (f.o || [])).slice();
  if (f.t === 'select' && !f.outro && val != null && val !== '' && !opts.some(o => String(o[0]) === String(val))) opts.push([val, `${val} (inativo)`]);
  if (f.t === 'checks') {
    const v = val || [];
    return `<fieldset class="field wide"><legend>${label}</legend><div class="checks">${opts.map(([ov, ol]) => `<label class="check"><input type="checkbox" name="${f.k}" value="${esc(ov)}" ${v.includes(ov) ? 'checked' : ''}>${esc(ol)}</label>`).join('')}</div>${help}</fieldset>`;
  }
  let ctl;
  if (f.t === 'select' && f.outro) return listaOutroHTML(id, f.l, opts, val, { req: !!f.req, help: f.help, name: f.k, wide: f.wide, vazio: f.vazio || 'Selecione…' });
  if (f.t === 'select') ctl = `<select id="${id}" name="${f.k}" ${req} ${desc} ${f.attrs || ''}><option value="">Selecione…</option>${opts.map(([ov, ol]) => `<option value="${esc(ov)}" ${String(ov) === String(val ?? '') ? 'selected' : ''}>${esc(ol)}</option>`).join('')}</select>`;
  else if (f.t === 'textarea') ctl = `<textarea id="${id}" name="${f.k}" ${req} ${desc}>${esc(val)}</textarea>`;
  else ctl = `<input id="${id}" name="${f.k}" type="${f.t || 'text'}" value="${esc(val)}" ${req} ${desc} ${f.attrs || ''} ${f.t === 'email' ? 'autocomplete="email"' : ''}>`;
  return `<div class="field ${f.wide || f.t === 'textarea' ? 'wide' : ''}" ${f.showIf ? `data-show-if="${esc(f.showIf)}"` : ''}><label for="${id}">${label}</label>${ctl}${help}</div>`;
}
const CHG_EXTRA = {};
// ---------- Listas no lugar de texto livre ----------
// Lista com a opção "Outro…": o campo de texto só aparece quando a resposta não está na lista.
function listaOutroHTML(id, label, opts, val, { req = false, help = '', name = '', wide = false, vazio = 'Selecione…' } = {}) {
  const lista = opts.map(o => Array.isArray(o) ? o : [o, o]);
  const naLista = val == null || val === '' || lista.some(([v]) => String(v) === String(val));
  const r = req ? ' <span class="req" aria-hidden="true">*</span>' : '';
  return `<div class="field ${wide ? 'wide' : ''}"><label for="${id}">${esc(label)}${r}</label><select id="${id}" ${name ? `name="${name}__lista"` : ''} ${req ? 'required' : ''} data-change="outro">${`<option value="">${vazio}</option>`}${lista.map(([v, l]) => `<option value="${esc(v)}" ${naLista && String(v) === String(val ?? '') ? 'selected' : ''}>${esc(l)}</option>`).join('')}<option value="__outro" ${naLista ? '' : 'selected'}>Outro…</option></select>
    <div class="field" data-outro-de="${id}" ${naLista ? 'hidden' : ''}><label for="${id}-outro" class="sr-only">${esc(label)}: outro</label><input id="${id}-outro" value="${naLista ? '' : esc(val)}" placeholder="Digite: ${esc(label.toLowerCase())}" ${!naLista && req ? 'required' : ''}></div>${help ? `<p class="help">${esc(help)}</p>` : ''}</div>`;
}
function valorOutro(id) { const s = document.getElementById(id); if (!s) return ''; return s.value === '__outro' ? (document.getElementById(id + '-outro')?.value || '').trim() : s.value; }
CHG_EXTRA.outro = el => { const box = document.querySelector(`[data-outro-de="${el.id}"]`); if (!box) return; const on = el.value === '__outro'; box.hidden = !on; const i = box.querySelector('input'); i.required = on && el.required; if (on) i.focus(); };
// Estado e cidade: a cidade vira lista dos municípios do estado escolhido (municipioService)
function ufCidadeHTML(pref, uf, cidade, { rotuloUF = 'UF', rotuloCidade = 'Cidade' } = {}) {
  return `<div class="field"><label for="${pref}-uf">${rotuloUF}</label><select id="${pref}-uf" data-change="ufCidade" data-pref="${pref}"><option value="">Selecione…</option>${UFS_BR.map(([u, n]) => `<option value="${u}" ${u === uf ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="field" data-cidade="${pref}" data-valor="${esc(cidade)}"><label for="${pref}-cid">${rotuloCidade}</label><select id="${pref}-cid" disabled><option value="">${uf ? 'Carregando…' : 'Escolha o estado primeiro'}</option></select></div>`;
}
async function preencherCidades(pref, manterValor) {
  const uf = document.getElementById(pref + '-uf')?.value; const box = document.querySelector(`[data-cidade="${pref}"]`); if (!box) return;
  const atual = manterValor ? box.dataset.valor : ''; const label = box.querySelector('label').textContent;
  if (!uf) { box.innerHTML = `<label for="${pref}-cid">${esc(label)}</label><select id="${pref}-cid" disabled><option value="">Escolha o estado primeiro</option></select>`; return; }
  const lista = await municipioService.listarPorUF(uf);
  box.innerHTML = lista.length
    ? `<label for="${pref}-cid">${esc(label)}</label><select id="${pref}-cid"><option value="">Selecione…</option>${lista.map(m => `<option ${m === atual ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>`
    : `<label for="${pref}-cid">${esc(label)}</label><input id="${pref}-cid" value="${esc(atual)}"><p class="help">Não foi possível carregar a lista de cidades agora. Digite o nome.</p>`;
}
CHG_EXTRA.ufCidade = el => { const box = document.querySelector(`[data-cidade="${el.dataset.pref}"]`); if (box) box.dataset.valor = ''; preencherCidades(el.dataset.pref, false); };

// Campo que só aparece conforme outro campo: showIf: 'ingresso=Contrato' (aceita vários valores com |)
function applyShowIf(form) {
  if (!form) return;
  $$('[data-show-if]', form).forEach(w => {
    const [k, vals] = w.dataset.showIf.split('='); const src = form.querySelector(`[name="${k}"]`);
    w.hidden = !src || !vals.split('|').includes(src.value);
  });
}
function readForm(form, fields) {
  const fd = new FormData(form); const out = {};
  fields.forEach(f => {
    if (f.t === 'checks') out[f.k] = fd.getAll(f.k);
    else if (f.t === 'select' && f.outro) out[f.k] = valorOutro('f-' + f.k);
    else { let v = fd.get(f.k); if (v == null) return; v = String(v).trim(); if (f.t === 'number' || f.num) v = v === '' ? null : Number(v.replace(',', '.')); out[f.k] = v; }
  });
  return out;
}

// ---------- CRUD genérico ----------
const optsOf = (coll, label = x => x.nome) => () => DADOS[coll].map(x => [x.id, label(x)]).sort((a, b) => a[1].localeCompare(b[1]));
const optsFix = arr => arr.map(x => Array.isArray(x) ? x : [x, x]);
const ENT = {}; // preenchido em pages.js

function crudRows(key) {
  const E = ENT[key];
  let rows = E.rows ? E.rows() : DADOS[E.coll].slice();
  if (E.filter && !(E.filter.scoped && escSessao()) && UI.f[key]) rows = rows.filter(r => String(r[E.filter.k]) === UI.f[key]);
  const q = norm(UI.q[key] || '');
  if (q) rows = rows.filter(r => norm(E.cols.map(c => String(c[1](r))).join(' ').replace(/<[^>]+>/g, ' ')).includes(q));
  if (E.sort) rows.sort(E.sort);
  return rows;
}
function crudTable(key) {
  const E = ENT[key]; const rows = crudRows(key);
  const canEdit = typeof E.canEdit === 'function' ? E.canEdit() : E.canEdit !== false;
  if (!rows.length) return `<p class="empty">${UI.q[key] || UI.f[key] ? 'Nenhum resultado para esse filtro.' : `Nenhum registro ainda. Use "${esc(E.newLabel || 'Adicionar')}" para começar.`}</p>`;
  return `<div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">${esc(E.title)}: ${rows.length} registros</caption><thead><tr>${E.cols.map((c, i) => `<th scope="col" class="${c[2] || ''}">${c[0]}</th>`).join('')}${canEdit || E.rowActs ? '<th scope="col" class="n">Ações</th>' : ''}</tr></thead><tbody>${rows.map(r => {
    const name = E.name ? E.name(r) : (r.nome || r.titulo || '');
    return `<tr>${E.cols.map((c, i) => i === 0 ? `<th scope="row" class="${c[2] || ''}">${c[1](r)}</th>` : `<td class="${c[2] || ''}" data-label="${esc(c[0])}">${c[1](r)}</td>`).join('')}${canEdit || E.rowActs ? `<td><div class="acts">${(E.rowActs ? E.rowActs(r) : '')}${canEdit ? `<button class="icon-btn" data-act="edit" data-ent="${key}" data-id="${r.id}" aria-label="Editar ${esc(E.singular)} ${esc(name)}">${icon('pencil')}</button><button class="icon-btn" data-act="del" data-ent="${key}" data-id="${r.id}" aria-label="Excluir ${esc(E.singular)} ${esc(name)}">${icon('trash')}</button>` : ''}</div></td>` : ''}</tr>`;
  }).join('')}</tbody></table></div>`;
}
function crudPage(key, extraTop = '') {
  const E = ENT[key]; const n = crudRows(key).length;
  return pageHead(E.title, E.desc, (typeof E.canNew === 'function' ? !E.canNew() : E.canNew === false) ? '' : `<button class="btn primary" data-act="new" data-ent="${key}">${icon('plus')}${esc(E.newLabel)}</button>`) + extraTop +
    `<section aria-label="Lista de ${esc(E.title)}"><div class="toolbar">
      <div class="field search"><label for="q-${key}">Buscar</label><div class="search">${icon('search')}<input id="q-${key}" class="input" type="search" data-search="${key}" value="${esc(UI.q[key] || '')}" placeholder="${esc(E.searchPh || 'Digite para filtrar')}" aria-describedby="cnt-${key}"></div></div>
      ${E.filter && !(E.filter.scoped && escSessao()) ? `<div class="field"><label for="fl-${key}">${esc(E.filter.l)}</label><select id="fl-${key}" class="input" data-filter="${key}"><option value="">Todos</option>${E.filter.o().map(([v, l]) => `<option value="${esc(v)}" ${UI.f[key] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>` : ''}
      <p class="caption" id="cnt-${key}" aria-live="polite" style="padding-bottom:.75rem">${n} ${n === 1 ? esc(E.singular) : esc(E.plural || E.title.toLowerCase())}</p>
    </div><div id="tbl-${key}">${crudTable(key)}</div></section>`;
}
function refreshCrud(key) {
  const t = $('#tbl-' + key); if (t) t.innerHTML = crudTable(key);
  const c = $('#cnt-' + key); if (c) { const n = crudRows(key).length; const E = ENT[key]; c.textContent = `${n} ${n === 1 ? E.singular : (E.plural || E.title.toLowerCase())}`; }
}
function openForm(key, id, defaults = {}) {
  const E = ENT[key]; const row = id ? DADOS[E.coll].find(r => r.id === id) : Object.assign({}, E.defaults ? E.defaults() : {}, defaults);
  const fields = typeof E.fields === 'function' ? E.fields() : E.fields;
  openDialog({
    title: (id ? 'Editar ' : (E.fem ? 'Nova ' : 'Novo ')) + E.singular,
    wide: fields.length > 6,
    body: `<p class="caption">Campos com <span class="req">*</span> são obrigatórios.</p><div class="form-grid">${fields.map(f => fieldHTML(f, row[f.k])).join('')}</div>`,
    onSubmit: form => {
      const vals = readForm(form, fields);
      if (E.check) { const err = E.check(vals, id); if (err) { alertSR(err); toast(err, 'err'); return false; } }
      const obj = Object.assign(JSON.parse(JSON.stringify(row)), vals);
      if (E.after) E.after(obj, !id);
      servico(E.coll).salvar(obj).then(() => { rerender(); toast(`${cap(E.singular)} ${id ? 'atualizad' : 'cadastrad'}${E.fem ? 'a' : 'o'}.`); }).catch(e => toast(e.message, 'err'));
    }
  });
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Shell ----------
function pageHead(title, desc, actions = '', h1cls = '') {
  return `<header class="ph"><div><h1 id="page-title" tabindex="-1" class="${h1cls}">${title}</h1>${desc ? `<p class="lead">${desc}</p>` : ''}</div>${actions ? `<div class="ph-actions">${actions}</div>` : ''}</header>`;
}
function renderShell() {
  const u = me(); const nav = navFor(SESSION.role);
  const sub = SESSION.role === 'aluno' ? `${turmaNome(u.turmaId)}, Ensino médio` : SESSION.role === 'professor' ? habilitadas(u).map(discNome).join(', ') : SESSION.role === 'responsavel' ? `Responsável, ${(u.filhos || []).length} filho${(u.filhos || []).length === 1 ? '' : 's'} na rede` : u.cargo;
  $('#root').innerHTML = `<div class="app" id="app">
    <aside class="side" id="side" aria-label="Menu principal">
      <button class="icon-btn side-close" data-act="close-nav" aria-label="Fechar menu">${icon('x')}</button>
      <a class="logo" href="#inicio" data-act="go" data-route="inicio">Entrelaço<small>Portal ${esc(ROLE_LABEL[SESSION.role].toLowerCase())}</small></a>
      <nav class="nav" id="nav" aria-label="Seções">${nav.map(([r, l, ic]) => r === '§' ? `<p class="nav-group">${l}</p>` : `<a href="#${r}" data-act="go" data-route="${r}">${icon(ic)}<span>${l}</span></a>`).join('')}</nav>
      <div class="me"><span class="avatar" aria-hidden="true">${initials(u.nome)}</span><div class="who"><strong>${esc(u.nome)}</strong><span>${esc(sub)}</span></div><button class="icon-btn" data-act="logout" aria-label="Sair e trocar de perfil">${icon('logout')}</button></div>
    </aside>
    <div class="scrim" data-act="close-nav"></div>
    <div class="main">
      <div class="topbar"><button class="icon-btn menu-btn" data-act="open-nav" aria-label="Abrir menu" aria-controls="side" aria-expanded="false">${icon('menu')}</button><span class="top-logo" aria-hidden="true">Entrelaço</span><button class="profile-btn" data-act="perfil-menu" aria-haspopup="dialog" aria-label="Seu perfil: ${esc(u.nome)}. Trocar de perfil"><span class="avatar" aria-hidden="true">${initials(u.nome)}</span></button><div class="crumb-box"><p class="crumb">${esc(escSessao() ? byId('escolas', escSessao())?.nome : DADOS.config.escolaNome)}</p>${anoTopoHTML()}</div><div class="row" style="gap:.125rem">${notifBtn()}${a11yBar()}</div></div>
      <main id="content" tabindex="-1"></main>
    </div>
    <nav class="tabbar" aria-label="Atalhos" style="grid-template-columns:repeat(${tabsFor().length + 1},minmax(0,1fr))">${tabsFor().map(([r, l, ic]) => `<a href="#${r}" data-act="go" data-route="${r}">${icon(ic)}<span>${l}</span></a>`).join('')}<button class="tab-more" data-act="open-nav" aria-controls="side" aria-expanded="false">${icon('menu')}<span>Mais</span></button></nav>
    </div>`;
  updateReadBtn();
}
const tabsFor = () => (TABS[SESSION.role] || []).filter(t => navFor(SESSION.role).some(n => n[0] === t[0]));
// Componentes que precisam de JavaScript depois de entrar na tela (mapas, QR codes, gráficos interativos)
const HYDRATORS = [];
function hydrate(root) { if (root) HYDRATORS.forEach(h => { try { h(root); } catch (e) { console.warn(e); } }); }
function renderPage() { return dadosService.carregar().then(montarPagina); }
function montarPagina() {
  const nav = navFor(SESSION.role);
  if (!nav.find(n => n[0] === UI.route)) UI.route = 'inicio';
  const fn = PAGES[SESSION.role][UI.route];
  const out = fn();
  if (out && typeof out.then === 'function') {
    const rota = UI.route; $('#content').setAttribute('aria-busy', 'true');
    return out.then(html => { if (UI.route === rota) mostrarPagina(html, nav); }).catch(e => { $('#content').innerHTML = `<p class="empty">Não foi possível carregar esta tela: ${esc(e.message)}</p>`; }).finally(() => $('#content').removeAttribute('aria-busy'));
  }
  mostrarPagina(out, nav);
}
function mostrarPagina(html, nav) {
  $('#content').innerHTML = html;
  const inTabs = tabsFor().some(t => t[0] === UI.route);
  $('.tab-more')?.classList.toggle('on', !inTabs);
  $$('#nav a, .tabbar a').forEach(a => { if (a.dataset.route === UI.route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const lbl = nav.find(n => n[0] === UI.route)[1];
  document.title = `${lbl}, Portal Entrelaço`;
  refreshNotif();
  hydrate($('#content'));
}
function rerender() {
  const ae = document.activeElement; const key = ae && ae.id; const y = window.scrollY;
  const depois = () => { if (key && document.getElementById(key)) document.getElementById(key).focus(); window.scrollTo(0, y); };
  const p = renderPage(); return p ? p.then(depois) : depois();
}
function go(route) {
  UI.route = route; TTS.stop();
  closeNav();
  const depois = () => { window.scrollTo(0, 0); const h = $('#page-title'); if (h) h.focus({ preventScroll: true }); };
  const p = renderPage(); return p ? p.then(depois) : depois();
}
function closeNav() { $('#app')?.classList.remove('nav-open'); $$('[data-act="open-nav"]').forEach(b => b.setAttribute('aria-expanded', 'false')); }
const visibleOpener = () => $$('[data-act="open-nav"]').find(b => b.offsetParent);
function logout() { closeDialog(); SESSION = null; LS.del('entrelaco.session'); TTS.stop(); render(); }
function render() {
  if (!SESSION || !me()) { SESSION = null; renderLogin(); return; }
  renderShell(); renderPage();
}

// ---------- Login ----------
const EQUIPE_ROLES = ['gestao', 'diretor', 'rh', 'dae', 'motorista', 'ded', 'secretario', 'regional', 'calendario'];
const LOGIN_PERFIS = {
  gestao: ['Secretaria escolar', 'A secretaria da escola: turmas, horários, alunos e rematrícula', 'building'], diretor: ['Diretor', 'Calendário, comunicados e relatórios', 'calendar'], professor: ['Professor', 'Chamada, notas e atividades', 'teacher'],
  aluno: ['Aluno', 'Boletim, entregas, horário e transporte', 'cap'], responsavel: ['Responsável', 'Vagas, matrícula online e boletim dos filhos', 'users'],
  rh: ['RH', 'Professores, vínculos e lotações', 'teacher'], calendario: ['Calendário escolar', 'Eventos, feriados e prazos da rede', 'calendar'], secretario: ['Secretário (SEDUC)', 'Toda a rede: cadastro e gestão das escolas', 'home'], ded: ['DED', 'Cursos e matrizes curriculares', 'book'], regional: ['Diretoria Regional', 'Escolas e infraestrutura da regional', 'pin'], dae: ['DAE', 'Estoque e consumo da merenda', 'utensils'], motorista: ['Motorista', 'Lista de embarque do ônibus', 'bus']
};
const LOGIN_GRUPOS = [['Escola', ['gestao', 'diretor', 'professor']], ['Estudantes e famílias', ['aluno', 'responsavel']], ['Secretaria de Educação', ['secretario', 'ded', 'rh', 'dae', 'calendario', 'regional']], ['Transporte escolar', ['motorista']]];
function renderLogin() {
  document.title = 'Entrar, Portal Entrelaço';
  const role = UI.loginRole || 'gestao';
  const people = EQUIPE_ROLES.includes(role) ? equipeDe(role).map(([id, g]) => [id, `${g.nome} — ${g.cargo}`]) : role === 'professor' ? DADOS.professores.map(p => [p.id, `${p.nome} — ${habilitadas(p).map(discNome).join(', ')}`]) : role === 'aluno' ? DADOS.alunos.map(a => [a.id, `${a.nome} — ${turmaNome(a.turmaId)}`]) : role === 'responsavel' ? (DADOS.responsaveis || []).map(r => [r.id, `${r.nome} — ${(r.filhos || []).length ? 'responsável por ' + r.filhos.map(alunoNome).join(', ') : 'sem filhos na rede ainda'}`]) : [];
  $('#root').innerHTML = `<div class="login">
    <section class="login-hero" aria-labelledby="hero-h"><span class="brand" aria-hidden="true">Entrelaço</span><h1 id="hero-h">Portal escolar</h1><p>Gestão, professores e alunos no mesmo lugar: matrículas, turmas, notas, frequência, atividades e comunicados.</p>
      <div class="principles"><div><b>Acolhedor</b><span>Tons calmos e cantos arredondados.</span></div><div><b>Claro</b><span>Um destaque por tela e contraste mínimo AA.</span></div><div><b>Acessível</b><span>Leitura em voz alta, alto contraste e atalhos.</span></div></div></section>
    <main class="login-main" id="content" tabindex="-1">
      <div class="login-top">${a11yBar()}</div>
      <div><h2 id="page-title" tabindex="-1" style="font-size:var(--t-h1)">Como você quer entrar?</h2><p class="muted" style="margin-top:.25rem">Protótipo com dados de exemplo.</p></div>
      <form id="login-form" class="roles" aria-labelledby="page-title">
        ${LOGIN_GRUPOS.map(([g, roles]) => `<fieldset class="role-group"><legend>${g}</legend><div class="role-grid">${roles.map(v => { const [l, d, ic] = LOGIN_PERFIS[v]; return `<label class="role"><input type="radio" name="role" value="${v}" ${role === v ? 'checked' : ''} data-change="login-role"><span class="ico">${icon(ic)}</span><span><b>${l}</b><span>${d}</span></span></label>`; }).join('')}</div></fieldset>`).join('')}
        <div class="field"><label for="login-who">Entrar como</label><select id="login-who" name="who">${people.map(([v, l]) => `<option value="${v}" ${(role === 'aluno' && v === 'a1') || (role === 'professor' && v === 'p1') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select><p class="help">No protótipo não há senha. Escolha quem vai usar o portal.</p></div>
        <button class="btn primary" type="submit" style="min-height:3.25rem;font-size:1rem">Entrar</button>
      </form>
      <p class="caption">Os dados ficam salvos neste navegador. <button class="btn ghost sm" data-act="reset">${icon('refresh')}Restaurar dados de exemplo</button></p>
    </main></div>`;
}

// ---------- Eventos globais ----------
const ACT = {
  go: el => go(el.dataset.route),
  'open-nav': el => { $('#app').classList.add('nav-open'); el.setAttribute('aria-expanded', 'true'); $('#nav a')?.focus(); },
  'close-nav': closeNav,
  logout,
  'perfil-menu': () => {
    const u = me();
    openDialog({ title: 'Seu perfil', body: `<div class="row"><span class="avatar lg" aria-hidden="true">${initials(u.nome)}</span><div><p class="t" style="font-weight:600;color:var(--tx-strong)">${esc(u.nome)}</p><p class="muted">${esc(ROLE_LABEL[SESSION.role])}</p></div></div><p class="muted">Para entrar como gestão, professor, aluno ou responsável, troque de perfil.</p>`,
      foot: `<button type="button" class="btn ghost" data-act="close-dlg">Fechar</button><button type="button" class="btn primary" data-act="logout">${icon('logout')}Trocar de perfil</button>` });
  },
  'close-dlg': closeDialog,
  'font-inc': () => setA('scale', Math.min(200, A.scale + 10), `Texto em ${Math.min(200, A.scale + 10)}%`),
  'font-dec': () => setA('scale', Math.max(80, A.scale - 10), `Texto em ${Math.max(80, A.scale - 10)}%`),
  'toggle-contrast': () => setA('contrast', !A.contrast, A.contrast ? 'Alto contraste desativado' : 'Alto contraste ativado'),
  'read-page': readPage,
  voice: voiceCommand,
  a11y: openA11y,
  preset: el => { const [l, p] = PRESETS[el.dataset.id]; A = Object.assign({}, A_DEFAULT, p); applyA11y(); if ($('#dlg').open) { closeDialog(); setTimeout(openA11y, 30); } toast(`Perfil "${l}" aplicado.`, 'info'); },
  speak: el => TTS.speak(el.dataset.text || $(el.dataset.target)?.innerText || ''),
  reset: () => confirmBox('Restaurar dados de exemplo', 'Tudo o que foi cadastrado ou alterado neste navegador será substituído pelos dados de exemplo.', () => resetData().then(() => { render(); toast('Dados de exemplo restaurados.'); }), 'Restaurar'),
  new: el => { const d = {}; Object.keys(el.dataset).filter(k => k.startsWith('def')).forEach(k => { const f = k.slice(3); d[f.charAt(0).toLowerCase() + f.slice(1)] = isNaN(el.dataset[k]) || el.dataset[k] === '' ? el.dataset[k] : Number(el.dataset[k]); }); openForm(el.dataset.ent, null, d); },
  edit: el => openForm(el.dataset.ent, el.dataset.id),
  del: el => {
    const E = ENT[el.dataset.ent]; const r = DADOS[E.coll].find(x => x.id === el.dataset.id);
    const name = E.name ? E.name(r) : (r.nome || r.titulo || '');
    confirmBox(`Excluir ${E.singular}`, `Excluir <b>${esc(name)}</b>? Essa ação não pode ser desfeita.`, () => servico(E.coll).remover(r.id).then(() => { if (E.onDelete) E.onDelete(r); save(); rerender(); toast(`${cap(E.singular)} excluíd${E.fem ? 'a' : 'o'}.`); }));
  }
};
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const fn = ACT[t.dataset.act]; if (!fn) return;
  e.preventDefault(); fn(t, e);
});
document.addEventListener('input', e => {
  const s = e.target.dataset.search; if (s) { UI.q[s] = e.target.value; refreshCrud(s); return; }
  const k = e.target.dataset.a11y;
  if (k === 'scale') { A.scale = Number(e.target.value); e.target.setAttribute('aria-valuetext', A.scale + ' por cento'); applyA11y(); }
  if (k === 'rate') { A.rate = Number(e.target.value); $('#rate-v').textContent = num(A.rate, 1) + 'x'; applyA11y(); }
  if (e.target.dataset.input && CHG[e.target.dataset.input]) CHG[e.target.dataset.input](e.target);
});
const CHG = Object.assign(CHG_EXTRA, {
  'login-role': el => { UI.loginRole = el.value; renderLogin(); $(`input[name=role][value="${el.value}"]`).focus(); },
  // Trocar o ano no topo: todas as telas da escola passam a mostrar esse ano
  anoTopo: el => { UI.ano = Number(el.value); UI.sel = {}; renderShell(); renderPage().then(() => $('#ano-topo')?.focus()); toast(`Mostrando o ano letivo ${el.value}${anoEncerrado(UI.ano) ? ', encerrado: só consulta' : ''}.`, 'info'); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.filter) { UI.f[el.dataset.filter] = el.value; refreshCrud(el.dataset.filter); return; }
  const k = el.dataset.a11y;
  if (el.form && el.form.querySelector('[data-show-if]')) applyShowIf(el.form);
  if (k && k !== 'scale' && k !== 'rate') {
    if (k === 'theme') setA('theme', el.value, 'Tema alterado.');
    else setA(k, el.checked, `${el.closest('.opt-row').querySelector('b').innerText} ${el.checked ? 'ativado' : 'desativado'}.`);
    return;
  }
  if (el.dataset.change && CHG[el.dataset.change]) CHG[el.dataset.change](el);
});
document.addEventListener('submit', e => {
  const f = e.target; if (f.id === 'dlg-form') return;
  e.preventDefault();
  if (f.id === 'login-form') {
    const role = new FormData(f).get('role'); const who = new FormData(f).get('who');
    SESSION = { role, userId: who }; LS.set('entrelaco.session', SESSION); UI.route = 'inicio'; UI.q = {}; UI.f = {}; UI.sel = {}; UI.ano = null;
    render(); $('#page-title')?.focus(); toast(`Olá, ${firstName(me().nome)}. Você entrou como ${ROLE_LABEL[role].toLowerCase()}.`, 'info');
    return;
  }
  if (f.dataset.form && FORMS[f.dataset.form]) { if (!validate(f)) return; FORMS[f.dataset.form](f); }
});
const FORMS = {};
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (TTS.speaking) TTS.stop(); if ($('#app')?.classList.contains('nav-open')) { closeNav(); visibleOpener()?.focus(); } }
  if (e.key === 'Tab') document.documentElement.classList.remove('using-pointer');
});
// Anel de foco só para quem navega pelo teclado
document.addEventListener('pointerdown', () => document.documentElement.classList.add('using-pointer'));
