const Api = {
  token: localStorage.getItem('nr_t'),
  async call(action, data) {
    if (/GANTI|XXXX/.test(APP_CONFIG.GAS_URL)) throw new Error('Konfigurasi belum lengkap: isi GAS_URL di js/config.js');
    const r = await fetch(APP_CONFIG.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: this.token, data }) });
    const j = await r.json();
    if (j.kode === 'AUTH') { logout(); throw new Error(j.pesan); }
    if (!j.ok) throw new Error(j.pesan || 'Terjadi kesalahan');
    return j.data;
  }
};
