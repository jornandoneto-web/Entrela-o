/* Infraestrutura da escola: um registro por escola (id = id da escola). Quem preenche é o diretor. */
'use strict';
const infraRepo = criarRepositorio('infraestruturas', {
  modelo: o => Object.assign(Modelos.infraestruturaEscola(o), { id: o.escolaId }),
  validar: i => {
    if (!i.escolaId) return 'Escola não informada.';
    if (['salasAula', 'salasTI', 'laboratorios', 'banheiros', 'salasProfessores'].some(k => i[k] < 0 || !Number.isInteger(i[k]))) return 'Use números inteiros a partir de zero nas quantidades.';
  }
});
const infraestruturaService = {
  async buscarPorEscola(escolaId) { return (await infraRepo.buscarPorId(escolaId)) || Modelos.infraestruturaEscola({ escolaId }); },
  async salvar(infra) { return infraRepo.salvar(Object.assign({}, infra, { id: infra.escolaId })); },
  listar: infraRepo.listar,
  // Leitura síncrona para telas antigas (ex.: busca de vagas do responsável)
  recursosSync: escolaId => ((DB.infraestruturas || []).find(i => i.id === escolaId)?.recursosAcessibilidade) || []
};
