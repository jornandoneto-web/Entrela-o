/* Fechamento do ano letivo e rematrícula (perfil Secretaria escolar).
   Fechamento: conferência por turma (componente, aulas previstas, aulas ministradas, situação), finalizar turma com o
   resultado de cada aluno e, com todas as turmas finalizadas, encerrar o ano e abrir o seguinte.
   Rematrícula: alunos das turmas finalizadas com o destino sugerido, confirmados em lote na turma escolhida. */
'use strict';

const regraResultado = (mediaMin, freqMin) => `Aprovado quando a média final de cada componente é pelo menos ${num(mediaMin)} e a frequência é pelo menos ${freqMin}%. Média final do componente = média aritmética dos bimestres lançados. Frequência = presenças ÷ aulas registradas no diário da turma.`;

async function telaFechamento() {
  const escolaId = escSessao(); const ano = anoSel(); const al = anoLetivoDe(escolaId);
  const turmas = turmasEsc().sort((a, b) => a.nome.localeCompare(b.nome));
  const confs = await Promise.all(turmas.map(t => fechamentoService.conferencia(t.id)));
  const conf = id => confs.find(c => c.turma.id === id);
  if (!turmas.some(t => t.id === UI.sel.fcTurma)) UI.sel.fcTurma = (turmas.find(t => !t.finalizada) || turmas[0])?.id;
  const t = byId('turmas', UI.sel.fcTurma);
  const finalizadas = turmas.filter(x => x.finalizada).length;
  const ativoOutro = (DADOS.anosLetivos || []).find(a => a.escolaId === escolaId && a.status === 'ativo' && a.ano !== ano);
  const situ = x => { const c = conf(x.id); return x.finalizada ? st('Finalizada', 'ok') : c.semMatriz ? st('Série sem matriz', 'err') : c.completo ? st('Pronta para finalizar', 'info') : st(`Faltam ${c.linhas.reduce((n, l) => n + l.faltam, 0)} aulas`, 'warn'); };

  const anoCard = `<section class="card" aria-labelledby="fa-h"><div class="card-h"><h2 id="fa-h">Ano letivo ${ano}</h2>${al?.status === 'encerrado' ? st('Encerrado', 'neutral', 'lock') : st('Ativo', 'ok')}</div>
    <p class="muted">${finalizadas} de ${turmas.length} turma${turmas.length === 1 ? '' : 's'} finalizada${turmas.length === 1 ? '' : 's'}. O ano só pode ser encerrado quando todas as turmas estiverem finalizadas.</p>
    <div class="row">${al?.status === 'ativo' ? `<button class="btn outline" data-act="ano-encerrar" ${finalizadas === turmas.length && turmas.length ? '' : 'disabled'}>${icon('lock')}Encerrar o ano letivo ${ano}</button>` : ''}
    ${al?.status === 'encerrado' && !ativoOutro ? `<button class="btn primary" data-act="ano-abrir">${icon('plus')}Abrir o ano letivo ${Math.max(...(DADOS.anosLetivos || []).filter(a => a.escolaId === escolaId).map(a => a.ano)) + 1}</button>` : ''}
    ${ativoOutro ? `<p class="caption">O ano letivo ${ativoOutro.ano} está ativo. Escolha-o no topo para cadastrar turmas.</p>` : ''}</div></section>`;

  const lista = turmas.length ? `<div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">Turmas do ano letivo ${ano}</caption><thead><tr><th scope="col">Turma</th><th scope="col" class="n">Componentes completos</th><th scope="col">Situação</th><th scope="col" class="n"><span class="sr-only">Ação</span></th></tr></thead><tbody>${turmas.map(x => { const c = conf(x.id); return `<tr class="${x.id === t?.id ? 'dest' : ''}"><th scope="row">${esc(x.nome)}${caption2(esc(x.turno))}</th><td class="n" data-label="Componentes completos">${c.linhas.filter(l => !l.faltam).length} de ${c.linhas.length}</td><td data-label="Situação">${situ(x)}</td><td class="n"><button class="btn ${x.id === t?.id ? 'primary' : 'outline'} sm" data-act="fc-turma" data-id="${x.id}" aria-label="Conferir ${esc(x.nome)}">${x.id === t?.id ? 'Aberta' : 'Conferir'}</button></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="empty">Nenhuma turma neste ano letivo.</p>';

  let detalhe = '';
  if (t) {
    const c = conf(t.id); const pode = can('anoletivo.fechar') && al?.status === 'ativo' && !t.finalizada && c.completo;
    const confTab = c.semMatriz ? '<p class="empty">A série desta turma não tem matriz. O DED cadastra os componentes em Gestão de matrizes.</p>' :
      `<div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">Conferência de ${esc(t.nome)}</caption><thead><tr><th scope="col">Componente</th><th scope="col" class="n">Aulas previstas</th><th scope="col" class="n">Aulas ministradas</th><th scope="col">Situação</th></tr></thead><tbody>${c.linhas.map(l => `<tr><th scope="row">${esc(l.nome)}</th><td class="n" data-label="Previstas">${l.previstas}</td><td class="n" data-label="Ministradas">${l.ministradas}</td><td data-label="Situação">${l.faltam ? st(`Faltam ${l.faltam} aula${l.faltam === 1 ? '' : 's'}`, 'warn') : st('Completo', 'ok')}</td></tr>`).join('')}</tbody></table></div>
      <p class="caption">Aulas previstas = carga anual do componente na matriz do curso. Aulas ministradas = aulas salvas pelo professor no diário de classe.</p>`;
    let resultado = '';
    if (t.finalizada) {
      const F = t.finalizada;
      resultado = `<section class="card" aria-labelledby="fr-h"><div class="card-h"><h2 id="fr-h">Resultado final de ${esc(t.nome)}</h2><span class="caption">Finalizada em ${fmtD(F.data)}</span></div>
        <p class="muted">${esc(regraResultado(F.mediaMin, F.freqMin))}</p>
        <div class="tbl-wrap"><table class="tbl stack"><thead><tr><th scope="col">Aluno</th><th scope="col" class="n">Média final</th><th scope="col" class="n">Frequência</th><th scope="col">Situação</th><th scope="col">De onde veio</th></tr></thead><tbody>${F.resultados.map(r => `<tr><th scope="row">${esc(r.nome)}</th><td class="n" data-label="Média final">${num(r.media)}</td><td class="n" data-label="Frequência">${r.freq == null ? '—' : num(r.freq, 0) + '%'}</td><td data-label="Situação">${r.situacao === 'Aprovado' ? st('Aprovado', 'ok') : st('Reprovado', 'err')}</td>
          <td data-label="De onde veio"><details><summary>${r.motivos.length ? esc(r.motivos.join('; ')) : `Todas as médias a partir de ${num(F.mediaMin)} e frequência a partir de ${F.freqMin}%`}</summary><ul class="calc">${r.componentes.map(x => `<li>${esc(x.nome)}: ${x.media == null ? 'sem notas lançadas (não entra na média)' : `média ${num(x.media)} em ${x.bimestres} bimestre${x.bimestres === 1 ? '' : 's'}`}</li>`).join('')}<li>Frequência: ${r.aulas - r.faltas} presenças em ${r.aulas} aulas</li></ul></details></td></tr>`).join('')}</tbody></table></div>
        ${F.resultados.length ? `<div class="row"><button class="btn outline" data-act="go" data-route="rematricula">${icon('swap')}Ir para a rematrícula</button></div>` : ''}</section>`;
    } else if (!c.semMatriz) {
      const prev = await fechamentoService.previa(t.id); const semNota = prev.filter(r => r.componentes.some(x => x.media == null)).length;
      resultado = `<section class="card" aria-labelledby="fp-h"><h2 id="fp-h">Como o resultado será calculado</h2><p class="muted">${esc(regraResultado(DADOS.config.mediaMin, DADOS.config.freqMin))}</p>
        <p class="caption">Média mínima e frequência mínima são ajustadas em <button class="btn ghost sm" data-act="go" data-route="config">Configurações</button></p>
        ${semNota ? `<p class="notice">${icon('info')}${semNota} aluno${semNota === 1 ? '' : 's'} sem nota em algum componente. Componente sem nota não entra na média final.</p>` : ''}
        <div class="row"><button class="btn primary" data-act="fc-finalizar" data-id="${t.id}" ${pode ? '' : 'disabled'} aria-describedby="fc-h">${icon('check')}Finalizar turma</button><span class="caption" id="fc-h">${c.completo ? (al?.status === 'ativo' ? 'Todos os componentes estão completos.' : 'O ano letivo está encerrado.') : 'O botão fica habilitado quando todos os componentes estiverem completos.'}</span></div></section>`;
    }
    detalhe = `<section class="card" aria-labelledby="fc-t"><div class="card-h"><h2 id="fc-t">Conferência: ${esc(t.nome)}</h2>${situ(t)}</div>${confTab}</section>${resultado}`;
  }
  return pageHead('Fechamento do ano letivo', 'Confira as aulas dadas em cada turma, finalize as turmas e encerre o ano. A turma só é finalizada quando todos os componentes da série têm as aulas previstas na matriz registradas no diário.') +
    anoCard + `<section class="card" aria-labelledby="ft-h"><h2 id="ft-h">Turmas</h2>${lista}</section>` + detalhe;
}
ACT['fc-turma'] = el => { UI.sel.fcTurma = el.dataset.id; rerender(); };
ACT['fc-finalizar'] = el => {
  const t = byId('turmas', el.dataset.id);
  openDialog({
    title: `Finalizar ${t.nome}`, body: `<p>Ao finalizar, o sistema calcula a situação final de cada aluno (Aprovado ou Reprovado) e a turma deixa de aceitar notas e registros no diário.</p><p class="muted">${esc(regraResultado(DADOS.config.mediaMin, DADOS.config.freqMin))}</p>`,
    foot: `<button type="button" class="btn ghost" data-act="close-dlg">Cancelar</button><button type="submit" class="btn primary">${icon('check')}Finalizar turma</button>`,
    onSubmit: () => { fechamentoService.finalizar(t.id).then(() => { closeDialog(); rerender(); toast(`Turma ${t.nome} finalizada.`); }).catch(e => { toast(e.message, 'err'); alertSR(e.message); }); return false; }
  });
};
async function recarregarComAno(ano) { await dadosService.carregar(); if (ano) UI.ano = ano; renderShell(); await renderPage(); $('#page-title')?.focus(); }
ACT['ano-encerrar'] = () => {
  const ano = anoSel();
  openDialog({
    title: `Encerrar o ano letivo ${ano}`, body: `<p>Com o ano encerrado, turmas, notas e diário de ${ano} ficam só para consulta. Depois você pode abrir o ano letivo ${ano + 1} e fazer a rematrícula.</p>`,
    foot: `<button type="button" class="btn ghost" data-act="close-dlg">Cancelar</button><button type="submit" class="btn primary">${icon('lock')}Encerrar ano</button>`,
    onSubmit: () => { anoLetivoService.encerrar(escSessao(), ano).then(() => { closeDialog(); recarregarComAno(ano); toast(`Ano letivo ${ano} encerrado.`); }).catch(e => { toast(e.message, 'err'); alertSR(e.message); }); return false; }
  });
};
ACT['ano-abrir'] = () => anoLetivoService.abrirProximo(escSessao()).then(a => { recarregarComAno(a.ano); toast(`Ano letivo ${a.ano} aberto. Cadastre as turmas e depois faça a rematrícula.`); }).catch(e => { toast(e.message, 'err'); alertSR(e.message); });

// ---------- Rematrícula ----------
async function telaRematricula() {
  const escolaId = escSessao(); const pend = await fechamentoService.pendentes(escolaId);
  const grupos = {};
  pend.forEach(p => { const k = p.sugestao.tipo === 'concluido' ? 'concluido' : `${p.sugestao.ano}|${p.sugestao.serieId}`; (grupos[k] = grupos[k] || []).push(p); });
  const livres = t => t.vagas - DADOS.alunos.filter(a => a.turmaId === t.id).length;
  const linhas = (k, itens) => itens.map(p => `<tr><td><input type="checkbox" name="al" value="${p.resultado.alunoId}" data-origem="${p.turma.id}" checked aria-label="Selecionar ${esc(p.resultado.nome)}"></td><th scope="row">${esc(p.resultado.nome)}</th><td data-label="Origem">${esc(p.turma.nome)}, ${p.turma.ano}</td><td data-label="Resultado">${p.resultado.situacao === 'Aprovado' ? st('Aprovado', 'ok') : st('Reprovado', 'err')}</td><td data-label="Destino sugerido">${p.sugestao.tipo === 'concluido' ? 'Curso concluído, sem rematrícula' : `${esc(p.sugestao.serieNome)}, ano letivo ${p.sugestao.ano}${p.resultado.situacao === 'Reprovado' ? ' (repete a série)' : ''}`}</td></tr>`).join('');
  const tabela = (k, itens) => `<div class="tbl-wrap"><table class="tbl stack"><thead><tr><th scope="col"><span class="sr-only">Selecionar</span></th><th scope="col">Aluno</th><th scope="col">Turma de origem</th><th scope="col">Resultado</th><th scope="col">Destino sugerido</th></tr></thead><tbody>${linhas(k, itens)}</tbody></table></div>`;
  const cards = Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b)).map(([k, itens], gi) => {
    const s = itens[0].sugestao;
    if (k === 'concluido') return `<form class="card" data-form="remat" data-grupo="concluido" novalidate aria-labelledby="rg-${gi}"><h2 id="rg-${gi}">Curso concluído</h2><p class="muted">Aprovados na última série do curso. Não são rematriculados.</p>${tabela(k, itens)}<div class="row"><button class="btn primary" type="submit">${icon('check')}Registrar conclusão do curso</button></div></form>`;
    const destinos = DADOS.turmas.filter(t => t.escolaId === escolaId && t.ano === s.ano && t.serieId === s.serieId && !t.finalizada).sort((a, b) => a.nome.localeCompare(b.nome));
    const temAno = (DADOS.anosLetivos || []).some(a => a.escolaId === escolaId && a.ano === s.ano);
    const semDestino = !temAno ? `O ano letivo ${s.ano} ainda não foi aberto. Abra em Fechamento do ano, depois de encerrar ${s.ano - 1}.` : `Não há turma de ${s.serieNome} em ${s.ano}. Escolha ${s.ano} no topo e cadastre a turma em Turmas.`;
    return `<form class="card" data-form="remat" data-grupo="${esc(k)}" novalidate aria-labelledby="rg-${gi}"><h2 id="rg-${gi}">${esc(s.serieNome)}, ano letivo ${s.ano}</h2>${tabela(k, itens)}
      ${destinos.length ? `<div class="toolbar"><div class="field"><label for="rd-${gi}">Turma de destino <span class="req" aria-hidden="true">*</span></label><select id="rd-${gi}" name="destino" required><option value="">Selecione…</option>${destinos.map(t => `<option value="${t.id}" ${livres(t) <= 0 ? 'disabled' : ''}>${esc(t.nome)}, ${esc(t.turno.toLowerCase())}: ${Math.max(0, livres(t))} vaga${livres(t) === 1 ? '' : 's'} livre${livres(t) === 1 ? '' : 's'} de ${t.vagas}</option>`).join('')}</select></div></div>
        <div class="row"><button class="btn primary" type="submit">${icon('check')}Rematricular selecionados</button></div>` : `<p class="notice">${icon('info')}${esc(semDestino)}</p>`}</form>`;
  }).join('');
  return pageHead('Rematrícula', 'Alunos das turmas finalizadas, com o destino sugerido pelo resultado: aprovado vai para a série seguinte, reprovado repete a série e quem termina a última série conclui o curso. Selecione os alunos e a turma de destino.') +
    (pend.length ? cards : '<p class="empty">Nenhum aluno aguardando rematrícula. Os alunos aparecem aqui depois que a turma é finalizada em Fechamento do ano.</p>');
}
FORMS.remat = async f => {
  const sel = $$('input[name="al"]:checked', f); if (!sel.length) { toast('Selecione pelo menos um aluno.', 'err'); return; }
  const porOrigem = {}; sel.forEach(i => { (porOrigem[i.dataset.origem] = porOrigem[i.dataset.origem] || []).push(i.value); });
  try {
    if (f.dataset.grupo === 'concluido') {
      for (const [o, ids] of Object.entries(porOrigem)) await fechamentoService.concluir(o, ids);
      rerender(); toast(`Conclusão do curso registrada para ${sel.length} aluno${sel.length === 1 ? '' : 's'}.`); return;
    }
    const d = byId('turmas', f.querySelector('[name="destino"]').value);
    const livres = d.vagas - DADOS.alunos.filter(a => a.turmaId === d.id).length;
    if (sel.length > livres) { const m = `A turma ${d.nome} tem ${Math.max(0, livres)} vaga${livres === 1 ? '' : 's'} livre${livres === 1 ? '' : 's'} e você selecionou ${sel.length} alunos.`; toast(m, 'err'); alertSR(m); return; }
    for (const [o, ids] of Object.entries(porOrigem)) await fechamentoService.rematricular(o, ids, d.id);
    rerender(); toast(`${sel.length} aluno${sel.length === 1 ? '' : 's'} rematriculado${sel.length === 1 ? '' : 's'} em ${d.nome}, ${d.ano}.`);
  } catch (e) { rerender(); toast(e.message, 'err'); alertSR(e.message); }
};

Object.assign(PAGES.gestao, { fechamento: telaFechamento, rematricula: telaRematricula });
