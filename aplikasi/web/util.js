"use strict";

// Alat kecil yang dipakai semua berkas JavaScript lain.
const $ = (id) => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";
const TAG_SVG = new Set(["svg", "g", "line", "rect", "text", "polyline", "title", "path", "polygon", "defs", "pattern", "clipPath"]);

// Pembangun elemen. Teks selalu lewat textContent, jadi data dari API tidak bisa menyuntik HTML.
function h(tag, attrs = {}, ...anak) {
  const e = TAG_SVG.has(tag) ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const a of anak.flat()) if (a != null) e.append(a);
  return e;
}
const kosongkan = (e) => e.replaceChildren();
const kurangGerak = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const ribuan = (n) => n.toLocaleString("id-ID");
const persen = (v, d = 1) => (v * 100).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";
const angka = (v, d = 3) => v.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
const poin = (v) => {
  const r = Math.round(v * 100);
  return (r > 0 ? "+" : r < 0 ? "-" : "") + Math.abs(r) + " " + TEKS.hasil.poin;
};

function skala(svg, lebar, tinggi) {
  kosongkan(svg);
  svg.setAttribute("viewBox", `0 0 ${lebar} ${tinggi}`);
}

// Tabel dari daftar kepala dan baris; kolom pertama jadi judul baris. `menang` menyorot satu baris.
function tabel(el, kepala, baris, menang) {
  kosongkan(el);
  el.append(h("thead", {}, h("tr", {}, kepala.map((k, i) => h("th", { scope: "col", ...(i ? { class: "num" } : {}) }, k)))));
  el.append(
    h("tbody", {}, baris.map((b, bi) =>
      h("tr", bi === menang ? { class: "menang" } : {}, b.map((c, i) => (i ? h("td", { class: "num" }, c) : h("th", { scope: "row" }, c)))),
    )),
  );
}
