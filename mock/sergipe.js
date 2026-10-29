/* Mock: Diretorias Regionais da rede estadual de Sergipe e seus municípios.
   Fonte pedida: seduc.se.gov.br (antigo seed.se.gov.br). Em out/2026 o site não publica a lista de municípios por DRE
   (conferidos: página inicial, Institucional, Estrutura Organizacional, Contatos e Transparência).
   - DEA: confirmado (contém só Aracaju).
   - DRE 1 a DRE 10: a confirmar com a SEDUC. Complete "sede" e "municipios" e troque aConfirmar para false.
   Basta editar esta lista; o resto do sistema lê daqui pelo regionalService. */
'use strict';

const MOCK_DIRETORIAS = [
  { id: 'dea', sigla: 'DEA', nome: 'Diretoria de Educação de Aracaju', sede: 'Aracaju', aConfirmar: false, municipios: ['Aracaju'] },
  { id: 'dre1', sigla: 'DRE 1', nome: 'Diretoria Regional de Educação 1', sede: 'Estância', aConfirmar: true, municipios: ['Estância', 'Boquim', 'Umbaúba', 'Itabaianinha'] },
  { id: 'dre2', sigla: 'DRE 2', nome: 'Diretoria Regional de Educação 2', sede: 'Lagarto', aConfirmar: true, municipios: ['Lagarto', 'Simão Dias', 'Riachão do Dantas'] },
  { id: 'dre3', sigla: 'DRE 3', nome: 'Diretoria Regional de Educação 3', sede: 'Itabaiana', aConfirmar: true, municipios: ['Itabaiana', 'Campo do Brito', 'Areia Branca'] },
  { id: 'dre4', sigla: 'DRE 4', nome: 'Diretoria Regional de Educação 4', sede: '', aConfirmar: true, municipios: [] },
  { id: 'dre5', sigla: 'DRE 5', nome: 'Diretoria Regional de Educação 5', sede: '', aConfirmar: true, municipios: [] },
  { id: 'dre6', sigla: 'DRE 6', nome: 'Diretoria Regional de Educação 6', sede: '', aConfirmar: true, municipios: [] },
  { id: 'dre7', sigla: 'DRE 7', nome: 'Diretoria Regional de Educação 7', sede: '', aConfirmar: true, municipios: [] },
  { id: 'dre8', sigla: 'DRE 8', nome: 'Diretoria Regional de Educação 8', sede: '', aConfirmar: true, municipios: [] },
  { id: 'dre9', sigla: 'DRE 9', nome: 'Diretoria Regional de Educação 9', sede: '', aConfirmar: true, municipios: [] },
  { id: 'dre10', sigla: 'DRE 10', nome: 'Diretoria Regional de Educação 10', sede: '', aConfirmar: true, municipios: [] }
].map(d => Modelos.diretoriaRegional(Object.assign({}, d, { municipios: d.municipios.map(n => ({ id: d.id + '-' + norm(n).replace(/[^a-z0-9]+/g, '-'), nome: n })) })));

const MOCK_CURSOS = [
  ['c1', 'Ensino Fundamental – Anos Iniciais', 'Ensino Fundamental'],
  ['c2', 'Ensino Fundamental – Anos Finais', 'Ensino Fundamental'],
  ['c3', 'Ensino Médio', 'Ensino Médio'],
  ['c4', 'Ensino Médio em Tempo Integral', 'Ensino Médio'],
  ['c5', 'Ensino Técnico', 'Educação Profissional'],
  ['c6', 'Ensino Médio com Técnico em Programação para Internet', 'Educação Profissional'],
  ['c7', 'Ensino Médio com Técnico em Desenvolvimento Mobile', 'Educação Profissional'],
  ['c8', 'Ensino Médio com Técnico em Redes de Computadores', 'Educação Profissional']
].map(([id, nome, etapa]) => Modelos.curso({ id, nome, etapa }));

// Matriz de exemplo do Ensino Médio (carga horária anual em horas)
const MOCK_MATRIZES = [Modelos.matriz({
  id: 'm-c3', cursoId: 'c3',
  series: ['1ª série', '2ª série', '3ª série'].map((nome, i) => ({
    id: `m-c3-s${i + 1}`, nome,
    componentes: [['Língua Portuguesa', 160], ['Matemática', 160], ['História', 80], ['Geografia', 80], ['Física', 80], ['Química', 80], ['Biologia', 80], ['Inglês', 80], ['Educação Física', 80], ['Arte', 40], ['Filosofia', 40], ['Sociologia', 40]]
      .map(([n, ch]) => ({ id: `m-c3-s${i + 1}-${norm(n).replace(/[^a-z]+/g, '')}`, nome: n, cargaHoraria: ch }))
  }))
})];

const RECURSOS_INFRA = ['Rampa de acesso', 'Banheiro adaptado', 'Piso tátil', 'Elevador', 'Sala de recursos multifuncionais', 'Corrimão', 'Sinalização em braille'];
