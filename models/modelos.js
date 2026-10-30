/* Portal Entrelaço — modelos de dados.
   Cada função recebe um objeto parcial e devolve o objeto completo, com todos os campos e tipos certos.
   As telas montam objetos com estas funções e os entregam aos serviços (pasta services/).
   Composição: um objeto pode conter outros. Ex.: Professor tem uma Pessoa, uma lista de Vinculo e uma lista de Dependente.
   Referência (e não composição): Lotacao aponta para um Professor e uma Escola pelo id, sem ficar dentro deles. */
'use strict';

/** @typedef {{ id: string, nome: string, uf: string }} Municipio */
/** @typedef {{ id: string, sigla: string, nome: string, sede: string, municipios: Municipio[], aConfirmar: boolean }} DiretoriaRegional */
/** @typedef {{ cep: string, logradouro: string, numero: string, complemento: string, bairro: string, cidade: string, uf: string }} Endereco */
/** @typedef {{ id: string, nome: string, inep: string, drId: string, municipioId: string, endereco: Endereco, telefone: string, diretorId: string, cursos: string[], integracao: string }} Escola */
/** @typedef {{ id: string, nome: string, etapa: string, descricao: string }} Curso */
/** @typedef {{ id: string, nome: string, cargaHoraria: number }} ComponenteCurricular */
/** @typedef {{ id: string, nome: string, componentes: ComponenteCurricular[] }} Serie */
/** @typedef {{ id: string, cursoId: string, series: Serie[] }} Matriz */
/** @typedef {{ escolaId: string, salasAula: number, salasTI: number, laboratorios: number, tiposLaboratorio: string, banheiros: number, salasProfessores: number, possuiGinasio: boolean, recursosAcessibilidade: string[] }} InfraestruturaEscola */
/** @typedef {{ id: string, nome: string, cpf: string, nascimento: string, sexo: string, estadoCivil: string, telefones: string[], email: string, naturalidade: { cidade: string, uf: string }, endereco: Endereco }} Pessoa */
/** @typedef {{ id: string, nome: string, parentesco: string, nascimento: string }} Dependente */
/** @typedef {{ id: string, nome: string, disciplinas: string[] }} Formacao */
/** @typedef {{ id: string, cargo: string, formacoes: string[], disciplinas: string[], ingresso: string, orgaoOrigem: string, dataInicio: string, dataFim: string, cargaHoraria: number, anexoContrato: string }} Vinculo */
/** @typedef {{ id: string, pessoa: Pessoa, dependentes: Dependente[], vinculos: Vinculo[] }} Professor */
/** @typedef {{ id: string, professorId: string, vinculoId: string, escolaId: string, cargaHoraria: number, dataInicio: string, dataFim: string }} Lotacao */

const txt = v => v == null ? '' : String(v).trim();
const numero = (v, padrao = 0) => { const n = Number(v); return isNaN(n) ? padrao : n; };
const lista = v => Array.isArray(v) ? v.slice() : [];
const novoId = v => v || uid();

const Modelos = {
  /** @returns {Municipio} */
  municipio: (o = {}) => ({ id: novoId(o.id), nome: txt(o.nome), uf: txt(o.uf) || 'SE' }),
  /** @returns {DiretoriaRegional} */
  diretoriaRegional: (o = {}) => ({ id: novoId(o.id), sigla: txt(o.sigla), nome: txt(o.nome), sede: txt(o.sede), municipios: lista(o.municipios).map(Modelos.municipio), aConfirmar: !!o.aConfirmar }),
  /** @returns {Endereco} */
  endereco: (o = {}) => ({ cep: txt(o.cep), logradouro: txt(o.logradouro), numero: txt(o.numero), complemento: txt(o.complemento), bairro: txt(o.bairro), cidade: txt(o.cidade), uf: txt(o.uf) }),
  /** @returns {Escola} */
  escola: (o = {}) => Object.assign({}, o, {
    id: novoId(o.id), nome: txt(o.nome), inep: txt(o.inep), drId: txt(o.drId), municipioId: txt(o.municipioId),
    endereco: Modelos.endereco(typeof o.endereco === 'object' && o.endereco ? o.endereco : {}),
    telefone: txt(o.telefone), diretorId: txt(o.diretorId), cursos: lista(o.cursos), integracao: txt(o.integracao) || 'Sistema Entrelaço'
  }),
  /** @returns {Curso} */
  curso: (o = {}) => ({ id: novoId(o.id), nome: txt(o.nome), etapa: txt(o.etapa), descricao: txt(o.descricao) }),
  /** @returns {ComponenteCurricular} */
  componenteCurricular: (o = {}) => ({ id: novoId(o.id), nome: txt(o.nome), cargaHoraria: numero(o.cargaHoraria) }),
  /** @returns {Serie} */
  serie: (o = {}) => ({ id: novoId(o.id), nome: txt(o.nome), componentes: lista(o.componentes).map(Modelos.componenteCurricular) }),
  /** @returns {Matriz} */
  matriz: (o = {}) => ({ id: novoId(o.id), cursoId: txt(o.cursoId), series: lista(o.series).map(Modelos.serie) }),
  /** @returns {InfraestruturaEscola} */
  infraestruturaEscola: (o = {}) => ({
    escolaId: txt(o.escolaId), salasAula: numero(o.salasAula), salasTI: numero(o.salasTI), laboratorios: numero(o.laboratorios), tiposLaboratorio: txt(o.tiposLaboratorio),
    banheiros: numero(o.banheiros), salasProfessores: numero(o.salasProfessores), possuiGinasio: o.possuiGinasio === true || o.possuiGinasio === 'sim',
    recursosAcessibilidade: lista(o.recursosAcessibilidade).map(txt).filter(Boolean)
  }),
  /** @returns {Pessoa} */
  pessoa: (o = {}) => ({
    id: novoId(o.id), nome: txt(o.nome), cpf: txt(o.cpf), nascimento: txt(o.nascimento), sexo: txt(o.sexo), estadoCivil: txt(o.estadoCivil),
    telefones: lista(o.telefones).map(txt).filter(Boolean), email: txt(o.email),
    naturalidade: { cidade: txt(o.naturalidade?.cidade), uf: txt(o.naturalidade?.uf) }, endereco: Modelos.endereco(o.endereco || {})
  }),
  /** @returns {Dependente} */
  dependente: (o = {}) => ({ id: novoId(o.id), nome: txt(o.nome), parentesco: txt(o.parentesco), nascimento: txt(o.nascimento) }),
  /** @returns {Formacao} */
  formacao: (o = {}) => Object.assign({}, o, { id: novoId(o.id), nome: txt(o.nome), disciplinas: lista(o.disciplinas) }),
  /** @returns {Vinculo} Carga horária padrão de 25 h; integral, 40 h. */
  vinculo: (o = {}) => ({
    id: novoId(o.id), cargo: txt(o.cargo) || 'Professor', disciplinas: lista(o.disciplinas),
    ingresso: txt(o.ingresso) || 'Concurso', orgaoOrigem: txt(o.orgaoOrigem), dataInicio: txt(o.dataInicio), dataFim: txt(o.dataFim),
    cargaHoraria: numero(o.cargaHoraria, 25) || 25, anexoContrato: txt(o.anexoContrato)
  }),
  /** @returns {Professor} */
  professor: (o = {}) => Object.assign({}, o, {
    id: novoId(o.id), pessoa: Modelos.pessoa(o.pessoa || {}), habilitacoes: lista(o.habilitacoes).map(Modelos.habilitacao), dependentes: lista(o.dependentes).map(Modelos.dependente), vinculos: lista(o.vinculos).map(Modelos.vinculo)
  }),
  /** Item de uma lista gerenciável (Cadastros auxiliares). */
  itemLista: (o = {}) => ({ id: novoId(o.id), tipo: txt(o.tipo), nome: txt(o.nome), ativo: o.ativo !== false, ordem: numero(o.ordem) }),
  /** Faixa de horário de um turno (1º horário, 2º horário...). */
  faixaHorario: (o = {}) => ({ id: novoId(o.id), turno: txt(o.turno), ordem: numero(o.ordem), inicio: txt(o.inicio), fim: txt(o.fim) }),
  /** Formação de um professor: o curso (cadastro de Formações), onde e quando concluiu. */
  habilitacao: (o = {}) => ({ id: novoId(o.id), formacaoId: txt(o.formacaoId), instituicao: txt(o.instituicao), anoConclusao: txt(o.anoConclusao) }),
  /** Cadastro básico do estudante (matrícula). A senha nunca é guardada no mock. */
  estudante: (o = {}) => ({
    id: novoId(o.id), responsavelId: txt(o.responsavelId), nome: txt(o.nome), nascimento: txt(o.nascimento), sexo: txt(o.sexo), filiacao: txt(o.filiacao), cpf: txt(o.cpf).replace(/\D/g, ''), nis: txt(o.nis), cartaoSUS: txt(o.cartaoSUS),
    corRaca: txt(o.corRaca), bolsaFamilia: txt(o.bolsaFamilia), termoVacinacao: txt(o.termoVacinacao) || 'Não assinado', rg: txt(o.rg), rgOrgao: txt(o.rgOrgao), rgUF: txt(o.rgUF), rgEmissao: txt(o.rgEmissao), email: txt(o.email), telefone: txt(o.telefone), necessidade: txt(o.necessidade) || 'Nenhuma'
  }),
  /** @returns {Lotacao} */
  lotacao: (o = {}) => ({ id: novoId(o.id), professorId: txt(o.professorId), vinculoId: txt(o.vinculoId), escolaId: txt(o.escolaId), cargaHoraria: numero(o.cargaHoraria), dataInicio: txt(o.dataInicio), dataFim: txt(o.dataFim) })
};

// Regras simples usadas por mais de uma tela
const vinculoAtivo = v => !!v && (!v.dataFim || v.dataFim >= TODAY_ISO);
// dataFim da lotação = data de saída: nesse dia o professor já não está na escola e as horas ficam livres
const lotacaoAtiva = l => !!l && (!l.dataFim || l.dataFim > TODAY_ISO);
function cpfValido(c) {
  const d = String(c || '').replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dig = n => { let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  return dig(9) === Number(d[9]) && dig(10) === Number(d[10]);
}
const formatarCPF = c => { const d = String(c || '').replace(/\D/g, '').slice(0, 11); return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : c; };
