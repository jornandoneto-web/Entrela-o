/* Migração 13 → 14 (respostas da mentoria de 19/11/2026):
   - a escola de destino passa a escolher a turma do aluno transferido dentro da rede;
   - dados de exemplo: professores com horas livres para lotar (Marina Costa e Juliana Freitas continuam sem saldo, para mostrar o aviso). */
'use strict';
function migrarV14(db) {
  (db.transferencias || []).forEach(t => { if (t.aguardandoTurma == null) t.aguardandoTurma = false; });
  if (db.demo !== false) {
    const ativa = l => !l.dataFim || l.dataFim > TODAY_ISO;
    ['Renata Moura', 'André Siqueira', 'Patrícia Lemos'].forEach(nome => {
      const p = db.professores.find(x => x.pessoa?.nome === nome); if (!p) return;
      p.vinculos.forEach(v => {
        const usado = db.lotacoes.filter(l => l.vinculoId === v.id && ativa(l)).reduce((n, l) => n + (Number(l.cargaHoraria) || 0), 0);
        if (usado >= v.cargaHoraria && v.cargaHoraria < 40) v.cargaHoraria = 40;
      });
    });
  }
  db.migracoes = db.migracoes || [];
  db.migracoes.push({ versao: 14, data: new Date().toISOString(), nota: 'Escola de destino escolhe a turma do aluno transferido; professores de exemplo com horas livres.' });
  db.v = 14;
}
