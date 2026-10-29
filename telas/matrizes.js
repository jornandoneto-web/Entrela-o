/* Telas do DED: cursos e Gestão de Matrizes (Etapa 4). Curso → séries → componentes curriculares → carga horária. */
'use strict';
// TODO: conteúdos e assuntos de cada componente serão detalhados depois pelo perfil Professor.

ENT.cursos = {
  coll: 'cursos', title: 'Cursos', singular: 'curso', plural: 'cursos', newLabel: 'Cadastrar curso',
  desc: 'Cursos que as escolas podem ofertar. A matriz de cada curso é montada em Gestão de matrizes.',
  fields: [{ k: 'nome', l: 'Nome do curso', req: 1, wide: 1 }, { k: 'etapa', l: 'Etapa', t: 'select', o: optsFix(['Educação Infantil', 'Ensino Fundamental', 'Ensino Médio', 'Educação Profissional', 'Educação de Jovens e Adultos']), req: 1 }, { k: 'descricao', l: 'Descrição', t: 'textarea' }],
  sort: (a, b) => a.nome.localeCompare(b.nome),
  cols: [['Curso', r => esc(r.nome)], ['Etapa', r => esc(r.etapa)], ['Séries na matriz', r => (DADOS.matrizes || []).find(m => m.cursoId === r.id)?.series.length || 0, 'n'], ['Escolas que ofertam', r => DADOS.escolas.filter(e => (e.cursos || []).includes(r.id)).length, 'n']],
  rowActs: r => `<button class="btn ghost sm" data-act="mx-abrir" data-id="${r.id}" aria-label="Abrir a matriz de ${esc(r.nome)}">Matriz</button>`,
  canEdit: () => can('cursos.gerir'), canNew: () => can('cursos.gerir'),
  name: r => r.nome
};
ACT['mx-abrir'] = el => { UI.sel.mxCurso = el.dataset.id; go('matrizes'); };

async function telaDedInicio() {
  const [cursos, matrizes] = await Promise.all([cursoService.listar(), matrizService.listar()]);
  const com = cursos.filter(c => matrizes.some(m => m.cursoId === c.id && m.series.length));
  const sem = cursos.filter(c => !com.includes(c));
  return pageHead(`${greet()}, ${firstName(me().nome)}.`, 'Departamento de Educação: cursos ofertados pela rede e suas matrizes curriculares.', `<button class="btn primary" data-act="go" data-route="matrizes">${icon('layers')}Gestão de matrizes</button>`, 'hello') +
    `<section class="stats" aria-label="Resumo">${statCard('lilac', 'Cursos', cursos.length, 'cadastrados na rede', 'cursos')}${statCard('mint', 'Com matriz', com.length, 'séries e componentes definidos', 'matrizes')}${statCard('peach', 'Sem matriz', sem.length, 'precisam ser detalhados', 'matrizes')}</section>
    ${hrowOpen('painel-ded')}<section class="card" aria-labelledby="sm-h"><h2 id="sm-h">Cursos sem matriz</h2>${sem.length ? `<ul class="list">${sem.map(c => `<li><span class="grow"><span class="t">${esc(c.nome)}</span><br><span class="m">${esc(c.etapa)}</span></span><button class="btn outline sm" data-act="mx-abrir" data-id="${c.id}" aria-label="Montar a matriz de ${esc(c.nome)}">Montar matriz</button></li>`).join('')}</ul>` : '<p class="empty">Todos os cursos têm matriz.</p>'}</section></div>`;
}

async function telaMatrizes() {
  const cursos = (await cursoService.listar()).sort((a, b) => a.nome.localeCompare(b.nome));
  if (!cursos.length) return pageHead('Gestão de matrizes', 'Cadastre um curso antes de montar a matriz.');
  if (!cursos.some(c => c.id === UI.sel.mxCurso)) UI.sel.mxCurso = cursos[0].id;
  const m = await matrizService.buscarPorCurso(UI.sel.mxCurso); UI.cache.matriz = m;
  const total = m.series.reduce((n, s) => n + matrizService.totalSerie(s), 0);
  const nomes = uniq([...DADOS.disciplinas.map(d => d.nome), 'Educação Física', 'Arte', 'Filosofia', 'Sociologia', 'Química']).sort();
  return pageHead('Gestão de matrizes', 'Escolha o curso, cadastre as séries e, em cada série, os componentes curriculares com a carga horária anual em horas.') +
    `<div class="toolbar">${selectCtl('mx-curso', 'Curso', cursos.map(c => [c.id, c.nome]), UI.sel.mxCurso, 'mxCurso')}<p class="muted" style="padding-bottom:.75rem">${m.series.length} série${m.series.length === 1 ? '' : 's'}, ${total} h no curso todo.</p></div>
    <datalist id="mx-componentes">${nomes.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    <form class="card" data-form="mx-serie" novalidate aria-labelledby="ns-h"><h2 id="ns-h">Adicionar série</h2><div class="row" style="align-items:flex-end"><div class="field" style="flex:1 1 14rem"><label for="mx-nova-serie">Nome da série</label><input id="mx-nova-serie" placeholder="${m.series.length + 1}ª série"></div><button class="btn primary" type="submit">${icon('plus')}Adicionar série</button></div></form>
    ${m.series.map((s, si) => `<section class="card" aria-labelledby="se-${s.id}"><div class="card-h"><h2 id="se-${s.id}">${esc(s.nome)}</h2><div class="row"><span class="muted">Total da série: <b>${matrizService.totalSerie(s)} h</b></span><button class="icon-btn" data-act="mx-rem-serie" data-s="${si}" aria-label="Excluir ${esc(s.nome)}">${icon('trash')}</button></div></div>
      ${s.componentes.length ? `<div class="tbl-wrap"><table class="tbl stack"><thead><tr><th scope="col">Componente curricular</th><th scope="col" class="n">Carga horária (h)</th><th scope="col" class="n"><span class="sr-only">Ação</span></th></tr></thead><tbody>${s.componentes.map((c, ci) => `<tr><th scope="row">${esc(c.nome)}</th><td class="n" data-label="Carga horária"><label class="sr-only" for="ch-${c.id}">Carga horária de ${esc(c.nome)} na ${esc(s.nome)}</label><input id="ch-${c.id}" class="input" type="number" min="1" step="1" value="${c.cargaHoraria}" data-change="mxCH" data-s="${si}" data-c="${ci}"></td><td class="n"><div class="acts"><button class="icon-btn" data-act="mx-rem-comp" data-s="${si}" data-c="${ci}" aria-label="Remover ${esc(c.nome)} da ${esc(s.nome)}">${icon('trash')}</button></div></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhum componente nesta série ainda.</p>'}
      <form class="row" data-form="mx-comp" data-s="${si}" novalidate style="align-items:flex-end" aria-label="Adicionar componente na ${esc(s.nome)}"><div class="field" style="flex:2 1 14rem"><label for="mxc-n-${si}">Componente curricular</label><input id="mxc-n-${si}" list="mx-componentes" placeholder="Ex.: Matemática"></div><div class="field" style="flex:1 1 8rem"><label for="mxc-h-${si}">Carga horária (h)</label><input id="mxc-h-${si}" type="number" min="1" step="1" placeholder="80"></div><button class="btn outline" type="submit">${icon('plus')}Adicionar</button></form>
    </section>`).join('') || '<p class="empty">Este curso ainda não tem séries. Adicione a primeira acima.</p>'}`;
}
async function salvarMatriz(mudar, msg) {
  const m = JSON.parse(JSON.stringify(UI.cache.matriz)); mudar(m);
  try { await matrizService.salvar(m); await rerender(); if (msg) toast(msg); } catch (e) { toast(e.message, 'err'); alertSR(e.message); }
}
CHG.mxCurso = el => { UI.sel.mxCurso = el.value; rerender(); };
CHG.mxCH = el => { const v = Number(el.value); if (!(v > 0)) { toast('A carga horária precisa ser maior que zero.', 'err'); return; } salvarMatriz(m => { m.series[el.dataset.s].componentes[el.dataset.c].cargaHoraria = v; }, 'Carga horária atualizada.'); };
FORMS['mx-serie'] = () => { const nome = $('#mx-nova-serie').value.trim() || $('#mx-nova-serie').placeholder; salvarMatriz(m => m.series.push(Modelos.serie({ nome })), `${nome} adicionada.`); };
FORMS['mx-comp'] = f => {
  const si = f.dataset.s; const nome = $('#mxc-n-' + si).value.trim(); const ch = Number($('#mxc-h-' + si).value);
  if (!nome || !(ch > 0)) { toast('Informe o componente e a carga horária.', 'err'); alertSR('Informe o componente e a carga horária.'); return; }
  salvarMatriz(m => m.series[si].componentes.push(Modelos.componenteCurricular({ nome, cargaHoraria: ch })), `${nome} adicionado com ${ch} h.`);
};
ACT['mx-rem-comp'] = el => salvarMatriz(m => m.series[el.dataset.s].componentes.splice(el.dataset.c, 1), 'Componente removido.');
ACT['mx-rem-serie'] = el => { const s = UI.cache.matriz.series[el.dataset.s]; confirmBox('Excluir série', `Excluir <b>${esc(s.nome)}</b> e os ${s.componentes.length} componentes dela?`, () => salvarMatriz(m => m.series.splice(el.dataset.s, 1), 'Série excluída.')); };

PAGES.ded = { inicio: telaDedInicio, cursos: () => crudPage('cursos'), matrizes: telaMatrizes };
