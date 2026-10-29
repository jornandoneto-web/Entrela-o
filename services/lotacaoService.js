/* Lotações: em que escola o professor trabalha, por vínculo. Um professor pode estar em várias escolas ao mesmo tempo. */
'use strict';
const horasLotadas = (vinculoId, excetoId) => (DB.lotacoes || []).filter(l => l.vinculoId === vinculoId && l.id !== excetoId && lotacaoAtiva(l)).reduce((n, l) => n + l.cargaHoraria, 0);
const lotacaoRepo = criarRepositorio('lotacoes', {
  modelo: Modelos.lotacao,
  validar: l => {
    const p = DB.professores.find(x => x.id === l.professorId); if (!p) return 'Professor não encontrado.';
    const v = p.vinculos.find(x => x.id === l.vinculoId); if (!v) return 'Escolha o vínculo.';
    if (!DB.escolas.some(e => e.id === l.escolaId)) return 'Escolha a escola.';
    if (!(l.cargaHoraria > 0)) return 'Informe a carga horária na escola.';
    if (!l.dataInicio) return 'Informe a data de início.';
    if (l.dataFim && l.dataFim < l.dataInicio) return 'A data de fim precisa ser depois do início.';
    if (v.dataFim && l.dataInicio > v.dataFim) return 'A lotação começa depois do fim do vínculo.';
    if (lotacaoAtiva(l)) {
      const usado = horasLotadas(v.id, l.id); const saldo = v.cargaHoraria - usado;
      if (l.cargaHoraria > saldo) return `O vínculo tem ${v.cargaHoraria} h e já há ${usado} h lotadas. Saldo disponível: ${Math.max(0, saldo)} h.`;
    }
  },
  aoSalvar: l => { setTimeout(() => { const p = DB.professores.find(x => x.id === l.professorId); if (p) { projetarProfessor(p); save(); } }, 0); }
});
const lotacaoService = Object.assign({}, lotacaoRepo, {
  async listarPorProfessor(professorId) { return lotacaoRepo.listar(l => l.professorId === professorId); },
  /** Horas do vínculo, horas lotadas em lotações ativas e saldo. */
  saldo(vinculo) { const usado = horasLotadas(vinculo.id); return { total: vinculo.cargaHoraria, usado, saldo: vinculo.cargaHoraria - usado }; },
  async encerrar(id, data = TODAY_ISO) { const l = await lotacaoRepo.buscarPorId(id); if (!l) throw new Error('Lotação não encontrada.'); return lotacaoRepo.salvar(Object.assign(l, { dataFim: data < l.dataInicio ? l.dataInicio : data })); }
});
