# Riset fitur aplikasi prediksi keberhasilan pendakian

Riset 5 November 2026. Semua sumber dibuka langsung hari itu. Tiap klaim
ditandai terverifikasi (dengan URL), dugaan, atau unknown.

## Daftar fitur, urut prioritas

### 1. Kalibrasi peluang dan diagram reliabilitas

Angka "peluang sukses 62 persen" harus berarti 62 dari 100 kasus serupa memang
sukses. Pergeseran 34,7 ke 50,1 persen hampir pasti membuat peluang meleset
(dugaan). Diagramnya yang menjawab.

Terverifikasi di https://scikit-learn.org/stable/modules/calibration.html:
- Diagram reliabilitas membandingkan rata-rata peluang per bin dengan fraksi
  kelas positif per bin (`calibration_curve`, `CalibrationDisplay`).
- `CalibratedClassifierCV` punya `sigmoid` (efektif untuk sampel kecil) dan
  `isotonic` (rawan overfit di data kecil, setara atau lebih baik kalau sampel
  lebih dari sekitar 1000).
- Kalibrator harus dilatih pada data terpisah dari data latih model.
- `LogisticRegression` cenderung sudah terkalibrasi sendiri.
- Brier dan log loss saja tidak cukup untuk menilai kalibrasi.

Dugaan: kalibrasi pada uji 2013 sampai 2015, nilai akhir pada 2016 ke atas.
Tulis keputusan ini terbuka. Biaya: rendah, sekitar 20 baris.

### 2. Kartu model dengan batasan

Satu halaman: tujuan pakai, bukan tujuan pakai, data, metrik, batasan. Dua isi
wajib: hasil `GroupKFold` per `expedition_key`, dan metrik per jenis kelamin.
Bahan jujurnya sudah ada di `catatan/keputusan-praproses.md`.

Terverifikasi:
- Kartu model memuat evaluasi kinerja, tujuan pakai, rincian evaluasi, dan
  info relevan lain. Penulisnya menganjurkan evaluasi per kelompok demografis,
  termasuk jenis kelamin. https://arxiv.org/abs/1810.03993
- `GroupKFold` menjamin satu grup tidak muncul di latih dan uji sekaligus.
  https://scikit-learn.org/stable/modules/cross_validation.html

Dugaan: tabel kecil per subkelompok cukup, dengan jumlah baris di samping tiap
metrik karena pendaki perempuan jauh lebih sedikit. Biaya: rendah, satu
`groupby` dan satu halaman statis.

### 3. Laporan pergeseran waktu

Grafik tingkat sukses per tahun, plus akurasi dan Brier per rentang tahun uji.
Ini temuan inti proyek Anda (21,5 persen di 1980-an sampai 49,1 persen di
2010-an, bagian 9 catatan praproses).

Terverifikasi:
- `KFold` dan `ShuffleSplit` mengandaikan sampel i.i.d. `TimeSeriesSplit`
  mensyaratkan interval waktu tetap, dan data ini tidak memenuhinya.
  https://scikit-learn.org/stable/modules/cross_validation.html
- Situs resmi mencakup data sampai musim Autumn-Winter 2025, sedangkan cermin
  TidyTuesday Anda berhenti di 2019. https://www.himalayandatabase.com/

Unknown: sumber primer untuk ambang "drift berat". Tampilkan angka tanpa label
ambang. Biaya: rendah, `groupby("year")` dan satu grafik.

### 4. Penjelasan: permutasi global, kontribusi per fitur

Halaman global memakai `permutation_importance` pada data uji. Untuk satu
prediksi, tampilkan sepuluh faktor terbesar.

Terverifikasi di
https://scikit-learn.org/stable/modules/permutation_importance.html:
- Bisa dihitung pada data tahan-uji dan berlaku untuk model apa pun.
- Fitur berkorelasi saling menurunkan nilai pentingnya. Solusi resmi:
  kelompokkan fitur berkorelasi.
- Nilainya berlaku untuk model tertentu, bukan nilai bawaan fitur.
- Kepentingan impuritas pada pohon bias ke fitur berkardinalitas tinggi.

SHAP memberi nilai per fitur untuk satu prediksi dengan sifat teoretis
terbukti (https://arxiv.org/abs/1705.07874). Halaman dokumentasinya tidak
memuat rincian `TreeExplainer`, jadi kecepatannya unknown.

Dugaan: untuk regresi logistik, kontribusi per fitur cukup koefisien kali
nilai terskala (perhitungan sendiri). Untuk pohon butuh SHAP, satu dependensi
tambahan. Biaya: permutasi rendah, per prediksi rendah (linear) atau sedang.

### 5. Validasi masukan dan peringatan di luar sebaran

Tolak masukan mustahil. Beri peringatan untuk masukan sah tapi jarang (tim 200
orang, usia 12 tahun, kategori "jarang").

Terverifikasi:
- FastAPI memasang batas lewat `Field` Pydantic; halamannya menunjukkan `gt`
  dan `max_length`. https://fastapi.tiangolo.com/tutorial/body-fields/
- `handle_unknown="infrequent_if_exist"` ada di `praproses/pipeline.py`.
  Kategori baru tidak menggagalkan prediksi, jadi pengguna tidak sadar bahwa
  prediksinya kurang dapat dipercaya. Peringatan harus dibuat sendiri.

Dugaan: `ge`, `le`, dan respons 422 tidak ada di halaman itu. Saya
mengetahuinya dari perilaku Pydantic umum, jadi uji sendiri. Membandingkan
masukan dengan persentil 1 sampai 99 data latih adalah rancangan Anda, tanpa
sumber primer. Biaya: rendah, Pydantic dan `numpy.percentile`.

### 6. What-if

Pengguna menggeser satu masukan dan melihat peluang berubah.

Terverifikasi di
https://scikit-learn.org/stable/modules/partial_dependence.html:
- Garis ICE menunjukkan prediksi satu sampel saat satu fitur divariasikan.
- PDP dan ICE mengandaikan fitur yang digeser independen dari fitur lain. Pada
  fitur berkorelasi, titik yang dibuat bisa tidak masuk akal.

Dugaan: `hired_staff_count`, `team_size`, `hired_staff_ratio`, dan dua kolom
oksigen saling berkaitan. Hitung ulang rasio saat jumlah staf digeser. Biaya:
rendah, ulangi `predict_proba` pada grid nilai.

## Yang dilewati

SHAP sebagai kewajiban: dependensi di luar scikit-learn, dan permutasi serta
koefisien sudah menjawab penguji.

Halaman perbandingan model: cukup satu tabel di laporan.

Ukuran ketidakpastian terpisah: saya tidak menemukan sumber primer untuk
sklearn saja. Peluang terkalibrasi plus peringatan di luar sebaran cukup.

Halaman fairness kewarganegaraan: banyak kategori hanya beberapa baris, jadi
metriknya tidak stabil. Cukup kelompok besar di kartu model.

Penskalaan suhu (Guo dkk. 2017, https://arxiv.org/abs/1706.04599): soal
jaringan saraf. `CalibratedClassifierCV` cukup untuk model sklearn klasik.

## Peringatan tentang data

Situs resmi menyatakan cakupan Nepal Himalaya, termasuk dua sisi puncak
perbatasan. Catatan Anda menyebut sisi China ikut tercatat. Belum saya
cocokkan, jadi unknown. Situs tidak memuat batasan atau margin galat.

## Sumber
- https://scikit-learn.org/stable/modules/calibration.html
- https://scikit-learn.org/stable/modules/permutation_importance.html
- https://scikit-learn.org/stable/modules/partial_dependence.html
- https://scikit-learn.org/stable/modules/cross_validation.html
- https://arxiv.org/abs/1810.03993 (Mitchell dkk. 2019, Model Cards)
- https://arxiv.org/abs/1705.07874 (Lundberg dan Lee 2017, SHAP)
- https://arxiv.org/abs/1706.04599 (Guo dkk. 2017)
- https://fastapi.tiangolo.com/tutorial/body-fields/
- https://www.himalayandatabase.com/

## Rekomendasi: bangun lima

Kalibrasi, kartu model, laporan pergeseran waktu, permutasi ditambah kontribusi
per fitur, validasi dengan peringatan di luar sebaran. Tiga pertama tidak butuh
antarmuka, kerjakan dulu. What-if jadi cadangan.
