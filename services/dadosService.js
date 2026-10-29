/* dadosService: carrega, pelos serviços, os dados que as telas usam e grava de volta o que as telas mudaram.
   Padrão "unidade de trabalho": antes de cada tela abrir, carregar() pede cada coleção ao seu serviço e guarda uma
   cópia em DADOS. A tela lê e altera só essa cópia. Ao salvar, gravar() compara a cópia com o que foi carregado e
   envia cada registro novo, alterado ou removido ao serviço da coleção, que valida e grava.
   Assim nenhuma tela acessa o armazenamento: com um back-end real, só os serviços mudam. */
'use strict';

// Dados que não são listas de registros (configurações, notas por aluno, cardápio, permissões)
const DOCUMENTOS = ['config', 'notas', 'cardapio', 'perfis', 'migracoes', 'v', 'demo'];
const documentoService = nome => ({
  async obter() { await espera(); return clone(ARMAZEM[nome]); },
  async salvar(valor) { await espera(); ARMAZEM[nome] = clone(valor); persistirArmazem(); return clone(valor); }
});

let CARREGADO = {};            // texto de cada registro como veio do serviço, para saber o que mudou
let FILA = Promise.resolve();  // gravações em ordem; carregar() espera a fila terminar
const ehColecao = k => Array.isArray(ARMAZEM[k]) && !DOCUMENTOS.includes(k);

const dadosService = {
  /** Carrega todas as coleções e documentos pelos serviços. Registros que não mudaram mantêm o mesmo objeto. */
  async carregar() {
    await FILA;
    const novo = {}, marcas = {};
    await Promise.all(Object.keys(ARMAZEM).filter(ehColecao).map(async c => {
      const lista = await servico(c).listar();
      const antes = new Map((DADOS[c] || []).filter(x => x && x.id != null).map(x => [x.id, x]));
      marcas[c] = {};
      novo[c] = lista.map(x => { const t = JSON.stringify(x); marcas[c][x.id] = t; const a = antes.get(x.id); return a && JSON.stringify(a) === t ? a : x; });
    }));
    for (const d of DOCUMENTOS) { novo[d] = await documentoService(d).obter(); marcas['§' + d] = JSON.stringify(novo[d]); }
    CARREGADO = marcas; DADOS = novo;
    return DADOS;
  },
  /** Envia aos serviços o que mudou em DADOS desde o último carregamento. */
  gravar() {
    FILA = FILA.then(async () => {
      for (const c of Object.keys(DADOS)) {
        if (DOCUMENTOS.includes(c) || !Array.isArray(DADOS[c])) continue;
        const antes = CARREGADO[c] || {}; const vistos = new Set();
        for (const item of DADOS[c]) {
          if (!item || item.id == null) continue;
          vistos.add(item.id); const t = JSON.stringify(item);
          if (antes[item.id] !== t) { await servico(c).salvar(item); antes[item.id] = t; }
        }
        for (const id of Object.keys(antes)) if (!vistos.has(id)) { await servico(c).remover(id); delete antes[id]; }
        CARREGADO[c] = antes;
      }
      for (const d of DOCUMENTOS) {
        const t = JSON.stringify(DADOS[d]);
        if (CARREGADO['§' + d] !== t) { await documentoService(d).salvar(DADOS[d]); CARREGADO['§' + d] = t; }
      }
    }).catch(e => { toast('Não foi possível salvar: ' + e.message, 'err'); alertSR('Não foi possível salvar: ' + e.message); });
    return FILA;
  }
};
