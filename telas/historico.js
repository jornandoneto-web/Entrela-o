/* Histórico escolar (toda a vida escolar do aluno) e cadastro de notas externas (fora da rede). */
'use strict';

function historicoHTML(h) {
  const a = h.aluno; const temExterno = h.periodos.some(p => p.externo);
  const bloco = p => {
    const chTotal = p.componentes.reduce((n, c) => n + (Number(c.cargaHoraria) || 0), 0);
    const sit = p.situacao === 'Aprovado' ? st('Aprovado', 'ok') : p.situacao === 'Reprovado' ? st('Reprovado', 'err') : p.situacao === 'Transferido' ? st('Transferido', 'info') : st(p.situacao, 'neutral');
    return `<section class="hist-ano"><div class="row sp"><h3>${p.ano}, ${esc(p.serie || '')}</h3>${sit}</div>
      <p class="caption">${esc(p.escola)}${p.cidade ? `, ${esc(p.cidade)}` : ''}${p.externo ? ` (${esc(p.tipoEscola || 'fora da rede')}). <b>Lançamento externo*</b>` : ''}${p.freq != null ? `. Frequência: ${num(p.freq, 0)}%` : ''}${p.situacao === 'Transferido' && p.data ? `. Transferido em ${fmtD(p.data)}; as notas do ano seguiram para a nova escola.` : ''}${p.situacao === 'Cursando' ? '. Ano em curso: médias parciais.' : ''}</p>
      ${p.componentes.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Componente curricular</th><th scope="col" class="n">Média final</th><th scope="col" class="n">Carga horária</th></tr></thead><tbody>${p.componentes.map(c => `<tr><th scope="row">${esc(c.nome)}</th><td class="n">${c.media == null ? '—' : num(c.media)}</td><td class="n">${c.cargaHoraria ? c.cargaHoraria + ' h' : '—'}</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Total</th><td></td><td class="n">${chTotal ? chTotal + ' h' : '—'}</td></tr></tfoot></table></div>` : '<p class="muted">Sem componentes registrados.</p>'}</section>`;
  };
  return `<header class="doc-cab"><p>Governo do Estado de Sergipe, Secretaria de Estado da Educação</p><h2>Histórico escolar</h2></header>
    <dl class="dl"><dt>Aluno</dt><dd>${esc(a.nome)}</dd><dt>Nascimento</dt><dd>${fmtD(a.nascimento)}</dd>${a.cpf ? `<dt>CPF</dt><dd>${esc(formatarCPF(a.cpf))}</dd>` : ''}${a.filiacao ? `<dt>Filiação</dt><dd>${esc(a.filiacao)}</dd>` : ''}<dt>Matrícula</dt><dd>${esc(a.matricula || '—')}</dd><dt>Situação</dt><dd>${esc(a.situacaoMatricula || (a.turmaId ? 'Matriculado' : '—'))}</dd><dt>Escola atual</dt><dd>${esc(h.escolaAtual.escola)}</dd></dl>
    ${h.periodos.length ? h.periodos.map(bloco).join('') : '<p class="empty">Ainda não há anos registrados.</p>'}
    ${temExterno ? '<p class="caption">* Lançamento externo: dados de escola fora da rede estadual, informados pela escola de origem e lançados à mão pela secretaria. O sistema não garante a integridade desses dados.</p>' : ''}
    <p class="doc-data">${esc(regionalService.nomeMunicipio(byId('escolas', escolaDe(a))?.municipioId) || 'Aracaju')}/SE, ${dataExtenso(TODAY_ISO)}.</p><p class="doc-ass">Secretaria escolar</p>`;
}
async function abrirHistorico(alunoId) {
  try { abrirDocumento('Histórico escolar', historicoHTML(await historicoService.montar(alunoId))); } catch (e) { toast(e.message, 'err'); }
}
ACT['hist-abrir'] = el => abrirHistorico(el.dataset.id);
// Alunos que a secretaria acompanha: os da escola e os que saíram dela por transferência
const alunosDoHistorico = () => DADOS.alunos.filter(a => alunosEsc().includes(a) || (!a.turmaId && (a.historico || []).some(h => naEscola(h.escolaId)))).sort((x, y) => x.nome.localeCompare(y.nome));
async function telaHistorico() {
  const al = alunosDoHistorico();
  if (!al.some(a => a.id === UI.sel.histAluno)) UI.sel.histAluno = al[0]?.id;
  if (!UI.sel.histAluno) return pageHead('Histórico escolar', 'Nenhum aluno nesta escola.');
  const h = await historicoService.montar(UI.sel.histAluno);
  return pageHead('Histórico escolar', 'Toda a vida escolar do aluno: anos na rede estadual, gerados pelo sistema, e anos em outras escolas, lançados à mão.', `<button class="btn outline" data-act="nx-novo" data-aluno="${h.aluno.id}">${icon('plus')}Lançar nota externa</button><button class="btn primary" data-act="hist-abrir" data-id="${h.aluno.id}">${icon('file')}Abrir para imprimir</button>`) +
    `<div class="toolbar">${selectCtl('hist-aluno', 'Aluno', al.map(a => [a.id, `${a.nome}${a.turmaId ? ', ' + turmaNome(a.turmaId) : ', transferido'}`]), h.aluno.id, 'histAluno')}</div><section class="card doc">${historicoHTML(h)}</section>`;
}
CHG.histAluno = el => { UI.sel.histAluno = el.value; rerender(); };

// ---------- Notas externas ----------
ENT.notasExternas = {
  coll: 'notasExternas', title: 'Notas externas', singular: 'nota externa', plural: 'notas externas', fem: true, newLabel: 'Lançar nota externa',
  desc: 'Notas de anos cursados fora da rede estadual (escola particular, municipal ou de outro estado), lançadas à mão a partir do histórico da escola de origem. Elas entram no histórico escolar marcadas como lançamento externo.',
  rows: () => (DADOS.notasExternas || []).filter(n => alunosDoHistorico().some(a => a.id === n.alunoId)),
  sort: (a, b) => alunoNome(a.alunoId).localeCompare(alunoNome(b.alunoId)) || a.ano - b.ano || a.componente.localeCompare(b.componente),
  cols: [['Aluno', r => nomeAlunoId(r.alunoId)], ['Escola de origem', r => `${esc(r.escola)}${caption2(`${esc(r.tipoEscola)}, ${esc(r.cidade)}/${esc(r.uf)}. Lançamento externo`)}`], ['Ano e série', r => `${r.ano}${caption2(esc(r.serie))}`], ['Componente', r => esc(r.componente)], ['Média', r => num(r.media), 'n'], ['Carga', r => r.cargaHoraria + ' h', 'n'], ['Situação', r => esc(r.situacao)]],
  name: r => `${r.componente} ${r.ano} de ${alunoNome(r.alunoId)}`
};
function formNotaExterna(n, alunoPadrao) {
  const al = alunosDoHistorico(); const comps = DADOS.disciplinas.map(d => d.nome).sort((x, y) => x.localeCompare(y));
  openDialog({ title: n.id ? 'Editar nota externa' : 'Lançar nota externa', wide: true,
    body: `<p class="caption">Copie do histórico entregue pela escola de origem. O sistema marca o lançamento como externo.</p><div class="form-grid">
      <div class="field wide"><label for="nx-aluno">Aluno <span class="req" aria-hidden="true">*</span></label><select id="nx-aluno" required>${optHTML(al.map(a => [a.id, a.nome]), n.alunoId || alunoPadrao || '')}</select></div>
      <div class="field wide"><label for="nx-escola">Escola de origem <span class="req" aria-hidden="true">*</span></label><input id="nx-escola" required value="${esc(n.escola)}"></div>
      <div class="field"><label for="nx-tipo">Tipo de escola <span class="req" aria-hidden="true">*</span></label><select id="nx-tipo" required>${optHTML(nomes('tiposEscolaExterna').map(x => [x, x]), n.tipoEscola)}</select></div>
      ${ufCidadeHTML('nx', n.uf || 'SE', n.cidade, { rotuloUF: 'UF', rotuloCidade: 'Cidade' })}
      <div class="field"><label for="nx-ano">Ano <span class="req" aria-hidden="true">*</span></label><input id="nx-ano" required inputmode="numeric" maxlength="4" value="${n.ano || ''}"></div>
      <div class="field"><label for="nx-serie">Série <span class="req" aria-hidden="true">*</span></label><select id="nx-serie" required>${optHTML(nomes('series').map(x => [x, x]), n.serie)}</select></div>
      ${listaOutroHTML('nx-comp', 'Componente curricular', comps, n.componente, { req: true })}
      <div class="field"><label for="nx-media">Média final <span class="req" aria-hidden="true">*</span></label><input id="nx-media" required inputmode="decimal" data-nota value="${n.media == null ? '' : num(n.media)}" placeholder="0 a 10"></div>
      <div class="field"><label for="nx-ch">Carga horária (h) <span class="req" aria-hidden="true">*</span></label><input id="nx-ch" required type="number" min="1" value="${n.cargaHoraria || ''}"></div>
      <div class="field"><label for="nx-sit">Situação <span class="req" aria-hidden="true">*</span></label><select id="nx-sit" required>${optHTML(['Aprovado', 'Reprovado', 'Transferido'].map(x => [x, x]), n.situacao)}</select></div>
    </div><p class="err-msg" id="nx-erro" role="alert" hidden></p>`,
    onSubmit: () => {
      const obj = Modelos.notaExterna(Object.assign({}, n, { alunoId: $('#nx-aluno').value, escola: $('#nx-escola').value.trim(), tipoEscola: $('#nx-tipo').value, uf: $('#nx-uf').value, cidade: $('#nx-cid').value, ano: $('#nx-ano').value, serie: $('#nx-serie').value, componente: valorOutro('nx-comp'), media: $('#nx-media').value.replace(',', '.'), cargaHoraria: $('#nx-ch').value, situacao: $('#nx-sit').value }));
      servico('notasExternas').salvar(obj).then(() => { closeDialog(); rerender(); toast('Nota externa lançada.'); }).catch(e => { const b = $('#nx-erro'); b.textContent = e.message; b.hidden = false; alertSR(e.message); });
      return false;
    } });
}
ACT['nx-novo'] = el => formNotaExterna(Modelos.notaExterna({ uf: 'SE' }), el.dataset.aluno);
const openFormAntesNx = openForm;
openForm = function (key, id, def) {
  if (key === 'notasExternas') return formNotaExterna(id ? Modelos.notaExterna(byId('notasExternas', id)) : Modelos.notaExterna({ uf: 'SE' }));
  return openFormAntesNx(key, id, def);
};

PAGES.gestao.historico = telaHistorico;
PAGES.gestao.notasExternas = () => crudPage('notasExternas');
