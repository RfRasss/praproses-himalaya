"use strict";

const $ = (id) => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";
const MUSIM = { Spring: "Semi", Autumn: "Gugur", Winter: "Dingin", Summer: "Panas" };
const NAMA_FITUR = {
  oxygen_used: "Pakai oksigen",
  oxygen_used_ekspedisi: "Ekspedisi pakai oksigen",
  height_metres: "Tinggi puncak",
  peak_age_years: "Lama puncak sudah didaki",
  expedition_role: "Peran dalam ekspedisi",
  age: "Usia pendaki",
  hired_staff_count: "Jumlah staf bayaran",
  hired_staff_ratio: "Rasio staf bayaran",
  climbing_status: "Status puncak",
  team_size: "Ukuran tim",
  citizenship: "Kewarganegaraan",
  season: "Musim",
  sex: "Jenis kelamin",
  hired: "Pendaki staf bayaran",
  solo: "Pendakian solo",
  basecamp_month: "Bulan basecamp",
  is_eight_thousander: "Puncak 8000 m",
  first_ascent_country: "Negara pendaki pertama",
  agency_prior_climbers: "Pengalaman agen",
  agency_prior_success_rate: "Rekam jejak agen",
};

const persen = (v, d = 1) =>
  (v * 100).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";
const angka = (v, d = 3) =>
  v.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
const poin = (v) => {
  const r = Math.round(v * 100);
  return (r > 0 ? "+" : r < 0 ? "-" : "") + Math.abs(r) + " poin";
};

// Pembangun elemen. Teks selalu lewat textContent, jadi data dari API tidak bisa menyuntik HTML.
function h(tag, attrs = {}, ...anak) {
  const ns = ["svg", "g", "line", "rect", "text", "polyline", "title"].includes(tag);
  const e = ns ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const a of anak.flat()) if (a != null) e.append(a);
  return e;
}
const kosongkan = (e) => e.replaceChildren();

/* ---------- tab ---------- */
function tampilkanTab() {
  const tab = location.hash === "#model" ? "model" : "prediksi";
  for (const v of document.querySelectorAll(".view")) v.hidden = v.id !== tab;
  for (const a of document.querySelectorAll("[data-tab]")) {
    if (a.dataset.tab === tab) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  document.title = (tab === "model" ? "Kartu model" : "Prediksi") + " - Peluang Puncak Himalaya";
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

async function muatOpsi() {
  const r = await fetch("/api/opsi");
  if (!r.ok) throw new Error("Daftar pilihan tidak bisa dimuat.");
  const o = await r.json();
  isiPilihan($("peak_id"), o.puncak.map((p) => ({ value: p.id, label: `${p.nama} (${p.tinggi.toLocaleString("id-ID")} m)` })), "EVER");
  isiPilihan($("citizenship"), o.negara.map((n) => ({ value: n, label: n })), o.negara.includes("Japan") ? "Japan" : o.negara[0]);
  isiPilihan($("role"), o.peran.map((n) => ({ value: n, label: n })), "Climber");
  const wadah = $("musim");
  kosongkan(wadah);
  o.musim.forEach((m) => {
    wadah.append(
      h("input", { type: "radio", name: "season", id: "musim-" + m, value: m, ...(m === "Spring" ? { checked: "" } : {}) }),
      h("label", { for: "musim-" + m }, MUSIM[m] || m),
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
      throw new Error(typeof j.detail === "string" ? j.detail : `Server menjawab ${r.status}.`);
    }
    const data = await r.json();
    if (nomor !== permintaan) return; // sudah ada isian yang lebih baru
    gambarHasil(data, m);
    keadaan("isi");
  } catch (e) {
    if (nomor === permintaan) keadaan("galat", e.message || "Prediksi gagal.");
  }
}

/* ---------- hasil ---------- */
function gambarHasil(d, m) {
  $("persen").textContent = (d.peluang * 100).toLocaleString("id-ID", { maximumFractionDigits: 0 });
  const dari100 = Math.round(d.peluang * 100);
  $("kalimat").textContent = `Dari 100 pendaki dengan rencana seperti ini, sekitar ${dari100} diperkirakan mencapai puncak.`;

  const ul = $("peringatan");
  kosongkan(ul);
  d.peringatan.forEach((t) => ul.append(h("li", {}, t)));

  gambarDimensi(d, metrikCache);

  const tb = $("skenario");
  kosongkan(tb);
  d.skenario.forEach((s) =>
    tb.append(h("tr", {}, h("th", { scope: "row" }, s.label), h("td", { class: "num" }, persen(s.peluang, 0)), h("td", { class: "num" }, poin(s.selisih)))),
  );
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

  if (met) {
    [[met.berhasil_latih, "latih"], [met.berhasil_uji, "uji"]].forEach(([p, nama]) => {
      svg.append(h("line", { x1: X(p), x2: X(p), y1: Y - 22, y2: Y + 12, class: "ln--dash" }));
      svg.append(h("text", { x: X(p), y: 106, class: "t", "text-anchor": "middle" }, `${nama} ${persen(p)}`));
    });
  }

  d.skenario.forEach((s) =>
    svg.append(h("line", { x1: X(s.peluang), x2: X(s.peluang), y1: Y - 10, y2: Y + 10, class: "ln--ink ln" }, h("title", {}, `${s.label}: ${persen(s.peluang, 0)}`))),
  );

  svg.append(h("line", { x1: X(d.peluang), x2: X(d.peluang), y1: Y - 30, y2: Y + 14, class: "ln--heavy ln" }));
  const anchor = d.peluang < 0.06 ? "start" : d.peluang > 0.94 ? "end" : "middle";
  svg.append(h("text", { x: X(d.peluang), y: 14, class: "t--big t", "text-anchor": anchor }, persen(d.peluang, 0)));
}

/* ---------- halaman model ---------- */
function tabel(el, kepala, baris, menang) {
  kosongkan(el);
  el.append(h("thead", {}, h("tr", {}, kepala.map((k, i) => h("th", { scope: "col", ...(i ? { class: "num" } : {}) }, k)))));
  el.append(
    h("tbody", {}, baris.map((b, bi) =>
      h("tr", bi === menang ? { class: "menang" } : {}, b.map((c, i) => (i ? h("td", { class: "num" }, c) : h("th", { scope: "row" }, c)))),
    )),
  );
}

function skala(svg, lebar, tinggi) {
  kosongkan(svg);
  svg.setAttribute("viewBox", `0 0 ${lebar} ${tinggi}`);
}

function gambarKalibrasi(met) {
  const svg = $("kalibrasi");
  const S = 360, M = 44;
  skala(svg, S, S);
  const X = (p) => M + (S - M - 12) * p;
  const Y = (p) => S - M - (S - M - 12) * p;
  [0, 0.25, 0.5, 0.75, 1].forEach((p) => {
    svg.append(h("line", { x1: X(p), x2: X(p), y1: Y(0), y2: Y(1), class: "ln--grid ln" }));
    svg.append(h("line", { x1: X(0), x2: X(1), y1: Y(p), y2: Y(p), class: "ln--grid ln" }));
    svg.append(h("text", { x: X(p), y: S - M + 18, class: "t", "text-anchor": "middle" }, `${p * 100}`));
    svg.append(h("text", { x: M - 8, y: Y(p) + 4, class: "t", "text-anchor": "end" }, `${p * 100}`));
  });
  svg.append(h("line", { x1: X(0), x2: X(1), y1: Y(0), y2: Y(1), class: "ln--dash" }));
  svg.append(h("polyline", { points: met.kalibrasi.map((k) => `${X(k.prediksi)},${Y(k.nyata)}`).join(" "), class: "ln--ink" }));
  met.kalibrasi.forEach((k) =>
    svg.append(h("rect", { x: X(k.prediksi) - 3, y: Y(k.nyata) - 3, width: 6, height: 6, class: "mk" }, h("title", {}, `Prediksi ${persen(k.prediksi, 0)}, nyata ${persen(k.nyata, 0)}`))),
  );
  svg.append(h("text", { x: X(0.5), y: S - 6, class: "t", "text-anchor": "middle" }, "Peluang prediksi (%)"));
  svg.append(h("text", { x: 12, y: Y(0.5), class: "t", "text-anchor": "middle", transform: `rotate(-90 12 ${Y(0.5)})` }, "Kejadian nyata (%)"));

  const celah = Math.max(...met.kalibrasi.map((k) => Math.abs(k.prediksi - k.nyata)));
  $("kalibrasi-teks").textContent =
    `Sepuluh kelompok prediksi di data uji. Titik di garis putus-putus berarti jujur. Selisih terbesar ${angka(celah * 100, 1)} poin persen, ` +
    `rata-rata prediksi ${persen(met.tebak_rata_uji)} lawan kenyataan ${persen(met.berhasil_uji)}. Model tidak dikalibrasi ulang karena kurvanya sudah dekat diagonal.`;
}

function gambarGeser(met) {
  const svg = $("geser");
  const W = 900, H = 300, L = 44, R = 16, T = 24, B = 36;
  skala(svg, W, H);
  const th = met.per_tahun.map((t) => t.tahun);
  const a = Math.min(...th), b = Math.max(...th);
  const X = (t) => L + ((W - L - R) * (t - a)) / (b - a);
  const Y = (p) => H - B - (H - B - T) * p;
  [0, 0.25, 0.5, 0.75, 1].forEach((p) => {
    svg.append(h("line", { x1: L, x2: W - R, y1: Y(p), y2: Y(p), class: "ln--grid ln" }));
    svg.append(h("text", { x: L - 8, y: Y(p) + 4, class: "t", "text-anchor": "end" }, `${p * 100}%`));
  });
  for (let t = Math.ceil(a / 10) * 10; t <= b; t += 10) svg.append(h("text", { x: X(t), y: H - B + 20, class: "t", "text-anchor": "middle" }, String(t)));
  const potong = met.tahun_potong + 0.5;
  svg.append(h("line", { x1: X(potong), x2: X(potong), y1: T - 4, y2: H - B, class: "ln--dash" }));
  svg.append(h("text", { x: X(potong) - 6, y: T + 6, class: "t", "text-anchor": "end" }, "data latih"));
  svg.append(h("text", { x: X(potong) + 6, y: T + 6, class: "t" }, "data uji"));
  svg.append(h("polyline", { points: met.per_tahun.map((t) => `${X(t.tahun)},${Y(t.berhasil)}`).join(" "), class: "ln--ink" }));
  met.per_tahun_uji.forEach((t) =>
    svg.append(h("rect", { x: X(t.tahun) - 4, y: Y(t.prediksi) - 4, width: 8, height: 8, class: "mk--hollow" }, h("title", {}, `${t.tahun}: prediksi ${persen(t.prediksi)}, nyata ${persen(t.nyata)}`))),
  );
  svg.append(h("text", { x: L + 8, y: T + 6, class: "t" }, "garis: nyata, kotak kosong: prediksi"));

  const lebih = met.per_tahun_uji.filter((t) => t.prediksi > t.nyata).length;
  $("geser-teks").textContent =
    `Tingkat keberhasilan naik dari ${persen(met.berhasil_latih)} di data latih ke ${persen(met.berhasil_uji)} di data uji. ` +
    `Model terlalu optimis di ${lebih} dari ${met.per_tahun_uji.length} tahun uji, jadi angka per tahun tetap perlu dibaca hati-hati.`;

  tabel($("tahun-uji"), ["Tahun uji", "Baris", "Nyata", "Prediksi", "Akurasi", "Brier"],
    met.per_tahun_uji.map((t) => [String(t.tahun), t.n.toLocaleString("id-ID"), persen(t.nyata), persen(t.prediksi), persen(t.akurasi), angka(t.brier)]));
}

function gambarPenting(met) {
  const svg = $("penting");
  const atas = met.kepentingan.slice(0, 8);
  const W = 480, baris = 30, T = 8, L = 190, R = 56;
  skala(svg, W, T * 2 + baris * atas.length);
  const maks = Math.max(...atas.map((k) => k.turun_auc));
  atas.forEach((k, i) => {
    const y = T + i * baris;
    const lebar = Math.max(0, (k.turun_auc / maks) * (W - L - R));
    svg.append(h("text", { x: L - 10, y: y + 18, class: "t t--ink", "text-anchor": "end" }, NAMA_FITUR[k.fitur] || k.fitur));
    svg.append(h("rect", { x: L, y: y + 6, width: lebar, height: 16, class: "bar-svg" }));
    svg.append(h("text", { x: L + lebar + 8, y: y + 18, class: "t" }, angka(k.turun_auc, 3)));
  });
}

function isiModel(met) {
  const m = met.model[met.pemenang].uji;
  $("ringkas-model").textContent =
    `${met.pemenang} menang validasi silang. Dilatih pada ${met.n_latih.toLocaleString("id-ID")} baris sampai tahun ${met.tahun_potong}, ` +
    `diuji pada ${met.n_uji.toLocaleString("id-ID")} baris sesudahnya.`;

  const stats = $("stats");
  kosongkan(stats);
  [
    [angka(m.auc), "AUC pada data uji"],
    [persen(m.akurasi), `Akurasi, tebakan kelas mayoritas ${persen(met.garis_dasar_uji)}`],
    [angka(m.brier), "Brier pada data uji, makin kecil makin baik"],
    [persen(m.f1), "F1 pada data uji"],
  ].forEach(([v, l]) => stats.append(h("div", { class: "stat" }, h("span", { class: "figure" }, v), h("span", {}, l))));

  const nama = Object.keys(met.model);
  tabel($("banding"), ["Algoritma", "AUC validasi", "AUC uji", "Akurasi uji", "Brier uji"],
    nama.map((n) => {
      const x = met.model[n];
      return [n, `${angka(x.auc_cv_rata)} +/- ${angka(x.auc_cv_sd)}`, angka(x.uji.auc), persen(x.uji.akurasi), angka(x.uji.brier)];
    }), nama.indexOf(met.pemenang));

  tabel($("kelompok"), ["Kelompok", "Baris uji", "Nyata", "Prediksi", "AUC"],
    Object.entries(met.per_jenis_kelamin).map(([k, x]) => [k === "M" ? "Laki-laki" : "Perempuan", x.n.toLocaleString("id-ID"), persen(x.nyata), persen(x.prediksi), angka(x.auc)]));

  $("bt-oksigen").textContent =
    `Oksigen mendominasi model. Tanpa dua kolom oksigen, AUC uji turun dari ${angka(m.auc)} ke ${angka(met.auc_tanpa_oksigen)}. ` +
    "Kami belum memeriksa apakah kolom itu dicatat sebelum atau sesudah hasil pendakian diketahui, jadi sebagian sinyalnya bisa jadi bocoran.";

  gambarKalibrasi(met);
  gambarGeser(met);
  gambarPenting(met);
}

/* ---------- mulai ---------- */
async function mulai() {
  tampilkanTab();
  window.addEventListener("hashchange", tampilkanTab);
  try {
    const [, met] = await Promise.all([muatOpsi(), fetch("/api/model").then((r) => (r.ok ? r.json() : Promise.reject(new Error("Metrik model tidak bisa dimuat."))))]);
    metrikCache = met;
    isiModel(met);
  } catch (e) {
    keadaan("galat", e.message);
    return;
  }
  const f = $("form");
  const jadwal = () => { clearTimeout(tunda); tunda = setTimeout(hitung, 250); };
  f.addEventListener("input", jadwal);
  f.addEventListener("change", jadwal);
  f.addEventListener("submit", (e) => e.preventDefault());
  $("ulangi").addEventListener("click", hitung);
  hitung();
}

mulai();
