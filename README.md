# Praproses data pendakian Himalaya

Bagian praproses untuk project akhir mata kuliah Pembelajaran Mesin. Repositori
ini menyiapkan data Himalayan Database supaya siap dipakai anggota kelompok yang
memegang pemodelan.

Masalah yang diangkat kelompok: memprediksi apakah seorang pendaki berhasil
mencapai puncak, berdasarkan rencana ekspedisinya. Jadi ini masalah klasifikasi
biner.

Repositori ini juga memuat model dan aplikasinya, yang bernama Zenith: pelatihan tiga algoritma,
API FastAPI, dan halaman web tempat Anda mengisi rencana ekspedisi lalu melihat
peluang suksesnya.

Yang dikerjakan di bagian praproses: menggabungkan tiga tabel sumber, membuang kolom yang
bocor, membuat fitur turunan, menangani nilai kosong dan nilai janggal, lalu
membagi data latih dan uji. Pemilihan algoritma dan evaluasi model ada di
`pemodelan/`.

## Cara menjalankan

Butuh Python 3.10 ke atas.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python jalankan.py
```

Perintah `source` cukup sekali per terminal. Tanpa lingkungan virtual yang
aktif, `python` memakai Python sistem yang tidak punya scikit-learn.

Perintah itu mengunduh data mentah kalau belum ada, memprosesnya, lalu menulis
tiga berkas ke `data/olahan/` dan satu ringkasan ke `catatan/ringkasan-data.md`.
Lama jalannya sekitar sepuluh detik.

Lalu latih model dan jalankan aplikasinya:

```bash
python -m pemodelan.latih                 # sekitar 45 detik, menulis model/
uvicorn aplikasi.main:app                 # buka http://127.0.0.1:8000
```

Halaman Prediksi menerima rencana ekspedisi. Halaman Model memuat kartu model:
perbandingan algoritma, diagram kalibrasi, pergeseran tingkat sukses per tahun,
fitur terpenting, kinerja per jenis kelamin, dan batasan.

Untuk memastikan hasilnya benar:

```bash
python uji/uji_praproses.py    # 29 pemeriksaan, harus lulus semua
python uji/cek_kewarasan.py    # memastikan data punya sinyal dan tidak bocor
python uji/uji_aplikasi.py     # 19 pemeriksaan API dan model, jalankan setelah melatih
```

## Isi repositori

```
praproses/          modul praproses
  unduh.py          pengunduh data mentah
  gabung.py         penggabungan tiga tabel dan pembuangan kolom bocor
  fitur.py          pembuatan fitur turunan
  pembagian.py      pembagian latih dan uji, kunci pengelompokan
  pipeline.py       pipeline scikit-learn untuk bagian pemodelan
uji/
  uji_praproses.py  pengujian kebenaran praproses
  cek_kewarasan.py  pemeriksaan sinyal dan kebocoran
catatan/
  keputusan-praproses.md  alasan tiap keputusan, lengkap dengan angkanya
  adr-aplikasi.md         arsitektur aplikasi dan tinjauan kodenya
  riset-fitur-aplikasi.md riset fitur aplikasi, dengan sumber primer
  kamus-variabel.md       arti tiap kolom
  ringkasan-data.md       angka ringkas, dibuat otomatis
pemodelan/
  latih.py          bandingkan tiga algoritma, simpan pemenang dan metrik
aplikasi/
  main.py           rute API dan penyaji halaman web
  layanan.py        dari masukan formulir ke prediksi, skenario, peringatan
  katalog.py        pilihan formulir dari data
  web/              halaman: index.html, style.css, teks.js (semua kata, dua bahasa),
                    util.js (alat kecil), app.js (layar Prediksi),
                    grafik.js (layar Model), gunung.js (foto dan alat ukur)
jalankan.py         skrip utama
```

Nama fungsi dan variabel memakai bahasa Indonesia. Nama kolom dibiarkan sama
persis seperti sumbernya supaya masih bisa dicocokkan langsung dengan kamus data
resmi.

## Angka-angka utama

Data akhir berisi 76.519 baris dan 32 kolom, dari 10.351 ekspedisi dan 391
puncak, rentang tahun 1905 sampai 2019. Dua puluh kolom dipakai sebagai fitur,
terdiri dari 14 numerik dan 6 kategorik.

Targetnya timpang ringan: 38,2 persen berhasil dan 61,8 persen gagal. Garis
dasar tebakan kelas mayoritas ada di 61,8 persen, jadi model apa pun harus
mengalahkan angka itu dulu sebelum dianggap berguna.

Pembagian latih dan uji berdasarkan tahun, bukan acak. Data latih berisi tahun
2012 ke bawah sebanyak 59.431 baris atau 77,7 persen. Data uji berisi tahun 2013
ke atas sebanyak 17.088 baris atau 22,3 persen. Tidak ada satu pun ekspedisi yang
muncul di kedua sisi.

Satu hal yang harus diketahui bagian pemodelan sejak awal: tingkat keberhasilan
di data latih 34,7 persen, di data uji 50,1 persen. Selisih 15 poin itu nyata,
bukan kesalahan pembagian. Pendakian Himalaya zaman sekarang memang jauh lebih
sering berhasil. Penjelasannya ada di keputusan-praproses.md bagian 9.

## Cara memakainya di bagian pemodelan

Nilai kosong sengaja tidak diisi di berkas keluaran. Pengisiannya dikerjakan di
dalam pipeline, supaya nilai penggantinya dipelajari dari data latih saja.

```python
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline

from praproses.pipeline import FITUR, buat_praproses
from praproses.pembagian import KOLOM_KUNCI, pembagi_silang

latih = pd.read_parquet("data/olahan/latih.parquet")
uji = pd.read_parquet("data/olahan/uji.parquet")

pipa = Pipeline([
    ("praproses", buat_praproses()),
    ("model", RandomForestClassifier(random_state=0)),
])
pipa.fit(latih[FITUR], latih["success"])
```

Untuk validasi silang di dalam data latih, pakai pembagi yang menjaga satu
ekspedisi tetap utuh:

```python
from sklearn.model_selection import cross_val_score

skor = cross_val_score(
    pipa, latih[FITUR], latih["success"],
    groups=latih[KOLOM_KUNCI],
    cv=pembagi_silang(5),
    scoring="f1",
)
```

Jangan pakai `train_test_split` biasa pada data ini. Anggota satu ekspedisi
menghadapi cuaca dan rute yang sama, jadi pembagian acak akan membocorkan
jawaban.

## Sumber data

Himalayan Database, arsip ekspedisi Himalaya yang dirintis Elizabeth Hawley.
<https://www.himalayandatabase.com/>

Diambil lewat cermin TidyTuesday rilis 22 September 2020.
<https://github.com/rfordatascience/tidytuesday/tree/main/data/2020/2020-09-22>

Berkas mentah tidak ikut disimpan di repositori ini. `jalankan.py` mengunduhnya
sendiri.

## Hasil model

Pemenangnya gradient boosting, dipilih dari validasi silang di data latih yang
dikelompokkan per ekspedisi. Di data uji (2013 ke atas): AUC 0,863, akurasi
79,1 persen lawan garis dasar 50,1 persen, Brier 0,148. Kurva kalibrasinya
dekat diagonal.

Satu catatan jujur: oksigen mendominasi. Tanpa dua kolom oksigen, AUC uji turun
ke 0,701. Kami belum memeriksa apakah kolom itu dicatat sebelum atau sesudah
hasil pendakian, jadi sebagian sinyalnya bisa jadi bocoran. Batasan lengkap ada
di halaman Model dan di `catatan/adr-aplikasi.md`.

## Menjalankan untuk tim

Ada tiga cara agar teman satu tim bisa membuka aplikasinya tanpa `localhost`.
Aplikasinya belum punya login dan pembatas laju, jadi jangan dibiarkan terbuka
lama di internet publik.

Cara tercepat adalah terowongan sementara. Jalankan server seperti biasa, lalu di
terminal lain:

```bash
cloudflared tunnel --url http://localhost:8000
```

Perintah itu mencetak alamat `https://...trycloudflare.com` yang bisa dibuka siapa
saja selama terminalnya hidup. Tutup dengan Ctrl+C kalau sudah selesai.

Kalau semua anggota satu jaringan Wi-Fi, jalankan server dengan
`uvicorn aplikasi.main:app --host 0.0.0.0` dan bagikan `http://<alamat-IP-laptop-Anda>:8000`.
Firewall laptop harus mengizinkan port 8000, dan sebagian Wi-Fi kampus memisahkan
perangkat satu sama lain sehingga cara ini tidak jalan.

Untuk alamat yang tetap, pakai layanan yang menjalankan Docker (misalnya Render,
Fly.io, Railway, atau Google Cloud Run) dan arahkan ke repositori ini. `Dockerfile`
sudah siap: ia melatih model saat image dibangun, mengikuti variabel `PORT` dari
layanan, dan berjalan sebagai pengguna biasa. Pengaturan yang perlu diisi:

- Jalur pemeriksaan kesehatan: `/healthz`
- Memori: minimal 512 MB, sebaiknya 1 GB. Server memakai sekitar 350 MB setelah
  dipakai berat.
- Build memakan sekitar satu menit karena ada pelatihan model.

Mencoba image di laptop:

```bash
docker build -t zenith .
docker run --rm -p 8000:8000 zenith
```

## Mengubah teks dan bahasa

Halaman punya dua bahasa, Indonesia dan Inggris, dengan tombol di pojok kanan
atas. Pilihannya tersimpan di peramban. Tanpa pilihan tersimpan, halaman
mengikuti bahasa peramban dan jatuh ke Indonesia.

Semua kata ada di satu berkas, `aplikasi/web/teks.js`. Bahasa Indonesia dan
Inggris ditulis berdampingan dengan susunan yang sama, jadi kalau Anda mengubah
satu kalimat, ubah juga padanannya di bahasa lain. Bagian `html` dipasang ke
elemen bertanda `data-t` di `index.html`, dan bagian lain dicetak langsung oleh
JavaScript. Server tidak mengirim kalimat sama sekali, hanya kode seperti
`oksigen_tanpa`, yang diterjemahkan di `teks.js`.

Cukup muat ulang halaman setelah mengubah `teks.js`. Dasar pemilihan gaya
bahasa dan cara kerja tombol bahasa ada di `catatan/riset-teks-dwibahasa.md`.
Sistem tampilannya terkunci di `design.md`.

## Foto

Foto di halaman utama diambil dari Wikimedia Commons dan disimpan di
`aplikasi/web/foto/`. Pembuat dan lisensinya ada di `aplikasi/web/foto/kredit.json`
dan di kaki halaman web. Lima puncak punya foto sendiri (Everest, Lhotse, Ama
Dablam, Cho Oyu, Makalu). Puncak lain memakai foto Pumori dan halaman
menyebutnya terus terang.
