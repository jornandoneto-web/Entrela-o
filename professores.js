/* Portal Entrelaço — professores: formações, disciplinas habilitadas, perfil Diretor e RH (ingresso, necessidade, contratos, banco de talentos) */
'use strict';

const ativo = p => !!p && (p.vinculos?.length ? p.vinculos.some(vinculoAtivo) : !(p.ingresso === 'Contrato' && p.contratoFim && p.contratoFim < TODAY_ISO));
const aulasDoProf = p => DADOS.aulas.filter(a => a.professorId === p.id);
const livres = p => ativo(p) ? Math.max(0, (Number(p.cargaHoraria) || 0) - aulasDoProf(p).length) : 0;
const formNome = id => DADOS.formacoes.find(f => f.id === id)?.nome || '—';
const turnoDe = a => byId('turmas', a.turmaId)?.turno;
const conflita = (p, aula) => aulasDoProf(p).some(x => x.dia === aula.dia && x.slot === aula.slot && turnoDe(x) === turnoDe(aula));
const diasAte = iso => daysUntil(iso);
const fimTxt = p => { if (p.ingresso !== 'Contrato' || !p.contratoFim) return ''; const n = diasAte(p.contratoFim); return n < 0 ? `Contrato encerrado em ${fmtD(p.contratoFim)}` : n === 0 ? 'Contrato termina hoje' : `Contrato termina em ${n} dia${n > 1 ? 's' : ''} (${fmtD(p.contratoFim)})`; };
const situacaoProf = p => { if (!ativo(p)) return st('Contrato encerrado', 'err'); if (p.ingresso === 'Contrato' && diasAte(p.contratoFim) <= 30) return st(`Vence em ${diasAte(p.contratoFim)} dias`, 'warn'); return st('Ativo', 'ok'); };

// ---------- 1. Formações ----------
ENT.formacoes = {
  coll: 'formacoes', title: 'Formações', singular: 'formação', plural: 'formações', fem: true, newLabel: 'Cadastrar formação',
  desc: 'Cursos de graduação dos professores e as disciplinas que cada um habilita a lecionar. As disciplinas de cada professor são calculadas a partir das formações dele.',
  fields: () => [{ k: 'nome', l: 'Nome da formação', req: 1, wide: 1, help: 'Ex.: Licenciatura em Matemática' }, { k: 'disciplinas', l: 'Disciplinas que esta formação habilita', t: 'checks', o: optsOf('disciplinas') }],
  defaults: () => ({ disciplinas: [], chaves: [] }),
  sort: (a, b) => a.nome.localeCompare(b.nome),
  cols: [['Formação', r => esc(r.nome)], ['Habilita para', r => r.disciplinas.length ? esc(r.disciplinas.map(discNome).join(', ')) : '<span class="muted">Nenhuma disciplina da grade atual</span>'], ['Professores', r => DADOS.professores.filter(p => (p.formacoes || []).includes(r.id)).length, 'n'], ['Banco de talentos', r => (DADOS.talentos || []).filter(t => t.formacaoId === r.id && t.situacao === 'Aguardando chamada').length, 'n']],
  canEdit: () => can('professores.editar'), canNew: () => can('professores.editar'),
  check: (v, id) => DADOS.formacoes.some(f => f.id !== id && norm(f.nome) === norm(v.nome)) ? 'Já existe uma formação com esse nome.' : '',
  onDelete: r => DADOS.professores.forEach(p => { p.formacoes = (p.formacoes || []).filter(f => f !== r.id); })
};

// Cadastro do professor: formações no lugar das disciplinas + dados de RH
const profFieldsRH = () => [
  { k: 'nome', l: 'Nome completo', req: 1, wide: 1 },
  { k: 'email', l: 'E-mail institucional', t: 'email', req: 1 },
  { k: 'telefone', l: 'Telefone', t: 'tel' },
  { k: 'escolaId', l: 'Escola de lotação', t: 'select', o: () => DADOS.escolas.filter(e => DADOS.turmas.some(t => t.escolaId === e.id)).map(e => [e.id, e.nome]), req: 1 },
  { k: 'cargaHoraria', l: 'Carga horária semanal', t: 'number', req: 1, attrs: 'min="1" max="60"', help: 'Em aulas de 50 minutos por semana.' },
  { k: 'formacoes', l: 'Formações', t: 'checks', o: () => DADOS.formacoes.map(f => [f.id, f.nome]).sort((a, b) => a[1].localeCompare(b[1])), help: 'As disciplinas que o professor pode lecionar saem daqui.' },
  { k: 'instituicao', l: 'Instituição e ano de conclusão', wide: 1, help: 'Ex.: UFPE, 2012' },
  { k: 'ingresso', l: 'Forma de ingresso', t: 'select', o: L('formasIngresso'), req: 1 },
  { k: 'orgaoOrigem', l: 'Órgão de origem', req: 1, showIf: 'ingresso=Cedido', help: 'Ex.: Prefeitura do Recife' },
  { k: 'contratoInicio', l: 'Início do contrato', t: 'date', req: 1, showIf: 'ingresso=Contrato' },
  { k: 'contratoFim', l: 'Término do contrato', t: 'date', req: 1, showIf: 'ingresso=Contrato' }
];
Object.assign(ENT.professores, {
  desc: 'Corpo docente, formações, forma de ingresso e carga horária. As disciplinas habilitadas são calculadas pelas formações.',
  fields: semEscola(profFieldsRH),
  defaults: () => ({ formacoes: [], ingresso: 'Concurso', cargaHoraria: 20, escolaId: escSessao() || undefined }),
  canEdit: () => can('professores.editar'), canNew: () => can('professores.editar'),
  check: v => {
    if (v.ingresso === 'Contrato' && v.contratoInicio && v.contratoFim && v.contratoFim < v.contratoInicio) return 'O término do contrato precisa ser depois do início.';
    if (!(v.formacoes || []).length) return 'Escolha pelo menos uma formação. Sem formação o professor não pode receber aulas.';
    return '';
  },
  after: p => {
    if (p.ingresso !== 'Cedido') p.orgaoOrigem = '';
    if (p.ingresso !== 'Contrato') { p.contratoInicio = ''; p.contratoFim = ''; }
    const fora = aulasDoProf(p).filter(a => !habilitadas(p).includes(a.disciplinaId));
    if (fora.length) setTimeout(() => toast(`Atenção: ${p.nome} tem ${fora.length} aula${fora.length > 1 ? 's' : ''} de disciplina que as formações não habilitam. Revise na grade horária.`, 'err'), 400);
  },
  cols: [
    ['Professor', r => `${esc(r.nome)}${caption2(esc(r.email))}`],
    ['Formações', r => `${esc((r.formacoes || []).map(formNome).join(', ') || '—')}${caption2('Habilita: ' + esc(habilitadas(r).map(discNome).join(', ') || 'nenhuma disciplina'))}`],
    ['Ingresso', r => `${esc(r.ingresso || '—')}${r.ingresso === 'Cedido' ? caption2('Origem: ' + esc(r.orgaoOrigem || '—')) : r.ingresso === 'Contrato' ? caption2(`${fmtD(r.contratoInicio)} a ${fmtD(r.contratoFim)}`) : ''}`],
    ['Aulas', r => `${aulasDoProf(r).length} de ${r.cargaHoraria || '—'}`, 'n'],
    ['Situação', r => situacaoProf(r)]
  ]
});
ENT.disciplinas.cols = ENT.disciplinas.cols.slice(0, 3).concat([['Professores habilitados', r => esc(DADOS.professores.filter(p => habilitadas(p).includes(r.id)).map(p => p.nome).join(', ') || '—')]]);

// Atribuição de aulas: só professor ativo e habilitado na disciplina
const aulaFields = ENT.aulas.fields;
ENT.aulas.fields = () => aulaFields().map(f => f.k === 'disciplinaId' ? Object.assign({}, f, { attrs: 'data-change="aulaDisc"' })
  : f.k === 'professorId' ? Object.assign({}, f, { o: () => DADOS.professores.filter(ativo).map(p => [p.id, `${p.nome} (${habilitadas(p).map(discNome).join(', ') || 'sem disciplina habilitada'})`]), help: 'Só ficam disponíveis professores habilitados na disciplina escolhida.' }) : f);
const aulaCheck = ENT.aulas.check;
ENT.aulas.check = (v, id) => {
  const p = byId('professores', v.professorId);
  if (p && !ativo(p)) return `${p.nome} está com o contrato encerrado e não pode receber aulas.`;
  if (p && !habilitadas(p).includes(v.disciplinaId)) return `${p.nome} não é habilitado(a) em ${discNome(v.disciplinaId)}. As formações habilitam: ${habilitadas(p).map(discNome).join(', ') || 'nenhuma disciplina'}.`;
  return aulaCheck(v, id);
};
CHG.aulaDisc = el => {
  const sel = $('#f-professorId'); if (!sel) return; const d = el.value;
  [...sel.options].forEach(o => { if (!o.value) return; const p = byId('professores', o.value); o.disabled = !!d && !habilitadas(p).includes(d); });
  if (sel.selectedOptions[0]?.disabled) sel.value = '';
};
HYDRATORS.push(root => { const d = root.querySelector('[data-change="aulaDisc"]'); if (d) CHG.aulaDisc(d); });

// Revisão da migração de formações
function migracaoCard() {
  const rel = (DADOS.migracoes || []).flatMap(m => m.formacoes || []).filter(r => r.status === 'revisar' && !r.revisado && byId('professores', r.professorId));
  if (!rel.length) return '';
  return `<section class="card" style="border-color:var(--v300)" aria-labelledby="mig-h"><h2 id="mig-h">Revise as formações migradas</h2>
    <p class="muted">Os professores tinham disciplinas marcadas à mão. O sistema converteu para formações: primeiro pelo texto do curso informado, depois pela formação que cobre as disciplinas que a pessoa leciona. Confirme com o diploma.</p>
    <ul class="list">${rel.map(r => { const p = byId('professores', r.professorId); return `<li style="flex-wrap:wrap"><span class="grow" style="min-width:14rem"><span class="t">${esc(p.nome)}</span><br><span class="m">Formações atribuídas: ${esc(p.formacoes.map(formNome).join(', '))}.${r.inferidas.length ? ` Deduzida pelas aulas: ${esc(r.inferidas.join(', '))}.` : ''}${r.semCobertura.length ? ` Sem formação que habilite: ${esc(r.semCobertura.map(discNome).join(', '))}.` : ''}</span></span><button class="btn ghost sm" data-act="edit" data-ent="professores" data-id="${p.id}" aria-label="Editar formações de ${esc(p.nome)}">Editar</button><button class="btn outline sm" data-act="mig-ok" data-id="${p.id}" aria-label="Confirmar formações de ${esc(p.nome)}">Confirmar</button></li>`; }).join('')}</ul></section>`;
}
ACT['mig-ok'] = el => { (DADOS.migracoes || []).forEach(m => (m.formacoes || []).forEach(r => { if (r.professorId === el.dataset.id) r.revisado = true; })); save(); rerender(); toast('Formações confirmadas.'); };

// ---------- 2. Perfil Diretor ----------
function dInicio() {
  const g = me(); const e = byId('escolas', escSessao());
  const mes = TODAY_ISO.slice(0, 7);
  const evMes = DADOS.eventos.filter(x => x.data.startsWith(mes));
  const prox = DADOS.eventos.filter(x => x.data >= TODAY_ISO).sort((a, b) => a.data.localeCompare(b.data));
  const prova = prox.find(x => x.tipo === 'Avaliação');
  return pageHead(`${greet()}, ${firstName(g.nome)}.`, `Direção da ${esc(e?.nome || 'rede')}. O calendário escolar é responsabilidade da direção.`, can('calendario.editar') ? `<button class="btn primary" data-act="new" data-ent="eventos">${icon('plus')}Adicionar evento</button>` : '', 'hello') +
    fioSemana() +
    `<section class="stats" aria-label="Resumo">
      ${statCard('peach', 'Eventos no mês', evMes.length, cap(TODAY.toLocaleDateString('pt-BR', { month: 'long' })), 'calendario')}
      ${statCard('rose', 'Próxima avaliação', prova ? fmtD(prova.data).slice(0, 5) : '—', prova ? esc(prova.titulo) : 'Nenhuma marcada', 'calendario')}
      ${statCard('mint', 'Alunos', alunosEsc().length, `${turmasEsc().length} turmas`)}
      ${statCard('peri', 'Feriados e recessos', prox.filter(x => ['Feriado', 'Recesso'].includes(x.tipo)).length, 'até o fim do ano')}
    </section>
    ${hrowOpen('painel-dir')}
      <section class="card" aria-labelledby="dev-h"><div class="card-h"><h2 id="dev-h">Próximos eventos</h2><button class="btn ghost sm" data-act="go" data-route="calendario">Abrir calendário</button></div><ul class="list">${prox.slice(0, 6).map(x => evItem(x, can('calendario.editar'))).join('')}</ul></section>
      <section class="card" aria-labelledby="dcm-h"><div class="card-h"><h2 id="dcm-h">Comunicados recentes</h2><button class="btn ghost sm" data-act="go" data-route="comunicados">Ver todos</button></div><ul class="list">${DADOS.comunicados.slice().sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3).map(c => `<li><span class="grow"><span class="t">${esc(c.titulo)}</span><br><span class="m">${esc(c.autor)}, ${fmtD(c.data)}</span></span></li>`).join('')}</ul></section>
    </div>`;
}
const calendarioPage = () => {
  const ed = can('calendario.editar');
  return pageHead('Calendário escolar', ed ? 'Feriados, avaliações, reuniões e prazos. Selecione um dia para adicionar um evento ou um evento para editá-lo.' : 'Feriados, avaliações, reuniões e prazos. Quem altera o calendário é a direção da escola.', ed ? `<button class="btn primary" data-act="new" data-ent="eventos">${icon('plus')}Adicionar evento</button>` : '') + calendarView(ed);
};
PAGES.gestao.calendario = calendarioPage;
PAGES.diretor = {
  inicio: dInicio, calendario: calendarioPage, comunicados: () => crudPage('comunicados'), relatorios: gRelatorios,
  boletins: gBoletins, ocorrencias: () => crudPage('ocorrencias')
};

// Matriz de perfis e permissões (Configurações da secretaria da rede)
function perfisHTML() {
  if (SESSION.role !== 'gestao' || escSessao()) return '';
  const roles = Object.keys(PERFIS_PADRAO);
  const atual = r => (DADOS.perfis && DADOS.perfis[r]) || PERFIS_PADRAO[r];
  return `<form class="card" data-form="perfis" novalidate aria-labelledby="pf-h"><h2 id="pf-h">Perfis de acesso</h2><p class="muted">O que cada perfil pode fazer. Ao ligar uma permissão, o item correspondente aparece no menu do perfil.</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Permissão</th>${roles.map(r => `<th scope="col" class="n">${esc(ROLE_LABEL[r])}</th>`).join('')}</tr></thead><tbody>${PERMISSOES.map(([k, l]) => `<tr><th scope="row">${esc(l)}</th>${roles.map(r => `<td class="n"><input type="checkbox" name="perm" value="${r}|${k}" ${atual(r).includes(k) ? 'checked' : ''} aria-label="${esc(ROLE_LABEL[r])}: ${esc(l)}" style="width:1.25rem;height:1.25rem;accent-color:var(--bg-brand)"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="row"><button class="btn primary" type="submit">${icon('check')}Salvar permissões</button><button class="btn ghost" type="button" data-act="perfis-padrao">Voltar ao padrão</button></div></form>`;
}
FORMS.perfis = f => { const p = {}; Object.keys(PERFIS_PADRAO).forEach(r => { p[r] = []; }); new FormData(f).getAll('perm').forEach(v => { const [r, k] = v.split('|'); p[r].push(k); }); DADOS.perfis = p; save(); toast('Permissões salvas.'); };
ACT['perfis-padrao'] = () => { DADOS.perfis = JSON.parse(JSON.stringify(PERFIS_PADRAO)); save(); rerender(); toast('Permissões voltaram ao padrão.'); };
const gConfigBase = PAGES.gestao.config;
PAGES.gestao.config = () => gConfigBase() + perfisHTML();

// ---------- 3. RH ----------
function necessidades() {
  const rows = [];
  uniq(DADOS.turmas.map(t => t.escolaId)).forEach(e => DADOS.disciplinas.forEach(d => {
    const aulas = DADOS.aulas.filter(a => a.disciplinaId === d.id && byId('turmas', a.turmaId)?.escolaId === e);
    if (!aulas.length) return;
    const abertas = aulas.filter(a => !ativo(byId('professores', a.professorId)));
    const vencendo = aulas.filter(a => { const p = byId('professores', a.professorId); return ativo(p) && p.ingresso === 'Contrato' && diasAte(p.contratoFim) <= 30; });
    const saidas = uniq(abertas.map(a => a.professorId)).map(id => byId('professores', id)).filter(Boolean);
    const cand = DADOS.professores.filter(p => ativo(p) && habilitadas(p).includes(d.id) && livres(p) > 0)
      .map(p => ({ p, podem: Math.min(livres(p), abertas.filter(a => !conflita(p, a)).length) })).filter(x => x.podem > 0).sort((a, b) => b.podem - a.podem);
    rows.push({ e, d: d.id, nec: aulas.length, cob: aulas.length - abertas.length, saldo: abertas.length, abertas, vencendo, saidas, cand });
  }));
  return rows;
}
function rhPainel() {
  const rows = necessidades(); const so = UI.sel.rhFalta !== false;
  const falta = rows.filter(r => r.saldo > 0);
  const vence30 = DADOS.professores.filter(p => ativo(p) && p.ingresso === 'Contrato' && diasAte(p.contratoFim) <= 30);
  const comLivres = DADOS.professores.filter(p => livres(p) > 0);
  const vis = so ? rows.filter(r => r.saldo > 0 || r.vencendo.length) : rows;
  const talentosPara = d => (DADOS.talentos || []).filter(t => t.situacao === 'Aguardando chamada' && (DADOS.formacoes.find(f => f.id === t.formacaoId)?.disciplinas || []).includes(d)).length;
  const comoCobrir = r => {
    if (!r.saldo) return r.vencendo.length ? st(`${r.vencendo.length}h abrem em até 30 dias`, 'warn') : st('Completo', 'ok');
    const c = r.cand[0]; const resta = r.saldo - (c ? c.podem : 0);
    return `${c ? `<p>${esc(c.p.nome)} pode cobrir <b>${c.podem}h</b> (tem ${livres(c.p)}h livres).</p><button class="btn outline sm" data-act="rh-cobrir" data-e="${r.e}" data-d="${r.d}" data-p="${c.p.id}" aria-label="Atribuir ${c.podem} aulas de ${esc(discNome(r.d))} a ${esc(c.p.nome)}">Atribuir a ${esc(firstName(c.p.nome))}</button>` : ''}
      ${resta > 0 ? `<p style="margin-top:.375rem">${st(c ? `Contratar para ${resta}h restantes` : 'Será preciso contratar', 'err')}</p>${talentosPara(r.d) ? `<button class="btn ghost sm" data-act="rh-talentos" data-d="${r.d}">${talentosPara(r.d)} no banco de talentos</button>` : '<p class="caption">Nenhum candidato habilitado no banco de talentos.</p>'}` : ''}`;
  };
  return pageHead('Necessidade de professores', 'Carga horária necessária pela grade de cada escola, quanto está coberto e quanto falta. Horas contam aulas semanais de 50 minutos. Quando um contrato termina, as aulas daquele professor viram necessidade em aberto.', '', 'hello') +
    `<section class="stats" aria-label="Resumo">
      ${statCard('peach', 'Horas sem professor', falta.reduce((n, r) => n + r.saldo, 0), `${falta.length} disciplina${falta.length === 1 ? '' : 's'} com falta`)}
      ${statCard('rose', 'Contratos vencendo', vence30.length, 'nos próximos 30 dias', 'contratos')}
      ${statCard('mint', 'Professores com horas livres', comLivres.length, `${comLivres.reduce((n, p) => n + livres(p), 0)}h disponíveis no total`, 'professores')}
      ${statCard('peri', 'Banco de talentos', (DADOS.talentos || []).filter(t => t.situacao === 'Aguardando chamada').length, 'candidatos aguardando chamada', 'talentos')}
    </section>
    <label class="check" style="align-self:flex-start"><input type="checkbox" id="rh-so" data-change="rhSo" ${so ? 'checked' : ''}> Mostrar só onde falta professor ou vai faltar</label>
    ${uniq(vis.map(r => r.e)).map(e => `<section class="card" aria-labelledby="nec-${e}"><h2 id="nec-${e}">${esc(escNome(e))}</h2>
      <div class="tbl-wrap"><table class="tbl stack"><thead><tr><th scope="col">Disciplina</th><th scope="col" class="n">Necessária</th><th scope="col" class="n">Coberta</th><th scope="col">Saldo</th><th scope="col">Como cobrir</th></tr></thead><tbody>${vis.filter(r => r.e === e).sort((a, b) => b.saldo - a.saldo).map(r => `<tr><th scope="row">${esc(discNome(r.d))}${r.saidas.length ? caption2('Saiu: ' + r.saidas.map(p => `${esc(p.nome)} (${esc(fimTxt(p).toLowerCase())})`).join(', ')) : ''}${r.vencendo.length ? caption2('Vai sair: ' + uniq(r.vencendo.map(a => a.professorId)).map(id => esc(fimTxt(byId('professores', id)).replace('Contrato termina', byId('professores', id).nome + ' termina'))).join(', ')) : ''}</th><td class="n" data-label="Necessária">${r.nec}h</td><td class="n" data-label="Coberta">${r.cob}h</td><td data-label="Saldo">${r.saldo ? st(`${discNome(r.d)}: faltam ${r.saldo}h`, 'err') : st('Sem falta', 'ok')}</td><td data-label="Como cobrir">${comoCobrir(r)}</td></tr>`).join('')}</tbody></table></div></section>`).join('') || '<p class="empty">Nenhuma escola com falta de professor.</p>'}`;
}
CHG.rhSo = el => { UI.sel.rhFalta = el.checked; rerender(); };
ACT['rh-cobrir'] = el => {
  const p = byId('professores', el.dataset.p); const r = necessidades().find(x => x.e === el.dataset.e && x.d === el.dataset.d);
  let n = 0;
  r.abertas.forEach(a => { if (livres(p) > 0 && !conflita(p, a)) { a.professorId = p.id; n++; } });
  save(); rerender(); toast(`${n} aula${n === 1 ? '' : 's'} de ${discNome(r.d)} atribuída${n === 1 ? '' : 's'} a ${p.nome}.`);
};
ACT['rh-talentos'] = el => { const f = DADOS.formacoes.find(x => x.disciplinas.includes(el.dataset.d) && (DADOS.talentos || []).some(t => t.formacaoId === x.id)); UI.f.talentos = f ? f.id : ''; go('talentos'); };

function rhContratos() {
  const per = UI.sel.ctPer || '30', dis = UI.sel.ctDis || '';
  const fimMes = off => { const d = new Date(TODAY.getFullYear(), TODAY.getMonth() + off + 1, 0, 12); return isoOf(d); };
  const iniMes = off => isoOf(new Date(TODAY.getFullYear(), TODAY.getMonth() + off, 1, 12));
  const faixa = { 30: [TODAY_ISO, addDays(30)], 60: [TODAY_ISO, addDays(60)], 90: [TODAY_ISO, addDays(90)], mes: [TODAY_ISO, fimMes(0)], prox: [iniMes(1), fimMes(1)], vencidos: ['0000', addDays(-1)], todos: ['0000', '9999'] }[per];
  const discsDe = p => uniq(aulasDoProf(p).map(a => a.disciplinaId));
  const list = DADOS.professores.filter(p => p.ingresso === 'Contrato' && p.contratoFim && p.contratoFim >= faixa[0] && p.contratoFim <= faixa[1] && (!dis || discsDe(p).includes(dis) || habilitadas(p).includes(dis))).sort((a, b) => a.contratoFim.localeCompare(b.contratoFim));
  const horas = list.reduce((n, p) => n + aulasDoProf(p).length, 0);
  return pageHead('Contratos a vencer', 'Professores contratados com término no período escolhido. Use para planejar a renovação ou a contratação antes de a turma ficar sem aula.') +
    `<div class="toolbar">${selectCtl('ct-per', 'Período', [['30', 'Próximos 30 dias'], ['60', 'Próximos 60 dias'], ['90', 'Próximos 90 dias'], ['mes', 'Até o fim deste mês'], ['prox', 'Próximo mês'], ['vencidos', 'Já encerrados'], ['todos', 'Todos os contratos']], per, 'ctPer')}${selectCtl('ct-dis', 'Disciplina', [['', 'Todas'], ...DADOS.disciplinas.map(d => [d.id, d.nome])], dis, 'ctDis')}</div>
    <p class="muted" aria-live="polite">${list.length} contrato${list.length === 1 ? '' : 's'}, ${horas} aula${horas === 1 ? '' : 's'} semanais que ficam sem professor no término.</p>
    ${list.length ? `<div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">Contratos</caption><thead><tr><th scope="col">Professor</th><th scope="col">Disciplinas</th><th scope="col">Escolas</th><th scope="col">Vigência</th><th scope="col">Situação</th><th scope="col" class="n">Aulas em aberto</th></tr></thead><tbody>${list.map(p => { const n = diasAte(p.contratoFim); return `<tr><th scope="row">${esc(p.nome)}${caption2(esc(p.telefone || p.email))}</th><td data-label="Disciplinas">${esc(discsDe(p).map(discNome).join(', ') || habilitadas(p).map(discNome).join(', '))}</td><td data-label="Escolas">${esc(uniq(aulasDoProf(p).map(a => byId('turmas', a.turmaId)?.escolaId)).map(escNome).join(', ') || escNome(p.escolaId))}</td><td data-label="Vigência">${fmtD(p.contratoInicio)} a ${fmtD(p.contratoFim)}</td><td data-label="Situação">${n < 0 ? st(`Encerrado há ${-n} dia${n === -1 ? '' : 's'}`, 'err') : st(n === 0 ? 'Termina hoje' : `Termina em ${n} dia${n > 1 ? 's' : ''}`, n <= 30 ? 'warn' : 'info')}</td><td class="n" data-label="Aulas em aberto">${aulasDoProf(p).length}h</td></tr>`; }).join('')}</tbody></table></div>
      <div class="row"><button class="btn outline" data-act="copy" data-text="${esc(list.map(p => `${p.nome};${discsDe(p).map(discNome).join(', ')};${fmtD(p.contratoFim)};${aulasDoProf(p).length}h`).join('\n'))}">${icon('copy')}Copiar lista</button></div>` : '<p class="empty">Nenhum contrato termina nesse período.</p>'}`;
}
CHG.ctPer = el => { UI.sel.ctPer = el.value; rerender(); };
CHG.ctDis = el => { UI.sel.ctDis = el.value; rerender(); };

ENT.talentos = {
  coll: 'talentos', title: 'Banco de talentos', singular: 'candidato', plural: 'candidatos', newLabel: 'Cadastrar candidato',
  desc: 'Candidatos classificados em processos seletivos que ainda não foram chamados. Consulte quando abrir uma vaga ou um afastamento.',
  fields: () => [{ k: 'nome', l: 'Nome completo', req: 1, wide: 1 }, { k: 'formacaoId', l: 'Formação', t: 'select', o: () => DADOS.formacoes.map(f => [f.id, f.nome]), req: 1 }, { k: 'telefone', l: 'Telefone', t: 'tel', req: 1 }, { k: 'email', l: 'E-mail', t: 'email' }, { k: 'processo', l: 'Processo seletivo', req: 1, wide: 1, t: 'select', outro: 1, o: L('processosSeletivos') }, { k: 'classificacao', l: 'Classificação', t: 'number', req: 1, attrs: 'min="1"' }, { k: 'situacao', l: 'Situação', t: 'select', o: optsFix(['Aguardando chamada', 'Chamado', 'Desistiu']), req: 1 }],
  defaults: () => ({ processo: 'Seleção Simplificada SEE 2025, professor temporário', situacao: 'Aguardando chamada' }),
  filter: { k: 'formacaoId', l: 'Formação', o: () => DADOS.formacoes.map(f => [f.id, f.nome]) },
  sort: (a, b) => (a.situacao === 'Aguardando chamada' ? 0 : 1) - (b.situacao === 'Aguardando chamada' ? 0 : 1) || a.processo.localeCompare(b.processo) || a.classificacao - b.classificacao,
  cols: [['Candidato', r => `${esc(r.nome)}${caption2(`${esc(r.telefone)}${r.email ? ', ' + esc(r.email) : ''}`)}`], ['Formação', r => `${esc(formNome(r.formacaoId))}${caption2('Habilita: ' + esc((DADOS.formacoes.find(f => f.id === r.formacaoId)?.disciplinas || []).map(discNome).join(', ') || 'nenhuma disciplina'))}`], ['Processo seletivo', r => esc(r.processo)], ['Classificação', r => `${r.classificacao}º`, 'n'], ['Situação', r => r.situacao === 'Aguardando chamada' ? st('Aguardando chamada', 'info') : r.situacao === 'Chamado' ? st('Chamado', 'ok') : esc(r.situacao)]],
  rowActs: r => r.situacao === 'Aguardando chamada' && can('talentos.gerir') ? `<button class="btn outline sm" data-act="chamar" data-id="${r.id}" aria-label="Chamar ${esc(r.nome)}">Chamar</button>` : '',
  canEdit: () => can('talentos.gerir'), canNew: () => can('talentos.gerir'),
  name: r => r.nome
};
ACT.chamar = el => {
  const t = byId('talentos', el.dataset.id);
  openDialog({ title: `Chamar ${t.nome}`, body: `<p class="muted">${esc(formNome(t.formacaoId))}, ${t.classificacao}º lugar em ${esc(t.processo)}. O candidato vira professor contratado e já pode receber aulas.</p><div class="form-grid">${fieldHTML({ k: 'ch-esc', l: 'Escola de lotação', t: 'select', o: DADOS.escolas.filter(e => DADOS.turmas.some(x => x.escolaId === e.id)).map(e => [e.id, e.nome]), req: 1 }, '')}${fieldHTML({ k: 'ch-carga', l: 'Carga horária semanal', t: 'number', req: 1 }, 20)}${fieldHTML({ k: 'ch-ini', l: 'Início do contrato', t: 'date', req: 1 }, TODAY_ISO)}${fieldHTML({ k: 'ch-fim', l: 'Término do contrato', t: 'date', req: 1 }, `${TODAY.getFullYear()}-12-18`)}</div>`,
    onSubmit: () => {
      if ($('#f-ch-fim').value < $('#f-ch-ini').value) { toast('O término precisa ser depois do início.', 'err'); return false; }
      DADOS.professores.push({ id: uid(), nome: t.nome, email: t.email || '', telefone: t.telefone, escolaId: $('#f-ch-esc').value, formacoes: [t.formacaoId], instituicao: '', ingresso: 'Contrato', contratoInicio: $('#f-ch-ini').value, contratoFim: $('#f-ch-fim').value, cargaHoraria: Number($('#f-ch-carga').value) || 20 });
      t.situacao = 'Chamado'; save(); rerender(); toast(`${t.nome} foi chamado e já aparece entre os professores.`);
    } });
};

PAGES.rh = {
  inicio: rhPainel,
  professores: () => crudPage('professores', migracaoCard()),
  formacoes: () => crudPage('formacoes'),
  contratos: rhContratos,
  talentos: () => crudPage('talentos')
};
const gProfBase = PAGES.gestao.professores;
PAGES.gestao.professores = () => gProfBase() + (can('professores.editar') ? '' : '<p class="caption">O cadastro de professores é feito pelo RH. Aqui você consulta formações, ingresso e carga horária.</p>');
