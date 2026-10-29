/* Escolas: cadastro, endereço e filtros em cascata (DR → Município → Escola) */
'use strict';
// Campos derivados que as telas antigas ainda leem (cidade, bairro, nome do diretor)
function projetarEscola(e) {
  e.cidade = regionalService.nomeMunicipio(e.municipioId) ? `${regionalService.nomeMunicipio(e.municipioId)}, SE` : e.cidade || '';
  e.bairro = e.endereco.bairro;
  const dir = (ARMAZEM.pessoas || []).find(p => p.id === e.diretorId) || ARMAZEM.professores.find(p => p.pessoa?.id === e.diretorId)?.pessoa;
  e.diretor = dir ? dir.nome : '';
}
const escolaRepo = criarRepositorio('escolas', {
  modelo: Modelos.escola,
  validar: e => {
    if (!e.nome) return 'Informe o nome da escola.';
    if (!/^\d{8}$/.test(e.inep)) return 'O código INEP tem 8 dígitos.';
    if (ARMAZEM.escolas.some(x => x.id !== e.id && x.inep === e.inep)) return 'Já existe uma escola com esse código INEP.';
    if (!e.drId) return 'Escolha a Diretoria Regional.';
    if (!e.municipioId || regionalService.drDoMunicipio(e.municipioId) !== e.drId) return 'Escolha um município da Diretoria Regional selecionada.';
  },
  aoSalvar: projetarEscola,
  aoRemover: e => { ARMAZEM.infraestruturas = (ARMAZEM.infraestruturas || []).filter(i => i.id !== e.id); }
});
const escolaService = Object.assign({}, escolaRepo, {
  /** Filtro em cascata: cada nível só vale dentro do anterior. */
  async filtrar({ drId = '', municipioId = '', escolaId = '' } = {}) {
    return escolaRepo.listar(e => (!drId || e.drId === drId) && (!municipioId || e.municipioId === municipioId) && (!escolaId || e.id === escolaId));
  },
  async atualizarEndereco(id, endereco) { return escolaRepo.atualizar(id, { endereco: Modelos.endereco(endereco) }); }
});

SERVICOS.escolas = escolaService;
