/* Portal Entrelaço — merenda: estoque por escola (entradas da Seduc, consumo diário, alertas) e painel do DAE */
'use strict';

const alimento = id => (DADOS.alimentos || []).find(a => a.id === id);
const qtd = (n, a) => `${num(n, n % 1 ? 1 : 0)} ${alimento(a)?.unidade || ''}`.trim();
const entradasDe = (e, a) => DADOS.entradas.filter(x => x.escolaId === e && x.alimentoId === a);
const consumosDe = (e, a) => DADOS.consumos.filter(x => x.escolaId === e && x.alimentoId === a);
const saldo = (e, a) => entradasDe(e, a).reduce((n, x) => n + x.quantidade, 0) - consumosDe(e, a).reduce((n, x) => n + x.quantidade, 0);
const ultimaEntrada = (e, a) => entradasDe(e, a).sort((x, y) => y.data.localeCompare(x.data))[0];
const pctAlerta = () => Number(DADOS.config.alertaEstoque) || 50;
const rotuloAlerta = () => pctAlerta() === 50 ? 'Estoque na metade' : `Estoque em ${pctAlerta()}% ou menos`;
function mediaDia(e, a, dias = 14) {
  const de = addDays(-dias); const cs = consumosDe(e, a).filter(x => x.data >= de);
  const d = uniq(cs.map(x => x.data)).length; return d ? cs.reduce((n, x) => n + x.quantidade, 0) / d : 0;
}
function situacaoItem(e, a) {
  const u = ultimaEntrada(e, a); if (!u) return null;
  const s = saldo(e, a); const pct = u.quantidade ? s / u.quantidade * 100 : 0; const m = mediaDia(e, a);
  return { e, a, s, pct, u, media: m, dias: m ? Math.floor(s / m) : null, alerta: s <= u.quantidade * pctAlerta() / 100, zerado: s <= 0 };
}
const escolasEstoque = () => uniq(DADOS.entradas.map(x => x.escolaId)).filter(e => naEscola(e)).sort((x, y) => escNome(x).localeCompare(escNome(y)));
const alertas = () => escolasEstoque().flatMap(e => DADOS.alimentos.map(a => situacaoItem(e, a.id)).filter(x => x && x.alerta));
const pctHTML = x => `<span class="bar-track" style="display:block;height:.5rem;margin-top:.25rem" aria-hidden="true"><span class="bar-fill ${x.alerta ? 'low' : ''}" style="display:block;width:${Math.max(2, Math.min(100, x.pct))}%"></span></span>`;
const sitEstHTML = x => x.zerado ? st('Sem estoque', 'err') : x.alerta ? st(rotuloAlerta(), 'err') : x.pct <= pctAlerta() + 15 ? st('Atenção', 'warn') : st('Normal', 'ok');
// Sugestão de remanejamento: outra escola com o mesmo item acima de 80% da última entrada
function remanejar(x) {
  const doa = escolasEstoque().filter(e => e !== x.e).map(e => situacaoItem(e, x.a)).filter(y => y && y.pct >= 80 && !y.alerta).sort((p, q) => q.pct - p.pct)[0];
  if (!doa) return '';
  const pode = Math.floor((doa.s - doa.u.quantidade * 0.6) * 10) / 10;
  return pode > 0 ? `Remanejar até ${qtd(pode, x.a)} da ${escNome(doa.e)}` : '';
}

ENT.entradas = {
  coll: 'entradas', title: 'Entradas da Seduc', singular: 'entrada', plural: 'entradas', fem: true, newLabel: 'Registrar entrada',
  desc: 'Alimentos distribuídos pela Seduc para cada escola. A última entrada de cada item é a referência do alerta de estoque.',
  fields: semEscola(() => [{ k: 'escolaId', l: 'Escola', t: 'select', o: optsOf('escolas'), req: 1, wide: 1 }, { k: 'alimentoId', l: 'Alimento', t: 'select', o: () => DADOS.alimentos.map(a => [a.id, `${a.nome} (${a.unidade})`]), req: 1 }, { k: 'quantidade', l: 'Quantidade', t: 'number', req: 1, attrs: 'min="0.1" step="0.1"' }, { k: 'data', l: 'Data da entrega', t: 'date', req: 1 }, { k: 'guia', l: 'Guia de remessa', help: 'Número do documento da entrega' }]),
  defaults: () => ({ data: TODAY_ISO, origem: 'Seduc', escolaId: escSessao() || undefined }),
  rows: () => DADOS.entradas.filter(x => naEscola(x.escolaId)),
  sort: (a, b) => b.data.localeCompare(a.data),
  cols: [['Data', r => `<span class="num">${fmtD(r.data)}</span>`], ['Escola', r => esc(escNome(r.escolaId))], ['Alimento', r => esc(alimento(r.alimentoId)?.nome)], ['Quantidade', r => qtd(r.quantidade, r.alimentoId), 'n'], ['Guia', r => esc(r.guia || '—')]],
  canEdit: () => can('merenda.estoque'), canNew: () => can('merenda.estoque'),
  check: v => v.quantidade > 0 ? '' : 'Informe uma quantidade maior que zero.',
  name: r => `${alimento(r.alimentoId)?.nome}, ${fmtD(r.data)}`
};

// ---------- Escola: estoque e consumo do dia ----------
function estoqueEscola(e) {
  const itens = DADOS.alimentos.map(a => situacaoItem(e, a.id)).filter(Boolean);
  const hoje = DADOS.consumos.filter(x => x.escolaId === e && x.data === (UI.sel.consData || TODAY_ISO));
  return `<section class="rel-sec" aria-labelledby="est-h"><div class="rel-head"><h2 id="est-h">Estoque de alimentos</h2><p class="muted">Saldo de cada item comparado com a última entrega da Seduc. O alerta aparece quando o saldo chega a ${pctAlerta()}% da última entrada.</p></div>
    <div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">Estoque da escola</caption><thead><tr><th scope="col">Alimento</th><th scope="col" class="n">Saldo</th><th scope="col">Da última entrada</th><th scope="col" class="n">Consumo por dia</th><th scope="col" class="n">Dura</th><th scope="col">Situação</th></tr></thead><tbody>${itens.map(x => `<tr><th scope="row">${esc(alimento(x.a).nome)}${caption2(`Última entrada: ${qtd(x.u.quantidade, x.a)} em ${fmtD(x.u.data)}`)}</th><td class="n" data-label="Saldo">${qtd(Math.max(0, x.s), x.a)}</td><td data-label="Da última entrada">${num(Math.max(0, x.pct), 0)}%${pctHTML(x)}</td><td class="n" data-label="Consumo por dia">${x.media ? qtd(x.media, x.a) : '—'}</td><td class="n" data-label="Dura">${x.dias == null ? '—' : x.dias + ' dia' + (x.dias === 1 ? '' : 's')}</td><td data-label="Situação">${sitEstHTML(x)}</td></tr>`).join('')}</tbody></table></div>
    ${can('merenda.estoque') ? `<div class="grid g2">
      <form class="card" data-form="consumo" novalidate aria-labelledby="cons-h"><h3 id="cons-h">Registrar consumo do dia</h3><div class="field" style="max-width:12rem"><label for="cons-data">Data</label><input id="cons-data" type="date" value="${UI.sel.consData || TODAY_ISO}" max="${TODAY_ISO}" data-change="consData"></div>
        <div class="form-grid">${DADOS.alimentos.map(a => { const ja = hoje.filter(x => x.alimentoId === a.id).reduce((n, x) => n + x.quantidade, 0); return `<div class="field"><label for="cons-${a.id}">${esc(a.nome)} (${esc(a.unidade)})</label><input id="cons-${a.id}" class="input" inputmode="decimal" data-cons="${a.id}" value="${ja ? num(ja, ja % 1 ? 1 : 0) : ''}" placeholder="0"></div>`; }).join('')}</div>
        <p class="caption">Deixe em branco o que não foi usado. Se já houver registro nesse dia, o valor é substituído.</p>
        <div class="row"><button class="btn primary" type="submit">${icon('check')}Salvar consumo</button></div></form>
      <section class="card" aria-labelledby="ent-h"><div class="card-h"><h3 id="ent-h">Entregas recebidas</h3><button class="btn outline sm" data-act="new" data-ent="entradas">${icon('plus')}Registrar entrada</button></div><ul class="list">${DADOS.entradas.filter(x => x.escolaId === e).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 8).map(x => `<li><span class="grow"><span class="t">${esc(alimento(x.alimentoId)?.nome)}</span><br><span class="m">${fmtD(x.data)}${x.guia ? ', guia ' + esc(x.guia) : ''}</span></span><b class="num">${qtd(x.quantidade, x.alimentoId)}</b></li>`).join('')}</ul></section>
    </div>` : ''}</section>`;
}
CHG.consData = el => { UI.sel.consData = el.value || TODAY_ISO; rerender(); };
FORMS.consumo = f => {
  const e = escSessao(); const data = UI.sel.consData || TODAY_ISO; const erros = []; const novos = [];
  $$('[data-cons]', f).forEach(i => {
    const v = i.value.trim(); const a = i.dataset.cons; if (!v) return;
    const q = Number(v.replace(',', '.'));
    if (isNaN(q) || q < 0) { erros.push(`${alimento(a).nome}: valor inválido`); return; }
    const antes = DADOS.consumos.filter(x => x.escolaId === e && x.alimentoId === a && x.data === data).reduce((n, x) => n + x.quantidade, 0);
    if (q - antes > saldo(e, a) + 1e-9) { erros.push(`${alimento(a).nome}: o consumo passa do estoque (${qtd(Math.max(0, saldo(e, a)), a)})`); return; }
    novos.push([a, q]);
  });
  if (erros.length) { toast(erros[0], 'err'); alertSR(erros.join('. ')); return; }
  novos.forEach(([a, q]) => { DADOS.consumos = DADOS.consumos.filter(x => !(x.escolaId === e && x.alimentoId === a && x.data === data)); if (q > 0) DADOS.consumos.push({ id: uid(), escolaId: e, alimentoId: a, quantidade: q, data }); });
  save(); rerender(); const al = alertas().length; toast(`Consumo de ${fmtD(data)} salvo.${al ? ` ${al} item${al > 1 ? 's' : ''} em alerta.` : ''}`);
};

// ---------- Painel do DAE (e da sede) ----------
function daeMatriz() {
  const escs = escolasEstoque(); const als = DADOS.alimentos;
  return `<div class="tbl-wrap"><table class="tbl"><caption>Saldo por escola</caption><thead><tr><th scope="col">Escola</th>${als.map(a => `<th scope="col" class="n">${esc(a.nome)}</th>`).join('')}</tr></thead><tbody>${escs.map(e => `<tr><th scope="row">${esc(escNome(e))}</th>${als.map(a => { const x = situacaoItem(e, a.id); return `<td class="n">${x ? `${x.alerta ? `<span class="st err">${icon('errc')}${qtd(Math.max(0, x.s), a.id)}</span>` : qtd(x.s, a.id)}${caption2(num(Math.max(0, x.pct), 0) + '%')}` : '—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function daePainel() {
  const al = alertas().sort((a, b) => a.pct - b.pct);
  const mes = TODAY_ISO.slice(0, 7);
  return pageHead('Estoque da merenda na rede', 'Saldo de alimentos em todas as escolas, alertas e consumo para planejar compras e redistribuição.', '', 'hello') +
    `<section class="stats" aria-label="Resumo">
      ${statCard('rose', 'Alertas ativos', al.length, rotuloAlerta())}
      ${statCard('peach', 'Itens zerados', al.filter(x => x.zerado).length, 'precisam de entrega urgente')}
      ${statCard('lilac', 'Escolas acompanhadas', escolasEstoque().length, `${DADOS.alimentos.length} alimentos`)}
      ${statCard('mint', 'Entregas no mês', DADOS.entradas.filter(x => x.data.startsWith(mes)).length, 'registradas pela Seduc', 'entradas')}
    </section>
    <form class="card" data-form="alerta-pct" novalidate aria-labelledby="pct-h"><h2 id="pct-h">Regra do alerta</h2><div class="row" style="align-items:flex-end"><div class="field" style="max-width:16rem"><label for="pct-v">Avisar quando o saldo chegar a</label><div class="row" style="gap:.5rem;flex-wrap:nowrap"><input id="pct-v" class="input" type="number" min="5" max="95" step="5" value="${pctAlerta()}" style="max-width:6rem"><span>% da última entrada</span></div></div><button class="btn outline" type="submit">${icon('check')}Salvar regra</button></div><p class="caption">O alerta vai para o DAE, para a secretaria da rede e para a escola.</p></form>
    <section class="card" aria-labelledby="al-h"><h2 id="al-h">Alertas ativos</h2>${al.length ? `<div class="tbl-wrap"><table class="tbl stack"><thead><tr><th scope="col">Escola e alimento</th><th scope="col" class="n">Saldo</th><th scope="col" class="n">Da última entrada</th><th scope="col" class="n">Dura</th><th scope="col">Sugestão</th></tr></thead><tbody>${al.map(x => `<tr><th scope="row">${esc(alimento(x.a).nome)}${caption2(esc(escNome(x.e)))}</th><td class="n" data-label="Saldo">${sitEstHTML(x)}${caption2(qtd(Math.max(0, x.s), x.a))}</td><td class="n" data-label="Da última entrada">${num(Math.max(0, x.pct), 0)}% de ${qtd(x.u.quantidade, x.a)}</td><td class="n" data-label="Dura">${x.dias == null ? '—' : `${x.dias} dia${x.dias === 1 ? '' : 's'}`}</td><td data-label="Sugestão">${esc(remanejar(x) || 'Programar nova entrega')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhum item em alerta.</p>'}</section>
    <section class="card" aria-labelledby="mx-h"><h2 id="mx-h">Estoque de todas as escolas</h2>${daeMatriz()}<p class="caption">Abaixo de cada saldo, o percentual em relação à última entrada.</p></section>`;
}
FORMS['alerta-pct'] = () => { const v = Number($('#pct-v').value); if (!v || v < 5 || v > 95) { toast('Use um percentual entre 5 e 95.', 'err'); return; } DADOS.config.alertaEstoque = v; save(); rerender(); toast(`Regra salva: alerta com ${v}% da última entrada.`); };

function daeHistorico() {
  if (!DADOS.alimentos.some(a => a.id === UI.sel.histAl)) UI.sel.histAl = DADOS.alimentos[0].id;
  const a = UI.sel.histAl; const escs = escolasEstoque();
  const dias = uniq(DADOS.consumos.filter(x => x.alimentoId === a && x.data >= addDays(-14)).map(x => x.data)).sort().reverse().slice(0, 10);
  const linhas = escs.map(e => { const x = situacaoItem(e, a); return { e, x, tot: consumosDe(e, a).filter(c => c.data >= addDays(-14)).reduce((n, c) => n + c.quantidade, 0) }; }).filter(r => r.x);
  return pageHead('Histórico de consumo', 'Consumo dos últimos 14 dias por escola, média diária e quantos dias o estoque dura. Use para planejar compras e remanejamentos.') +
    `<div class="toolbar">${selectCtl('hist-al', 'Alimento', DADOS.alimentos.map(x => [x.id, `${x.nome} (${x.unidade})`]), a, 'histAl')}</div>
    <div class="grid g2"><section class="card" aria-labelledby="hm-h"><h2 id="hm-h">Consumo médio por dia</h2>${bars(linhas.map(r => [escNome(r.e).replace('Escola Estadual ', '').replace('Escola de Referência ', ''), r.x.media]), Math.max(1, ...linhas.map(r => r.x.media)), v => qtd(v, a))}</section>
    <section class="card" aria-labelledby="hd-h"><h2 id="hd-h">Quanto tempo o estoque dura</h2>${bars(linhas.filter(r => r.x.dias != null).map(r => [escNome(r.e).replace('Escola Estadual ', '').replace('Escola de Referência ', ''), r.x.dias]), Math.max(1, ...linhas.map(r => r.x.dias || 0)), v => `${v} dias`, 5)}<p class="caption">Barras em vermelho duram menos de 5 dias letivos.</p></section></div>
    <div class="tbl-wrap"><table class="tbl stack"><caption>Resumo por escola</caption><thead><tr><th scope="col">Escola</th><th scope="col" class="n">Consumo em 14 dias</th><th scope="col" class="n">Média por dia</th><th scope="col" class="n">Saldo</th><th scope="col">Última entrada</th></tr></thead><tbody>${linhas.map(r => `<tr><th scope="row">${esc(escNome(r.e))}</th><td class="n" data-label="Consumo em 14 dias">${qtd(r.tot, a)}</td><td class="n" data-label="Média por dia">${qtd(r.x.media, a)}</td><td class="n" data-label="Saldo">${qtd(Math.max(0, r.x.s), a)}</td><td data-label="Última entrada">${qtd(r.x.u.quantidade, a)} em ${fmtD(r.x.u.data)}</td></tr>`).join('')}</tbody></table></div>
    ${dias.length ? `<div class="tbl-wrap"><table class="tbl"><caption>Consumo diário</caption><thead><tr><th scope="col">Dia</th>${escs.map(e => `<th scope="col" class="n">${esc(escNome(e).replace('Escola Estadual ', '').replace('Escola de Referência ', ''))}</th>`).join('')}</tr></thead><tbody>${dias.map(d => `<tr><th scope="row" class="num">${fmtD(d)}</th>${escs.map(e => { const q = DADOS.consumos.filter(c => c.escolaId === e && c.alimentoId === a && c.data === d).reduce((n, c) => n + c.quantidade, 0); return `<td class="n">${q ? qtd(q, a) : '—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>` : ''}`;
}
CHG.histAl = el => { UI.sel.histAl = el.value; rerender(); };

// Notificações de estoque: DAE, secretaria da rede e a própria escola
const notifsRedeBase = notifsRede;
notifsRede = function (r, add) {
  notifsRedeBase(r, add);
  if (r === 'dae' || r === 'gestao') alertas().forEach(x => add(`est-${x.e}-${x.a}-${x.u.id}`, `${rotuloAlerta()}: ${alimento(x.a).nome}`, `${escNome(x.e)}, restam ${qtd(Math.max(0, x.s), x.a)} (${num(Math.max(0, x.pct), 0)}% da última entrada)`, r === 'dae' ? 'inicio' : 'merenda', 'utensils'));
};

// Rotas
const gMerendaBase = PAGES.gestao.merenda;
PAGES.gestao.merenda = () => gMerendaBase() + (escSessao() ? estoqueEscola(escSessao()) : `<section class="rel-sec" aria-labelledby="er-h"><div class="rel-head"><h2 id="er-h">Estoque nas escolas</h2><p class="muted">${alertas().length} alerta${alertas().length === 1 ? '' : 's'} ativo${alertas().length === 1 ? '' : 's'}. ${rotuloAlerta()} quando o saldo chega a ${pctAlerta()}% da última entrada.</p></div>${daeMatriz()}</section>`);
PAGES.dae = { inicio: daePainel, entradas: () => crudPage('entradas'), historico: daeHistorico, cardapio: gMerenda };
