/* Cadastros de pessoas: dados pessoais completos e CPF validado pelos dígitos verificadores em todos os perfis. */
'use strict';

const cpfDuplicado = (cpf, colecao, id) => (DADOS[colecao] || []).some(x => x.id !== id && String(x.cpf || x.pessoa?.cpf || '').replace(/\D/g, '') === String(cpf).replace(/\D/g, ''));
const CAMPO_CPF = { k: 'cpf', l: 'CPF', req: 1, attrs: 'data-cpf inputmode="numeric" maxlength="14" placeholder="000.000.000-00" autocomplete="off"' };

// Aluno: documentos e filiação, além do que já existia
const alunoFieldsAntes = ENT.alunos.fields;
ENT.alunos.fields = () => { const base = alunoFieldsAntes(); const i = base.findIndex(f => f.k === 'nascimento') + 1;
  return [...base.slice(0, i), CAMPO_CPF, { k: 'sexo', l: 'Sexo', t: 'select', o: L('sexos'), req: 1 }, { k: 'corRaca', l: 'Cor/Raça', t: 'select', o: L('coresRacas') }, { k: 'filiacao', l: 'Filiação (mãe ou responsável legal)', req: 1, wide: 1 }, ...base.slice(i).flatMap(f => f.k === 'responsavel' ? [f, { k: 'parentescoResponsavel', l: 'Parentesco do responsável', t: 'select', o: L('parentescosResponsavel'), req: 1 }] : [f])]; };
const alunoCheckAntes = ENT.alunos.check;
ENT.alunos.check = (v, id) => {
  if (v.cpf && !cpfValido(v.cpf)) return 'O CPF do aluno não é válido. Confira os 11 números.';
  if (v.cpf && cpfDuplicado(v.cpf, 'alunos', id)) return 'Já existe um aluno com esse CPF.';
  return alunoCheckAntes ? alunoCheckAntes(v, id) : '';
};
const alunoAfterAntes = ENT.alunos.after;
ENT.alunos.after = (r, novo) => { r.cpf = String(r.cpf || '').replace(/\D/g, ''); if (alunoAfterAntes) alunoAfterAntes(r, novo); };

// Pessoas (diretores e outros servidores sem vínculo de professor)
ENT.pessoas = {
  coll: 'pessoas', title: 'Pessoas', singular: 'pessoa', plural: 'pessoas', fem: true, newLabel: 'Cadastrar pessoa',
  desc: 'Pessoas que podem ser escolhidas como diretor de escola. Professores são cadastrados pelo RH.',
  fields: () => [{ k: 'nome', l: 'Nome completo', req: 1, wide: 1 }, CAMPO_CPF, { k: 'nascimento', l: 'Data de nascimento', t: 'date', req: 1 }, { k: 'sexo', l: 'Sexo', t: 'select', o: L('sexos'), req: 1 }, { k: 'estadoCivil', l: 'Estado civil', t: 'select', o: L('estadosCivis'), req: 1 }, { k: 'telefone', l: 'Telefone', t: 'tel' }, { k: 'email', l: 'E-mail', t: 'email' }],
  sort: (a, b) => a.nome.localeCompare(b.nome),
  after: r => { r.cpf = String(r.cpf || '').replace(/\D/g, ''); r.telefones = [r.telefone || (r.telefones || [])[0] || ''].filter(Boolean); },
  check: (v, id) => !cpfValido(v.cpf) ? 'O CPF não é válido. Confira os 11 números.' : cpfDuplicado(v.cpf, 'pessoas', id) ? 'Já existe uma pessoa com esse CPF.' : '',
  cols: [['Pessoa', r => `${esc(r.nome)}${caption2(r.cpf ? 'CPF ' + esc(formatarCPF(r.cpf)) : 'CPF não informado')}`], ['Contato', r => `${esc((r.telefones || [])[0] || '—')}${caption2(esc(r.email || ''))}`], ['Estado civil', r => esc(r.estadoCivil || '—')], ['Diretor de', r => esc(DADOS.escolas.filter(e => e.diretorId === r.id).map(e => e.nome).join(', ') || '—')]],
  canEdit: () => SESSION.role === 'secretario', canNew: () => SESSION.role === 'secretario'
};
// Ao editar, o telefone principal aparece no campo
const openFormAntesPessoas = openForm;
openForm = function (key, id, def) { if (key === 'pessoas' && id) { const p = byId('pessoas', id); if (p) p.telefone = (p.telefones || [])[0] || ''; } return openFormAntesPessoas(key, id, def); };
PAGES.secretario.pessoas = () => crudPage('pessoas');
NAV.secretario.splice(2, 0, ['pessoas', 'Pessoas', 'users']);
