/* Diário do professor: aulas do dia (vindas da grade), frequência, conteúdo e resumo com o cálculo explicado. */
'use strict';

function telaDiario() {
  const data = UI.sel.diaData || TODAY_ISO; const dia = dOf(data).getDay();
  const aulas = myAulas().filter(a => a.dia === dia).sort((x, y) => x.slot - y.slot);
  if (!aulas.some(a => a.id === UI.sel.diaAula)) UI.sel.diaAula = aulas[0]?.id;
  const a = aulas.find(x => x.id === UI.sel.diaAula);
  const reg = x => DADOS.chamadas.find(c => c.turmaId === x.turmaId && c.disciplinaId === x.disciplinaId && c.data === data && (c.slot === x.slot || c.slot == null));
  const lista = aulas.length ? `<ul class="list">${aulas.map(x => `<li class="${x.id === a?.id ? 'dest' : ''}"><span class="time">${esc(slotRange(byId('turmas', x.turmaId)?.turno, x.slot))}</span><span class="grow"><span class="t">${esc(discNome(x.disciplinaId))}</span><br><span class="m">${esc(turmaNome(x.turmaId))}</span></span>${reg(x) ? st('Registrada', 'ok') : ''}<button class="btn ${x.id === a?.id ? 'primary' : 'outline'} sm" data-act="dia-aula" data-id="${x.id}" aria-label="Abrir ${esc(discNome(x.disciplinaId))}, ${esc(turmaNome(x.turmaId))}">${x.id === a?.id ? 'Aberta' : 'Abrir'}</button></li>`).join('')}</ul>` : '<p class="empty">Nenhuma aula neste dia na sua grade.</p>';
  let corpo = '';
  if (a) {
    const al = alunosDaTurma(a.turmaId); const c = reg(a); const fl = c ? c.faltas : [];
    const hist = DADOS.chamadas.filter(x => x.turmaId === a.turmaId && x.disciplinaId === a.disciplinaId);
    corpo = `<form id="chamada-form" data-form="diario" novalidate class="card" aria-labelledby="dc-h"><div class="card-h"><h2 id="dc-h">Frequência: ${esc(discNome(a.disciplinaId))}, ${esc(turmaNome(a.turmaId))}</h2></div>
      <div class="row sp"><p id="pres-count" aria-live="polite" class="muted">${al.length - fl.length} presentes e ${fl.length} falta${fl.length === 1 ? '' : 's'}</p><button type="button" class="btn ghost sm" data-act="marcar-todos">Marcar todos presentes</button></div>
      <ul class="list">${al.map(x => `<li><span class="avatar" aria-hidden="true">${initials(x.nome)}</span><span class="grow"><span class="t" id="nm-${x.id}">${esc(x.nome)}</span></span><fieldset aria-labelledby="nm-${x.id}"><div class="seg presence">${['P', 'F'].map(v => `<label><input type="radio" name="p-${x.id}" value="${v}" data-change="pres" ${(v === 'F') === fl.includes(x.id) ? 'checked' : ''}>${v === 'P' ? 'Presente' : 'Falta'}</label>`).join('')}</div></fieldset></li>`).join('')}</ul>
      <div class="field"><label for="ch-cont">Conteúdo ministrado <span class="req" aria-hidden="true">*</span></label><textarea id="ch-cont" required>${esc(c?.conteudo || '')}</textarea></div>
      <div class="row"><button class="btn primary" type="submit">${icon('check')}Salvar aula</button></div></form>
    <section class="card" aria-labelledby="rs-h"><h2 id="rs-h">Resumo da chamada</h2><p class="muted">${esc(discNome(a.disciplinaId))}, ${esc(turmaNome(a.turmaId))}: ${hist.length} aulas registradas. Frequência = presenças ÷ aulas registradas × 100.</p>
      <div class="tbl-wrap"><table class="tbl stack"><thead><tr><th scope="col">Aluno</th><th scope="col" class="n">Aulas</th><th scope="col" class="n">Presenças</th><th scope="col" class="n">Faltas</th><th scope="col">Como foi calculado</th></tr></thead><tbody>${al.map(x => { const f = freqInfo(x.id, a.disciplinaId); const pr = f.aulas - f.faltas; return `<tr><th scope="row">${esc(x.nome)}</th><td class="n" data-label="Aulas">${f.aulas}</td><td class="n" data-label="Presenças">${pr}</td><td class="n" data-label="Faltas">${f.faltas}</td><td data-label="Cálculo">${f.aulas ? `${pr} presenças de ${f.aulas} aulas = <b>${num(f.pct, 0)}%</b>` : 'Sem aulas registradas'}</td></tr>`; }).join('')}</tbody></table></div></section>`;
  }
  return pageHead('Diário de classe', 'Escolha uma aula do dia, lance a frequência e registre o conteúdo. Todos começam como presentes.') +
    `<div class="toolbar"><div class="field" style="max-width:12rem"><label for="dia-data">Dia</label><input id="dia-data" class="input" type="date" value="${data}" max="${TODAY_ISO}" data-change="diaData"></div></div>
    <section class="card" aria-labelledby="ad-h"><h2 id="ad-h">Aulas de ${esc(fmtLong(data))}</h2>${lista}</section>${corpo}`;
}
CHG.diaData = el => { UI.sel.diaData = el.value || TODAY_ISO; UI.sel.diaAula = ''; rerender(); };
ACT['dia-aula'] = el => { UI.sel.diaAula = el.dataset.id; rerender(); };
ACT['chamada-de'] = el => { const [t, d] = el.dataset.pair.split('|'); UI.sel.diaData = TODAY_ISO; UI.sel.diaAula = myAulas().find(a => a.turmaId === t && a.disciplinaId === d && a.dia === TODAY.getDay())?.id; go('chamada'); };
FORMS.diario = f => {
  const data = UI.sel.diaData || TODAY_ISO; const a = byId('aulas', UI.sel.diaAula);
  const faltas = $$('input[value="F"]:checked', f).map(i => i.name.slice(2));
  let c = DADOS.chamadas.find(x => x.turmaId === a.turmaId && x.disciplinaId === a.disciplinaId && x.data === data && (x.slot === a.slot || x.slot == null));
  if (!c) { c = { id: uid(), turmaId: a.turmaId, disciplinaId: a.disciplinaId, data }; DADOS.chamadas.push(c); }
  Object.assign(c, { slot: a.slot, faltas, conteudo: $('#ch-cont').value.trim() }); save(); rerender();
  toast(`Aula salva: ${alunosDaTurma(a.turmaId).length - faltas.length} presentes e ${faltas.length} falta${faltas.length === 1 ? '' : 's'}.`);
};
PAGES.professor.chamada = telaDiario;
