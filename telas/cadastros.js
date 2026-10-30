/* Cadastros auxiliares (regra da mentoria: "tudo que está em tela deve ser gerenciado").
   Cada lista do sistema tem aqui listagem, Novo, editar e inativar/excluir, no menu do perfil responsável. */
'use strict';

const listasDoPerfil = () => Object.entries(LISTAS_DEF).filter(([, d]) => d.dono === SESSION.role);
async function telaCadastros() {
  const tipos = listasDoPerfil();
  if (!tipos.some(([t]) => t === UI.sel.listaTipo)) UI.sel.listaTipo = tipos[0]?.[0];
  if (!tipos.length) return pageHead('Cadastros auxiliares', 'Este perfil não é responsável por nenhuma lista.');
  const tipo = UI.sel.listaTipo; const itens = await listaService.porTipo(tipo); const d = LISTAS_DEF[tipo];
  return pageHead('Cadastros auxiliares', 'As opções das listas do sistema são gerenciadas aqui. O que você cadastrar já aparece nos formulários.', `<button class="btn primary" data-act="lista-novo">${icon('plus')}Novo item</button>`) +
    `<div class="toolbar">${selectCtl('lista-tipo', 'Lista', tipos.map(([t, x]) => [t, x.l]), tipo, 'listaTipo')}</div>
    <p class="muted" aria-live="polite">${esc(d.l)}: ${itens.filter(i => i.ativo).length} ativos de ${itens.length}.</p>
    ${itens.length ? `<div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">${esc(d.l)}</caption><thead><tr><th scope="col">Item</th><th scope="col">Situação</th><th scope="col" class="n">Ações</th></tr></thead><tbody>${itens.map(i => `<tr><th scope="row">${esc(i.nome)}${i.sistema ? caption2('Usado por regras do sistema: pode ser inativado, mas não renomeado nem excluído') : ''}</th><td data-label="Situação">${i.ativo ? st('Ativo', 'ok') : st('Inativo', 'neutral')}</td><td class="n"><div class="acts">${i.sistema ? '' : `<button class="icon-btn" data-act="lista-editar" data-id="${i.id}" aria-label="Editar ${esc(i.nome)}">${icon('pencil')}</button>`}<button class="btn ghost sm" data-act="lista-alternar" data-id="${i.id}" aria-label="${i.ativo ? 'Inativar' : 'Reativar'} ${esc(i.nome)}">${i.ativo ? 'Inativar' : 'Reativar'}</button>${i.sistema ? '' : `<button class="icon-btn" data-act="lista-excluir" data-id="${i.id}" aria-label="Excluir ${esc(i.nome)}">${icon('trash')}</button>`}</div></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Lista vazia. Use "Novo item" para começar.</p>'}`;
}
CHG.listaTipo = el => { UI.sel.listaTipo = el.value; rerender(); };
const formLista = (item) => openDialog({
  title: item ? 'Editar item' : 'Novo item', body: `<p class="muted">${esc(LISTAS_DEF[UI.sel.listaTipo].l)}</p>${fieldHTML({ k: 'li-nome', l: 'Nome', req: 1 }, item?.nome || '')}`,
  onSubmit: () => {
    const obj = Object.assign({}, item || { tipo: UI.sel.listaTipo, ordem: (DADOS.listas || []).filter(x => x.tipo === UI.sel.listaTipo).length }, { nome: $('#f-li-nome').value });
    listaService.salvar(obj).then(() => { closeDialog(); rerender(); toast(item ? 'Item atualizado.' : 'Item cadastrado.'); }).catch(e => { toast(e.message, 'err'); alertSR(e.message); });
    return false;
  }
});
ACT['lista-novo'] = () => formLista(null);
ACT['lista-editar'] = async el => formLista(await listaService.buscarPorId(el.dataset.id));
ACT['lista-alternar'] = el => listaService.alternar(el.dataset.id).then(() => { rerender(); toast('Situação atualizada.'); });
ACT['lista-excluir'] = el => { const i = byId('listas', el.dataset.id); confirmBox('Excluir item', `Excluir <b>${esc(i.nome)}</b>? Registros antigos mantêm o valor, mas ele sai das listas.`, () => listaService.remover(i.id).then(() => { rerender(); toast('Item excluído.'); })); };

ENT.faixas = {
  coll: 'faixas', title: 'Faixas de horário', singular: 'faixa de horário', plural: 'faixas', fem: true, newLabel: 'Nova faixa',
  desc: 'Horários de aula de cada turno. A grade horária usa estas faixas.',
  fields: () => [{ k: 'turno', l: 'Turno', t: 'select', o: L('turnos'), req: 1 }, { k: 'ordem', l: 'Ordem no turno', t: 'number', req: 1, attrs: 'min="0" step="1"', help: '0 é o 1º horário, 1 é o 2º, e assim por diante.' }, { k: 'inicio', l: 'Início', t: 'time', req: 1 }, { k: 'fim', l: 'Fim', t: 'time', req: 1 }],
  defaults: () => ({ turno: 'Manhã', ordem: 0 }),
  filter: { k: 'turno', l: 'Turno', o: L('turnos') },
  sort: (a, b) => a.turno.localeCompare(b.turno) || a.ordem - b.ordem,
  cols: [['Horário', r => `${r.ordem + 1}º horário`], ['Turno', r => esc(r.turno)], ['Início', r => esc(r.inicio)], ['Fim', r => esc(r.fim)]],
  check: (v, id) => v.fim <= v.inicio ? 'O fim precisa ser depois do início.' : DADOS.faixas.some(f => f.id !== id && f.turno === v.turno && f.ordem === v.ordem) ? 'Esse turno já tem uma faixa nessa ordem.' : '',
  name: r => `${r.ordem + 1}º horário, ${r.turno}`
};
ENT.alimentos = {
  coll: 'alimentos', title: 'Alimentos', singular: 'alimento', plural: 'alimentos', newLabel: 'Novo alimento',
  desc: 'Itens da merenda usados nas entradas, no consumo e nos alertas de estoque.',
  fields: () => [{ k: 'nome', l: 'Nome', req: 1 }, { k: 'unidade', l: 'Unidade de medida', t: 'select', o: L('unidadesMedida'), req: 1 }],
  sort: (a, b) => a.nome.localeCompare(b.nome), cols: [['Alimento', r => esc(r.nome)], ['Unidade', r => esc(r.unidade)]]
};
Object.assign(ENT.turmas, { fieldsBase: ENT.turmas.fields });
ENT.turmas.fields = () => [...ENT.turmas.fieldsBase().slice(0, 2), { k: 'cursoId', l: 'Curso ou modalidade', t: 'select', o: () => DADOS.cursos.map(c => [c.id, c.nome]), req: 1 }, ...ENT.turmas.fieldsBase().slice(2)];

PAGES.gestao.cadastros = telaCadastros; PAGES.gestao.faixas = () => crudPage('faixas');
PAGES.rh.cadastros = telaCadastros; PAGES.ded.cadastros = telaCadastros;
PAGES.dae.cadastros = telaCadastros; PAGES.dae.alimentos = () => crudPage('alimentos');
PAGES.calendario = { inicio: calendarioPage, comunicados: () => crudPage('comunicados'), cadastros: telaCadastros };
PAGES.diretor.vagas = gVagas;
