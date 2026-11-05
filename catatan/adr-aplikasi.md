# ADR-001: Arsitektur aplikasi prediksi

Status: diterima. Tanggal: 5 November 2026.

## Konteks

Repositori ini awalnya hanya berisi praproses. Proyek akhir butuh aplikasi yang
bisa dicoba penguji: masukan rencana ekspedisi, keluaran peluang sukses, plus
bukti bahwa angkanya layak dipercaya. Tim kecil, tanpa server khusus, dan
penguji harus bisa menjalankannya dengan tiga perintah.

## Keputusan

Satu proses FastAPI yang memuat model sekali, melayani tiga rute API dan
sekaligus berkas statis halaman web. Halaman web memakai HTML, CSS, dan
JavaScript biasa tanpa langkah build.

```
data/olahan -> pemodelan/latih.py -> model/model.joblib + metrik.json
                                          |
browser <-> aplikasi/main.py (FastAPI) <--+
              |- katalog.py   pilihan formulir dari data
              |- layanan.py   baris fitur, prediksi, skenario, peringatan
              `- web/         halaman statis
```

Praproses tetap satu objek scikit-learn di dalam pipeline model, jadi API dan
pelatihan memakai pengisian nilai kosong yang sama persis.

## Pilihan yang dipertimbangkan

Streamlit atau Gradio: tercepat dibuat, tapi tampilan dan kontrol atas
grafik terbatas, dan sulit dipisah jadi API. Ditolak karena proyek ini
dinilai juga dari rancangan sistemnya.

Next.js atau React dengan API terpisah: lebih lazim di industri, tapi menambah
Node, langkah build, dan dua proses untuk dijalankan. Ditolak karena dua layar
dan tiga rute tidak membutuhkannya.

FastAPI dengan halaman statis (dipilih): satu proses, satu bahasa di sisi
server, skema masukan tervalidasi otomatis lewat Pydantic.

## Konsekuensi

Lebih mudah: menjalankan, menguji (`TestClient` tanpa server), dan menjelaskan.

Lebih sulit: kalau layar bertambah banyak, JavaScript biasa mulai tidak
terkelola. Saat itu pindah ke kerangka kerja.

Perlu ditinjau ulang: model dimuat di memori, jadi satu proses satu salinan.
Cukup untuk demo, belum untuk lalu lintas besar. Tidak ada autentikasi dan
pembatas laju. Jangan buka ke internet publik tanpa itu.

## Tinjauan kode (5 November 2026)

Ditinjau dari sisi keamanan, performa, ketepatan, dan keterawatan.

Ditemukan dan sudah diperbaiki:
- Kolom oksigen mendominasi model. Diuji dengan melatih ulang tanpanya: AUC uji
  turun dari 0,863 ke 0,701. Angkanya kini dicatat di `metrik.json`, tampil di
  halaman Model, dan batasannya ditulis terbuka.
- Delta kecil negatif tampil sebagai "-0 poin". Sekarang dibulatkan dulu.
- Impor tak terpakai dan `zip` tanpa `strict` di `pemodelan/latih.py`.

Diperiksa dan dinilai aman:
- Masukan dibatasi `Field(ge, le)` dan dicek terhadap daftar puncak, peran, dan
  negara. Semua yang di luar daftar mendapat 422 (diuji di `uji/uji_aplikasi.py`).
- Teks dari API masuk halaman lewat `textContent`, bukan `innerHTML`.
- Satu permintaan memakai sekitar 47 milidetik, enam kali `predict_proba` untuk
  skenario. Cukup cepat, jadi tidak digabung.

Diterima sebagai utang, bukan diperbaiki:
- Rekam jejak agen dikosongkan dan diisi median, karena pengguna tidak punya
  angkanya. Prediksi untuk agen yang sangat kuat atau lemah akan meleset.
- Tahun rencana dipatok ke 2019. Model tidak punya fitur tahun.
- Skenario "apa kalau" berupa selisih prediksi, bukan sebab-akibat. Fitur yang
  berkorelasi (staf bayaran, ukuran tim) bergerak sendiri-sendiri di sini.
- Belum diperiksa apakah `oxygen_used` dicatat sebelum atau sesudah hasil
  pendakian. Kalau sesudah, sebagian AUC 0,863 adalah bocoran.
- Rentang peringatan di luar sebaran (persentil 1 dan 99) dihitung dari seluruh
  data, bukan hanya data latih. Rancangan sendiri, tanpa sumber primer.

Keputusan fitur aplikasi dan sumbernya ada di `riset-fitur-aplikasi.md`.
Dua penyimpangan dari rekomendasi riset: kontribusi per prediksi memakai skenario
"apa kalau", bukan SHAP, supaya tanpa dependensi tambahan. Model tidak
dikalibrasi ulang karena kurva reliabilitasnya sudah dekat diagonal.
