const $ = s => document.querySelector(s);
const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let S = Object.assign({ me: null, rapat: [], peserta: [], pembahasan: [], tugas: [], rekaman: [], pengguna: [] }, JSON.parse(localStorage.getItem('nr_s') || '{}')), busy = false;
const save = () => { try { localStorage.setItem('nr_s', JSON.stringify(S)); } catch (e) {} };
const adm = () => S.me && S.me.peran === 'admin';
const today = () => new Date().toISOString().slice(0, 10);
const toast = (m, t) => { const x = $('#toast'); x.textContent = m; x.className = 'show ' + (t || ''); clearTimeout(toast.i); toast.i = setTimeout(() => x.className = '', 3200); };
const MENU = [['dashboard', 'Dashboard'], ['jadwal', 'Jadwal Rapat', 1], ['rekam', 'Ruang Rekam', 1], ['tinjau', 'Tinjau Notulensi', 1], ['arsip', 'Arsip Notulensi'], ['tugas', 'Tindak Lanjut'], ['kontak', 'Kontak & Impor', 1]];
const ST = { terjadwal: ['Terjadwal', 'sk'], merekam: ['Merekam', 'rd'], diproses: ['Diproses', 'vi'], menunggu_tinjauan: ['Menunggu Tinjauan', 'vd'], terbit: ['Terbit', 'gr'], gagal: ['Gagal', 'rd'] };
const pill = s => { const x = ST[s] || [s, 'sk']; return '<span class="pill ' + x[1] + '">' + x[0] + '</span>'; };
const tgl = s => s ? new Date(s + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
const nama = em => { const u = S.pengguna.concat(S.peserta).find(x => String(x.email).toLowerCase() === String(em).toLowerCase()); return u ? u.nama : (em || '-'); };
const MIC = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
function modal(html, wide) { const m = document.createElement('div'); m.className = 'scrim'; m.innerHTML = '<div class="card modal' + (wide ? ' wide' : '') + '" role="dialog">' + html + '</div>'; m.addEventListener('click', e => { if (e.target === m || e.target.dataset.x !== undefined) m.remove(); }); document.body.appendChild(m); return m; }

/* ===== ROUTER (tanpa jaringan → perpindahan menu instan) ===== */
const V = {}; let cur = 'dashboard';
function render() {
  busy = false;
  const r = (location.hash || '#dashboard').slice(1).split('?')[0], nav = MENU.filter(m => !m[2] || adm()), m = nav.find(x => x[0] === r) || nav[0];
  cur = m[0];
  const now = today(), bd = k => { const n = k === 'tinjau' ? S.rapat.filter(x => x.status === 'menunggu_tinjauan').length : k === 'tugas' ? lewat().length : 0; return n ? '<span class="badge">' + n + '</span>' : ''; };
  $('#side').innerHTML = '<div class="logo"><b>Notulensi Report</b><small>' + E(APP_CONFIG.NAMA_SEKOLAH) + '</small></div>' + nav.map(x => '<a href="#' + x[0] + '" class="' + (x[0] === cur ? 'on' : '') + '">' + (x[0] === 'arsip' && !adm() ? 'Notulensi Saya' : x[0] === 'tugas' && !adm() ? 'Tugas Saya' : x[1]) + bd(x[0]) + '</a>').join('');
  $('#bnav').innerHTML = nav.map(x => '<a href="#' + x[0] + '" class="' + (x[0] === cur ? 'on' : '') + '">' + x[1].split(' ')[0] + '</a>').join('');
  $('#top').innerHTML = '<h2>' + m[1] + '</h2><div class="who"><div>' + E(S.me.nama) + '<small>' + (adm() ? 'Admin / Notulen' : 'Peserta') + '</small></div><button class="ghost" onclick="logout()">Keluar</button></div>';
  (V[cur] || V.dashboard)();
}
window.addEventListener('hashchange', () => { if (!S.me) return; if (Rec.on && location.hash.slice(1).split('?')[0] !== 'rekam') { location.hash = '#rekam'; toast('Selesaikan rekaman terlebih dahulu', 'er'); return; } render(); });
const mine = () => adm() ? S.tugas : S.tugas.filter(t => String(t.pic).toLowerCase() === S.me.email);
const lewat = () => mine().filter(t => t.status !== 'selesai' && t.tenggat && t.tenggat < today());
async function refresh() { try { Object.assign(S, await Api.call('boot')); save(); if (!busy && !Rec.on) render(); } catch (e) { if (S.me) toast('Gagal menyegarkan data: ' + e.message, 'er'); } }
setInterval(() => { if (S.me && !document.hidden && S.rapat.some(r => r.status === 'diproses')) refresh(); }, 20000);

/* ===== DASHBOARD ===== */
V.dashboard = () => {
  const R = S.rapat, aktif = mine().filter(t => t.status !== 'selesai'), bln = today().slice(0, 7);
  const st = [[R.filter(r => String(r.tanggal).startsWith(bln)).length, 'Rapat Bulan Ini'], [R.filter(r => r.status === 'menunggu_tinjauan').length, 'Menunggu Tinjauan'], [aktif.length, 'Tindak Lanjut Aktif'], [lewat().length, 'Lewat Tenggat', 'rd']];
  const row = r => '<div class="li"><div><b>' + E(r.judul) + '</b><br><span class="mut">' + tgl(r.tanggal) + ' · ' + E(r.mulai) + ' · ' + E(r.lokasi) + '</span></div>' + (r.status === 'terjadwal' ? '<a class="btn sm" href="#rekam?rid=' + r.id + '">Mulai Rekam</a>' : r.status === 'menunggu_tinjauan' ? '<button class="btn sm" onclick="location.hash=\'#tinjau\'">Tinjau</button>' : '<button class="btn sm out" onclick="Det(\'' + r.id + '\')">Lihat</button>') + '</div>';
  const A = adm(), dekat = R.filter(r => r.status === 'terjadwal').sort((a, b) => a.tanggal > b.tanggal ? 1 : -1).slice(0, 3), tin = R.filter(r => r.status === 'menunggu_tinjauan').slice(0, 3), terb = R.filter(r => r.status === 'terbit').slice(0, 4);
  const terlambat = A ? R.filter(r => r.status === 'terjadwal' && r.tanggal < today()).length : 0;
  $('#view').innerHTML = (terlambat ? '<div class="note">⚠ ' + terlambat + ' rapat sudah lewat tetapi notulensi belum terbit. <a href="#jadwal">Lihat rapat</a></div>' : '') +
    (A ? '<div class="bar"><a class="btn" href="#rekam">Mulai Rekam</a><button class="btn out" onclick="formRapat()">+ Jadwalkan Rapat</button></div>' : '') +
    '<div class="grid4">' + st.map(x => '<div class="card stat ' + (x[2] || '') + '"><b>' + x[0] + '</b>' + x[1] + '</div>').join('') + '</div>' +
    '<div class="two">' + (A ? '<div class="card"><h3>Rapat Terdekat</h3>' + (dekat.map(row).join('') || '<div class="empty">Belum ada rapat terjadwal.</div>') + '</div><div class="card"><h3>Menunggu Tinjauan</h3>' + (tin.map(row).join('') || '<div class="empty">Tidak ada draf menunggu.</div>') + '</div>'
      : '<div class="card"><h3>Notulensi Terbaru</h3>' + (terb.map(row).join('') || '<div class="empty">Belum ada notulensi.</div>') + '</div><div class="card"><h3>Tugas Saya</h3>' + (aktif.slice(0, 4).map(t => '<div class="li"><span>' + E(t.tugas) + '</span><span class="' + (t.tenggat && t.tenggat < today() ? 'od' : 'mut') + '">' + tgl(t.tenggat) + '</span></div>').join('') || '<div class="empty">Tidak ada tugas aktif.</div>') + '</div>') + '</div>';
};

/* ===== JADWAL RAPAT ===== */
V.jadwal = () => {
  $('#view').innerHTML = '<div class="bar"><input id="q" placeholder="Cari judul, lokasi, pimpinan..." aria-label="Cari rapat"><select id="fs" aria-label="Status"><option value="">Semua Status</option>' + Object.keys(ST).map(k => '<option value="' + k + '">' + ST[k][0] + '</option>').join('') + '</select><button class="btn" onclick="formRapat()">+ Jadwalkan Rapat</button></div><div class="card tbl" id="tb"></div>';
  const draw = () => {
    const q = $('#q').value.toLowerCase(), f = $('#fs').value, L = S.rapat.filter(r => (!f || r.status === f) && (r.judul + r.lokasi + r.pemimpin).toLowerCase().includes(q));
    $('#tb').innerHTML = L.length ? '<table><tr><th>Rapat</th><th>Tanggal & Waktu</th><th>Lokasi</th><th>Pimpinan</th><th>Status</th><th></th></tr>' + L.map(r => '<tr><td><b>' + E(r.judul) + '</b><br><span class="mut">' + E(r.kategori) + '</span></td><td>' + tgl(r.tanggal) + '<br><span class="mut">' + E(r.mulai) + ' - ' + E(r.selesai) + '</span></td><td>' + E(r.lokasi) + '</td><td>' + E(r.pemimpin) + '</td><td>' + pill(r.status) + '</td><td>' +
      (r.status === 'terjadwal' ? '<a class="btn sm" href="#rekam?rid=' + r.id + '">Mulai Rekam</a>' : r.status === 'menunggu_tinjauan' ? '<a class="btn sm" href="#tinjau">Tinjau</a>' : r.status === 'terbit' ? '<button class="btn sm out" onclick="Det(\'' + r.id + '\')">Lihat</button>' : '') + '</td></tr>').join('') + '</table>' : '<div class="empty">Belum ada rapat. Klik “+ Jadwalkan Rapat”.</div>';
  };
  $('#q').oninput = draw; $('#fs').onchange = draw; draw();
};
window.formRapat = () => {
  const adms = S.pengguna.filter(u => u.peran === 'admin');
  const m = modal('<h3>Jadwalkan Rapat</h3><form id="fr"><label>Judul rapat *<input name="judul" required></label><div class="two"><label>Kategori<select name="kategori"><option>Akademik & Kurikulum</option><option>Kesiswaan</option><option>Komite & BOS</option><option>Rapat Pleno</option><option>Lainnya</option></select></label><label>Tanggal *<input type="date" name="tanggal" required value="' + today() + '"></label></div><div class="two"><label>Mulai<input type="time" name="mulai" value="09:00"></label><label>Selesai<input type="time" name="selesai" value="10:00"></label></div><label>Lokasi / tautan<input name="lokasi"></label><div class="two"><label>Pimpinan rapat<input name="pemimpin"></label><label>Notulen<select name="notulen">' + adms.map(u => '<option value="' + E(u.email) + '"' + (u.email === S.me.email ? ' selected' : '') + '>' + E(u.nama) + '</option>').join('') + '</select></label></div><label>Agenda (satu per baris)<textarea name="agenda" rows="3"></textarea></label><b>Peserta</b><div style="max-height:150px;overflow:auto;margin:6px 0 16px">' + S.pengguna.map(u => '<label class="ck" style="margin:0"><input type="checkbox" name="ps" value="' + E(u.email) + '" checked> ' + E(u.nama) + ' <span class="mut">' + E(u.email) + '</span></label>').join('') + '</div><div class="bar end"><button type="button" class="ghost" data-x>Batal</button><button class="btn">Simpan Rapat</button></div></form>');
  const f = m.querySelector('form'); f.onsubmit = async e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(f)), tmp = 'tmp' + Date.now();
    const ps = [...f.querySelectorAll('[name=ps]:checked')].map(c => { const u = S.pengguna.find(x => x.email === c.value); return { nama: u.nama, email: u.email, jabatan: '' }; });
    const rapat = { judul: v.judul, kategori: v.kategori, tanggal: v.tanggal, mulai: v.mulai, selesai: v.selesai, lokasi: v.lokasi, pemimpin: v.pemimpin, notulen: v.notulen, agenda: v.agenda };
    S.rapat.unshift(Object.assign({ id: tmp, status: 'terjadwal' }, rapat)); ps.forEach(p => S.peserta.push(Object.assign({ rid: tmp }, p))); save(); m.remove(); render(); toast('Rapat disimpan');
    try { const d = await Api.call('rapat.simpan', { rapat, peserta: ps }); S.rapat.find(r => r.id === tmp).id = d.id; S.peserta.forEach(p => { if (p.rid === tmp) p.rid = d.id; }); save(); if (!busy) render(); }
    catch (er) { S.rapat = S.rapat.filter(r => r.id !== tmp); S.peserta = S.peserta.filter(p => p.rid !== tmp); save(); render(); toast('Gagal menyimpan: ' + er.message, 'er'); }
  };
};

/* ===== RUANG REKAM ===== */
const Rec = { on: false, paused: false, n: 0, sent: 0, q: [], acc: 0, t0: 0, rid: '', txt: [], interim: '' };
Rec.el = () => Rec.acc + (Rec.paused ? 0 : Date.now() - Rec.t0);
Rec.clock = () => { const s = Math.floor(Rec.el() / 1000); return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2); };
Rec.start = async rid => {
  try { Rec.stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { toast('Izin mikrofon ditolak. Aktifkan lewat ikon gembok di address bar lalu muat ulang.', 'er'); return; }
  try { await Api.call('rekam.mulai', { rid }); } catch (e) { Rec.stream.getTracks().forEach(t => t.stop()); toast(e.message, 'er'); return; }
  Object.assign(Rec, { on: true, paused: false, n: 0, sent: 0, q: [], rid, acc: 0, t0: Date.now(), txt: [], interim: '' });
  const r = S.rapat.find(x => x.id === rid); if (r) r.status = 'merekam'; save();
  Rec.seg(); Rec.caps(); Rec.tick = setInterval(Rec.draw, 500); window.onbeforeunload = () => 'Rekaman sedang berjalan'; Rec.ui();
};
Rec.seg = () => {   // tiap segmen = berkas audio mandiri (5 menit)
  const mr = new MediaRecorder(Rec.stream), ch = []; Rec.mr = mr;
  mr.ondataavailable = e => e.data.size && ch.push(e.data);
  mr.onstop = () => { clearTimeout(Rec.st); const mime = (mr.mimeType || 'audio/webm').split(';')[0]; if (ch.length) { Rec.q.push({ no: ++Rec.n, blob: new Blob(ch, { type: mime }), mime }); Rec.drain(); } if (Rec.on && !Rec.paused) Rec.seg(); else if (Rec.fin) Rec.fin(); };
  mr.start(); Rec.st = setTimeout(() => mr.state === 'recording' && mr.stop(), 300000);
};
Rec.drain = async () => {
  if (Rec.busy) return; Rec.busy = true;
  while (Rec.q.length) {
    const it = Rec.q[0]; let ok = false;
    for (let i = 0; i < 4 && !ok; i++) {
      try { const b64 = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result.split(',')[1]); f.readAsDataURL(it.blob); }); await Api.call('rekam.potongan', { rid: Rec.rid, no: it.no, mime: it.mime, b64 }); ok = true; }
      catch (e) { await new Promise(r => setTimeout(r, 2000 * (i + 1))); }
    }
    if (ok) { Rec.q.shift(); Rec.sent++; } else { toast('Potongan ' + it.no + ' belum terkirim, mencoba lagi…', 'er'); await new Promise(r => setTimeout(r, 8000)); }
  }
  Rec.busy = false;
};
Rec.pz = () => { if (!Rec.paused) { Rec.paused = true; Rec.acc += Date.now() - Rec.t0; Rec.mr.stop(); } else { Rec.paused = false; Rec.t0 = Date.now(); Rec.seg(); } Rec.ui(); };
Rec.stop = async () => {
  if (!confirm('Akhiri rekaman dan susun notulensi?')) return;
  Rec.on = false; clearInterval(Rec.tick); try { Rec.sr && Rec.sr.stop(); } catch (e) {}
  $('#view').innerHTML = '<div class="card"><h3>Menyelesaikan rekaman…</h3><p class="mut">Mengirim potongan terakhir. Jangan tutup halaman ini.</p></div>';
  await new Promise(res => { Rec.fin = res; if (Rec.mr && Rec.mr.state !== 'inactive') Rec.mr.stop(); else res(); });
  await new Promise(res => { const w = () => (Rec.q.length || Rec.busy) ? setTimeout(w, 500) : res(); w(); });
  Rec.stream.getTracks().forEach(t => t.stop()); window.onbeforeunload = null;
  try { await Api.call('rekam.selesai', { rid: Rec.rid }); const r = S.rapat.find(x => x.id === Rec.rid); if (r) r.status = 'diproses'; save(); toast('Rekaman terkirim. Notulensi sedang disusun.'); location.hash = '#tinjau'; refresh(); }
  catch (e) { toast(e.message, 'er'); }
};
Rec.caps = () => {   // transkrip langsung perkiraan dari browser (opsional, hanya tampilan)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; Rec.SR = !!SR; if (!SR) return;
  const r = new SR(); r.lang = 'id-ID'; r.continuous = true; r.interimResults = true;
  r.onresult = e => { let it = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal) Rec.txt.push(Rec.clock() + '  ' + x[0].transcript.trim()); else it += x[0].transcript; } Rec.interim = it; Rec.draw(); };
  r.onend = () => { if (Rec.on && !Rec.paused) try { r.start(); } catch (e) {} }; r.onerror = () => {}; try { r.start(); } catch (e) {} Rec.sr = r;
};
Rec.draw = () => {
  const t = $('#tm'); if (!t) return; const s = Math.floor(Rec.el() / 1000), p = n => ('0' + n).slice(-2);
  t.textContent = p(Math.floor(s / 3600)) + ':' + p(Math.floor(s % 3600 / 60)) + ':' + p(s % 60);
  $('#cnt').textContent = 'Potongan terkirim: ' + Rec.sent + ' dari ' + Rec.n + (Rec.q.length ? ' (mengirim…)' : '');
  const c = $('#cap'); if (c && Rec.SR) c.innerHTML = Rec.txt.slice(-12).map(x => '<p>' + E(x) + '</p>').join('') + (Rec.interim ? '<p class="mut">' + E(Rec.interim) + '</p>' : '');
};
Rec.ui = () => {
  const r = S.rapat.find(x => x.id === Rec.rid) || {};
  $('#view').innerHTML = '<div class="card"><div class="bar"><span class="pill rd">● ' + (Rec.paused ? 'Dijeda' : 'Merekam') + '</span><h3 style="margin:0">' + E(r.judul) + '</h3></div><div class="timer" id="tm">00:00:00</div><p class="mut c" id="cnt"></p><div class="bar" style="justify-content:center"><button class="btn out" onclick="Rec.pz()">' + (Rec.paused ? 'Lanjut' : 'Jeda') + '</button><button class="btn" onclick="Rec.stop()">Selesai & Proses</button></div><p class="mut c sm">Jangan tutup halaman ini selama merekam.</p></div><div class="card"><h3>Transkrip langsung (perkiraan)</h3><div id="cap" class="cap">' + (Rec.SR ? '' : '<span class="mut">Browser ini tidak mendukung transkrip langsung. Transkrip lengkap tetap dibuat otomatis setelah rapat selesai.</span>') + '</div><p class="mut sm">Hanya pratinjau. Notulensi final disusun dari rekaman oleh AI dan wajib Anda tinjau.</p></div>';
  Rec.draw();
};
V.rekam = () => {
  if (Rec.on) return Rec.ui();
  const q = new URLSearchParams(location.hash.split('?')[1] || ''), o = S.rapat.filter(r => r.status === 'terjadwal' || r.status === 'merekam');
  $('#view').innerHTML = o.length ? '<div class="card" style="max-width:640px;margin:auto"><h3>Ruang Rekam</h3><label>Rapat<select id="rid">' + o.map(r => '<option value="' + r.id + '"' + (r.id === q.get('rid') ? ' selected' : '') + '>' + E(r.judul) + ' — ' + tgl(r.tanggal) + '</option>').join('') + '</select></label><div class="note">Rapat ini akan direkam. Pastikan seluruh peserta sudah diberi tahu. Audio dikirim ke Drive per 5 menit.</div><label class="ck"><input type="checkbox" id="ok"> Saya mengonfirmasi seluruh peserta telah diberi tahu</label><button class="rec" id="go" aria-label="Mulai Rekam">' + MIC + '</button><p class="c mut">Mulai Rekam</p></div>' : '<div class="card empty">Belum ada rapat terjadwal. <a href="#jadwal">Jadwalkan rapat</a> terlebih dahulu.</div>';
  const go = $('#go'); if (go) go.onclick = () => { if (!$('#ok').checked) return toast('Centang konfirmasi pemberitahuan peserta dahulu', 'er'); Rec.start($('#rid').value); };
  if (Rec.uploadUI) Rec.uploadUI();
};

/* ===== TINJAU & TERBITKAN ===== */
V.tinjau = () => {
  const L = S.rapat.filter(r => ['diproses', 'menunggu_tinjauan', 'gagal'].includes(r.status));
  $('#view').innerHTML = '<div class="card tbl">' + (L.length ? '<table><tr><th>Rapat</th><th>Tanggal</th><th>Status</th><th></th></tr>' + L.map(r => { const k = S.rekaman.filter(x => x.rid === r.id), d = k.filter(x => x.status === 'selesai').length; return '<tr><td><b>' + E(r.judul) + '</b></td><td>' + tgl(r.tanggal) + '</td><td>' + pill(r.status) + (r.status === 'diproses' ? '<br><span class="mut sm">Transkripsi ' + d + ' dari ' + k.length + ' potongan</span>' : '') + (r.status === 'gagal' ? '<br><span class="mut sm">Pemrosesan gagal, cek Execution log / kuota AI</span>' : '') + '</td><td>' + (r.status === 'menunggu_tinjauan' ? '<button class="btn sm" onclick="Ed(\'' + r.id + '\')">Tinjau</button>' : '') + '</td></tr>'; }).join('') + '</table>' : '<div class="empty">Tidak ada notulensi yang menunggu. Anda akan menerima email saat draf siap.</div>') + '</div>';
};
window.Ed = id => {
  busy = true; const r = S.rapat.find(x => x.id === id), PB = S.pembahasan.filter(p => p.rid === id).sort((a, b) => a.no - b.no), ps = S.peserta.filter(p => p.rid === id);
  const rg = PB.find(p => String(p.no) === '0') || { ringkasan: '' }, ag = PB.filter(p => String(p.no) !== '0'), fl = v => /perlu dicek/i.test(v) ? ' flag' : '';
  const trow = t => '<div class="tr"><input name="tg" value="' + E(t.tugas) + '" placeholder="Tugas" aria-label="Tugas"><select name="pic" aria-label="Penanggung jawab"><option value="">— PIC —</option>' + ps.map(p => '<option value="' + E(p.email) + '"' + (String(p.email).toLowerCase() === String(t.pic).toLowerCase() ? ' selected' : '') + '>' + E(p.nama) + '</option>').join('') + '</select><input type="date" name="tn" value="' + E(t.tenggat) + '" aria-label="Tenggat"><button type="button" class="ghost" aria-label="Hapus" onclick="this.parentNode.remove()">✕</button><input type="hidden" name="tid" value="' + E(t.id || '') + '"><input type="hidden" name="ts" value="' + E(t.status || 'belum') + '"></div>';
  $('#view').innerHTML = '<div class="bar"><button class="ghost" onclick="render()">← Kembali</button><h3 style="margin:0">' + E(r.judul) + '</h3>' + pill(r.status) + '</div><form id="ed" class="stack"><div class="card"><h3>Ringkasan Umum</h3><textarea name="rg" rows="4" class="' + fl(rg.ringkasan) + '">' + E(rg.ringkasan) + '</textarea><p class="mut sm">Kolom berlatar kuning berisi bagian “perlu dicek”. Periksa nama, angka, dan tanggal.</p></div>' +
    ag.map((p, i) => '<div class="card"><h3>Agenda ' + (i + 1) + '</h3><input name="topik" value="' + E(p.topik) + '" aria-label="Topik"><label style="margin-top:8px">Ringkasan<textarea name="rs" rows="3" class="' + fl(p.ringkasan) + '">' + E(p.ringkasan) + '</textarea></label><label>Poin penting (satu per baris)<textarea name="poin" rows="3" class="' + fl(p.poin) + '">' + E(p.poin) + '</textarea></label><label>Keputusan (satu per baris)<textarea name="kep" rows="2" class="' + fl(p.keputusan) + '">' + E(p.keputusan) + '</textarea></label></div>').join('') +
    '<div class="card"><h3>Tindak Lanjut</h3><div id="tl">' + S.tugas.filter(t => t.rid === id).map(trow).join('') + '</div><button type="button" class="btn out sm" id="at">+ Tambah Tugas</button></div><div class="bar end"><button type="button" class="btn out" id="sv">Simpan Draf</button><button type="button" class="btn gr" id="tb">Terbitkan</button></div></form>';
  $('#at').onclick = () => $('#tl').insertAdjacentHTML('beforeend', trow({ tugas: '', pic: '', tenggat: '', status: 'belum' }));
  const col = () => { const f = $('#ed'), g = n => [...f.querySelectorAll('[name=' + n + ']')].map(x => x.value), ph = [{ no: 0, topik: 'Ringkasan', ringkasan: f.elements.rg.value, poin: '', keputusan: '' }];
    g('topik').forEach((t, i) => ph.push({ no: i + 1, topik: t, ringkasan: g('rs')[i], poin: g('poin')[i], keputusan: g('kep')[i] }));
    return { rid: id, pembahasan: ph, tugas: g('tg').map((t, i) => ({ id: g('tid')[i], tugas: t, pic: g('pic')[i], tenggat: g('tn')[i], status: g('ts')[i] || 'belum' })).filter(x => x.tugas.trim()) }; };
  const simpan = async () => { await Api.call('notulensi.simpan', col()); await refresh(); };
  $('#sv').onclick = async () => { try { await simpan(); toast('Draf tersimpan'); } catch (e) { toast(e.message, 'er'); } };
  $('#tb').onclick = () => {
    const n = $('#ed').querySelectorAll('.flag').length, m = modal('<h3>Terbitkan Notulensi?</h3><p>PDF akan dibuat dan dikirim ke <b>' + ps.length + ' peserta</b>.</p>' + (n ? '<div class="note" style="background:#FEF3C7">' + n + ' bagian masih bertanda “perlu dicek”.</div>' : '') + '<div class="bar end"><button class="ghost" data-x>Batal</button><button class="btn gr" id="yes">Terbitkan & Kirim</button></div>');
    m.querySelector('#yes').onclick = async function () { this.disabled = true; this.textContent = 'Memproses…'; try { await simpan(); await Api.call('notulensi.terbit', { rid: id }); r.status = 'terbit'; save(); m.remove(); toast('Notulensi terbit dan terkirim'); location.hash = '#arsip'; refresh(); } catch (e) { m.remove(); toast(e.message, 'er'); } };
  };
};

/* ===== ARSIP & DETAIL ===== */
V.arsip = () => {
  $('#view').innerHTML = '<div class="bar"><input id="q" placeholder="Cari judul, topik, ringkasan, atau keputusan..." aria-label="Cari"></div><div class="card tbl" id="tb"></div>';
  const draw = () => {
    const q = $('#q').value.toLowerCase(), L = S.rapat.filter(r => r.status === 'terbit' && (r.judul + ' ' + S.pembahasan.filter(p => p.rid === r.id).map(p => p.topik + p.ringkasan + p.keputusan).join(' ')).toLowerCase().includes(q));
    $('#tb').innerHTML = L.length ? '<table><tr><th>Rapat</th><th>Tanggal</th><th>Pimpinan</th><th>Tindak lanjut</th><th></th></tr>' + L.map(r => { const t = S.tugas.filter(x => x.rid === r.id); return '<tr><td><b>' + E(r.judul) + '</b><br><span class="mut">' + E(r.kategori) + '</span></td><td>' + tgl(r.tanggal) + '</td><td>' + E(r.pemimpin) + '</td><td>' + t.filter(x => x.status === 'selesai').length + '/' + t.length + ' selesai</td><td><button class="btn sm out" onclick="Det(\'' + r.id + '\')">Lihat</button> ' + (r.pdf ? '<a class="btn sm" target="_blank" rel="noopener" href="https://drive.google.com/file/d/' + r.pdf + '/view">PDF</a>' : '') + '</td></tr>'; }).join('') + '</table>' : '<div class="empty">Belum ada notulensi terbit.</div>';
  };
  $('#q').oninput = draw; draw();
};
window.Det = id => {
  const r = S.rapat.find(x => x.id === id), PB = S.pembahasan.filter(p => p.rid === id).sort((a, b) => a.no - b.no), T = S.tugas.filter(t => t.rid === id), li = s => String(s || '').split('\n').filter(Boolean).map(x => '<li>' + E(x) + '</li>').join('');
  modal('<div class="bar"><h3 style="margin:0">' + E(r.judul) + '</h3>' + pill(r.status) + '</div><p class="mut">' + tgl(r.tanggal) + ' · ' + E(r.mulai) + '–' + E(r.selesai) + ' · ' + E(r.lokasi) + '<br>Pimpinan: ' + E(r.pemimpin) + ' · Peserta: ' + S.peserta.filter(p => p.rid === id).map(p => E(p.nama)).join(', ') + '</p>' +
    PB.map(p => String(p.no) === '0' ? '<h3>Ringkasan</h3><p>' + E(p.ringkasan) + '</p>' : '<h3>' + p.no + '. ' + E(p.topik) + '</h3><p>' + E(p.ringkasan) + '</p><ul>' + li(p.poin) + '</ul>' + (p.keputusan ? '<div class="kep"><b>Keputusan</b><ul>' + li(p.keputusan) + '</ul></div>' : '')).join('') +
    '<h3>Tindak Lanjut</h3>' + (T.length ? '<table><tr><th>Tugas</th><th>PIC</th><th>Tenggat</th><th>Status</th></tr>' + T.map(t => '<tr><td>' + E(t.tugas) + '</td><td>' + E(nama(t.pic)) + '</td><td>' + tgl(t.tenggat) + '</td><td>' + E(t.status) + '</td></tr>').join('') + '</table>' : '<p class="mut">Tidak ada.</p>') + '<div class="bar end" style="margin-top:16px"><button class="btn out" data-x>Tutup</button></div>', true);
};

/* ===== TINDAK LANJUT (optimistic) ===== */
V.tugas = () => {
  const L = mine(); $('#view').innerHTML = '<div class="card tbl">' + (L.length ? '<table><tr><th>Tugas</th><th>Rapat</th><th>PIC</th><th>Tenggat</th><th>Status</th></tr>' + L.map(t => { const r = S.rapat.find(x => x.id === t.rid) || {}, od = t.status !== 'selesai' && t.tenggat && t.tenggat < today(), ok = adm() || String(t.pic).toLowerCase() === S.me.email; return '<tr><td>' + E(t.tugas) + '</td><td>' + E(r.judul) + '</td><td>' + E(nama(t.pic)) + '</td><td class="' + (od ? 'od' : '') + '">' + (od ? '⚠ ' : '') + tgl(t.tenggat) + '</td><td><select ' + (ok ? '' : 'disabled') + ' aria-label="Status" onchange="TS(\'' + t.id + '\',this.value)">' + ['belum', 'proses', 'selesai'].map(s => '<option value="' + s + '"' + (t.status === s ? ' selected' : '') + '>' + s[0].toUpperCase() + s.slice(1) + '</option>').join('') + '</select></td></tr>'; }).join('') + '</table>' : '<div class="empty">Belum ada tindak lanjut.</div>') + '</div>';
};
window.TS = async (id, v) => {
  const t = S.tugas.find(x => x.id === id), old = t.status; t.status = v; save(); toast('Status diperbarui');
  try { await Api.call('tugas.status', { id, status: v }); } catch (e) { t.status = old; save(); render(); toast('Gagal: ' + e.message, 'er'); }
};

/* ===== LOGIN & START ===== */
function start() { $('#login').hidden = true; $('#app').hidden = false; render(); refresh(); }
function logout() { localStorage.removeItem('nr_t'); localStorage.removeItem('nr_s'); location.hash = ''; location.reload(); }
async function initLogin() {
  $('#skol').textContent = APP_CONFIG.NAMA_SEKOLAH;
  const show = id => { google.accounts.id.initialize({ client_id: id, callback: async r => { try { const d = await Api.call('auth.login', { idToken: r.credential }); Api.token = d.token; localStorage.setItem('nr_t', d.token); S.me = d.me; save(); start(); } catch (e) { $('#lerr').textContent = e.message; } } }); google.accounts.id.renderButton($('#gbtn'), { theme: 'outline', size: 'large', width: 300 }); };
  await new Promise(res => { const w = () => window.google && google.accounts ? res() : setTimeout(w, 100); w(); });
  const cid = localStorage.getItem('nr_cid'); if (cid) show(cid);
  try { const c = await Api.call('auth.config'); if (!c.googleClientId) $('#lerr').textContent = 'GOOGLE_CLIENT_ID belum diisi di Script Properties backend.'; else if (c.googleClientId !== cid) { localStorage.setItem('nr_cid', c.googleClientId); show(c.googleClientId); } }
  catch (e) { $('#lerr').textContent = e.message; }
}
if (Api.token && S.me) start(); else initLogin();
