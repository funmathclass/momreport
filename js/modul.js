/* Modul v1.1: PWA (pasang di HP), warmup server, segarkan saat tab aktif, Kontak & Impor. */
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
let ipr; addEventListener('beforeinstallprompt', e => { e.preventDefault(); ipr = e; const b = document.createElement('button'); b.className = 'btn sm'; b.textContent = 'Pasang Aplikasi'; b.style.cssText = 'position:fixed;right:16px;bottom:84px;z-index:20'; b.onclick = async () => { ipr.prompt(); await ipr.userChoice; b.remove(); ipr = null; }; document.body.appendChild(b); });
(() => { try { const t = +sessionStorage.getItem('nr_w') || 0; if (Date.now() - t > 24e4 && !/GANTI|XXXX/.test(APP_CONFIG.GAS_URL)) { sessionStorage.setItem('nr_w', Date.now()); fetch(APP_CONFIG.GAS_URL + '?w=1', { mode: 'no-cors' }).catch(() => {}); } } catch (e) {} })();
let lastF = Date.now(); document.addEventListener('visibilitychange', () => { if (!document.hidden && S.me && Date.now() - lastF > 60000) { lastF = Date.now(); refresh(); } });

const ea = s => E(s).replace(/'/g, '&#39;');
window.KS = async (email, p) => { const u = S.pengguna.find(x => x.email === email); Object.assign(u, p); save(); try { await Api.call('crm.simpan', Object.assign({ email }, p)); toast('Kontak disimpan'); } catch (e) { toast(e.message, 'er'); refresh(); } };
window.formKontak = () => {
  const m = modal('<h3>Tambah / Ubah Pengguna</h3><form><label>Nama<input name="nama" required></label><label>Email Google *<input type="email" name="email" required></label><label>WhatsApp<input name="wa" placeholder="08..."></label><label>Peran<select name="peran"><option value="peserta">Peserta</option><option value="admin">Admin / Notulen</option></select></label><div class="bar end"><button type="button" class="ghost" data-x>Batal</button><button class="btn">Simpan</button></div></form>');
  m.querySelector('form').onsubmit = async e => { e.preventDefault(); try { await Api.call('crm.simpan', Object.fromEntries(new FormData(e.target))); m.remove(); toast('Pengguna disimpan'); await refresh(); } catch (er) { toast(er.message, 'er'); } };
};
V.kontak = () => {
  $('#view').innerHTML = '<div class="card tbl"><div class="bar" style="padding:16px 16px 0"><h3 style="margin:0;flex:1">Kontak & Pengguna</h3><button class="btn sm" onclick="formKontak()">+ Tambah</button></div><table><tr><th>Nama</th><th>Email</th><th>Peran</th><th>WhatsApp</th><th>Opt-out</th><th>Aktif</th></tr>' +
    S.pengguna.map(u => '<tr><td>' + E(u.nama) + '</td><td>' + E(u.email) + '</td><td>' + E(u.peran) + '</td><td><input value="' + E(u.wa) + '" placeholder="08..." aria-label="WhatsApp" onchange="KS(\'' + ea(u.email) + '\',{wa:this.value})"></td><td><input type="checkbox" aria-label="Opt-out" ' + (u.optout === 'ya' ? 'checked' : '') + ' onchange="KS(\'' + ea(u.email) + '\',{optout:this.checked?\'ya\':\'\'})"></td><td><input type="checkbox" aria-label="Aktif" ' + (String(u.aktif) !== 'false' ? 'checked' : '') + ' onchange="KS(\'' + ea(u.email) + '\',{aktif:String(this.checked)})"></td></tr>').join('') + '</table></div>' +
    '<div class="two"><div class="card"><h3>Pengumuman WhatsApp</h3><p class="mut sm">Dikirim lewat antrean ke kontak aktif yang tidak opt-out. Butuh FONNTE_TOKEN di Script Properties.</p><textarea id="bm" rows="4" placeholder="Tulis pengumuman..."></textarea><div class="bar end" style="margin:12px 0 0"><button class="btn" id="bs">Kirim ke Antrean</button></div></div>' +
    '<div class="card"><h3>Impor Data Lama</h3><p class="mut sm">Spreadsheet lama hanya dibaca, tidak diubah. Aman diulang (data yang sudah ada dilewati).</p><input id="src" placeholder="URL / ID spreadsheet lama"><div class="bar" style="margin:12px 0"><button class="btn out" id="ip">Pindai (tanpa menulis)</button><button class="btn" id="ij">Jalankan Impor</button></div><div id="ih"></div></div></div>';
  $('#bs').onclick = async () => { try { const n = (await Api.call('crm.blast', { dry: true })).total; if (!n) return toast('Belum ada kontak dengan nomor WA yang valid', 'er'); if (!confirm('Kirim ke ' + n + ' kontak?')) return; const d = await Api.call('crm.blast', { pesan: $('#bm').value }); toast(d.total + ' pesan masuk antrean'); $('#bm').value = ''; } catch (e) { toast(e.message, 'er'); } };
  const run = dry => async () => { const s = $('#src').value.trim(); if (!s) return toast('Isi URL spreadsheet lama', 'er'); if (!dry && !confirm('Jalankan impor sekarang?')) return; $('#ih').innerHTML = '<p class="mut">Memproses…</p>'; try { const d = await Api.call('import.jalankan', { source: s, dryRun: dry }); $('#ih').innerHTML = '<table><tr><th>Data</th><th>Di sumber</th><th>' + (dry ? 'Akan ditambah' : 'Ditambah') + '</th><th>Dilewati</th></tr>' + Object.keys(d.report).map(k => { const r = d.report[k]; return r ? '<tr><td>' + k + '</td><td>' + r.sumber + '</td><td>' + r.tambah + '</td><td>' + r.lewat + '</td></tr>' : '<tr><td>' + k + '</td><td colspan="3" class="mut">Sheet tidak ditemukan</td></tr>'; }).join('') + '</table>'; if (!dry) { toast('Impor selesai'); refresh(); } } catch (e) { $('#ih').innerHTML = ''; toast(e.message, 'er'); } };
  $('#ip').onclick = run(true); $('#ij').onclick = run(false);
};
if (!$('#app').hidden) render();

/* ===== Unggah rekaman dari HP / laptop (m4a, mp3, wav, aac, ogg, flac) ===== */
Rec.uploadUI = () => {
  const o = S.rapat.filter(r => ['terjadwal', 'merekam', 'gagal'].includes(r.status)); if (!o.length) return;
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  $('#view').insertAdjacentHTML('beforeend', '<div class="card" style="max-width:640px;margin:16px auto"><h3>Unggah Rekaman dari HP</h3><p class="mut sm">Pilih berkas suara (MP3, M4A, WAV, AAC, OGG, FLAC), maksimal 12 MB (± 15–25 menit). Rapat lebih panjang: potong atau kompres dulu menjadi MP3. Rapat berstatus Gagal bisa diunggah ulang di sini.</p><label>Rapat<select id="urid">' + o.map(r => '<option value="' + r.id + '"' + (r.id === q.get('rid') ? ' selected' : '') + '>' + E(r.judul) + ' — ' + tgl(r.tanggal) + (r.status === 'gagal' ? ' (gagal)' : '') + '</option>').join('') + '</select></label><label>Berkas audio<input type="file" id="uf" accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.flac"></label><label class="ck"><input type="checkbox" id="uok"> Saya mengonfirmasi seluruh peserta telah diberi tahu</label><button class="btn" id="ub">Unggah & Proses</button><p class="mut sm" id="us"></p></div>');
  $('#ub').onclick = Rec.upload;
};
Rec.upload = async () => {
  const f = $('#uf').files[0], rid = $('#urid').value;
  if (!f) return toast('Pilih berkas audio dahulu', 'er');
  if (!$('#uok').checked) return toast('Centang konfirmasi pemberitahuan peserta dahulu', 'er');
  if (f.size > 12 * 1048576) return toast('Berkas ' + (f.size / 1048576).toFixed(1) + ' MB melebihi 12 MB. Potong atau kompres dulu menjadi MP3.', 'er');
  const M = { mp3: 'audio/mp3', wav: 'audio/wav', aac: 'audio/aac', m4a: 'audio/mp4', ogg: 'audio/ogg', flac: 'audio/flac', aiff: 'audio/aiff' }, ext = (f.name.split('.').pop() || '').toLowerCase(), mime = M[ext] || (f.type || '').split(';')[0];
  if (!mime.startsWith('audio/')) return toast('Format berkas tidak didukung', 'er');
  const b = $('#ub'); b.disabled = true; $('#us').textContent = 'Mengunggah… jangan tutup halaman ini.';
  try {
    const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(f); });
    await Api.call('rekam.mulai', { rid, ganti: true });
    await Api.call('rekam.potongan', { rid, no: 1, mime, b64 });
    await Api.call('rekam.selesai', { rid });
    const r = S.rapat.find(x => x.id === rid); if (r) r.status = 'diproses'; save();
    toast('Berkas terkirim. Notulensi sedang disusun.'); location.hash = '#tinjau'; refresh();
  } catch (e) { b.disabled = false; $('#us').textContent = ''; toast(e.message, 'er'); }
};
