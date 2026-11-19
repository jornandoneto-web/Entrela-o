/* Transferências de alunos e vida escolar (histórico).
   Fluxo: o responsável ou o aluno pede (Pendente) → a escola de origem defere ou indefere → Concluído quando o histórico é emitido.
   Ao deferir: a declaração sai na hora; o histórico tem até 30 dias. Dentro da rede, a escola de destino escolhe a turma
   (ou põe o aluno na fila de espera dela, sem vaga) e as notas seguem com ele, porque ficam ligadas ao aluno, não à escola. */
'use strict';

const PRAZO_HISTORICO_DIAS = 30;
const somaDias = (iso, n) => { const d = dOf(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const municipiosSE = () => MOCK_DIRETORIAS.flatMap(d => d.municipios).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
const turmaArm = id => ARMAZEM.turmas.find(t => t.id === id);
const escolaArm = id => ARMAZEM.escolas.find(e => e.id === id);

/** Componentes do ano do aluno: os da matriz da série, ou as disciplinas da grade da turma quando não há matriz. */
function componentesDoAno(t) {
  const m = (ARMAZEM.matrizes || []).find(x => x.cursoId === t.cursoId);
  const s = m?.series.find(x => x.id === t.serieId);
  if (s?.componentes.length) return s.componentes.map(c => ({ nome: c.nome, cargaHoraria: c.cargaHoraria, d: ARMAZEM.disciplinas.find(x => norm(x.nome) === norm(c.nome)) }));
  return uniq(ARMAZEM.aulas.filter(a => a.turmaId === t.id).map(a => a.disciplinaId)).map(id => { const d = ARMAZEM.disciplinas.find(x => x.id === id); return { nome: d?.nome || '—', cargaHoraria: 0, d }; });
}
/** Foto do ano em curso do aluno na turma atual: médias até agora, frequência e carga de cada componente. */
function fotoDoAno(a, situacao) {
  const t = turmaArm(a.turmaId); if (!t) return null;
  const chamadas = ARMAZEM.chamadas.filter(c => c.turmaId === t.id);
  const faltas = chamadas.filter(c => (c.faltas || []).includes(a.id)).length;
  return {
    ano: t.ano || ARMAZEM.config.anoLetivo, turmaId: t.id, turma: t.nome, escolaId: t.escolaId, serie: t.serieNome || t.serie, situacao, data: TODAY_ISO,
    componentes: componentesDoAno(t).map(c => ({ nome: c.nome, cargaHoraria: c.cargaHoraria, media: c.d ? umaCasa(avg([1, 2, 3, 4].map(b => ARMAZEM.notas[`${a.id}|${c.d.id}|${b}`]).filter(v => v != null))) : null })),
    freq: chamadas.length ? umaCasa((1 - faltas / chamadas.length) * 100) : null
  };
}

const transfRepo = criarRepositorio('transferencias', { modelo: Modelos.transferencia });
SERVICOS.transferencias = transfRepo;
const ABERTOS = ['Pendente', 'Deferido'];

const transferenciaService = Object.assign({}, transfRepo, {
  /** Novo pedido. Dentro da rede: escola do sistema na cidade escolhida. Fora da rede: destino informado em texto. */
  async solicitar({ alunoId, tipo, municipioDestinoId, escolaDestinoId, destinoExterno, motivo, solicitante }) {
    await espera();
    const a = ARMAZEM.alunos.find(x => x.id === alunoId); if (!a) throw new Error('Escolha o aluno.');
    const t = turmaArm(a.turmaId); if (!t) throw new Error(`${a.nome} não está matriculado em uma turma.`);
    if (ARMAZEM.transferencias.some(x => x.alunoId === a.id && ABERTOS.includes(Modelos.transferencia(x).status) && !x.historicoEmitido)) throw new Error(`${a.nome} já tem um pedido de transferência em andamento.`);
    const p = Modelos.transferencia({ alunoId, escolaOrigemId: t.escolaId, tipo, motivo, solicitante, status: 'Pendente', dataSolicitacao: TODAY_ISO });
    if (p.tipo === 'rede') {
      const e = escolaArm(escolaDestinoId);
      if (!municipioDestinoId) throw new Error('Escolha a cidade.');
      if (!e) throw new Error('Escolha a escola de destino.');
      if (e.municipioId !== municipioDestinoId) throw new Error('A escola escolhida não fica na cidade escolhida.');
      if (e.id === t.escolaId) throw new Error('A escola de destino precisa ser diferente da escola atual.');
      Object.assign(p, { municipioDestinoId, escolaDestinoId: e.id });
    } else {
      const d = destinoExterno || {};
      if (!d.tipoEscola || !d.uf || !d.cidade) throw new Error('Informe o tipo de escola, o estado e a cidade de destino.');
      p.destinoExterno = { tipoEscola: d.tipoEscola, uf: d.uf, cidade: d.cidade, escola: d.escola || '' };
    }
    ARMAZEM.transferencias.push(p); persistirArmazem(); return clone(p);
  },
  /** A escola de origem defere: emite a declaração na hora e abre o prazo de 30 dias do histórico. */
  async deferir(id) {
    await espera();
    const p = ARMAZEM.transferencias.find(x => x.id === id); if (!p) throw new Error('Pedido não encontrado.');
    Object.assign(p, Modelos.transferencia(p));
    if (p.status !== 'Pendente') throw new Error(`Este pedido já está ${p.status.toLowerCase()}.`);
    const a = ARMAZEM.alunos.find(x => x.id === p.alunoId); if (!a) throw new Error('Aluno não encontrado.');
    const tOrig = turmaArm(a.turmaId); if (!tOrig) throw new Error(`${a.nome} não está em nenhuma turma.`);
    Object.assign(p, { status: 'Deferido', dataDecisao: TODAY_ISO, declaracaoEmitida: TODAY_ISO, prazoHistorico: somaDias(TODAY_ISO, PRAZO_HISTORICO_DIAS), serieOrigem: tOrig.serie, turmaOrigem: tOrig.nome, anoOrigem: tOrig.ano });
    a.historico = [...(a.historico || []), fotoDoAno(a, 'Transferido')];
    if (p.tipo === 'rede') {
      const dest = escolaArm(p.escolaDestinoId);
      if (dest?.integracao === 'Sistema Entrelaço') {
        // A escola de destino escolhe a turma (ou a fila de espera) na tela de pedidos dela.
        a.turmaId = ''; a.situacaoMatricula = 'Aguardando turma no destino'; p.aguardandoTurma = true; p.turnoOrigem = tOrig.turno;
        if (a.rotaId && ARMAZEM.rotas.find(r => r.id === a.rotaId)?.escolaId !== dest.id) a.rotaId = '';
        p.resultado = `Aguardando a ${dest.nome} escolher a turma. As notas do ano seguem com o aluno.`;
      } else {
        const v = ARMAZEM.vagas.find(x => x.escolaId === p.escolaDestinoId && x.serie === tOrig.serie); if (v) v.ocupadasExt = (Number(v.ocupadasExt) || 0) + 1;
        a.turmaId = ''; a.situacaoMatricula = 'Transferido';
        p.resultado = `Encaminhado à ${dest?.nome || 'escola de destino'} pela integração.`;
      }
    } else {
      a.turmaId = ''; a.situacaoMatricula = 'Transferido';
      const d = p.destinoExterno; p.resultado = `Transferido para ${d.escola || d.tipoEscola.toLowerCase()} em ${d.cidade}/${d.uf}.`;
    }
    persistirArmazem(); return clone(p);
  },
  /** Turmas da escola de destino que servem ao aluno: mesma série e ano letivo, abertas, com as vagas livres. */
  turmasDestino(p) {
    const ocup = t => ARMAZEM.alunos.filter(x => x.turmaId === t.id).length;
    return ARMAZEM.turmas.filter(t => t.escolaId === p.escolaDestinoId && t.serie === p.serieOrigem && Number(t.ano) === Number(p.anoOrigem) && !t.finalizada)
      .map(t => ({ id: t.id, nome: t.nome, turno: t.turno, livres: (Number(t.vagas) || 40) - ocup(t) }))
      .sort((x, y) => (x.turno === p.turnoOrigem ? 0 : 1) - (y.turno === p.turnoOrigem ? 0 : 1) || x.nome.localeCompare(y.nome));
  },
  /** Escola de destino matricula o aluno transferido na turma escolhida. */
  async alocarTurma(id, turmaId) {
    await espera();
    const p = ARMAZEM.transferencias.find(x => x.id === id); if (!p?.aguardandoTurma) throw new Error('Este aluno já foi encaminhado.');
    const t = this.turmasDestino(p).find(x => x.id === turmaId); if (!t) throw new Error('Escolha uma turma da mesma série e ano letivo.');
    if (t.livres <= 0) throw new Error(`A turma ${t.nome} não tem vaga. Escolha outra ou coloque o aluno na fila de espera.`);
    const a = ARMAZEM.alunos.find(x => x.id === p.alunoId); a.turmaId = t.id; a.situacaoMatricula = 'Matriculado';
    p.aguardandoTurma = false; p.turmaDestinoId = t.id; p.resultado = `Matriculado na turma ${t.nome} da ${escolaArm(p.escolaDestinoId)?.nome}. As notas do ano seguiram com o aluno.`;
    persistirArmazem(); return clone(p);
  },
  /** Sem vaga: o aluno entra na fila de espera da escola de destino. */
  async enviarFila(id) {
    await espera();
    const p = ARMAZEM.transferencias.find(x => x.id === id); if (!p?.aguardandoTurma) throw new Error('Este aluno já foi encaminhado.');
    const a = ARMAZEM.alunos.find(x => x.id === p.alunoId); const dest = escolaArm(p.escolaDestinoId);
    const pm = { id: uid(), protocolo: `TR-${TODAY.getFullYear()}-${String(ARMAZEM.transferencias.length).padStart(4, '0')}`, alunoId: a.id, estudante: a.nome, nascimento: a.nascimento, responsavel: a.responsavel, telefone: a.telResp || '', serie: p.serieOrigem, turno: p.turnoOrigem || '', escola1: dest.id, escola2: '', escolaId: dest.id, acess: a.acess || 'Nenhuma', docs: [], status: 'Lista de espera', data: TODAY_ISO, criado: new Date().toISOString(), obs: 'Veio por transferência dentro da rede. Será chamado quando abrir uma vaga.', origemTransferencia: p.id };
    ARMAZEM.prematriculas.push(pm); a.situacaoMatricula = 'Aguardando vaga'; p.aguardandoTurma = false;
    const pos = ARMAZEM.prematriculas.filter(x => x.status === 'Lista de espera' && x.escolaId === dest.id && x.serie === pm.serie && x.turno === pm.turno).length;
    p.resultado = `Sem vaga na ${dest.nome}: o aluno entrou na fila de espera (${pos}º lugar). As notas seguem com ele.`;
    persistirArmazem(); return clone(p);
  },
  async indeferir(id, justificativa) {
    await espera();
    const p = ARMAZEM.transferencias.find(x => x.id === id); if (!p) throw new Error('Pedido não encontrado.');
    Object.assign(p, Modelos.transferencia(p));
    if (p.status !== 'Pendente') throw new Error(`Este pedido já está ${p.status.toLowerCase()}.`);
    if (String(justificativa || '').trim().length < 10) throw new Error('Escreva a justificativa do indeferimento (pelo menos 10 caracteres).');
    Object.assign(p, { status: 'Indeferido', dataDecisao: TODAY_ISO, justificativa: justificativa.trim() });
    persistirArmazem(); return clone(p);
  },
  /** Histórico emitido: o pedido fica Concluído. */
  async emitirHistorico(id) {
    await espera();
    const p = ARMAZEM.transferencias.find(x => x.id === id); if (!p) throw new Error('Pedido não encontrado.');
    Object.assign(p, Modelos.transferencia(p));
    if (p.status !== 'Deferido') throw new Error('O histórico só é emitido depois do deferimento.');
    Object.assign(p, { historicoEmitido: TODAY_ISO, status: 'Concluído' });
    persistirArmazem(); return clone(p);
  },
  /** Situação do prazo do histórico: dias restantes (negativo = atrasado). */
  prazo(p) { if (!p.prazoHistorico || p.historicoEmitido) return null; return daysUntil(p.prazoHistorico); }
});

// ---------- Notas externas e histórico escolar ----------
const notaExternaRepo = criarRepositorio('notasExternas', {
  modelo: Modelos.notaExterna,
  validar: n => {
    if (!ARMAZEM.alunos.some(a => a.id === n.alunoId)) return 'Escolha o aluno.';
    if (!n.escola || !n.uf || !n.cidade) return 'Informe a escola de origem, a cidade e a UF.';
    if (!(n.ano >= 1950 && n.ano <= TODAY.getFullYear())) return `O ano precisa estar entre 1950 e ${TODAY.getFullYear()}.`;
    if (!n.serie || !n.componente) return 'Informe a série e o componente curricular.';
    if (n.media == null || n.media < 0 || n.media > 10 || Math.round(n.media * 10) !== n.media * 10) return 'A média final vai de 0 a 10, com uma casa decimal.';
    if (!(n.cargaHoraria > 0)) return 'Informe a carga horária do componente.';
    if (!n.situacao) return 'Informe a situação.';
  }
});
SERVICOS.notasExternas = notaExternaRepo;

const historicoService = {
  /** Vida escolar completa: anos encerrados e transferências, ano em curso e lançamentos externos, em ordem de ano. */
  async montar(alunoId) {
    await espera();
    const a = ARMAZEM.alunos.find(x => x.id === alunoId); if (!a) throw new Error('Aluno não encontrado.');
    const local = e => { const x = escolaArm(e); return x ? { escola: x.nome, cidade: `${regionalService.nomeMunicipio(x.municipioId) || x.cidade || ''}/SE` } : { escola: '—', cidade: '' }; };
    const periodos = (a.historico || []).map(h => {
      if (h.componentes) return Object.assign({ externo: false }, h, local(h.escolaId));
      // Ano encerrado no fechamento: médias guardadas na turma finalizada
      const t = turmaArm(h.turmaId); const r = t?.finalizada?.resultados.find(x => x.alunoId === a.id);
      const ch = n => componentesDoAno(t || {}).find(c => norm(c.nome) === norm(n))?.cargaHoraria || 0;
      return Object.assign({ externo: false, ano: h.ano, serie: t?.serieNome || t?.serie || h.turma, situacao: h.situacao, freq: r?.freq ?? null, componentes: (r?.componentes || []).map(c => ({ nome: c.nome, media: c.media, cargaHoraria: ch(c.nome) })) }, local(t?.escolaId));
    });
    const atual = a.turmaId ? fotoDoAno(a, 'Cursando') : null;
    if (atual) periodos.push(Object.assign({ externo: false }, atual, local(atual.escolaId)));
    const grupos = {};
    (ARMAZEM.notasExternas || []).filter(n => n.alunoId === a.id).forEach(n => {
      const k = `${n.ano}|${n.serie}|${n.escola}`;
      (grupos[k] = grupos[k] || { externo: true, ano: n.ano, serie: n.serie, escola: n.escola, tipoEscola: n.tipoEscola, cidade: `${n.cidade}/${n.uf}`, freq: null, componentes: [], situacoes: [] });
      grupos[k].componentes.push({ nome: n.componente, media: n.media, cargaHoraria: n.cargaHoraria }); grupos[k].situacoes.push(n.situacao);
    });
    Object.values(grupos).forEach(g => { g.situacao = g.situacoes.find(s => s !== 'Aprovado') || 'Aprovado'; delete g.situacoes; periodos.push(g); });
    periodos.sort((x, y) => x.ano - y.ano || (x.data || '').localeCompare(y.data || ''));
    return clone({ aluno: a, escolaAtual: local(turmaArm(a.turmaId)?.escolaId), periodos });
  }
};
