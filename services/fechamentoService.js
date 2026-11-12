/* Fechamento do ano letivo e rematrícula.
   - Conferência: para cada componente da série na matriz, aulas previstas (carga anual) × aulas ministradas (aulas salvas no diário).
   - Finalizar: só com todos os componentes completos. Calcula Aprovado/Reprovado e guarda o resultado na turma.
   - Rematrícula: aprovado vai para a série seguinte do mesmo curso no ano seguinte; reprovado repete a série;
     aprovado na última série fica com o curso concluído. */
'use strict';
const discDoComponente = nome => (ARMAZEM.disciplinas || []).find(d => norm(d.nome) === norm(nome));
const componentesDaTurma = t => serieDaMatriz(t.cursoId, t.serieId)?.componentes || [];
const umaCasa = n => n == null ? null : Math.round(n * 10) / 10;

function resultadosDaTurma(t) {
  const { mediaMin, freqMin } = ARMAZEM.config;
  const comps = componentesDaTurma(t).map(c => ({ nome: c.nome, d: discDoComponente(c.nome) }));
  const chamadas = ARMAZEM.chamadas.filter(c => c.turmaId === t.id);
  return ARMAZEM.alunos.filter(a => a.turmaId === t.id).sort((a, b) => a.nome.localeCompare(b.nome)).map(a => {
    // Média do componente = média aritmética dos bimestres lançados
    const componentes = comps.map(({ nome, d }) => {
      const ns = d ? [1, 2, 3, 4].map(b => ARMAZEM.notas[`${a.id}|${d.id}|${b}`]).filter(v => v != null) : [];
      return { nome, bimestres: ns.length, media: umaCasa(avg(ns)) };
    });
    const faltas = chamadas.filter(c => (c.faltas || []).includes(a.id)).length;
    const freq = chamadas.length ? umaCasa((1 - faltas / chamadas.length) * 100) : null;
    const motivos = componentes.filter(c => c.media != null && c.media < mediaMin).map(c => `Média ${num(c.media)} em ${c.nome}, abaixo de ${num(mediaMin)}`);
    if (freq != null && freq < freqMin) motivos.push(`Frequência de ${num(freq, 0)}% (${faltas} faltas em ${chamadas.length} aulas), abaixo de ${freqMin}%`);
    return {
      alunoId: a.id, nome: a.nome, situacao: motivos.length ? 'Reprovado' : 'Aprovado', motivos,
      media: umaCasa(avg(componentes.map(c => c.media))), freq, faltas, aulas: chamadas.length,
      componentes: componentes.map(({ nome, media, bimestres }) => ({ nome, media, bimestres })), destino: ''
    };
  });
}

const fechamentoService = {
  /** Uma linha por componente curricular da série: previstas na matriz, ministradas no diário e quanto falta. */
  async conferencia(turmaId) {
    await espera();
    const t = ARMAZEM.turmas.find(x => x.id === turmaId); if (!t) throw new Error('Turma não encontrada.');
    const linhas = componentesDaTurma(t).map(c => {
      const d = discDoComponente(c.nome);
      const ministradas = d ? ARMAZEM.chamadas.filter(x => x.turmaId === t.id && x.disciplinaId === d.id).length : 0;
      return { nome: c.nome, disciplinaId: d?.id || '', previstas: c.cargaHoraria, ministradas, faltam: Math.max(0, c.cargaHoraria - ministradas) };
    });
    return { turma: clone(t), linhas, semMatriz: !linhas.length, completo: linhas.length > 0 && linhas.every(l => l.faltam === 0) };
  },
  /** Prévia do resultado (sem gravar), para a secretaria conferir antes de finalizar. */
  async previa(turmaId) { await espera(); const t = ARMAZEM.turmas.find(x => x.id === turmaId); return t ? clone(resultadosDaTurma(t)) : []; },
  async finalizar(turmaId) {
    const conf = await fechamentoService.conferencia(turmaId);
    const t = ARMAZEM.turmas.find(x => x.id === turmaId);
    if (t.finalizada) throw new Error(`A turma ${t.nome} já foi finalizada.`);
    if (conf.semMatriz) throw new Error('A série desta turma não tem matriz. O DED precisa cadastrar os componentes.');
    if (!conf.completo) throw new Error(`Ainda faltam aulas: ${conf.linhas.filter(l => l.faltam).map(l => `${l.nome} (${l.faltam})`).join(', ')}.`);
    const { mediaMin, freqMin } = ARMAZEM.config;
    t.finalizada = { data: TODAY_ISO, mediaMin, freqMin, resultados: resultadosDaTurma(t) };
    persistirArmazem(); return clone(t);
  },
  /** Destino sugerido para um aluno de uma turma finalizada. */
  sugestao(t, r) {
    const series = (ARMAZEM.matrizes || []).find(m => m.cursoId === t.cursoId)?.series || [];
    const i = series.findIndex(s => s.id === t.serieId);
    if (r.situacao === 'Reprovado') return { tipo: 'rematricula', cursoId: t.cursoId, serieId: t.serieId, serieNome: t.serieNome, ano: t.ano + 1 };
    const prox = series[i + 1];
    return prox ? { tipo: 'rematricula', cursoId: t.cursoId, serieId: prox.id, serieNome: prox.nome, ano: t.ano + 1 } : { tipo: 'concluido', cursoId: t.cursoId, ano: t.ano + 1 };
  },
  /** Alunos de turmas finalizadas da escola que ainda não têm destino. */
  async pendentes(escolaId) {
    await espera();
    return clone(ARMAZEM.turmas.filter(t => t.escolaId === escolaId && t.finalizada).flatMap(t => t.finalizada.resultados.filter(r => !r.destino).map(r => ({ turma: t, resultado: r, sugestao: fechamentoService.sugestao(t, r) }))));
  },
  async rematricular(origemId, alunoIds, destinoId) {
    await espera();
    const o = ARMAZEM.turmas.find(x => x.id === origemId), d = ARMAZEM.turmas.find(x => x.id === destinoId);
    if (!o?.finalizada) throw new Error('A turma de origem ainda não foi finalizada.');
    if (!d) throw new Error('Escolha a turma de destino.');
    if (d.finalizada) throw new Error(`A turma ${d.nome} já foi finalizada.`);
    if (!alunoIds.length) throw new Error('Selecione pelo menos um aluno.');
    const res = alunoIds.map(id => o.finalizada.resultados.find(r => r.alunoId === id));
    for (const r of res) {
      if (!r || r.destino) throw new Error('Um dos alunos já foi rematriculado. Atualize a tela.');
      const s = fechamentoService.sugestao(o, r);
      if (s.tipo !== 'rematricula' || s.serieId !== d.serieId || s.ano !== d.ano || d.escolaId !== o.escolaId) throw new Error(`${r.nome} deve ir para ${s.tipo === 'concluido' ? 'conclusão do curso' : `${s.serieNome} em ${s.ano}`}, e não para ${d.nome} (${d.ano}).`);
    }
    const livres = d.vagas - ARMAZEM.alunos.filter(a => a.turmaId === d.id).length;
    if (alunoIds.length > livres) throw new Error(`A turma ${d.nome} tem ${Math.max(0, livres)} vaga${livres === 1 ? '' : 's'} livre${livres === 1 ? '' : 's'} e você selecionou ${alunoIds.length} alunos.`);
    res.forEach(r => {
      const a = ARMAZEM.alunos.find(x => x.id === r.alunoId); if (!a) return;
      // As notas do ano que terminou ficam guardadas com a turma de origem, e o ano novo começa sem notas
      Object.keys(ARMAZEM.notas).filter(k => k.split('|').length === 3 && k.startsWith(a.id + '|')).forEach(k => { ARMAZEM.notas[`${k}|${o.id}`] = ARMAZEM.notas[k]; delete ARMAZEM.notas[k]; });
      a.historico = [...(a.historico || []), { ano: o.ano, turmaId: o.id, turma: o.nome, situacao: r.situacao }];
      a.turmaId = d.id; r.destino = d.id;
    });
    persistirArmazem(); return res.length;
  },
  /** Aprovados na última série: curso concluído, sem rematrícula. */
  async concluir(origemId, alunoIds) {
    await espera();
    const o = ARMAZEM.turmas.find(x => x.id === origemId); if (!o?.finalizada) throw new Error('A turma ainda não foi finalizada.');
    alunoIds.forEach(id => {
      const r = o.finalizada.resultados.find(x => x.alunoId === id); const a = ARMAZEM.alunos.find(x => x.id === id);
      if (!r || r.destino || fechamentoService.sugestao(o, r).tipo !== 'concluido') return;
      if (a) { a.historico = [...(a.historico || []), { ano: o.ano, turmaId: o.id, turma: o.nome, situacao: r.situacao }]; a.situacaoMatricula = 'Curso concluído'; }
      r.destino = 'concluido';
    });
    persistirArmazem(); return alunoIds.length;
  }
};
