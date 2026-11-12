/* Ano letivo: cada escola tem um único ano ativo. O ano só é encerrado quando todas as turmas dele estão finalizadas. */
'use strict';
const anoLetivoRepo = criarRepositorio('anosLetivos', {
  modelo: Modelos.anoLetivo,
  validar: a => {
    const lista = ARMAZEM.anosLetivos || [];
    if (!a.escolaId) return 'O ano letivo precisa de uma escola.';
    if (!(a.ano >= 2000 && a.ano <= 2100)) return 'Informe um ano válido.';
    if (lista.some(x => x.id !== a.id && x.escolaId === a.escolaId && x.ano === a.ano)) return `A escola já tem o ano letivo ${a.ano}.`;
    if (a.status === 'ativo' && lista.some(x => x.id !== a.id && x.escolaId === a.escolaId && x.status === 'ativo')) return 'A escola já tem um ano letivo ativo. Encerre esse ano antes de abrir outro.';
  }
});
const anoLetivoService = Object.assign({}, anoLetivoRepo, {
  /** Anos da escola, do mais recente para o mais antigo. */
  async daEscola(escolaId) { return (await anoLetivoRepo.listar(x => x.escolaId === escolaId)).sort((a, b) => b.ano - a.ano); },
  async encerrar(escolaId, ano) {
    const a = (ARMAZEM.anosLetivos || []).find(x => x.escolaId === escolaId && x.ano === ano);
    if (!a) throw new Error('Ano letivo não encontrado.');
    if (a.status === 'encerrado') throw new Error(`O ano letivo ${ano} já está encerrado.`);
    const abertas = ARMAZEM.turmas.filter(t => t.escolaId === escolaId && t.ano === ano && !t.finalizada);
    if (abertas.length) throw new Error(`Finalize todas as turmas antes de encerrar o ano. Ainda abertas: ${abertas.map(t => t.nome).join(', ')}.`);
    return anoLetivoRepo.atualizar(a.id, { status: 'encerrado' });
  },
  /** Abre o ano seguinte ao mais recente da escola. Só funciona com o ano anterior encerrado. */
  async abrirProximo(escolaId) {
    const anos = (ARMAZEM.anosLetivos || []).filter(x => x.escolaId === escolaId).map(x => x.ano);
    const ano = anos.length ? Math.max(...anos) + 1 : (ARMAZEM.config?.anoLetivo || TODAY.getFullYear());
    return anoLetivoRepo.salvar(Modelos.anoLetivo({ id: `al-${escolaId}-${ano}`, escolaId, ano, status: 'ativo' }));
  }
});
SERVICOS.anosLetivos = anoLetivoService;
