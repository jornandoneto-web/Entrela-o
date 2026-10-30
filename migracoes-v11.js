/* Migração 10 → 11 (mentoria de 29/10/2026): listas gerenciáveis, faixas de horário, modalidades básicas,
   formação do professor separada do vínculo, cadastro de estudantes e perfil do calendário. */
'use strict';
function migrarV11(db) {
  const demo = db.demo !== false;
  // Listas gerenciáveis
  db.listas = db.listas || [];
  Object.entries(LISTAS_DEF).forEach(([tipo, d]) => d.v.forEach((nome, ordem) => {
    if (!db.listas.some(x => x.tipo === tipo && x.nome === nome)) db.listas.push(Object.assign(Modelos.itemLista({ id: `${tipo}-${ordem}`, tipo, nome, ordem }), { sistema: (d.sistema || []).includes(nome) }));
  }));
  // Faixas de horário
  db.faixas = db.faixas || [];
  Object.entries(SLOTS).forEach(([turno, horas]) => horas.forEach((inicio, ordem) => {
    if (!db.faixas.some(f => f.turno === turno && f.ordem === ordem)) db.faixas.push(Modelos.faixaHorario({ id: `fx-${norm(turno)}-${ordem}`, turno, ordem, inicio, fim: addMin(inicio, turno === 'Noite' ? 45 : 50) }));
  }));
  // Modalidades: só as três básicas nos dados de exemplo; o DED cadastra outras
  if (demo) {
    db.cursos = clone(MOCK_CURSOS);
    db.matrizes = (db.matrizes || []).filter(m => ['c1', 'c2', 'c3'].includes(m.cursoId));
    db.escolas.forEach(e => { e.cursos = uniq((e.cursos || []).map(c => ['c1', 'c2', 'c3'].includes(c) ? c : 'c3')); });
  }
  // Componentes da matriz viram disciplinas gerenciadas
  [['d10', 'Educação Física', 'Linguagens'], ['d11', 'Filosofia', 'Ciências Humanas'], ['d12', 'Sociologia', 'Ciências Humanas']].forEach(([id, nome, area]) => { if (!db.disciplinas.some(d => d.nome === nome)) db.disciplinas.push({ id, nome, area, ch: 40 }); });
  // Turmas ligadas ao curso, para comparar a grade com a matriz
  db.turmas.forEach(t => { if (!t.cursoId) t.cursoId = /médio/i.test(t.serie) ? 'c3' : /^[6-9]/.test(t.serie) ? 'c2' : 'c1'; });
  db.config.semanasLetivas = db.config.semanasLetivas || 40;
  // Formação do professor: sai do vínculo e ganha instituição e ano de conclusão
  const SIGLAS = { UFPE: 'Universidade Federal de Pernambuco', UFRPE: 'Universidade Federal Rural de Pernambuco', UPE: 'Universidade de Pernambuco', UFS: 'Universidade Federal de Sergipe', UNIT: 'Universidade Tiradentes' };
  db.professores.forEach(p => {
    if (!p.habilitacoes?.length) {
      const txtInst = String(p.instituicao || ''); const ano = (txtInst.match(/\b(19|20)\d{2}\b/) || [''])[0];
      const sigla = Object.keys(SIGLAS).find(k => txtInst.toUpperCase().includes(k));
      const ids = uniq([...(p.vinculos || []).flatMap(v => v.formacoes || []), ...(p.formacoes || [])]);
      p.habilitacoes = ids.map(formacaoId => Modelos.habilitacao({ formacaoId, instituicao: sigla ? SIGLAS[sigla] : txtInst.split(',')[0].trim(), anoConclusao: ano || (demo ? '2012' : '') }));
    }
    (p.vinculos || []).forEach(v => { delete v.formacoes; });
    delete p.instituicao;
    if (typeof projetarProfessor === 'function') projetarProfessor(p);
  });
  // Estudantes: quem já pediu vaga ganha cadastro básico
  db.estudantes = db.estudantes || [];
  if (demo && !db.estudantes.length) {
    const r2 = db.responsaveis.find(r => r.id === 'r2');
    db.estudantes.push(Modelos.estudante({ id: 'est1', responsavelId: 'r2', nome: 'Lucas Andrade', nascimento: '2011-03-14', sexo: 'Masculino', filiacao: 'Paulo Andrade', cpf: gerarCPF(402503604), corRaca: 'Parda', bolsaFamilia: 'Não', termoVacinacao: 'Assinado', email: r2?.email, telefone: r2?.telefone }));
    db.prematriculas.filter(p => p.estudante === 'Lucas Andrade').forEach(p => { p.estudanteId = 'est1'; });
  }
  db.prematriculas.forEach(p => { p.criado = p.criado || p.data + 'T08:00:00.000Z'; });
  // Calendário passa para o perfil próprio; novas permissões entram sem desfazer ajustes da secretaria
  db.perfis = db.perfis || {};
  if (db.perfis.diretor) db.perfis.diretor = db.perfis.diretor.filter(k => k !== 'calendario.editar');
  Object.entries(PERFIS_PADRAO).forEach(([r, perms]) => { if (!db.perfis[r]) db.perfis[r] = perms.slice(); else if (perms.includes('vagas.editar') && !db.perfis[r].includes('vagas.editar')) db.perfis[r].push('vagas.editar'); });
  db.migracoes = db.migracoes || [];
  db.migracoes.push({ versao: 11, data: new Date().toISOString(), nota: 'Listas gerenciáveis, faixas de horário, formações do professor, estudantes e perfil do calendário.' });
  db.v = 11;
}
