/* Listas gerenciáveis: toda opção de select ou caixa de marcar vem daqui, e cada lista tem sua tela em Cadastros auxiliares. */
'use strict';
const listaRepo = criarRepositorio('listas', {
  modelo: o => Object.assign(Modelos.itemLista(o), { sistema: !!o.sistema }),
  validar: i => {
    if (!i.nome) return 'Informe o nome.';
    if ((ARMAZEM.listas || []).some(x => x.id !== i.id && x.tipo === i.tipo && norm(x.nome) === norm(i.nome))) return 'Esse item já existe nesta lista.';
  }
});
const listaService = Object.assign({}, listaRepo, {
  async porTipo(tipo) { return (await listaRepo.listar(x => x.tipo === tipo)).sort((a, b) => a.ordem - b.ordem); },
  async alternar(id) { const x = await listaRepo.buscarPorId(id); return listaRepo.salvar(Object.assign(x, { ativo: !x.ativo })); }
});
SERVICOS.listas = listaRepo;
