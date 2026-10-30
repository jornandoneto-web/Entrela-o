/* Telas: Infraestrutura da escola (Etapa 2). O diretor preenche a da sua escola; a Diretoria Regional consulta as da regional. */
'use strict';

const INFRA_NUM = [['salasAula', 'Salas de aula'], ['salasTI', 'Salas de informática'], ['laboratorios', 'Laboratórios'], ['banheiros', 'Banheiros'], ['salasProfessores', 'Salas de professores']];

async function telaInfraDiretor() {
  const escolaId = escSessao();
  if (!escolaId) return pageHead('Infraestrutura da escola', 'Este usuário não está ligado a uma escola.');
  const [escola, infra] = await Promise.all([escolaService.buscarPorId(escolaId), infraestruturaService.buscarPorEscola(escolaId)]);
  const extras = infra.recursosAcessibilidade.filter(r => !nomes('recursosAcessibilidade').includes(r));
  const box = (r, on) => `<label class="check"><input type="checkbox" name="acess" value="${esc(r)}" ${on ? 'checked' : ''}>${esc(r)}</label>`;
  return pageHead('Infraestrutura da escola', `${esc(escola?.nome || '')}. Preenchido pela direção e usado pela Secretaria para planejar obras, matrículas e atendimento a estudantes com deficiência.`) +
    `<form class="card" data-form="infra" novalidate aria-labelledby="inf-h" style="max-width:52rem"><h2 id="inf-h" class="sr-only">Dados da infraestrutura</h2>
      <fieldset class="form-grid"><legend class="lbl">Espaços</legend>${INFRA_NUM.map(([k, l]) => `<div class="field"><label for="inf-${k}">${l}</label><input id="inf-${k}" type="number" min="0" step="1" inputmode="numeric" value="${infra[k]}"></div>`).join('')}
        <fieldset class="field wide"><legend class="lbl">Tipos de laboratório</legend><div class="checks">${[...nomes('tiposLaboratorio'), ...infra.tiposLaboratorio.split(',').map(x => x.trim()).filter(x => x && !nomes('tiposLaboratorio').includes(x))].map(t => `<label class="check"><input type="checkbox" name="tiposLab" value="${esc(t)}" ${infra.tiposLaboratorio.split(',').map(x => x.trim()).includes(t) ? 'checked' : ''}>${esc(t)}</label>`).join('')}</div></fieldset></fieldset>
      <fieldset class="field"><legend class="lbl">Possui ginásio ou quadra?</legend><div class="seg">${[['sim', 'Sim'], ['nao', 'Não']].map(([v, l]) => `<label><input type="radio" name="ginasio" value="${v}" ${(infra.possuiGinasio ? 'sim' : 'nao') === v ? 'checked' : ''}>${l}</label>`).join('')}</div></fieldset>
      <fieldset class="field wide"><legend class="lbl">Recursos de acessibilidade</legend><div class="checks" id="inf-acess">${nomes('recursosAcessibilidade').map(r => box(r, infra.recursosAcessibilidade.includes(r))).join('')}${extras.map(r => box(r, true)).join('')}</div>
        <div class="row" style="margin-top:.5rem;align-items:flex-end"><div class="field" style="flex:1 1 14rem"><label for="inf-outro">Outro recurso</label><input id="inf-outro" placeholder="Ex.: Mapa tátil da escola"></div><button type="button" class="btn outline" data-act="infra-outro">${icon('plus')}Adicionar</button></div></fieldset>
      <div class="row"><button class="btn primary" type="submit">${icon('check')}Salvar infraestrutura</button></div></form>`;
}
ACT['infra-outro'] = () => {
  const i = $('#inf-outro'); const v = i.value.trim(); if (!v) { i.focus(); return; }
  if ($$('#inf-acess input').some(x => norm(x.value) === norm(v))) { toast('Esse recurso já está na lista.', 'err'); return; }
  $('#inf-acess').insertAdjacentHTML('beforeend', `<label class="check"><input type="checkbox" name="acess" value="${esc(v)}" checked>${esc(v)}</label>`);
  i.value = ''; toast(`"${v}" adicionado. Salve para gravar.`, 'info');
};
FORMS.infra = f => {
  const dados = { escolaId: escSessao(), tiposLaboratorio: new FormData(f).getAll('tiposLab').join(', '), possuiGinasio: f.querySelector('input[name=ginasio]:checked')?.value === 'sim', recursosAcessibilidade: new FormData(f).getAll('acess') };
  INFRA_NUM.forEach(([k]) => { dados[k] = Number($('#inf-' + k).value || 0); });
  infraestruturaService.salvar(Modelos.infraestruturaEscola(dados)).then(() => toast('Infraestrutura salva.')).catch(e => { toast(e.message, 'err'); alertSR(e.message); });
};

// Diretoria Regional: consulta da infraestrutura das escolas da regional
async function telaInfraRegional() {
  const drId = EQUIPE[SESSION.userId]?.drId; const dr = await regionalService.buscarPorId(drId);
  const escolas = await escolaService.filtrar({ drId });
  const infras = await Promise.all(escolas.map(e => infraestruturaService.buscarPorEscola(e.id)));
  return pageHead('Infraestrutura das escolas', `${esc(dr?.sigla || '')}, ${esc(dr?.nome || '')}. Dados informados pela direção de cada escola.`) +
    (escolas.length ? `<div class="tbl-wrap"><table class="tbl stack"><thead><tr><th scope="col">Escola</th>${INFRA_NUM.map(([, l]) => `<th scope="col" class="n">${l}</th>`).join('')}<th scope="col">Ginásio</th><th scope="col">Acessibilidade</th></tr></thead><tbody>${escolas.map((e, i) => { const x = infras[i]; return `<tr><th scope="row">${esc(e.nome)}${caption2(esc(regionalService.nomeMunicipio(e.municipioId)))}</th>${INFRA_NUM.map(([k, l]) => `<td class="n" data-label="${l}">${x[k]}</td>`).join('')}<td data-label="Ginásio">${x.possuiGinasio ? 'Sim' : 'Não'}</td><td data-label="Acessibilidade">${x.recursosAcessibilidade.length ? esc(x.recursosAcessibilidade.join(', ')) : st('Nenhum recurso informado', 'warn')}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="empty">Nenhuma escola cadastrada nesta regional.</p>');
}

PAGES.diretor.infraestrutura = telaInfraDiretor;
