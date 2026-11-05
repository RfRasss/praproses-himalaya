"use strict";

// Hero: foto nyata puncak yang dipilih, salju yang turun, dan alat ukur
// ketinggian tempat pendaki naik sejauh peluang prediksi. Skala alat ukur dari
// tinggi puncak yang nyata. Memakai alat dari util.js dan kalimat dari teks.js.
const Gunung = (() => {
  // Lima puncak punya foto sendiri (foto/<kode>.jpg). Sisanya memakai Pumori dan diberi tahu.
  const FOTO = { EVER: "ever", LHOT: "lhot", AMAD: "amad", CHOY: "choy", MAKA: "maka" };
  const ALAS = 4500; // meter, dasar alat ukur
  const Y_ATAS = 88, Y_BAWAH = 352, X = 92;
  const yDari = (m, tinggi) => Y_BAWAH - ((m - ALAS) / (tinggi - ALAS)) * (Y_BAWAH - Y_ATAS);

  let svg, hero, foto, aktif = 0, daftar = [], p = 0, tinggi = 8850, penanda, progres, label, sekarang = null;

  function acak(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function salju() {
    const r = acak(7), el = document.getElementById("salju");
    for (let i = 0; i < 46; i++) {
      el.append(h("rect", {
        x: (r() * 1200).toFixed(0), y: 0, width: 3, height: 3, class: "serpih",
        style: `--dx:${((r() - 0.5) * 160).toFixed(0)}px;animation-duration:${(7 + r() * 9).toFixed(1)}s;animation-delay:-${(r() * 16).toFixed(1)}s`,
      }));
    }
  }

  const altFoto = (kode, pengganti) => (pengganti ? TEKS.gunung.altPengganti : TEKS.gunung.alt)(TEKS.gunung.foto[kode]);
  const ketFoto = (id, q) => (FOTO[id] ? "" : TEKS.gunung.keterangan(TEKS.gunung.foto.umum, q.nama));

  function tukarFoto(kode, pengganti) {
    const berikut = foto[1 - aktif];
    const muat = new Image();
    muat.onload = () => {
      berikut.src = muat.src;
      berikut.alt = altFoto(kode, pengganti);
      berikut.classList.add("on");
      foto[aktif].classList.remove("on");
      aktif = 1 - aktif;
    };
    muat.src = `foto/${kode}.jpg`;
  }

  // Alat ukur: garis dari basecamp ke puncak, tanda tiap seribu meter, pendaki di antaranya.
  function ukur(q) {
    tinggi = q.tinggi;
    const a = h("g", { class: "gu-skala" });
    for (let m = Math.ceil(ALAS / 1000) * 1000; m < tinggi - 150; m += 1000) {
      a.append(h("line", { x1: X - 8, x2: X + 8, y1: yDari(m, tinggi), y2: yDari(m, tinggi), class: "gu-tik" }),
        h("text", { x: X - 14, y: yDari(m, tinggi) + 5, class: "gu-t", "text-anchor": "end" }, `${ribuan(m)} m`));
    }
    progres = h("line", { x1: X, x2: X, y1: Y_BAWAH, y2: Y_ATAS, class: "gu-progres", pathLength: 100 });
    label = h("text", { x: 16, y: 5, class: "gu-pct" }, "0%");
    penanda = h("g", { class: "gu-penanda" },
      h("rect", { x: -9, y: -9, width: 18, height: 18, class: "gu-kotak" }), label);
    svg.replaceChildren(
      h("line", { x1: X, x2: X, y1: Y_BAWAH, y2: Y_ATAS, class: "gu-garis" }),
      a, progres,
      h("g", { transform: `translate(${X} ${Y_ATAS})` },
        h("line", { x1: 0, x2: 0, y1: 0, y2: -32, class: "gu-tiang" }),
        h("polygon", { points: "0,-32 22,-25 0,-18", class: "gu-bendera" })),
      h("text", { x: X, y: 16, class: "gu-nama", "text-anchor": "middle" }, q.nama),
      h("text", { x: X, y: 36, class: "gu-t", "text-anchor": "middle" }, `${ribuan(q.tinggi)} m`),
      h("text", { x: X, y: Y_BAWAH + 26, class: "gu-t", "text-anchor": "middle" }, TEKS.gunung.basecamp),
      penanda);
    letakkan(true);
  }

  function letakkan(langsung) {
    if (!penanda) return;
    if (langsung) penanda.style.transition = "none";
    penanda.style.transform = `translate(${X}px, ${Y_BAWAH - p * (Y_BAWAH - Y_ATAS)}px)`;
    progres.style.strokeDashoffset = String(100 * (1 - p));
    label.textContent = `${Math.round(p * 100)}%`;
    if (langsung) { void penanda.getBoundingClientRect(); penanda.style.transition = ""; }
  }

  function mulai(el, puncak) {
    document.documentElement.classList.add("js");
    svg = el;
    daftar = puncak;
    hero = el.closest(".hero");
    foto = [...hero.querySelectorAll(".foto")];
    salju();
    // Foto bergeser sedikit mengikuti penunjuk, hanya kalau gerak diizinkan.
    hero.addEventListener("pointermove", (e) => {
      if (kurangGerak()) return;
      const b = hero.getBoundingClientRect();
      hero.style.setProperty("--px", ((e.clientX - b.left) / b.width - 0.5).toFixed(3));
      hero.style.setProperty("--py", ((e.clientY - b.top) / b.height - 0.5).toFixed(3));
    });
    hero.addEventListener("pointerleave", () => { hero.style.setProperty("--px", "0"); hero.style.setProperty("--py", "0"); });
  }

  return {
    mulai,
    setPuncak(id) {
      const q = daftar.find((d) => d.id === id);
      if (!q) return;
      const kode = FOTO[id] || "umum";
      sekarang = q;
      tukarFoto(kode, !FOTO[id]);
      document.getElementById("foto-ket").textContent = ketFoto(id, q);
      ukur(q);
    },
    // Dipanggil saat bahasa berganti: tulis ulang teks alat ukur, keterangan, dan alt foto.
    segarkan() {
      if (!sekarang) return;
      document.getElementById("foto-ket").textContent = ketFoto(sekarang.id, sekarang);
      foto[aktif].alt = altFoto(FOTO[sekarang.id] || "umum", !FOTO[sekarang.id]);
      ukur(sekarang);
    },
    setPeluang(v) { p = v; letakkan(false); },
  };
})();
