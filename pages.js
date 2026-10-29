/* Portal Entrelaço — telas de gestão, professor e aluno */
'use strict';

// ---------- Opções compartilhadas ----------
const SERIES = ['6º ano — Fundamental', '7º ano — Fundamental', '8º ano — Fundamental', '9º ano — Fundamental', '1º ano — Ensino médio', '2º ano — Ensino médio', '3º ano — Ensino médio'];
const ACESSOS = ['Nenhuma', 'Baixa visão', 'Deficiência visual', 'Daltonismo', 'Surdez ou deficiência auditiva', 'Deficiência física', 'TEA', 'TDAH', 'Dislexia', 'Outra'];
const PUBLICOS = () => [['Todos', 'Toda a comunidade'], ['Alunos', 'Alunos'], ['Professores', 'Professores'], ['Responsáveis', 'Responsáveis'], ...DADOS.turmas.map(t => ['turma:' + t.id, 'Turma ' + turmaLong(t.id)])];
const publicoLabel = p => p && p.startsWith('turma:') ? 'Turma ' + turmaNome(p.slice(6)) : p === 'Todos' ? 'Toda a comunidade' : p;
const turmasEsc = () => DADOS.turmas.filter(t => naEscola(t.escolaId));
const alunosEsc = () => DADOS.alunos.filter(a => naEscola(byId('turmas', a.turmaId)?.escolaId));
const optTurmas = () => turmasEsc().map(t => [t.id, turmaLong(t.id)]);
const optAlunos = () => alunosEsc().map(a => [a.id, `${a.nome} — ${turmaNome(a.turmaId)}`]).sort((a, b) => a[1].localeCompare(b[1]));
const DIAS = [[1, 'Segunda-feira'], [2, 'Terça-feira'], [3, 'Quarta-feira'], [4, 'Quinta-feira'], [5, 'Sexta-feira']];
const caption2 = t => `<div class="caption">${t}</div>`;

// ---------- Contexto do professor ----------
const myAulas = () => DADOS.aulas.filter(a => a.professorId === SESSION.userId);
const myTurmas = () => uniq(myAulas().map(a => a.turmaId)).sort((a, b) => turmaNome(a).localeCompare(turmaNome(b)));
const myPairs = () => uniq(myAulas().map(a => a.turmaId + '|' + a.disciplinaId)).map(k => { const [t, d] = k.split('|'); return { k, t, d, l: `${turmaLong(t)} — ${discNome(d)}` }; }).sort((a, b) => a.l.localeCompare(b.l));
const myAlunos = () => DADOS.alunos.filter(a => myTurmas().includes(a.turmaId));
function curPair(key) { const ps = myPairs(); if (!ps.find(p => p.k === UI.sel[key])) UI.sel[key] = ps[0]?.k; return ps.find(p => p.k === UI.sel[key]); }

// ---------- Entidades (CRUD) ----------
Object.assign(ENT, {
  escolas: {
    coll: 'escolas', title: 'Escolas', singular: 'escola', plural: 'escolas', fem: true, newLabel: 'Cadastrar escola',
    desc: 'Unidades da rede. Cada escola reúne turmas, professores e alunos.',
    fields: [{ k: 'nome', l: 'Nome da escola', req: 1, wide: 1 }, { k: 'inep', l: 'Código INEP', help: '8 dígitos, informado pelo Censo Escolar.' }, { k: 'cidade', l: 'Cidade / UF', req: 1 }, { k: 'endereco', l: 'Endereço', wide: 1 }, { k: 'telefone', l: 'Telefone', t: 'tel' }, { k: 'diretor', l: 'Diretor(a)' }],
    cols: [['Escola', r => `${esc(r.nome)}${caption2(esc(r.endereco || ''))}`], ['Cidade', r => esc(r.cidade)], ['Diretor(a)', r => esc(r.diretor)], ['Turmas', r => DADOS.turmas.filter(t => t.escolaId === r.id).length, 'n'], ['Alunos', r => DADOS.alunos.filter(a => byId('turmas', a.turmaId)?.escolaId === r.id).length, 'n']],
    check: (v, id) => DADOS.escolas.some(e => e.id !== id && norm(e.nome) === norm(v.nome)) ? 'Já existe uma escola com esse nome.' : ''
  },
  turmas: {
    coll: 'turmas', title: 'Turmas', singular: 'turma', plural: 'turmas', fem: true, newLabel: 'Criar turma',
    desc: 'Turmas do ano letivo, com série, turno e sala. A grade horária é montada por turma.',
    fields: () => [{ k: 'nome', l: 'Nome da turma', req: 1, help: 'Ex.: 2º ano A' }, { k: 'escolaId', l: 'Escola', t: 'select', o: optsOf('escolas'), req: 1 }, { k: 'serie', l: 'Série', t: 'select', o: optsFix(SERIES), req: 1 }, { k: 'turno', l: 'Turno', t: 'select', o: optsFix(['Manhã', 'Tarde', 'Noite']), req: 1 }, { k: 'ano', l: 'Ano letivo', t: 'number', req: 1 }, { k: 'sala', l: 'Sala' }],
    defaults: () => ({ ano: DADOS.config.anoLetivo, turno: 'Manhã' }),
    rows: () => turmasEsc(),
    filter: { k: 'escolaId', l: 'Escola', o: optsOf('escolas'), scoped: true },
    cols: [['Turma', r => `${esc(r.nome)}${caption2(esc(r.serie))}`], ['Escola', r => esc(byId('escolas', r.escolaId)?.nome.split('— ').pop() || '—')], ['Turno', r => esc(r.turno)], ['Sala', r => esc(r.sala)], ['Alunos', r => alunosDaTurma(r.id).length, 'n'], ['Média', r => num(avg(alunosDaTurma(r.id).map(a => mediaGeral(a.id)))), 'n']],
    onDelete: r => { DADOS.aulas = DADOS.aulas.filter(a => a.turmaId !== r.id); }
  },
  alunos: {
    coll: 'alunos', title: 'Alunos e matrículas', singular: 'aluno', plural: 'alunos', newLabel: 'Matricular aluno',
    desc: 'Matrícula, transferência de turma e dados do responsável. Informe necessidades de acessibilidade para que os professores adaptem o material.',
    fields: () => [{ k: 'nome', l: 'Nome completo', req: 1, wide: 1 }, { k: 'matricula', l: 'Nº de matrícula', req: 1 }, { k: 'nascimento', l: 'Data de nascimento', t: 'date' }, { k: 'turmaId', l: 'Turma', t: 'select', o: optTurmas, req: 1 }, { k: 'email', l: 'E-mail do aluno', t: 'email' }, { k: 'responsavel', l: 'Responsável', req: 1 }, { k: 'telResp', l: 'Telefone do responsável', t: 'tel' }, { k: 'acess', l: 'Necessidade de acessibilidade', t: 'select', o: optsFix(ACESSOS), help: 'Aparece para os professores da turma.' }],
    defaults: () => ({ matricula: '2026' + String(DADOS.alunos.length + 1).padStart(4, '0'), acess: 'Nenhuma' }),
    rows: () => alunosEsc(),
    filter: { k: 'turmaId', l: 'Turma', o: optTurmas },
    sort: (a, b) => a.nome.localeCompare(b.nome),
    cols: [['Aluno', r => `${esc(r.nome)}${caption2('Matrícula ' + esc(r.matricula))}`], ['Turma', r => esc(turmaNome(r.turmaId))], ['Responsável', r => `${esc(r.responsavel)}${caption2(esc(r.telResp || ''))}`], ['Acessibilidade', r => r.acess && r.acess !== 'Nenhuma' ? st(r.acess, 'info', 'access') : '<span class="muted">—</span>'], ['Média', r => num(mediaGeral(r.id)), 'n'], ['Frequência', r => freqHTML(freqPct(r.id)), 'n']],
    rowActs: r => `<button class="btn ghost sm" data-act="ver-boletim" data-id="${r.id}" aria-label="Ver boletim de ${esc(r.nome)}">Boletim</button>`,
    check: (v, id) => DADOS.alunos.some(a => a.id !== id && a.matricula === v.matricula) ? 'Esse número de matrícula já está em uso.' : ''
  },
  professores: {
    coll: 'professores', title: 'Professores', singular: 'professor', plural: 'professores', newLabel: 'Cadastrar professor',
    desc: 'Corpo docente, disciplinas que cada professor leciona e carga semanal.',
    fields: () => [{ k: 'nome', l: 'Nome completo', req: 1, wide: 1 }, { k: 'email', l: 'E-mail institucional', t: 'email', req: 1 }, { k: 'telefone', l: 'Telefone', t: 'tel' }, { k: 'escolaId', l: 'Unidade de lotação', t: 'select', o: optsOf('escolas'), req: 1 }, { k: 'formacao', l: 'Formação', wide: 1 }, { k: 'disciplinas', l: 'Disciplinas que leciona', t: 'checks', o: optsOf('disciplinas') }],
    defaults: () => ({ disciplinas: [], escolaId: escSessao() || undefined }),
    rows: () => DADOS.professores.filter(p => naEscola(p.escolaId) || DADOS.aulas.some(a => a.professorId === p.id && naEscola(byId('turmas', a.turmaId)?.escolaId))),
    cols: [['Professor', r => `${esc(r.nome)}${caption2(esc(r.email))}`], ['Disciplinas', r => esc((r.disciplinas || []).map(discNome).join(', ') || '—')], ['Unidade', r => esc(byId('escolas', r.escolaId)?.nome.split('— ').pop() || '—')], ['Turmas', r => uniq(DADOS.aulas.filter(a => a.professorId === r.id).map(a => a.turmaId)).length, 'n'], ['Aulas/semana', r => DADOS.aulas.filter(a => a.professorId === r.id).length, 'n']]
  },
  disciplinas: {
    coll: 'disciplinas', title: 'Disciplinas', singular: 'disciplina', plural: 'disciplinas', fem: true, newLabel: 'Criar disciplina',
    desc: 'Componentes curriculares por área do conhecimento (BNCC).',
    fields: [{ k: 'nome', l: 'Nome', req: 1 }, { k: 'area', l: 'Área do conhecimento', t: 'select', o: optsFix(['Linguagens', 'Matemática', 'Ciências da Natureza', 'Ciências Humanas', 'Formação técnica', 'Itinerário formativo']), req: 1 }, { k: 'ch', l: 'Carga horária anual (h)', t: 'number' }],
    cols: [['Disciplina', r => esc(r.nome)], ['Área', r => esc(r.area)], ['Carga anual', r => (r.ch || '—') + ' h', 'n'], ['Professores', r => esc(DADOS.professores.filter(p => (p.disciplinas || []).includes(r.id)).map(p => p.nome).join(', ') || '—')]]
  },
  aulas: {
    coll: 'aulas', title: 'Grade horária', singular: 'aula', plural: 'aulas', fem: true, newLabel: 'Adicionar aula',
    fields: () => [{ k: 'turmaId', l: 'Turma', t: 'select', o: optTurmas, req: 1 }, { k: 'disciplinaId', l: 'Disciplina', t: 'select', o: optsOf('disciplinas'), req: 1 }, { k: 'professorId', l: 'Professor', t: 'select', o: optsOf('professores'), req: 1 }, { k: 'dia', l: 'Dia da semana', t: 'select', o: DIAS, req: 1, num: 1 }, { k: 'slot', l: 'Horário', t: 'select', o: [0, 1, 2, 3, 4].map(i => [i, `${i + 1}ª aula (${slotRange(byId('turmas', UI.sel.hTurma)?.turno || 'Manhã', i)})`]), req: 1, num: 1 }],
    name: r => `${discNome(r.disciplinaId)}, ${DAYS[r.dia]} ${slotRange(byId('turmas', r.turmaId)?.turno, r.slot)}`,
    check: (v, id) => {
      if (DADOS.aulas.some(a => a.id !== id && a.turmaId === v.turmaId && a.dia === v.dia && a.slot === v.slot)) return 'A turma já tem aula nesse horário. Escolha outro horário ou edite a aula existente.';
      const t = byId('turmas', v.turmaId);
      const c = DADOS.aulas.find(a => a.id !== id && a.professorId === v.professorId && a.dia === v.dia && a.slot === v.slot && byId('turmas', a.turmaId)?.turno === t?.turno);
      return c ? `${profNome(v.professorId)} já dá aula na turma ${turmaNome(c.turmaId)} nesse horário.` : '';
    },
    cols: []
  },
  eventos: {
    coll: 'eventos', title: 'Calendário escolar', singular: 'evento', plural: 'eventos', newLabel: 'Adicionar evento',
    desc: 'Feriados, avaliações, reuniões e prazos. Aparece para alunos e professores.',
    fields: [{ k: 'titulo', l: 'Título', req: 1, wide: 1 }, { k: 'data', l: 'Data', t: 'date', req: 1 }, { k: 'tipo', l: 'Tipo', t: 'select', o: optsFix(['Avaliação', 'Reunião', 'Evento', 'Feriado', 'Recesso', 'Prazo']), req: 1 }, { k: 'escopo', l: 'Para quem', t: 'select', outro: 1, o: optsFix(['Todas as turmas', 'Ensino fundamental', 'Ensino médio', '1º ano', '2º ano', '3º ano', 'Professores', 'Responsáveis', 'Sem aulas']) }],
    sort: (a, b) => a.data.localeCompare(b.data),
    cols: [['Data', r => `<span class="num">${fmtD(r.data)}</span>${caption2(DAYS[dOf(r.data).getDay()])}`], ['Evento', r => esc(r.titulo)], ['Tipo', r => esc(r.tipo)], ['Para quem', r => esc(r.escopo || '—')], ['Quando', r => { const n = daysUntil(r.data); return n < 0 ? '<span class="muted">Já passou</span>' : n === 0 ? st('Hoje', 'info') : `Em ${n} dia${n > 1 ? 's' : ''}`; }]],
    name: r => r.titulo
  },
  comunicados: {
    coll: 'comunicados', title: 'Comunicados', singular: 'comunicado', plural: 'comunicados', newLabel: 'Publicar comunicado',
    desc: 'Avisos para a comunidade, para um grupo ou para uma turma específica.',
    fields: () => [{ k: 'titulo', l: 'Título', req: 1, wide: 1 }, { k: 'publico', l: 'Público', t: 'select', o: PUBLICOS, req: 1 }, { k: 'autor', l: 'Assinado por', req: 1, t: 'select', outro: 1, o: optsFix(['Secretaria escolar', 'Coordenação pedagógica', 'Direção da escola', 'Secretaria de Educação', 'Diretoria Regional']) }, { k: 'texto', l: 'Mensagem', t: 'textarea', req: 1 }],
    defaults: () => ({ autor: 'Secretaria escolar', data: TODAY_ISO, publico: 'Todos' }),
    sort: (a, b) => b.data.localeCompare(a.data),
    cols: [['Comunicado', r => `${esc(r.titulo)}${caption2(esc(r.texto.slice(0, 90)) + (r.texto.length > 90 ? '…' : ''))}`], ['Público', r => esc(publicoLabel(r.publico))], ['Autor', r => esc(r.autor)], ['Data', r => `<span class="num">${fmtD(r.data)}</span>`]],
    name: r => r.titulo
  },
  comunicadosProf: {
    coll: 'comunicados', title: 'Comunicados', singular: 'comunicado', newLabel: 'Novo comunicado',
    fields: () => [{ k: 'titulo', l: 'Título', req: 1, wide: 1 }, { k: 'publico', l: 'Turma', t: 'select', o: () => myTurmas().map(t => ['turma:' + t, 'Turma ' + turmaLong(t)]), req: 1 }, { k: 'texto', l: 'Mensagem', t: 'textarea', req: 1 }],
    defaults: () => ({ autor: me().nome, autorId: SESSION.userId, data: TODAY_ISO }),
    cols: [], name: r => r.titulo
  },
  solicitacao: {
    coll: 'solicitacoes', title: 'Solicitações', singular: 'solicitação', fem: true, newLabel: 'Nova solicitação',
    fields: [{ k: 'tipo', l: 'O que você precisa?', t: 'select', o: optsFix(['Declaração de matrícula', 'Histórico escolar', 'Atestado médico', 'Revisão de nota', 'Segunda chamada de prova', 'Transferência', 'Carteirinha estudantil', 'Outro']), req: 1 }, { k: 'descricao', l: 'Descreva o pedido', t: 'textarea', req: 1, help: 'Inclua datas, disciplina ou para que o documento será usado.' }],
    defaults: () => ({ alunoId: SESSION.userId, status: 'Em análise', data: TODAY_ISO, resposta: '' }),
    cols: [], name: r => r.tipo
  },
  ocorrencias: {
    coll: 'ocorrencias', title: 'Ocorrências', singular: 'ocorrência', plural: 'ocorrências', fem: true, newLabel: 'Registrar ocorrência',
    desc: 'Registros de comportamento, atrasos e elogios feitos pelos professores e pela coordenação.',
    fields: () => [{ k: 'alunoId', l: 'Aluno', t: 'select', o: optAlunos, req: 1 }, { k: 'professorId', l: 'Registrado por', t: 'select', o: optsOf('professores') }, { k: 'tipo', l: 'Tipo', t: 'select', o: optsFix(['Elogio', 'Atraso', 'Comportamento', 'Material', 'Saúde', 'Outro']), req: 1 }, { k: 'data', l: 'Data', t: 'date', req: 1 }, { k: 'descricao', l: 'Descrição', t: 'textarea', req: 1 }],
    defaults: () => ({ data: TODAY_ISO }),
    rows: () => DADOS.ocorrencias.filter(o => alunosEsc().some(a => a.id === o.alunoId)),
    sort: (a, b) => b.data.localeCompare(a.data),
    cols: [['Data', r => `<span class="num">${fmtD(r.data)}</span>`], ['Aluno', r => `${esc(alunoNome(r.alunoId))}${caption2(esc(turmaNome(byId('alunos', r.alunoId)?.turmaId)))}`], ['Tipo', r => r.tipo === 'Elogio' ? st('Elogio', 'ok') : esc(r.tipo)], ['Descrição', r => esc(r.descricao)], ['Registrado por', r => esc(r.professorId ? profNome(r.professorId) : 'Coordenação')]],
    name: r => `${r.tipo} de ${alunoNome(r.alunoId)}`
  },
  atividades: {
    coll: 'atividades', title: 'Atividades', singular: 'atividade', plural: 'atividades', fem: true, newLabel: 'Criar atividade',
    desc: 'Tarefas, trabalhos e listas. Os alunos entregam pelo portal e você corrige aqui.',
    fields: () => [{ k: 'titulo', l: 'Título', req: 1, wide: 1 }, { k: 'pair', l: 'Turma e disciplina', t: 'select', o: () => myPairs().map(p => [p.k, p.l]), req: 1, wide: 1 }, { k: 'prazo', l: 'Prazo de entrega', t: 'date', req: 1 }, { k: 'valor', l: 'Vale (pontos)', t: 'number', attrs: 'step="0.5" min="0" max="10"' }, { k: 'descricao', l: 'Instruções', t: 'textarea', req: 1 }],
    defaults: () => ({ professorId: SESSION.userId, prazo: addDays(7), valor: 1, pair: UI.sel.nt }),
    rows: () => DADOS.atividades.filter(a => a.professorId === SESSION.userId).map(a => Object.assign(a, { pair: a.turmaId + '|' + a.disciplinaId })),
    after: r => { const [t, d] = (r.pair || '').split('|'); r.turmaId = t; r.disciplinaId = d; },
    sort: (a, b) => b.prazo.localeCompare(a.prazo),
    cols: [['Atividade', r => `${esc(r.titulo)}${caption2('Vale ' + num(r.valor) + ' ponto' + (r.valor === 1 ? '' : 's'))}`], ['Turma', r => esc(turmaNome(r.turmaId))], ['Disciplina', r => esc(discNome(r.disciplinaId))], ['Prazo', r => `<span class="num">${fmtD(r.prazo)}</span>${caption2(daysUntil(r.prazo) < 0 ? 'Encerrada' : daysUntil(r.prazo) === 0 ? 'Vence hoje' : 'Em ' + daysUntil(r.prazo) + ' dias')}`], ['Entregas', r => { const e = DADOS.entregas.filter(x => x.atividadeId === r.id); const pend = e.filter(x => x.nota == null).length; return `${e.length} de ${alunosDaTurma(r.turmaId).length}${pend ? caption2(`<span class="st warn">${pend} para corrigir</span>`) : ''}`; }]],
    rowActs: r => `<button class="btn outline sm" data-act="entregas" data-id="${r.id}" aria-label="Corrigir entregas de ${esc(r.titulo)}">Entregas</button>`,
    onDelete: r => { DADOS.entregas = DADOS.entregas.filter(e => e.atividadeId !== r.id); },
    name: r => r.titulo
  },
  ocorrenciasProf: {
    coll: 'ocorrencias', title: 'Ocorrências', singular: 'ocorrência', plural: 'ocorrências', fem: true, newLabel: 'Registrar ocorrência',
    desc: 'Registre elogios, atrasos e situações de comportamento. A coordenação acompanha tudo.',
    fields: () => [{ k: 'alunoId', l: 'Aluno', t: 'select', o: () => myAlunos().map(a => [a.id, `${a.nome} — ${turmaNome(a.turmaId)}`]).sort((a, b) => a[1].localeCompare(b[1])), req: 1 }, { k: 'tipo', l: 'Tipo', t: 'select', o: optsFix(['Elogio', 'Atraso', 'Comportamento', 'Material', 'Saúde', 'Outro']), req: 1 }, { k: 'data', l: 'Data', t: 'date', req: 1 }, { k: 'descricao', l: 'Descrição', t: 'textarea', req: 1 }],
    defaults: () => ({ data: TODAY_ISO, professorId: SESSION.userId }),
    rows: () => DADOS.ocorrencias.filter(o => o.professorId === SESSION.userId),
    sort: (a, b) => b.data.localeCompare(a.data),
    cols: [], name: r => `${r.tipo} de ${alunoNome(r.alunoId)}`
  }
});
ENT.ocorrenciasProf.cols = ENT.ocorrencias.cols.slice(0, 4);
// ---------- Componentes ----------
function selectCtl(id, label, opts, val, change) {
  return `<div class="field"><label for="${id}">${label}</label><select id="${id}" class="input" data-change="${change}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
}
function statCard(tone, k, v, s, route) {
  const inner = `<span class="k">${k}</span><span class="v">${v}</span><span class="s">${s}</span>`;
  return route ? `<button class="stat ${tone}" data-act="go" data-route="${route}">${inner}</button>` : `<div class="stat ${tone}">${inner}</div>`;
}
function bars(items, max, fmt, low) {
  if (!items.length) return '<p class="empty">Sem dados ainda.</p>';
  return `<ul class="bars list" style="gap:.875rem">${items.map(([l, v]) => `<li class="bar-row" style="border:0;padding:0"><span>${esc(l)}</span><span class="bar-track" aria-hidden="true"><span class="bar-fill ${low != null && v != null && v < low ? 'low' : ''}" style="width:${v == null ? 0 : Math.max(2, Math.min(100, v / max * 100))}%"></span></span><span class="n">${fmt(v)}</span></li>`).join('')}</ul>`;
}
function gradeTable(aulas, turno, cellFn, emptyFn, cap) {
  const table = `<div class="tbl-wrap grade-wrap"><table class="tbl grade"><caption>${esc(cap)}</caption><thead><tr><th scope="col">Horário</th>${DIAS.map(([d, l]) => `<th scope="col">${l}${d === TODAY.getDay() ? ' <span class="sr-only">(hoje)</span>' : ''}</th>`).join('')}</tr></thead><tbody>${[0, 1, 2, 3, 4].map(s => `<tr><th scope="row" class="num">${slotRange(turno, s)}</th>${DIAS.map(([d]) => { const c = aulas.filter(a => a.dia === d && a.slot === s); return `<td class="${d === TODAY.getDay() ? 'today' : ''}">${c.length ? c.map(cellFn).join('') : (emptyFn ? emptyFn(d, s) : '<span class="muted">—</span>')}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
  const list = `<div class="grade-list">${DIAS.map(([d, l]) => { const c = aulas.filter(a => a.dia === d).sort((x, y) => x.slot - y.slot); return `<section class="card day-block" aria-label="${l}"><h3>${l}${d === TODAY.getDay() ? ', hoje' : ''}</h3>${c.length ? `<ul class="list">${c.map(a => `<li><span class="time">${slotRange(turno, a.slot)}</span><span class="grow">${cellFn(a)}</span></li>`).join('')}</ul>` : '<p class="muted">Sem aulas</p>'}${emptyFn ? `<div>${emptyFn(d, [0, 1, 2, 3, 4].find(x => !c.some(a => a.slot === x)) ?? 0)}</div>` : ''}</section>`; }).join('')}</div>`;
  return table + list;
}
function todayList(aulas, sub, action, span = '') {
  let dia = TODAY.getDay(); let title = 'Aulas de hoje';
  if (dia === 0 || dia === 6) { dia = 1; title = 'Aulas de segunda-feira'; }
  const list = aulas.filter(a => a.dia === dia).sort((a, b) => a.slot - b.slot);
  return `<section class="card ${span}" aria-labelledby="hoje-h"><div class="card-h"><h2 id="hoje-h">${title}</h2><span class="caption">${esc(fmtLong(TODAY_ISO))}</span></div>${list.length ? `<ul class="list">${list.map(a => `<li><span class="time">${slotRange(byId('turmas', a.turmaId)?.turno, a.slot)}</span><span class="grow"><span class="t">${esc(discNome(a.disciplinaId))}</span><br><span class="m">${sub(a)}</span></span>${action ? action(a) : ''}</li>`).join('')}</ul>` : '<p class="empty">Nenhuma aula neste dia.</p>'}</section>`;
}
const EV_TYPES = [['Avaliação', 'avaliacao'], ['Reunião', 'reuniao'], ['Evento', 'evento'], ['Feriado', 'feriado'], ['Recesso', 'recesso'], ['Prazo', 'prazo']];
const evColor = t => `var(--ev-${(EV_TYPES.find(x => x[0] === t) || [0, 'evento'])[1]})`;
const sw = t => `<span class="sw" style="background:${evColor(t)}" aria-hidden="true"></span>`;
function calendarView(canEdit) {
  const ym = UI.sel.cal || TODAY_ISO.slice(0, 7); const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1, 12); const last = new Date(y, m, 0, 12);
  const cur = new Date(first); cur.setDate(1 - first.getDay());
  const monthLbl = first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const evs = DADOS.eventos.slice().sort((a, b) => a.data.localeCompare(b.data));
  const weeks = [];
  while (cur <= last || cur.getDay() !== 0) {
    const w = [];
    for (let k = 0; k < 7; k++) { w.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    weeks.push(w);
  }
  const cell = d => {
    const iso = isoOf(d); const out = d.getMonth() !== m - 1; const list = evs.filter(e => e.data === iso);
    const cls = [out ? 'out' : '', d.getDay() === 0 || d.getDay() === 6 ? 'we' : '', iso === TODAY_ISO ? 'today' : ''].join(' ');
    const evHTML = list.map(e => canEdit
      ? `<li><button class="ev" data-act="edit" data-ent="eventos" data-id="${e.id}" title="${esc(e.titulo)}" aria-label="${esc(e.titulo)}, ${esc(e.tipo)}. Editar">${sw(e.tipo)}<span class="tt">${esc(e.titulo)}</span></button></li>`
      : `<li class="ev" title="${esc(e.titulo)}">${sw(e.tipo)}<span class="tt">${esc(e.titulo)}</span><span class="sr-only">, ${esc(e.tipo)}</span></li>`).join('');
    return `<td class="${cls}"><div class="dnum"><span>${d.getDate()}</span><span class="sr-only">${esc(fmtLong(iso))}</span>${canEdit && !out ? `<button class="add-day" data-act="new" data-ent="eventos" data-def-data="${iso}" aria-label="Adicionar evento em ${esc(fmtLong(iso))}">${icon('plus')}</button>` : ''}</div>${list.length ? `<ul class="evs">${evHTML}</ul>` : ''}</td>`;
  };
  const doMes = evs.filter(e => e.data.startsWith(ym));
  return `<section class="card" aria-labelledby="cal-h">
    <div class="cal-head"><h2 id="cal-h" aria-live="polite">${esc(monthLbl)}</h2><div class="cal-nav"><button class="icon-btn" data-act="cal-nav" data-d="-1" aria-label="Mês anterior"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><button class="btn ghost sm" data-act="cal-nav" data-d="0">Hoje</button><button class="icon-btn" data-act="cal-nav" data-d="1" aria-label="Próximo mês"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></div></div>
    <ul class="legend" aria-label="Legenda">${EV_TYPES.map(([t]) => `<li>${sw(t)}${t}</li>`).join('')}</ul>
    <div class="cal-wrap"><table class="cal"><caption class="sr-only">Calendário de ${esc(monthLbl)}</caption><thead><tr>${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => `<th scope="col"><abbr title="${DAYS[i]}" style="text-decoration:none">${d}</abbr></th>`).join('')}</tr></thead><tbody>${weeks.map(w => `<tr>${w.map(cell).join('')}</tr>`).join('')}</tbody></table></div>
  </section>
  <section class="card" aria-labelledby="ag-h"><h2 id="ag-h">Eventos de ${esc(first.toLocaleDateString('pt-BR', { month: 'long' }))}</h2>${doMes.length ? `<ul class="list">${doMes.map(e => evItem(e, canEdit)).join('')}</ul>` : '<p class="empty">Nenhum evento neste mês.</p>'}</section>`;
}
const evItem = (e, canEdit) => `<li><span class="date-chip" aria-hidden="true"><b>${dOf(e.data).getDate()}</b><span>${DAYS[dOf(e.data).getDay()].slice(0, 3)}</span></span><span class="grow"><span class="t">${esc(e.titulo)}</span><br><span class="m"><span class="sr-only">${esc(fmtLong(e.data))}. </span>${sw(e.tipo)} ${esc(e.tipo)}, ${esc(e.escopo || '')}</span></span>${canEdit ? `<span class="acts" style="display:flex"><button class="icon-btn" data-act="edit" data-ent="eventos" data-id="${e.id}" aria-label="Editar ${esc(e.titulo)}">${icon('pencil')}</button><button class="icon-btn" data-act="del" data-ent="eventos" data-id="${e.id}" aria-label="Excluir ${esc(e.titulo)}">${icon('trash')}</button></span>` : daysUntil(e.data) >= 0 && daysUntil(e.data) <= 2 ? `<span class="st info">${daysUntil(e.data) === 0 ? 'Hoje' : daysUntil(e.data) === 1 ? 'Amanhã' : 'Em 2 dias'}</span>` : ''}</li>`;
function visibleCom() {
  const r = SESSION.role;
  if (r === 'gestao') return DADOS.comunicados;
  if (r === 'responsavel') { const ts = (me().filhos || []).map(id => byId('alunos', id)?.turmaId).filter(Boolean); return DADOS.comunicados.filter(c => ['Todos', 'Responsáveis'].includes(c.publico) || ts.some(t => c.publico === 'turma:' + t)); }
  if (r === 'professor') return DADOS.comunicados.filter(c => ['Todos', 'Professores'].includes(c.publico) || c.autorId === SESSION.userId || (c.publico.startsWith('turma:') && myTurmas().includes(c.publico.slice(6))));
  const t = me().turmaId;
  return DADOS.comunicados.filter(c => ['Todos', 'Alunos', 'Responsáveis'].includes(c.publico) || c.publico === 'turma:' + t);
}
function feed(items, editEnt) {
  if (!items.length) return '<p class="empty">Nenhum comunicado.</p>';
  return `<div class="feed">${items.sort((a, b) => b.data.localeCompare(a.data)).map(c => `<article class="post" aria-labelledby="post-${c.id}-t" id="post-${c.id}"><p class="meta">${esc(c.autor)}, ${fmtD(c.data)}, Para: ${esc(publicoLabel(c.publico))}</p><h2 id="post-${c.id}-t" style="font-size:1.25rem">${esc(c.titulo)}</h2><p class="body">${esc(c.texto)}</p><div class="post-foot"><button class="btn ghost sm" data-act="speak" data-target="#post-${c.id}" aria-label="Ouvir comunicado ${esc(c.titulo)}">${icon('volume')}Ouvir</button>${editEnt && c.autorId === SESSION.userId ? `<button class="btn ghost sm" data-act="edit" data-ent="${editEnt}" data-id="${c.id}" aria-label="Editar comunicado ${esc(c.titulo)}">${icon('pencil')}Editar</button><button class="btn ghost sm" data-act="del" data-ent="${editEnt}" data-id="${c.id}" aria-label="Excluir comunicado ${esc(c.titulo)}">${icon('trash')}Excluir</button>` : ''}</div></article>`).join('')}</div>`;
}
function boletimTable(aid, cap) {
  const a = byId('alunos', aid); const ds = discsDaTurma(a.turmaId); const b = DADOS.config.bimestreAtual;
  return `<div class="tbl-wrap"><table class="tbl stack"><caption>${esc(cap || 'Boletim')}</caption><thead><tr><th scope="col">Disciplina</th>${[1, 2, 3, 4].map(i => `<th scope="col" class="n">${i}º bim.</th>`).join('')}<th scope="col" class="n">Média</th><th scope="col" class="n">Faltas</th><th scope="col">Situação</th></tr></thead><tbody>${ds.map(d => { const m = mediaDisc(aid, d); const f = freqInfo(aid, d); return `<tr><th scope="row">${esc(discNome(d))}${caption2(esc(profNome(DADOS.aulas.find(x => x.turmaId === a.turmaId && x.disciplinaId === d)?.professorId)))}</th>${[1, 2, 3, 4].map(i => { const v = nota(aid, d, i); return `<td class="n" data-label="${i}º bimestre">${v == null ? `<span class="muted" aria-label="${i > b ? 'ainda não começou' : 'sem nota lançada'}">—</span>` : num(v)}</td>`; }).join('')}<td class="n" data-label="Média"><b>${num(m)}</b></td><td class="n num" data-label="Faltas">${f.faltas}</td><td data-label="Situação">${sitHTML(m)}</td></tr>`; }).join('')}</tbody></table></div>`;
}
function boletimFala(aid) {
  const a = byId('alunos', aid);
  const parts = discsDaTurma(a.turmaId).map(d => { const m = mediaDisc(aid, d); const f = freqInfo(aid, d).faltas; return `${discNome(d)}: média ${num(m)}, ${f} falta${f === 1 ? '' : 's'}, ${situacao(m).l}.`; });
  return `Boletim de ${a.nome}. Média geral ${num(mediaGeral(aid))}. ${parts.join(' ')}`;
}

// ---------- O fio do dia: aulas como um fio contínuo que atravessa as horas ----------
const toMin = h => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
function fioWave(n) {
  const xs = [0, ...Array.from({ length: n }, (_, i) => (i + .5) / n * 1000), 1000];
  const path = phase => xs.slice(1).reduce((d, x, i) => { const x0 = xs[i]; return d + ` Q ${((x0 + x) / 2).toFixed(1)},${(i + phase) % 2 ? 4 : 36} ${x.toFixed(1)},20`; }, 'M 0,20');
  return `<svg class="fio-wave" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="w2" d="${path(1)}" pathLength="1" vector-effect="non-scaling-stroke"/><path class="w1" d="${path(0)}" pathLength="1" vector-effect="non-scaling-stroke"/></svg>`;
}
function fioDia(aulas, role) {
  const nowD = new Date(); let dia = TODAY.getDay(); let nowMin = nowD.getHours() * 60 + nowD.getMinutes(); let quando = fmtLong(TODAY_ISO);
  let titulo = role === 'professor' ? 'Suas aulas hoje' : 'Seu dia';
  if (dia === 0 || dia === 6) { dia = 1; nowMin = -1; quando = 'segunda-feira'; titulo = role === 'professor' ? 'Suas aulas na segunda' : 'Sua segunda-feira'; }
  const list = aulas.filter(a => a.dia === dia).map(a => { const t = byId('turmas', a.turmaId); const st0 = toMin((SLOTS[t?.turno] || SLOTS['Manhã'])[a.slot]); return { a, t, ini: st0, fim: st0 + (t?.turno === 'Noite' ? 45 : 50) }; }).sort((x, y) => x.ini - y.ini);
  if (!list.length) return `<section class="fio" aria-labelledby="fio-h"><div class="fio-head"><h2 id="fio-h">${titulo}</h2><p class="muted">${esc(quando)}</p></div><p class="muted">Nenhuma aula neste dia.</p></section>`;
  const state = x => nowMin >= x.fim ? 'past' : nowMin >= x.ini ? 'now' : 'next';
  const hhmm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const item = x => {
    const s = state(x); const d = x.a.disciplinaId;
    let extra = '';
    if (role === 'professor') {
      const feita = DADOS.chamadas.some(c => c.turmaId === x.a.turmaId && c.disciplinaId === d && c.data === TODAY_ISO);
      extra = feita ? `<span class="st ok">${icon('okc')}Chamada feita</span>` : s === 'next' && nowMin >= 0 ? '' : `<button class="btn outline sm" data-act="chamada-de" data-pair="${x.a.turmaId}|${d}" aria-label="Fazer chamada de ${esc(discNome(d))}, turma ${esc(turmaNome(x.a.turmaId))}">Fazer chamada</button>`;
    }
    return `<li class="${s}"><span class="knot" aria-hidden="true"></span><span class="fio-time">${hhmm(x.ini)} às ${hhmm(x.fim)}</span>${s === 'now' ? '<span class="fio-now">Agora</span>' : ''}<b>${esc(discNome(d))}</b><span class="fio-sub">${role === 'professor' ? esc(x.t?.nome || '') + ', ' + esc(x.t?.sala || '') : esc(profNome(x.a.professorId))}</span>${extra}</li>`;
  };
  const done = list.filter(x => state(x) === 'past').length;
  return `<section class="fio" aria-labelledby="fio-h"><div class="fio-head"><h2 id="fio-h">${titulo}</h2><p class="muted">${esc(quando)}${nowMin >= 0 ? `, ${done} de ${list.length} aulas concluídas` : ''}</p></div>
    <div class="fio-track" tabindex="0" role="region" aria-label="${titulo}"><div class="fio-inner" style="--n:${list.length}">${fioWave(list.length)}<ol class="fio-list">${list.map(item).join('')}</ol></div></div></section>`;
}
function fioSemana() {
  const days = Array.from({ length: 7 }, (_, i) => addDays(i));
  const item = (iso, i) => {
    const evs = DADOS.eventos.filter(e => e.data === iso);
    return `<li class="${i === 0 ? 'now' : 'next'}${evs.length ? '' : ' quiet'}"><span class="knot" aria-hidden="true"></span><span class="fio-time">${i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : cap(DAYS[dOf(iso).getDay()].split('-')[0])}, ${dOf(iso).getDate()}/${pad(dOf(iso).getMonth() + 1)}</span>${evs.length ? evs.map(e => `<b>${esc(e.titulo)}</b><span class="fio-sub">${sw(e.tipo)} ${esc(e.tipo)}</span>`).join('') : '<span class="fio-sub">Sem eventos</span>'}</li>`;
  };
  return `<section class="fio" aria-labelledby="fio-h"><div class="fio-head"><h2 id="fio-h">Sua semana</h2><p class="muted">Próximos sete dias do calendário escolar</p></div>
    <div class="fio-track" tabindex="0" role="region" aria-label="Próximos sete dias"><div class="fio-inner" style="--n:7">${fioWave(7)}<ol class="fio-list">${days.map(item).join('')}</ol></div></div></section>`;
}

// ---------- Faixa horizontal do painel inicial ----------
const hrowOpen = id => `<div class="hrow" id="${id}">`;

// ---------- Gráfico de desempenho (linha: você x turma) ----------
function perfChart(aid) {
  const a = byId('alunos', aid); const ds = discsDaTurma(a.turmaId); const col = alunosDaTurma(a.turmaId);
  const mine = [1, 2, 3, 4].map(b => avg(ds.map(d => nota(aid, d, b))));
  const turma = [1, 2, 3, 4].map(b => avg(col.map(x => avg(ds.map(d => nota(x.id, d, b))))));
  const W = 620, H = 300, L = 34, Rm = 20, T = 14, B = 30, pw = W - L - Rm, ph = H - T - B;
  const x = i => L + 24 + i * ((pw - 48) / 3), y = v => T + ph - (v / 10) * ph;
  const path = arr => arr.reduce((d, v, i) => v == null ? d : d + (d ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1), '');
  const lastI = arr => { let i = arr.length - 1; while (i >= 0 && arr[i] == null) i--; return i; };
  const li = lastI(mine), lt = lastI(turma);
  if (li < 0) return '<p class="empty">Ainda não há notas lançadas.</p>';
  let ym = y(mine[li]) - 12, yt = y(turma[lt]) + 20;
  if (mine[li] < turma[lt]) { ym = y(mine[li]) + 20; yt = y(turma[lt]) - 12; }
  const mn = DADOS.config.mediaMin;
  const ser = (arr, cls, color) => `<path d="${path(arr)}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${arr.map((v, i) => v == null ? '' : `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="${color}" stroke="var(--bg-surface)" stroke-width="2"/>`).join('')}`;
  const tip = i => `<b>${i + 1}º bimestre</b>${mine[i] == null ? '<div>Sem notas ainda</div>' : `<div><span><span class="sw" style="background:var(--bg-brand)"></span> Você</span><strong>${num(mine[i])}</strong></div><div><span><span class="sw" style="background:var(--tx-ph)"></span> Turma</span><strong>${num(turma[i])}</strong></div>`}`;
  return `<div class="chart" data-chart>
    <ul class="legend" style="margin-bottom:.5rem"><li><span class="sw" style="background:var(--bg-brand)"></span>Você</li><li><span class="sw" style="background:var(--tx-ph)"></span>Média da turma</li><li><svg width="18" height="8" aria-hidden="true"><line x1="0" y1="4" x2="18" y2="4" stroke="var(--err)" stroke-width="1.5" stroke-dasharray="4 3"/></svg>Mínimo para aprovação</li></ul>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico da sua média por bimestre comparada à média da turma. ${mine.map((v, i) => v == null ? '' : `${i + 1}º bimestre: você ${num(v)}, turma ${num(turma[i])}.`).join(' ')}">
      ${[0, 2, 4, 6, 8, 10].map(v => `<line class="grid-l" x1="${L}" x2="${W - Rm}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-t" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
      ${[0, 1, 2, 3].map(i => `<text class="axis-t" x="${x(i)}" y="${H - 8}" text-anchor="middle">${i + 1}º bim.</text>`).join('')}
      <line x1="${L}" x2="${W - Rm}" y1="${y(mn)}" y2="${y(mn)}" stroke="var(--err)" stroke-width="1.5" stroke-dasharray="4 3"/>
      <line class="cross" data-cross x1="0" x2="0" y1="${T}" y2="${T + ph}" visibility="hidden"/>
      ${ser(turma, 't', 'var(--tx-ph)')}${ser(mine, 'm', 'var(--bg-brand)')}
      <text class="lab" x="${x(li)}" y="${ym}" text-anchor="middle">Você ${num(mine[li])}</text>
      <text class="lab" x="${x(lt)}" y="${yt}" text-anchor="middle" style="fill:var(--tx-2)">Turma ${num(turma[lt])}</text>
      ${[0, 1, 2, 3].map(i => `<rect class="hit" data-i="${i}" data-x="${x(i)}" data-tip="${esc(tip(i))}" x="${x(i) - (pw - 48) / 6}" y="${T}" width="${(pw - 48) / 3}" height="${ph}" aria-hidden="true"/>`).join('')}
    </svg>
    <div class="tip" hidden></div>
    <details class="data"><summary>Ver dados em tabela</summary><div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Bimestre</th><th scope="col" class="n">Você</th><th scope="col" class="n">Turma</th></tr></thead><tbody>${[0, 1, 2, 3].map(i => `<tr><th scope="row">${i + 1}º</th><td class="n">${num(mine[i])}</td><td class="n">${num(turma[i])}</td></tr>`).join('')}</tbody></table></div></details>
  </div>`;
}
document.addEventListener('mouseover', e => {
  const r = e.target.closest && e.target.closest('.chart .hit'); if (!r) return;
  const ch = r.closest('.chart'); const svg = ch.querySelector('svg'); const tip = ch.querySelector('.tip');
  const vb = svg.viewBox.baseVal; const rect = svg.getBoundingClientRect(); const cr = ch.getBoundingClientRect();
  const px = Number(r.dataset.x) / vb.width * rect.width + rect.left - cr.left;
  tip.innerHTML = r.dataset.tip; tip.hidden = false; tip.style.left = px + 'px'; tip.style.top = (rect.top - cr.top + 40) + 'px';
  const cl = svg.querySelector('[data-cross]'); cl.setAttribute('x1', r.dataset.x); cl.setAttribute('x2', r.dataset.x); cl.setAttribute('visibility', 'visible');
});
document.addEventListener('mouseout', e => {
  const ch = e.target.closest && e.target.closest('.chart'); if (!ch || (e.relatedTarget && ch.contains(e.relatedTarget) && e.relatedTarget.closest('.hit'))) return;
  const tip = ch.querySelector('.tip'); if (tip) tip.hidden = true; ch.querySelector('[data-cross]')?.setAttribute('visibility', 'hidden');
});

// ---------- Notificações ----------
const lidasKey = () => `entrelaco.lidas.${SESSION.role}.${SESSION.userId}`;
const lidas = () => LS.get(lidasKey(), []);
function notifs() {
  const out = []; const add = (id, t, m, route, ic) => out.push({ id, t, m, route, ic });
  const r = SESSION.role;
  if (r === 'gestao') DADOS.solicitacoes.filter(s => s.status === 'Em análise').forEach(s => add('sp-' + s.id, `${s.tipo} aguardando resposta`, `${alunoNome(s.alunoId)}, ${fmtD(s.data)}`, 'solicitacoes', 'file'));
  if (r === 'professor') DADOS.atividades.filter(a => a.professorId === SESSION.userId).forEach(a => { const n = DADOS.entregas.filter(e => e.atividadeId === a.id && e.nota == null).length; if (n) add(`pc-${a.id}-${n}`, `${n} entrega${n > 1 ? 's' : ''} para corrigir`, `${a.titulo}, ${turmaNome(a.turmaId)}`, 'atividades', 'clip'); });
  if (r === 'aluno') {
    DADOS.atividades.filter(a => a.turmaId === me().turmaId && daysUntil(a.prazo) >= 0 && daysUntil(a.prazo) <= 3 && !DADOS.entregas.some(e => e.atividadeId === a.id && e.alunoId === SESSION.userId)).forEach(a => add('at-' + a.id, `${a.titulo}`, `${discNome(a.disciplinaId)}, entrega ${daysUntil(a.prazo) === 0 ? 'hoje' : daysUntil(a.prazo) === 1 ? 'amanhã' : 'em ' + daysUntil(a.prazo) + ' dias'}`, 'atividades', 'clip'));
    DADOS.entregas.filter(e => e.alunoId === SESSION.userId && e.nota != null).forEach(e => { const a = byId('atividades', e.atividadeId); if (a) add('en-' + e.id + e.nota, `Atividade corrigida: nota ${num(e.nota)}`, a.titulo, 'atividades', 'check2'); });
    DADOS.solicitacoes.filter(s => s.alunoId === SESSION.userId && s.status !== 'Em análise').forEach(s => add('so-' + s.id + s.status, `${s.tipo}: ${s.status.toLowerCase()}`, s.resposta || 'Veja a resposta da secretaria', 'solicitacoes', 'file'));
  }
  if (typeof notifsRede === 'function') notifsRede(r, add);
  DADOS.eventos.filter(e => daysUntil(e.data) >= 0 && daysUntil(e.data) <= 7).sort((a, b) => a.data.localeCompare(b.data)).forEach(e => add('ev-' + e.id, e.titulo, `${e.tipo}, ${fmtLong(e.data)}`, 'calendario', 'calendar'));
  visibleCom().filter(c => daysUntil(c.data) >= -7).sort((a, b) => b.data.localeCompare(a.data)).forEach(c => add('co-' + c.id, c.titulo, `${c.autor}, ${fmtD(c.data)}`, 'comunicados', 'bell'));
  return out;
}
function notifBtn() {
  const n = notifs().filter(x => !lidas().includes(x.id)).length;
  return `<button class="icon-btn notif" data-act="notifs" aria-haspopup="dialog" aria-label="Notificações${n ? `, ${n} não lida${n > 1 ? 's' : ''}` : ''}">${icon('bell')}${n ? '<span class="dot" aria-hidden="true"></span>' : ''}</button>`;
}
function refreshNotif() { const b = $('.notif'); if (!b || !SESSION) return; const h = notifBtn(); if (b.outerHTML !== h) { const had = document.activeElement === b; b.outerHTML = h; if (had) $('.notif').focus(); } }
function markRead(ids) { LS.set(lidasKey(), uniq([...lidas(), ...ids])); refreshNotif(); }

// ---------- Ações extras ----------
Object.assign(ACT, {
  notifs: () => {
    const list = notifs(); const rd = lidas(); const n = list.filter(x => !rd.includes(x.id)).length;
    openDialog({ title: 'Notificações', sheet: true,
      body: `<p class="muted">${n ? `${n} não lida${n > 1 ? 's' : ''}` : 'Tudo em dia.'}</p>${list.length ? `<ul class="list notif-list">${list.map(x => `<li class="${rd.includes(x.id) ? '' : 'unread'}"><button type="button" class="notif-item" data-act="notif-go" data-id="${esc(x.id)}" data-route="${x.route}">${icon(x.ic)}<span class="grow"><span class="t">${esc(x.t)}</span>${rd.includes(x.id) ? '' : '<span class="sr-only"> (não lida)</span>'}<br><span class="m">${esc(x.m)}</span></span></button></li>`).join('')}</ul>` : '<p class="empty">Nenhuma notificação.</p>'}`,
      foot: `${n ? '<button type="button" class="btn ghost" data-act="notif-all">Marcar todas como lidas</button>' : ''}<button type="button" class="btn primary" data-act="close-dlg">Fechar</button>` });
  },
  'notif-go': el => { markRead([el.dataset.id]); const r = el.dataset.route; closeDialog(); setTimeout(() => go(r), 20); },
  'notif-all': () => { markRead(notifs().map(x => x.id)); closeDialog(); toast('Notificações marcadas como lidas.'); },
  'cal-nav': el => { const d = Number(el.dataset.d); if (!d) UI.sel.cal = TODAY_ISO.slice(0, 7); else { const [y, m] = (UI.sel.cal || TODAY_ISO.slice(0, 7)).split('-').map(Number); const nd = new Date(y, m - 1 + d, 1); UI.sel.cal = `${nd.getFullYear()}-${pad(nd.getMonth() + 1)}`; } rerender(); },
  'ver-boletim': el => {
    const a = byId('alunos', el.dataset.id);
    openDialog({ title: `Boletim — ${a.nome}`, wide: true, body: `<p class="muted">${esc(turmaLong(a.turmaId))}, Matrícula ${esc(a.matricula)}, Média geral <b>${num(mediaGeral(a.id))}</b>, <b>${freqInfo(a.id).faltas}</b> faltas</p>${boletimTable(a.id, 'Notas por bimestre')}`, foot: `<button type="button" class="btn ghost" data-act="speak" data-text="${esc(boletimFala(a.id))}">${icon('volume')}Ouvir boletim</button><button type="button" class="btn primary" data-act="close-dlg">Fechar</button>` });
  },
  responder: el => {
    const s = byId('solicitacoes', el.dataset.id);
    openDialog({ title: s.tipo, body: `<dl class="dl"><dt>Aluno</dt><dd>${esc(alunoNome(s.alunoId))} — ${esc(turmaNome(byId('alunos', s.alunoId)?.turmaId))}</dd><dt>Enviada em</dt><dd>${fmtD(s.data)}</dd><dt>Pedido</dt><dd>${esc(s.descricao)}</dd></dl>
      <fieldset class="field"><legend>Decisão</legend><div class="seg">${['Deferido', 'Indeferido', 'Em análise'].map(v => `<label><input type="radio" name="dec" value="${v}" ${s.status === v || (s.status === 'Em análise' && v === 'Deferido') ? 'checked' : ''}>${v === 'Em análise' ? 'Manter em análise' : v}</label>`).join('')}</div></fieldset>
      <div class="field"><label for="sol-resp">Resposta ao aluno <span class="req" aria-hidden="true">*</span></label><textarea id="sol-resp" required>${esc(s.resposta)}</textarea></div>`,
      onSubmit: f => { s.status = f.querySelector('input[name=dec]:checked').value; s.resposta = $('#sol-resp').value.trim(); save(); rerender(); toast('Resposta enviada ao aluno.'); } });
  },
  'chamada-de': el => { UI.sel.ch = el.dataset.pair; UI.sel.chData = TODAY_ISO; go('chamada'); },
  entregas: el => {
    const at = byId('atividades', el.dataset.id); const al = alunosDaTurma(at.turmaId);
    openDialog({ title: `Entregas — ${at.titulo}`, wide: true, body: `<p class="muted">${esc(turmaLong(at.turmaId))}, ${esc(discNome(at.disciplinaId))}, Prazo ${fmtD(at.prazo)}, Vale ${num(at.valor)} ponto(s)</p><ul class="list">${al.map(a => { const e = DADOS.entregas.find(x => x.atividadeId === at.id && x.alunoId === a.id); return `<li style="align-items:flex-start;flex-wrap:wrap"><span class="grow" style="min-width:12rem"><span class="t">${esc(a.nome)}</span>${a.acess !== 'Nenhuma' ? ` <span class="st info">${icon('access')}${esc(a.acess)}</span>` : ''}<br>${e ? `<span class="m">Entregue em ${fmtD(e.data)}${e.arquivo ? ', arquivo ' + esc(e.arquivo) : ''}</span><p class="quote" style="margin-top:.5rem">${esc(e.texto)}</p>` : '<span class="st neutral">Não entregou</span>'}</span>${e ? `<div class="field" style="width:7rem"><label for="en-n-${e.id}">Nota</label><input id="en-n-${e.id}" class="input" inputmode="decimal" data-nota data-eid="${e.id}" value="${e.nota == null ? '' : num(e.nota)}"></div><div class="field" style="flex:1 1 14rem"><label for="en-f-${e.id}">Comentário</label><input id="en-f-${e.id}" class="input" data-fb="${e.id}" value="${esc(e.feedback)}"></div>` : ''}</li>`; }).join('')}</ul>`,
      onSubmit: f => { let n = 0; $$('[data-eid]', f).forEach(i => { const e = DADOS.entregas.find(x => x.id === i.dataset.eid); const v = i.value.trim(); e.nota = v === '' ? null : Number(v.replace(',', '.')); e.feedback = $(`[data-fb="${e.id}"]`, f).value.trim(); if (v) n++; }); save(); rerender(); toast(`Correção salva (${n} com nota).`); } });
  },
  entregar: el => {
    const at = byId('atividades', el.dataset.id); let e = DADOS.entregas.find(x => x.atividadeId === at.id && x.alunoId === SESSION.userId);
    const graded = e && e.nota != null;
    openDialog({ title: at.titulo, body: `<p class="muted">${esc(discNome(at.disciplinaId))}, ${esc(profNome(at.professorId))}, Prazo ${fmtD(at.prazo)}</p><p class="quote">${esc(at.descricao)}</p>${graded ? `<p>${st('Corrigida', 'ok')} Nota <b>${num(e.nota)}</b> de ${num(at.valor)}${e.feedback ? ` — “${esc(e.feedback)}”` : ''}</p>` : ''}
      <div class="field"><label for="ent-txt">Sua resposta <span class="req" aria-hidden="true">*</span></label><textarea id="ent-txt" required ${graded ? 'readonly' : ''}>${esc(e?.texto || '')}</textarea></div>
      ${graded ? '' : `<div class="field"><label for="ent-file">Anexar arquivo (opcional)</label><input id="ent-file" type="file"><p class="help">${e?.arquivo ? 'Arquivo atual: ' + esc(e.arquivo) : 'PDF, imagem ou documento.'}</p></div>`}`,
      foot: graded ? '<button type="button" class="btn primary" data-act="close-dlg">Fechar</button>' : `<button type="button" class="btn ghost" data-act="close-dlg">Cancelar</button><button type="submit" class="btn primary">${icon('send')}${e ? 'Atualizar entrega' : 'Enviar entrega'}</button>`,
      onSubmit: graded ? null : () => { const file = $('#ent-file').files[0]; if (!e) { e = { id: uid(), atividadeId: at.id, alunoId: SESSION.userId, nota: null, feedback: '' }; DADOS.entregas.push(e); } e.texto = $('#ent-txt').value.trim(); e.data = TODAY_ISO; if (file) e.arquivo = file.name; save(); rerender(); toast('Entrega enviada ao professor.'); } });
  },
  'preset-need': el => ACT.preset({ dataset: { id: el.dataset.id } }),
  'rel-ir': el => { const t = document.getElementById(el.dataset.id); if (t) { t.scrollIntoView({ behavior: A.reduce ? 'auto' : 'smooth', block: 'start' }); t.querySelector('h2')?.setAttribute('tabindex', '-1'); t.querySelector('h2')?.focus({ preventScroll: true }); } },
  'marcar-todos': () => { $$('#chamada-form input[value="P"]').forEach(i => { i.checked = true; }); CHG.pres(); }
});
Object.assign(CHG, {
  hTurma: el => { UI.sel.hTurma = el.value; rerender(); },
  bolTurma: el => { UI.sel.bolTurma = el.value; rerender(); },
  frTurma: el => { UI.sel.frTurma = el.value; rerender(); },
  ptPair: el => { UI.sel.pt = el.value; rerender(); },
  ntPair: el => { UI.sel.nt = el.value; rerender(); },
  ntBim: el => { UI.sel.ntBim = Number(el.value); rerender(); },
  chPair: el => { UI.sel.ch = el.value; rerender(); },
  chData: el => { UI.sel.chData = el.value || TODAY_ISO; rerender(); },
  pres: () => { const f = $('#chamada-form'); if (!f) return; const fl = $$('input[value="F"]:checked', f).length; const tot = $$('input[value="P"]', f).length; $('#pres-count').textContent = `${tot - fl} presentes e ${fl} falta${fl === 1 ? '' : 's'}`; }
});
Object.assign(FORMS, {
  config: f => { const fd = new FormData(f); Object.assign(DADOS.config, { escolaNome: fd.get('escolaNome').trim(), anoLetivo: Number(fd.get('anoLetivo')), bimestreAtual: Number(fd.get('bimestreAtual')), mediaMin: Number(String(fd.get('mediaMin')).replace(',', '.')), freqMin: Number(fd.get('freqMin')) }); save(); renderShell(); renderPage(); $('#page-title').focus(); toast('Configurações salvas.'); },
  notas: f => {
    const p = curPair('nt'); const b = UI.sel.ntBim || DADOS.config.bimestreAtual; let n = 0;
    $$('input[data-aid]', f).forEach(i => { const k = `${i.dataset.aid}|${p.d}|${b}`; const v = i.value.trim(); if (v === '') delete DADOS.notas[k]; else { DADOS.notas[k] = Math.round(Number(v.replace(',', '.')) * 10) / 10; n++; } });
    save(); rerender(); toast(`Notas do ${b}º bimestre salvas para ${n} aluno${n === 1 ? '' : 's'}.`);
  },
  chamada: f => {
    const p = curPair('ch'); const data = UI.sel.chData || TODAY_ISO;
    const faltas = $$('input[value="F"]:checked', f).map(i => i.name.slice(2));
    const conteudo = $('#ch-cont').value.trim();
    let c = DADOS.chamadas.find(x => x.turmaId === p.t && x.disciplinaId === p.d && x.data === data);
    if (!c) { c = { id: uid(), turmaId: p.t, disciplinaId: p.d, data }; DADOS.chamadas.push(c); }
    c.faltas = faltas; c.conteudo = conteudo; save(); rerender();
    const tot = alunosDaTurma(p.t).length; toast(`Chamada salva: ${tot - faltas.length} presentes e ${faltas.length} falta${faltas.length === 1 ? '' : 's'}.`);
  },
  perfil: f => { const a = me(); a.email = $('#pf-email').value.trim(); a.telResp = $('#pf-tel').value.trim(); save(); toast('Dados atualizados.'); }
});

// ================= GESTÃO =================
function gInicio() {
  const AL = alunosEsc(); const g = me(); const escN = escSessao() ? byId('escolas', escSessao())?.nome : 'rede estadual';
  const risco = AL.map(a => ({ a, m: mediaGeral(a.id), f: freqPct(a.id) })).filter(x => (x.m != null && x.m < DADOS.config.mediaMin) || (x.f != null && x.f < DADOS.config.freqMin)).sort((x, y) => (x.m ?? 10) - (y.m ?? 10));
  const pend = DADOS.solicitacoes.filter(s => s.status === 'Em análise' && AL.some(a => a.id === s.alunoId));
  return pageHead(`${greet()}, ${firstName(g.nome)}.`, `Resumo da ${esc(escN)} para ${esc(fmtLong(TODAY_ISO))}.`, `<button class="btn outline" data-act="go" data-route="alunos">${icon('users')}Ver alunos</button><button class="btn primary" data-act="new" data-ent="alunos">${icon('plus')}Matricular aluno</button>`, 'hello') +
    fioSemana() +
    `<section class="stats" aria-label="Indicadores">
      ${statCard('lilac', 'Alunos matriculados', AL.length, escSessao() ? `${turmasEsc().length} turmas` : `${DADOS.turmas.length} turmas em ${uniq(DADOS.turmas.map(t => t.escolaId)).length} escolas`, 'alunos')}
      ${statCard('rose', escSessao() ? 'Média geral da escola' : 'Média geral da rede', `${num(avg(AL.map(a => mediaGeral(a.id))))}<small> /10</small>`, `Mínima para aprovação: ${num(DADOS.config.mediaMin)}`, 'relatorios')}
      ${statCard('mint', 'Frequência média', `${num(avg(AL.map(a => freqPct(a.id))), 0)}<small>%</small>`, `Mínima exigida: ${DADOS.config.freqMin}%`, 'frequencia')}
      ${statCard('peach', 'Solicitações pendentes', pend.length, 'Documentos e revisões aguardando', 'solicitacoes')}
      ${typeof redeStat === 'function' ? redeStat() : ''}
    </section>
    ${hrowOpen('painel-gestao')}
      ${typeof redeCard === 'function' ? redeCard() : ''}
      <section class="card c4" aria-labelledby="risco-h"><div class="card-h"><h2 id="risco-h">Alunos que precisam de atenção</h2><span class="caption">${risco.length} alunos</span></div>
        ${risco.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Aluno</th><th scope="col" class="n">Média</th><th scope="col" class="n">Freq.</th><th scope="col"><span class="sr-only">Ação</span></th></tr></thead><tbody>${risco.slice(0, 6).map(x => `<tr><th scope="row">${esc(x.a.nome)}${caption2(esc(turmaNome(x.a.turmaId)))}</th><td class="n">${x.m != null && x.m < DADOS.config.mediaMin ? `<span class="st err">${num(x.m)}</span>` : num(x.m)}</td><td class="n">${freqHTML(x.f)}</td><td class="n"><button class="btn ghost sm" data-act="ver-boletim" data-id="${x.a.id}" aria-label="Ver boletim de ${esc(x.a.nome)}">Boletim</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhum aluno abaixo dos mínimos.</p>'}
      </section>
      <section class="card c4" aria-labelledby="ev-h"><div class="card-h"><h2 id="ev-h">Próximos eventos</h2><button class="btn ghost sm" data-act="go" data-route="calendario">Calendário</button></div><ul class="list">${DADOS.eventos.filter(e => e.data >= TODAY_ISO).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 5).map(e => evItem(e)).join('')}</ul></section>
      <section class="card c4" aria-labelledby="sol-h"><div class="card-h"><h2 id="sol-h">Solicitações aguardando</h2><button class="btn ghost sm" data-act="go" data-route="solicitacoes">Ver todas</button></div>${pend.length ? `<ul class="list">${pend.map(s => `<li><span class="grow"><span class="t">${esc(s.tipo)}</span><br><span class="m">${esc(alunoNome(s.alunoId))}, ${fmtD(s.data)}</span></span><button class="btn outline sm" data-act="responder" data-id="${s.id}" aria-label="Responder ${esc(s.tipo)} de ${esc(alunoNome(s.alunoId))}">Responder</button></li>`).join('')}</ul>` : '<p class="empty">Tudo respondido.</p>'}</section>
      <section class="card c12" aria-labelledby="com-h"><div class="card-h"><h2 id="com-h">Comunicados recentes</h2><button class="btn ghost sm" data-act="go" data-route="comunicados">Ver todos</button></div><ul class="list">${DADOS.comunicados.slice().sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3).map(c => `<li><span class="grow"><span class="t">${esc(c.titulo)}</span><br><span class="m">${esc(c.autor)}, ${fmtD(c.data)}, ${esc(publicoLabel(c.publico))}</span></span></li>`).join('')}</ul></section>
    </div>`;
}
function gHorarios() {
  if (!turmasEsc().some(t => t.id === UI.sel.hTurma)) UI.sel.hTurma = turmasEsc()[0]?.id;
  const t = byId('turmas', UI.sel.hTurma);
  if (!t) return pageHead('Grade horária', 'Cadastre uma turma para montar a grade.');
  const aulas = DADOS.aulas.filter(a => a.turmaId === t.id);
  return pageHead('Grade horária', 'Monte a semana de cada turma. Selecione um horário para editar a aula ou preencher um horário livre. O sistema avisa quando um professor já está ocupado.', `<button class="btn primary" data-act="new" data-ent="aulas" data-def-turma-id="${t.id}">${icon('plus')}Adicionar aula</button>`) +
    `<div class="toolbar">${selectCtl('h-turma', 'Turma', optTurmas(), t.id, 'hTurma')}<p class="caption" style="padding-bottom:.75rem">${aulas.length} aulas por semana, Turno da ${t.turno.toLowerCase()}, ${esc(t.sala || '')}</p></div>` +
    gradeTable(aulas, t.turno, a => `<button class="slot" data-act="edit" data-ent="aulas" data-id="${a.id}" aria-label="${esc(discNome(a.disciplinaId))} com ${esc(profNome(a.professorId))}, ${DAYS[a.dia]} ${slotRange(t.turno, a.slot)}. Editar"><b>${esc(discNome(a.disciplinaId))}</b><span>${esc(profNome(a.professorId))}</span></button>`, (d, s) => `<button class="slot" data-act="new" data-ent="aulas" data-def-turma-id="${t.id}" data-def-dia="${d}" data-def-slot="${s}" aria-label="Horário livre, ${DAYS[d]} ${slotRange(t.turno, s)}. Adicionar aula"><span>${icon('plus')} Livre</span></button>`, `Grade semanal — ${turmaLong(t.id)}`);
}
function gBoletins() {
  if (!turmasEsc().some(t => t.id === UI.sel.bolTurma)) UI.sel.bolTurma = turmasEsc()[0]?.id;
  const t = UI.sel.bolTurma; const ds = discsDaTurma(t); const al = alunosDaTurma(t);
  return pageHead('Notas e boletins', `Médias por disciplina de cada aluno. As notas são lançadas pelos professores; a média mínima é ${num(DADOS.config.mediaMin)}.`) +
    `<div class="toolbar">${selectCtl('bol-turma', 'Turma', optTurmas(), t, 'bolTurma')}</div>` +
    (al.length ? `<div class="tbl-wrap"><table class="tbl"><caption>Médias — ${esc(turmaLong(t))}</caption><thead><tr><th scope="col">Aluno</th>${ds.map(d => `<th scope="col" class="n"><abbr title="${esc(discNome(d))}" style="text-decoration:none">${esc(discNome(d).slice(0, 4))}.</abbr><span class="sr-only">${esc(discNome(d))}</span></th>`).join('')}<th scope="col" class="n">Geral</th><th scope="col">Situação</th><th scope="col"><span class="sr-only">Ação</span></th></tr></thead><tbody>${al.map(a => `<tr><th scope="row">${esc(a.nome)}</th>${ds.map(d => { const m = mediaDisc(a.id, d); return `<td class="n">${m != null && m < DADOS.config.mediaMin ? `<span class="st err">${num(m)}</span>` : num(m)}</td>`; }).join('')}<td class="n"><b>${num(mediaGeral(a.id))}</b></td><td>${sitHTML(mediaGeral(a.id))}</td><td class="n"><button class="btn ghost sm" data-act="ver-boletim" data-id="${a.id}" aria-label="Ver boletim completo de ${esc(a.nome)}">Detalhes</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhum aluno nesta turma.</p>');
}
function gFrequencia() {
  if (!turmasEsc().some(t => t.id === UI.sel.frTurma)) UI.sel.frTurma = turmasEsc()[0]?.id;
  const t = UI.sel.frTurma; const al = alunosDaTurma(t);
  const ch = DADOS.chamadas.filter(c => c.turmaId === t).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 12);
  return pageHead('Frequência', `Presença acumulada por aluno e diário de classe. Abaixo de ${DADOS.config.freqMin}% o aluno corre risco de reprovação por falta.`) +
    `<div class="toolbar">${selectCtl('fr-turma', 'Turma', optTurmas(), t, 'frTurma')}</div>
    <div class="grid g2">
    <div class="tbl-wrap"><table class="tbl"><caption>Frequência — ${esc(turmaLong(t))}</caption><thead><tr><th scope="col">Aluno</th><th scope="col" class="n">Aulas</th><th scope="col" class="n">Faltas</th><th scope="col" class="n">Frequência</th></tr></thead><tbody>${al.map(a => { const f = freqInfo(a.id); return `<tr><th scope="row">${esc(a.nome)}</th><td class="n">${f.aulas}</td><td class="n">${f.faltas}</td><td class="n">${freqHTML(f.pct)}</td></tr>`; }).join('')}</tbody></table></div>
    <section class="card" aria-labelledby="diario-h"><h2 id="diario-h">Diário de classe recente</h2>${ch.length ? `<ul class="list">${ch.map(c => `<li><span class="date-chip" aria-hidden="true"><b>${dOf(c.data).getDate()}</b><span>${DAYS[dOf(c.data).getDay()].slice(0, 3)}</span></span><span class="grow"><span class="t">${esc(discNome(c.disciplinaId))}</span><br><span class="m"><span class="sr-only">${fmtD(c.data)}. </span>${esc(c.conteudo || 'Sem conteúdo registrado')}, ${c.faltas.length} falta${c.faltas.length === 1 ? '' : 's'}</span></span></li>`).join('')}</ul>` : '<p class="empty">Nenhuma chamada registrada.</p>'}</section></div>`;
}
function gSolicitacoes() {
  const list = DADOS.solicitacoes.filter(s => alunosEsc().some(a => a.id === s.alunoId)).sort((a, b) => (a.status === 'Em análise' ? 0 : 1) - (b.status === 'Em análise' ? 0 : 1) || b.data.localeCompare(a.data));
  return pageHead('Solicitações', 'Pedidos de documentos, revisões de nota e atestados enviados pelos alunos. Responda para que o aluno receba o retorno no portal.') +
    (list.length ? `<div class="tbl-wrap"><table class="tbl"><caption class="sr-only">Solicitações</caption><thead><tr><th scope="col">Pedido</th><th scope="col">Aluno</th><th scope="col">Enviada</th><th scope="col">Situação</th><th scope="col" class="n">Ação</th></tr></thead><tbody>${list.map(s => `<tr><th scope="row">${esc(s.tipo)}${caption2(esc(s.descricao))}</th><td>${esc(alunoNome(s.alunoId))}${caption2(esc(turmaNome(byId('alunos', s.alunoId)?.turmaId)))}</td><td class="num">${fmtD(s.data)}</td><td>${solHTML(s)}${s.resposta ? caption2(esc(s.resposta)) : ''}</td><td class="n"><button class="btn ${s.status === 'Em análise' ? 'primary' : 'ghost'} sm" data-act="responder" data-id="${s.id}" aria-label="${s.status === 'Em análise' ? 'Responder' : 'Revisar'} ${esc(s.tipo)} de ${esc(alunoNome(s.alunoId))}">${s.status === 'Em análise' ? 'Responder' : 'Revisar'}</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhuma solicitação.</p>');
}
function gRelatorios() {
  const fe = escSessao();
  const turmas = DADOS.turmas.filter(t => !fe || t.escolaId === fe);
  const alunos = DADOS.alunos.filter(a => turmas.some(t => t.id === a.turmaId));
  const mn = DADOS.config.mediaMin, fm = DADOS.config.freqMin;
  const mg = avg(alunos.map(a => mediaGeral(a.id))), fq = avg(alunos.map(a => freqPct(a.id)));
  const sits = { Aprovado: 0, 'Recuperação': 0, Reprovado: 0, 'Sem nota': 0 }; alunos.forEach(a => { sits[situacao(mediaGeral(a.id)).l]++; });
  const tot = alunos.length || 1;
  const baixaFreq = alunos.filter(a => (freqPct(a.id) ?? 100) < fm).length;
  const dm = DADOS.disciplinas.map(d => [d.nome, avg(alunos.map(a => mediaDisc(a.id, d.id)))]).filter(x => x[1] != null).sort((a, b) => b[1] - a[1]);
  const tf = turmas.map(t => [t.nome, avg(alunosDaTurma(t.id).map(a => freqPct(a.id)))]);
  const acc = ACESSOS.slice(1).map(n => [n, alunos.filter(a => a.acess === n).length]).filter(x => x[1]);
  const ocTipos = uniq(DADOS.ocorrencias.filter(o => alunos.some(a => a.id === o.alunoId)).map(o => o.tipo));
  const oc = ocTipos.map(t => [t, DADOS.ocorrencias.filter(o => o.tipo === t && alunos.some(a => a.id === o.alunoId)).length]).sort((a, b) => b[1] - a[1]);
  const bf = alunos.filter(a => a.bolsaFamilia === 'Sim');
  const bfOk = bf.filter(a => (freqPct(a.id) ?? 0) >= (idade(a.nascimento) >= 16 ? 75 : 85)).length;
  const peiOk = alunos.filter(a => a.acess !== 'Nenhuma' && a.pei?.recursos?.length).length;
  const vagas = DADOS.vagas.filter(v => !fe || v.escolaId === fe);
  const sitCor = { Aprovado: 'var(--ok)', 'Recuperação': 'var(--warn)', Reprovado: 'var(--err)', 'Sem nota': 'var(--bd-strong)' };
  const sec = (id, titulo, desc, body) => `<section class="rel-sec" id="${id}" aria-labelledby="${id}-h"><div class="rel-head"><h2 id="${id}-h">${titulo}</h2><p class="muted">${desc}</p></div>${body}</section>`;
  const card = (id, titulo, body, nota = '') => `<section class="card" aria-labelledby="${id}"><h3 id="${id}">${titulo}</h3>${body}${nota ? `<p class="caption">${nota}</p>` : ''}</section>`;
  const secs = [['rel-desempenho', 'Desempenho'], ['rel-frequencia', 'Frequência'], ['rel-rede', 'Vagas e matrículas'], ['rel-inclusao', 'Inclusão e convivência']];
  return pageHead('Relatórios', `Situação do ${DADOS.config.bimestreAtual}º bimestre de ${DADOS.config.anoLetivo}. ${fe ? esc(byId('escolas', fe)?.nome) : 'Todas as escolas da rede'}.`) +
    `<nav class="rel-nav" aria-label="Seções do relatório">${secs.map(([id, l]) => `<a href="#${id}" data-act="rel-ir" data-id="${id}">${l}</a>`).join('')}</nav>
    <section class="stats" aria-label="Resumo">
      ${statCard('lilac', 'Alunos', alunos.length, `${turmas.length} turmas`)}
      ${statCard('rose', 'Média geral', `${num(mg)}<small> /10</small>`, `Mínima para aprovação: ${num(mn)}`)}
      ${statCard('mint', 'Frequência média', `${num(fq, 0)}<small>%</small>`, `${baixaFreq} aluno${baixaFreq === 1 ? '' : 's'} abaixo de ${fm}%`)}
      ${statCard('peri', 'Aprovados até agora', `${num(sits.Aprovado / tot * 100, 0)}<small>%</small>`, `${sits['Recuperação']} em recuperação, ${sits.Reprovado} reprovados`)}
    </section>` +
    sec('rel-desempenho', 'Desempenho', 'Médias e situação dos alunos por turma e por disciplina.',
      `<div class="tbl-wrap"><table class="tbl stack"><caption>Resumo por turma</caption><thead><tr><th scope="col">Turma</th><th scope="col" class="n">Alunos</th><th scope="col" class="n">Média</th><th scope="col" class="n">Frequência</th><th scope="col" class="n">Aprovados</th><th scope="col" class="n">Recuperação</th><th scope="col" class="n">Reprovados</th></tr></thead><tbody>${turmas.map(t => { const al = alunosDaTurma(t.id); const ss = al.map(a => situacao(mediaGeral(a.id)).l); const m = avg(al.map(a => mediaGeral(a.id))); return `<tr><th scope="row">${esc(t.nome)}${caption2(esc(byId('escolas', t.escolaId)?.nome || ''))}</th><td class="n" data-label="Alunos">${al.length}</td><td class="n" data-label="Média">${m != null && m < mn ? st(num(m), 'err') : num(m)}</td><td class="n" data-label="Frequência">${freqHTML(avg(al.map(a => freqPct(a.id))))}</td><td class="n" data-label="Aprovados">${ss.filter(x => x === 'Aprovado').length}</td><td class="n" data-label="Recuperação">${ss.filter(x => x === 'Recuperação').length}</td><td class="n" data-label="Reprovados">${ss.filter(x => x === 'Reprovado').length}</td></tr>`; }).join('')}</tbody></table></div>
      <div class="grid g2">
        ${card('r-sit', 'Situação dos alunos', `<div class="stack-bar" aria-hidden="true">${Object.entries(sits).filter(x => x[1]).map(([k, v]) => `<span style="width:${v / tot * 100}%;background:${sitCor[k]}"></span>`).join('')}</div><ul class="legend-list">${Object.entries(sits).map(([k, v]) => `<li><span class="sw" style="background:${sitCor[k]}"></span><span class="grow">${k}</span><b class="num">${v}</b><span class="muted num">${num(v / tot * 100, 0)}%</span></li>`).join('')}</ul>`, `Pela média geral até o ${DADOS.config.bimestreAtual}º bimestre.`)}
        ${card('r-disc', 'Média por disciplina', bars(dm, 10, v => num(v), mn), `Barras em vermelho estão abaixo de ${num(mn)}.`)}
      </div>`) +
    sec('rel-frequencia', 'Frequência', `A frequência mínima exigida é ${fm}%.`,
      `<div class="grid g2">
        ${card('r-ft', 'Frequência por turma', bars(tf, 100, v => num(v, 0) + '%', fm))}
        ${card('r-bf', 'Bolsa Família', `<dl class="dl"><dt>Beneficiários</dt><dd>${bf.length}</dd><dt>Cumprem a frequência</dt><dd>${st(String(bfOk), 'ok')}</dd><dt>Não cumprem</dt><dd>${bf.length - bfOk ? st(String(bf.length - bfOk), 'err') : '0'}</dd><dt>Abaixo de ${fm}% (todos)</dt><dd>${baixaFreq}</dd></dl><div class="row"><button class="btn outline sm" data-act="go" data-route="buscaativa">Abrir busca ativa</button></div>`, 'O programa exige 85% de 6 a 15 anos e 75% de 16 a 17 anos.')}
      </div>`) +
    sec('rel-rede', 'Vagas e matrículas', 'Vagas oferecidas, pedidos de matrícula e transferências.',
      `<div class="tbl-wrap"><table class="tbl stack"><caption>Vagas por escola</caption><thead><tr><th scope="col">Escola</th><th scope="col" class="n">Oferecidas</th><th scope="col" class="n">Ocupadas</th><th scope="col" class="n">Livres</th><th scope="col" class="n">Lista de espera</th></tr></thead><tbody>${uniq(vagas.map(v => v.escolaId)).map(eid => { const vs = vagas.filter(v => v.escolaId === eid); const livres = vs.reduce((n, v) => n + disp(v), 0); return `<tr><th scope="row">${esc(escNome(eid))}</th><td class="n" data-label="Oferecidas">${vs.reduce((n, v) => n + (Number(v.total) || 0), 0)}</td><td class="n" data-label="Ocupadas">${vs.reduce((n, v) => n + ocupadas(v), 0)}</td><td class="n" data-label="Livres">${livres ? livres : st('0', 'err')}</td><td class="n" data-label="Lista de espera">${DADOS.prematriculas.filter(p => p.status === 'Lista de espera' && p.escolaId === eid).length}</td></tr>`; }).join('')}</tbody></table></div>
      <div class="grid g2">
        ${card('r-pm', 'Pré-matrículas', bars(['Em análise', 'Documentos pendentes', 'Lista de espera', 'Matrícula confirmada', 'Encaminhada à escola', 'Indeferida'].map(k => [k, DADOS.prematriculas.filter(p => p.status === k && (!fe || p.escola1 === fe || p.escola2 === fe)).length]).filter(x => x[1]), Math.max(1, DADOS.prematriculas.length), v => String(v)))}
        ${card('r-tr', 'Transferências', bars(['Aguardando escola de origem', 'Aguardando escola de destino', 'Concluída', 'Recusada'].map(k => [k, DADOS.transferencias.filter(t => t.status === k && (!fe || t.origemId === fe || t.destinoId === fe)).length]).filter(x => x[1]), Math.max(1, DADOS.transferencias.length), v => String(v)))}
      </div>`) +
    sec('rel-inclusao', 'Inclusão e convivência', 'Educação especial e registros de ocorrências.',
      `<div class="grid g2">
        ${card('r-aee', 'Alunos da educação especial', acc.length ? bars(acc, Math.max(...acc.map(x => x[1])), v => String(v)) : '<p class="empty">Nenhum registro.</p>', `${peiOk} de ${acc.reduce((n, x) => n + x[1], 0)} com plano educacional (PEI) preenchido.`)}
        ${card('r-oc', 'Ocorrências por tipo', oc.length ? bars(oc, Math.max(...oc.map(x => x[1])), v => String(v)) : '<p class="empty">Nenhuma ocorrência.</p>')}
      </div>`);
}
function gConfig() {
  const c = DADOS.config;
  return pageHead('Configurações', 'Regras do ano letivo usadas em boletins, frequência e relatórios.') +
    `<form class="card" data-form="config" aria-labelledby="cfg-h" novalidate><h2 id="cfg-h">Ano letivo</h2><div class="form-grid">
      ${fieldHTML({ k: 'escolaNome', l: 'Nome da rede', req: 1 }, c.escolaNome)}
      ${fieldHTML({ k: 'anoLetivo', l: 'Ano letivo', t: 'number', req: 1 }, c.anoLetivo)}
      ${fieldHTML({ k: 'bimestreAtual', l: 'Bimestre em andamento', t: 'select', o: [[1, '1º bimestre'], [2, '2º bimestre'], [3, '3º bimestre'], [4, '4º bimestre']], req: 1 }, c.bimestreAtual)}
      ${fieldHTML({ k: 'mediaMin', l: 'Média mínima para aprovação', t: 'number', req: 1, attrs: 'step="0.5" min="0" max="10"', help: 'Até 2 pontos abaixo o aluno fica em recuperação.' }, c.mediaMin)}
      ${fieldHTML({ k: 'freqMin', l: 'Frequência mínima (%)', t: 'number', req: 1, attrs: 'min="0" max="100"', help: 'A LDB exige 75%.' }, c.freqMin)}
    </div><div class="row"><button class="btn primary" type="submit">${icon('check')}Salvar configurações</button></div></form>
    <section class="card" aria-labelledby="dados-h"><h2 id="dados-h">Dados do protótipo</h2><p class="muted">Tudo o que você cadastra fica salvo neste navegador. Restaure para voltar aos dados de exemplo.</p><div class="row"><button class="btn outline" data-act="reset">${icon('refresh')}Restaurar dados de exemplo</button></div></section>`;
}

// ================= PROFESSOR =================
function pInicio() {
  const p = me(); const mt = myTurmas(); const ats = DADOS.atividades.filter(a => a.professorId === p.id);
  const corrigir = DADOS.entregas.filter(e => e.nota == null && ats.some(a => a.id === e.atividadeId)).length;
  const discs = uniq(myAulas().map(a => a.disciplinaId));
  const atencao = myAlunos().map(a => ({ a, m: avg(discs.map(d => mediaDisc(a.id, d))) })).filter(x => x.m != null && x.m < DADOS.config.mediaMin);
  const nec = myAlunos().filter(a => a.acess !== 'Nenhuma');
  let dia = TODAY.getDay(); if (dia === 0 || dia === 6) dia = 1;
  return pageHead(`${greet()}, ${firstName(p.nome)}.`, `${mt.length} turmas, ${esc(discs.map(discNome).join(' e '))}`, `<button class="btn outline" data-act="go" data-route="notas">${icon('pencil')}Lançar notas</button><button class="btn primary" data-act="go" data-route="chamada">${icon('check2')}Fazer chamada</button>`, 'hello') +
    fioDia(myAulas(), 'professor') +
    `<section class="stats" aria-label="Indicadores">
      ${statCard('lilac', 'Minhas turmas', mt.length, `${myAlunos().length} alunos no total`, 'turmas')}
      ${statCard('peach', 'Aulas hoje', myAulas().filter(a => a.dia === dia).length, esc(DAYS[dia]), 'horario')}
      ${statCard('peri', 'Entregas para corrigir', corrigir, `${ats.length} atividades publicadas`, 'atividades')}
      ${statCard('rose', 'Abaixo da média', atencao.length, `Média menor que ${num(DADOS.config.mediaMin)} nas suas disciplinas`, 'turmas')}
    </section>
    ${hrowOpen('painel-prof')}
      <section class="card c4" aria-labelledby="nec-h"><h2 id="nec-h">Adaptações para seus alunos</h2>${nec.length ? `<ul class="list">${nec.map(a => `<li><span class="avatar" aria-hidden="true">${initials(a.nome)}</span><span class="grow"><span class="t">${esc(a.nome)}</span><br><span class="m">${esc(turmaNome(a.turmaId))}, ${esc(a.acess)} — ${esc(a.pei?.recursos?.length ? a.pei.recursos.join(', ') : dica(a.acess))}</span></span></li>`).join('')}</ul>` : '<p class="empty">Nenhum aluno com necessidade registrada.</p>'}</section>
      <section class="card c4" aria-labelledby="com-h"><div class="card-h"><h2 id="com-h">Comunicados recentes</h2><button class="btn ghost sm" data-act="go" data-route="comunicados">Ver todos</button></div><ul class="list">${visibleCom().sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3).map(c => `<li><span class="grow"><span class="t">${esc(c.titulo)}</span><br><span class="m">${esc(c.autor)}, ${fmtD(c.data)}</span></span></li>`).join('')}</ul></section>
    </div>`;
}
function dica(n) {
  return ({ 'Baixa visão': 'material ampliado (fonte 18+), alto contraste e lugar nas primeiras fileiras', 'Deficiência visual': 'material digital acessível, descrição de imagens e ledor nas provas', 'Daltonismo': 'não usar só cor para diferenciar informações', 'TDAH': 'instruções curtas e tempo adicional', 'Dislexia': 'fonte legível e leitura em voz alta', 'Surdez ou deficiência auditiva': 'intérprete de Libras e material escrito', 'TEA': 'rotina previsível e avisos antecipados' })[n] || 'ver laudo com a coordenação';
}
function pTurmas() {
  const p = curPair('pt'); if (!p) return pageHead('Minhas turmas', 'Você ainda não tem aulas atribuídas.');
  const al = alunosDaTurma(p.t); const b = DADOS.config.bimestreAtual;
  return pageHead('Minhas turmas', 'Alunos, notas e frequência na sua disciplina.') +
    `<div class="toolbar">${selectCtl('pt-pair', 'Turma e disciplina', myPairs().map(x => [x.k, x.l]), p.k, 'ptPair')}<p class="caption" style="padding-bottom:.75rem">${al.length} alunos, média da turma ${num(avg(al.map(a => mediaDisc(a.id, p.d))))}</p></div>
    <div class="tbl-wrap"><table class="tbl"><caption>${esc(p.l)}</caption><thead><tr><th scope="col">Aluno</th><th scope="col">Acessibilidade</th>${[1, 2, 3, 4].slice(0, Math.max(b, 1)).map(i => `<th scope="col" class="n">${i}º bim.</th>`).join('')}<th scope="col" class="n">Média</th><th scope="col" class="n">Frequência</th><th scope="col">Situação</th></tr></thead><tbody>${al.map(a => { const m = mediaDisc(a.id, p.d); return `<tr><th scope="row">${esc(a.nome)}${caption2('Matrícula ' + esc(a.matricula))}</th><td>${a.acess !== 'Nenhuma' ? st(a.acess, 'info', 'access') : '<span class="muted">—</span>'}</td>${[1, 2, 3, 4].slice(0, Math.max(b, 1)).map(i => `<td class="n">${num(nota(a.id, p.d, i))}</td>`).join('')}<td class="n"><b>${num(m)}</b></td><td class="n">${freqHTML(freqPct(a.id, p.d))}</td><td>${sitHTML(m)}</td></tr>`; }).join('')}</tbody></table></div>`;
}
function pNotas() {
  const p = curPair('nt'); if (!p) return pageHead('Lançar notas', 'Você ainda não tem aulas atribuídas.');
  const b = UI.sel.ntBim || DADOS.config.bimestreAtual; const al = alunosDaTurma(p.t);
  return pageHead('Lançar notas', 'Digite as notas de 0 a 10 (use vírgula ou ponto). Use Tab para ir ao próximo aluno. Deixe em branco para não lançar.') +
    `<div class="toolbar">${selectCtl('nt-pair', 'Turma e disciplina', myPairs().map(x => [x.k, x.l]), p.k, 'ntPair')}
      <fieldset class="field"><legend class="lbl">Bimestre</legend><div class="seg">${[1, 2, 3, 4].map(i => `<label><input type="radio" id="nt-bim-${i}" name="nt-bim" value="${i}" data-change="ntBim" ${b === i ? 'checked' : ''}>${i}º Bim</label>`).join('')}</div></fieldset></div>
    <form data-form="notas" novalidate class="card" aria-labelledby="nt-cap"><div class="card-h"><h2 id="nt-cap">${esc(p.l)}, ${b}º bimestre</h2><span class="caption">${al.filter(a => nota(a.id, p.d, b) != null).length} de ${al.length} lançadas</span></div>
      <div class="tbl-wrap"><table class="tbl stack"><thead><tr><th scope="col">Aluno</th>${[1, 2, 3, 4].filter(i => i !== b).map(i => `<th scope="col" class="n">${i}º</th>`).join('')}<th scope="col" class="n">Nota do ${b}º bim.</th><th scope="col" class="n">Média atual</th></tr></thead><tbody>${al.map(a => { const v = nota(a.id, p.d, b); return `<tr><th scope="row">${esc(a.nome)}${a.acess !== 'Nenhuma' ? caption2(esc(a.acess)) : ''}</th>${[1, 2, 3, 4].filter(i => i !== b).map(i => `<td class="n muted" data-label="${i}º bimestre">${num(nota(a.id, p.d, i))}</td>`).join('')}<td class="n" data-label="Nota do ${b}º bimestre"><label class="sr-only" for="nota-${a.id}">Nota do ${b}º bimestre de ${esc(a.nome)}</label><input id="nota-${a.id}" class="input" inputmode="decimal" autocomplete="off" data-nota data-aid="${a.id}" value="${v == null ? '' : num(v)}" placeholder="—"></td><td class="n" data-label="Média atual">${num(mediaDisc(a.id, p.d))}</td></tr>`; }).join('')}</tbody></table></div>
      <div class="row"><button class="btn primary" type="submit">${icon('check')}Salvar notas</button><span class="caption">As notas aparecem na hora no boletim do aluno.</span></div></form>`;
}
function pChamada() {
  const p = curPair('ch'); if (!p) return pageHead('Chamada e diário', 'Você ainda não tem aulas atribuídas.');
  const data = UI.sel.chData || TODAY_ISO; const al = alunosDaTurma(p.t);
  const c = DADOS.chamadas.find(x => x.turmaId === p.t && x.disciplinaId === p.d && x.data === data);
  const fl = c ? c.faltas : [];
  const hist = DADOS.chamadas.filter(x => x.turmaId === p.t && x.disciplinaId === p.d).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 8);
  return pageHead('Chamada e diário', 'Todos começam como presentes. Marque "Falta" para quem não veio e registre o conteúdo da aula.') +
    `<div class="toolbar">${selectCtl('ch-pair', 'Turma e disciplina', myPairs().map(x => [x.k, x.l]), p.k, 'chPair')}<div class="field" style="max-width:12rem"><label for="ch-data">Data da aula</label><input id="ch-data" class="input" type="date" value="${data}" max="${TODAY_ISO}" data-change="chData"></div></div>
    <div class="grid g2">
    <form id="chamada-form" data-form="chamada" novalidate class="card" aria-labelledby="ch-h"><div class="card-h"><h2 id="ch-h">${esc(discNome(p.d))}, ${esc(fmtLong(data))}</h2>${c ? st('Chamada já registrada', 'ok') : ''}</div>
      <div class="row sp"><p id="pres-count" aria-live="polite" class="muted">${al.length - fl.length} presentes e ${fl.length} falta${fl.length === 1 ? '' : 's'}</p><button type="button" class="btn ghost sm" data-act="marcar-todos">Marcar todos presentes</button></div>
      <ul class="list">${al.map(a => `<li><span class="avatar" aria-hidden="true">${initials(a.nome)}</span><span class="grow"><span class="t" id="nm-${a.id}">${esc(a.nome)}</span></span><fieldset aria-labelledby="nm-${a.id}"><div class="seg presence">${['P', 'F'].map(v => `<label><input type="radio" name="p-${a.id}" value="${v}" data-change="pres" ${(v === 'F') === fl.includes(a.id) ? 'checked' : ''}>${v === 'P' ? 'Presente' : 'Falta'}</label>`).join('')}</div></fieldset></li>`).join('')}</ul>
      <div class="field"><label for="ch-cont">Conteúdo ministrado</label><textarea id="ch-cont" placeholder="Ex.: Funções do 2º grau — cálculo do vértice">${esc(c?.conteudo || '')}</textarea></div>
      <div class="row"><button class="btn primary" type="submit">${icon('check')}Salvar chamada</button></div></form>
    <section class="card" aria-labelledby="hist-h"><h2 id="hist-h">Diário de classe</h2>${hist.length ? `<ul class="list">${hist.map(h => `<li><span class="date-chip" aria-hidden="true"><b>${dOf(h.data).getDate()}</b><span>${DAYS[dOf(h.data).getDay()].slice(0, 3)}</span></span><span class="grow"><span class="t">${esc(h.conteudo || 'Sem conteúdo')}</span><br><span class="m"><span class="sr-only">${fmtD(h.data)}. </span>${h.faltas.length ? 'Faltas: ' + esc(h.faltas.map(x => firstName(alunoNome(x))).join(', ')) : 'Todos presentes'}</span></span></li>`).join('')}</ul>` : '<p class="empty">Nenhuma aula registrada.</p>'}</section></div>`;
}
function pHorario() {
  const aulas = myAulas(); const turnos = uniq(aulas.map(a => byId('turmas', a.turmaId)?.turno));
  return pageHead('Meu horário', `${aulas.length} aulas por semana.`) + turnos.map(t => gradeTable(aulas.filter(a => byId('turmas', a.turmaId)?.turno === t), t, a => `<div class="slot"><b>${esc(discNome(a.disciplinaId))}</b><span>${esc(turmaNome(a.turmaId))}, ${esc(byId('turmas', a.turmaId)?.sala || '')}</span></div>`, null, `Turno da ${t.toLowerCase()}`)).join('');
}

// ================= ALUNO =================
function aInicio() {
  const a = me(); const mg = mediaGeral(a.id);
  const ats = DADOS.atividades.filter(x => x.turmaId === a.turmaId && x.prazo >= TODAY_ISO && !DADOS.entregas.some(e => e.atividadeId === x.id && e.alunoId === a.id)).sort((x, y) => x.prazo.localeCompare(y.prazo));
  const prova = DADOS.eventos.filter(e => e.data >= TODAY_ISO && e.tipo === 'Avaliação').sort((x, y) => x.data.localeCompare(y.data))[0];
  const sugest = { 'Baixa visão': 'baixa', 'Deficiência visual': 'cegueira', 'Daltonismo': 'contraste' }[a.acess];
  const isDefault = JSON.stringify(Object.assign({}, A, { theme: 'system' })) === JSON.stringify(Object.assign({}, A_DEFAULT, { theme: 'system' }));
  return `<header class="ph"><div><h1 id="page-title" tabindex="-1" class="hello">Bem-vindo de volta, ${esc(firstName(a.nome))}!</h1>${FIO_TITULO}<p class="lead">${esc(turmaLong(a.turmaId))}. Acompanhe suas notas, faltas e entregas em um só lugar.</p></div><div class="ph-actions"><button class="btn primary" data-act="go" data-route="boletim">${icon('pencil')}Ver boletim</button></div></header>` +
    fioDia(DADOS.aulas.filter(x => x.turmaId === a.turmaId), 'aluno') +
    (sugest && isDefault ? `<section class="card" style="background:var(--bg-brand-subtle);border-color:transparent" aria-labelledby="sug-h"><div class="row sp"><div><h2 id="sug-h" style="font-size:1.125rem">Seu cadastro indica ${esc(a.acess.toLowerCase())}</h2><p class="muted">Podemos aplicar o modo recomendado: ${esc(PRESETS[sugest][0].toLowerCase())}. Você pode mudar depois em Acessibilidade.</p></div><button class="btn primary" data-act="preset-need" data-id="${sugest}">Aplicar modo recomendado</button></div></section>` : '') +
    `<section class="stats" aria-label="Seu resumo">
      ${statCard('rose', 'Média geral', `${num(mg)}<small> /10</small>`, mg != null && mg >= DADOS.config.mediaMin ? 'Acima da média mínima' : `Média mínima: ${num(DADOS.config.mediaMin)}`, 'boletim')}
      ${statCard('mint', 'Aulas hoje', DADOS.aulas.filter(x => x.turmaId === a.turmaId && x.dia === TODAY.getDay()).length, TODAY.getDay() % 6 ? esc(DAYS[TODAY.getDay()]) : 'Fim de semana', 'horario')}
      ${statCard('peri', 'Próximas entregas', ats.length, ats[0] ? `${esc(ats[0].titulo)}, ${fmtD(ats[0].prazo)}` : 'Nada pendente', 'atividades')}
      ${statCard('peach', 'Próxima avaliação', prova ? fmtD(prova.data).slice(0, 5) : '—', prova ? esc(prova.titulo) : 'Nenhuma marcada', 'calendario')}
    </section>
    ${hrowOpen('painel-aluno')}
      <section class="card c8" aria-labelledby="perf-h"><div class="card-h"><h2 id="perf-h">Seu desempenho</h2><button class="btn ghost sm" data-act="go" data-route="boletim">Ver boletim</button></div>${perfChart(a.id)}</section>
      <section class="card c4" aria-labelledby="ent-h"><div class="card-h"><h2 id="ent-h">Entregas pendentes</h2><button class="btn ghost sm" data-act="go" data-route="atividades">Ver todas</button></div>${ats.length ? `<ul class="list">${ats.map(x => { const n = daysUntil(x.prazo); return `<li><span class="grow"><span class="t">${esc(x.titulo)}</span><br><span class="m">${esc(discNome(x.disciplinaId))}, ${n === 0 ? 'vence hoje' : n === 1 ? 'vence amanhã' : 'vence em ' + n + ' dias'}</span></span><button class="btn outline sm" data-act="entregar" data-id="${x.id}" aria-label="Entregar ${esc(x.titulo)}">Entregar</button></li>`; }).join('')}</ul>` : '<p class="empty">Nenhuma entrega pendente.</p>'}</section>
      <section class="card c4" aria-labelledby="com-h"><div class="card-h"><h2 id="com-h">Comunicados</h2><button class="btn ghost sm" data-act="go" data-route="comunicados">Ver todos</button></div><ul class="list">${visibleCom().sort((x, y) => y.data.localeCompare(x.data)).slice(0, 3).map(c => `<li><span class="grow"><span class="t">${esc(c.titulo)}</span><br><span class="m">${esc(c.autor)}, ${fmtD(c.data)}</span></span></li>`).join('')}</ul></section>
      <section class="card c4" aria-labelledby="pev-h"><div class="card-h"><h2 id="pev-h">Próximos eventos</h2><button class="btn ghost sm" data-act="go" data-route="calendario">Calendário</button></div><ul class="list">${DADOS.eventos.filter(e => e.data >= TODAY_ISO).sort((x, y) => x.data.localeCompare(y.data)).slice(0, 4).map(e => evItem(e)).join('')}</ul></section>
    </div>`;
}
function aBoletim() {
  const a = me();
  return pageHead('Meu boletim', `${esc(turmaLong(a.turmaId))}, Ano letivo ${DADOS.config.anoLetivo}. Média mínima ${num(DADOS.config.mediaMin)}.`, `<button class="btn outline" data-act="speak" data-text="${esc(boletimFala(a.id))}">${icon('volume')}Ouvir boletim</button>`) +
    `<div class="grid g2"><section class="card" aria-labelledby="bp-h"><h2 id="bp-h">Média geral por bimestre</h2>${perfChart(a.id)}</section><section class="card" aria-labelledby="bd-h"><h2 id="bd-h">Média por disciplina</h2>${bars(discsDaTurma(a.turmaId).map(d => [discNome(d), mediaDisc(a.id, d)]), 10, v => num(v), DADOS.config.mediaMin)}<p class="caption">Barras em vermelho estão abaixo da média mínima (${num(DADOS.config.mediaMin)}).</p></section></div>` +
    boletimTable(a.id, `Notas por bimestre — ${DADOS.config.bimestreAtual}º bimestre em andamento`);
}
function aAtividades() {
  const a = me();
  const list = DADOS.atividades.filter(x => x.turmaId === a.turmaId).sort((x, y) => y.prazo.localeCompare(x.prazo));
  const card = x => {
    const e = DADOS.entregas.find(z => z.atividadeId === x.id && z.alunoId === a.id); const n = daysUntil(x.prazo);
    const s = e ? (e.nota != null ? st(`Corrigida, nota ${num(e.nota)} de ${num(x.valor)}`, 'ok') : st('Entregue, aguardando correção', 'info')) : n < 0 ? st('Prazo encerrado', 'err') : n <= 2 ? st(n === 0 ? 'Vence hoje' : n === 1 ? 'Vence amanhã' : 'Vence em 2 dias', 'warn') : st(`Vence em ${n} dias`, 'neutral');
    return `<article class="act-card" aria-labelledby="at-${x.id}"><div class="top"><div><p class="disc">${esc(discNome(x.disciplinaId))}</p><h2 id="at-${x.id}" style="font-size:1.25rem">${esc(x.titulo)}</h2></div>${s}</div><p class="muted">${esc(x.descricao)}</p><div class="row sp"><span class="caption">${esc(profNome(x.professorId))}, Prazo ${fmtD(x.prazo)}, Vale ${num(x.valor)}</span>${n >= 0 || e ? `<button class="btn ${e ? 'ghost' : 'primary'} sm" data-act="entregar" data-id="${x.id}" aria-label="${e ? 'Ver entrega de' : 'Entregar'} ${esc(x.titulo)}">${e ? 'Ver entrega' : 'Entregar'}</button>` : ''}</div>${e?.feedback ? `<p class="quote">Comentário do professor: ${esc(e.feedback)}</p>` : ''}</article>`;
  };
  const pend = list.filter(x => !DADOS.entregas.some(e => e.atividadeId === x.id && e.alunoId === a.id) && x.prazo >= TODAY_ISO);
  const rest = list.filter(x => !pend.includes(x));
  return pageHead('Atividades', 'Tarefas das suas disciplinas. Entregue pelo portal e acompanhe a correção.') +
    `<section aria-labelledby="pd-h" class="grid"><h2 id="pd-h">Para entregar (${pend.length})</h2>${pend.length ? `<div class="grid g2">${pend.sort((x, y) => x.prazo.localeCompare(y.prazo)).map(card).join('')}</div>` : '<p class="empty">Nenhuma atividade pendente.</p>'}</section>
    <section aria-labelledby="ok-h" class="grid"><h2 id="ok-h">Entregues e encerradas</h2>${rest.length ? `<div class="grid g2">${rest.map(card).join('')}</div>` : '<p class="empty">Nada por aqui ainda.</p>'}</section>`;
}
function aSolicitacoes() {
  const list = DADOS.solicitacoes.filter(s => s.alunoId === SESSION.userId).sort((a, b) => b.data.localeCompare(a.data));
  return pageHead('Solicitações', 'Peça documentos, envie atestados ou solicite revisão de nota. A secretaria responde por aqui.', `<button class="btn primary" data-act="new" data-ent="solicitacao">${icon('plus')}Nova solicitação</button>`) +
    (list.length ? `<div class="feed">${list.map(s => `<article class="post" aria-labelledby="sl-${s.id}"><div class="row sp"><h2 id="sl-${s.id}" style="font-size:1.25rem">${esc(s.tipo)}</h2>${solHTML(s)}</div><p class="meta">Enviada em ${fmtD(s.data)}</p><p class="body">${esc(s.descricao)}</p>${s.resposta ? `<p class="quote"><b>Resposta da secretaria:</b> ${esc(s.resposta)}</p>` : ''}</article>`).join('')}</div>` : '<p class="empty">Você ainda não fez nenhuma solicitação.</p>');
}
function aPerfil() {
  const a = me(); const t = byId('turmas', a.turmaId);
  const sug = { 'Baixa visão': 'baixa', 'Deficiência visual': 'cegueira', 'Daltonismo': 'contraste' }[a.acess];
  return pageHead('Meu perfil', 'Seus dados cadastrais. Para corrigir nome ou data de nascimento, abra uma solicitação.') +
    `<div class="grid g2"><section class="card" aria-labelledby="pf-h"><div class="row"><span class="avatar lg" aria-hidden="true">${initials(a.nome)}</span><div><h2 id="pf-h">${esc(a.nome)}</h2><p class="muted">${esc(t?.serie || '')}, ${esc(t?.turno || '')}</p></div></div>
      <dl class="dl"><dt>Matrícula</dt><dd class="num">${esc(a.matricula)}</dd><dt>Turma</dt><dd>${esc(turmaLong(a.turmaId))}</dd><dt>Sala</dt><dd>${esc(t?.sala || '—')}</dd><dt>Nascimento</dt><dd>${fmtD(a.nascimento)}</dd><dt>Responsável</dt><dd>${esc(a.responsavel)}</dd></dl></section>
    <form class="card" data-form="perfil" novalidate aria-labelledby="ct-h"><h2 id="ct-h">Contato</h2><div class="form-grid"><div class="field"><label for="pf-email">E-mail</label><input id="pf-email" type="email" value="${esc(a.email)}" autocomplete="email"></div><div class="field"><label for="pf-tel">Telefone do responsável</label><input id="pf-tel" type="tel" value="${esc(a.telResp)}" autocomplete="tel"></div></div><div class="row"><button class="btn primary" type="submit">${icon('check')}Salvar contato</button></div></form>
    <section class="card" aria-labelledby="ac-h"><h2 id="ac-h">Acessibilidade</h2><p>${a.acess !== 'Nenhuma' ? `Necessidade registrada: <b>${esc(a.acess)}</b>. Seus professores recebem orientações para adaptar o material.` : 'Nenhuma necessidade registrada. Se precisar de adaptação, fale com a secretaria.'}</p><div class="row">${sug ? `<button class="btn primary" data-act="preset-need" data-id="${sug}">Aplicar modo recomendado</button>` : ''}<button class="btn outline" data-act="a11y">${icon('access')}Abrir painel de acessibilidade</button></div></section></div>`;
}

// ---------- Rotas ----------
const PAGES = {
  gestao: {
    inicio: gInicio, escolas: () => crudPage('escolas'), turmas: () => crudPage('turmas'), alunos: () => crudPage('alunos'), professores: () => crudPage('professores'), disciplinas: () => crudPage('disciplinas'),
    horarios: gHorarios, boletins: gBoletins, frequencia: gFrequencia, calendario: () => pageHead('Calendário escolar', 'Feriados, avaliações, reuniões e prazos da escola. Selecione um dia para adicionar um evento ou um evento para editá-lo.', `<button class="btn primary" data-act="new" data-ent="eventos">${icon('plus')}Adicionar evento</button>`) + calendarView(true), comunicados: () => crudPage('comunicados'),
    solicitacoes: gSolicitacoes, ocorrencias: () => crudPage('ocorrencias'), relatorios: gRelatorios, config: gConfig
  },
  professor: {
    inicio: pInicio, turmas: pTurmas, notas: pNotas, chamada: pChamada, atividades: () => crudPage('atividades'), ocorrencias: () => crudPage('ocorrenciasProf'), horario: pHorario,
    calendario: () => pageHead('Calendário escolar', 'Avaliações, reuniões, feriados e prazos da escola.') + calendarView(false),
    comunicados: () => pageHead('Comunicados', 'Avisos da escola e das suas turmas.', `<button class="btn primary" data-act="new" data-ent="comunicadosProf">${icon('plus')}Novo comunicado para turma</button>`) + feed(visibleCom(), 'comunicadosProf')
  },
  aluno: {
    inicio: aInicio, boletim: aBoletim, atividades: aAtividades,
    horario: () => { const t = byId('turmas', me().turmaId); return pageHead('Meu horário', `${esc(turmaLong(t.id))}, ${esc(t.sala || '')}`) + gradeTable(DADOS.aulas.filter(a => a.turmaId === t.id), t.turno, a => `<div class="slot"><b>${esc(discNome(a.disciplinaId))}</b><span>${esc(profNome(a.professorId))}</span></div>`, null, 'Horário semanal'); },
    calendario: () => pageHead('Calendário escolar', 'Provas, reuniões, feriados e eventos da escola.') + calendarView(false),
    comunicados: () => pageHead('Comunicados', 'Avisos da escola e dos seus professores.') + feed(visibleCom()),
    solicitacoes: aSolicitacoes, perfil: aPerfil
  }
};

// ---------- Início ----------

