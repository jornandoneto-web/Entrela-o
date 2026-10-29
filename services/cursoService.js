/* Cursos e matrizes curriculares (perfil DED) */
'use strict';
const cursoService = criarRepositorio('cursos', {
  modelo: Modelos.curso,
  validar: c => { if (!c.nome) return 'Informe o nome do curso.'; if ((DB.cursos || []).some(x => x.id !== c.id && norm(x.nome) === norm(c.nome))) return 'Já existe um curso com esse nome.'; },
  aoRemover: c => { DB.matrizes = (DB.matrizes || []).filter(m => m.cursoId !== c.id); (DB.escolas || []).forEach(e => { e.cursos = (e.cursos || []).filter(x => x !== c.id); }); }
});
const matrizRepo = criarRepositorio('matrizes', {
  modelo: Modelos.matriz,
  validar: m => {
    if (!m.cursoId) return 'A matriz precisa de um curso.';
    for (const s of m.series) {
      if (!s.nome) return 'Toda série precisa de nome.';
      if (s.componentes.some(c => !c.nome || c.cargaHoraria <= 0)) return `Em ${s.nome}, todo componente precisa de nome e carga horária maior que zero.`;
      const nomes = s.componentes.map(c => norm(c.nome)); if (new Set(nomes).size !== nomes.length) return `Em ${s.nome}, há componente repetido.`;
    }
  }
});
const matrizService = Object.assign({}, matrizRepo, {
  /** Devolve a matriz do curso; se ainda não existir, devolve uma vazia (não salva). */
  async buscarPorCurso(cursoId) { const [m] = await matrizRepo.listar(x => x.cursoId === cursoId); return m || Modelos.matriz({ id: 'm-' + cursoId, cursoId, series: [] }); },
  totalSerie: s => s.componentes.reduce((n, c) => n + c.cargaHoraria, 0)
});
