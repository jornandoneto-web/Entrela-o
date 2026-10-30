/* Matrícula: cadastro básico do estudante, solicitação de vaga, reserva e fila de espera. */
'use strict';
const estudanteRepo = criarRepositorio('estudantes', {
  modelo: Modelos.estudante,
  validar: e => {
    if (e.nome.split(/\s+/).length < 2) return 'Informe o nome completo, sem abreviações.';
    if (!e.nascimento || e.nascimento >= TODAY_ISO) return 'A data de nascimento precisa ser anterior a hoje.';
    if (!e.sexo || !e.corRaca || !e.bolsaFamilia) return 'Preencha sexo, cor/raça e Bolsa Família.';
    if (e.filiacao.split(/\s+/).length < 2) return 'Informe o nome completo da mãe ou do responsável legal.';
    if (!cpfValido(e.cpf)) return 'O CPF do estudante não é válido.';
    if ((ARMAZEM.estudantes || []).some(x => x.id !== e.id && x.cpf === e.cpf)) return 'Já existe um estudante com esse CPF.';
    if (e.termoVacinacao !== 'Assinado') return 'Assine o termo de vacinação.';
    if (e.rgEmissao && e.rgEmissao > TODAY_ISO) return 'A data de emissão do RG não pode ser futura.';
    if (!/^\S+@\S+\.\S+$/.test(e.email)) return 'Digite um e-mail válido.';
  }
});
SERVICOS.estudantes = estudanteRepo;
const estudanteService = estudanteRepo;

const ocupadasArm = v => { const e = ARMAZEM.escolas.find(x => x.id === v.escolaId); if (e?.integracao !== 'Sistema Entrelaço') return Number(v.ocupadasExt) || 0; return ARMAZEM.alunos.filter(a => { const t = ARMAZEM.turmas.find(x => x.id === a.turmaId); return t && t.escolaId === v.escolaId && t.serie === v.serie && t.turno === v.turno; }).length; };
const doPedido = (p, v) => p.escolaId === v.escolaId && p.serie === v.serie && p.turno === v.turno;
const livresArm = v => (Number(v.total) || 0) - ocupadasArm(v) - ARMAZEM.prematriculas.filter(p => p.status === 'Vaga reservada' && doPedido(p, v)).length;
const matriculaService = {
  /** Reserva a vaga se houver; se não, coloca na fila da escola, série e turno. */
  async solicitar({ estudanteId, escolaId, serie, turno, responsavelId }) {
    await espera();
    const e = ARMAZEM.estudantes.find(x => x.id === estudanteId); if (!e) throw new Error('Escolha o estudante.');
    const v = ARMAZEM.vagas.find(x => x.escolaId === escolaId && x.serie === serie && x.turno === turno); if (!v) throw new Error('Essa escola não oferece essa série e turno.');
    if (ARMAZEM.prematriculas.some(p => p.estudanteId === estudanteId && doPedido(p, v) && ['Vaga reservada', 'Lista de espera', 'Em análise'].includes(p.status))) throw new Error(`${e.nome} já tem uma solicitação nessa escola, série e turno.`);
    const livre = livresArm(v) > 0;
    const p = { id: uid(), protocolo: `PM-2026-${String(39 + ARMAZEM.prematriculas.length).padStart(5, '0')}`, responsavelId, estudanteId, responsavel: e.filiacao, telefone: e.telefone || '', estudante: e.nome, nascimento: e.nascimento, serie, turno, escola1: escolaId, escola2: '', escolaId, bairro: '', acess: e.necessidade || 'Nenhuma', docs: [], status: livre ? 'Vaga reservada' : 'Lista de espera', data: TODAY_ISO, criado: new Date().toISOString(), obs: livre ? 'Vaga reservada. Leve os documentos à escola para confirmar a matrícula.' : 'A série está sem vagas. Você será chamado quando abrir uma vaga.' };
    ARMAZEM.prematriculas.push(p); persistirArmazem(); return clone(p);
  },
  /** O responsável pode cancelar a qualquer momento. Se a vaga estava reservada, o primeiro da fila é chamado. */
  async cancelar(id) {
    await espera();
    const p = ARMAZEM.prematriculas.find(x => x.id === id); if (!p) throw new Error('Solicitação não encontrada.');
    p.status = 'Cancelada'; p.obs = `Cancelada em ${fmtD(TODAY_ISO)}.`; persistirArmazem();
    return matriculaService.chamarFila(p.escolaId, p.serie, p.turno);
  },
  /** Enquanto houver vaga livre, chama os primeiros da fila, na ordem de chegada. */
  async chamarFila(escolaId, serie, turno) {
    const v = ARMAZEM.vagas.find(x => x.escolaId === escolaId && x.serie === serie && x.turno === turno); if (!v) return [];
    const chamados = [];
    const fila = ARMAZEM.prematriculas.filter(p => p.status === 'Lista de espera' && doPedido(p, v)).sort((a, b) => (a.criado || a.data).localeCompare(b.criado || b.data));
    for (const p of fila) { if (livresArm(v) <= 0) break; p.status = 'Vaga reservada'; p.obs = `Abriu uma vaga em ${fmtD(TODAY_ISO)}. Leve os documentos à escola para confirmar a matrícula.`; chamados.push(p.id); }
    persistirArmazem(); return chamados;
  }
};
SERVICOS.vagas = criarRepositorio('vagas', { aoSalvar: v => setTimeout(() => matriculaService.chamarFila(v.escolaId, v.serie, v.turno), 0) });
