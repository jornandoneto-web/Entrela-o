/* Migração 14 → 15 (mentoria de 26/11/2026):
   - componentes da matriz ganham "aulas por semana" (base das caixinhas da grade horária). O valor inicial vem da grade
     que as escolas já montaram para aquela série; sem grade, da carga anual ÷ semanas letivas;
   - nova permissão grade.montar para a Secretaria escolar e o Diretor; o Diretor passa a ver Notas e boletins. */
'use strict';
function migrarV15(db) {
  const sem = db.config?.semanasLetivas || 40;
  (db.matrizes || []).forEach(m => m.series.forEach(s => {
    const num0 = (s.nome.match(/\d/) || [''])[0];
    const turmas = (db.turmas || []).filter(t => t.cursoId === m.cursoId && (t.serieId === s.id || (t.serie.match(/\d/) || [''])[0] === num0));
    s.componentes.forEach(c => {
      if (Number(c.aulasPorSemana)) return;
      const d = (db.disciplinas || []).find(x => norm(x.nome) === norm(c.nome));
      const qtds = d ? turmas.map(t => (db.aulas || []).filter(a => a.turmaId === t.id && a.disciplinaId === d.id).length).filter(n => n > 0) : [];
      const naGrade = qtds.length ? Math.min(...qtds) : 0;
      c.aulasPorSemana = naGrade || Math.max(1, Math.ceil((Number(c.cargaHoraria) || 0) / sem));
    });
  }));
  if (db.perfis) ['gestao', 'diretor'].forEach(r => { db.perfis[r] = db.perfis[r] || (PERFIS_PADRAO[r] || []).slice(); if (!db.perfis[r].includes('grade.montar')) db.perfis[r].push('grade.montar'); });
  if (db.perfis?.diretor && !db.perfis.diretor.includes('boletins.ver')) db.perfis.diretor.push('boletins.ver');
  if (db.demo !== false) demoGradeV15(db);
  db.migracoes = db.migracoes || [];
  db.migracoes.push({ versao: 15, data: new Date().toISOString(), nota: 'Aulas por semana na matriz e permissão para montar a grade horária.' });
  db.v = 15;
}

/* Dados de exemplo coerentes com a regra nova:
   - matriz do Ensino Médio com 25 aulas por semana (cabe nos 5 horários × 5 dias);
   - professores de Educação Física e de Filosofia/Sociologia lotados na Unidade Centro;
   - grade das turmas da Unidade Centro refeita a partir da matriz: 1º e 2º ano completos, 3º ano com 5 aulas para distribuir. */
function demoGradeV15(db) {
  const APS = { 'língua portuguesa': 4, 'matematica': 4, 'historia': 2, 'geografia': 2, 'fisica': 2, 'quimica': 2, 'biologia': 2, 'ingles': 2, 'educacao fisica': 2, 'arte': 1, 'filosofia': 1, 'sociologia': 1 };
  const aps = nome => APS[norm(nome)] ?? APS[nome.toLowerCase()];
  const cursoEM = (db.cursos || []).find(c => norm(c.nome).includes('medio'));
  const mEM = cursoEM && (db.matrizes || []).find(x => x.cursoId === cursoEM.id);
  if (!mEM) return;
  mEM.series.forEach(s => s.componentes.forEach(c => { const v = aps(c.nome); if (v) c.aulasPorSemana = v; }));
  const disc = nome => db.disciplinas.find(d => norm(d.nome) === norm(nome));
  // Formações e professores que faltavam
  const form = (id, nome, nomes) => { if (!db.formacoes.some(f => f.id === id)) db.formacoes.push({ id, nome, disciplinas: nomes.map(n => disc(n)?.id).filter(Boolean), chaves: [] }); };
  form('f-edf', 'Licenciatura em Educação Física', ['Educação Física']);
  form('f-fil', 'Licenciatura em Filosofia', ['Filosofia']);
  form('f-soc', 'Licenciatura em Ciências Sociais', ['Sociologia']);
  const novoProf = (id, nome, forms, cpfBase, nasc, sexo) => {
    if (db.professores.some(p => p.id === id)) return;
    const v = Modelos.vinculo({ cargo: 'Professor', formacoes: forms, disciplinas: forms.flatMap(f => db.formacoes.find(x => x.id === f).disciplinas), ingresso: 'Concurso', dataInicio: '2022-02-07', cargaHoraria: 25 });
    db.professores.push(Modelos.professor({ id, pessoa: { nome, cpf: gerarCPF(cpfBase), nascimento: nasc, sexo, estadoCivil: 'Solteiro(a)', telefones: ['(79) 99700-' + String(cpfBase).slice(-4)], email: norm(nome).replace(/\s+/g, '.') + '@entrelaco.edu.br', naturalidade: { cidade: 'Aracaju', uf: 'SE' } }, habilitacoes: forms.map(f => ({ formacaoId: f, instituicao: 'UFS', anoConclusao: '2018' })), formacoes: forms, vinculos: [v] }));
    db.lotacoes.push(Modelos.lotacao({ professorId: id, vinculoId: v.id, escolaId: 'e1', cargaHoraria: 10, dataInicio: '2026-02-02' }));
  };
  novoProf('p-edf', 'Fábio Rezende', ['f-edf'], 707808909, '1990-05-12', 'Masculino');
  novoProf('p-hum', 'Lívia Prado', ['f-fil', 'f-soc'], 808909101, '1987-10-03', 'Feminino');
  // Professora de Inglês lotada também na Unidade Centro
  const ren = db.professores.find(p => p.pessoa?.nome === 'Renata Moura');
  if (ren && !db.lotacoes.some(l => l.professorId === ren.id && l.escolaId === 'e1' && lotacaoAtiva(l))) {
    const v = ren.vinculos.find(vinculoAtivo); if (v) db.lotacoes.push(Modelos.lotacao({ professorId: ren.id, vinculoId: v.id, escolaId: 'e1', cargaHoraria: 6, dataInicio: '2026-02-02' }));
  }
  db.professores.forEach(projetarProfessor);
  // Grade das turmas do Ensino Médio da Unidade Centro, a partir da matriz
  const turmas = db.turmas.filter(t => t.escolaId === 'e1' && t.cursoId === cursoEM.id && !t.finalizada).sort((a, b) => a.nome.localeCompare(b.nome));
  if (!turmas.length) return;
  const slots = Math.max(1, (db.faixas || []).filter(f => f.turno === turmas[0].turno).length) || 5;
  const lotado = (p, e) => db.lotacoes.some(l => l.professorId === p.id && l.escolaId === e && lotacaoAtiva(l));
  const hab = p => uniq((p.formacoes || []).flatMap(f => db.formacoes.find(x => x.id === f)?.disciplinas || []));
  const ativoP = p => p.vinculos.some(vinculoAtivo);
  const fixas = db.aulas.filter(a => !turmas.some(t => t.id === a.turmaId)); // aulas de outras turmas (conflitos de professor)
  const carga = {};
  const pedidos = turmas.map(t => {
    const s = mEM.series.find(x => x.id === t.serieId) || mEM.series.find(x => (x.nome.match(/\d/) || [''])[0] === (t.serie.match(/\d/) || [''])[0]);
    return (s?.componentes || []).flatMap(c => { const d = disc(c.nome); if (!d) return [];
      const cands = db.professores.filter(p => ativoP(p) && hab(p).includes(d.id) && lotado(p, t.escolaId)); if (!cands.length) return [];
      const atual = db.aulas.find(a => a.turmaId === t.id && a.disciplinaId === d.id && cands.some(p => p.id === a.professorId));
      const p = atual ? cands.find(x => x.id === atual.professorId) : cands.sort((x, y) => (carga[x.id] || 0) - (carga[y.id] || 0))[0];
      carga[p.id] = (carga[p.id] || 0) + c.aulasPorSemana;
      return Array.from({ length: c.aulasPorSemana }, () => ({ turmaId: t.id, disciplinaId: d.id, professorId: p.id }));
    });
  });
  // Preenche horário a horário: em cada dia/horário, cada turma recebe a aula cujo professor está livre e tem mais aulas pendentes
  let rnd = 7; const rand = () => (rnd = (rnd * 9301 + 49297) % 233280) / 233280;
  const fixasTurno = fixas.filter(a => db.turmas.find(t => t.id === a.turmaId)?.turno === turmas[0].turno);
  let melhor = null;
  for (let tent = 0; tent < 200 && !melhor; tent++) {
    const rest = pedidos.map(l => l.slice()); const novas = []; let falhou = false;
    const pend = pid => rest.reduce((n, l) => n + l.filter(x => x.professorId === pid).length, 0);
    for (let d = 1; d <= 5 && !falhou; d++) for (let s = 0; s < slots && !falhou; s++) {
      const ordem = turmas.map((t, k) => k).sort(() => rand() - .5);
      for (const k of ordem) {
        const t = turmas[k]; if (!rest[k].length) continue;
        const ocupados = new Set([...fixasTurno, ...novas].filter(a => a.dia === d && a.slot === s).map(a => a.professorId));
        const cands = rest[k].filter(x => !ocupados.has(x.professorId));
        if (!cands.length) { falhou = true; break; }
        const noDia = x => novas.filter(a => a.turmaId === t.id && a.dia === d && a.disciplinaId === x.disciplinaId).length;
        cands.sort((x, y) => (noDia(x) >= 2) - (noDia(y) >= 2) || pend(y.professorId) - pend(x.professorId) || rand() - .5);
        const it = cands[0]; rest[k].splice(rest[k].indexOf(it), 1);
        novas.push(Object.assign({ id: `au-${t.id}-${d}-${s}`, dia: d, slot: s }, it));
      }
    }
    if (!falhou && rest.every(l => !l.length)) melhor = novas;
  }
  if (!melhor) return;
  // 3º ano: deixa 5 aulas para a escola distribuir na demonstração
  const ultima = turmas[turmas.length - 1].id;
  const tirar = new Set(melhor.filter(a => a.turmaId === ultima).slice(-5).map(a => a.id));
  db.aulas = [...fixas, ...melhor.filter(a => !tirar.has(a.id))];
  // Lotação dos professores na Unidade Centro acompanha as aulas da grade nova
  db.professores.forEach(p => {
    const n = db.aulas.filter(a => a.professorId === p.id && db.turmas.find(t => t.id === a.turmaId)?.escolaId === 'e1').length;
    const l = db.lotacoes.find(x => x.professorId === p.id && x.escolaId === 'e1' && lotacaoAtiva(x));
    if (l && n > l.cargaHoraria) { const v = p.vinculos.find(x => x.id === l.vinculoId); const outras = db.lotacoes.filter(x => x.vinculoId === l.vinculoId && x.id !== l.id && lotacaoAtiva(x)).reduce((k, x) => k + x.cargaHoraria, 0); if (v && outras + n <= v.cargaHoraria) l.cargaHoraria = n; }
  });
}
