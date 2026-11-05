"use strict";

// Halaman Prediksi: tab, formulir, panggilan API, dan hasilnya.

/* ---------- tab ---------- */
function tampilkanTab() {
  const tab = location.hash === "#model" ? "model" : "prediksi";
  for (const v of document.querySelectorAll(".view")) v.hidden = v.id !== tab;
  for (const a of document.querySelectorAll("[data-tab]")) {
    if (a.dataset.tab === tab) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  document.title = TEKS.judul[tab] + TEKS.judul.akhiran;
}

/* ---------- formulir ---------- */
let metrikCache;
let permintaan = 0;
let tunda;

function isiPilihan(select, daftar, pilih) {
  kosongkan(select);
  for (const d of daftar) {
    const o = h("option", { value: d.value }, d.label);
    if (d.value === pilih) o.selected = true;
    select.append(o);
  }
}

let daftarPuncak = [];

async function muatOpsi() {
  const r = await fetch("/api/opsi");
  if (!r.ok) throw new Error(TEKS.galat.opsi);
  const o = await r.json();
  daftarPuncak = o.puncak.map((p) => ({ id: p.id, nama: p.nama, tinggi: p.tinggi }));
  isiPilihan($("peak_id"), o.puncak.map((p) => ({ value: p.id, label: `${p.nama} (${p.tinggi.toLocaleString("id-ID")} m)` })), "EVER");
  isiPilihan($("citizenship"), o.negara.map((n) => ({ value: n, label: n })), o.negara.includes("Japan") ? "Japan" : o.negara[0]);
  isiPilihan($("role"), o.peran.map((n) => ({ value: n, label: n })), "Climber");
  const wadah = $("musim");
  kosongkan(wadah);
  o.musim.forEach((m) => {
    wadah.append(
      h("input", { type: "radio", name: "season", id: "musim-" + m.id, value: m.id, ...(m.id === "Spring" ? { checked: "" } : {}) }),
      h("label", { for: "musim-" + m.id }, m.nama),
    );
  });
}

function baca() {
  const f = $("form");
  const angkaDari = (nama, min, max) => {
    const el = f.elements[nama];
    const v = el.value === "" ? NaN : Number(el.value);
    const sah = Number.isInteger(v) && v >= min && v <= max;
    el.setAttribute("aria-invalid", String(!sah));
    return sah ? v : null;
  };
  const m = {
    peak_id: f.elements.peak_id.value,
    season: f.elements.season.value,
    age: angkaDari("age", 10, 90),
    sex: f.elements.sex.value,
    citizenship: f.elements.citizenship.value,
    role: f.elements.role.value,
    team_size: angkaDari("team_size", 1, 99),
    hired_staff: angkaDari("hired_staff", 0, 99),
    hired: f.elements.hired.checked,
    solo: f.elements.solo.checked,
    oxygen: f.elements.oxygen.checked,
  };
  return Object.values(m).includes(null) ? null : m;
}

function keadaan(s, pesan) {
  $("hasil").dataset.state = s;
  if (pesan) $("galat-teks").textContent = pesan;
}

async function hitung() {
  const m = baca();
  if (!m) return; // isian belum sah: biarkan hasil terakhir, kolom yang salah sudah bertanda
  const nomor = ++permintaan;
  keadaan("memuat");
  try {
    const r = await fetch("/api/prediksi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(m),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      // Galat validasi Pydantic berupa daftar; loc terakhir adalah nama kolomnya.
      const kolom = Array.isArray(j.detail) && j.detail[0]?.loc?.at(-1);
      throw new Error(typeof j.detail === "string" ? j.detail : kolom ? TEKS.galat.isian(kolom) : TEKS.galat.server(r.status));
    }
    const data = await r.json();
    if (nomor !== permintaan) return; // sudah ada isian yang lebih baru
    gambarHasil(data, m);
    keadaan("isi");
  } catch (e) {
    if (nomor === permintaan) keadaan("galat", e.message || TEKS.galat.prediksi);
  }
}

/* ---------- hasil ---------- */
function gambarHasil(d, m) {
  naik(Math.round(d.peluang * 100));
  Gunung.setPeluang(d.peluang);
  const dari100 = Math.round(d.peluang * 100);
  const arah = d.peluang > metrikCache.berhasil_uji ? TEKS.hasil.di_atas : TEKS.hasil.di_bawah;
  $("kalimat").textContent = TEKS.hasil.kalimat(dari100, TEKS.hasil.banding(arah, persen(metrikCache.berhasil_uji)));

  const ul = $("peringatan");
  kosongkan(ul);
  d.peringatan.forEach((t) => ul.append(h("li", {}, t)));

  gambarDimensi(d, metrikCache);

  const tb = $("skenario");
  kosongkan(tb);
  d.skenario.forEach((s, i) => {
    const naikTurun = s.selisih >= 0 ? "sb sb--naik" : "sb sb--turun";
    const tr = h("tr", { tabindex: "0" },
      h("th", { scope: "row" }, s.label),
      h("td", { class: "num" }, persen(s.peluang, 0)),
      h("td", { class: "num" }, poin(s.selisih)),
      h("td", { class: "sel", "aria-hidden": "true" }, h("span", { class: naikTurun, style: `--s:${Math.min(1, Math.abs(s.selisih) / 0.5).toFixed(2)}` })));
    const sorot = (nyala) => document.querySelectorAll(`#dim [data-i="${i}"]`).forEach((e) => e.classList.toggle("on", nyala));
    for (const [ev, nyala] of [["mouseenter", true], ["focus", true], ["mouseleave", false], ["blur", false]]) tr.addEventListener(ev, () => sorot(nyala));
    tb.append(tr);
  });
}

// Angka persen naik pelan dari nilai sebelumnya, kecuali gerak dikurangi.
let tampil = 0, naikId = 0;
function naik(ke) {
  const el = $("persen"), id = ++naikId;
  if (kurangGerak()) { tampil = ke; el.textContent = ke; return; }
  const dari = tampil, t0 = performance.now();
  (function langkah(t) {
    if (id !== naikId) return;
    const k = Math.min(1, (t - t0) / 650);
    tampil = dari + (ke - dari) * (1 - (1 - k) ** 3);
    el.textContent = Math.round(tampil);
    if (k < 1) requestAnimationFrame(langkah);
  })(t0);
}

// Tanda ukur: skala 0 sampai 100 persen, prediksi sebagai tanda besar, skenario sebagai tanda kecil.
function gambarDimensi(d, met) {
  const svg = $("dim");
  kosongkan(svg);
  svg.setAttribute("viewBox", "0 0 640 112");
  const X = (p) => 20 + 600 * p;
  const Y = 56;
  svg.append(h("line", { x1: X(0), x2: X(1), y1: Y, y2: Y, class: "ln" }));
  for (const x of [X(0), X(1)]) svg.append(h("line", { x1: x - 6, x2: x + 6, y1: Y + 6, y2: Y - 6, class: "ln" }));
  for (let i = 1; i < 10; i++) svg.append(h("line", { x1: X(i / 10), x2: X(i / 10), y1: Y - 4, y2: Y + 4, class: "ln--soft ln" }));
  [[0, "0%", "start"], [0.5, "50%", "middle"], [1, "100%", "end"]].forEach(([p, t, a]) =>
    svg.append(h("text", { x: X(p), y: Y + 24, class: "t", "text-anchor": a }, t)),
  );

  [[met.berhasil_latih, TEKS.skala.latih], [met.berhasil_uji, TEKS.skala.uji]].forEach(([p, nama]) => {
    svg.append(h("line", { x1: X(p), x2: X(p), y1: Y - 22, y2: Y + 12, class: "ln--dash" }));
    svg.append(h("text", { x: X(p), y: 106, class: "t", "text-anchor": "middle" }, `${nama} ${persen(p)}`));
  });

  d.skenario.forEach((s, i) => {
    svg.append(h("line", { x1: X(s.peluang), x2: X(s.peluang), y1: Y - 10, y2: Y + 10, class: "ln--ink ln tik", "data-i": i }, h("title", {}, `${s.label}: ${persen(s.peluang, 0)}`)));
    svg.append(h("text", { x: X(s.peluang), y: Y - 38, class: "t t--ink tl", "text-anchor": "middle", "data-i": i }, persen(s.peluang, 0)));
  });

  svg.append(h("line", { x1: X(d.peluang), x2: X(d.peluang), y1: Y - 30, y2: Y + 14, class: "ln--heavy ln" }));
  const anchor = d.peluang < 0.06 ? "start" : d.peluang > 0.94 ? "end" : "middle";
  svg.append(h("text", { x: X(d.peluang), y: 14, class: "t--big t", "text-anchor": anchor }, persen(d.peluang, 0)));
}

/* ---------- mulai ---------- */
async function mulai() {
  tampilkanTab();
  window.addEventListener("hashchange", tampilkanTab);
  try {
    const [, met] = await Promise.all([muatOpsi(), fetch("/api/model").then((r) => (r.ok ? r.json() : Promise.reject(new Error(TEKS.galat.metrik))))]);
    metrikCache = met;
    isiModel(met);
  } catch (e) {
    keadaan("galat", e.message);
    return;
  }
  const f = $("form");
  Gunung.mulai($("gunung"), daftarPuncak);
  Gunung.setPuncak(f.elements.peak_id.value);
  f.elements.peak_id.addEventListener("change", (e) => Gunung.setPuncak(e.target.value));
  // Penggeser dan kolom angka saling menyalin supaya keduanya selalu sama.
  f.querySelectorAll(".slider").forEach((s) => {
    const kolom = f.elements[s.dataset.untuk];
    s.addEventListener("input", () => { kolom.value = s.value; });
    kolom.addEventListener("input", () => { if (kolom.value !== "") s.value = kolom.value; });
  });
  const jadwal = () => { clearTimeout(tunda); tunda = setTimeout(hitung, 250); };
  f.addEventListener("input", jadwal);
  f.addEventListener("change", jadwal);
  f.addEventListener("submit", (e) => e.preventDefault());
  $("ulangi").addEventListener("click", hitung);
  hitung();
}

mulai();
