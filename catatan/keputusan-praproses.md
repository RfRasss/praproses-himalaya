# Catatan keputusan praproses

Berkas ini mencatat setiap keputusan yang diambil saat menyiapkan data, beserta
alasannya. Tujuannya satu: kalau ada yang bertanya kenapa sebuah kolom dibuang
atau kenapa nilai kosong ditangani dengan cara tertentu, jawabannya ada di sini
lengkap dengan angkanya.

Semua angka di bawah berasal dari data yang benar-benar dijalankan, bukan
perkiraan. Anda bisa memunculkannya lagi dengan `python jalankan.py`.

## 1. Sumber data

Tiga berkas dari Himalayan Database, arsip ekspedisi Himalaya yang dirintis
Elizabeth Hawley. Kami mengambilnya lewat cermin TidyTuesday tanggal
22 September 2020.

- `members.csv`, 76.519 baris, 21 kolom. Satu baris satu pendaki dalam satu ekspedisi.
- `expeditions.csv`, 10.364 baris, 16 kolom. Satu baris satu ekspedisi.
- `peaks.csv`, 468 baris, 8 kolom. Satu baris satu puncak.

Rentang tahunnya 1905 sampai 2019.

## 2. Penggabungan tiga tabel

Tabel anggota jadi tabel utama. Tabel ekspedisi dan tabel puncak ditempelkan ke
kanan.

Penggabungan ke tabel ekspedisi memakai kunci gabungan `(expedition_id, year)`,
bukan `expedition_id` saja. Ini bukan kerumitan yang dibuat-buat.

Kode ekspedisi `KANG10101` muncul dua kali di tabel ekspedisi, untuk tahun 1910
dan tahun 2010. Penyebabnya kode ekspedisi hanya menyimpan dua digit tahun,
sehingga 10 bisa berarti 1910 atau 2010. Kalau digabung dengan `expedition_id`
saja, tujuh anggota ekspedisi 2010 dikalikan dua baris ekspedisi, dan jumlah
baris naik dari 76.519 jadi 76.526.

Tujuh baris palsu dari 76 ribu memang kecil. Tapi jenis kesalahan seperti ini
tidak memunculkan pesan galat apa pun, jadi kalau tidak diperiksa, ia akan
terbawa sampai laporan akhir. Berkas `uji/uji_praproses.py` menguji ini secara
khusus.

Penggabungan ke tabel puncak memakai `peak_id`. Ada 15 baris anggota dengan
`peak_id` bernilai `SPHU` yang tidak punya pasangan di tabel puncak, dan nama
puncaknya juga kosong. Barisnya tetap dipertahankan, tapi kolom yang berasal
dari tabel puncak jadi kosong untuk 15 baris itu.

Kedua penggabungan memakai `validate="many_to_one"`, jadi pandas akan
menggagalkan proses kalau kunci di sisi kanan ternyata tidak unik.

## 3. Kebocoran target

Kolom-kolom berikut baru terisi setelah hasil pendakian diketahui. Kalau dipakai
sebagai fitur, model tidak belajar apa pun, ia cuma membaca jawabannya.

Dari tabel anggota: `highpoint_metres`, `died`, `death_cause`,
`death_height_metres`, `injured`, `injury_type`, `injury_height_metres`.

Dari tabel ekspedisi: `highpoint_metres`, `highpoint_date`, `termination_date`,
`termination_reason`, `member_deaths`, `hired_staff_deaths`.

Yang paling menjebak `highpoint_metres`, yaitu titik tertinggi yang dicapai
pendaki. Kalau nilainya sama dengan tinggi puncak, berarti pendakinya sampai
puncak. Kolom itu bukan fitur, itu targetnya sendiri dengan penyamaran.

Yang kedua paling menjebak `termination_reason`. Nilai terbanyaknya
"Success (main peak)" sebanyak 5.581 ekspedisi. Sudah tertulis jelas di sana.

## 4. Fitur turunan

Tujuh fitur dibuat dari kolom yang ada.

`team_size` dan `hired_staff_count` diambil dari jumlah anggota dan jumlah staf
bayaran di tabel ekspedisi. Ukuran rombongan berkaitan dengan gaya ekspedisi.

`hired_staff_ratio` adalah jumlah staf bayaran dibagi total rombongan. Rasio
lebih informatif daripada jumlah mentah, karena lima staf untuk tim berisi lima
orang beda artinya dengan lima staf untuk tim berisi tiga puluh orang. Ada 35
baris dengan total rombongan nol, dan untuk baris itu rasionya dibiarkan kosong
supaya tidak terjadi pembagian dengan nol.

`basecamp_month` adalah bulan tiba di basecamp. Musim sudah ada sebagai kolom
tersendiri, tapi bulan lebih halus. Dalam satu musim semi, berangkat Maret dan
berangkat Mei menghadapi kondisi yang berbeda.

`peak_age_years` adalah tahun ekspedisi dikurangi tahun pendakian pertama
puncak tersebut. Nilai negatif berarti ekspedisi berlangsung sebelum pendakian
pertama yang tercatat, jadi memang percobaan ke puncak yang belum tertaklukkan.
Ada 2.059 baris seperti itu, dan nilainya sengaja dibiarkan negatif karena itu
informasi asli, bukan kesalahan.

`is_eight_thousander` menandai puncak setinggi 8.000 meter ke atas.

`agency_prior_climbers` dan `agency_prior_success_rate` menyimpan rekam jejak
agen trekking. Penjelasannya di bagian berikutnya.

## 5. Rekam jejak agen trekking

Kolom `trekking_agency` berisi 827 nama agen. Terlalu banyak untuk dijadikan
kolom biner satu per satu. Tapi membuangnya begitu saja juga sayang, karena
agen yang berpengalaman kemungkinan besar memang punya tingkat keberhasilan
lebih tinggi.

Jalan tengahnya: ganti nama agen dengan angka rekam jejaknya.

Untuk sebuah baris bertahun Y dengan agen A, `agency_prior_success_rate`
dihitung dari pendaki agen A pada tahun-tahun yang lebih kecil dari Y. Tahun
berjalan sengaja dikeluarkan. Kalau tahun berjalan ikut dihitung, fitur ini akan
memuat hasil pendaki itu sendiri, dan itu kebocoran.

`agency_prior_climbers` menyimpan jumlah pendaki yang jadi dasar perhitungan
tadi. Angka ini penting karena tingkat keberhasilan 100 persen dari tiga pendaki
tidak sama nilainya dengan 60 persen dari tiga ribu pendaki.

Agen yang baru pertama kali muncul mendapat nilai kosong, karena belum ada masa
lalu untuk dihitung.

Ada satu hal yang perlu disampaikan terbuka. Untuk baris di periode uji,
tahun-tahun sebelumnya bisa termasuk tahun uji yang lain. Contohnya, baris tahun
2016 memakai hasil tahun 2015 yang juga ada di data uji. Ini dibiarkan, dengan
alasan bahwa saat seseorang menilai sebuah ekspedisi tahun 2016, hasil ekspedisi
2015 memang sudah diketahui umum. Yang dilarang adalah memakai masa depan, bukan
memakai masa lalu.

Kalau anggota kelompok yang memegang pemodelan ingin lebih ketat, batasi
perhitungan hanya sampai tahun 2012. Fungsinya ada di `praproses/fitur.py` dan
tinggal diberi penyaring tambahan.

## 6. Nilai kosong

Ini keputusan yang paling penting di seluruh berkas ini.

Nilai kosong TIDAK diisi di tahap ini. Berkas keluaran masih memuat nilai
kosong apa adanya.

Alasannya: median dan modus yang dipakai untuk mengisi harus dihitung dari data
latih saja. Kalau pengisian dikerjakan lebih dulu di seluruh tabel, median data
uji ikut menyumbang ke nilai pengganti yang dipakai di data latih, dan itu
kebocoran halus yang jarang disadari orang.

Pengisian dikerjakan di dalam pipeline scikit-learn, yang belajar hanya saat
`fit` pada data latih. Lihat `praproses/pipeline.py`.

Berkas `uji/uji_praproses.py` bagian tujuh membuktikan hal ini nyata: median
pengisi yang dipelajari dari data latih saja memang berbeda dengan yang
dipelajari dari seluruh data.

Nilai kosong pada fitur yang dipakai model:

- `agency_prior_success_rate`: 21.741 baris atau 28,4 persen. Terdiri dari
  14.355 baris tanpa nama agen, ditambah 7.386 baris dari agen yang sedang
  tahun pertamanya.
- `agency_prior_climbers`: 14.355 baris atau 18,8 persen.
- `basecamp_month`: 5.964 baris atau 7,8 persen.
- `age`: 3.497 baris atau 4,6 persen.
- `peak_age_years`: 625 baris atau 0,8 persen.
- `first_ascent_country`: 618 baris atau 0,8 persen.
- Sisanya di bawah 50 baris: `hired_staff_ratio`, `expedition_role`,
  `height_metres`, `climbing_status`, `is_eight_thousander`, `citizenship`,
  `sex`.

Untuk numerik dipakai median, bukan rata-rata, karena beberapa kolom miring
jauh. `agency_prior_climbers` misalnya bergerak dari 0 sampai 5.547. Untuk
kategorik dipakai modus.

## 7. Nilai janggal

Hanya satu nilai yang diubah jadi kosong.

Puncak Sharphu II tercatat punya `first_ascent_year` bernilai 201. Itu jelas
salah ketik, dan akibatnya `peak_age_years` melar sampai 1.817 tahun. Semua
`first_ascent_year` di bawah 1900 dijadikan kosong. Setelah perbaikan, nilai
tertinggi `peak_age_years` jadi 82 tahun, yang masuk akal.

Umur pendaki yang ekstrem sengaja TIDAK dibuang, dan ini keputusan yang perlu
dijelaskan.

Umur terendah 7 tahun dan tertinggi 85 tahun. Ada tiga pendaki berumur 13 tahun
yang tercatat berhasil: Kanta Gaton 2009, Everest 2010, dan Everest 2014.

Kami periksa yang Everest 2010, kode ekspedisi `EVER10114`. Rombongannya
terdiri dari pendaki 13 tahun berkewarganegaraan Amerika, pemimpin laki-laki
40 tahun, pendaki perempuan 44 tahun, dan tiga staf ketinggian asal Nepal.
Susunan itu cocok dengan rekor pendaki termuda yang mencapai puncak Everest
pada 22 Mei 2010, yaitu Jordan Romero berumur 13 tahun, yang mendaki bersama
ayah dan ibu tirinya dengan dukungan tiga pemandu Sherpa. Lihat
<https://en.wikipedia.org/wiki/Jordan_Romero>.

Sempat muncul keraguan di sini, karena rekor itu dicapai lewat jalur North Col
dari sisi Tibet, sedangkan Himalayan Database sering digambarkan sebagai arsip
Himalaya Nepal saja. Keraguan itu terjawab oleh kamus data resminya sendiri:
keterangan kolom `members` berbunyi "For expeditions in China, this is usually
the number of non-hired members". Jadi basis data ini memang memuat ekspedisi
sisi China, bukan Nepal saja.

Meski begitu, yang bisa kami pastikan tetap sebatas bahwa isi barisnya cocok
dengan kejadian yang diberitakan. Basis data ini tidak memuat nama orang, jadi
kecocokannya berdasarkan susunan rombongan, umur, kewarganegaraan, dan tanggal.

Kalau kami memakai aturan pencilan biasa seperti membuang nilai di luar 1,5 kali
jarak antarkuartil, baris seperti ini ikut terbuang. Padahal itu bukan kesalahan
pencatatan.

Pelajarannya: pencilan secara statistik belum tentu pencilan secara kenyataan.
Umur-umur ekstrem dibiarkan, dan model pohon sanggup menanganinya.

Satu catatan kejujuran. Pendaki berumur 7 tahun di Manaslu 1984 memang
mencurigakan dan mungkin kesalahan pencatatan di sumbernya. Kami tidak punya
cara memastikannya, jadi barisnya dibiarkan dan dicatat di sini. Kalau anggota
pemodelan ingin mengujinya, jalankan sekali dengan baris itu dan sekali tanpa,
lalu bandingkan hasilnya.

## 8. Pembagian data latih dan uji

Dua aturan ditegakkan sekaligus.

Pertama, pembagian berdasarkan waktu. Data latih berisi tahun 2012 ke bawah,
data uji tahun 2013 ke atas. Batas 2012 dipilih karena menghasilkan pembagian
77,7 berbanding 22,3, paling dekat dengan 80 banding 20.

Pembagian acak akan salah di sini. Tingkat keberhasilan naik tajam sepanjang
waktu: 21,5 persen di dekade 1980-an, 30,1 persen di 1990-an, 43,6 persen di
2000-an, dan 49,1 persen di 2010-an. Membagi acak berarti melatih model dengan
pengetahuan dari masa depan.

Kedua, pengelompokan per ekspedisi. Anggota satu ekspedisi menghadapi cuaca,
rute, dan pemandu yang sama, jadi hasil mereka saling terkait. Kalau sebagian
anggota masuk data latih dan sebagian masuk data uji, model seolah sudah
mengintip jawabannya.

Kolom `expedition_key` dibuat untuk ini, isinya `expedition_id` ditambah tahun.
Tahun perlu ditempelkan karena, seperti dijelaskan di bagian 2, `expedition_id`
sendiri tidak benar-benar unik.

Untuk validasi silang di dalam data latih, pakai `GroupKFold` dengan
`groups=latih["expedition_key"]`. Pembantunya sudah disediakan di
`praproses.pembagian.pembagi_silang`.

Karena pembagiannya berdasarkan waktu, kedua aturan itu tidak bentrok. Hasil
pemeriksaan: nol ekspedisi muncul di data latih sekaligus data uji.

## 9. Peringatan pergeseran distribusi

Ini yang paling penting untuk diketahui anggota pemodelan.

Data latih punya tingkat keberhasilan 34,7 persen. Data uji punya 50,1 persen.
Selisihnya 15 poin.

Artinya model akan diuji pada dunia yang berbeda dari dunia tempat ia belajar.
Ini bukan kesalahan pembagian, ini memang kenyataannya: pendakian Himalaya
zaman sekarang jauh lebih sering berhasil daripada dulu.

Dua akibat praktisnya. Pertama, jangan kaget kalau akurasi di data uji tidak
mengikuti pola akurasi di validasi silang. Kedua, ambang peluang bawaan 0,5
mungkin bukan pilihan terbaik, dan sebaiknya disetel ulang dengan melihat kurva
presisi dan recall.

## 10. Kolom yang sengaja tidak dijadikan fitur

`year` tidak dipakai sebagai fitur meski tersedia. Karena pembagiannya
berdasarkan waktu, semua tahun di data uji lebih besar dari tahun mana pun di
data latih. Model pohon tidak bisa menebak di luar rentang yang pernah
dilihatnya, dan model linier justru akan memperpanjang tren secara membabi buta.
Efek zaman tetap tertangkap secara tidak langsung lewat rekam jejak agen dan
status puncak.

`trekking_agency` tidak dipakai langsung karena 827 kategorinya, sudah diganti
dua fitur rekam jejak.

`expedition_id`, `member_id`, `peak_id`, `peak_name`, `basecamp_date`,
`members`, `hired_staff`, dan `first_ascent_year` tetap ada di berkas keluaran
untuk penelusuran, tapi tidak masuk daftar fitur.

## 11. Keputusan yang masih bisa diperdebatkan

Dicatat terbuka supaya bisa dibahas bertiga, bukan disembunyikan.

`oxygen_used` di tingkat anggota dipakai sebagai fitur. Ini agak abu-abu.
Membawa oksigen adalah keputusan sebelum mendaki, jadi wajar dijadikan fitur.
Tapi pendaki yang berbalik lebih awal mungkin tidak sempat memakai oksigennya,
sehingga kolom ini sedikit terwarnai oleh hasil. Literatur menyebut oksigen
sebagai salah satu prediktor terkuat, jadi kami memakainya, tapi risikonya
dicatat di sini.

`oxygen_used_ekspedisi` dari tabel ekspedisi juga dipakai. Isinya tidak sama
dengan versi tingkat anggota: ada 12.836 pendaki yang tidak memakai oksigen
padahal ekspedisinya memakai. Kalau anggota pemodelan merasa dua kolom ini
terlalu mirip, salah satunya boleh dibuang tanpa mengubah kode praproses.

Ambang kategori jarang dipatok di 50 kemunculan. Angka ini dipilih karena
`expedition_role` punya 509 dari 524 kategori yang muncul kurang dari 50 kali.
Angkanya bisa disetel lewat argumen `buat_praproses(ambang_jarang=...)`.

## 12. Yang belum dikerjakan di tahap ini

Penanganan ketimpangan kelas tidak dikerjakan di sini. Perbandingan 38 berbanding
62 masih tergolong sehat, dan keputusan memakai bobot kelas atau penyeimbangan
sampel lebih tepat diambil bersama pemilihan model.

Pemilihan fitur juga belum dikerjakan. Dua puluh fitur masih sedikit, jadi
belum mendesak.
