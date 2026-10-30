/* Grade horária montada pela turma: colunas por dia, faixas de horário em cada coluna, e uma segunda visão por professor. */
'use strict';

const horaCurta = h => (h || '').replace(/^0/, '').replace(':', 'h').replace(/h00$/, 'h');
const lotadoNaEscola = (p, escolaId) => DADOS.lotacoes.some(l => l.professorId === p.id && l.escolaId === escolaId && lotacaoAtiva(l));
const profsPara = (d, escolaId) => DADOS.professores.filter(p => ativo(p) && habilitadas(p).includes(d) && lotadoNaEscola(p, escolaId));

async function telaGrade() {
  const v = UI.sel.gVisao || 'turma';
  return pageHead('Grade horária', 'Escolha a turma e monte a semana. Cada disciplina mostra só os professores habilitados e lotados na escola.') +
    `<fieldset class="field"><legend class="lbl">Ver a grade por</legend><div class="seg">${[['turma', 'Turma'], ['professor', 'Professor']].map(([k, l]) => `<label><input type="radio" id="gv-${k}" name="gvisao" value="${k}" data-change="gVisao" ${v === k ? 'checked' : ''}>${l}</label>`).join('')}</div></fieldset>` + (v === 'turma' ? gradeTurma() : gradeProfessor());
}
CHG.gVisao = el => { UI.sel.gVisao = el.value; rerender(); };
CHG.gTurma = el => { UI.sel.hTurma = el.value; rerender(); };
CHG.gProf = el => { UI.sel.gProf = el.value; rerender(); };

function pendenciasTurma(t) {
  const m = (DADOS.matrizes || []).find(x => x.cursoId === t.cursoId); const num0 = (t.serie.match(/\d/) || [''])[0];
  const serie = m?.series.find(s => (s.nome.match(/\d/) || [''])[0] === num0);
  if (!serie) return null;
  const sem = DADOS.config.semanasLetivas || 40;
  return serie.componentes.map(c => {
    const d = DADOS.disciplinas.find(x => norm(x.nome) === norm(c.nome)); const previstas = Math.ceil(c.cargaHoraria / sem);
    const aulas = d ? DADOS.aulas.filter(a => a.turmaId === t.id && a.disciplinaId === d.id) : [];
    const semProf = aulas.filter(a => !ativo(byId('professores', a.professorId))).length;
    return { nome: c.nome, ch: c.cargaHoraria, previstas, lancadas: aulas.length, semProf };
  }).filter(x => x.lancadas < x.previstas || x.semProf);
}
function gradeTurma() {
  if (!turmasEsc().some(t => t.id === UI.sel.hTurma)) UI.sel.hTurma = turmasEsc()[0]?.id;
  const t = byId('turmas', UI.sel.hTurma); if (!t) return '<p class="empty">Cadastre uma turma para montar a grade.</p>';
  const faixas = faixasDe(t.turno); const aulas = DADOS.aulas.filter(a => a.turmaId === t.id); const pend = pendenciasTurma(t);
  const pode = SESSION.role === 'gestao';
  const cel = (d, s) => { const a = aulas.find(x => x.dia === d && x.slot === s); const rot = `${DAYS[d]}, ${s + 1}º horário`;
    if (!a) return pode ? `<button class="kan-add" data-act="aula-form" data-dia="${d}" data-slot="${s}" aria-label="Adicionar aula: ${rot}">${icon('plus')}</button>` : '<span class="muted">Livre</span>';
    const p = byId('professores', a.professorId);
    return `<div class="kan-aula"><b>${esc(discNome(a.disciplinaId))}</b><span>${ativo(p) ? esc(p.nome) : `<span class="st warn">${icon('warnc')}Sem professor</span>`}</span>${pode ? `<div class="kan-acts"><button class="icon-btn" data-act="aula-form" data-id="${a.id}" data-dia="${d}" data-slot="${s}" aria-label="Editar ${esc(discNome(a.disciplinaId))}, ${rot}">${icon('pencil')}</button><button class="icon-btn" data-act="aula-del" data-id="${a.id}" aria-label="Remover ${esc(discNome(a.disciplinaId))}, ${rot}">${icon('trash')}</button></div>` : ''}</div>`; };
  return `<div class="toolbar">${selectCtl('g-turma', 'Turma', optTurmas(), t.id, 'gTurma')}<p class="muted" style="padding-bottom:.75rem">${aulas.length} aulas na semana, turno da ${esc(t.turno.toLowerCase())}</p></div>
    <div class="kanban">${DIAS.map(([d, l]) => `<section class="kan-col" aria-label="${l}"><h2>${l.split('-')[0]}</h2>${faixas.map((f, s) => `<div class="kan-slot"><span class="kan-h">${s + 1}º horário, ${horaCurta(f.inicio)}</span>${cel(d, s)}</div>`).join('')}</section>`).join('')}</div>
    <section class="card" aria-labelledby="pd-h"><h2 id="pd-h">Falta preencher</h2>${pend == null ? '<p class="empty">Este curso ainda não tem matriz para esta série. O DED cadastra em Gestão de matrizes.</p>' : pend.length ? `<div class="tbl-wrap"><table class="tbl stack"><thead><tr><th scope="col">Disciplina</th><th scope="col" class="n">Na matriz</th><th scope="col" class="n">Aulas por semana</th><th scope="col">Situação</th></tr></thead><tbody>${pend.map(x => `<tr><th scope="row">${esc(x.nome)}</th><td class="n" data-label="Na matriz">${x.ch} h no ano</td><td class="n" data-label="Aulas por semana">${x.lancadas} de ${x.previstas}</td><td data-label="Situação">${x.semProf ? st(`${x.semProf} sem professor`, 'err') : st(`Faltam ${x.previstas - x.lancadas}`, 'warn')}</td></tr>`).join('')}</tbody></table></div><p class="caption">Aulas por semana = carga anual da matriz dividida por ${DADOS.config.semanasLetivas || 40} semanas letivas.</p>` : '<p class="empty">Todas as disciplinas da matriz estão com professor e carga completa.</p>'}</section>`;
}
function gradeProfessor() {
  const profs = DADOS.professores.filter(p => naEscola(p.escolaId) || DADOS.lotacoes.some(l => l.professorId === p.id && naEscola(l.escolaId) && lotacaoAtiva(l))).sort((a, b) => a.nome.localeCompare(b.nome));
  if (!profs.some(p => p.id === UI.sel.gProf)) UI.sel.gProf = profs[0]?.id;
  const p = byId('professores', UI.sel.gProf); if (!p) return '<p class="empty">Nenhum professor nesta escola.</p>';
  const aulas = DADOS.aulas.filter(a => a.professorId === p.id); const ch = (p.vinculos || []).filter(vinculoAtivo).reduce((n, v) => n + v.cargaHoraria, 0); const dif = ch - aulas.length;
  const ind = dif === 0 ? st('Completo', 'ok') : dif < 0 ? st(`Sobrecarga de ${-dif} h`, 'err') : st(`${dif} h sobrando`, 'warn');
  const turnos = uniq(aulas.map(a => byId('turmas', a.turmaId)?.turno));
  return `<div class="toolbar">${selectCtl('g-prof', 'Professor', profs.map(x => [x.id, x.nome]), p.id, 'gProf')}</div>
    <section class="card" aria-labelledby="ch-h"><div class="card-h"><h2 id="ch-h">${aulas.length} h alocadas de ${ch} h do vínculo</h2>${ind}</div><span class="bar-track" style="display:block" aria-hidden="true"><span class="bar-fill ${dif < 0 ? 'low' : ''}" style="display:block;width:${Math.min(100, aulas.length / (ch || 1) * 100)}%"></span></span></section>
    ${turnos.length ? turnos.map(t => gradeTable(aulas.filter(a => byId('turmas', a.turmaId)?.turno === t), t, a => `<div class="slot"><b>${esc(discNome(a.disciplinaId))}</b><span>${esc(turmaNome(a.turmaId))}</span></div>`, null, `Turno da ${t.toLowerCase()}`)).join('') : '<p class="empty">Este professor ainda não tem aulas na grade.</p>'}`;
}

// ---------- Adicionar ou editar aula ----------
function opcoesProf(d, escolaId, atual) {
  const lista = d ? profsPara(d, escolaId) : [];
  return `<option value="">${!d ? 'Escolha a disciplina primeiro' : lista.length ? 'Selecione…' : 'Nenhum professor habilitado e lotado nesta escola'}</option>${lista.map(p => `<option value="${p.id}" ${p.id === atual ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}`;
}
ACT['aula-form'] = el => {
  const t = byId('turmas', UI.sel.hTurma); const dia = Number(el.dataset.dia), slot = Number(el.dataset.slot); const a = el.dataset.id ? byId('aulas', el.dataset.id) : null;
  openDialog({ title: a ? 'Editar aula' : 'Adicionar aula', body: `<p class="muted">${esc(t.nome)}, ${DAYS[dia]}, ${slot + 1}º horário (${slotRange(t.turno, slot)})</p>
      <div class="field"><label for="ga-d">Disciplina <span class="req" aria-hidden="true">*</span></label><select id="ga-d" required data-change="gaDisc" data-esc="${t.escolaId}"><option value="">Selecione…</option>${DADOS.disciplinas.slice().sort((x, y) => x.nome.localeCompare(y.nome)).map(d => `<option value="${d.id}" ${d.id === a?.disciplinaId ? 'selected' : ''}>${esc(d.nome)}</option>`).join('')}</select></div>
      <div class="field"><label for="ga-p">Professor <span class="req" aria-hidden="true">*</span></label><select id="ga-p" required>${opcoesProf(a?.disciplinaId, t.escolaId, a?.professorId)}</select><p class="help">Aparecem só os habilitados na disciplina, pela formação, e lotados nesta escola.</p></div>
      <p class="err-msg" id="ga-erro" role="alert" hidden></p>`,
    onSubmit: () => {
      const v = { turmaId: t.id, disciplinaId: $('#ga-d').value, professorId: $('#ga-p').value, dia, slot };
      const erro = ENT.aulas.check(v, a?.id);
      if (erro) { const box = $('#ga-erro'); box.textContent = erro; box.hidden = false; alertSR(erro); return false; }
      servico('aulas').salvar(Object.assign({}, a || {}, v)).then(() => { closeDialog(); rerender(); toast('Aula salva na grade.'); }).catch(e => toast(e.message, 'err'));
      return false;
    } });
};
CHG.gaDisc = el => { $('#ga-p').innerHTML = opcoesProf(el.value, el.dataset.esc, ''); };
ACT['aula-del'] = el => { const a = byId('aulas', el.dataset.id); confirmBox('Remover aula', `Remover <b>${esc(discNome(a.disciplinaId))}</b> deste horário?`, () => servico('aulas').remover(a.id).then(() => { rerender(); toast('Aula removida.'); }), 'Remover'); };

// Regras de conflito e lotação valem em qualquer gravação de aula
const aulaCheckBase = ENT.aulas.check;
ENT.aulas.check = (v, id) => {
  const dupla = DADOS.aulas.find(a => a.id !== id && a.turmaId === v.turmaId && a.dia === v.dia && a.slot === v.slot);
  if (dupla) return `A turma ${turmaNome(v.turmaId)} já tem ${discNome(dupla.disciplinaId)} com ${profNome(dupla.professorId)} neste horário.`;
  const erro = aulaCheckBase(v, id); if (erro) return erro;
  const t = byId('turmas', v.turmaId); const p = byId('professores', v.professorId);
  if (p && t && !lotadoNaEscola(p, t.escolaId)) return `${p.nome} não está lotado(a) nesta escola. Faça a lotação em Gerir lotações.`;
  return '';
};
PAGES.gestao.horarios = telaGrade;
