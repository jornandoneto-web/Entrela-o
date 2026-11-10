/* Portal Entrelaço — rede pública: vagas, pré-matrícula, transferências, integrações e programas (AEE, busca ativa, merenda, transporte) */
'use strict';

Object.assign(IC, {
  door: '<path d="M4 21h16"/><path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M14 12h.01"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
  swap: '<path d="M7 4 3 8l4 4"/><path d="M3 8h14"/><path d="m17 20 4-4-4-4"/><path d="M21 16H7"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2M15 8V2"/><path d="M18 8v5a6 6 0 0 1-12 0V8z"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M8 18v3M16 18v3M8 14.5h.01M16 14.5h.01"/>',
  utensils: '<path d="M3 2v7a3 3 0 0 0 6 0V2M6 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"/>',
  radar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v3l2 1"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>'
});

const motivoTransfHTML = () => `${listaOutroHTML('tr-mot', 'Motivo', nomes('motivosTransferencia'), '', { req: true, wide: true })}<div class="field wide"><label for="tr-det">Detalhes (opcional)</label><textarea id="tr-det" style="min-height:4.5rem"></textarea></div>`;
const motivoTransf = () => [valorOutro('tr-mot'), $('#tr-det').value.trim()].filter(Boolean).join('. ');
const INTEG = ['Sistema Entrelaço', 'API', 'Planilha CSV'];


// ---------- Consultas ----------
const escNome = id => byId('escolas', id)?.nome || '—';
const isLocal = id => byId('escolas', id)?.integracao === 'Sistema Entrelaço';
const serieDe = a => byId('turmas', a?.turmaId)?.serie;
const escolaDe = a => byId('turmas', a?.turmaId)?.escolaId;
function ocupadas(v) {
  if (isLocal(v.escolaId)) return DADOS.alunos.filter(a => { const t = byId('turmas', a.turmaId); return t && t.escolaId === v.escolaId && t.serie === v.serie && t.turno === v.turno; }).length;
  return Number(v.ocupadasExt) || 0;
}
const reservadas = v => DADOS.prematriculas.filter(p => p.status === 'Vaga reservada' && p.escolaId === v.escolaId && p.serie === v.serie && p.turno === v.turno).length;
const disp = v => Math.max(0, (Number(v.total) || 0) - ocupadas(v) - reservadas(v));
const vagasHTML = n => n > 0 ? st(`${n} vaga${n > 1 ? 's' : ''}`, 'ok') : st('Sem vagas', 'err');
const fila = (e, s, t) => DADOS.prematriculas.filter(p => p.status === 'Lista de espera' && p.escolaId === e && p.serie === s && p.turno === t).sort((a, b) => (a.criado || a.data).localeCompare(b.criado || b.data));
const posEspera = p => fila(p.escolaId, p.serie, p.turno).indexOf(p) + 1;
const pedCls = s => /confirmada|Concluída|Encaminhada|reservada/.test(s) ? 'ok' : /espera|pendentes/.test(s) ? 'warn' : /Indeferida|Recusada|Cancelada/.test(s) ? 'err' : 'info';
const pedHTML = s => st(s, pedCls(s));
const idade = iso => Math.floor((TODAY - dOf(iso)) / (365.25 * 864e5));
const bfMin = a => idade(a.nascimento) >= 16 ? 75 : 85;
const filhos = () => (me().filhos || []).map(id => byId('alunos', id)).filter(Boolean);
const fmtHora = iso => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const serieOpts = () => uniq(DADOS.vagas.map(v => v.serie)).sort((a, b) => nomes('series').indexOf(a) - nomes('series').indexOf(b)).map(s => [s, s]);
function vagaOpts(serie, turno, excluir) {
  return DADOS.vagas.filter(v => v.serie === serie && (!turno || v.turno === turno) && v.escolaId !== excluir)
    .sort((a, b) => disp(b) - disp(a))
    .map(v => { const n = disp(v); return [v.id, `${escNome(v.escolaId)}, ${byId('escolas', v.escolaId)?.bairro || ''}, ${v.turno.toLowerCase()}: ${n ? n + ' vaga' + (n > 1 ? 's' : '') : 'sem vagas'}`, n === 0]; });
}
const optHTML = (opts, val, ph = 'Selecione…') => `<option value="">${ph}</option>` + opts.map(([v, l, dis]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''} ${dis ? 'disabled' : ''}>${esc(l)}</option>`).join('');

// ---------- Cadastros ----------
ENT.escolas.fields = [{ k: 'nome', l: 'Nome da escola', req: 1, wide: 1 }, { k: 'inep', l: 'Código INEP', req: 1, help: '8 dígitos do Censo Escolar. É usado para integrar vagas.' }, { k: 'cidade', l: 'Cidade / UF', req: 1 }, { k: 'bairro', l: 'Bairro', req: 1 }, { k: 'endereco', l: 'Endereço' }, { k: 'telefone', l: 'Telefone', t: 'tel' }, { k: 'diretor', l: 'Diretor(a)' }, { k: 'integracao', l: 'Como a escola publica as vagas', t: 'select', o: optsFix(INTEG), req: 1, help: 'Sistema Entrelaço: vagas calculadas pelas turmas. API ou planilha: a escola envia os números.' }, { k: 'recursos', l: 'Recursos de acessibilidade', t: 'checks', o: [] }];
ENT.escolas.defaults = () => ({ integracao: 'Sistema Entrelaço', recursos: [], ultimaSync: new Date().toISOString() });
ENT.escolas.cols = [['Escola', r => `${esc(r.nome)}${caption2('INEP ' + esc(r.inep || '—'))}`], ['Bairro', r => esc(r.bairro || '—')], ['Vagas publicadas por', r => esc(r.integracao || '—')], ['Turmas', r => DADOS.turmas.filter(t => t.escolaId === r.id).length, 'n'], ['Vagas livres', r => DADOS.vagas.filter(v => v.escolaId === r.id).reduce((s, v) => s + disp(v), 0), 'n']];
ENT.turmas.fields = () => [{ k: 'nome', l: 'Nome da turma', req: 1, help: 'Ex.: 2º ano A' }, ...(escSessao() ? [] : [{ k: 'escolaId', l: 'Escola', t: 'select', o: () => DADOS.escolas.filter(e => isLocal(e.id)).map(e => [e.id, e.nome]), req: 1 }]), { k: 'serie', l: 'Série', t: 'select', o: L('series'), req: 1 }, { k: 'turno', l: 'Turno', t: 'select', o: L('turnos'), req: 1 }, { k: 'ano', l: 'Ano letivo', t: 'number', req: 1 }, { k: 'sala', l: 'Sala', t: 'select', outro: 1, o: L('salas') }];
const alunoFields = ENT.alunos.fields;
ENT.alunos.fields = () => [...alunoFields(), { k: 'bolsaFamilia', l: 'Recebe Bolsa Família', t: 'select', o: optsFix(['Não', 'Sim']), help: 'Usado no acompanhamento de frequência do programa.' }, { k: 'rotaId', l: 'Transporte escolar', t: 'select', o: () => DADOS.rotas.map(r => [r.id, r.nome]), help: 'Deixe em branco se não usa.' }, { k: 'restricao', l: 'Restrição alimentar', t: 'select', outro: 1, vazio: 'Nenhuma', o: L('restricoesAlimentares') }];
const alunoDefaults = ENT.alunos.defaults;
ENT.alunos.defaults = () => Object.assign(alunoDefaults(), { bolsaFamilia: 'Não', rotaId: '', restricao: '' });
ENT.alunos.title = 'Alunos';
// Usuário de uma escola: a escola vem do login, sem campo para escolher
const turmaDef = ENT.turmas.defaults; ENT.turmas.defaults = () => Object.assign(turmaDef(), escSessao() ? { escolaId: escSessao() } : {});
const semEscola = fields => () => (typeof fields === 'function' ? fields() : fields).filter(f => !(f.k === 'escolaId' && escSessao()));

Object.assign(ENT, {
  vagas: {
    coll: 'vagas', title: 'Vagas da rede', singular: 'oferta de vagas', plural: 'ofertas', fem: true, newLabel: 'Cadastrar vagas',
    desc: 'Vagas por escola, série e turno. Pais, responsáveis e outras escolas veem essas vagas na hora de pedir matrícula ou transferência.',
    fields: () => [{ k: 'escolaId', l: 'Escola', t: 'select', o: optsOf('escolas'), req: 1, wide: 1 }, { k: 'serie', l: 'Série', t: 'select', o: L('series'), req: 1 }, { k: 'turno', l: 'Turno', t: 'select', o: L('turnos'), req: 1 }, { k: 'total', l: 'Total de vagas', t: 'number', req: 1, attrs: 'min="0"' }, { k: 'ocupadasExt', l: 'Vagas ocupadas', t: 'number', attrs: 'min="0"', help: 'Só para escolas que enviam por API ou planilha. Nas escolas do Entrelaço o sistema conta os alunos matriculados.' }],
    defaults: () => ({ total: 35, ocupadasExt: 0, escolaId: escSessao() || undefined }),
    rows: () => DADOS.vagas.filter(v => naEscola(v.escolaId)),
    filter: { k: 'escolaId', l: 'Escola', o: optsOf('escolas'), scoped: true },
    sort: (a, b) => escNome(a.escolaId).localeCompare(escNome(b.escolaId)) || nomes('series').indexOf(a.serie) - nomes('series').indexOf(b.serie),
    cols: [['Escola', r => `${esc(escNome(r.escolaId))}${caption2(esc(byId('escolas', r.escolaId)?.bairro || ''))}`], ['Série', r => esc(r.serie)], ['Turno', r => esc(r.turno)], ['Total', r => r.total, 'n'], ['Ocupadas', r => ocupadas(r), 'n'], ['Disponíveis', r => vagasHTML(disp(r))], ['Lista de espera', r => { const n = fila(r.escolaId, r.serie, r.turno).length; return n ? `${n} na fila` : '<span class="muted">—</span>'; }]],
    check: (v, id) => DADOS.vagas.some(x => x.id !== id && x.escolaId === v.escolaId && x.serie === v.serie && x.turno === v.turno) ? 'Essa escola já tem vagas cadastradas para essa série e turno. Edite a oferta existente.' : '',
    name: r => `${escNome(r.escolaId)}, ${r.serie}, ${r.turno}`
  },
  rotas: {
    coll: 'rotas', title: 'Transporte escolar', singular: 'rota', plural: 'rotas', fem: true, newLabel: 'Cadastrar rota',
    desc: 'Rotas do transporte escolar (PNATE), com motorista, veículo, pontos de parada e alunos atendidos. Para colocar um aluno numa rota, edite o cadastro do aluno.',
    fields: () => [{ k: 'nome', l: 'Nome da rota', req: 1, wide: 1 }, { k: 'escolaId', l: 'Escola', t: 'select', o: optsOf('escolas'), req: 1 }, { k: 'turno', l: 'Turno', t: 'select', o: L('turnos'), req: 1 }, { k: 'motorista', l: 'Motorista', req: 1 }, { k: 'veiculo', l: 'Veículo e placa' }, { k: 'capacidade', l: 'Lugares', t: 'number', attrs: 'min="1"' }, { k: 'pontos', l: 'Pontos de parada', t: 'textarea', help: 'Um ponto por linha, com o horário. Ex.: 06:20 Praça da Várzea' }],
    cols: [['Rota', r => `${esc(r.nome)}${caption2(esc(r.veiculo || ''))}`], ['Escola', r => esc(escNome(r.escolaId))], ['Turno', r => esc(r.turno)], ['Motorista', r => esc(r.motorista)], ['Alunos', r => `${DADOS.alunos.filter(a => a.rotaId === r.id).length} de ${r.capacidade || '—'}`, 'n'], ['Paradas', r => (r.pontos || '').split('\n').filter(Boolean).length, 'n']],
    rows: () => DADOS.rotas.filter(r => naEscola(r.escolaId)),
    defaults: () => ({ escolaId: escSessao() || undefined }),
    rowActs: r => `<button class="btn ghost sm" data-act="rota-ver" data-id="${r.id}" aria-label="Ver paradas e alunos da ${esc(r.nome)}">Detalhes</button>`,
    onDelete: r => DADOS.alunos.forEach(a => { if (a.rotaId === r.id) a.rotaId = ''; })
  }
});

ENT.vagas.fields = semEscola(ENT.vagas.fields);
ENT.rotas.fields = semEscola(ENT.rotas.fields);
ENT.professores.fields = semEscola(ENT.professores.fields);

// ---------- Ações ----------
Object.assign(ACT, {
  copy: async el => {
    const t = el.dataset.text;
    try { await navigator.clipboard.writeText(t); toast('Copiado.'); }
    catch (e) { openDialog({ title: 'Copiar', body: `<div class="field"><label for="cp">Selecione e copie</label><textarea id="cp" readonly>${esc(t)}</textarea></div>`, foot: '<button type="button" class="btn primary" data-act="close-dlg">Fechar</button>' }); setTimeout(() => $('#cp')?.select(), 50); }
  },
  'rota-ver': el => {
    const r = byId('rotas', el.dataset.id); const al = DADOS.alunos.filter(a => a.rotaId === r.id);
    openDialog({ title: r.nome, body: `<dl class="dl"><dt>Escola</dt><dd>${esc(escNome(r.escolaId))}</dd><dt>Turno</dt><dd>${esc(r.turno)}</dd><dt>Motorista</dt><dd>${esc(r.motorista)}</dd><dt>Veículo</dt><dd>${esc(r.veiculo || '—')}</dd></dl><h3>Paradas</h3><ol class="list">${(r.pontos || '').split('\n').filter(Boolean).map(p => `<li>${esc(p)}</li>`).join('')}</ol><h3>Alunos (${al.length} de ${r.capacidade || '—'})</h3>${al.length ? `<ul class="list">${al.map(a => `<li>${esc(a.nome)}, ${esc(turmaNome(a.turmaId))}</li>`).join('')}</ul>` : '<p class="muted">Nenhum aluno nesta rota.</p>'}`, foot: '<button type="button" class="btn primary" data-act="close-dlg">Fechar</button>' });
  },
  'pm-start': el => { UI.sel.pm = { escolaId: el.dataset.escola, serie: el.dataset.serie, turno: el.dataset.turno }; go('matricula'); },
  'pm-analisar': el => {
    const p = byId('prematriculas', el.dataset.id);
    const turmas = [p.escola1, p.escola2].filter(Boolean).flatMap(eid => isLocal(eid)
      ? DADOS.turmas.filter(t => t.escolaId === eid && t.serie === p.serie && t.turno === p.turno).map(t => { const v = DADOS.vagas.find(x => x.escolaId === eid && x.serie === p.serie && x.turno === p.turno); const n = v ? disp(v) + (p.status === 'Vaga reservada' && p.escolaId === eid ? 1 : 0) : 0; return [t.id, `${t.nome}, ${escNome(eid)}: ${n ? n + ' vaga' + (n > 1 ? 's' : '') : 'sem vagas'}`, n === 0]; })
      : [['ext:' + eid, `${escNome(eid)} (encaminhar pela integração)`, !DADOS.vagas.some(v => v.escolaId === eid && v.serie === p.serie && v.turno === p.turno && disp(v) > 0)]]);
    const decs = ['Matrícula confirmada', 'Lista de espera', 'Documentos pendentes', 'Indeferida'];
    openDialog({
      title: `Pré-matrícula ${p.protocolo}`, wide: true,
      body: `<dl class="dl"><dt>Estudante</dt><dd>${esc(p.estudante)}, ${idade(p.nascimento)} anos</dd><dt>Série e turno</dt><dd>${esc(p.serie)}, ${esc(p.turno.toLowerCase())}</dd><dt>Escolas pedidas</dt><dd>1ª opção: ${esc(escNome(p.escola1))}${p.escola2 ? `<br>2ª opção: ${esc(escNome(p.escola2))}` : ''}</dd><dt>Responsável</dt><dd>${esc(p.responsavel)}, ${esc(p.telefone)}</dd><dt>Bairro</dt><dd>${esc(p.bairro || '—')}</dd><dt>Acessibilidade</dt><dd>${esc(p.acess || 'Nenhuma')}</dd></dl>
        <section><h3 class="lbl" style="margin-bottom:.5rem">Documentos</h3><ul class="list">${nomes('documentosMatricula').map(d => `<li>${p.docs.includes(d) ? st(d, 'ok') : st(d + ' (não enviado)', 'err')}</li>`).join('')}</ul></section>
        <fieldset class="field"><legend>Decisão</legend><div class="seg">${decs.map(d => `<label><input type="radio" name="pm-dec" value="${d}" ${d === (p.status === 'Em análise' ? decs[0] : p.status) ? 'checked' : ''}>${d === 'Matrícula confirmada' ? 'Confirmar matrícula' : d}</label>`).join('')}</div></fieldset>
        <div class="field"><label for="pm-turma">Turma ou escola de destino</label><select id="pm-turma">${optHTML(turmas, '')}</select><p class="help">Usado só para confirmar a matrícula. Se não houver turma dessa série e turno, crie a turma antes.</p></div>
        <div class="field"><label for="pm-obs">Mensagem para o responsável</label><textarea id="pm-obs">${esc(p.obs)}</textarea></div>`,
      onSubmit: f => {
        const dec = f.querySelector('input[name=pm-dec]:checked').value; const obs = $('#pm-obs').value.trim();
        if (dec === 'Matrícula confirmada') {
          const val = $('#pm-turma').value;
          if (!val) { alertSR('Escolha a turma ou a escola de destino.'); toast('Escolha a turma ou a escola de destino.', 'err'); $('#pm-turma').focus(); return false; }
          if (val.startsWith('ext:')) {
            const eid = val.slice(4); const v = DADOS.vagas.find(x => x.escolaId === eid && x.serie === p.serie && x.turno === p.turno);
            if (v) v.ocupadasExt = (Number(v.ocupadasExt) || 0) + 1;
            Object.assign(p, { status: 'Encaminhada à escola', escolaId: eid, obs: obs || `Pedido encaminhado para a ${escNome(eid)}. A escola vai entrar em contato para concluir a matrícula.` });
          } else {
            const t = byId('turmas', val);
            const al = { id: uid(), nome: p.estudante, matricula: '2026' + String(DADOS.alunos.length + DADOS.egressos.length + 1).padStart(4, '0'), nascimento: p.nascimento, turmaId: t.id, email: '', responsavel: p.responsavel, telResp: p.telefone, acess: p.acess || 'Nenhuma', bolsaFamilia: 'Não', rotaId: '', restricao: '' };
            DADOS.alunos.push(al);
            const r = byId('responsaveis', p.responsavelId); if (r) r.filhos.push(al.id);
            Object.assign(p, { status: 'Matrícula confirmada', escolaId: t.escolaId, alunoId: al.id, obs: obs || `Matrícula confirmada na turma ${t.nome} da ${escNome(t.escolaId)}. Número de matrícula: ${al.matricula}.` });
          }
        } else {
          p.status = dec; if (dec === 'Lista de espera') p.escolaId = p.escola1;
          p.obs = obs || (dec === 'Lista de espera' ? 'A turma está completa. Avisaremos quando abrir uma vaga.' : dec === 'Documentos pendentes' ? 'Envie os documentos que faltam para continuar.' : '');
        }
        save(); rerender(); toast(`Pré-matrícula ${p.protocolo}: ${p.status.toLowerCase()}.`);
      }
    });
  },
  'tr-nova': () => {
    openDialog({
      title: 'Nova transferência', wide: true,
      body: `<div class="form-grid"><div class="field wide"><label for="tr-aluno">Aluno <span class="req" aria-hidden="true">*</span></label><select id="tr-aluno" required data-change="trAluno">${optHTML(alunosEsc().map(a => [a.id, `${a.nome}, ${turmaLong(a.turmaId)}`]).sort((a, b) => a[1].localeCompare(b[1])), '')}</select></div>
        <div class="field wide"><label for="tr-dest">Escola de destino <span class="req" aria-hidden="true">*</span></label><select id="tr-dest" required><option value="">Escolha o aluno primeiro</option></select><p class="help">Aparecem as escolas da rede com vagas para a série do aluno. Opções sem vaga ficam desativadas.</p></div>
        ${motivoTransfHTML()}</div>`,
      onSubmit: () => {
        const a = byId('alunos', $('#tr-aluno').value); const v = byId('vagas', $('#tr-dest').value);
        DADOS.transferencias.push({ id: uid(), alunoId: a.id, origemId: escolaDe(a), destinoId: v.escolaId, vagaId: v.id, serie: v.serie, turno: v.turno, motivo: motivoTransf(), solicitante: 'Escola', status: 'Aguardando escola de destino', data: TODAY_ISO, resposta: '' });
        save(); rerender(); toast(isLocal(v.escolaId) ? 'Transferência enviada para a escola de destino.' : 'Transferência enviada pela integração.');
      }
    });
  },
  'tr-resp': el => {
    const t = byId('transferencias', el.dataset.id); const a = byId('alunos', t.alunoId);
    const origem = t.status === 'Aguardando escola de origem'; const local = isLocal(t.destinoId);
    const turmas = DADOS.turmas.filter(x => x.escolaId === t.destinoId && x.serie === t.serie && x.turno === t.turno).map(x => [x.id, x.nome]);
    const opts = origem ? [['ok', 'Liberar transferência'], ['no', 'Recusar']] : local ? [['ok', 'Aceitar aluno'], ['no', 'Recusar']] : [['ok', 'Escola aceitou'], ['no', 'Escola recusou']];
    openDialog({
      title: `Transferência de ${a ? a.nome : 'aluno'}`, wide: true,
      body: `<dl class="dl"><dt>De</dt><dd>${esc(escNome(t.origemId))}${a ? ', ' + esc(turmaNome(a.turmaId)) : ''}</dd><dt>Para</dt><dd>${esc(escNome(t.destinoId))}, ${esc(t.serie)}, ${esc(t.turno.toLowerCase())}</dd><dt>Pedido por</dt><dd>${esc(t.solicitante)} em ${fmtD(t.data)}</dd><dt>Motivo</dt><dd>${esc(t.motivo)}</dd></dl>
        ${!origem && !local ? `<p class="quote">A ${esc(escNome(t.destinoId))} recebe pedidos pela integração (${esc(byId('escolas', t.destinoId)?.integracao)}). Registre aqui a resposta que ela enviou.</p>` : ''}
        <fieldset class="field"><legend>Decisão</legend><div class="seg">${opts.map(([v, l], i) => `<label><input type="radio" name="tr-dec" value="${v}" ${i === 0 ? 'checked' : ''}>${l}</label>`).join('')}</div></fieldset>
        ${!origem && local ? `<div class="field"><label for="tr-turma">Turma de destino</label><select id="tr-turma">${optHTML(turmas, turmas[0]?.[0])}</select>${turmas.length ? '' : '<p class="err-msg">Não há turma dessa série e turno na escola de destino. Crie a turma antes de aceitar.</p>'}</div>` : ''}
        <div class="field"><label for="tr-resp">Resposta</label><textarea id="tr-resp">${esc(t.resposta)}</textarea></div>`,
      onSubmit: f => {
        const ok = f.querySelector('input[name=tr-dec]:checked').value === 'ok'; t.resposta = $('#tr-resp').value.trim();
        if (!ok) { t.status = 'Recusada'; }
        else if (origem) { t.status = 'Aguardando escola de destino'; }
        else if (local) {
          const tid = $('#tr-turma')?.value; if (!tid) { toast('Escolha a turma de destino.', 'err'); alertSR('Escolha a turma de destino.'); return false; }
          const v = byId('vagas', t.vagaId); if (v && disp(v) <= 0) { toast('A escola de destino não tem mais vagas nessa série e turno.', 'err'); return false; }
          a.turmaId = tid; if (a.rotaId && byId('rotas', a.rotaId)?.escolaId !== t.destinoId) a.rotaId = '';
          t.status = 'Concluída';
        } else {
          const v = byId('vagas', t.vagaId); if (v) v.ocupadasExt = (Number(v.ocupadasExt) || 0) + 1;
          if (a) { DADOS.egressos.push(Object.assign({}, a, { destinoId: t.destinoId, saida: TODAY_ISO })); DADOS.alunos = DADOS.alunos.filter(x => x.id !== a.id); t.alunoNome = a.nome; }
          t.status = 'Concluída';
        }
        save(); rerender(); toast(`Transferência: ${t.status.toLowerCase()}.`);
      }
    });
  },
  sync: el => { const e = byId('escolas', el.dataset.id); e.ultimaSync = new Date().toISOString(); save(); rerender(); toast(`Vagas da ${e.nome} atualizadas.`); },
  'csv-import': () => {
    const rows = (UI.csv || []).filter(r => !r.erro); let n = 0;
    rows.forEach(r => {
      let v = DADOS.vagas.find(x => x.escolaId === r.escolaId && x.serie === r.serie && x.turno === r.turno);
      if (!v) { v = { id: uid(), escolaId: r.escolaId, serie: r.serie, turno: r.turno }; DADOS.vagas.push(v); }
      v.total = r.total; if (!isLocal(r.escolaId)) v.ocupadasExt = r.ocupadas; n++;
      const e = byId('escolas', r.escolaId); if (e) e.ultimaSync = new Date().toISOString();
    });
    UI.csv = null; save(); rerender(); toast(`${n} oferta${n === 1 ? '' : 's'} de vagas importada${n === 1 ? '' : 's'}.`);
  },
  contato: el => {
    const a = byId('alunos', el.dataset.id);
    openDialog({ title: `Registrar contato: ${a.nome}`, body: `<div class="form-grid">${fieldHTML({ k: 'ct-data', l: 'Data', t: 'date', req: 1 }, TODAY_ISO)}${fieldHTML({ k: 'ct-meio', l: 'Como foi o contato', t: 'select', o: L('meiosContato'), req: 1 }, 'Telefone')}${fieldHTML({ k: 'ct-enc', l: 'Encaminhamento', t: 'select', o: L('encaminhamentos') }, 'Nenhum')}${fieldHTML({ k: 'ct-res', l: 'O que foi combinado', t: 'textarea', req: 1 }, '')}</div>`,
      onSubmit: () => { DADOS.contatos.push({ id: uid(), alunoId: a.id, data: $('#f-ct-data').value, meio: $('#f-ct-meio').value, encaminhamento: $('#f-ct-enc').value || 'Nenhum', resultado: $('#f-ct-res').value.trim() }); save(); rerender(); toast('Contato registrado.'); } });
  },
  pei: el => {
    const a = byId('alunos', el.dataset.id); const p = a.pei || { recursos: [], sala: '', apoio: '', obs: '' };
    openDialog({ title: `Plano educacional (PEI): ${a.nome}`, wide: true,
      body: `<p class="muted">${esc(turmaLong(a.turmaId))}. Necessidade: <b>${esc(a.acess)}</b>. Os professores da turma veem estes recursos no painel deles.</p><div class="form-grid">${fieldHTML({ k: 'pei-rec', l: 'Recursos e adaptações', t: 'checks', o: L('recursosPEI') }, p.recursos)}${fieldHTML({ k: 'pei-sala', l: 'Atendimento na sala de recursos', help: 'Dias e horários no contraturno.' }, p.sala)}${fieldHTML({ k: 'pei-apoio', l: 'Profissional de apoio' }, p.apoio)}${fieldHTML({ k: 'pei-obs', l: 'Orientações para os professores', t: 'textarea' }, p.obs)}</div>`,
      onSubmit: f => { a.pei = { recursos: new FormData(f).getAll('pei-rec'), sala: $('#f-pei-sala').value.trim(), apoio: $('#f-pei-apoio').value.trim(), obs: $('#f-pei-obs').value.trim() }; save(); rerender(); toast('Plano educacional salvo.'); } });
  }
});
Object.assign(CHG, {
  trAluno: el => { const a = byId('alunos', el.value); const d = $('#tr-dest'); if (!d) return; d.innerHTML = a ? optHTML(vagaOpts(serieDe(a), '', escolaDe(a)), '') : '<option value="">Escolha o aluno primeiro</option>'; },
  vsSerie: el => { UI.sel.vs = el.value; rerender(); }, vsTurno: el => { UI.sel.vt = el.value; rerender(); }, vsBairro: el => { UI.sel.vb = el.value; rerender(); },
  pmOpts: () => { const s = $('#pm-serie')?.value, t = $('#pm-turno')?.value; ['pm-e1', 'pm-e2'].forEach((id, i) => { const el = $('#' + id); const cur = el.value; el.innerHTML = s && t ? optHTML(vagaOpts(s, t).map(([vid, l, dis]) => [byId('vagas', vid).escolaId, l]), cur, i ? 'Sem segunda opção' : 'Selecione…') : `<option value="">Escolha a série e o turno</option>`; }); },
  filho: el => { UI.sel.filho = el.value; rerender(); },
  csv: el => {
    const file = el.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      const lines = String(rd.result).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const sep = lines[0].includes(';') ? ';' : ',';
      const head = lines[0].toLowerCase().split(sep).map(x => x.trim());
      const ix = k => head.indexOf(k);
      UI.csv = lines.slice(1).map(l => {
        const c = l.split(sep).map(x => x.trim()); const e = DADOS.escolas.find(x => x.inep === c[ix('inep')]);
        const r = { inep: c[ix('inep')], serie: c[ix('serie')], turno: c[ix('turno')], total: Number(c[ix('total')]), ocupadas: Number(c[ix('ocupadas')]) || 0, escolaId: e?.id };
        if (!e) r.erro = 'INEP não encontrado na rede'; else if (!nomes('series').includes(r.serie)) r.erro = 'Série não reconhecida'; else if (!nomes('turnos').includes(r.turno)) r.erro = 'Turno não reconhecido'; else if (isNaN(r.total)) r.erro = 'Total inválido';
        return r;
      });
      rerender(); alertSR(`${UI.csv.length} linhas lidas da planilha.`);
    };
    rd.readAsText(file);
  }
});
Object.assign(FORMS, {
  merenda: f => { [1, 2, 3, 4, 5].forEach(d => { DADOS.cardapio[d] = $('#mer-' + d).value.trim(); }); DADOS.cardapio.obs = $('#mer-obs').value.trim(); save(); toast('Cardápio da semana salvo.'); },
  prematricula: f => {
    if (!$('#pm-decl').checked) { alertSR('Confirme que as informações são verdadeiras.'); toast('Confirme que as informações são verdadeiras.', 'err'); $('#pm-decl').focus(); return; }
    const docs = nomes('documentosMatricula').filter((d, i) => $('#pm-doc-' + i).files.length);
    const g = id => $('#' + id).value.trim();
    const n = 39 + DADOS.prematriculas.length;
    const p = { id: uid(), protocolo: `PM-2026-${String(n).padStart(5, '0')}`, responsavelId: SESSION.userId, responsavel: g('pm-resp'), telefone: g('pm-tel'), estudante: g('pm-nome'), nascimento: g('pm-nasc'), serie: g('pm-serie'), turno: g('pm-turno'), escola1: g('pm-e1'), escola2: g('pm-e2'), escolaId: g('pm-e1'), bairro: g('pm-bairro'), acess: g('pm-acess') || 'Nenhuma', docs, status: 'Em análise', data: TODAY_ISO, obs: '' };
    DADOS.prematriculas.push(p); UI.sel.pm = null; save();
    go('pedidos'); toast(`Pedido enviado. Protocolo ${p.protocolo}.`);
  },
  'transf-resp': f => {
    const a = byId('alunos', $('#tr-aluno').value); const v = byId('vagas', $('#tr-dest').value);
    DADOS.transferencias.push({ id: uid(), alunoId: a.id, origemId: escolaDe(a), destinoId: v.escolaId, vagaId: v.id, serie: v.serie, turno: v.turno, motivo: motivoTransf(), solicitante: 'Responsável', responsavelId: SESSION.userId, status: 'Aguardando escola de origem', data: TODAY_ISO, resposta: '' });
    save(); go('pedidos'); toast('Pedido de transferência enviado à escola.');
  }
});

// ---------- Notificações e painel inicial da gestão ----------
function notifsRede(r, add) {
  if (r === 'gestao') {
    DADOS.prematriculas.filter(p => p.status === 'Em análise' && naEscola(p.escola1, p.escola2)).forEach(p => add('pm-' + p.id, `Pré-matrícula de ${p.estudante}`, `${p.protocolo}, ${p.serie}`, 'prematriculas', 'inbox'));
    DADOS.transferencias.filter(t => t.status.startsWith('Aguardando') && naEscola(t.origemId, t.destinoId)).forEach(t => add('tr-' + t.id + t.status, `Transferência de ${alunoNome(t.alunoId)}`, t.status, 'transferencias', 'swap'));
  }
  if (r === 'responsavel') {
    DADOS.prematriculas.filter(p => p.responsavelId === SESSION.userId && p.status !== 'Em análise').forEach(p => add('pm-' + p.id + p.status, `${p.estudante}: ${p.status.toLowerCase()}`, p.obs || p.protocolo, 'pedidos', 'inbox'));
    DADOS.transferencias.filter(t => t.responsavelId === SESSION.userId).forEach(t => add('tr-' + t.id + t.status, `Transferência de ${t.alunoNome || alunoNome(t.alunoId)}`, t.status, 'pedidos', 'swap'));
  }
}
function redeStat() {
  const livres = DADOS.vagas.reduce((s, v) => s + disp(v), 0);
  return statCard('peach', 'Vagas livres na rede', livres, `${DADOS.prematriculas.filter(p => p.status === 'Em análise').length} pré-matrículas e ${DADOS.transferencias.filter(t => t.status.startsWith('Aguardando')).length} transferências aguardando`, 'vagas');
}
function redeCard() {
  const pm = DADOS.prematriculas.filter(p => p.status === 'Em análise' && naEscola(p.escola1, p.escola2)); const tr = DADOS.transferencias.filter(t => t.status.startsWith('Aguardando') && naEscola(t.origemId, t.destinoId));
  return `<section class="card c4" aria-labelledby="rede-h"><div class="card-h"><h2 id="rede-h">Matrículas e transferências</h2><button class="btn ghost sm" data-act="go" data-route="prematriculas">Ver todas</button></div>${pm.length + tr.length ? `<ul class="list">${pm.map(p => `<li><span class="grow"><span class="t">${esc(p.estudante)}</span><br><span class="m">Pré-matrícula, ${esc(p.serie)}</span></span><button class="btn outline sm" data-act="pm-analisar" data-id="${p.id}" aria-label="Analisar pré-matrícula de ${esc(p.estudante)}">Analisar</button></li>`).join('')}${tr.map(t => `<li><span class="grow"><span class="t">${esc(alunoNome(t.alunoId))}</span><br><span class="m">Transferência para ${esc(escNome(t.destinoId))}</span></span><button class="btn outline sm" data-act="tr-resp" data-id="${t.id}" aria-label="Responder transferência de ${esc(alunoNome(t.alunoId))}">Responder</button></li>`).join('')}</ul>` : '<p class="empty">Nenhum pedido aguardando.</p>'}</section>`;
}

// ================= GESTÃO =================
function gVagas() {
  const livres = DADOS.vagas.reduce((s, v) => s + disp(v), 0); const tot = DADOS.vagas.reduce((s, v) => s + (Number(v.total) || 0), 0);
  const top = `<section class="stats" aria-label="Resumo de vagas">
    ${statCard('peach', 'Vagas livres', livres, `de ${tot} vagas oferecidas`)}
    ${statCard('rose', 'Escolas com vagas', uniq(DADOS.vagas.filter(v => disp(v) > 0).map(v => v.escolaId)).length, `de ${DADOS.escolas.length} escolas da rede`)}
    ${statCard('mint', 'Lista de espera', DADOS.prematriculas.filter(p => p.status === 'Lista de espera').length, 'estudantes aguardando vaga', 'prematriculas')}
    ${statCard('peri', 'Pré-matrículas', DADOS.prematriculas.filter(p => p.status === 'Em análise').length, 'aguardando análise', 'prematriculas')}
  </section>`;
  return crudPage('vagas', top);
}
function gPrematriculas() {
  const ord = { 'Em análise': 0, 'Documentos pendentes': 1, 'Lista de espera': 2 };
  const list = DADOS.prematriculas.filter(p => naEscola(p.escola1, p.escola2)).sort((a, b) => (ord[a.status] ?? 3) - (ord[b.status] ?? 3) || a.data.localeCompare(b.data));
  return pageHead('Pré-matrículas', 'Pedidos de matrícula feitos pelos responsáveis no portal. Confira os documentos, confirme a vaga, coloque na lista de espera ou peça o que falta.') +
    (list.length ? `<div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">Pré-matrículas</caption><thead><tr><th scope="col">Estudante</th><th scope="col">Série e turno</th><th scope="col">Escolas pedidas</th><th scope="col" class="n">Documentos</th><th scope="col">Situação</th><th scope="col" class="n">Ação</th></tr></thead><tbody>${list.map(p => `<tr><th scope="row">${esc(p.estudante)}${caption2(`${esc(p.protocolo)}, enviado em ${fmtD(p.data)}`)}</th><td data-label="Série e turno">${esc(p.serie)}${caption2(esc(p.turno))}</td><td data-label="Escolas pedidas">1ª: ${esc(escNome(p.escola1))}${p.escola2 ? caption2('2ª: ' + esc(escNome(p.escola2))) : ''}</td><td class="n" data-label="Documentos">${p.docs.length} de ${nomes('documentosMatricula').length}</td><td data-label="Situação">${pedHTML(p.status)}${p.status === 'Lista de espera' ? caption2(`${posEspera(p)}º da fila`) : ''}</td><td class="n"><div class="acts"><button class="btn ${p.status === 'Em análise' ? 'primary' : 'ghost'} sm" data-act="pm-analisar" data-id="${p.id}" aria-label="Analisar pré-matrícula de ${esc(p.estudante)}">${p.status === 'Em análise' ? 'Analisar' : 'Revisar'}</button></div></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhuma pré-matrícula.</p>');
}
function gTransferencias() {
  const list = DADOS.transferencias.filter(t => naEscola(t.origemId, t.destinoId)).sort((a, b) => (a.status.startsWith('Aguardando') ? 0 : 1) - (b.status.startsWith('Aguardando') ? 0 : 1) || b.data.localeCompare(a.data));
  return pageHead('Transferências', 'Transferências entre escolas da rede. A escola de origem libera, a escola de destino aceita e o aluno muda de turma automaticamente. Escolas integradas por API recebem o pedido pelo sistema delas.', `<button class="btn primary" data-act="tr-nova">${icon('swap')}Nova transferência</button>`) +
    (list.length ? `<div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">Transferências</caption><thead><tr><th scope="col">Aluno</th><th scope="col">De</th><th scope="col">Para</th><th scope="col">Pedido por</th><th scope="col">Situação</th><th scope="col" class="n">Ação</th></tr></thead><tbody>${list.map(t => `<tr><th scope="row">${esc(t.alunoNome || alunoNome(t.alunoId))}${caption2(esc(t.motivo))}</th><td data-label="De">${esc(escNome(t.origemId))}</td><td data-label="Para">${esc(escNome(t.destinoId))}${caption2(`${esc(t.serie)}, ${esc(t.turno.toLowerCase())}`)}</td><td data-label="Pedido por">${esc(t.solicitante)}${caption2(fmtD(t.data))}</td><td data-label="Situação">${pedHTML(t.status)}${t.resposta ? caption2(esc(t.resposta)) : ''}</td><td class="n"><div class="acts">${t.status.startsWith('Aguardando') ? `<button class="btn primary sm" data-act="tr-resp" data-id="${t.id}" aria-label="Responder transferência de ${esc(alunoNome(t.alunoId))}">${t.status === 'Aguardando escola de origem' ? 'Analisar' : 'Responder'}</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhuma transferência.</p>');
}
function gIntegracoes() {
  const api = DADOS.escolas.filter(e => e.integracao !== 'Sistema Entrelaço');
  const token = 'ent_live_7Qm2c9XfR4tLw8pZ3f9a';
  const csvModelo = 'inep,serie,turno,total,ocupadas\n26140033,1º ano — Ensino médio,Noite,35,22\n26140033,9º ano — Fundamental,Manhã,30,25';
  const exemplo = `GET /v1/vagas?serie=1º ano — Ensino médio&turno=Manhã\n\n[\n  {\n    "inep": "26140011",\n    "escola": "Escola Estadual Jardim das Acácias",\n    "serie": "1º ano — Ensino médio",\n    "turno": "Manhã",\n    "total": 45,\n    "ocupadas": 41,\n    "disponiveis": 4\n  }\n]`;
  const prev = UI.csv;
  return pageHead('Integrações', 'Conecte outras escolas da rede para compartilhar vagas, receber transferências e pré-matrículas. Escolas com outro sistema usam a API; as demais enviam uma planilha.') +
    `<section class="stats" aria-label="Resumo">${statCard('peach', 'Escolas conectadas', DADOS.escolas.length, `${DADOS.escolas.filter(e => isLocal(e.id)).length} no Entrelaço, ${api.length} por API ou planilha`)}${statCard('rose', 'Vagas livres publicadas', DADOS.vagas.reduce((s, v) => s + disp(v), 0), 'somando todas as escolas')}${statCard('mint', 'Desatualizadas', DADOS.escolas.filter(e => e.ultimaSync && (Date.now() - new Date(e.ultimaSync)) > 864e5).length, 'escolas sem envio há mais de 24 horas')}</section>
    <div class="tbl-wrap"><table class="tbl stack"><caption>Escolas da rede</caption><thead><tr><th scope="col">Escola</th><th scope="col">Forma de integração</th><th scope="col">Última atualização</th><th scope="col" class="n">Vagas livres</th><th scope="col" class="n">Ação</th></tr></thead><tbody>${DADOS.escolas.map(e => { const old = e.ultimaSync && (Date.now() - new Date(e.ultimaSync)) > 864e5; return `<tr><th scope="row">${esc(e.nome)}${caption2('INEP ' + esc(e.inep || '—'))}</th><td data-label="Integração">${esc(e.integracao || '—')}</td><td data-label="Atualizado">${e.ultimaSync ? (old ? st(fmtHora(e.ultimaSync), 'warn') : fmtHora(e.ultimaSync)) : '—'}</td><td class="n" data-label="Vagas livres">${DADOS.vagas.filter(v => v.escolaId === e.id).reduce((s, v) => s + disp(v), 0)}</td><td class="n"><div class="acts">${e.integracao === 'API' ? `<button class="btn outline sm" data-act="sync" data-id="${e.id}" aria-label="Sincronizar vagas da ${esc(e.nome)}">Sincronizar agora</button>` : e.integracao === 'Planilha CSV' ? '<span class="caption">Envio por planilha</span>' : '<span class="caption">Automático</span>'}</div></td></tr>`; }).join('')}</tbody></table></div>
    <div class="grid g2">
      <section class="card" aria-labelledby="api-h"><h2 id="api-h">API da rede</h2><p class="muted">Sistemas de outras escolas usam estes endereços para publicar vagas e trocar pedidos com o Entrelaço. Entregue a chave só para a equipe técnica da escola.</p>
        <dl class="dl"><dt>Endereço</dt><dd><code>https://api.entrelaco.edu.br/v1</code></dd><dt>Chave de acesso</dt><dd><code>ent_live_••••••••3f9a</code> <button class="btn ghost sm" data-act="copy" data-text="${token}" aria-label="Copiar chave de acesso">${icon('copy')}Copiar</button></dd></dl>
        <div class="tbl-wrap"><table class="tbl"><caption class="sr-only">Recursos da API</caption><thead><tr><th scope="col">Recurso</th><th scope="col">Para que serve</th></tr></thead><tbody>
          <tr><th scope="row"><code>GET /vagas</code></th><td>Consultar vagas livres por série, turno e bairro</td></tr>
          <tr><th scope="row"><code>PUT /escolas/{inep}/vagas</code></th><td>Publicar ou atualizar as vagas da escola</td></tr>
          <tr><th scope="row"><code>POST /transferencias</code></th><td>Pedir a transferência de um aluno</td></tr>
          <tr><th scope="row"><code>PATCH /transferencias/{id}</code></th><td>Aceitar ou recusar uma transferência recebida</td></tr>
          <tr><th scope="row"><code>GET /pre-matriculas</code></th><td>Receber pedidos de matrícula encaminhados à escola</td></tr>
        </tbody></table></div>
        <details class="data"><summary>Ver exemplo de resposta</summary><pre class="quote" style="overflow-x:auto;font-size:.8125rem">${esc(exemplo)}</pre></details>
      </section>
      <section class="card" aria-labelledby="csv-h"><h2 id="csv-h">Importar vagas por planilha</h2><p class="muted">Para escolas sem sistema próprio. Salve a planilha em CSV com as colunas abaixo, uma linha por série e turno.</p>
        <pre class="quote" style="overflow-x:auto;font-size:.8125rem">${esc(csvModelo)}</pre>
        <div class="row"><button class="btn ghost sm" data-act="copy" data-text="${esc(csvModelo)}">${icon('copy')}Copiar modelo</button></div>
        <div class="field"><label for="csv-file">Arquivo CSV</label><input id="csv-file" type="file" accept=".csv,text/csv" data-change="csv"></div>
        ${prev ? `<div class="tbl-wrap"><table class="tbl stack"><caption>Prévia: ${prev.length} linhas</caption><thead><tr><th scope="col">Escola</th><th scope="col">Série e turno</th><th scope="col" class="n">Total</th><th scope="col" class="n">Ocupadas</th><th scope="col">Situação</th></tr></thead><tbody>${prev.map(r => `<tr><th scope="row">${esc(r.escolaId ? escNome(r.escolaId) : 'INEP ' + r.inep)}</th><td data-label="Série e turno">${esc(r.serie)}, ${esc(r.turno)}</td><td class="n" data-label="Total">${esc(r.total)}</td><td class="n" data-label="Ocupadas">${esc(r.ocupadas)}</td><td data-label="Situação">${r.erro ? st(r.erro, 'err') : st('Pronta', 'ok')}</td></tr>`).join('')}</tbody></table></div><div class="row"><button class="btn primary" data-act="csv-import">${icon('upload')}Importar ${prev.filter(r => !r.erro).length} linhas válidas</button></div>` : ''}
      </section>
    </div>`;
}
function gBuscaAtiva() {
  const rows = alunosEsc().map(a => { const f = freqInfo(a.id); const min = a.bolsaFamilia === 'Sim' ? Math.max(bfMin(a), DADOS.config.freqMin) : DADOS.config.freqMin; return { a, f, min }; }).filter(x => x.f.pct != null && x.f.pct < x.min + 5).sort((x, y) => x.f.pct - y.f.pct);
  const bf = alunosEsc().filter(a => a.bolsaFamilia === 'Sim');
  const ult = aid => DADOS.contatos.filter(c => c.alunoId === aid).sort((a, b) => b.data.localeCompare(a.data))[0];
  return pageHead('Busca ativa', `Alunos faltando muito ou perto do limite. O mínimo da escola é ${DADOS.config.freqMin}%. Para quem recebe Bolsa Família, o programa exige 85% de 6 a 15 anos e 75% de 16 a 17 anos.`) +
    `<div class="tbl-wrap"><table class="tbl stack"><caption>Alunos para contatar</caption><thead><tr><th scope="col">Aluno</th><th scope="col" class="n">Frequência</th><th scope="col">Bolsa Família</th><th scope="col">Situação</th><th scope="col">Último contato</th><th scope="col" class="n">Ação</th></tr></thead><tbody>${rows.length ? rows.map(({ a, f, min }) => { const c = ult(a.id); return `<tr><th scope="row">${esc(a.nome)}${caption2(`${esc(turmaNome(a.turmaId))}, ${idade(a.nascimento)} anos, responsável ${esc(a.responsavel)} ${esc(a.telResp || '')}`)}</th><td class="n" data-label="Frequência">${num(f.pct, 0)}%${caption2(f.faltas + ' faltas')}</td><td data-label="Bolsa Família">${a.bolsaFamilia === 'Sim' ? `Sim, mínimo ${bfMin(a)}%` : 'Não'}</td><td data-label="Situação">${f.pct < min ? st('Abaixo do mínimo', 'err') : st('Perto do limite', 'warn')}</td><td data-label="Último contato">${c ? `${fmtD(c.data)}, ${esc(c.meio.toLowerCase())}${caption2(esc(c.resultado))}` : '<span class="muted">Nenhum</span>'}</td><td class="n"><div class="acts"><button class="btn outline sm" data-act="contato" data-id="${a.id}" aria-label="Registrar contato com a família de ${esc(a.nome)}">Registrar contato</button></div></td></tr>`; }).join('') : '<tr><td colspan="6">Nenhum aluno abaixo ou perto do mínimo.</td></tr>'}</tbody></table></div>
    <section class="card" aria-labelledby="bf-h"><h2 id="bf-h">Acompanhamento do Bolsa Família</h2><p class="muted">Frequência dos beneficiários para informar no Sistema Presença do MEC.</p>
      <div class="tbl-wrap"><table class="tbl stack"><thead><tr><th scope="col">Aluno</th><th scope="col">Turma</th><th scope="col" class="n">Idade</th><th scope="col" class="n">Frequência</th><th scope="col">Condição do programa</th></tr></thead><tbody>${bf.map(a => { const p = freqPct(a.id); return `<tr><th scope="row">${esc(a.nome)}</th><td data-label="Turma">${esc(turmaNome(a.turmaId))}</td><td class="n" data-label="Idade">${idade(a.nascimento)}</td><td class="n" data-label="Frequência">${num(p, 0)}%</td><td data-label="Condição">${p != null && p >= bfMin(a) ? st(`Cumpre (mínimo ${bfMin(a)}%)`, 'ok') : st(`Não cumpre (mínimo ${bfMin(a)}%)`, 'err')}</td></tr>`; }).join('')}</tbody></table></div>
      <div class="row"><button class="btn outline" data-act="copy" data-text="${esc(bf.map(a => `${a.matricula};${a.nome};${num(freqPct(a.id), 0)}`).join('\n'))}">${icon('copy')}Copiar lista para o Sistema Presença</button></div></section>`;
}
function gAEE() {
  const al = alunosEsc().filter(a => a.acess && a.acess !== 'Nenhuma').sort((a, b) => a.nome.localeCompare(b.nome));
  return pageHead('Educação especial (AEE)', 'Alunos público da educação especial, recursos garantidos no plano educacional individualizado (PEI) e atendimento na sala de recursos. Os professores recebem essas orientações no painel.') +
    (al.length ? `<div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">Alunos atendidos</caption><thead><tr><th scope="col">Aluno</th><th scope="col">Necessidade</th><th scope="col">Recursos</th><th scope="col">Sala de recursos</th><th scope="col">Apoio</th><th scope="col" class="n">Ação</th></tr></thead><tbody>${al.map(a => `<tr><th scope="row">${esc(a.nome)}${caption2(esc(turmaLong(a.turmaId)))}</th><td data-label="Necessidade">${esc(a.acess)}</td><td data-label="Recursos">${a.pei?.recursos?.length ? esc(a.pei.recursos.join(', ')) : st('Plano não preenchido', 'warn')}</td><td data-label="Sala de recursos">${esc(a.pei?.sala || '—')}</td><td data-label="Apoio">${esc(a.pei?.apoio || '—')}</td><td class="n"><div class="acts"><button class="btn outline sm" data-act="pei" data-id="${a.id}" aria-label="Editar plano educacional de ${esc(a.nome)}">Editar PEI</button></div></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhum aluno com necessidade registrada. Informe no cadastro do aluno.</p>');
}
function merendaSemana(restr) {
  const hoje = TODAY.getDay();
  return `<ul class="list">${DIAS.map(([d, l]) => `<li style="align-items:flex-start"><span class="time" style="width:8rem">${l}${d === hoje ? '<br><span class="fio-now">Hoje</span>' : ''}</span><span class="grow">${esc(DADOS.cardapio[d] || 'Cardápio não informado')}</span></li>`).join('')}</ul>${restr ? `<p class="quote">${restr}</p>` : ''}<p class="caption">${esc(DADOS.cardapio.obs || '')}</p>`;
}
function gMerenda() {
  const rs = alunosEsc().filter(a => a.restricao);
  return pageHead('Merenda escolar', 'Cardápio da semana (PNAE) e alunos com restrição alimentar. O cardápio aparece para alunos e responsáveis.') +
    `<div class="grid g2"><form class="card" data-form="merenda" novalidate aria-labelledby="mer-h"><h2 id="mer-h">Cardápio da semana</h2>${DIAS.map(([d, l]) => `<div class="field"><label for="mer-${d}">${l}</label><textarea id="mer-${d}" style="min-height:4.5rem">${esc(DADOS.cardapio[d] || '')}</textarea></div>`).join('')}<div class="field"><label for="mer-obs">Observação da nutricionista</label><textarea id="mer-obs" style="min-height:4.5rem">${esc(DADOS.cardapio.obs || '')}</textarea></div><div class="row"><button class="btn primary" type="submit">${icon('check')}Salvar cardápio</button></div></form>
    <section class="card" aria-labelledby="rs-h"><h2 id="rs-h">Restrições alimentares</h2>${rs.length ? `<ul class="list">${rs.map(a => `<li><span class="grow"><span class="t">${esc(a.nome)}</span><br><span class="m">${esc(turmaLong(a.turmaId))}</span></span><span>${esc(a.restricao)}</span></li>`).join('')}</ul>` : '<p class="empty">Nenhuma restrição registrada.</p>'}<p class="caption">Para incluir, edite o cadastro do aluno.</p></section></div>`;
}

// ================= RESPONSÁVEL =================
function rInicio() {
  const r = me(); const fs = filhos();
  const peds = [...DADOS.prematriculas.filter(p => p.responsavelId === r.id), ...DADOS.transferencias.filter(t => t.responsavelId === r.id)];
  const abertos = peds.filter(p => !/confirmada|Concluída|Indeferida|Recusada|Encaminhada|Cancelada/.test(p.status));
  const prox = DADOS.eventos.filter(e => e.data >= TODAY_ISO).sort((a, b) => a.data.localeCompare(b.data))[0];
  return pageHead(`Olá, ${firstName(r.nome)}.`, 'Acompanhe seus filhos, encontre vagas nas escolas da rede e faça a matrícula pela internet.', `<button class="btn outline" data-act="go" data-route="vagas">${icon('search')}Procurar vagas</button><button class="btn primary" data-act="go" data-route="matricula">${icon('plus')}Pedir matrícula</button>`, 'hello') +
    `<section class="stats" aria-label="Resumo">
      ${statCard('peach', 'Filhos na rede', fs.length, fs.length ? fs.map(a => firstName(a.nome)).join(', ') : 'Nenhum matriculado ainda', fs.length ? 'boletim' : 'matricula')}
      ${statCard('rose', 'Pedidos em andamento', abertos.length, 'Matrículas e transferências', 'pedidos')}
      ${statCard('mint', 'Vagas livres na rede', DADOS.vagas.reduce((s, v) => s + disp(v), 0), `em ${uniq(DADOS.vagas.filter(v => disp(v) > 0).map(v => v.escolaId)).length} escolas`, 'vagas')}
      ${statCard('peri', 'Próximo evento', prox ? fmtD(prox.data).slice(0, 5) : '—', prox ? esc(prox.titulo) : 'Nada marcado', 'calendario')}
    </section>
    ${hrowOpen('painel-resp')}
      ${fs.map(a => `<section class="card c4" aria-labelledby="fi-${a.id}"><div class="row"><span class="avatar lg" aria-hidden="true">${initials(a.nome)}</span><div><h2 id="fi-${a.id}">${esc(a.nome)}</h2><p class="muted">${esc(turmaLong(a.turmaId))}</p></div></div><dl class="dl"><dt>Média geral</dt><dd>${num(mediaGeral(a.id))}</dd><dt>Faltas</dt><dd>${freqInfo(a.id).faltas}</dd><dt>Situação</dt><dd>${sitHTML(mediaGeral(a.id))}</dd></dl><div class="row"><button class="btn outline sm" data-act="filho-bol" data-id="${a.id}" aria-label="Ver boletim de ${esc(a.nome)}">Ver boletim</button></div></section>`).join('')}
      <section class="card c4" aria-labelledby="ped-h"><div class="card-h"><h2 id="ped-h">Seus pedidos</h2><button class="btn ghost sm" data-act="go" data-route="pedidos">Ver todos</button></div>${peds.length ? `<ul class="list">${peds.map(p => `<li><span class="grow"><span class="t">${esc(p.estudante || p.alunoNome || alunoNome(p.alunoId))}</span><br><span class="m">${p.protocolo ? 'Matrícula, ' + esc(p.protocolo) : 'Transferência para ' + esc(escNome(p.destinoId))}</span><br>${pedHTML(p.status)}</span></li>`).join('')}</ul>` : '<p class="empty">Você ainda não fez pedidos.</p>'}</section>
      <section class="card c4" aria-labelledby="mh-h"><div class="card-h"><h2 id="mh-h">Merenda de hoje</h2><button class="btn ghost sm" data-act="go" data-route="merenda">Semana</button></div><p>${esc(DADOS.cardapio[TODAY.getDay()] || 'Sem aulas hoje.')}</p></section>
      <section class="card c4" aria-labelledby="rc-h"><div class="card-h"><h2 id="rc-h">Comunicados</h2><button class="btn ghost sm" data-act="go" data-route="comunicados">Ver todos</button></div><ul class="list">${visibleCom().sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3).map(c => `<li><span class="grow"><span class="t">${esc(c.titulo)}</span><br><span class="m">${esc(c.autor)}, ${fmtD(c.data)}</span></span></li>`).join('')}</ul></section>
    </div>`;
}
function rVagas() {
  const s = UI.sel.vs ?? '1º ano — Ensino médio', t = UI.sel.vt || '', b = UI.sel.vb || '';
  const offers = DADOS.vagas.filter(v => (!s || v.serie === s) && (!t || v.turno === t) && (!b || byId('escolas', v.escolaId)?.bairro === b));
  const escolas = uniq(offers.map(v => v.escolaId)).map(id => byId('escolas', id)).sort((x, y) => offers.filter(v => v.escolaId === y.id).reduce((n, v) => n + disp(v), 0) - offers.filter(v => v.escolaId === x.id).reduce((n, v) => n + disp(v), 0));
  const total = offers.reduce((n, v) => n + disp(v), 0);
  return pageHead('Vagas na rede', 'Veja quais escolas públicas têm vagas para a série do seu filho. As vagas são atualizadas pelas próprias escolas.') +
    `<div class="toolbar">${selectCtl('vs-serie', 'Série', [['', 'Todas'], ...serieOpts()], s, 'vsSerie')}${selectCtl('vs-turno', 'Turno', [['', 'Todos'], ...nomes('turnos').map(x => [x, x])], t, 'vsTurno')}${selectCtl('vs-bairro', 'Bairro', [['', 'Todos'], ...uniq(DADOS.escolas.map(e => e.bairro).filter(Boolean)).sort().map(x => [x, x])], b, 'vsBairro')}</div>
    <p aria-live="polite" class="muted">${escolas.length} escola${escolas.length === 1 ? '' : 's'} encontrada${escolas.length === 1 ? '' : 's'}, ${total} vaga${total === 1 ? '' : 's'} livre${total === 1 ? '' : 's'}.</p>
    ${escolas.length ? `<div class="grid g2">${escolas.map(e => `<article class="card" aria-labelledby="es-${e.id}"><div><h2 id="es-${e.id}">${esc(e.nome)}</h2><p class="muted">${icon('pin')} ${esc(enderecoTxt(e))}, ${esc(regionalService.nomeMunicipio(e.municipioId) || e.cidade || '')}. Telefone ${esc(e.telefone || '—')}</p></div>
      <p class="caption">${infraestruturaService.recursosSync(e.id).length ? 'Acessibilidade: ' + esc(infraestruturaService.recursosSync(e.id).join(', ')) : 'A escola não informou recursos de acessibilidade.'}</p>
      <ul class="list">${offers.filter(v => v.escolaId === e.id).map(v => { const n = disp(v); return `<li><span class="grow"><span class="t">${esc(v.serie)}</span><br><span class="m">Turno: ${esc(v.turno.toLowerCase())}</span></span>${vagasHTML(n)}<button class="btn ${n ? 'primary' : 'outline'} sm" data-act="pm-start" data-escola="${e.id}" data-serie="${esc(v.serie)}" data-turno="${esc(v.turno)}" aria-label="${n ? 'Pedir matrícula' : 'Entrar na lista de espera'}: ${esc(e.nome)}, ${esc(v.serie)}, ${esc(v.turno)}">${n ? 'Pedir matrícula' : 'Lista de espera'}</button></li>`; }).join('')}</ul>
      <p class="caption">Vagas atualizadas em ${e.ultimaSync ? fmtHora(e.ultimaSync) : '—'}</p></article>`).join('')}</div>` : '<p class="empty">Nenhuma escola oferece essa combinação. Tente outro turno ou bairro.</p>'}`;
}
function rMatricula() {
  const r = me(); const pre = UI.sel.pm || {};
  const eOpts = (pre.serie && pre.turno) ? vagaOpts(pre.serie, pre.turno).map(([vid, l]) => [byId('vagas', vid).escolaId, l]) : [];
  const docInput = (d, i) => `<div class="field"><label for="pm-doc-${i}">${d}</label><input id="pm-doc-${i}" type="file" accept=".pdf,image/*"></div>`;
  return pageHead('Matrícula online', 'Peça a matrícula na rede pública em quatro partes. Você recebe um número de protocolo e acompanha o pedido em Meus pedidos.') +
    `<form class="card" data-form="prematricula" novalidate aria-labelledby="mf-h" style="max-width:52rem"><h2 id="mf-h" class="sr-only">Formulário de matrícula</h2>
      <fieldset class="grid" style="gap:1rem"><legend><h3>1. Estudante</h3></legend><div class="form-grid">
        <div class="field wide"><label for="pm-nome">Nome completo do estudante <span class="req" aria-hidden="true">*</span></label><input id="pm-nome" required autocomplete="off"></div>
        <div class="field"><label for="pm-nasc">Data de nascimento <span class="req" aria-hidden="true">*</span></label><input id="pm-nasc" type="date" required></div>
        <div class="field"><label for="pm-acess">Necessidade de acessibilidade</label><select id="pm-acess">${nomes('necessidades').map(a => `<option>${a}</option>`).join('')}</select><p class="help">A escola usa essa informação para preparar o atendimento.</p></div>
      </div></fieldset>
      <fieldset class="grid" style="gap:1rem"><legend><h3>2. Escola</h3></legend><div class="form-grid">
        <div class="field"><label for="pm-serie">Série <span class="req" aria-hidden="true">*</span></label><select id="pm-serie" required data-change="pmOpts">${optHTML(serieOpts(), pre.serie)}</select></div>
        <div class="field"><label for="pm-turno">Turno <span class="req" aria-hidden="true">*</span></label><select id="pm-turno" required data-change="pmOpts">${optHTML(nomes('turnos').map(x => [x, x]), pre.turno)}</select></div>
        <div class="field wide"><label for="pm-e1">Escola de 1ª opção <span class="req" aria-hidden="true">*</span></label><select id="pm-e1" required>${eOpts.length ? optHTML(eOpts, pre.escolaId) : '<option value="">Escolha a série e o turno</option>'}</select><p class="help">Se a escola não tiver vaga, o pedido entra na lista de espera.</p></div>
        <div class="field wide"><label for="pm-e2">Escola de 2ª opção</label><select id="pm-e2">${eOpts.length ? optHTML(eOpts, '', 'Sem segunda opção') : '<option value="">Escolha a série e o turno</option>'}</select></div>
      </div></fieldset>
      <fieldset class="grid" style="gap:1rem"><legend><h3>3. Responsável</h3></legend><div class="form-grid">
        <div class="field"><label for="pm-resp">Nome do responsável <span class="req" aria-hidden="true">*</span></label><input id="pm-resp" required value="${esc(r.nome)}" autocomplete="name"></div>
        <div class="field"><label for="pm-tel">Telefone <span class="req" aria-hidden="true">*</span></label><input id="pm-tel" type="tel" required value="${esc(r.telefone || '')}" autocomplete="tel"></div>
        <div class="field"><label for="pm-bairro">Bairro onde mora <span class="req" aria-hidden="true">*</span></label><input id="pm-bairro" required value="${esc(r.bairro || '')}"></div>
      </div></fieldset>
      <fieldset class="grid" style="gap:1rem"><legend><h3>4. Documentos</h3></legend><p class="muted">Envie foto ou PDF. Você pode mandar depois, mas a matrícula só é confirmada com todos.</p><div class="form-grid">${nomes('documentosMatricula').map(docInput).join('')}</div></fieldset>
      <label class="check" style="align-self:flex-start"><input type="checkbox" id="pm-decl"> Declaro que as informações são verdadeiras.</label>
      <div class="row"><button class="btn primary" type="submit">${icon('send')}Enviar pedido de matrícula</button></div>
    </form>`;
}
function rTransferencia() {
  const fs = filhos();
  if (!fs.length) return pageHead('Pedir transferência', 'Para pedir transferência, seu filho precisa estar matriculado na rede.') + `<p class="empty">Nenhum filho matriculado. <button class="btn primary sm" data-act="go" data-route="matricula">Pedir matrícula</button></p>`;
  return pageHead('Pedir transferência', 'Escolha a escola de destino entre as que têm vaga. A escola atual libera o pedido e a nova escola confirma.') +
    `<form class="card" data-form="transf-resp" novalidate aria-labelledby="tf-h" style="max-width:48rem"><h2 id="tf-h" class="sr-only">Pedido de transferência</h2><div class="form-grid">
      <div class="field wide"><label for="tr-aluno">Filho <span class="req" aria-hidden="true">*</span></label><select id="tr-aluno" required data-change="trAluno">${optHTML(fs.map(a => [a.id, `${a.nome}, ${turmaLong(a.turmaId)}`]), fs.length === 1 ? fs[0].id : '')}</select></div>
      <div class="field wide"><label for="tr-dest">Escola de destino <span class="req" aria-hidden="true">*</span></label><select id="tr-dest" required>${fs.length === 1 ? optHTML(vagaOpts(serieDe(fs[0]), '', escolaDe(fs[0])), '') : '<option value="">Escolha o filho primeiro</option>'}</select><p class="help">Escolas sem vaga aparecem desativadas.</p></div>
      ${motivoTransfHTML()}
    </div><div class="row"><button class="btn primary" type="submit">${icon('send')}Enviar pedido</button></div></form>`;
}
function rPedidos() {
  const r = me();
  const pms = DADOS.prematriculas.filter(p => p.responsavelId === r.id).sort((a, b) => b.data.localeCompare(a.data));
  const trs = DADOS.transferencias.filter(t => t.responsavelId === r.id).sort((a, b) => b.data.localeCompare(a.data));
  const steps = (s, fim) => { const done = s !== 'Em análise' && !s.startsWith('Aguardando'); return `<ol class="steps"><li class="done">Pedido enviado</li><li class="${done ? 'done' : 'cur'}">${fim === 'tr' && s === 'Aguardando escola de origem' ? 'Escola atual analisando' : fim === 'tr' && s === 'Aguardando escola de destino' ? 'Nova escola analisando' : 'Em análise'}</li><li class="${done ? 'cur' : ''}">${done ? esc(s) : 'Resultado'}</li></ol>`; };
  return pageHead('Meus pedidos', 'Acompanhe os pedidos de matrícula e de transferência.') +
    `<section aria-labelledby="pm-h" class="grid"><h2 id="pm-h">Matrículas</h2>${pms.length ? `<div class="grid g2">${pms.map(p => `<article class="post" aria-labelledby="p-${p.id}"><div class="row sp"><h3 id="p-${p.id}">${esc(p.estudante)}</h3>${pedHTML(p.status)}</div><p class="meta">Protocolo ${esc(p.protocolo)}, enviado em ${fmtD(p.data)}</p>${steps(p.status)}${botaoCancelar(p)}<dl class="dl"><dt>Série</dt><dd>${esc(p.serie)}, ${esc(p.turno.toLowerCase())}</dd><dt>Escola</dt><dd>${esc(escNome(p.escolaId))}</dd><dt>Documentos</dt><dd>${p.docs.length} de ${nomes('documentosMatricula').length} enviados</dd>${p.status === 'Lista de espera' ? `<dt>Lista de espera</dt><dd>${posEspera(p)}º lugar</dd>` : ''}</dl>${p.obs ? `<p class="quote"><b>Mensagem da escola:</b> ${esc(p.obs)}</p>` : ''}</article>`).join('')}</div>` : '<p class="empty">Nenhum pedido de matrícula. <button class="btn primary sm" data-act="go" data-route="matricula">Pedir matrícula</button></p>'}</section>
    <section aria-labelledby="tp-h" class="grid"><h2 id="tp-h">Transferências</h2>${trs.length ? `<div class="grid g2">${trs.map(t => `<article class="post" aria-labelledby="t-${t.id}"><div class="row sp"><h3 id="t-${t.id}">${esc(t.alunoNome || alunoNome(t.alunoId))}</h3>${pedHTML(t.status)}</div><p class="meta">Pedido em ${fmtD(t.data)}</p>${steps(t.status, 'tr')}<dl class="dl"><dt>De</dt><dd>${esc(escNome(t.origemId))}</dd><dt>Para</dt><dd>${esc(escNome(t.destinoId))}, ${esc(t.turno.toLowerCase())}</dd></dl>${t.resposta ? `<p class="quote"><b>Resposta:</b> ${esc(t.resposta)}</p>` : ''}</article>`).join('')}</div>` : '<p class="empty">Nenhum pedido de transferência.</p>'}</section>`;
}
function rBoletim() {
  const fs = filhos(); if (!fs.length) return pageHead('Boletim dos filhos', 'Nenhum filho matriculado na rede ainda.');
  if (!fs.find(a => a.id === UI.sel.filho)) UI.sel.filho = fs[0].id;
  const a = byId('alunos', UI.sel.filho);
  return pageHead('Boletim dos filhos', `${esc(turmaLong(a.turmaId))}. Média mínima ${num(DADOS.config.mediaMin)}.`, `<button class="btn outline" data-act="speak" data-text="${esc(boletimFala(a.id))}">${icon('volume')}Ouvir boletim</button>`) +
    (fs.length > 1 ? `<div class="toolbar">${selectCtl('filho-sel', 'Filho', fs.map(x => [x.id, x.nome]), a.id, 'filho')}</div>` : '') +
    `<div class="grid g2"><section class="card" aria-labelledby="bp-h"><h2 id="bp-h">Desempenho de ${esc(firstName(a.nome))}</h2>${perfChart(a.id)}</section><section class="card" aria-labelledby="bd-h"><h2 id="bd-h">Média por disciplina</h2>${bars(discsDaTurma(a.turmaId).map(d => [discNome(d), mediaDisc(a.id, d)]), 10, v => num(v), DADOS.config.mediaMin)}</section></div>` +
    boletimTable(a.id, `Boletim de ${a.nome}`);
}
ACT['filho-bol'] = el => { UI.sel.filho = el.dataset.id; go('boletim'); };

// ---------- Rotas ----------
Object.assign(PAGES.gestao, {
  vagas: gVagas, prematriculas: gPrematriculas, transferencias: gTransferencias, integracoes: gIntegracoes,
  aee: gAEE, buscaativa: gBuscaAtiva, merenda: gMerenda, transporte: () => crudPage('rotas')
});
PAGES.aluno.merenda = () => pageHead('Merenda', 'Cardápio da semana na sua escola.') + `<section class="card">${merendaSemana(me().restricao ? `Sua refeição é adaptada: ${esc(me().restricao)}.` : '')}</section>`;
PAGES.responsavel = {
  inicio: rInicio, vagas: rVagas, matricula: rMatricula, transferencia: rTransferencia, pedidos: rPedidos, boletim: rBoletim,
  merenda: () => pageHead('Merenda', 'Cardápio da semana nas escolas da rede.') + `<section class="card">${merendaSemana(filhos().filter(a => a.restricao).map(a => `${esc(firstName(a.nome))} recebe refeição adaptada: ${esc(a.restricao)}.`).join(' '))}</section>`,
  calendario: () => pageHead('Calendário escolar', 'Provas, reuniões, feriados e eventos da escola.') + calendarView(false),
  comunicados: () => pageHead('Comunicados', 'Avisos da escola para as famílias.') + feed(visibleCom())
};

