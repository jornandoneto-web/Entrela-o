/* Telas: cadastro e listagem de escolas (Etapa 1). Dados só pelos serviços. */
'use strict';

UI.cache = UI.cache || {};
const enderecoTxt = e => { const d = e.endereco && typeof e.endereco === 'object' ? e.endereco : null; return d ? [d.logradouro && `${d.logradouro}${d.numero ? ', ' + d.numero : ''}`, d.bairro].filter(Boolean).join(', ') : [e.endereco, e.bairro].filter(Boolean).join(', '); };

// ---------- Seletores em cascata: Diretoria Regional → Município → Escola ----------
// modo "filtro" (recarrega a tela) ou modo "formulário" (só troca as opções, sem perder o que foi digitado)
function cascataHTML(pref, val, { escolas = [], comEscola = false, obrig = false, filtro = false } = {}) {
  const drs = UI.cache.drs || [];
  const dr = drs.find(d => d.id === val.drId);
  const muns = dr ? dr.municipios : [];
  const escs = escolas.filter(e => (!val.drId || e.drId === val.drId) && (!val.municipioId || e.municipioId === val.municipioId));
  const req = obrig ? ' <span class="req" aria-hidden="true">*</span>' : '';
  const sel = (nivel, label, opts, v, vazio, ajuda = '') => `<div class="field"><label for="${pref}-${nivel}">${label}${req}</label><select id="${pref}-${nivel}" ${obrig ? 'required' : ''} data-change="casc" data-pref="${pref}" data-nivel="${nivel}" ${filtro ? 'data-filtro="1"' : ''}><option value="">${vazio}</option>${opts.map(([v2, l]) => `<option value="${esc(v2)}" ${v2 === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${ajuda}</div>`;
  const vazioMun = !val.drId ? 'Escolha a Diretoria Regional' : muns.length ? (filtro ? 'Todos os municípios' : 'Selecione…') : 'Nenhum município cadastrado nesta DR';
  return sel('dr', 'Diretoria Regional', drs.map(d => [d.id, `${d.sigla} — ${d.sede || d.nome}`]), val.drId, filtro ? 'Todas as DRs' : 'Selecione…') +
    sel('mun', 'Município', muns.map(m => [m.id, m.nome]), val.municipioId, vazioMun, dr?.aConfirmar ? '<p class="help">Municípios desta DR a confirmar com a SEDUC.</p>' : '') +
    (comEscola ? sel('esc', 'Escola', escs.map(e => [e.id, e.nome]), val.escolaId, filtro ? 'Todas as escolas' : 'Selecione…') : '');
}
CHG.casc = el => {
  const pref = el.dataset.pref, nivel = el.dataset.nivel;
  if (el.dataset.filtro) {
    const f = UI.sel[pref] = Object.assign({ drId: '', municipioId: '', escolaId: '' }, UI.sel[pref]);
    if (nivel === 'dr') Object.assign(f, { drId: el.value, municipioId: '', escolaId: '' });
    if (nivel === 'mun') Object.assign(f, { municipioId: el.value, escolaId: '' });
    if (nivel === 'esc') f.escolaId = el.value;
    rerender(); return;
  }
  // formulário: refaz as opções dos níveis de baixo e limpa o que foi escolhido neles
  const drSel = $(`#${pref}-dr`), munSel = $(`#${pref}-mun`), escSel = $(`#${pref}-esc`);
  const val = { drId: drSel.value, municipioId: nivel === 'dr' ? '' : munSel.value, escolaId: '' };
  const tmp = document.createElement('div');
  tmp.innerHTML = cascataHTML(pref, val, { escolas: UI.cache.escolasCasc || [], comEscola: !!escSel, obrig: drSel.required });
  if (nivel === 'dr') munSel.closest('.field').replaceWith(tmp.querySelector(`#${pref}-mun`).closest('.field'));
  if (escSel) $(`#${pref}-esc`).closest('.field').replaceWith(tmp.querySelector(`#${pref}-esc`).closest('.field'));
};

// ---------- Listagem ----------
async function telaEscolas() {
  const [drs, todas, cursos] = await Promise.all([regionalService.listar(), escolaService.listar(), cursoService.listar()]);
  UI.cache.drs = drs;
  const f = Object.assign({ drId: '', municipioId: '', escolaId: '' }, SESSION.role === 'regional' ? { drId: EQUIPE[SESSION.userId]?.drId } : {}, UI.sel.escF);
  if (SESSION.role === 'regional') f.drId = EQUIPE[SESSION.userId]?.drId;
  const lista = await escolaService.filtrar(f);
  const pode = can('escolas.editar');
  const cursoNome = id => cursos.find(c => c.id === id)?.nome;
  return pageHead(SESSION.role === 'regional' ? 'Escolas da regional' : 'Escolas', 'Escolas da rede estadual. Filtre por Diretoria Regional, depois por município e por escola.', pode ? `<button class="btn primary" data-act="escola-form">${icon('plus')}Cadastrar escola</button>` : '') +
    `<div class="toolbar">${cascataHTML('escF', f, { escolas: todas, comEscola: true, filtro: true })}</div>
    <p class="muted" aria-live="polite">${lista.length} escola${lista.length === 1 ? '' : 's'} encontrada${lista.length === 1 ? '' : 's'}.</p>
    ${lista.length ? `<div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">Escolas</caption><thead><tr><th scope="col">Escola</th><th scope="col">Diretoria e município</th><th scope="col">Endereço</th><th scope="col">Cursos ofertados</th><th scope="col">Diretor</th>${pode ? '<th scope="col" class="n">Ações</th>' : ''}</tr></thead><tbody>${lista.map(e => `<tr><th scope="row">${esc(e.nome)}${caption2('INEP ' + esc(e.inep || '—'))}</th><td data-label="Diretoria e município">${esc(regionalService.siglaDR(e.drId) || '—')}${caption2(esc(regionalService.nomeMunicipio(e.municipioId) || '—'))}</td><td data-label="Endereço">${esc(enderecoTxt(e) || '—')}</td><td data-label="Cursos">${esc(e.cursos.map(cursoNome).filter(Boolean).join('; ') || '—')}</td><td data-label="Diretor">${esc(e.diretor || 'Não definido')}</td>${pode ? `<td class="n"><div class="acts"><button class="icon-btn" data-act="escola-form" data-id="${e.id}" aria-label="Editar ${esc(e.nome)}">${icon('pencil')}</button><button class="icon-btn" data-act="escola-del" data-id="${e.id}" aria-label="Excluir ${esc(e.nome)}">${icon('trash')}</button></div></td>` : ''}</tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhuma escola com esses filtros.</p>'}`;
}

// ---------- Cadastro ----------
const lerEndereco = () => Modelos.endereco({ cep: $('#es-cep').value, logradouro: $('#es-log').value, numero: $('#es-num').value, complemento: $('#es-comp').value, bairro: $('#es-bairro').value });
const cursoCheck = (c, marcado) => `<label class="check"><input type="checkbox" name="cursos" value="${esc(c.id)}" ${marcado ? 'checked' : ''}>${esc(c.nome)}</label>`;
ACT['escola-form'] = async el => {
  const id = el.dataset.id;
  const [drs, cursos, pessoas, e] = await Promise.all([regionalService.listar(), cursoService.listar(), pessoaService.listarTodas(), id ? escolaService.buscarPorId(id) : Modelos.escola()]);
  UI.cache.drs = drs;
  const d = e.endereco;
  const campo = (fid, l, v, extra = '', req = false) => `<div class="field ${extra.includes('wide') ? 'wide' : ''}"><label for="${fid}">${l}${req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label><input id="${fid}" value="${esc(v)}" ${req ? 'required' : ''} ${extra.replace('wide', '')}></div>`;
  openDialog({
    title: id ? `Editar escola` : 'Nova escola', wide: true,
    body: `<p class="caption">Campos com <span class="req">*</span> são obrigatórios.</p>
      <fieldset class="form-grid"><legend class="lbl">Identificação</legend>${campo('es-nome', 'Nome da escola', e.nome, 'wide', true)}${campo('es-inep', 'Código INEP', e.inep, 'inputmode="numeric" maxlength="8" aria-describedby="es-inep-h"', true)}${campo('es-tel', 'Telefone', e.telefone, 'type="tel"')}
        <div class="field"><label for="es-integ">Como publica as vagas</label><select id="es-integ">${['Sistema Entrelaço', 'API', 'Planilha CSV'].map(x => `<option ${x === e.integracao ? 'selected' : ''}>${x}</option>`).join('')}</select></div></fieldset>
      <fieldset class="form-grid"><legend class="lbl">Localização</legend>${cascataHTML('esc', { drId: e.drId, municipioId: e.municipioId }, { obrig: true })}</fieldset>
      <fieldset class="form-grid"><legend class="lbl">Endereço</legend>${campo('es-cep', 'CEP', d.cep, 'inputmode="numeric" maxlength="9"')}${campo('es-log', 'Logradouro', d.logradouro, 'wide')}${campo('es-num', 'Número', d.numero)}${campo('es-comp', 'Complemento', d.complemento)}${campo('es-bairro', 'Bairro', d.bairro)}
        <div class="field wide">${id ? `<button type="button" class="btn outline" data-act="escola-end" data-id="${id}" style="align-self:flex-start">${icon('pin')}Salvar endereço</button><p class="help">Grava só o endereço, sem salvar o resto do formulário.</p>` : '<p class="help">O endereço é salvo junto com a escola.</p>'}</div></fieldset>
      <fieldset class="form-grid"><legend class="lbl">Direção</legend><div class="field wide"><label for="es-dir">Diretor da escola</label><select id="es-dir"><option value="">Não definido</option>${pessoas.map(p => `<option value="${esc(p.id)}" ${p.id === e.diretorId ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select><p class="help">Lista das pessoas já cadastradas no sistema.</p></div></fieldset>
      <fieldset class="field wide"><legend class="lbl">Cursos ofertados</legend><div class="checks" id="es-cursos">${cursos.map(c => cursoCheck(c, e.cursos.includes(c.id))).join('')}<button type="button" class="icon-btn" data-act="curso-rapido-abrir" aria-label="Cadastrar um curso novo" aria-expanded="false" aria-controls="curso-rapido" title="Cadastrar um curso novo">${icon('plus')}</button></div>
        <div id="curso-rapido" class="quote" hidden><div class="form-grid"><div class="field wide"><label for="cr-nome">Nome do curso novo</label><input id="cr-nome" placeholder="Ex.: Ensino Médio com Técnico em Informática"></div><div class="field"><label for="cr-etapa">Etapa</label><select id="cr-etapa">${['Educação Infantil', 'Ensino Fundamental', 'Ensino Médio', 'Educação Profissional', 'Educação de Jovens e Adultos'].map(x => `<option>${x}</option>`).join('')}</select></div></div><div class="row" style="margin-top:.5rem"><button type="button" class="btn primary sm" data-act="curso-rapido">${icon('check')}Cadastrar e selecionar</button><button type="button" class="btn ghost sm" data-act="curso-rapido-abrir">Cancelar</button></div></div></fieldset>
      <p class="caption">Recursos de acessibilidade ficam na Infraestrutura da escola, preenchida pela direção.</p>`,
    onSubmit: f => {
      const obj = Modelos.escola(Object.assign({}, e, { nome: $('#es-nome').value, inep: $('#es-inep').value.replace(/\D/g, ''), telefone: $('#es-tel').value, integracao: $('#es-integ').value, drId: $('#esc-dr').value, municipioId: $('#esc-mun').value, endereco: lerEndereco(), diretorId: $('#es-dir').value, cursos: new FormData(f).getAll('cursos') }));
      escolaService.salvar(obj).then(() => { closeDialog(); rerender(); toast(id ? 'Escola atualizada.' : 'Escola cadastrada.'); }).catch(err => { toast(err.message, 'err'); alertSR(err.message); });
      return false;
    }
  });
};
ACT['escola-end'] = el => {
  const end = lerEndereco();
  if (!end.logradouro || !end.bairro) { toast('Informe pelo menos o logradouro e o bairro.', 'err'); alertSR('Informe pelo menos o logradouro e o bairro.'); return; }
  escolaService.atualizarEndereco(el.dataset.id, end).then(() => toast('Endereço salvo.')).catch(err => toast(err.message, 'err'));
};
ACT['curso-rapido-abrir'] = () => { const box = $('#curso-rapido'); box.hidden = !box.hidden; $('[data-act="curso-rapido-abrir"][aria-controls]').setAttribute('aria-expanded', String(!box.hidden)); if (!box.hidden) $('#cr-nome').focus(); };
ACT['curso-rapido'] = () => {
  const nome = $('#cr-nome').value.trim(); if (!nome) { toast('Digite o nome do curso.', 'err'); $('#cr-nome').focus(); return; }
  cursoService.salvar(Modelos.curso({ nome, etapa: $('#cr-etapa').value })).then(c => {
    $('#es-cursos [data-act="curso-rapido-abrir"]').insertAdjacentHTML('beforebegin', cursoCheck(c, true));
    $('#cr-nome').value = ''; $('#curso-rapido').hidden = true; toast(`Curso "${c.nome}" cadastrado e selecionado.`);
  }).catch(err => toast(err.message, 'err'));
};
ACT['escola-del'] = el => {
  const e = byId('escolas', el.dataset.id);
  if (DADOS.turmas.some(t => t.escolaId === e.id)) { toast('A escola tem turmas. Transfira ou exclua as turmas antes.', 'err'); return; }
  confirmBox('Excluir escola', `Excluir <b>${esc(e.nome)}</b>? Essa ação não pode ser desfeita.`, () => escolaService.remover(e.id).then(() => { rerender(); toast('Escola excluída.'); }));
};

// Cadastros que têm formulário próprio
const openFormBase = openForm;
openForm = function (key, id, def) {
  if (key === 'escolas') return ACT['escola-form']({ dataset: { id } });
  if (key === 'professores' && typeof abrirProfessor === 'function') return abrirProfessor(id);
  return openFormBase(key, id, def);
};

PAGES.gestao.escolas = telaEscolas;
