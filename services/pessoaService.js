/* Pessoas: as avulsas (diretores, servidores) e as que estão dentro do cadastro de professores */
'use strict';
const pessoaRepo = criarRepositorio('pessoas', { modelo: Modelos.pessoa, validar: p => p.nome ? '' : 'Informe o nome.' });
const pessoaService = Object.assign({}, pessoaRepo, {
  /** Todas as pessoas cadastradas, para selects como "Diretor da escola". */
  async listarTodas() {
    const avulsas = await pessoaRepo.listar();
    const profs = (await professorService.listar()).map(p => p.pessoa);
    return [...avulsas, ...profs].sort((a, b) => a.nome.localeCompare(b.nome));
  }
});
