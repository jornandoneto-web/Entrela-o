/* Cadastro de turma (Secretaria escolar). O ano letivo vem do seletor do topo e fica bloqueado; a série vem da matriz
   do curso; o usuário digita só o identificador ("B") e o nome completo é montado ("1º ano B").
   Depois de criar a turma, o sistema oferece ir direto para a montagem do horário dela. */
'use strict';

const cursoNomeDe = id => (DADOS.cursos || []).find(c => c.id === id)?.nome || '';
// Cursos que a escola oferta (se a escola não informou, todos os cursos da rede)
const cursosDaEscola = escolaId => { const ofertados = byId('escolas', escolaId)?.cursos || []; return DADOS.cursos.filter(c => !ofertados.length || ofertados.includes(c.id)).sort((a, b) => a.nome.localeCompare(b.nome)); };
const seriesDe = cursoId => (DADOS.matrizes || []).find(m => m.cursoId === cursoId)?.series || [];
const opcoesSerie = (cursoId, atual) => `<option value="">${!cursoId ? 'Escolha o curso primeiro' : seriesDe(cursoId).length ? 'Selecione…' : 'Este curso ainda não tem matriz'}</option>` +
  seriesDe(cursoId).map(s => `<option value="${esc(s.id)}" ${s.id === atual ? 'selected' : ''}>${esc(s.nome)}</option>`).join('');

Object.assign(ENT.turmas, {
  desc: 'Turmas do ano letivo escolhido no topo. A série vem da matriz do curso e o horário é montado por turma.',
  canNew: () => can('turmas.gerir') && anoAberto(),
  canEdit: () => can('turmas.gerir') && anoAberto(),
  sort: (a, b) => a.nome.localeCompare(b.nome),
  cols: [
    ['Turma', r => `${esc(r.nome)}${caption2(esc([cursoNomeDe(r.cursoId), `ano letivo ${r.ano}`].filter(Boolean).join(', ')))}`],
    ['Turno', r => esc(r.turno)], ['Sala', r => esc(r.sala || '—')],
    ['Alunos e vagas', r => `${alunosDaTurma(r.id).length} de ${r.vagas || '—'}`, 'n'],
    ['Situação', r => r.finalizada ? st('Finalizada', 'ok') : st('Em andamento', 'info')],
    ['Média', r => num(avg(alunosDaTurma(r.id).map(a => mediaGeral(a.id)))), 'n']
  ],
  rowActs: r => `<button class="btn ghost sm" data-act="turma-horario" data-id="${r.id}" aria-label="Horário de ${esc(r.nome)}">Horário</button>`
});

function formTurma(id) {
  if (!id && !anoAberto()) { toast(`O ano letivo ${anoSel()} está encerrado. Escolha o ano ativo no topo para criar turmas.`, 'err'); return; }
  const t = id ? byId('turmas', id) : Modelos.turma({ escolaId: escSessao(), ano: anoSel(), turno: 'Manhã', vagas: 35 });
  const travada = id && alunosDaTurma(id).length > 0; // turma com alunos não muda de curso nem de série
  const cursos = cursosDaEscola(t.escolaId);
  const req = ' <span class="req" aria-hidden="true">*</span>';
  openDialog({
    title: id ? `Editar ${t.nome}` : 'Nova turma', wide: true,
    body: `<p class="caption">Campos com <span class="req">*</span> são obrigatórios.</p><div class="form-grid">
      <div class="field"><label for="tu-ano">Ano letivo</label><input id="tu-ano" value="${t.ano}" readonly aria-readonly="true" aria-describedby="tu-ano-h"><p class="help" id="tu-ano-h">${icon('lock')} Vem do ano letivo escolhido no topo.</p></div>
      <div class="field"><label for="tu-curso">Curso${req}</label><select id="tu-curso" required data-change="tuCurso" ${travada ? 'disabled' : ''}><option value="">Selecione…</option>${cursos.map(c => `<option value="${esc(c.id)}" ${c.id === t.cursoId ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>${travada ? '<p class="help">A turma já tem alunos: curso e série não mudam.</p>' : ''}</div>
      <div class="field"><label for="tu-serie">Série${req}</label><select id="tu-serie" required data-change="tuNome" ${travada ? 'disabled' : ''}>${opcoesSerie(t.cursoId, t.serieId)}</select><p class="help">As séries vêm da matriz do curso.</p></div>
      <div class="field"><label for="tu-id">Identificador da turma${req}</label><input id="tu-id" required maxlength="10" autocomplete="off" value="${esc(t.identificador)}" data-input="tuNome" placeholder="Ex.: B" aria-describedby="tu-id-h"><p class="help" id="tu-id-h">Só a letra ou o código, sem a palavra "Turma".</p></div>
      <p class="field wide nome-turma" aria-live="polite">Nome da turma: <b id="tu-nome"></b></p>
      <div class="field"><label for="tu-turno">Turno${req}</label><select id="tu-turno" required>${nomes('turnos').map(x => `<option ${x === t.turno ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      <div class="field"><label for="tu-vagas">Quantidade de vagas${req}</label><input id="tu-vagas" type="number" min="1" step="1" required value="${t.vagas || ''}"></div>
      ${listaOutroHTML('tu-sala', 'Sala', nomes('salas'), t.sala)}
    </div><p class="err-msg" id="tu-erro" role="alert" hidden></p>`,
    onSubmit: () => {
      const obj = Modelos.turma(Object.assign({}, t, { cursoId: $('#tu-curso').value, serieId: $('#tu-serie').value, identificador: $('#tu-id').value, turno: $('#tu-turno').value, vagas: Number($('#tu-vagas').value), sala: valorOutro('tu-sala') }));
      turmaService.salvar(obj).then(salva => {
        closeDialog();
        rerender().then(() => { toast(`Turma ${salva.nome} ${id ? 'atualizada' : 'criada'}.`); if (!id) perguntarHorario(salva); });
      }).catch(e => { const box = $('#tu-erro'); box.textContent = e.message; box.hidden = false; alertSR(e.message); });
      return false;
    }
  });
  atualizarNomeTurma();
}
function atualizarNomeTurma() {
  const s = seriesDe($('#tu-curso')?.value).find(x => x.id === $('#tu-serie')?.value); const idt = ($('#tu-id')?.value || '').trim();
  const alvo = $('#tu-nome'); if (!alvo) return;
  alvo.textContent = /\bturma\b/i.test(idt.replace(/^turma\s+/i, '')) ? 'Digite só o identificador, sem a palavra "Turma"' : s && idt ? turmaService.nomeCompleto(s.nome, idt) : 'aparece quando você escolher a série e digitar o identificador';
}
CHG.tuNome = atualizarNomeTurma;
CHG.tuCurso = el => { $('#tu-serie').innerHTML = opcoesSerie(el.value, ''); atualizarNomeTurma(); };

function perguntarHorario(t) {
  openDialog({
    title: 'Turma criada', body: `<p>A turma <b>${esc(t.nome)}</b> foi criada no ano letivo ${t.ano}. Quer montar o horário dela agora?</p>`,
    foot: `<button type="button" class="btn ghost" data-act="close-dlg">Agora não</button><button type="button" class="btn primary" data-act="turma-horario" data-id="${t.id}">${icon('clock')}Montar horário</button>`
  });
}
ACT['turma-horario'] = el => { closeDialog(); UI.sel.hTurma = el.dataset.id; UI.sel.gVisao = 'turma'; go('horarios'); };

const openFormTurmas = openForm;
openForm = function (key, id, def) { return key === 'turmas' ? formTurma(id) : openFormTurmas(key, id, def); };
