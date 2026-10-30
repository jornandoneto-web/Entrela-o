/* Professores: Pessoa + Dependentes + Vínculos. A lotação fica em lotacaoService. */
'use strict';
// Campos derivados para as telas antigas (lista de professores, RH, grade): nome, e-mail, formações, ingresso e carga
function projetarProfessor(p) {
  const ativos = p.vinculos.filter(vinculoAtivo); const principal = ativos[0] || p.vinculos[0] || {};
  p.nome = p.pessoa.nome; p.email = p.pessoa.email; p.telefone = p.pessoa.telefones[0] || '';
  if (p.habilitacoes.length) p.formacoes = uniq(p.habilitacoes.map(h => h.formacaoId));
  p.ingresso = principal.ingresso || ''; p.orgaoOrigem = principal.orgaoOrigem || '';
  p.contratoInicio = principal.dataInicio || ''; p.contratoFim = principal.ingresso === 'Contrato' ? principal.dataFim || '' : '';
  p.cargaHoraria = ativos.reduce((n, v) => n + v.cargaHoraria, 0) || principal.cargaHoraria || 0;
  const lot = (ARMAZEM.lotacoes || []).find(l => l.professorId === p.id && lotacaoAtiva(l));
  p.escolaId = lot ? lot.escolaId : (p.escolaId || '');
}
const professorService = criarRepositorio('professores', {
  modelo: Modelos.professor,
  validar: p => {
    const pe = p.pessoa;
    if (!pe.nome) return 'Dados pessoais: informe o nome completo.';
    if (!cpfValido(pe.cpf)) return 'Dados pessoais: o CPF não é válido. Confira os 11 números.';
    if (ARMAZEM.professores.some(x => x.id !== p.id && x.pessoa && x.pessoa.cpf.replace(/\D/g, '') === pe.cpf.replace(/\D/g, ''))) return 'Dados pessoais: já existe um professor com esse CPF.';
    if (!pe.nascimento) return 'Dados pessoais: informe a data de nascimento.';
    if (p.dependentes.some(d => !d.nome || !d.parentesco)) return 'Dependentes: todo dependente precisa de nome e parentesco.';
    if (!p.habilitacoes.length) return 'Formação: cadastre pelo menos uma formação.';
    for (const h of p.habilitacoes) {
      if (!h.formacaoId) return 'Formação: escolha a formação em todas as linhas.';
      if (h.anoConclusao && (!/^\d{4}$/.test(h.anoConclusao) || +h.anoConclusao < 1950 || +h.anoConclusao > TODAY.getFullYear())) return `Formação: o ano de conclusão precisa ter 4 dígitos, entre 1950 e ${TODAY.getFullYear()}.`;
    }
    if (!p.vinculos.length) return 'Vínculos: cadastre pelo menos um vínculo.';
    for (const [i, v] of p.vinculos.entries()) {
      const q = `Vínculo ${i + 1}`;
      const hab = uniq(p.habilitacoes.flatMap(h => (ARMAZEM.formacoes || []).find(x => x.id === h.formacaoId)?.disciplinas || []));
      const fora = v.disciplinas.find(d => !hab.includes(d));
      if (fora) return `${q}: ${(ARMAZEM.disciplinas.find(x => x.id === fora) || {}).nome} não é habilitada pelas formações do professor.`;
      if (!v.dataInicio) return `${q}: informe a data de início.`;
      if (v.dataFim && v.dataFim < v.dataInicio) return `${q}: a data de fim precisa ser depois do início.`;
      if (!(v.cargaHoraria > 0)) return `${q}: informe a carga horária.`;
      if (v.ingresso === 'Cedido' && !v.orgaoOrigem) return `${q}: informe o órgão de origem do professor cedido.`;
      const lot = (ARMAZEM.lotacoes || []).filter(l => l.vinculoId === v.id && lotacaoAtiva(l)).reduce((n, l) => n + l.cargaHoraria, 0);
      if (lot > v.cargaHoraria) return `${q}: as lotações ativas somam ${lot} h, mais que a nova carga de ${v.cargaHoraria} h. Ajuste as lotações antes.`;
    }
  },
  aoSalvar: projetarProfessor,
  aoRemover: p => { ARMAZEM.lotacoes = (ARMAZEM.lotacoes || []).filter(l => l.professorId !== p.id); }
});

SERVICOS.professores = professorService;
