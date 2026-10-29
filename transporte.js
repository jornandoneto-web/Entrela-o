/* Portal Entrelaço — transporte escolar: mapa das rotas (Leaflet + OpenStreetMap), ponto mais próximo, QR de embarque, avisos de ausência e tela do motorista */
'use strict';

const CORES_ROTA = ['#7C3AED', '#EB6834', '#1BAF7A', '#2A78D6'];
const corRota = id => CORES_ROTA[Math.max(0, DB.rotas.findIndex(r => r.id === id)) % CORES_ROTA.length];
// Uma parada por linha: "06:20 Praça da Várzea | -8.0466, -34.9573" (coordenadas opcionais)
function parseParadas(txt) {
  return String(txt || '').split('\n').map(l => l.trim()).filter(Boolean).map((l, i) => {
    const [a, b] = l.split('|'); const m = a.trim().match(/^(\d{1,2}:\d{2})\s+(.*)$/);
    const c = (b || '').split(',').map(x => Number(x.trim()));
    return { id: 's' + (i + 1), hora: m ? m[1] : '', nome: (m ? m[2] : a).trim(), lat: c.length === 2 && !isNaN(c[0]) ? c[0] : null, lng: c.length === 2 && !isNaN(c[1]) ? c[1] : null, escola: /escola|universidade|chegada/i.test(a) };
  });
}
const paradasTexto = ps => ps.map(p => `${p.hora} ${p.nome}${p.lat != null ? ` | ${p.lat}, ${p.lng}` : ''}`).join('\n');
function distM(a, b) {
  const R = 6371000, r = x => x * Math.PI / 180; const dLa = r(b.lat - a.lat), dLo = r(b.lng - a.lng);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtDist = m => m < 1000 ? `${Math.round(m / 10) * 10} m` : `${num(m / 1000, 1)} km`;
function paradaDoAluno(a) {
  const r = byId('rotas', a.rotaId); if (!r) return null;
  const ps = (r.paradas || []).filter(p => !p.escola);
  if (a.casa && ps.some(p => p.lat != null)) return ps.filter(p => p.lat != null).map(p => ({ p, d: distM(a.casa, p) })).sort((x, y) => x.d - y.d)[0];
  const p = ps.find(x => x.id === a.paradaId) || ps[0]; return p ? { p, d: null } : null;
}
const codigoQR = a => 'ENT-' + a.matricula;
const alunosDaRota = id => DB.alunos.filter(a => a.rotaId === id);
const ausente = (a, data, sentido) => DB.ausencias.find(x => x.alunoId === a.id && x.data === data && (x.sentido === sentido || x.sentido === 'Ida e volta'));
const embarcou = (a, data, sentido) => DB.embarques.find(x => x.alunoId === a.id && x.data === data && x.sentido === sentido);
const agoraHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

// Rotas: a lista de paradas vira dados estruturados
Object.assign(ENT.rotas, {
  fields: semEscola(() => [{ k: 'nome', l: 'Nome da rota', req: 1, wide: 1 }, { k: 'escolaId', l: 'Escola', t: 'select', o: optsOf('escolas'), req: 1 }, { k: 'turno', l: 'Turno', t: 'select', o: optsFix(TURNOS), req: 1 }, { k: 'motorista', l: 'Motorista', req: 1 }, { k: 'veiculo', l: 'Veículo e placa' }, { k: 'capacidade', l: 'Lugares', t: 'number', attrs: 'min="1"' }, { k: 'pontos', l: 'Paradas, na ordem da ida', t: 'textarea', req: 1, help: 'Uma parada por linha: horário, nome e, se souber, as coordenadas. Ex.: 06:20 Praça da Várzea | -8.0466, -34.9573. A última linha é a chegada à escola.' }]),
  after: r => { r.paradas = parseParadas(r.pontos); }
});

// ---------- Mapa ----------
function mapaHTML(id, o) {
  const rotas = o.rotas.map(x => byId('rotas', x)).filter(Boolean);
  return `<div class="mapa-wrap"><div class="mapa" id="${id}" data-map="${esc(JSON.stringify(o))}" role="img" aria-label="Mapa de ${esc(rotas.map(r => r.nome).join(' e '))}. A lista de paradas está logo abaixo."></div>
    <ul class="legend" style="margin-top:.5rem">${rotas.map(r => `<li><span class="sw" style="background:${corRota(r.id)}"></span>${esc(r.nome)}</li>`).join('')}${o.destaque ? '<li><span class="sw" style="background:#7C3AED;border-radius:999px;box-shadow:0 0 0 3px #DDD6FE"></span>Seu ponto</li>' : ''}${o.casa ? '<li><span class="sw" style="background:#1F6B47;border-radius:999px"></span>Sua casa</li>' : ''}<li><span class="sw" style="background:#3A3938"></span>Destino</li></ul>
    <p class="caption mapa-aviso" hidden>O mapa de fundo não carregou nesta visualização. As rotas e paradas aparecem mesmo assim.</p></div>`;
}
function initMapa(el) {
  if (el.dataset.ok) return; el.dataset.ok = '1';
  const o = JSON.parse(el.dataset.map); const rotas = o.rotas.map(x => byId('rotas', x)).filter(Boolean);
  const pts = rotas.flatMap(r => (r.paradas || []).filter(p => p.lat != null));
  if (o.casa) pts.push(o.casa);
  if (!pts.length) { el.innerHTML = '<p class="empty" style="margin:1rem">As paradas desta rota ainda não têm coordenadas.</p>'; return; }
  const aviso = el.parentElement.querySelector('.mapa-aviso');
  if (window.L) {
    const map = L.map(el, { scrollWheelZoom: false, attributionControl: true });
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    let falhas = 0; tiles.on('tileerror', () => { if (++falhas === 3 && aviso) aviso.hidden = false; });
    rotas.forEach(r => {
      const ps = (r.paradas || []).filter(p => p.lat != null); const cor = corRota(r.id);
      L.polyline(ps.map(p => [p.lat, p.lng]), { color: cor, weight: 4, opacity: .85 }).addTo(map);
      ps.forEach(p => {
        const dest = p.id === o.destaque && r.id === o.rotas[0];
        L.circleMarker([p.lat, p.lng], { radius: dest ? 10 : p.escola ? 8 : 6, color: dest ? '#DDD6FE' : '#fff', weight: dest ? 4 : 2, fillColor: p.escola ? '#3A3938' : dest ? '#7C3AED' : cor, fillOpacity: 1 })
          .bindTooltip(`${p.hora} ${p.nome}`, { direction: 'top', permanent: dest }).addTo(map);
      });
    });
    if (o.casa) L.circleMarker([o.casa.lat, o.casa.lng], { radius: 7, color: '#fff', weight: 2, fillColor: '#1F6B47', fillOpacity: 1 }).bindTooltip('Sua casa').addTo(map);
    map.fitBounds(L.latLngBounds(pts.map(p => [p.lat, p.lng])).pad(0.2));
    setTimeout(() => map.invalidateSize(), 200);
    return;
  }
  // Sem a biblioteca (sem internet): desenho simples das rotas
  if (aviso) aviso.hidden = false;
  const la = pts.map(p => p.lat), lo = pts.map(p => p.lng);
  const [a0, a1, o0, o1] = [Math.min(...la), Math.max(...la), Math.min(...lo), Math.max(...lo)];
  const W = 600, H = 300, P = 30; const sx = (o1 - o0) || 1, sy = (a1 - a0) || 1, k = Math.min((W - 2 * P) / sx, (H - 2 * P) / sy);
  const X = g => P + (g - o0) * k, Y = t => H - P - (t - a0) * k;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" aria-hidden="true">${rotas.map(r => { const ps = (r.paradas || []).filter(p => p.lat != null); return `<polyline points="${ps.map(p => `${X(p.lng)},${Y(p.lat)}`).join(' ')}" fill="none" stroke="${corRota(r.id)}" stroke-width="4" stroke-linejoin="round"/>${ps.map(p => `<circle cx="${X(p.lng)}" cy="${Y(p.lat)}" r="${p.id === o.destaque ? 10 : 6}" fill="${p.escola ? '#3A3938' : p.id === o.destaque ? '#7C3AED' : corRota(r.id)}" stroke="#fff" stroke-width="2"/><text x="${X(p.lng) + 10}" y="${Y(p.lat) - 8}" font-size="12" fill="#3A3938">${esc(p.nome)}</text>`).join('')}`; }).join('')}${o.casa ? `<circle cx="${X(o.casa.lng)}" cy="${Y(o.casa.lat)}" r="7" fill="#1F6B47" stroke="#fff" stroke-width="2"/>` : ''}</svg>`;
}
HYDRATORS.push(root => root.querySelectorAll('[data-map]').forEach(initMapa));
// QR code individual (qrcodejs). Sem a biblioteca, mostra só o código.
HYDRATORS.push(root => root.querySelectorAll('[data-qr]').forEach(el => {
  if (el.dataset.ok) return; el.dataset.ok = '1';
  if (window.QRCode) { try { new QRCode(el, { text: el.dataset.qr, width: 176, height: 176, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M }); return; } catch (e) { /* cai no texto */ } }
  el.innerHTML = `<p class="quote" style="font-size:1.25rem;text-align:center"><code>${esc(el.dataset.qr)}</code></p>`;
}));

// ---------- Aluno e responsável ----------
function paradasLista(r, destaque) {
  return `<ol class="list paradas">${(r.paradas || []).map(p => `<li class="${p.id === destaque ? 'dest' : ''}"><span class="time">${esc(p.hora)}</span><span class="grow"><span class="t">${esc(p.nome)}</span>${p.id === destaque ? '<br><span class="fio-now">Seu ponto</span>' : ''}</span></li>`).join('')}</ol>`;
}
function transporteAluno(a, porResp) {
  const r = byId('rotas', a.rotaId);
  if (!r) return `<p class="empty">${porResp ? esc(firstName(a.nome)) + ' não usa' : 'Você não está cadastrado no'} transporte escolar. Para pedir, fale com a secretaria da escola.</p>`;
  const pp = paradaDoAluno(a); const avisos = DB.ausencias.filter(x => x.alunoId === a.id && x.data >= TODAY_ISO).sort((x, y) => x.data.localeCompare(y.data));
  const emb = DB.embarques.filter(x => x.alunoId === a.id).sort((x, y) => (y.data + y.hora).localeCompare(x.data + x.hora)).slice(0, 5);
  const ultima = (r.paradas || []).slice(-1)[0];
  return `<div class="grid g2">
    <section class="card" aria-labelledby="tr-${a.id}"><h2 id="tr-${a.id}">${esc(r.nome)}</h2>
      ${pp ? `<p class="lead"><b>${porResp ? 'Ponto de ' + esc(firstName(a.nome)) : 'Seu ponto'}: ${esc(pp.p.nome)}</b>, às ${esc(pp.p.hora)}${pp.d != null ? `, a ${fmtDist(pp.d)} de casa` : ''}.</p>` : ''}
      <dl class="dl"><dt>Motorista</dt><dd>${esc(r.motorista)}</dd><dt>Veículo</dt><dd>${esc(r.veiculo || '—')}</dd><dt>Chegada ao destino</dt><dd>${esc(ultima?.hora || '—')}</dd><dt>Turno</dt><dd>${esc(r.turno)}</dd></dl>
      ${mapaHTML('mapa-' + a.id, { rotas: [r.id], destaque: pp?.p.id, casa: a.casa })}
      <details class="data"><summary>Ver todas as paradas</summary>${paradasLista(r, pp?.p.id)}</details>
    </section>
    <div class="grid" style="gap:1.25rem">
      <section class="card" aria-labelledby="qr-${a.id}"><h2 id="qr-${a.id}">Cartão de embarque</h2><p class="muted">Mostre este código ao motorista ao entrar no ônibus. O embarque fica registrado com dia, hora e sentido.</p><div class="qr" data-qr="${esc(codigoQR(a))}" role="img" aria-label="QR code de embarque de ${esc(a.nome)}, código ${esc(codigoQR(a))}"></div><p class="caption" style="text-align:center">${esc(a.nome)}, código ${esc(codigoQR(a))}</p></section>
      <form class="card" data-form="aviso" data-aluno="${a.id}" novalidate aria-labelledby="av-${a.id}"><h2 id="av-${a.id}">Avisar que não vai usar</h2><p class="muted">O motorista deixa de esperar no ponto nesse dia.</p>
        <div class="form-grid"><div class="field"><label for="av-data-${a.id}">Dia <span class="req" aria-hidden="true">*</span></label><input id="av-data-${a.id}" type="date" min="${TODAY_ISO}" value="${TODAY_ISO}" required></div>
        <fieldset class="field"><legend>Trecho</legend><div class="seg">${['Ida', 'Volta', 'Ida e volta'].map((v, i) => `<label><input type="radio" name="av-sent-${a.id}" value="${v}" ${i === 1 ? 'checked' : ''}>${v}</label>`).join('')}</div></fieldset>
        <div class="field wide"><label for="av-mot-${a.id}">Motivo (opcional)</label><input id="av-mot-${a.id}" placeholder="Ex.: consulta médica, vou de carona"></div></div>
        <div class="row"><button class="btn primary" type="submit">${icon('send')}Enviar aviso</button></div>
        ${avisos.length ? `<h3 class="lbl" style="margin-top:.5rem">Avisos enviados</h3><ul class="list">${avisos.map(x => `<li><span class="grow"><span class="t">${esc(fmtLong(x.data))}</span><br><span class="m">${esc(x.sentido)}${x.motivo ? ', ' + esc(x.motivo) : ''}</span></span><button type="button" class="btn ghost sm" data-act="cancelar-aviso" data-id="${x.id}" aria-label="Cancelar aviso de ${esc(fmtD(x.data))}">Cancelar</button></li>`).join('')}</ul>` : ''}
      </form>
      <section class="card" aria-labelledby="eb-${a.id}"><h2 id="eb-${a.id}">Últimos embarques</h2>${emb.length ? `<ul class="list">${emb.map(x => `<li><span class="grow"><span class="t">${esc(fmtD(x.data))}, ${esc(x.hora)}</span><br><span class="m">${esc(x.sentido)}, ${esc(byId('rotas', x.rotaId)?.nome || '')}</span></span></li>`).join('')}</ul>` : '<p class="muted">Nenhum embarque registrado ainda.</p>'}</section>
    </div></div>`;
}
FORMS.aviso = f => {
  const a = byId('alunos', f.dataset.aluno); const data = $(`#av-data-${a.id}`).value; const sentido = f.querySelector(`input[name="av-sent-${a.id}"]:checked`).value;
  if (data < TODAY_ISO) { toast('Escolha hoje ou um dia futuro.', 'err'); return; }
  DB.ausencias = DB.ausencias.filter(x => !(x.alunoId === a.id && x.data === data));
  DB.ausencias.push({ id: uid(), alunoId: a.id, data, sentido, motivo: $(`#av-mot-${a.id}`).value.trim(), por: SESSION.role === 'responsavel' ? 'Responsável' : 'Aluno', criado: new Date().toISOString() });
  save(); rerender(); toast(`Aviso enviado: ${sentido.toLowerCase()} em ${fmtD(data)}. O motorista não vai esperar.`);
};
ACT['cancelar-aviso'] = el => { DB.ausencias = DB.ausencias.filter(x => x.id !== el.dataset.id); save(); rerender(); toast('Aviso cancelado.'); };

// ---------- Motorista ----------
const rotaMot = () => byId('rotas', EQUIPE[SESSION.userId]?.rotaId);
function motoristaEmbarque() {
  const r = rotaMot(); if (!r) return pageHead('Embarque', 'Nenhuma rota ligada a este motorista.');
  const sentido = UI.sel.sentido || (new Date().getHours() < (r.turno === 'Tarde' ? 15 : 10) ? 'Ida' : 'Volta');
  const ps = (r.paradas || []).filter(p => !p.escola); const ordem = sentido === 'Ida' ? ps : ps.slice().reverse();
  const al = alunosDaRota(r.id);
  const esperados = al.filter(a => !ausente(a, TODAY_ISO, sentido)); const ok = esperados.filter(a => embarcou(a, TODAY_ISO, sentido));
  const porParada = p => al.filter(a => paradaDoAluno(a)?.p.id === p.id);
  return pageHead(`${r.nome}`, `${esc(fmtLong(TODAY_ISO))}. ${esc(r.veiculo || '')}`, '', 'hello') +
    `<div class="toolbar"><fieldset class="field"><legend class="lbl">Trecho</legend><div class="seg">${['Ida', 'Volta'].map(v => `<label><input type="radio" id="sent-${v}" name="sent" value="${v}" data-change="sentido" ${sentido === v ? 'checked' : ''}>${v === 'Ida' ? 'Ida para a escola' : 'Volta para casa'}</label>`).join('')}</div></fieldset></div>
    <section class="stats" aria-label="Resumo do trecho">${statCard('lilac', 'Esperados', esperados.length, `${al.length} alunos na rota`)}${statCard('mint', 'Embarcaram', ok.length, `faltam ${esperados.length - ok.length}`)}${statCard('peach', 'Avisaram que não vão', al.length - esperados.length, 'não precisa esperar')}</section>
    <form class="card scan" data-form="embarque" novalidate aria-labelledby="scan-h"><h2 id="scan-h">Ler cartão de embarque</h2><div class="row" style="align-items:flex-end;flex-wrap:nowrap"><div class="field" style="flex:1"><label for="qr-in">Código do QR</label><input id="qr-in" class="input" autocomplete="off" placeholder="Aproxime o cartão do leitor ou digite o código" aria-describedby="qr-help"></div><button class="btn primary" type="submit">${icon('check')}Registrar</button></div><p class="help" id="qr-help">O leitor de QR conectado ao tablet digita o código aqui e confirma sozinho.</p><p id="scan-res" aria-live="assertive" class="lead"></p></form>
    ${ordem.map((p, i) => { const lista = porParada(p); const esp = lista.filter(a => !ausente(a, TODAY_ISO, sentido)); const aus = lista.filter(a => ausente(a, TODAY_ISO, sentido)); return `<section class="card parada" aria-labelledby="pd-${p.id}"><div class="card-h"><h2 id="pd-${p.id}"><span class="time" style="width:auto">${esc(sentido === 'Ida' ? p.hora : '')}</span> ${esc(p.nome)}</h2><span class="caption">${esp.length ? `${esp.filter(a => embarcou(a, TODAY_ISO, sentido)).length} de ${esp.length} embarcaram` : 'Ninguém esperado'}</span></div>
      ${esp.length ? `<ul class="list">${esp.map(a => { const e = embarcou(a, TODAY_ISO, sentido); return `<li><span class="avatar" aria-hidden="true">${initials(a.nome)}</span><span class="grow"><span class="t">${esc(a.nome)}</span><br><span class="m">${esc(turmaNome(a.turmaId))}${a.acess !== 'Nenhuma' ? ', ' + esc(a.acess) : ''}</span></span>${e ? st(`Embarcou ${e.hora}`, 'ok') : `<button class="btn outline sm" data-act="embarcar" data-id="${a.id}" aria-label="Registrar embarque de ${esc(a.nome)}">Embarcou</button>`}</li>`; }).join('')}</ul>` : ''}
      ${aus.length ? `<p class="caption">Avisaram que não vão: ${aus.map(a => esc(a.nome) + (ausente(a, TODAY_ISO, sentido).motivo ? ` (${esc(ausente(a, TODAY_ISO, sentido).motivo)})` : '')).join(', ')}.</p>` : ''}</section>`; }).join('')}`;
}
CHG.sentido = el => { UI.sel.sentido = el.value; rerender(); };
function registrarEmbarque(a, como) {
  const r = rotaMot(); const sentido = UI.sel.sentido || ($('input[name=sent]:checked')?.value) || 'Ida';
  if (!a) return 'Código não encontrado. Confira o cartão.';
  if (a.rotaId !== r.id) return `${a.nome} não é desta rota (${byId('rotas', a.rotaId)?.nome || 'sem transporte'}).`;
  const ja = embarcou(a, TODAY_ISO, sentido); if (ja) return `${a.nome} já embarcou às ${ja.hora}.`;
  DB.embarques.push({ id: uid(), alunoId: a.id, rotaId: r.id, data: TODAY_ISO, hora: agoraHM(), sentido, como });
  save(); return '';
}
FORMS.embarque = () => {
  const cod = $('#qr-in').value.trim().toUpperCase(); const a = DB.alunos.find(x => codigoQR(x).toUpperCase() === cod);
  const err = registrarEmbarque(a, 'QR code');
  rerender(); const res = $('#scan-res'); const inp = $('#qr-in');
  const msg = err || `Embarque registrado: ${a.nome}.`;
  if (res) { res.innerHTML = err ? st(msg, 'err') : st(msg, 'ok'); }
  if (A.readFocus || A.readHover) TTS.speak(msg);
  inp?.focus();
};
ACT.embarcar = el => { const a = byId('alunos', el.dataset.id); const err = registrarEmbarque(a, 'Manual'); rerender(); toast(err || `Embarque registrado: ${a.nome}.`, err ? 'err' : 'ok'); };
HYDRATORS.push(root => { const i = root.querySelector('#qr-in'); if (i && !matchMedia('(max-width:40em)').matches) i.focus({ preventScroll: true }); });

function motoristaRota() {
  const r = rotaMot(); if (!r) return pageHead('Minha rota', 'Nenhuma rota ligada a este motorista.');
  return pageHead('Minha rota', `${esc(r.nome)}, turno da ${esc(r.turno.toLowerCase())}. ${alunosDaRota(r.id).length} alunos.`) +
    `<section class="card">${mapaHTML('mapa-mot', { rotas: [r.id] })}</section><section class="card"><h2>Paradas e alunos</h2><ol class="list paradas">${(r.paradas || []).map(p => { const al = alunosDaRota(r.id).filter(a => paradaDoAluno(a)?.p.id === p.id); return `<li style="align-items:flex-start"><span class="time">${esc(p.hora)}</span><span class="grow"><span class="t">${esc(p.nome)}</span><br><span class="m">${p.escola ? 'Destino final' : al.length ? esc(al.map(a => a.nome).join(', ')) : 'Nenhum aluno neste ponto'}</span></span></li>`; }).join('')}</ol></section>`;
}

// ---------- Gestão: mapa e embarques do dia ----------
const gTranspBase = PAGES.gestao.transporte;
PAGES.gestao.transporte = () => {
  const rotas = DB.rotas.filter(r => naEscola(r.escolaId)); const hoje = DB.embarques.filter(x => x.data === TODAY_ISO && rotas.some(r => r.id === x.rotaId));
  const aus = DB.ausencias.filter(x => x.data === TODAY_ISO && rotas.some(r => r.id === byId('alunos', x.alunoId)?.rotaId));
  return gTranspBase() + `<section class="rel-sec" aria-labelledby="tm-h"><div class="rel-head"><h2 id="tm-h">Mapa das rotas</h2></div><section class="card">${mapaHTML('mapa-gestao', { rotas: rotas.map(r => r.id) })}</section></section>
    <section class="rel-sec" aria-labelledby="th-h"><div class="rel-head"><h2 id="th-h">Embarques de hoje</h2><p class="muted">${hoje.length} embarque${hoje.length === 1 ? '' : 's'} registrado${hoje.length === 1 ? '' : 's'} e ${aus.length} aviso${aus.length === 1 ? '' : 's'} de ausência.</p></div>
    ${hoje.length ? `<div class="tbl-wrap"><table class="tbl stack"><thead><tr><th scope="col">Aluno</th><th scope="col">Rota</th><th scope="col">Trecho</th><th scope="col" class="n">Hora</th><th scope="col">Como</th></tr></thead><tbody>${hoje.sort((a, b) => b.hora.localeCompare(a.hora)).map(x => `<tr><th scope="row">${esc(alunoNome(x.alunoId))}</th><td data-label="Rota">${esc(byId('rotas', x.rotaId)?.nome)}</td><td data-label="Trecho">${esc(x.sentido)}</td><td class="n" data-label="Hora">${esc(x.hora)}</td><td data-label="Como">${esc(x.como || 'QR code')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhum embarque registrado hoje.</p>'}</section>`;
};
const transpResp = () => { const fs = filhos(); return pageHead('Transporte escolar', 'Rota, ponto de parada e cartão de embarque dos seus filhos. Avise quando eles não forem usar a ida ou a volta.') + (fs.length ? fs.map(a => `<section class="rel-sec" aria-label="${esc(a.nome)}"><div class="rel-head"><h2>${esc(a.nome)}</h2></div>${transporteAluno(a, true)}</section>`).join('') : '<p class="empty">Nenhum filho matriculado na rede.</p>'); };
PAGES.aluno.transporte = () => pageHead('Transporte escolar', 'Sua rota, o ponto mais perto de casa e o cartão de embarque.') + transporteAluno(me(), false);
PAGES.responsavel.transporte = transpResp;
PAGES.motorista = { inicio: motoristaEmbarque, rota: motoristaRota };
NAV.aluno.splice(NAV.aluno.findIndex(n => n[0] === 'merenda'), 0, ['transporte', 'Transporte', 'bus']);
NAV.responsavel.splice(NAV.responsavel.findIndex(n => n[0] === 'merenda'), 0, ['transporte', 'Transporte', 'bus']);
