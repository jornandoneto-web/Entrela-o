/* Tela: Gerir lotações (Etapa 6, perfil RH). Um professor pode estar lotado em várias escolas ao mesmo tempo;
   a soma das lotações ativas de um vínculo não passa da carga horária desse vínculo. */
'use strict';

ACT['lot-ver'] = el => { UI.sel.lotProf = el.dataset.id; go('lotacoes'); };
CHG.lotProf = el => { UI.sel.lotProf = el.value; rerender(); };

async function telaLotacoes() {
  const profs = (await professorService.listar()).sort((a, b) => a.pessoa.nome.localeCompare(b.pessoa.nome));
  if (!profs.length) return pageHead('Gerir lotações', 'Cadastre um professor antes de lotar.');
  if (!profs.some(p => p.id === UI.sel.lotProf)) UI.sel.lotProf = profs[0].id;
  const p = profs.find(x => x.id === UI.sel.lotProf);
  const [lots, escolas] = await Promise.all([lotacaoService.listarPorProfessor(p.id), escolaService.listar()]);
  const eNome = id => escolas.find(e => e.id === id)?.nome || '—';
  const eLocal = id => { const e = escolas.find(x => x.id === id); return e ? `${regionalService.siglaDR(e.drId)}, ${regionalService.nomeMunicipio(e.municipioId)}` : ''; };
  const ativas = lots.filter(lotacaoAtiva), encerradas = lots.filter(l => !lotacaoAtiva(l)).sort((a, b) => b.dataFim.localeCompare(a.dataFim));
  const vNome = (v, i) => `Vínculo ${i + 1}: ${v.cargo}, ${v.ingresso.toLowerCase()}`;
  return pageHead('Gerir lotações', 'Escolha o professor para ver em que escolas ele está lotado, por vínculo. Ele pode estar em mais de uma escola ao mesmo tempo, até completar a carga horária do vínculo.') +
    `<div class="toolbar">${selectCtl('lot-prof', 'Professor', profs.map(x => [x.id, x.pessoa.nome]), p.id, 'lotProf')}</div>
    ${p.vinculos.map((v, i) => { const s = lotacaoService.saldo(v); const la = ativas.filter(l => l.vinculoId === v.id); const ok = vinculoAtivo(v); return `<section class="card" aria-labelledby="vl-${v.id}">
      <div class="card-h"><div><h2 id="vl-${v.id}">${esc(vNome(v, i))}</h2><p class="muted">${v.cargaHoraria} h semanais, de ${fmtD(v.dataInicio)}${v.dataFim ? ' a ' + fmtD(v.dataFim) : ', sem data de fim'}${ok ? '' : '. Vínculo encerrado'}</p></div>
        ${ok && can('lotacoes.gerir') ? `<button class="btn primary sm" data-act="lot-nova" data-v="${v.id}" ${s.saldo <= 0 ? 'disabled' : ''}>${icon('plus')}Nova lotação</button>` : ''}</div>
      <div><div class="row sp"><span>${s.usado} h lotadas de ${s.total} h</span><b>${s.saldo > 0 ? st(`Saldo: ${s.saldo} h disponíveis`, 'ok') : s.saldo === 0 ? st('Carga completa', 'info') : st(`Excedido em ${-s.saldo} h`, 'err')}</b></div>
        <span class="bar-track" style="display:block;margin-top:.5rem" aria-hidden="true"><span class="bar-fill" style="display:block;width:${Math.min(100, s.usado / (s.total || 1) * 100)}%"></span></span></div>
      ${la.length ? `<div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">Lotações ativas</caption><thead><tr><th scope="col">Escola</th><th scope="col" class="n">Horas</th><th scope="col">Desde</th><th scope="col">Até</th><th scope="col" class="n">Ações</th></tr></thead><tbody>${la.map(l => `<tr><th scope="row">${esc(eNome(l.escolaId))}${caption2(esc(eLocal(l.escolaId)))}</th><td class="n" data-label="Horas">${l.cargaHoraria} h</td><td data-label="Desde">${fmtD(l.dataInicio)}</td><td data-label="Até">${l.dataFim ? fmtD(l.dataFim) : 'Sem data de saída'}</td><td class="n"><div class="acts"><button class="btn ghost sm" data-act="lot-nova" data-v="${v.id}" data-id="${l.id}" aria-label="Editar lotação em ${esc(eNome(l.escolaId))}">Editar</button><button class="btn outline sm" data-act="lot-encerrar" data-id="${l.id}" aria-label="Encerrar lotação em ${esc(eNome(l.escolaId))}">Encerrar</button></div></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhuma lotação ativa neste vínculo.</p>'}
    </section>`; }).join('')}
    <section class="card" aria-labelledby="hist-h"><h2 id="hist-h">Histórico</h2><p class="muted">Escolas onde ${esc(firstName(p.pessoa.nome))} já trabalhou e deixou.</p>
      ${encerradas.length ? `<ul class="list">${encerradas.map(l => `<li><span class="grow"><span class="t">${esc(eNome(l.escolaId))}</span><br><span class="m">${l.cargaHoraria} h, de ${fmtD(l.dataInicio)} até ${fmtD(l.dataFim)}${(() => { const k = p.vinculos.findIndex(v => v.id === l.vinculoId); return k >= 0 ? ', vínculo ' + (k + 1) : ''; })()}</span></span></li>`).join('')}</ul>` : '<p class="empty">Nenhuma lotação encerrada.</p>'}</section>`;
}

ACT['lot-nova'] = async el => {
  const p = await professorService.buscarPorId(UI.sel.lotProf); const v = p.vinculos.find(x => x.id === el.dataset.v);
  const l = el.dataset.id ? await lotacaoService.buscarPorId(el.dataset.id) : Modelos.lotacao({ professorId: p.id, vinculoId: v.id, dataInicio: TODAY_ISO });
  const [drs, escolas] = await Promise.all([regionalService.listar(), escolaService.listar()]);
  UI.cache.drs = drs; UI.cache.escolasCasc = escolas;
  const esc0 = escolas.find(e => e.id === l.escolaId);
  const s = lotacaoService.saldo(v); const saldo = s.saldo + (el.dataset.id && lotacaoAtiva(l) ? l.cargaHoraria : 0);
  openDialog({
    title: el.dataset.id ? 'Editar lotação' : 'Nova lotação', wide: true,
    body: `<p class="muted">${esc(p.pessoa.nome)}. ${esc(v.cargo)}, ${v.cargaHoraria} h. Saldo para esta lotação: <b>${saldo} h</b>.</p>
      <fieldset class="form-grid"><legend class="lbl">Escola</legend>${cascataHTML('lt', { drId: esc0?.drId || '', municipioId: esc0?.municipioId || '', escolaId: l.escolaId }, { escolas, comEscola: true, obrig: true })}</fieldset>
      <div class="form-grid">${fieldHTML({ k: 'lt-ch', l: 'Carga horária na escola (h)', t: 'number', req: 1, attrs: `min="1" max="${Math.max(1, saldo)}"`, help: `Até ${saldo} h neste vínculo.` }, l.cargaHoraria || Math.min(saldo, 10))}${fieldHTML({ k: 'lt-ini', l: 'Data de início', t: 'date', req: 1 }, l.dataInicio)}${fieldHTML({ k: 'lt-fim', l: 'Data de saída (opcional)', t: 'date', help: 'Deixe em branco se não houver previsão.' }, l.dataFim)}</div>`,
    onSubmit: () => {
      const obj = Modelos.lotacao(Object.assign({}, l, { escolaId: $('#lt-esc').value, cargaHoraria: $('#f-lt-ch').value, dataInicio: $('#f-lt-ini').value, dataFim: $('#f-lt-fim').value }));
      lotacaoService.salvar(obj).then(() => { closeDialog(); rerender(); toast('Lotação salva.'); }).catch(e => { toast(e.message, 'err'); alertSR(e.message); });
      return false;
    }
  });
};
ACT['lot-encerrar'] = el => {
  const l = byId('lotacoes', el.dataset.id);
  openDialog({ title: 'Encerrar lotação', body: `<p>${esc(escNome(l.escolaId))}, ${l.cargaHoraria} h. As horas voltam para o saldo do vínculo a partir da data de saída.</p>${fieldHTML({ k: 'enc-data', l: 'Data de saída', t: 'date', req: 1 }, TODAY_ISO)}`,
    onSubmit: () => { lotacaoService.encerrar(l.id, $('#f-enc-data').value).then(() => { closeDialog(); rerender(); toast('Lotação encerrada e guardada no histórico.'); }).catch(e => toast(e.message, 'err')); return false; } });
};
PAGES.rh.lotacoes = telaLotacoes;
