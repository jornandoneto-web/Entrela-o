/* Tela: cadastro de professor (Etapa 5), em três abas que montam o objeto Professor:
   Dados pessoais (Pessoa), Dependentes (Dependente[]) e Vínculos (Vinculo[]). A lotação fica em Gerir lotações. */
'use strict';

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const opt = (lista, v, ph = 'Selecione…') => `<option value="">${ph}</option>` + lista.map(x => { const [val, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(val)}" ${String(val) === String(v ?? '') ? 'selected' : ''}>${esc(l)}</option>`; }).join('');
let seqLinha = 0;

// ---------- Linhas repetíveis ----------
function linhaDependente(d = Modelos.dependente()) {
  const i = ++seqLinha;
  return `<fieldset class="dep-linha form-grid" data-id="${esc(d.id)}"><legend class="sr-only">Dependente</legend>
    <div class="field"><label for="dp${i}-n">Nome <span class="req" aria-hidden="true">*</span></label><input id="dp${i}-n" data-k="nome" value="${esc(d.nome)}" required></div>
    <div class="field"><label for="dp${i}-p">Parentesco <span class="req" aria-hidden="true">*</span></label><select id="dp${i}-p" data-k="parentesco" required>${opt(['Filho(a)', 'Enteado(a)', 'Cônjuge', 'Pai ou mãe', 'Outro'], d.parentesco)}</select></div>
    <div class="field"><label for="dp${i}-d">Data de nascimento</label><input id="dp${i}-d" type="date" data-k="nascimento" value="${esc(d.nascimento)}"></div>
    <div class="field" style="justify-content:flex-end"><button type="button" class="btn ghost sm" data-act="dep-rem" aria-label="Remover este dependente">${icon('trash')}Remover</button></div></fieldset>`;
}
function linhaVinculo(v = Modelos.vinculo(), n = 1) {
  const i = ++seqLinha;
  const hab = uniq(v.formacoes.flatMap(f => DADOS.formacoes.find(x => x.id === f)?.disciplinas || []));
  return `<fieldset class="vinc card" data-id="${esc(v.id)}" style="padding:1.25rem"><legend class="lbl" style="padding:0 .25rem">Vínculo ${n}</legend>
    <div class="form-grid">
      <div class="field"><label for="vc${i}-cargo">Cargo <span class="req" aria-hidden="true">*</span></label><input id="vc${i}-cargo" data-k="cargo" value="${esc(v.cargo)}" required></div>
      <div class="field"><label for="vc${i}-ing">Forma de ingresso <span class="req" aria-hidden="true">*</span></label><select id="vc${i}-ing" data-k="ingresso" required>${opt(['Concurso', 'Contrato', 'Cedido', 'Seleção simplificada'], v.ingresso)}</select></div>
      <div class="field"><label for="vc${i}-org">Órgão de origem (se cedido)</label><input id="vc${i}-org" data-k="orgaoOrigem" value="${esc(v.orgaoOrigem)}" placeholder="Ex.: Prefeitura de Aracaju"></div>
      <div class="field"><label for="vc${i}-ch">Carga horária semanal (h) <span class="req" aria-hidden="true">*</span></label><input id="vc${i}-ch" data-k="cargaHoraria" type="number" min="1" max="60" list="ch-padrao" value="${v.cargaHoraria}" required><p class="help">Padrão 25 h; integral 40 h.</p></div>
      <div class="field"><label for="vc${i}-ini">Data de início <span class="req" aria-hidden="true">*</span></label><input id="vc${i}-ini" type="date" data-k="dataInicio" value="${esc(v.dataInicio)}" required></div>
      <div class="field"><label for="vc${i}-fim">Data de fim (opcional)</label><input id="vc${i}-fim" type="date" data-k="dataFim" value="${esc(v.dataFim)}"></div>
    </div>
    <fieldset class="field wide"><legend>Formações <span class="req" aria-hidden="true">*</span></legend><div class="checks">${DADOS.formacoes.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map(f => `<label class="check"><input type="checkbox" data-k="formacoes" value="${f.id}" data-change="vincForm" ${v.formacoes.includes(f.id) ? 'checked' : ''}>${esc(f.nome)}</label>`).join('')}</div></fieldset>
    <fieldset class="field wide"><legend>Disciplinas que leciona</legend><div class="checks">${DADOS.disciplinas.map(d => `<label class="check"><input type="checkbox" data-k="disciplinas" value="${d.id}" ${v.disciplinas.includes(d.id) ? 'checked' : ''} ${hab.includes(d.id) ? '' : 'disabled'}>${esc(d.nome)}</label>`).join('')}</div><p class="help">Só ficam disponíveis as disciplinas habilitadas pelas formações marcadas.</p></fieldset>
    <div class="row" style="align-items:flex-end;justify-content:space-between"><div class="field" style="flex:1 1 16rem"><label for="vc${i}-anx">Anexo do contrato</label><input id="vc${i}-anx" type="file" data-k="anexo" accept=".pdf,image/*"><p class="help" data-anexo="${esc(v.anexoContrato)}">${v.anexoContrato ? 'Arquivo atual: ' + esc(v.anexoContrato) : 'PDF ou imagem do contrato ou portaria.'}</p></div>
      <button type="button" class="btn ghost sm" data-act="vinc-rem" aria-label="Remover vínculo ${n}">${icon('trash')}Remover vínculo</button></div>
  </fieldset>`;
}
CHG.vincForm = el => {
  const fs = el.closest('.vinc'); const marc = $$('[data-k="formacoes"]:checked', fs).map(x => x.value);
  const hab = uniq(marc.flatMap(f => DADOS.formacoes.find(x => x.id === f)?.disciplinas || []));
  $$('[data-k="disciplinas"]', fs).forEach(c => { c.disabled = !hab.includes(c.value); if (c.disabled) c.checked = false; });
};
const renumerarVinculos = () => $$('#vincs .vinc').forEach((f, k) => { f.querySelector('legend').textContent = `Vínculo ${k + 1}`; });
ACT['dep-add'] = () => { $('#deps').insertAdjacentHTML('beforeend', linhaDependente()); $('#deps .dep-linha:last-child input').focus(); $('#deps-vazio').hidden = true; };
ACT['dep-rem'] = el => { el.closest('.dep-linha').remove(); $('#deps-vazio').hidden = !!$('#deps .dep-linha'); };
ACT['vinc-add'] = () => { $('#vincs').insertAdjacentHTML('beforeend', linhaVinculo(Modelos.vinculo({ dataInicio: TODAY_ISO }), $$('#vincs .vinc').length + 1)); $('#vincs .vinc:last-child input').focus(); };
ACT['vinc-rem'] = el => {
  const fs = el.closest('.vinc');
  if ((DADOS.lotacoes || []).some(l => l.vinculoId === fs.dataset.id && lotacaoAtiva(l))) { toast('Este vínculo tem lotação ativa. Encerre a lotação em Gerir lotações antes.', 'err'); return; }
  if ($$('#vincs .vinc').length === 1) { toast('O professor precisa de pelo menos um vínculo.', 'err'); return; }
  fs.remove(); renumerarVinculos();
};
// Abas acessíveis (setas do teclado trocam de aba)
ACT.aba = el => {
  const lista = el.closest('[role=tablist]');
  $$('[role=tab]', lista).forEach(t => { const on = t === el; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls')).classList.toggle('aba-oculta', !on); });
};
document.addEventListener('keydown', e => {
  const t = e.target.closest?.('[role=tab]'); if (!t || !['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
  const tabs = $$('[role=tab]', t.closest('[role=tablist]')); const n = (tabs.indexOf(t) + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[n].focus(); ACT.aba(tabs[n]); e.preventDefault();
});
const abrirAba = nome => { const t = $(`#tab-${nome}`); if (t) ACT.aba(t); };

// ---------- Formulário ----------
async function abrirProfessor(id) {
  const p = id ? await professorService.buscarPorId(id) : Modelos.professor({ vinculos: [Modelos.vinculo({ dataInicio: TODAY_ISO })] });
  const pe = p.pessoa; const d = pe.endereco;
  const c = (fid, l, v, at = '', req = false) => `<div class="field"><label for="${fid}">${l}${req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label><input id="${fid}" value="${esc(v)}" ${req ? 'required' : ''} ${at}></div>`;
  const aba = (k, l, on) => `<button type="button" role="tab" id="tab-${k}" aria-controls="pan-${k}" aria-selected="${on}" tabindex="${on ? 0 : -1}" data-act="aba">${l}</button>`;
  openDialog({
    title: id ? `Professor: ${pe.nome}` : 'Novo professor', wide: true,
    body: `<datalist id="ch-padrao"><option value="25"><option value="40"></datalist>
      <div role="tablist" class="abas" aria-label="Partes do cadastro">${aba('pes', 'Dados pessoais', true)}${aba('dep', `Dependentes (${p.dependentes.length})`, false)}${aba('vin', `Vínculos (${p.vinculos.length})`, false)}</div>
      <div role="tabpanel" id="pan-pes" aria-labelledby="tab-pes" class="aba-painel">
        <p class="caption">Dados enviados a órgãos como a Receita Federal. Campos com <span class="req">*</span> são obrigatórios.</p>
        <div class="form-grid">${c('pf-nome', 'Nome completo', pe.nome, 'autocomplete="off"', true)}${c('pf-cpf', 'CPF', formatarCPF(pe.cpf), 'inputmode="numeric" maxlength="14" placeholder="000.000.000-00"', true)}${c('pf-nasc', 'Data de nascimento', pe.nascimento, 'type="date"', true)}
          <div class="field"><label for="pf-sexo">Sexo</label><select id="pf-sexo">${opt(['Feminino', 'Masculino', 'Prefiro não informar'], pe.sexo)}</select></div>
          <div class="field"><label for="pf-civil">Estado civil</label><select id="pf-civil">${opt(['Solteiro(a)', 'Casado(a)', 'União estável', 'Divorciado(a)', 'Viúvo(a)'], pe.estadoCivil)}</select></div>
          ${c('pf-tel1', 'Telefone principal', pe.telefones[0] || '', 'type="tel"')}${c('pf-tel2', 'Outro telefone', pe.telefones[1] || '', 'type="tel"')}${c('pf-email', 'E-mail', pe.email, 'type="email"')}
          ${c('pf-nat-cid', 'Naturalidade: cidade', pe.naturalidade.cidade)}<div class="field"><label for="pf-nat-uf">Naturalidade: UF</label><select id="pf-nat-uf">${opt(UFS, pe.naturalidade.uf)}</select></div></div>
        <fieldset class="form-grid" style="margin-top:1rem"><legend class="lbl">Endereço</legend>${c('pf-cep', 'CEP', d.cep, 'inputmode="numeric" maxlength="9"')}${c('pf-log', 'Logradouro', d.logradouro)}${c('pf-num', 'Número', d.numero)}${c('pf-comp', 'Complemento', d.complemento)}${c('pf-bairro', 'Bairro', d.bairro)}${c('pf-cid', 'Cidade', d.cidade)}<div class="field"><label for="pf-uf">UF</label><select id="pf-uf">${opt(UFS, d.uf)}</select></div></fieldset>
      </div>
      <div role="tabpanel" id="pan-dep" aria-labelledby="tab-dep" class="aba-painel aba-oculta">
        <p class="muted">Filhos e outros dependentes do professor.</p><div id="deps" class="grid" style="gap:.75rem">${p.dependentes.map(linhaDependente).join('')}</div>
        <p class="empty" id="deps-vazio" ${p.dependentes.length ? 'hidden' : ''}>Nenhum dependente cadastrado.</p>
        <div class="row"><button type="button" class="btn outline" data-act="dep-add">${icon('plus')}Adicionar dependente</button></div>
      </div>
      <div role="tabpanel" id="pan-vin" aria-labelledby="tab-vin" class="aba-painel aba-oculta">
        <p class="muted">Um professor pode ter mais de um vínculo. A escola onde ele trabalha é definida em Gerir lotações.</p>
        <div id="vincs" class="grid" style="gap:1rem">${p.vinculos.map((v, k) => linhaVinculo(v, k + 1)).join('')}</div>
        <div class="row"><button type="button" class="btn outline" data-act="vinc-add">${icon('plus')}Adicionar vínculo</button></div>
      </div>`,
    onSubmit: () => {
      const pessoa = Modelos.pessoa({ id: pe.id, nome: $('#pf-nome').value, cpf: $('#pf-cpf').value.replace(/\D/g, ''), nascimento: $('#pf-nasc').value, sexo: $('#pf-sexo').value, estadoCivil: $('#pf-civil').value,
        telefones: [$('#pf-tel1').value, $('#pf-tel2').value], email: $('#pf-email').value, naturalidade: { cidade: $('#pf-nat-cid').value, uf: $('#pf-nat-uf').value },
        endereco: { cep: $('#pf-cep').value, logradouro: $('#pf-log').value, numero: $('#pf-num').value, complemento: $('#pf-comp').value, bairro: $('#pf-bairro').value, cidade: $('#pf-cid').value, uf: $('#pf-uf').value } });
      const ler = (fs, k) => fs.querySelector(`[data-k="${k}"]`).value;
      const dependentes = $$('#deps .dep-linha').map(fs => Modelos.dependente({ id: fs.dataset.id, nome: ler(fs, 'nome'), parentesco: ler(fs, 'parentesco'), nascimento: ler(fs, 'nascimento') }));
      const vinculos = $$('#vincs .vinc').map(fs => { const arq = fs.querySelector('[data-k="anexo"]').files[0]; return Modelos.vinculo({ id: fs.dataset.id, cargo: ler(fs, 'cargo'), ingresso: ler(fs, 'ingresso'), orgaoOrigem: ler(fs, 'orgaoOrigem'), cargaHoraria: ler(fs, 'cargaHoraria'), dataInicio: ler(fs, 'dataInicio'), dataFim: ler(fs, 'dataFim'),
        formacoes: $$('[data-k="formacoes"]:checked', fs).map(x => x.value), disciplinas: $$('[data-k="disciplinas"]:checked', fs).map(x => x.value), anexoContrato: arq ? arq.name : fs.querySelector('[data-anexo]').dataset.anexo }); });
      const obj = Modelos.professor(Object.assign({}, p, { pessoa, dependentes, vinculos }));
      professorService.salvar(obj).then(() => { closeDialog(); rerender(); toast(id ? 'Cadastro do professor atualizado.' : 'Professor cadastrado. Defina a lotação em Gerir lotações.'); })
        .catch(e => { abrirAba(/^Dados pessoais/.test(e.message) ? 'pes' : /^Dependentes/.test(e.message) ? 'dep' : /^Vínculo/.test(e.message) ? 'vin' : 'pes'); toast(e.message, 'err'); alertSR(e.message); });
      return false;
    }
  });
}

// Lista de professores: colunas a partir do objeto Professor
Object.assign(ENT.professores, {
  cols: [
    ['Professor', r => `${esc(r.nome)}${caption2('CPF ' + esc(formatarCPF(r.pessoa?.cpf || '') || '—'))}`],
    ['Formações', r => `${esc((r.formacoes || []).map(formNome).join(', ') || '—')}${caption2('Habilita: ' + esc(habilitadas(r).map(discNome).join(', ') || 'nenhuma disciplina'))}`],
    ['Vínculos', r => { const vs = (r.vinculos || []).filter(vinculoAtivo); return `${vs.length} ativo${vs.length === 1 ? '' : 's'}${caption2(vs.map(v => `${v.ingresso}, ${v.cargaHoraria} h`).join('; ') || 'Nenhum vínculo ativo')}`; }],
    ['Lotado em', r => esc(uniq((DADOS.lotacoes || []).filter(l => l.professorId === r.id && lotacaoAtiva(l)).map(l => escNome(l.escolaId))).join(', ') || 'Sem lotação')],
    ['Situação', r => situacaoProf(r)]
  ],
  rowActs: r => can('lotacoes.gerir') ? `<button class="btn ghost sm" data-act="lot-ver" data-id="${r.id}" aria-label="Ver lotações de ${esc(r.nome)}">Lotações</button>` : '',
  onDelete: r => { DADOS.lotacoes = (DADOS.lotacoes || []).filter(l => l.professorId !== r.id); },
  desc: 'Cadastro dos professores: dados pessoais, dependentes e vínculos. A escola de cada um é definida em Gerir lotações.'
});

// Banco de talentos: "Chamar" cria o professor completo (Pessoa + Vínculo) e a primeira lotação
ACT.chamar = el => {
  const t = byId('talentos', el.dataset.id);
  const locais = DADOS.escolas.filter(e => DADOS.turmas.some(x => x.escolaId === e.id));
  openDialog({ title: `Chamar ${t.nome}`, body: `<p class="muted">${esc(formNome(t.formacaoId))}, ${t.classificacao}º lugar em ${esc(t.processo)}.</p><div class="form-grid">${fieldHTML({ k: 'ch-cpf', l: 'CPF', req: 1, attrs: 'inputmode="numeric" maxlength="14"' }, '')}${fieldHTML({ k: 'ch-nasc', l: 'Data de nascimento', t: 'date', req: 1 }, '')}${fieldHTML({ k: 'ch-esc', l: 'Primeira lotação', t: 'select', o: locais.map(e => [e.id, e.nome]), req: 1 }, '')}${fieldHTML({ k: 'ch-carga', l: 'Carga horária do vínculo (h)', t: 'number', req: 1 }, 25)}${fieldHTML({ k: 'ch-ini', l: 'Início do contrato', t: 'date', req: 1 }, TODAY_ISO)}${fieldHTML({ k: 'ch-fim', l: 'Fim do contrato', t: 'date', req: 1 }, `${TODAY.getFullYear()}-12-18`)}</div>`,
    onSubmit: () => {
      const v = Modelos.vinculo({ cargo: 'Professor', formacoes: [t.formacaoId], disciplinas: DADOS.formacoes.find(f => f.id === t.formacaoId)?.disciplinas || [], ingresso: 'Contrato', dataInicio: $('#f-ch-ini').value, dataFim: $('#f-ch-fim').value, cargaHoraria: $('#f-ch-carga').value });
      const p = Modelos.professor({ pessoa: { nome: t.nome, cpf: $('#f-ch-cpf').value.replace(/\D/g, ''), nascimento: $('#f-ch-nasc').value, telefones: [t.telefone], email: t.email }, vinculos: [v] });
      professorService.salvar(p).then(pr => lotacaoService.salvar(Modelos.lotacao({ professorId: pr.id, vinculoId: pr.vinculos[0].id, escolaId: $('#f-ch-esc').value, cargaHoraria: pr.vinculos[0].cargaHoraria, dataInicio: v.dataInicio })))
        .then(() => { t.situacao = 'Chamado'; save(); closeDialog(); rerender(); toast(`${t.nome} foi chamado e já está lotado.`); })
        .catch(e => { toast(e.message, 'err'); alertSR(e.message); });
      return false;
    } });
};
