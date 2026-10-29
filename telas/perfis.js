/* Telas iniciais dos perfis Secretário e Diretoria Regional (Etapa 3). Estrutura pronta para receber mais telas. */
'use strict';

async function telaSecretario() {
  const [drs, escolas, profs, cursos] = await Promise.all([regionalService.listar(), escolaService.listar(), professorService.listar(), cursoService.listar()]);
  const porDR = drs.map(d => [d, escolas.filter(e => e.drId === d.id)]).filter(([, l]) => l.length);
  return pageHead(`${greet()}, ${firstName(me().nome)}.`, 'Visão geral da rede estadual por Diretoria Regional.', '', 'hello') +
    `<section class="stats" aria-label="Resumo">${statCard('lilac', 'Escolas', escolas.length, `em ${porDR.length} diretorias`, 'escolas')}${statCard('mint', 'Professores', profs.length, `${profs.filter(p => p.vinculos.some(vinculoAtivo)).length} com vínculo ativo`)}${statCard('peach', 'Alunos', DADOS.alunos.length, 'matriculados nas escolas do Entrelaço')}${statCard('peri', 'Cursos', cursos.length, 'ofertados pela rede')}</section>
    ${hrowOpen('painel-sec')}<section class="card" aria-labelledby="dr-h"><h2 id="dr-h">Escolas por Diretoria Regional</h2><div class="tbl-wrap"><table class="tbl stack"><thead><tr><th scope="col">Diretoria</th><th scope="col">Municípios com escola</th><th scope="col" class="n">Escolas</th></tr></thead><tbody>${porDR.map(([d, l]) => `<tr><th scope="row">${esc(d.sigla)}${caption2(esc(d.nome))}</th><td data-label="Municípios">${esc(uniq(l.map(e => regionalService.nomeMunicipio(e.municipioId))).join(', '))}</td><td class="n" data-label="Escolas">${l.length}</td></tr>`).join('')}</tbody></table></div></section></div>`;
}

PAGES.secretario = { inicio: telaSecretario, escolas: telaEscolas, relatorios: gRelatorios };
PAGES.regional = { inicio: telaEscolas, infraestrutura: telaInfraRegional };
