/* Diretorias Regionais e municípios (somente leitura; os dados vêm de mock/sergipe.js) */
'use strict';
const regionalService = {
  async listar() { await espera(); return clone(MOCK_DIRETORIAS); },
  async buscarPorId(id) { await espera(); return clone(MOCK_DIRETORIAS.find(d => d.id === id)) || null; },
  async municipiosDe(drId) { await espera(); return clone(MOCK_DIRETORIAS.find(d => d.id === drId)?.municipios || []); },
  // Consultas síncronas para rótulos em telas antigas
  nomeMunicipio: id => MOCK_DIRETORIAS.flatMap(d => d.municipios).find(m => m.id === id)?.nome || '',
  siglaDR: id => MOCK_DIRETORIAS.find(d => d.id === id)?.sigla || '',
  drDoMunicipio: id => MOCK_DIRETORIAS.find(d => d.municipios.some(m => m.id === id))?.id || ''
};
