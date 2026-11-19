/* Telas de transferência: pedido (responsável e aluno), pedidos na escola de origem (Secretaria escolar),
   declaração de transferência e acompanhamento do pedido. Regras em services/transferenciaService.js. */
'use strict';

const TF_STATUS = ['Pendente', 'Deferido', 'Indeferido', 'Concluído'];
const tfCls = s => s === 'Concluído' ? 'ok' : s === 'Deferido' ? 'info' : s === 'Indeferido' ? 'err' : 'warn';
const tfStatusHTML = p => st(p.status, tfCls(p.status));
const destinoTransf = p => p.tipo === 'fora_da_rede'
  ? [p.destinoExterno.escola || p.destinoExterno.tipoEscola, `${p.destinoExterno.cidade}/${p.destinoExterno.uf}`].filter(Boolean).join(', ')
  : `${escNome(p.escolaDestinoId)}, ${regionalService.nomeMunicipio(p.municipioDestinoId) || ''}/SE`;
const prazoHistHTML = p => {
  if (p.historicoEmitido) return `Histórico emitido em ${fmtD(p.historicoEmitido)}`;
  const n = transferenciaService.prazo(p); if (n == null) return '';
  return n < 0 ? st(`Histórico atrasado ${-n} dia${n === -1 ? '' : 's'} (prazo ${fmtD(p.prazoHistorico)})`, 'err') : n <= 5 ? st(`Histórico vence em ${n} dia${n === 1 ? '' : 's'} (${fmtD(p.prazoHistorico)})`, 'warn') : `Histórico até ${fmtD(p.prazoHistorico)} (${n} dias)`;
};

// ---------- Formulário do pedido ----------
const vagasNaSerie = (escolaId, serie) => { const vs = DADOS.vagas.filter(v => v.escolaId === escolaId && v.serie === serie); return vs.length ? vs.reduce((n, v) => n + disp(v), 0) : null; };
function opcoesEscolaDestino(munId, a) {
  const t = byId('turmas', a?.turmaId); const serie = t?.serie;
  const lista = DADOS.escolas.filter(e => e.municipioId === munId && e.id !== t?.escolaId).sort((x, y) => x.nome.localeCompare(y.nome));
  if (!munId) return '<option value="">Escolha a cidade primeiro</option>';
  if (!lista.length) return '<option value="">Nenhuma escola da rede cadastrada nesta cidade</option>';
  return '<option value="">Selecione…</option>' + lista.map(e => { const n = vagasNaSerie(e.id, serie); const info = n == null ? 'não oferece esta série' : n > 0 ? `${n} vaga${n > 1 ? 's' : ''} no ${t.serieNome || serie}` : 'sem vaga: entra na fila de espera'; return `<option value="${e.id}" ${n == null ? 'disabled' : ''}>${esc(e.nome)} (${info})</option>`; }).join('');
}
function formTransfHTML(alunos, alunoSel) {
  const a = alunoSel || (alunos.length === 1 ? alunos[0] : null);
  const munAtual = byId('escolas', escolaDe(a))?.municipioId || '';
  const muns = MOCK_DIRETORIAS.flatMap(d => d.municipios).sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'));
  return `<div class="form-grid">
    ${alunos.length > 1 ? `<div class="field wide"><label for="tf-aluno">Aluno <span class="req" aria-hidden="true">*</span></label><select id="tf-aluno" required data-change="tfAluno">${optHTML(alunos.map(x => [x.id, `${x.nome}, ${turmaLong(x.turmaId)}`]), a?.id || '')}</select></div>` : `<input type="hidden" id="tf-aluno" value="${a?.id || ''}"><p class="wide" style="grid-column:1/-1">Aluno: <b>${esc(a?.nome || '')}</b>, ${esc(turmaLong(a?.turmaId))}</p>`}
    <fieldset class="field wide"><legend class="lbl">Para onde o aluno vai?</legend><div class="seg"><label><input type="radio" name="tf-tipo" value="rede" checked data-change="tfTipo">Escola da rede estadual de Sergipe</label><label><input type="radio" name="tf-tipo" value="fora_da_rede" data-change="tfTipo">Fora da rede (outro estado, particular ou municipal)</label></div></fieldset>
  </div>
  <div id="tf-rede" class="form-grid">
    <div class="field"><label for="tf-mun">Cidade <span class="req" aria-hidden="true">*</span></label><select id="tf-mun" data-change="tfMun">${optHTML(muns.map(m => [m.id, m.nome]), munAtual)}</select><p class="help">Já vem com a cidade da escola atual. Troque se a família estiver se mudando.</p></div>
    <div class="field"><label for="tf-esc">Escola <span class="req" aria-hidden="true">*</span></label><select id="tf-esc">${opcoesEscolaDestino(munAtual, a)}</select><p class="help">Mostra as vagas na série do aluno. Sem vaga, ele entra na fila de espera da escola.</p></div>
  </div>
  <div id="tf-fora" class="form-grid" hidden>
    <div class="field"><label for="tf-tipoesc">Tipo de escola <span class="req" aria-hidden="true">*</span></label><select id="tf-tipoesc">${optHTML(nomes('tiposEscolaExterna').map(x => [x, x]), '')}</select></div>
    ${ufCidadeHTML('tf-ext', '', '', { rotuloUF: 'Estado', rotuloCidade: 'Cidade' })}
    <div class="field wide"><label for="tf-nomeesc">Nome da escola (se souber)</label><input id="tf-nomeesc"></div>
  </div>
  <div class="form-grid">${listaOutroHTML('tf-mot', 'Motivo (opcional)', nomes('motivosTransferencia'), '', { wide: true, vazio: 'Não informar' })}</div>`;
}
CHG.tfTipo = el => { const fora = el.value === 'fora_da_rede'; $('#tf-rede').hidden = fora; $('#tf-fora').hidden = !fora; };
CHG.tfMun = el => { $('#tf-esc').innerHTML = opcoesEscolaDestino(el.value, byId('alunos', $('#tf-aluno').value)); };
CHG.tfAluno = el => { const a = byId('alunos', el.value); const mun = byId('escolas', escolaDe(a))?.municipioId || ''; $('#tf-mun').value = mun; $('#tf-esc').innerHTML = opcoesEscolaDestino(mun, a); };
function lerPedidoTransf(solicitante) {
  const tipo = $('input[name="tf-tipo"]:checked').value;
  return { alunoId: $('#tf-aluno').value, tipo, solicitante, motivo: valorOutro('tf-mot'),
    municipioDestinoId: tipo === 'rede' ? $('#tf-mun').value : '', escolaDestinoId: tipo === 'rede' ? $('#tf-esc').value : '',
    destinoExterno: tipo === 'fora_da_rede' ? { tipoEscola: $('#tf-tipoesc').value, uf: $('#tf-ext-uf').value, cidade: $('#tf-ext-cid').value, escola: $('#tf-nomeesc').value.trim() } : null };
}
function erroForm(msg) { const b = $('#tf-erro'); if (b) { b.textContent = msg; b.hidden = false; } toast(msg, 'err'); alertSR(msg); }

// Responsável e aluno
function telaPedirTransferencia() {
  const alunos = SESSION.role === 'aluno' ? [me()].filter(a => a && a.turmaId) : filhos().filter(a => a.turmaId);
  if (!alunos.length) return pageHead('Pedir transferência', 'Não há aluno matriculado em turma para transferir.');
  const meus = DADOS.transferencias.filter(t => alunos.some(a => a.id === t.alunoId)).sort((x, y) => y.dataSolicitacao.localeCompare(x.dataSolicitacao));
  return pageHead('Pedir transferência', 'Diga para onde o aluno vai. A escola atual analisa o pedido e, se deferir, emite a declaração de transferência na hora.') +
    `<form class="card" data-form="tf-pedido" novalidate aria-labelledby="tfp-h" style="max-width:52rem"><h2 id="tfp-h" class="sr-only">Pedido de transferência</h2>${formTransfHTML(alunos)}
      <p class="err-msg" id="tf-erro" role="alert" hidden></p><div class="row"><button class="btn primary" type="submit">${icon('send')}Enviar pedido</button></div></form>
    ${meus.length ? `<section aria-labelledby="tfa-h" class="grid"><h2 id="tfa-h">Seus pedidos</h2>${pedidosTransfHTML(meus)}</section>` : ''}`;
}
FORMS['tf-pedido'] = () => transferenciaService.solicitar(lerPedidoTransf(SESSION.role === 'aluno' ? 'Aluno' : 'Responsável'))
  .then(() => { rerender(); toast('Pedido enviado. A escola atual vai analisar.'); }).catch(e => erroForm(e.message));

// Acompanhamento (responsável, aluno e tela Meus pedidos)
function pedidosTransfHTML(lista) {
  if (!lista.length) return '<p class="empty">Nenhum pedido de transferência.</p>';
  const passo = (l, cls) => `<li class="${cls}">${l}</li>`;
  return `<div class="grid g2">${lista.map(p => { const decid = p.status !== 'Pendente'; return `<article class="post" aria-labelledby="tfp-${p.id}">
    <div class="row sp"><h3 id="tfp-${p.id}">${esc(alunoNome(p.alunoId))}</h3>${tfStatusHTML(p)}</div><p class="meta">Pedido em ${fmtD(p.dataSolicitacao)}</p>
    <ol class="steps">${passo('Pendente', decid ? 'done' : 'cur')}${passo(p.status === 'Indeferido' ? 'Indeferido' : 'Deferido', p.status === 'Pendente' ? '' : p.status === 'Concluído' ? 'done' : 'cur')}${passo('Concluído', p.status === 'Concluído' ? 'cur' : '')}</ol>
    <dl class="dl"><dt>De</dt><dd>${esc(escNome(p.escolaOrigemId))}</dd><dt>Para</dt><dd>${esc(destinoTransf(p))}</dd>${p.motivo ? `<dt>Motivo</dt><dd>${esc(p.motivo)}</dd>` : ''}</dl>
    ${p.resultado ? `<p class="quote">${esc(p.resultado)}</p>` : ''}${p.status === 'Indeferido' ? `<p class="quote"><b>Justificativa da escola:</b> ${esc(p.justificativa)}</p>` : ''}
    ${p.declaracaoEmitida ? `<p class="caption">${prazoHistHTML(p)}</p><div class="row"><button class="btn outline sm" data-act="tf-declaracao" data-id="${p.id}">${icon('file')}Ver declaração</button></div>` : ''}</article>`; }).join('')}</div>`;
}

// ---------- Escola de origem: pedidos de transferência ----------
async function telaPedidosTransf() {
  const fil = UI.sel.tfFiltro || 'Pendente';
  const todos = (await transferenciaService.listar(p => naEscola(p.escolaOrigemId))).map(Modelos.transferencia).sort((x, y) => (x.status === 'Pendente' ? 0 : 1) - (y.status === 'Pendente' ? 0 : 1) || y.dataSolicitacao.localeCompare(x.dataSolicitacao));
  const lista = fil === 'Todos' ? todos : todos.filter(p => p.status === fil);
  const conta = s => todos.filter(p => s === 'Todos' || p.status === s).length;
  const avisos = todos.filter(p => p.status === 'Deferido' && transferenciaService.prazo(p) != null && transferenciaService.prazo(p) <= 5);
  return pageHead('Pedidos de transferência', 'Pedidos dos responsáveis e alunos desta escola. Ao deferir, a declaração sai na hora e o histórico tem até 30 dias.', `<button class="btn outline" data-act="tf-nova">${icon('swap')}Registrar pedido</button>`) +
    (avisos.length ? `<p class="quote" role="note">${st(`${avisos.length} histórico${avisos.length > 1 ? 's' : ''} perto do prazo ou atrasado${avisos.length > 1 ? 's' : ''}`, 'warn')} ${avisos.map(p => esc(alunoNome(p.alunoId))).join(', ')}.</p>` : '') +
    `<fieldset class="field"><legend class="lbl">Mostrar</legend><div class="seg">${['Pendente', 'Deferido', 'Indeferido', 'Concluído', 'Todos'].map(s => `<label><input type="radio" id="tff-${norm(s)}" name="tf-filtro" value="${s}" data-change="tfFiltro" ${fil === s ? 'checked' : ''}>${s} (${conta(s)})</label>`).join('')}</div></fieldset>` +
    (lista.length ? `<div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">Pedidos de transferência</caption><thead><tr><th scope="col">Aluno</th><th scope="col">Destino</th><th scope="col">Pedido</th><th scope="col">Situação</th><th scope="col" class="n">Ações</th></tr></thead><tbody>${lista.map(p => `<tr>
      <th scope="row">${nomeAlunoId(p.alunoId)}${caption2(esc(p.turmaOrigem || turmaNome(byId('alunos', p.alunoId)?.turmaId)))}</th>
      <td data-label="Destino">${esc(destinoTransf(p))}${caption2(p.tipo === 'rede' ? 'Dentro da rede' : 'Fora da rede')}</td>
      <td data-label="Pedido">${fmtD(p.dataSolicitacao)}${caption2(esc(p.solicitante || ''))}${p.motivo ? caption2(esc(p.motivo)) : ''}</td>
      <td data-label="Situação">${tfStatusHTML(p)}${p.declaracaoEmitida ? caption2(prazoHistHTML(p)) : ''}${p.status === 'Indeferido' ? caption2(esc(p.justificativa)) : ''}</td>
      <td class="n"><div class="acts">${p.status === 'Pendente' ? `<button class="btn primary sm" data-act="trf-analisar" data-id="${p.id}" aria-label="Analisar pedido de ${esc(alunoNome(p.alunoId))}">Analisar</button>` : ''}${p.declaracaoEmitida ? `<button class="btn ghost sm" data-act="tf-declaracao" data-id="${p.id}" aria-label="Declaração de ${esc(alunoNome(p.alunoId))}">Declaração</button>` : ''}${p.status === 'Deferido' ? `<button class="btn outline sm" data-act="tf-historico" data-id="${p.id}" aria-label="Emitir histórico de ${esc(alunoNome(p.alunoId))}">Emitir histórico</button>` : ''}${p.historicoEmitido ? `<button class="btn ghost sm" data-act="hist-abrir" data-id="${p.alunoId}" aria-label="Histórico de ${esc(alunoNome(p.alunoId))}">Histórico</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : `<p class="empty">Nenhum pedido ${fil === 'Todos' ? '' : 'com a situação ' + fil.toLowerCase()}.</p>`);
}
CHG.tfFiltro = el => { UI.sel.tfFiltro = el.value; rerender(); };
ACT['tf-nova'] = () => {
  const alunos = alunosEsc().filter(a => a.turmaId).sort((x, y) => x.nome.localeCompare(y.nome));
  openDialog({ title: 'Registrar pedido de transferência', wide: true, body: `<p class="muted">Use quando o responsável fizer o pedido na secretaria.</p>${formTransfHTML(alunos)}<p class="err-msg" id="tf-erro" role="alert" hidden></p>`,
    onSubmit: () => { transferenciaService.solicitar(lerPedidoTransf('Secretaria escolar')).then(() => { closeDialog(); UI.sel.tfFiltro = 'Pendente'; rerender(); toast('Pedido registrado como pendente.'); }).catch(e => erroForm(e.message)); return false; } });
};
ACT['trf-analisar'] = el => {
  const p = Modelos.transferencia(byId('transferencias', el.dataset.id)); const a = byId('alunos', p.alunoId); const t = byId('turmas', a?.turmaId);
  const vagas = p.tipo === 'rede' ? vagasNaSerie(p.escolaDestinoId, t?.serie) : null;
  openDialog({ title: `Transferência de ${a?.nome || ''}`, wide: true,
    body: `<dl class="dl"><dt>Turma atual</dt><dd>${esc(turmaLong(a?.turmaId))}</dd><dt>Destino</dt><dd>${esc(destinoTransf(p))} (${p.tipo === 'rede' ? 'dentro da rede' : 'fora da rede'})</dd>${p.tipo === 'rede' ? `<dt>Vagas no destino</dt><dd>${vagas == null ? 'A escola não oferece esta série' : vagas > 0 ? `${vagas} no ${esc(t?.serieNome || t?.serie || '')}` : 'Sem vaga: o aluno entra na fila de espera da escola de destino'}</dd>` : ''}<dt>Pedido por</dt><dd>${esc(p.solicitante)} em ${fmtD(p.dataSolicitacao)}</dd>${p.motivo ? `<dt>Motivo</dt><dd>${esc(p.motivo)}</dd>` : ''}</dl>
      <fieldset class="field"><legend class="lbl">Decisão</legend><div class="seg"><label><input type="radio" name="tf-dec" value="def" checked data-change="tfDec">Deferir</label><label><input type="radio" name="tf-dec" value="ind" data-change="tfDec">Indeferir</label></div></fieldset>
      <p class="quote" id="tf-ef">${p.tipo === 'rede' ? 'Ao deferir, o aluno sai da turma atual e é matriculado na escola de destino, ou entra na fila dela se não houver vaga. As notas e médias seguem com ele.' : 'Ao deferir, o aluno sai da turma com a situação Transferido.'} A declaração é emitida agora e o histórico tem até ${fmtD(isoOf(new Date(TODAY.getTime() + 30 * 864e5)))} (30 dias).</p>
      <div class="field" id="tf-just-box" hidden><label for="tf-just">Justificativa <span class="req" aria-hidden="true">*</span></label><textarea id="tf-just"></textarea><p class="help">Obrigatória ao indeferir. O responsável vê este texto.</p></div>
      <p class="err-msg" id="tf-erro" role="alert" hidden></p>`,
    onSubmit: () => {
      const def = $('input[name="tf-dec"]:checked').value === 'def';
      (def ? transferenciaService.deferir(p.id) : transferenciaService.indeferir(p.id, $('#tf-just').value))
        .then(async r => { closeDialog(); await rerender(); toast(def ? 'Transferência deferida. A declaração foi emitida.' : 'Pedido indeferido.'); if (def) setTimeout(() => abrirDeclaracao(r.id), 60); }).catch(e => erroForm(e.message));
      return false;
    } });
};
CHG.tfDec = el => { const ind = el.value === 'ind'; $('#tf-just-box').hidden = !ind; $('#tf-ef').hidden = ind; if (ind) $('#tf-just').focus(); };
ACT['tf-historico'] = el => {
  const p = Modelos.transferencia(byId('transferencias', el.dataset.id));
  confirmBox('Emitir histórico escolar', `Confirma a emissão do histórico de <b>${esc(alunoNome(p.alunoId))}</b>? O pedido passa para Concluído.`, () => transferenciaService.emitirHistorico(p.id).then(async () => { await rerender(); toast('Histórico emitido. Pedido concluído.'); setTimeout(() => abrirHistorico(p.alunoId), 60); }).catch(e => toast(e.message, 'err')), 'Emitir histórico');
};

// ---------- Documentos ----------
const dataExtenso = iso => dOf(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
function abrirDocumento(titulo, html) {
  const podeImprimir = window.self === window.top; // dentro do visualizador do Claude a impressão é bloqueada
  openDialog({ title: titulo, wide: true, body: `<article class="doc">${html}</article>`, foot: `${podeImprimir ? `<button type="button" class="btn outline" data-act="doc-imprimir">${icon('file')}Imprimir</button>` : ''}<button type="button" class="btn primary" data-act="close-dlg">Fechar</button>` });
}
ACT['doc-imprimir'] = () => window.print();
function abrirDeclaracao(id) {
  const p = Modelos.transferencia(byId('transferencias', id)); const a = byId('alunos', p.alunoId) || (DADOS.egressos || []).find(x => x.id === p.alunoId) || {};
  const e = byId('escolas', p.escolaOrigemId) || {}; const cidade = regionalService.nomeMunicipio(e.municipioId) || 'Aracaju';
  abrirDocumento('Declaração de transferência', `<header class="doc-cab"><p>Governo do Estado de Sergipe, Secretaria de Estado da Educação</p><h2>${esc(e.nome || '')}</h2><p>INEP ${esc(e.inep || '—')}, ${esc(enderecoTxt(e))}, ${esc(cidade)}/SE</p></header>
    <h3 class="doc-tit">Declaração de transferência</h3>
    <p>Declaramos, para os devidos fins, que <b>${esc(a.nome || alunoNome(p.alunoId))}</b>${a.nascimento ? `, nascido(a) em ${fmtD(a.nascimento)}` : ''}${a.filiacao ? `, filho(a) de ${esc(a.filiacao)}` : ''}, esteve regularmente matriculado(a) nesta unidade de ensino no <b>${esc(p.serieOrigem || '')}</b>, turma ${esc(p.turmaOrigem || '')}, no ano letivo de <b>${esc(String(p.anoOrigem || DADOS.config.anoLetivo))}</b>, e que nesta data foi deferida sua transferência para ${esc(destinoTransf(p))}.</p>
    <p>Situação de matrícula: <b>Transferido(a)</b>.</p>
    <p>O histórico escolar será entregue até ${fmtD(p.prazoHistorico)}, no prazo de 30 dias. Esta declaração vale para a matrícula na nova escola até a entrega do histórico.</p>
    <p class="doc-data">${esc(cidade)}/SE, ${dataExtenso(p.declaracaoEmitida || TODAY_ISO)}.</p>
    <p class="doc-ass">Secretaria escolar</p><p class="caption">Documento ${esc(p.id.toUpperCase())}, gerado pelo Portal Entrelaço.</p>`);
}
ACT['tf-declaracao'] = el => abrirDeclaracao(el.dataset.id);

PAGES.gestao.transferencias = telaPedidosTransf;
PAGES.responsavel.transferencia = telaPedirTransferencia;
PAGES.aluno.transferencia = telaPedirTransferencia;
