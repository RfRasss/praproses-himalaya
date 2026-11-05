"use strict";

// Halaman Model: kartu angka, tabel, dan tiga grafik. Semua dari /api/model.
const GARIS = [0, 0.25, 0.5, 0.75, 1];

function gambarKalibrasi(met) {
  const svg = $("kalibrasi");
  const S = 360, M = 44;
  skala(svg, S, S);
  const X = (p) => M + (S - M - 12) * p;
  const Y = (p) => S - M - (S - M - 12) * p;
  GARIS.forEach((p) => {
    svg.append(h("line", { x1: X(p), x2: X(p), y1: Y(0), y2: Y(1), class: "ln--grid ln" }));
    svg.append(h("line", { x1: X(0), x2: X(1), y1: Y(p), y2: Y(p), class: "ln--grid ln" }));
    svg.append(h("text", { x: X(p), y: S - M + 18, class: "t", "text-anchor": "middle" }, `${p * 100}`));
    svg.append(h("text", { x: M - 8, y: Y(p) + 4, class: "t", "text-anchor": "end" }, `${p * 100}`));
  });
  svg.append(h("line", { x1: X(0), x2: X(1), y1: Y(0), y2: Y(1), class: "ln--dash" }));
  svg.append(h("polyline", { points: met.kalibrasi.map((k) => `${X(k.prediksi)},${Y(k.nyata)}`).join(" "), class: "ln--ink", pathLength: 1 }));
  met.kalibrasi.forEach((k) =>
    svg.append(h("rect", { x: X(k.prediksi) - 3, y: Y(k.nyata) - 3, width: 6, height: 6, class: "mk" }, h("title", {}, TEKS.kalibrasi.titik(persen(k.prediksi, 0), persen(k.nyata, 0))))),
  );
  svg.append(h("text", { x: X(0.5), y: S - 6, class: "t", "text-anchor": "middle" }, TEKS.kalibrasi.sumbuX));
  svg.append(h("text", { x: 12, y: Y(0.5), class: "t", "text-anchor": "middle", transform: `rotate(-90 12 ${Y(0.5)})` }, TEKS.kalibrasi.sumbuY));

  const celah = Math.max(...met.kalibrasi.map((k) => Math.abs(k.prediksi - k.nyata)));
  $("kalibrasi-teks").textContent = TEKS.kalibrasi.uraian(angka(celah * 100, 1), persen(met.tebak_rata_uji), persen(met.berhasil_uji));
}

function gambarGeser(met) {
  const svg = $("geser");
  const W = 900, H = 300, L = 44, R = 16, T = 24, B = 36;
  skala(svg, W, H);
  const tahun = met.per_tahun.map((t) => t.tahun);
  const awal = Math.min(...tahun), akhir = Math.max(...tahun);
  const X = (t) => L + ((W - L - R) * (t - awal)) / (akhir - awal);
  const Y = (p) => H - B - (H - B - T) * p;
  GARIS.forEach((p) => {
    svg.append(h("line", { x1: L, x2: W - R, y1: Y(p), y2: Y(p), class: "ln--grid ln" }));
    svg.append(h("text", { x: L - 8, y: Y(p) + 4, class: "t", "text-anchor": "end" }, `${p * 100}%`));
  });
  for (let t = Math.ceil(awal / 10) * 10; t <= akhir; t += 10) svg.append(h("text", { x: X(t), y: H - B + 20, class: "t", "text-anchor": "middle" }, String(t)));
  const potong = met.tahun_potong + 0.5;
  svg.append(h("line", { x1: X(potong), x2: X(potong), y1: T - 4, y2: H - B, class: "ln--dash" }));
  svg.append(h("text", { x: X(potong) - 6, y: T + 6, class: "t", "text-anchor": "end" }, TEKS.geser.latih));
  svg.append(h("text", { x: X(potong) + 6, y: T + 6, class: "t" }, TEKS.geser.uji));
  svg.append(h("polyline", { points: met.per_tahun.map((t) => `${X(t.tahun)},${Y(t.berhasil)}`).join(" "), class: "ln--ink", pathLength: 1 }));
  met.per_tahun_uji.forEach((t) =>
    svg.append(h("rect", { x: X(t.tahun) - 4, y: Y(t.prediksi) - 4, width: 8, height: 8, class: "mk--hollow" }, h("title", {}, TEKS.geser.titik(t.tahun, persen(t.prediksi), persen(t.nyata))))),
  );
  svg.append(h("text", { x: L + 8, y: T + 6, class: "t" }, TEKS.geser.legenda));

  // Garis bacaan: ikuti penunjuk dan tampilkan angka tahun terdekat.
  const garis = h("line", { y1: T - 4, y2: H - B, class: "ln--ink ln" });
  const bacaan = h("text", { class: "t t--ink halo", y: T + 24 });
  const baca = h("g", { class: "baca" }, garis, bacaan);
  const tangkap = h("rect", { x: L, y: T - 4, width: W - L - R, height: H - B - T + 4, class: "tangkap" });
  svg.append(baca, tangkap);
  tangkap.addEventListener("pointermove", (e) => {
    const b = svg.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * W;
    const t = Math.max(awal, Math.min(akhir, Math.round(awal + ((x - L) / (W - L - R)) * (akhir - awal))));
    const d = met.per_tahun.find((r) => r.tahun === t);
    if (!d) return;
    baca.classList.add("on");
    garis.setAttribute("x1", X(t)); garis.setAttribute("x2", X(t));
    bacaan.textContent = TEKS.geser.baca(t, persen(d.berhasil), ribuan(d.n));
    bacaan.setAttribute("x", X(t) + (X(t) > W / 2 ? -8 : 8));
    bacaan.setAttribute("text-anchor", X(t) > W / 2 ? "end" : "start");
  });
  tangkap.addEventListener("pointerleave", () => baca.classList.remove("on"));

  const lebih = met.per_tahun_uji.filter((t) => t.prediksi > t.nyata).length;
  $("geser-teks").textContent = TEKS.geser.uraian(persen(met.berhasil_latih), persen(met.berhasil_uji), lebih, met.per_tahun_uji.length);
  tabel($("tahun-uji"), TEKS.geser.tabel,
    met.per_tahun_uji.map((t) => [String(t.tahun), ribuan(t.n), persen(t.nyata), persen(t.prediksi), persen(t.akurasi), angka(t.brier)]));
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
    svg.append(h("text", { x: L - 10, y: y + 18, class: "t t--ink", "text-anchor": "end" }, TEKS.fitur[k.fitur] || k.fitur));
    svg.append(h("rect", { x: L, y: y + 6, width: lebar, height: 16, class: "bar-svg" }));
    svg.append(h("text", { x: L + lebar + 8, y: y + 18, class: "t" }, angka(k.turun_auc, 3)));
  });
}

function isiModel(met) {
  const m = met.model[met.pemenang].uji, T = TEKS.model;
  $("ringkas-model").textContent = T.ringkas(met.pemenang, ribuan(met.n_latih), met.tahun_potong, ribuan(met.n_uji));

  const stats = $("stats");
  kosongkan(stats);
  [
    [angka(m.auc), T.stat.auc],
    [persen(m.akurasi), T.stat.akurasi(persen(met.garis_dasar_uji))],
    [angka(m.brier), T.stat.brier],
    [persen(m.f1), T.stat.f1],
  ].forEach(([v, l]) => stats.append(h("div", { class: "stat" }, h("span", { class: "figure" }, v), h("span", {}, l))));

  const nama = Object.keys(met.model);
  tabel($("banding"), T.banding.kepala,
    nama.map((n) => {
      const x = met.model[n];
      return [n, `${angka(x.auc_cv_rata)} +/- ${angka(x.auc_cv_sd)}`, angka(x.uji.auc), persen(x.uji.akurasi), angka(x.uji.brier)];
    }), nama.indexOf(met.pemenang));

  tabel($("kelompok"), T.kelompok.kepala,
    Object.entries(met.per_jenis_kelamin).map(([k, x]) => [T.kelompok[k] || k, ribuan(x.n), persen(x.nyata), persen(x.prediksi), angka(x.auc)]));

  $("bt-oksigen").textContent = T.oksigen(angka(m.auc), angka(met.auc_tanpa_oksigen));

  gambarKalibrasi(met);
  gambarGeser(met);
  gambarPenting(met);
}
