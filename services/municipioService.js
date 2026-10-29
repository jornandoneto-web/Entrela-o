/* Municípios por estado, para os campos de cidade virarem lista.
   Sergipe vem completo do mock (75 municípios). Os outros estados vêm da API pública do IBGE;
   se ela não responder (sem internet ou bloqueada), a tela volta a aceitar a cidade digitada. */
'use strict';

const UFS_BR = [['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'], ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'], ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins']];
const MUNICIPIOS_SE = ['Amparo de São Francisco', 'Aquidabã', 'Aracaju', 'Arauá', 'Areia Branca', 'Barra dos Coqueiros', 'Boquim', 'Brejo Grande', 'Campo do Brito', 'Canhoba', 'Canindé de São Francisco', 'Capela', 'Carira', 'Carmópolis', 'Cedro de São João', 'Cristinápolis', 'Cumbe', 'Divina Pastora', 'Estância', 'Feira Nova', 'Frei Paulo', 'Gararu', 'General Maynard', 'Gracho Cardoso', 'Ilha das Flores', 'Indiaroba', 'Itabaiana', 'Itabaianinha', 'Itabi', "Itaporanga d'Ajuda", 'Japaratuba', 'Japoatã', 'Lagarto', 'Laranjeiras', 'Macambira', 'Malhada dos Bois', 'Malhador', 'Maruim', 'Moita Bonita', 'Monte Alegre de Sergipe', 'Muribeca', 'Neópolis', 'Nossa Senhora Aparecida', 'Nossa Senhora da Glória', 'Nossa Senhora das Dores', 'Nossa Senhora de Lourdes', 'Nossa Senhora do Socorro', 'Pacatuba', 'Pedra Mole', 'Pedrinhas', 'Pinhão', 'Pirambu', 'Poço Redondo', 'Poço Verde', 'Porto da Folha', 'Propriá', 'Riachão do Dantas', 'Riachuelo', 'Ribeirópolis', 'Rosário do Catete', 'Salgado', 'Santa Luzia do Itanhy', 'Santa Rosa de Lima', 'Santana do São Francisco', 'Santo Amaro das Brotas', 'São Cristóvão', 'São Domingos', 'São Francisco', 'São Miguel do Aleixo', 'Simão Dias', 'Siriri', 'Telha', 'Tobias Barreto', 'Tomar do Geru', 'Umbaúba'];
const cacheMunicipios = { SE: MUNICIPIOS_SE };

const municipioService = {
  /** Nomes dos municípios da UF, em ordem alfabética. Lista vazia quando não foi possível obter. */
  async listarPorUF(uf) {
    if (!uf) return [];
    if (cacheMunicipios[uf]) return cacheMunicipios[uf].slice();
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) return [];
      const lista = (await r.json()).map(m => m.nome).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      cacheMunicipios[uf] = lista; return lista.slice();
    } catch (e) { return []; }
  },
  // Órgãos de onde um professor pode vir cedido
  orgaosCedentes: () => ['Governo Federal', 'Governo de outro estado', ...MUNICIPIOS_SE.map(m => `Prefeitura de ${m}`)]
};

// Ao abrir uma tela ou formulário com Estado e Cidade, carrega a lista de cidades do estado já escolhido
HYDRATORS.push(root => root.querySelectorAll('[data-cidade]').forEach(b => preencherCidades(b.dataset.cidade, true)));
