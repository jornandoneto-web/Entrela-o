/* Mock: Diretorias Regionais de Sergipe e seus municípios.
   Fonte pedida: filtro por diretoria de seduc.se.gov.br/escolas (painel Power BI). O painel não abriu fora do navegador do
   usuário, e nenhuma outra página da SEDUC publica a lista.
   - DEA = Aracaju: confirmado. DR8 = municípios em volta de Aracaju: citado na mentoria.
   - TODO(confirmar): a distribuição abaixo cobre os 75 municípios, mas é uma proposta. Confira cada DR no painel da SEDUC,
     corrija aqui e troque aConfirmar para false. Basta editar esta lista. */
'use strict';

const MOCK_DIRETORIAS = [
  { id: 'dea', sigla: 'DEA', nome: 'Diretoria de Educação de Aracaju', sede: 'Aracaju', aConfirmar: false, municipios: ['Aracaju'] },
  { id: 'dre1', sigla: 'DR1', nome: 'Diretoria Regional de Educação 1', sede: 'Estância', aConfirmar: true, municipios: ['Arauá', 'Boquim', 'Cristinápolis', 'Estância', 'Indiaroba', 'Itabaianinha', 'Pedrinhas', 'Santa Luzia do Itanhy', 'Tomar do Geru', 'Umbaúba'] },
  { id: 'dre2', sigla: 'DR2', nome: 'Diretoria Regional de Educação 2', sede: 'Lagarto', aConfirmar: true, municipios: ['Lagarto', 'Poço Verde', 'Riachão do Dantas', 'Salgado', 'Simão Dias', 'Tobias Barreto'] },
  { id: 'dre3', sigla: 'DR3', nome: 'Diretoria Regional de Educação 3', sede: 'Itabaiana', aConfirmar: true, municipios: ['Areia Branca', 'Campo do Brito', 'Itabaiana', 'Macambira', 'Malhador', 'Moita Bonita', 'São Domingos'] },
  { id: 'dre4', sigla: 'DR4', nome: 'Diretoria Regional de Educação 4', sede: 'Japaratuba', aConfirmar: true, municipios: ['Capela', 'Carmópolis', 'General Maynard', 'Japaratuba', 'Pirambu', 'Rosário do Catete', 'Siriri'] },
  { id: 'dre5', sigla: 'DR5', nome: 'Diretoria Regional de Educação 5', sede: 'Propriá', aConfirmar: true, municipios: ['Amparo de São Francisco', 'Canhoba', 'Cedro de São João', 'Malhada dos Bois', 'Propriá', 'São Francisco', 'Telha'] },
  { id: 'dre6', sigla: 'DR6', nome: 'Diretoria Regional de Educação 6', sede: 'Neópolis', aConfirmar: true, municipios: ['Brejo Grande', 'Ilha das Flores', 'Japoatã', 'Muribeca', 'Neópolis', 'Pacatuba', 'Santana do São Francisco'] },
  { id: 'dre7', sigla: 'DR7', nome: 'Diretoria Regional de Educação 7', sede: 'Nossa Senhora das Dores', aConfirmar: true, municipios: ['Aquidabã', 'Cumbe', 'Feira Nova', 'Gracho Cardoso', 'Itabi', 'Nossa Senhora das Dores', 'Nossa Senhora de Lourdes'] },
  { id: 'dre8', sigla: 'DR8', nome: 'Diretoria Regional de Educação 8', sede: 'Nossa Senhora do Socorro', aConfirmar: true, municipios: ['Barra dos Coqueiros', 'Divina Pastora', "Itaporanga d'Ajuda", 'Laranjeiras', 'Maruim', 'Nossa Senhora do Socorro', 'Riachuelo', 'Santa Rosa de Lima', 'Santo Amaro das Brotas', 'São Cristóvão'] },
  { id: 'dre9', sigla: 'DR9', nome: 'Diretoria Regional de Educação 9', sede: 'Nossa Senhora da Glória', aConfirmar: true, municipios: ['Canindé de São Francisco', 'Gararu', 'Monte Alegre de Sergipe', 'Nossa Senhora da Glória', 'Poço Redondo', 'Porto da Folha'] },
  { id: 'dre10', sigla: 'DR10', nome: 'Diretoria Regional de Educação 10', sede: 'Carira', aConfirmar: true, municipios: ['Carira', 'Frei Paulo', 'Nossa Senhora Aparecida', 'Pedra Mole', 'Pinhão', 'Ribeirópolis', 'São Miguel do Aleixo'] }
].map(d => Modelos.diretoriaRegional(Object.assign({}, d, { municipios: d.municipios.map(n => ({ id: d.id + '-' + norm(n).replace(/[^a-z0-9]+/g, '-'), nome: n })) })));

// Modalidades básicas (cadastro de cursos: outras podem ser adicionadas pelo DED)
const MOCK_CURSOS = [['c1', 'Anos Iniciais', 'Ensino Fundamental'], ['c2', 'Anos Finais', 'Ensino Fundamental'], ['c3', 'Ensino Médio', 'Ensino Médio']].map(([id, nome, etapa]) => Modelos.curso({ id, nome, etapa }));

const MOCK_MATRIZES = [Modelos.matriz({
  id: 'm-c3', cursoId: 'c3',
  series: ['1ª série', '2ª série', '3ª série'].map((nome, i) => ({
    id: `m-c3-s${i + 1}`, nome,
    componentes: [['Língua Portuguesa', 160], ['Matemática', 160], ['História', 80], ['Geografia', 80], ['Física', 80], ['Química', 80], ['Biologia', 80], ['Inglês', 80], ['Educação Física', 80], ['Arte', 40], ['Filosofia', 40], ['Sociologia', 40]]
      .map(([n, ch]) => ({ id: `m-c3-s${i + 1}-${norm(n).replace(/[^a-z]+/g, '')}`, nome: n, cargaHoraria: ch }))
  }))
})];

