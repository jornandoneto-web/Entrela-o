/* Notas e boletins da escola (consulta). Lê as mesmas notas que o professor lança (DADOS.notas, chave aluno|disciplina|bimestre):
   o que o professor salva aparece aqui na hora, no bimestre certo. A edição continua só no perfil Professor.
   Resultado final com a mesma regra do fechamento do ano (fechamentoService). */
'use strict';

async function telaBoletins() {
  if (!turmasEsc().some(t => t.id === UI.sel.bolTurma)) UI.sel.bolTurma = turmasEsc()[0]?.id;
  const t = byId('turmas', UI.sel.bolTurma);
  const head = pageHead('Notas e boletins', `Consulta das notas lançadas pelos professores, por turma e bimestre. Média mínima ${num(DADOS.config.mediaMin)} e frequência mínima ${DADOS.config.freqMin}%, as mesmas regras do fechamento do ano.`);
  if (!t) return head + '<p class="empty">Nenhuma turma nesta escola.</p>';
  const b = Number(UI.sel.bolBim) || DADOS.config.bimestreAtual || 1;
  const res = t.finalizada ? t.finalizada.resultados : await fechamentoService.previa(t.id);
  // Componentes: os da matriz da série; sem matriz, as disciplinas da grade
  const nomesMatriz = res[0]?.componentes.map(c => c.nome) || [];
  const comps = (nomesMatriz.length ? nomesMatriz.map(n => DADOS.disciplinas.find(d => norm(d.nome) === norm(n))).filter(Boolean).map(d => d.id) : discsDaTurma(t.id));
  const al = alunosDaTurma(t.id);
  const resultado = (a, r) => {
    if (t.finalizada) return r?.situacao === 'Aprovado' ? st('Aprovado', 'ok') : st('Reprovado', 'err');
    const completo = comps.every(d => [1, 2, 3, 4].every(x => nota(a.id, d, x) != null));
    if (completo && r) return r.situacao === 'Aprovado' ? st('Aprovado', 'ok') : `${st('Reprovado', 'err')}${caption2(esc(r.motivos.join('; ')))}`;
    return `${st('Em andamento', 'neutral')}${r?.motivos.length ? caption2(`Atenção: ${esc(r.motivos.join('; '))}`) : ''}`;
  };
  const cel = (a, d) => { const v = nota(a.id, d, b); return v == null ? '<span class="muted" aria-label="sem nota">—</span>' : v < DADOS.config.mediaMin ? `<span class="nota-baixa">${num(v)}</span>` : num(v); };
  const lancadas = al.reduce((n, a) => n + comps.filter(d => nota(a.id, d, b) != null).length, 0); const esperadas = al.length * comps.length;
  return head + `<div class="toolbar">${selectCtl('bol-turma', 'Turma', optTurmas(), t.id, 'bolTurma')}
      <fieldset class="field"><legend class="lbl">Bimestre</legend><div class="seg">${[1, 2, 3, 4].map(x => `<label><input type="radio" name="bol-bim" value="${x}" data-change="bolBim" ${x === b ? 'checked' : ''}>${x}º</label>`).join('')}</div></fieldset></div>
    <p class="muted">${t.finalizada ? `Turma finalizada em ${fmtD(t.finalizada.data)}: resultado definitivo.` : `${lancadas} de ${esperadas} notas do ${b}º bimestre lançadas.`} A média é a média aritmética dos bimestres lançados até agora.</p>
    ${al.length ? `<div class="tbl-wrap"><table class="tbl"><caption>${esc(turmaLong(t.id))}, ${b}º bimestre</caption><thead><tr><th scope="col">Aluno</th>${comps.map(d => `<th scope="col" class="n"><abbr title="${esc(discNome(d))}" style="text-decoration:none">${esc(discNome(d).slice(0, 4))}.</abbr><span class="sr-only">${esc(discNome(d))}</span></th>`).join('')}<th scope="col" class="n">Média</th><th scope="col" class="n">Freq.</th><th scope="col">Resultado final</th><th scope="col"><span class="sr-only">Ação</span></th></tr></thead>
      <tbody>${al.map(a => { const r = res.find(x => x.alunoId === a.id); return `<tr><th scope="row">${nomeAluno(a)}</th>${comps.map(d => `<td class="n">${cel(a, d)}</td>`).join('')}<td class="n"><b>${num(r?.media)}</b></td><td class="n">${r?.freq == null ? '—' : freqHTML(r.freq)}</td><td>${resultado(a, r)}</td><td class="n"><button class="btn ghost sm" data-act="ver-boletim" data-id="${a.id}" aria-label="Ver boletim completo de ${esc(a.nome)}">Detalhes</button></td></tr>`; }).join('')}</tbody></table></div>
      <p class="caption">Nota abaixo da média em destaque. Resultado final: Aprovado com média de pelo menos ${num(DADOS.config.mediaMin)} em cada componente e frequência de pelo menos ${DADOS.config.freqMin}%; "Em andamento" enquanto faltam notas do ano.</p>` : '<p class="empty">Nenhum aluno nesta turma.</p>'}`;
}
CHG.bolBim = el => { UI.sel.bolBim = Number(el.value); rerender(); };
PAGES.gestao.boletins = telaBoletins;
PAGES.diretor.boletins = telaBoletins;
