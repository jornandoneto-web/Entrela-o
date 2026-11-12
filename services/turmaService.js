/* Turmas (perfil Secretaria escolar): o usuário digita só o identificador ("B"). A série vem da matriz do curso
   e o nome completo ("1º ano B") é montado aqui, para que todas as telas mostrem o mesmo nome. */
'use strict';
const serieDaMatriz = (cursoId, serieId) => (ARMAZEM.matrizes || []).find(m => m.cursoId === cursoId)?.series.find(s => s.id === serieId) || null;
// Texto da série como na lista "Séries", usado pelas vagas e pela pré-matrícula
function serieLegada(cursoId, serieNome) {
  const curso = (ARMAZEM.cursos || []).find(c => c.id === cursoId); const etapa = norm(curso?.etapa || '').split(' ').pop();
  const lista = (ARMAZEM.listas || []).filter(x => x.tipo === 'series').map(x => x.nome);
  return lista.find(s => norm(s).startsWith(norm(serieNome)) && (!etapa || norm(s).includes(etapa))) || `${serieNome} — ${curso?.nome || ''}`;
}
const nomeTurma = t => `${t.serieNome} ${t.identificador}`.trim();

const turmaRepo = criarRepositorio('turmas', {
  modelo: Modelos.turma,
  validar: t => {
    const nova = !ARMAZEM.turmas.some(x => x.id === t.id);
    if (!t.escolaId) return 'A turma precisa de uma escola.';
    if (!t.identificador) return 'Informe o identificador da turma, como A ou B.';
    if (/\bturma\b/i.test(t.identificador)) return 'Digite só o identificador, sem a palavra "Turma". Ex.: B';
    if (t.identificador.length > 10) return 'O identificador tem no máximo 10 caracteres.';
    if (!t.cursoId) return 'Escolha o curso.';
    const s = serieDaMatriz(t.cursoId, t.serieId);
    if ((nova || t.serieId) && !s) return 'Escolha a série. As séries vêm da matriz do curso.';
    if (!t.turno) return 'Escolha o turno.';
    if (!(t.vagas > 0)) return 'Informe a quantidade de vagas.';
    const ocupadas = ARMAZEM.alunos.filter(a => a.turmaId === t.id).length;
    if (t.vagas < ocupadas) return `A turma já tem ${ocupadas} alunos. As vagas não podem ser menos que isso.`;
    const ano = (ARMAZEM.anosLetivos || []).find(a => a.escolaId === t.escolaId && a.ano === t.ano);
    if (nova && ano?.status !== 'ativo') return `O ano letivo ${t.ano} não está ativo nesta escola. Turmas novas só entram no ano ativo.`;
    const nome = s ? `${s.nome} ${t.identificador}` : t.nome;
    if (ARMAZEM.turmas.some(x => x.id !== t.id && x.escolaId === t.escolaId && x.ano === t.ano && x.serieId === t.serieId && norm(x.identificador) === norm(t.identificador)))
      return `Já existe a turma ${nome} no ano letivo ${t.ano} nesta escola.`;
  },
  aoSalvar: t => {
    const s = serieDaMatriz(t.cursoId, t.serieId);
    if (s) { t.serieNome = s.nome; t.serie = serieLegada(t.cursoId, s.nome); }
    if (t.serieNome) t.nome = nomeTurma(t);
  }
});
const turmaService = Object.assign({}, turmaRepo, {
  /** Séries da matriz do curso, na ordem da matriz. */
  async seriesDoCurso(cursoId) { await espera(); return clone((ARMAZEM.matrizes || []).find(m => m.cursoId === cursoId)?.series || []); },
  nomeCompleto: (serieNome, identificador) => `${serieNome || ''} ${String(identificador || '').trim().replace(/^turma\s+/i, '')}`.trim()
});
SERVICOS.turmas = turmaService;
