/* Camada de serviço mock: simula um back-end.
   As telas falam só com os serviços. Para usar uma API real, troque o corpo destas funções por chamadas fetch
   (ex.: listar → GET /escolas, salvar → POST /escolas); as telas não precisam mudar.
   O "banco" do mock é o armazenamento do navegador que o projeto já usa (DB + save()). */
'use strict';

const LATENCIA_MS = 0; // aumente para simular a demora da rede
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
const espera = () => new Promise(r => setTimeout(r, LATENCIA_MS));

/** Repositório genérico de uma coleção.
 *  @param {string} colecao nome da coleção no armazenamento
 *  @param {{ modelo?: (o:any)=>any, validar?: (o:any)=>(string|void|Promise<string|void>), aoSalvar?: (o:any)=>void, aoRemover?: (o:any)=>void }} opcoes */
function criarRepositorio(colecao, opcoes = {}) {
  const { modelo = x => x, validar, aoSalvar, aoRemover } = opcoes;
  const dados = () => (DB[colecao] = DB[colecao] || []);
  const repo = {
    async listar(filtro) { await espera(); const l = dados().map(clone); return filtro ? l.filter(filtro) : l; },
    async buscarPorId(id) { await espera(); return clone(dados().find(x => x.id === id)) || null; },
    async salvar(obj) {
      await espera();
      const novo = modelo(Object.assign({}, clone(obj), { id: obj.id || uid() }));
      if (validar) { const erro = await validar(novo); if (erro) throw new Error(erro); }
      if (aoSalvar) aoSalvar(novo);
      const i = dados().findIndex(x => x.id === novo.id);
      if (i >= 0) dados()[i] = novo; else dados().push(novo);
      save(); return clone(novo);
    },
    async atualizar(id, parcial) {
      const atual = dados().find(x => x.id === id);
      if (!atual) throw new Error('Registro não encontrado.');
      return repo.salvar(Object.assign(clone(atual), clone(parcial), { id }));
    },
    async remover(id) {
      await espera(); const i = dados().findIndex(x => x.id === id);
      if (i >= 0) { const [r] = dados().splice(i, 1); if (aoRemover) aoRemover(r); }
      save(); return true;
    }
  };
  return repo;
}
// Serviço genérico para as telas de cadastro simples (turmas, disciplinas, eventos, comunicados...)
const SERVICOS = {};
const servico = colecao => SERVICOS[colecao] || (SERVICOS[colecao] = criarRepositorio(colecao));
