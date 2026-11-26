/* Grade horária montada pela turma: colunas por dia, faixas de horário em cada coluna, e uma segunda visão por professor. */
'use strict';

const horaCurta = h => (h || '').replace(/^0/, '').replace(':', 'h').replace(/h00$/, 'h');
const lotadoNaEscola = (p, escolaId) => DADOS.lotacoes.some(l => l.professorId === p.id && l.escolaId === escolaId && lotacaoAtiva(l));
const profsPara = (d, escolaId) => DADOS.professores.filter(p => ativo(p) && habilitadas(p).includes(d) && lotadoNaEscola(p, escolaId));

async function telaGrade() {
  const v = UI.sel.gVisao || 'turma';
  return pageHead('Grade horária', SESSION.role === 'professor' ? 'Consulta da grade. Quem monta o horário é a Secretaria escolar.' : 'Escolha a turma e distribua as aulas da matriz pela semana: arraste cada caixinha para o dia e o horário. O professor aparece filtrado pela disciplina e pela lotação na escola.') +
    `<fieldset class="field"><legend class="lbl">Ver a grade por</legend><div class="seg">${[['turma', 'Turma'], ['professor', 'Professor']].map(([k, l]) => `<label><input type="radio" id="gv-${k}" name="gvisao" value="${k}" data-change="gVisao" ${v === k ? 'checked' : ''}>${l}</label>`).join('')}</div></fieldset>` + (v === 'turma' ? gradeTurma() : gradeProfessor());
}
CHG.gVisao = el => { UI.sel.gVisao = el.value; rerender(); };
CHG.gTurma = el => { UI.sel.hTurma = el.value; rerender(); };
CHG.gProf = el => { UI.sel.gProf = el.value; rerender(); };

// ---------- Caixinhas de aulas a partir da matriz ----------
function serieDaTurma(t) {
  const m = (DADOS.matrizes || []).find(x => x.cursoId === t.cursoId); const num0 = (t.serie.match(/\d/) || [''])[0];
  return m?.series.find(s => s.id === t.serieId) || m?.series.find(s => (s.nome.match(/\d/) || [''])[0] === num0) || null;
}
/** Aulas por semana do componente: o valor da matriz (DED) ou, se ainda não foi informado, a carga anual ÷ semanas letivas. */
const aulasSemanaComp = c => Number(c.aulasPorSemana) || Math.max(1, Math.ceil((Number(c.cargaHoraria) || 0) / (DADOS.config.semanasLetivas || 40)));
/** Uma linha por componente da matriz: quantas aulas por semana, quantas já estão na grade, quantas faltam. */
function caixinhasTurma(t) {
  const s = serieDaTurma(t); if (!s) return null;
  const aulas = DADOS.aulas.filter(a => a.turmaId === t.id);
  return s.componentes.map(c => {
    const d = DADOS.disciplinas.find(x => norm(x.nome) === norm(c.nome)); const total = aulasSemanaComp(c);
    const naGrade = d ? aulas.filter(a => a.disciplinaId === d.id) : [];
    return { nome: c.nome, d: d?.id || '', total, usadas: naGrade.length, restantes: Math.max(0, total - naGrade.length), semProf: naGrade.filter(a => !ativo(byId('professores', a.professorId))).length, informado: !!Number(c.aulasPorSemana) };
  });
}
const podeMontarGrade = t => ['gestao', 'diretor'].includes(SESSION.role) && can('grade.montar') && notasAbertas(t);

function gradeTurma() {
  if (!turmasEsc().some(t => t.id === UI.sel.hTurma)) UI.sel.hTurma = turmasEsc()[0]?.id;
  const t = byId('turmas', UI.sel.hTurma); if (!t) return '<p class="empty">Cadastre uma turma para montar a grade.</p>';
  const faixas = faixasDe(t.turno); const aulas = DADOS.aulas.filter(a => a.turmaId === t.id);
  const cx = caixinhasTurma(t); const pode = podeMontarGrade(t);
  const faltam = cx ? cx.reduce((n, c) => n + c.restantes, 0) : null;
  const sel = cx?.find(c => c.d && c.d === UI.sel.cxSel && c.restantes > 0);
  if (!sel) UI.sel.cxSel = '';
  const indicador = cx == null ? st('Sem matriz para esta série', 'neutral') : faltam === 0 ? st('Grade completa', 'ok') : st(`Faltam ${faltam} aula${faltam > 1 ? 's' : ''}`, 'warn');
  const cel = (d, s) => { const a = aulas.find(x => x.dia === d && x.slot === s); const rot = `${DAYS[d]}, ${s + 1}º horário`;
    if (!a) return pode ? (sel ? `<button class="kan-add cx-alvo" data-act="cx-colocar" data-dia="${d}" data-slot="${s}" aria-label="Colocar ${esc(sel.nome)} em ${rot}">${icon('plus')}<span>Colocar aqui</span></button>` : '<span class="muted kan-livre">Livre</span>') : '<span class="muted">Livre</span>';
    const p = byId('professores', a.professorId);
    return `<div class="kan-aula"><b>${esc(discNome(a.disciplinaId))}</b><span>${ativo(p) ? esc(p.nome) : `<span class="st warn">${icon('warnc')}Sem professor</span>`}</span>${pode ? `<div class="kan-acts"><button class="icon-btn" data-act="aula-form" data-id="${a.id}" data-dia="${d}" data-slot="${s}" aria-label="Trocar o professor de ${esc(discNome(a.disciplinaId))}, ${rot}">${icon('pencil')}</button><button class="icon-btn" data-act="aula-del" data-id="${a.id}" aria-label="Tirar ${esc(discNome(a.disciplinaId))} de ${rot}. A aula volta para a lista">${icon('trash')}</button></div>` : ''}</div>`; };
  const lista = cx == null ? '<p class="empty">Este curso ainda não tem matriz para esta série. O DED cadastra em Gestão de matrizes.</p>'
    : `<ul class="cx-lista" role="list">${cx.slice().sort((x, y) => (y.restantes > 0) - (x.restantes > 0)).map(c => `<li class="cx-comp${c.restantes ? '' : ' feito'}"><div class="cx-cab"><b>${esc(c.nome)}</b><span class="caption">${c.restantes ? `${c.restantes} de ${c.total} restante${c.restantes > 1 ? 's' : ''}` : `${c.total} de ${c.total} na grade`}${c.informado ? '' : ', estimado pela carga anual'}</span></div>
        ${!c.d ? `<p class="caption">${st('Componente sem disciplina cadastrada', 'err')}</p>` : pode && c.restantes ? `<div class="cx-pilha">${Array.from({ length: c.restantes }, (_, i) => `<button type="button" class="cx${UI.sel.cxSel === c.d && i === 0 ? ' on' : ''}" draggable="true" data-cx="${c.d}" data-act="cx-sel" aria-pressed="${UI.sel.cxSel === c.d && i === 0}" aria-label="${esc(c.nome)}, aula ${c.usadas + i + 1} de ${c.total}. Arraste para um horário ou toque para escolher">${esc(c.nome)}</button>`).join('')}</div>` : ''}
        ${c.semProf ? `<p class="caption">${st(`${c.semProf} aula${c.semProf > 1 ? 's' : ''} sem professor`, 'err')}</p>` : ''}</li>`).join('')}</ul>`;
  const extras = cx ? aulas.filter(a => !cx.some(c => c.d === a.disciplinaId)) : [];
  return `<div class="toolbar">${selectCtl('g-turma', 'Turma', optTurmas(), t.id, 'gTurma')}<p class="muted" style="padding-bottom:.75rem">${aulas.length} aulas na semana, turno da ${esc(t.turno.toLowerCase())}. ${indicador}</p></div>
    ${pode || !['gestao', 'diretor'].includes(SESSION.role) ? '' : `<p class="notice">${icon('lock')}${t.finalizada ? 'Esta turma já foi finalizada.' : !notasAbertas(t) ? `O ano letivo ${t.ano} está encerrado.` : 'Seu perfil só consulta a grade.'} A grade fica só para consulta.</p>`}
    <div class="grade-montar${pode ? '' : ' so-ver'}">
      ${pode || cx ? `<section class="card cx-painel" aria-labelledby="cx-h"><div class="card-h"><h2 id="cx-h">Aulas a distribuir</h2>${indicador}</div>
        ${pode ? `<p class="caption">${sel ? `<b>${esc(sel.nome)}</b> escolhida. Toque em "Colocar aqui" no horário. <button class="link-btn" data-act="cx-sel" data-cx="">Cancelar</button>` : 'Arraste uma caixinha para o dia e o horário. No celular, toque na caixinha e depois em "Colocar aqui".'} Cada componente tem as aulas por semana da matriz.</p>` : ''}
        ${lista}${extras.length ? `<p class="caption">${st(`${extras.length} aula${extras.length > 1 ? 's' : ''} de disciplina fora da matriz`, 'warn')}</p>` : ''}</section>` : ''}
      <div class="kanban" id="kanban">${DIAS.map(([d, l]) => `<section class="kan-col" aria-label="${l}"><h2>${l.split('-')[0]}</h2>${faixas.map((f, s) => `<div class="kan-slot${aulas.some(x => x.dia === d && x.slot === s) ? '' : ' vazio'}" ${pode ? `data-drop data-dia="${d}" data-slot="${s}"` : ''}><span class="kan-h">${s + 1}º horário, ${horaCurta(f.inicio)}</span>${cel(d, s)}</div>`).join('')}</section>`).join('')}</div>
    </div>`;
}

// Escolher a caixinha (clique, toque ou teclado) e colocar no horário
ACT['cx-sel'] = el => { UI.sel.cxSel = UI.sel.cxSel === el.dataset.cx ? '' : el.dataset.cx; rerender().then(() => { const b = UI.sel.cxSel ? $('.cx-alvo') : $(`.cx[data-cx="${el.dataset.cx}"]`); b?.focus(); }); };
ACT['cx-colocar'] = el => colocarAula(UI.sel.cxSel, Number(el.dataset.dia), Number(el.dataset.slot));
/** Ao soltar a caixinha: confere conflito da turma, filtra os professores e grava (direto, se houver só um). */
function colocarAula(did, dia, slot) {
  const t = byId('turmas', UI.sel.hTurma); if (!t || !did) return;
  const rot = `${DAYS[dia]}, ${slot + 1}º horário`; const nome = discNome(did);
  const recusa = msg => { toast(msg, 'err'); alertSR(msg); };
  const ocupada = DADOS.aulas.find(a => a.turmaId === t.id && a.dia === dia && a.slot === slot);
  if (ocupada) return recusa(`Não dá para colocar ${nome} em ${rot}: a turma já tem ${discNome(ocupada.disciplinaId)} nesse horário.`);
  const c = caixinhasTurma(t)?.find(x => x.d === did); if (c && c.restantes <= 0) return recusa(`${nome} já tem as ${c.total} aulas da matriz na grade.`);
  const profs = profsPara(did, t.escolaId);
  if (!profs.length) return recusa(`Nenhum professor habilitado em ${nome} está lotado nesta escola. Peça a lotação ao RH.`);
  const ocupado = p => DADOS.aulas.find(a => a.professorId === p.id && a.dia === dia && a.slot === slot && byId('turmas', a.turmaId)?.turno === t.turno);
  const gravar = pid => { const v = { turmaId: t.id, disciplinaId: did, professorId: pid, dia, slot }; const erro = ENT.aulas.check(v);
    if (erro) { recusa(erro); return Promise.resolve(false); }
    return servico('aulas').salvar(v).then(() => { const r = c ? c.restantes - 1 : 0; if (!r) UI.sel.cxSel = ''; rerender(); toast(`${nome} com ${profNome(pid)} em ${rot}.${r ? ` Faltam ${r} de ${nome}.` : ''}`); return true; }).catch(e => { recusa(e.message); return false; }); };
  if (profs.length === 1) return gravar(profs[0].id);
  const livre = profs.find(p => !ocupado(p));
  openDialog({ title: `${nome}, ${rot}`, body: `<p class="muted">${esc(t.nome)}. Aparecem os professores habilitados em ${esc(nome)} e lotados nesta escola.</p>
      <fieldset class="field"><legend class="lbl">Professor</legend><div class="opts">${profs.map(p => { const o = ocupado(p); return `<label class="opt-row"><input type="radio" name="cx-prof" value="${p.id}" ${o ? 'disabled' : ''} ${p === livre ? 'checked' : ''}><span><b>${esc(p.nome)}</b>${o ? `: já está na turma ${esc(turmaNome(o.turmaId))} nesse horário` : ''}</span></label>`; }).join('')}</div></fieldset>
      ${livre ? '' : '<p class="quote">Todos os professores dessa disciplina já têm aula nesse horário. Escolha outro horário.</p>'}<p class="err-msg" id="cx-erro" role="alert" hidden></p>`,
    onSubmit: () => { const pid = $('input[name="cx-prof"]:checked')?.value; if (!pid) { const b = $('#cx-erro'); b.textContent = 'Escolha um professor livre nesse horário.'; b.hidden = false; return false; } closeDialog(); gravar(pid); return false; } });
}
// Arrastar e soltar (HTML5, sem biblioteca). No toque, vale o "toque e coloque" acima.
document.addEventListener('dragstart', e => { const c = e.target.closest?.('[data-cx]'); if (!c) return; e.dataTransfer.setData('text/plain', c.dataset.cx); e.dataTransfer.effectAllowed = 'move'; c.classList.add('arrastando'); });
document.addEventListener('dragend', e => { e.target.closest?.('[data-cx]')?.classList.remove('arrastando'); $$('.kan-slot.sobre').forEach(x => x.classList.remove('sobre')); });
document.addEventListener('dragover', e => { const s = e.target.closest?.('[data-drop]'); if (!s) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; s.classList.add('sobre'); });
document.addEventListener('dragleave', e => { const s = e.target.closest?.('[data-drop]'); if (s && !s.contains(e.relatedTarget)) s.classList.remove('sobre'); });
document.addEventListener('drop', e => { const s = e.target.closest?.('[data-drop]'); if (!s) return; e.preventDefault(); s.classList.remove('sobre'); colocarAula(e.dataTransfer.getData('text/plain'), Number(s.dataset.dia), Number(s.dataset.slot)); });

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
PAGES.diretor.horarios = telaGrade;

// Atalho no painel da Secretaria escolar e do Diretor: onde montar a grade e o que falta
function cardGradePainel() {
  const ts = turmasEsc().filter(t => notasAbertas(t)); if (!ts.length) return '';
  const linhas = ts.map(t => ({ t, cx: caixinhasTurma(t) })).map(x => ({ ...x, faltam: x.cx ? x.cx.reduce((n, c) => n + c.restantes, 0) : null }));
  const pend = linhas.filter(x => x.faltam !== 0);
  return `<section class="card" aria-labelledby="pg-h"><div class="card-h"><h2 id="pg-h">Grade horária</h2><button class="btn ${pend.length ? 'primary' : 'outline'} sm" data-act="go" data-route="horarios">${icon('clock')}${can('grade.montar') ? 'Montar grade horária' : 'Ver grade horária'}</button></div>
    <p class="muted">${linhas.length - pend.length} de ${linhas.length} turma${linhas.length > 1 ? 's' : ''} com a grade completa. A grade é montada aqui, pela escola; o professor só consulta a dele.</p>
    ${pend.length ? `<ul class="list">${pend.slice(0, 4).map(x => `<li><span class="grow"><span class="t">${esc(x.t.nome)}</span><br><span class="m">${x.faltam == null ? 'Sem matriz para a série' : `Faltam ${x.faltam} aula${x.faltam > 1 ? 's' : ''}`}</span></span><button class="btn ghost sm" data-act="grade-turma" data-id="${x.t.id}" aria-label="Montar a grade de ${esc(x.t.nome)}">Montar</button></li>`).join('')}</ul>` : ''}</section>`;
}
ACT['grade-turma'] = el => { UI.sel.hTurma = el.dataset.id; UI.sel.gVisao = 'turma'; go('horarios'); };
// Insere o atalho logo depois dos indicadores do início
['gestao', 'diretor'].forEach(r => {
  const orig = PAGES[r].inicio;
  PAGES[r].inicio = async (...a) => { const h = await orig(...a); const c = cardGradePainel(); if (!c) return h;
    const i = h.indexOf('class="stats"'); const j = i < 0 ? -1 : h.indexOf('</section>', i);
    return j < 0 ? h + c : h.slice(0, j + 10) + c + h.slice(j + 10); };
});
