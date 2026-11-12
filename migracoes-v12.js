/* Migração 11 → 12 (mentoria de 12/11/2026): ano letivo por escola, turmas com identificador e série da matriz,
   cadastro de escolas só na Secretaria de Educação (perfil Secretário) e dados de exemplo para o fechamento do ano. */
'use strict';
function migrarV12(db) {
  const demo = db.demo !== false; const anoBase = Number(db.config.anoLetivo) || 2026;
  // Arte está na matriz do Ensino Médio, mas não existia como disciplina
  if (!db.disciplinas.some(d => norm(d.nome) === 'arte')) db.disciplinas.push({ id: 'd13', nome: 'Arte', area: 'Linguagens', ch: 40 });
  // Séries da matriz de exemplo com o nome usado nas turmas ("1º ano")
  if (demo) (db.matrizes || []).filter(m => m.cursoId === 'c3').forEach(m => m.series.forEach((s, i) => { if (/^\dª série$/.test(s.nome)) s.nome = `${i + 1}º ano`; }));
  // Anos letivos: um ativo por escola
  db.anosLetivos = db.anosLetivos || [];
  db.escolas.forEach(e => { if (!db.anosLetivos.some(a => a.escolaId === e.id)) db.anosLetivos.push(Modelos.anoLetivo({ id: `al-${e.id}-${anoBase}`, escolaId: e.id, ano: anoBase, status: 'ativo' })); });
  // Turmas: identificador separado, série da matriz e quantidade de vagas
  db.turmas.forEach(t => {
    const m = (db.matrizes || []).find(x => x.cursoId === t.cursoId); const dig = (String(t.serie || t.nome).match(/\d/) || [''])[0];
    const s = m?.series.find(x => (x.nome.match(/\d/) || [''])[0] === dig);
    if (!t.identificador) t.identificador = String(t.nome || '').trim().split(/\s+/).pop() || 'A';
    if (!t.serieId && s) { t.serieId = s.id; t.serieNome = s.nome; }
    if (t.serieNome) t.nome = `${t.serieNome} ${t.identificador}`;
    if (!t.vagas) t.vagas = Math.max(35, db.alunos.filter(a => a.turmaId === t.id).length);
    if (t.finalizada === undefined) t.finalizada = null;
    t.ano = Number(t.ano) || anoBase;
  });
  // Perfis: escolas passam para a Secretaria de Educação; a Secretaria escolar fica com turmas, alunos e fechamento
  db.perfis = db.perfis || {};
  const tira = (r, k) => { if (db.perfis[r]) db.perfis[r] = db.perfis[r].filter(x => x !== k); };
  const poe = (r, k) => { db.perfis[r] = db.perfis[r] || (PERFIS_PADRAO[r] || []).slice(); if (!db.perfis[r].includes(k)) db.perfis[r].push(k); };
  tira('gestao', 'escolas.editar'); poe('secretario', 'escolas.editar');
  ['turmas.gerir', 'alunos.necessidades', 'anoletivo.fechar'].forEach(k => poe('gestao', k));
  if (demo) exemplosV12(db);
  db.migracoes = db.migracoes || [];
  db.migracoes.push({ versao: 12, data: new Date().toISOString(), nota: 'Ano letivo por escola, turmas com identificador, escolas na Secretaria de Educação, fechamento e rematrícula.' });
  db.v = 12;
}

// Exemplo: o ano inteiro de aulas e notas nas turmas da Unidade Centro, para dar para finalizar as turmas e rematricular.
// A Unidade Atalaia fica com o diário incompleto, para mostrar o bloqueio.
function exemplosV12(db) {
  const R = mulberry32(1212); const m = (db.matrizes || []).find(x => x.cursoId === 'c3'); if (!m) return;
  const dias = []; for (const d = dOf('2026-02-02'); isoOf(d) < addDays(-28); d.setDate(d.getDate() + 1)) if (d.getDay() > 0 && d.getDay() < 6) dias.push(isoOf(d));
  const taxaFalta = { a7: 0.3, a19: 0.2 };
  db.turmas.filter(t => t.escolaId === 'e1' && t.serieId).forEach(t => {
    const s = m.series.find(x => x.id === t.serieId); if (!s) return;
    const al = db.alunos.filter(a => a.turmaId === t.id);
    const falta = s.componentes.map(c => { const d = db.disciplinas.find(x => norm(x.nome) === norm(c.nome)); return d ? { d, n: Math.max(0, c.cargaHoraria - db.chamadas.filter(x => x.turmaId === t.id && x.disciplinaId === d.id).length), total: c.cargaHoraria } : null; }).filter(Boolean);
    // Uma aula de cada componente por vez, para os dias ficarem misturados como numa semana real
    let i = 0;
    while (falta.some(f => f.n)) falta.filter(f => f.n).forEach(f => {
      db.chamadas.push({ id: uid(), turmaId: t.id, disciplinaId: f.d.id, data: dias[Math.floor(i / 6) % dias.length], slot: i % 6, conteudo: `Aula ${f.total - f.n + 1} de ${f.d.nome}`, faltas: al.filter(a => R() < (taxaFalta[a.id] ?? 0.04)).map(a => a.id) });
      f.n--; i++;
    });
    // Notas que faltam nos três primeiros bimestres e o 4º bimestre inteiro (o diário do ano está completo)
    falta.forEach(f => [1, 2, 3, 4].forEach(b => al.forEach(a => { const k = `${a.id}|${f.d.id}|${b}`; if (db.notas[k] == null) db.notas[k] = Math.round((a.id === 'a19' ? 4.2 + R() * 2 : (b === 4 ? 6.5 : 6) + R() * 3.5) * 10) / 10; })));
  });
}
