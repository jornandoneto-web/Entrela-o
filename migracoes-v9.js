/* Migração 8 → 9 (mentoria de 15/10/2026): escolas com DR e município, cursos e matrizes, infraestrutura,
   professores com Pessoa + Dependentes + Vínculos e lotações separadas. Os dados atuais são convertidos, não apagados. */
'use strict';

function gerarCPF(n) { // CPF válido a partir de um número de 9 dígitos (só para dados de exemplo)
  const d = String(n).padStart(9, '0').split('').map(Number);
  const dv = k => { const s = d.slice(0, k).reduce((t, x, i) => t + x * (k + 1 - i), 0); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  d.push(dv(9)); d.push(dv(10)); return d.join('');
}
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function migrarV9(db) {
  const demo = db.demo !== false;
  // Cursos, matrizes e novas coleções
  db.cursos = db.cursos || clone(MOCK_CURSOS);
  db.matrizes = db.matrizes || clone(MOCK_MATRIZES);
  db.pessoas = db.pessoas || []; db.lotacoes = db.lotacoes || []; db.infraestruturas = db.infraestruturas || [];
  if (!db.disciplinas.some(d => d.id === 'd9')) db.disciplinas.push({ id: 'd9', nome: 'Arte', area: 'Linguagens', ch: 40 });
  if (!db.formacoes.some(f => f.id === 'f11')) db.formacoes.push({ id: 'f11', nome: 'Licenciatura em Artes Visuais', disciplinas: ['d9'], chaves: ['artes'] });

  // Escolas: DR e município, endereço como objeto, diretor como pessoa, acessibilidade vai para a infraestrutura
  const DEMO_ESC = {
    e1: { nome: 'Escola Estadual Entrelaço — Unidade Centro', inep: '28001234', drId: 'dea', municipioId: 'dea-aracaju', telefone: '(79) 3179-1100', endereco: { logradouro: 'Rua de Itabaiana', numero: '1200', bairro: 'Centro', cep: '49010-170', cidade: 'Aracaju', uf: 'SE' }, cursos: ['c3'], infra: [14, 2, 3, 12, 1, true] },
    e2: { nome: 'Escola Estadual Entrelaço — Unidade Atalaia', inep: '28005678', drId: 'dea', municipioId: 'dea-aracaju', telefone: '(79) 3179-4400', endereco: { logradouro: 'Av. Santos Dumont', numero: '3400', bairro: 'Atalaia', cep: '49037-475', cidade: 'Aracaju', uf: 'SE' }, cursos: ['c3', 'c6'], infra: [10, 1, 1, 8, 1, false] },
    e3: { inep: '28014011', drId: 'dre3', municipioId: 'dre3-itabaiana', telefone: '(79) 3431-2200', endereco: { logradouro: 'Rua das Acácias', numero: '88', bairro: 'Centro', cep: '49500-000', cidade: 'Itabaiana', uf: 'SE' }, cursos: ['c2', 'c3'], infra: [18, 1, 2, 14, 2, true] },
    e4: { inep: '28014022', drId: 'dre2', municipioId: 'dre2-lagarto', telefone: '(79) 3631-7710', endereco: { logradouro: 'Av. Contorno', numero: '1500', bairro: 'Horta', cep: '49400-000', cidade: 'Lagarto', uf: 'SE' }, cursos: ['c4'], infra: [16, 2, 4, 12, 2, true] },
    e5: { inep: '28014033', drId: 'dre1', municipioId: 'dre1-estancia', telefone: '(79) 3522-4090', endereco: { logradouro: 'Rua Vila Nova', numero: '230', bairro: 'Cidade Nova', cep: '49200-000', cidade: 'Estância', uf: 'SE' }, cursos: ['c1', 'c2', 'c3'], infra: [12, 1, 1, 10, 1, false] }
  };
  const MAPA_ACESS = { 'Acessível para cadeirantes': 'Rampa de acesso', 'Sala de recursos (AEE)': 'Sala de recursos multifuncionais', 'Piso tátil': 'Piso tátil', 'Material em braille': 'Sinalização em braille', 'Intérprete de Libras': 'Intérprete de Libras' };
  db.escolas = db.escolas.map(e0 => {
    const dm = demo ? DEMO_ESC[e0.id] : null;
    let diretorId = '';
    if (e0.diretor) { const pid = 'pe-' + slug(e0.diretor); if (!db.pessoas.some(p => p.id === pid)) db.pessoas.push(Modelos.pessoa({ id: pid, nome: e0.diretor })); diretorId = pid; }
    const end = typeof e0.endereco === 'object' && e0.endereco ? e0.endereco : { logradouro: e0.endereco || '', bairro: e0.bairro || '' };
    const e = Modelos.escola(Object.assign({}, e0, { endereco: end, diretorId, cursos: e0.cursos || [] }, dm ? { nome: dm.nome || e0.nome, inep: dm.inep, drId: dm.drId, municipioId: dm.municipioId, telefone: dm.telefone, endereco: dm.endereco, cursos: dm.cursos } : {}));
    const rec = uniq((e0.recursos || []).map(r => MAPA_ACESS[r] || r).concat(dm && dm.infra[5] ? ['Banheiro adaptado'] : []));
    if (!db.infraestruturas.some(i => i.id === e.id)) {
      const [salasAula, salasTI, laboratorios, banheiros, salasProfessores, possuiGinasio] = dm ? dm.infra : [0, 0, 0, 0, 0, false];
      db.infraestruturas.push(Object.assign(Modelos.infraestruturaEscola({ escolaId: e.id, salasAula, salasTI, laboratorios, tiposLaboratorio: laboratorios ? 'Ciências' : '', banheiros, salasProfessores, possuiGinasio, recursosAcessibilidade: rec }), { id: e.id }));
    }
    delete e.recursos;
    return e;
  });
  db.escolas.forEach(e => { DB.pessoas = db.pessoas; projetarEscola(e); });

  // Professores: Pessoa + Vínculo a partir dos campos antigos; a escola vira Lotação
  let n = 0;
  db.professores = db.professores.map(p0 => {
    if (p0.pessoa) return p0;
    n++;
    const aulas = db.aulas.filter(a => a.professorId === p0.id);
    const hab = uniq((p0.formacoes || []).flatMap(f => db.formacoes.find(x => x.id === f)?.disciplinas || []));
    const lecionadas = uniq(aulas.map(a => a.disciplinaId)).filter(d => hab.includes(d));
    const ch = Math.max(Number(p0.cargaHoraria) || 25, aulas.length);
    const v = Modelos.vinculo({ cargo: 'Professor', formacoes: p0.formacoes || [], disciplinas: lecionadas.length ? lecionadas : hab, ingresso: p0.ingresso || 'Concurso', orgaoOrigem: p0.orgaoOrigem, dataInicio: p0.contratoInicio || '2015-02-02', dataFim: p0.ingresso === 'Contrato' ? p0.contratoFim : '', cargaHoraria: ch, anexoContrato: p0.ingresso === 'Contrato' ? `contrato-${slug(p0.nome)}.pdf` : '' });
    const p = Modelos.professor({ id: p0.id, pessoa: { nome: p0.nome, email: p0.email, telefones: [p0.telefone], cpf: demo ? gerarCPF(101202303 + n * 1117) : '', nascimento: demo ? `19${78 + n}-0${1 + (n % 9)}-1${n % 9}` : '', naturalidade: demo ? { cidade: 'Aracaju', uf: 'SE' } : {} }, vinculos: [v] });
    p.disciplinasLegado = p0.disciplinasLegado || []; p.instituicao = p0.instituicao || '';
    // lotações: uma por escola onde dá aula; sem aulas, a escola de lotação antiga com a carga toda
    const porEscola = {}; aulas.forEach(a => { const e = db.turmas.find(t => t.id === a.turmaId)?.escolaId; if (e) porEscola[e] = (porEscola[e] || 0) + 1; });
    if (!Object.keys(porEscola).length && p0.escolaId) porEscola[p0.escolaId] = ch;
    Object.entries(porEscola).forEach(([escolaId, h]) => db.lotacoes.push(Modelos.lotacao({ professorId: p.id, vinculoId: v.id, escolaId, cargaHoraria: h, dataInicio: v.dataInicio, dataFim: v.dataFim && v.dataFim <= TODAY_ISO ? v.dataFim : '' })));
    return p;
  });

  if (demo) {
    const P = id => db.professores.find(p => p.id === id);
    // Dependentes de exemplo
    P('p1').dependentes = [Modelos.dependente({ nome: 'Lara Costa', parentesco: 'Filho(a)', nascimento: '2015-06-12' }), Modelos.dependente({ nome: 'Davi Costa', parentesco: 'Filho(a)', nascimento: '2019-03-03' })];
    // Dois vínculos: André é cedido (20 h) e também contratado (25 h)
    const v2 = Modelos.vinculo({ cargo: 'Professor', formacoes: ['f2'], disciplinas: ['d6'], ingresso: 'Contrato', dataInicio: '2026-03-02', dataFim: '2026-12-18', cargaHoraria: 25, anexoContrato: 'contrato-andre-siqueira-2026.pdf' });
    P('p7').vinculos.push(v2); db.lotacoes.push(Modelos.lotacao({ professorId: 'p7', vinculoId: v2.id, escolaId: 'e2', cargaHoraria: 15, dataInicio: '2026-03-02' }));
    // Professor de Arte em três escolas: 10 h + 10 h + 5 h = 25 h
    const va = Modelos.vinculo({ cargo: 'Professor', formacoes: ['f11'], disciplinas: ['d9'], ingresso: 'Concurso', dataInicio: '2019-02-04', cargaHoraria: 25 });
    db.professores.push(Modelos.professor({ id: 'p9', pessoa: { nome: 'Juliana Freitas', cpf: gerarCPF(305406507), nascimento: '1988-09-21', sexo: 'Feminino', estadoCivil: 'Casado(a)', telefones: ['(79) 99812-3344'], email: 'juliana.freitas@entrelaco.edu.br', naturalidade: { cidade: 'Itabaiana', uf: 'SE' } }, vinculos: [va] }));
    [['e1', 10], ['e2', 10], ['e3', 5]].forEach(([escolaId, h]) => db.lotacoes.push(Modelos.lotacao({ professorId: 'p9', vinculoId: va.id, escolaId, cargaHoraria: h, dataInicio: '2026-02-02' })));
    // Histórico: Carlos já passou pela Unidade Atalaia
    db.lotacoes.push(Modelos.lotacao({ professorId: 'p2', vinculoId: P('p2').vinculos[0].id, escolaId: 'e2', cargaHoraria: 10, dataInicio: '2024-02-05', dataFim: '2025-12-19' }));
  }
  DB.lotacoes = db.lotacoes; db.professores.forEach(projetarProfessor);

  // Perfis: acrescenta as permissões novas sem desfazer o que a secretaria já configurou
  const NOVAS = ['escolas.editar', 'infraestrutura.editar', 'cursos.gerir', 'lotacoes.gerir'];
  db.perfis = db.perfis || {};
  Object.entries(PERFIS_PADRAO).forEach(([r, perms]) => { if (!db.perfis[r]) db.perfis[r] = perms.slice(); else perms.filter(k => NOVAS.includes(k) && !db.perfis[r].includes(k)).forEach(k => db.perfis[r].push(k)); });

  db.migracoes = db.migracoes || [];
  db.migracoes.push({ versao: 9, data: new Date().toISOString(), nota: `Escolas com DR e município; ${n} professores convertidos para Pessoa + Vínculos; lotações separadas do cadastro.` });
  db.v = 9;
}
