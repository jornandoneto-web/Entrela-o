/* Migração 12 → 13 (mentoria de 19/11/2026): transferências no fluxo novo (Pendente → Deferido/Indeferido → Concluído),
   notas externas, listas novas e dados pessoais completos dos alunos. */
'use strict';
function migrarV13(db) {
  const demo = db.demo !== false;
  // Listas novas (parentesco de responsável, tipo de escola fora da rede)
  Object.entries(LISTAS_DEF).forEach(([tipo, d]) => d.v.forEach((nome, ordem) => {
    if (!db.listas.some(x => x.tipo === tipo && x.nome === nome)) db.listas.push(Object.assign(Modelos.itemLista({ id: `${tipo}-${ordem}`, tipo, nome, ordem }), { sistema: (d.sistema || []).includes(nome) }));
  }));
  // Transferências antigas → modelo novo
  const STATUS = { 'Aguardando escola de origem': 'Pendente', 'Aguardando escola de destino': 'Pendente', 'Concluída': 'Concluído', 'Recusada': 'Indeferido' };
  db.transferencias = (db.transferencias || []).map(t0 => {
    const t = Modelos.transferencia(Object.assign({}, t0, { status: STATUS[t0.status] || t0.status }));
    if (t.tipo === 'rede' && !t.municipioDestinoId) t.municipioDestinoId = db.escolas.find(e => e.id === t.escolaDestinoId)?.municipioId || '';
    if (t.status === 'Concluído' && !t.historicoEmitido) t.historicoEmitido = t.dataDecisao || t.dataSolicitacao;
    if (t.status === 'Indeferido' && !t.justificativa) t.justificativa = 'Indeferido antes da mudança do fluxo.';
    return t;
  });
  db.notasExternas = db.notasExternas || [];
  if (demo) {
    const al = n => db.alunos.find(a => a.nome === n);
    const mae = ['Maria', 'Cláudia', 'Fernanda'];
    // Alunos de exemplo com CPF válido (gerado), filiação e parentesco do responsável
    db.alunos.forEach((a, i) => {
      if (!a.cpf) a.cpf = gerarCPF(611000000 + i * 7919);
      if (!a.filiacao) a.filiacao = a.responsavel || '';
      if (!a.parentescoResponsavel) a.parentescoResponsavel = mae.includes(firstName(a.responsavel || '')) ? 'Mãe' : 'Pai';
    });
    // Notas externas: o João estudou fora da rede antes de entrar na Unidade Centro
    const joao = db.alunos.find(a => a.id === 'a1');
    if (joao && !db.notasExternas.some(n => n.alunoId === joao.id)) {
      [[2024, '9º ano — Fundamental', 'Escola Municipal Pequeno Príncipe', 'Escola municipal', [['Língua Portuguesa', 8.0, 200], ['Matemática', 7.5, 200], ['História', 8.5, 80], ['Geografia', 9.0, 80], ['Ciências', 8.0, 120], ['Inglês', 7.0, 80]]],
       [2025, '1º ano — Ensino médio', 'Colégio Dom Bosco', 'Escola particular', [['Língua Portuguesa', 8.5, 160], ['Matemática', 8.0, 160], ['Física', 7.5, 80], ['Química', 7.0, 80], ['Biologia', 8.0, 80], ['História', 9.0, 80]]]]
        .forEach(([ano, serie, escola, tipoEscola, comps]) => comps.forEach(([componente, media, cargaHoraria]) => db.notasExternas.push(Modelos.notaExterna({ id: `nx-${ano}-${norm(componente).replace(/[^a-z]+/g, '')}`, alunoId: joao.id, escola, tipoEscola, cidade: 'Aracaju', uf: 'SE', ano, serie, componente, media, cargaHoraria, situacao: 'Aprovado' }))));
    }
    // Um pedido fora da rede, pendente, na Unidade Centro
    const pedro = al('Pedro Arthur Santos'); const tP = pedro && db.turmas.find(t => t.id === pedro.turmaId);
    if (tP && !db.transferencias.some(t => t.alunoId === pedro.id)) db.transferencias.push(Modelos.transferencia({ id: 'tr-demo-fora', alunoId: pedro.id, escolaOrigemId: tP.escolaId, tipo: 'fora_da_rede', destinoExterno: { tipoEscola: 'Escola particular', uf: 'BA', cidade: 'Salvador', escola: 'Colégio Antônio Vieira' }, motivo: 'Mudança de endereço', solicitante: 'Responsável', status: 'Pendente', dataSolicitacao: addDays(-2) }));
    // Um deferido há 26 dias na Unidade Atalaia: histórico perto do prazo
    const igor = al('Igor Nascimento'); const tI = igor && db.turmas.find(t => t.id === igor.turmaId);
    if (tI && !db.transferencias.some(t => t.alunoId === igor.id)) {
      const dDef = addDays(-26);
      igor.historico = [...(igor.historico || []), Object.assign(fotoDoAno(igor, 'Transferido'), { data: dDef })];
      db.transferencias.push(Modelos.transferencia({ id: 'tr-demo-prazo', alunoId: igor.id, escolaOrigemId: tI.escolaId, tipo: 'fora_da_rede', destinoExterno: { tipoEscola: 'Escola municipal', uf: 'PE', cidade: 'Recife', escola: 'Escola Municipal Recife Antigo' }, motivo: 'Mudança de endereço', solicitante: 'Responsável', status: 'Deferido', dataSolicitacao: addDays(-28), dataDecisao: dDef, declaracaoEmitida: dDef, prazoHistorico: addDays(4), serieOrigem: tI.serie, turmaOrigem: tI.nome, anoOrigem: tI.ano, resultado: 'Transferido para Escola Municipal Recife Antigo em Recife/PE.' }));
      igor.turmaId = ''; igor.situacaoMatricula = 'Transferido';
    }
  }
  db.migracoes = db.migracoes || [];
  db.migracoes.push({ versao: 13, data: new Date().toISOString(), nota: 'Transferências no fluxo novo, notas externas, histórico escolar e dados pessoais completos.' });
  db.v = 13;
}
