/* Matrícula: cadastro básico do estudante em etapas e solicitação de vaga, com reserva e fila de espera. */
'use strict';

const MT_ETAPAS = [['Estudante', 'mt1'], ['Documentos', 'mt2'], ['Acesso', 'mt3']];
const campoMt = (id, l, at = '', req = false, ajuda = '') => `<div class="field"><label for="${id}">${l}${req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label><input id="${id}" ${req ? 'required' : ''} ${at}>${ajuda ? `<p class="help">${ajuda}</p>` : ''}</div>`;
const selMt = (id, l, opts, req = false) => `<div class="field"><label for="${id}">${l}${req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label><select id="${id}" ${req ? 'required' : ''}><option value="">Selecione…</option>${opts.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}">${esc(t)}</option>`; }).join('')}</select></div>`;
function telaMatricula() {
  const r = me(); const meus = DADOS.estudantes.filter(e => e.responsavelId === r.id);
  return pageHead('Matrícula online', 'Primeiro cadastre o estudante. Depois escolha a escola e a série em Vagas na rede.') +
    (meus.length ? `<section class="card" aria-labelledby="ec-h"><h2 id="ec-h">Estudantes cadastrados</h2><ul class="list">${meus.map(e => `<li><span class="grow"><span class="t">${esc(e.nome)}</span><br><span class="m">Nascimento ${fmtD(e.nascimento)}, termo de vacinação ${esc(e.termoVacinacao.toLowerCase())}</span></span><button class="btn outline sm" data-act="go" data-route="vagas">Solicitar vaga</button></li>`).join('')}</ul></section>` : '') +
    `<form class="card" data-form="estudante" id="mt-form" novalidate aria-labelledby="mt-h" style="max-width:52rem"><h2 id="mt-h">Cadastro básico</h2>
      <ol class="steps" aria-label="Etapas">${MT_ETAPAS.map(([l, id], i) => `<li data-passo="${id}" class="${i ? '' : 'cur'}">${l}</li>`).join('')}</ol>
      <p class="caption">Campos com <span class="req">*</span> são obrigatórios.</p>
      <section id="mt1" class="form-grid" aria-label="Estudante">
        <div class="wide" style="grid-column:1/-1">${campoMt('mt-nome', 'Nome completo (sem abreviações)', 'autocomplete="off"', true)}</div>
        ${campoMt('mt-nasc', 'Data de nascimento', `type="date" max="${TODAY_ISO}"`, true)}${selMt('mt-sexo', 'Sexo', nomes('sexos'), true)}
        <div class="wide" style="grid-column:1/-1">${campoMt('mt-fil', 'Filiação 01 (nome completo da mãe ou do responsável legal)', '', true)}</div>
        ${selMt('mt-cor', 'Cor/Raça', nomes('coresRacas'), true)}${selMt('mt-bf', 'Recebe Bolsa Família?', ['Sim', 'Não'], true)}${selMt('mt-nec', 'Necessidade de acessibilidade', nomes('necessidades'))}
        <div class="field"><span class="lbl">Termo de vacinação <span class="req" aria-hidden="true">*</span></span><div class="row"><span id="mt-termo" class="st err" aria-live="polite">Não assinado</span><button type="button" class="btn outline sm" data-act="mt-assinar">Assinar</button></div></div>
      </section>
      <section id="mt2" class="form-grid aba-oculta" aria-label="Documentos">
        ${campoMt('mt-cpf', 'CPF do estudante', 'inputmode="numeric" maxlength="14" placeholder="000.000.000-00"', true)}${campoMt('mt-nis', 'NIS do estudante', 'inputmode="numeric" maxlength="11"')}${campoMt('mt-sus', 'Cartão SUS', 'inputmode="numeric" maxlength="15"')}
        ${campoMt('mt-rg', 'RG')}${selMt('mt-org', 'Órgão emissor', nomes('orgaosEmissores'))}${selMt('mt-uf', 'UF', UFS_BR)}${campoMt('mt-rgd', 'Data de emissão', `type="date" max="${TODAY_ISO}"`)}
      </section>
      <section id="mt3" class="form-grid aba-oculta" aria-label="Acesso">
        <div style="grid-column:1/-1">${campoMt('mt-email', 'E-mail (para recuperação de senha)', 'type="email" autocomplete="email"', true)}</div>
        ${campoMt('mt-s1', 'Senha', 'type="password" autocomplete="new-password" minlength="8"', true, 'Pelo menos 8 caracteres.')}${campoMt('mt-s2', 'Repetir senha', 'type="password" autocomplete="new-password"', true)}
      </section>
      <div class="row"><button type="button" class="btn ghost" id="mt-volta" data-act="mt-passo" data-d="-1" hidden>Voltar</button><button type="button" class="btn primary" id="mt-prox" data-act="mt-passo" data-d="1">Continuar</button><button type="submit" class="btn primary" id="mt-fim" hidden>${icon('check')}Salvar cadastro</button></div>
    </form>`;
}
let mtPasso = 0;
const mtMostrar = n => { mtPasso = n; MT_ETAPAS.forEach(([, id], i) => { $('#' + id).classList.toggle('aba-oculta', i !== n); $(`[data-passo="${id}"]`).className = i < n ? 'done' : i === n ? 'cur' : ''; }); $('#mt-volta').hidden = n === 0; $('#mt-prox').hidden = n === MT_ETAPAS.length - 1; $('#mt-fim').hidden = n !== MT_ETAPAS.length - 1; $('#' + MT_ETAPAS[n][1]).querySelector('input,select')?.focus(); };
const mtErro = (id, msg) => { toast(msg, 'err'); alertSR(msg); const el = $('#' + id); el?.setAttribute('aria-invalid', 'true'); el?.focus(); return false; };
function mtValidar(n) {
  if (!validate($('#' + MT_ETAPAS[n][1]))) return false;
  if (n === 0) {
    if ($('#mt-nome').value.trim().split(/\s+/).length < 2) return mtErro('mt-nome', 'Informe o nome completo, sem abreviações.');
    if ($('#mt-nasc').value >= TODAY_ISO) return mtErro('mt-nasc', 'A data de nascimento precisa ser anterior a hoje.');
    if ($('#mt-termo').textContent !== 'Assinado') return mtErro('', 'Assine o termo de vacinação para continuar.');
  }
  if (n === 1 && !cpfValido($('#mt-cpf').value)) return mtErro('mt-cpf', 'O CPF não é válido. Confira os 11 números.');
  if (n === 2) {
    if ($('#mt-s1').value.length < 8) return mtErro('mt-s1', 'A senha precisa de pelo menos 8 caracteres.');
    if ($('#mt-s1').value !== $('#mt-s2').value) return mtErro('mt-s2', 'As senhas não são iguais.');
  }
  return true;
}
ACT['mt-passo'] = el => { const d = Number(el.dataset.d); if (d > 0 && !mtValidar(mtPasso)) return; mtMostrar(mtPasso + d); };
ACT['mt-assinar'] = () => { const t = $('#mt-termo'); t.textContent = 'Assinado'; t.className = 'st ok'; };
FORMS.estudante = () => {
  if (!mtValidar(2)) return;
  const g = id => $('#' + id).value.trim();
  // A senha só é conferida: o mock não guarda senhas. O back-end real cuida de autenticação.
  estudanteService.salvar(Modelos.estudante({ responsavelId: SESSION.userId, nome: g('mt-nome'), nascimento: g('mt-nasc'), sexo: g('mt-sexo'), filiacao: g('mt-fil'), cpf: g('mt-cpf'), nis: g('mt-nis'), cartaoSUS: g('mt-sus'), corRaca: g('mt-cor'), bolsaFamilia: g('mt-bf'), termoVacinacao: $('#mt-termo').textContent, rg: g('mt-rg'), rgOrgao: g('mt-org'), rgUF: g('mt-uf'), rgEmissao: g('mt-rgd'), email: g('mt-email'), telefone: me().telefone, necessidade: g('mt-nec') }))
    .then(e => { mtPasso = 0; go('vagas'); toast(`${e.nome} cadastrado. Agora escolha a escola e a série.`); }).catch(e => { toast(e.message, 'err'); alertSR(e.message); });
};
// Solicitar vaga a partir de Vagas na rede
ACT['pm-start'] = el => {
  const meus = DADOS.estudantes.filter(e => e.responsavelId === SESSION.userId); const { escola, serie, turno } = el.dataset;
  if (!meus.length) { toast('Cadastre o estudante primeiro.', 'info'); go('matricula'); return; }
  openDialog({ title: 'Solicitar vaga', body: `<dl class="dl"><dt>Escola</dt><dd>${esc(escNome(escola))}</dd><dt>Série</dt><dd>${esc(serie)}</dd><dt>Turno</dt><dd>${esc(turno)}</dd></dl><div class="field"><label for="sv-est">Estudante <span class="req" aria-hidden="true">*</span></label><select id="sv-est" required>${meus.length > 1 ? '<option value="">Selecione…</option>' : ''}${meus.map(e => `<option value="${e.id}">${esc(e.nome)}</option>`).join('')}</select></div><p class="muted">Se houver vaga, ela é reservada na hora. Se não houver, o estudante entra na fila de espera desta escola e série. Você pode cancelar quando quiser e entrar em outras filas.</p>`,
    foot: `<button type="button" class="btn ghost" data-act="close-dlg">Cancelar</button><button type="submit" class="btn primary">${icon('send')}Solicitar vaga</button>`,
    onSubmit: () => { matriculaService.solicitar({ estudanteId: $('#sv-est').value, escolaId: escola, serie, turno, responsavelId: SESSION.userId }).then(async p => { closeDialog(); await go('pedidos'); toast(p.status === 'Vaga reservada' ? `Vaga reservada. Protocolo ${p.protocolo}.` : `Sem vagas: entrou na fila de espera. Protocolo ${p.protocolo}.`); }).catch(e => { toast(e.message, 'err'); alertSR(e.message); }); return false; } });
};
const botaoCancelar = p => ['Vaga reservada', 'Lista de espera', 'Em análise', 'Documentos pendentes'].includes(p.status) ? `<div class="row"><button class="btn outline sm" data-act="pm-cancelar" data-id="${p.id}" aria-label="Cancelar solicitação de ${esc(p.estudante)}">Cancelar solicitação</button></div>` : '';
ACT['pm-cancelar'] = el => confirmBox('Cancelar solicitação', 'Cancelar esta solicitação? Se a vaga estava reservada, ela vai para o primeiro da fila.', () => matriculaService.cancelar(el.dataset.id).then(() => { rerender(); toast('Solicitação cancelada.'); }), 'Cancelar solicitação');
PAGES.responsavel.matricula = telaMatricula;
