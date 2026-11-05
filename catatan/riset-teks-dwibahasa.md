# Riset: teks dwibahasa (Indonesia dan Inggris) untuk aplikasi

Tanggal riset: 5 November 2026. Semua halaman saya ambil langsung hari ini.
Tanda: [terverifikasi] dengan URL, [inferensi], atau [belum diketahui].
Ringkasan halaman diambil lewat alat peringkas, jadi kutipan bisa bercampur parafrase.

## Rekomendasi

1. Pasang `lang` di `<html>` dan ubah nilainya lewat JavaScript saat bahasa berganti.
   Pakai tag BCP 47: `id` dan `en`. WCAG 3.1.1 meminta bahasa halaman dapat ditentukan
   perangkat lunak. Artikel W3C: "Always use a language attribute on the html tag", dan
   `meta Content-Language` atau CSS tidak cocok untuk ini. [terverifikasi]
   - https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html
   - https://www.w3.org/International/questions/qa-html-language-declarations

2. Namai tiap bahasa pada tombol dengan bahasanya sendiri: "Indonesia" dan "English".
   Jangan pakai bendera. W3C: tautan ditulis dalam bahasa tujuan, dan "resist the
   temptation to use country flags". [terverifikasi] Beri `lang` pada tiap label, sebab
   salah satunya selalu berbahasa lain daripada halaman. [inferensi dari WCAG 3.1.2]
   - https://www.w3.org/International/questions/qa-site-conneg
   - https://www.w3.org/International/questions/qa-navigation-select

3. Simpan pilihan di `localStorage` dengan try/catch. W3C menyebut cookie dan
   `localStorage` untuk mengingat pilihan. [terverifikasi] Halaman harus tetap jalan
   kalau penyimpanan diblokir. [inferensi]
   - https://www.w3.org/International/questions/qa-site-conneg

4. Bahasa awal: pilihan tersimpan, lalu `navigator.language`, lalu Indonesia sebagai
   cadangan. W3C menyebut pengaturan peramban sebagai dasar, mewajibkan opsi bawaan,
   dan melarang menebak dari lokasi. MDN: `navigator.language` adalah bahasa pilihan
   pembaca, biasanya bahasa antarmuka peramban, berformat BCP 47. [terverifikasi]
   Cocokkan awalan `id` atau `en` saja. [inferensi]
   - https://www.w3.org/International/questions/qa-site-conneg
   - https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language

5. Format angka dengan `Intl.NumberFormat` memakai locale aktif (`id-ID`, `en-US`).
   Hasil Node lokal hari ini [terverifikasi di mesin ini, bukan dari spesifikasi]:
   `id-ID` menulis 1.234.567,891 dan 25,6%; `en-US` menulis 1,234,567.891 dan 25.6%.
   Tanggal 5 November 2026 tampil "5 November 2026" (id-ID) dan "November 5, 2026" (en-US).
   MDN memuat contoh `de-DE` (123.456,789) dan contoh cadangan `["ban", "id"]` dengan
   hasil sama, jadi pola titik ribuan dan koma desimal untuk Indonesia terdukung tidak
   langsung. [terverifikasi] Spesifikasi ECMA-402 dan data CLDR tidak saya buka.
   [belum diketahui] EYD V tidak merumuskan aturan koma desimal, tetapi contohnya
   konsisten: "0,5 sentimeter", "Rp900.500,50", "5%". [terverifikasi dari contoh]
   - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
   - https://ejaan.kemendikdasmen.go.id/eyd/penulisan-kata/angka-dan-bilangan/

6. Buat tata letak lentur untuk teks yang memanjang. W3C: teks "will normally
   expand" saat diterjemahkan, paling besar pada string pendek (sekitar 200 sampai 300
   persen untuk sampai 10 karakter, sekitar 130 persen untuk lebih dari 70 karakter,
   mengutip IBM), dan hindari wadah berlebar tetap. [terverifikasi] Artikel itu tidak
   menyebut bahasa Indonesia, jadi arah dan besar ekspansi Inggris ke Indonesia tidak
   diketahui. [belum diketahui] Uji kedua bahasa di lebar ponsel, terutama tombol,
   label sumbu, dan judul tab. [inferensi]
   - https://www.w3.org/International/articles/article-text-size

7. Tulis kalimat pendek, aktif, satu gagasan per kalimat. Pedoman Plain Language:
   "Express only one idea in each sentence"; bentuk aktif ("You must do it", bukan "It
   must be done"); tulis untuk audiens Anda; jargon yang tidak perlu adalah keluhan
   pembaca nomor satu; plain language bukan menyederhanakan secara merendahkan.
   [terverifikasi] Halaman khusus "gunakan you" gagal saya ambil; sapaan langsung hanya
   terdukung lewat contoh tadi. [belum diketahui] Untuk Indonesia: ragam baku menurut
   KBBI dipakai orang terdidik, dalam tulisan ilmiah dan situasi resmi. [terverifikasi,
   parafrase] Jadi hindari "nggak" dan "banget". [inferensi, tidak ada daftar resminya]
   - https://raw.githubusercontent.com/GSA/plainlanguage.gov/main/_pages/guidelines/concise/write-short-sentences.md
   - https://raw.githubusercontent.com/GSA/plainlanguage.gov/main/_pages/guidelines/words/avoid-jargon.md
   - https://digital.gov/guides/plain-language/writing
   - https://kbbi.kemendikdasmen.go.id/entri/ragam%20baku

8. Jelaskan metrik dengan definisi scikit-learn, lalu terjemahkan ke kalimat awam.
   Hanya definisi ini yang diambil [terverifikasi]:
   - AUC: luas di bawah kurva ROC, merangkum kurva jadi satu angka. Kurva ROC memplot
     laju positif benar terhadap laju positif palsu pada berbagai ambang.
   - F1: rata-rata harmonik presisi dan recall, terbaik di 1, terburuk di 0. Presisi:
     tidak melabeli sampel negatif sebagai positif. Recall: menemukan semua sampel positif.
   - Kalibrasi: untuk prediksi sekitar 0,8, sekitar 80% sampel memang positif. Kurva
     kalibrasi memplot frekuensi kelas positif terhadap peluang prediksi per kelompok.
   - Brier: galat kuadrat untuk klasifikasi dengan target one-hot. Halaman itu
     memperingatkan bahwa Brier lebih rendah belum tentu berarti lebih terkalibrasi.
     Rumus dan "makin kecil makin baik" tidak tertulis di sana. [pengetahuan umum]
   - https://scikit-learn.org/stable/modules/model_evaluation.html
   - https://scikit-learn.org/stable/modules/calibration.html

## Catatan tambahan

Nilai `lang` pada data yang tidak diterjemahkan:
- WCAG 3.1.2 (AA) mengecualikan nama diri, istilah teknis, kata yang bahasanya tak
  tentu, dan kata yang sudah jadi bagian bahasa sekitarnya. Menandainya tetap
  dianjurkan. [terverifikasi] https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html
- Jadi nama gunung dan nama pendaki tidak wajib ditandai. Frasa utuh berbahasa Inggris
  dari dataset di halaman Indonesia paling aman dibungkus `lang="en"`. [inferensi]
- Teks berbahasa lain di atribut seperti `alt`: jangan pasang `lang` pada elemennya.
  Bungkus dalam `span` bertanda `lang`. [terverifikasi, artikel W3C deklarasi bahasa]

Ejaan Indonesia (EYD V, Badan Bahasa), semuanya [terverifikasi]:
- Kata atau ungkapan berbahasa daerah atau asing ditulis miring. Nama diri asing
  (orang, lembaga, merek) tidak dimiringkan.
  https://ejaan.kemendikdasmen.go.id/eyd/penggunaan-huruf/huruf-miring/
- Bilangan berupa angka di awal kalimat (lebih dari satu kata) didahului "sebanyak",
  "sejumlah", atau "sebesar", atau kalimatnya disusun ulang. Contoh resmi: "Panitia
  mengundang 2.500 orang peserta." Relevan untuk kalimat hasil prediksi.
- PUEBI tidak tertaut di situs Badan Bahasa; EYD V yang tersedia. https://ejaan.kemendikdasmen.go.id/

## Yang harus dihindari

- Bendera sebagai ikon bahasa, dan nama bahasa dalam satu bahasa saja.
- Mengganti teks tanpa memperbarui `lang` di `<html>`.
- Merangkai angka dengan string manual atau `toFixed` lalu menukar titik dan koma.
- Menebak bahasa dari IP atau lokasi.
- Menyimpan pilihan bahasa tanpa penanganan galat.
- Wadah berlebar tetap, dan menyingkat kata hanya agar muat.
- Terjemahan kata demi kata. Susun ulang kalimat menurut kebiasaan tiap bahasa.
- Bentuk percakapan di versi Indonesia, dan gaya santai di versi Inggris.
- Kalimat Indonesia yang dibuka angka tanpa kata penyerta.
- Menyebut Brier rendah sebagai bukti kalibrasi.
- Batasan model yang ada di satu bahasa tetapi hilang di bahasa lain. [inferensi]

## Sumber yang gagal atau parsial

- plainlanguage.gov dialihkan ke digital.gov. Teks lengkap Federal Plain Language
  Guidelines tidak terambil; dua aturan datang dari repositori GSA/plainlanguage.gov.
- kbbi.kemdikbud.go.id tidak terjangkau. Domain aktif: kbbi.kemendikdasmen.go.id.
- W3C qa-navigation-select tidak membahas bendera, `lang`, atau cara mengingat pilihan.
- ECMA-402 dan CLDR tidak dibuka.
