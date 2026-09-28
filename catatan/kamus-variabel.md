# Kamus variabel

Keterangan kolom pada berkas keluaran `data/olahan/himalaya_bersih.parquet`.

Definisi kolom asli disalin dari kamus data resmi TidyTuesday untuk rilis
22 September 2020, bukan ditulis dari perkiraan. Sumbernya:
<https://github.com/rfordatascience/tidytuesday/blob/main/data/2020/2020-09-22/readme.md>

Kolom turunan dijelaskan lengkap dengan cara hitungnya.

## Target

`success`
Boolean. Apakah orang ini berhasil mencapai puncak.

Perlu diperhatikan, definisi resminya berbunyi "whether the person was
successful in summitting a main peak or sub-peak, depending on the goal of
expedition". Jadi keberhasilan diukur terhadap sasaran ekspedisinya, dan
mencapai sub-puncak juga dihitung berhasil kalau memang itu sasarannya. Ini
bukan semata "menginjak puncak utama".

Sebaran: berhasil 29.199 atau 38,2 persen, gagal 47.320 atau 61,8 persen.

## Fitur numerik dan biner

`age`
Umur pendaki dalam tahun. Definisi resminya menyebut titik acuannya bisa
berbeda antar baris: tanggal mencapai puncak, tanggal meninggal, atau tanggal
tiba di basecamp, tergantung data terbaik yang tersedia. Jadi kolom ini tidak
seragam acuannya, dan itu keterbatasan yang perlu disebut di laporan.
Rentang 7 sampai 85. Kosong 3.497 baris.

`team_size`
Jumlah anggota ekspedisi, disalin dari kolom `members` di tabel ekspedisi.
Definisi resminya: untuk ekspedisi di Nepal biasanya jumlah orang asing yang
tercantum di izin pendakian, untuk ekspedisi di China biasanya jumlah anggota
non-bayaran. Rentang 0 sampai 99.

`hired_staff_count`
Jumlah staf bayaran yang naik di atas basecamp. Rentang 0 sampai 99.

`hired_staff_ratio`
Turunan. `hired_staff` dibagi (`members` + `hired_staff`). Kosong untuk 35
baris yang total rombongannya nol. Rentang 0 sampai 1.

`basecamp_month`
Turunan. Bulan tiba di basecamp, diambil dari `basecamp_date`. Rentang 1
sampai 12. Kosong 5.964 baris karena tanggal basecamp tidak selalu tercatat.

`peak_age_years`
Turunan. `year` dikurangi `first_ascent_year`. Menyatakan berapa lama puncak
itu sudah pernah didaki orang saat ekspedisi berlangsung. Nilai negatif berarti
ekspedisi berlangsung sebelum pendakian pertama yang tercatat, jadi percobaan
ke puncak yang belum tertaklukkan. Ada 2.059 baris bernilai negatif. Rentang
-58 sampai 82. Kosong 625 baris.

`height_metres`
Tinggi puncak dalam meter. Rentang 5.407 sampai 8.850. Kosong 15 baris.

`is_eight_thousander`
Turunan. Bernilai 1 kalau tinggi puncak 8.000 meter ke atas, 0 kalau di
bawahnya, dan kosong kalau tinggi puncaknya tidak diketahui. Sengaja tidak
dibuat boolean murni supaya 15 baris tanpa data tinggi tidak terlanjur
dianggap bukan delapan ribu.

`agency_prior_climbers`
Turunan. Jumlah pendaki yang pernah diberangkatkan agen trekking yang sama
pada tahun-tahun sebelum tahun baris ini. Rentang 0 sampai 5.547. Kosong
14.355 baris karena nama agennya tidak tercatat.

`agency_prior_success_rate`
Turunan. Tingkat keberhasilan agen trekking yang sama pada tahun-tahun
sebelumnya. Tahun berjalan sengaja tidak ikut dihitung. Rentang 0 sampai 1.
Kosong 21.741 baris, terdiri dari 14.355 baris tanpa nama agen ditambah 7.386
baris dari agen yang sedang tahun pertamanya.

`hired`
Boolean. Apakah orang ini dipekerjakan oleh ekspedisi, misalnya sebagai staf
ketinggian.

`solo`
Boolean. Apakah orang ini mencoba pendakian solo.

`oxygen_used`
Boolean. Apakah orang ini memakai oksigen tambahan.

`oxygen_used_ekspedisi`
Boolean. Apakah ada setidaknya satu anggota ekspedisi yang memakai oksigen.
Berasal dari kolom `oxygen_used` di tabel ekspedisi, diberi akhiran supaya
tidak bertabrakan dengan versi tingkat anggota. Isinya tidak identik: ada
12.836 pendaki yang tidak memakai oksigen padahal ekspedisinya memakai.

## Fitur kategorik

`season`
Musim ekspedisi. Lima nilai: Spring, Summer, Autumn, Winter, Unknown.

`sex`
Jenis kelamin. Dua nilai. Kosong 2 baris.

`expedition_role`
Peran dalam ekspedisi. 524 nilai berbeda, tapi 509 di antaranya muncul kurang
dari 50 kali. Lima terbanyak: Climber 44.667, H-A Worker 14.489, Leader 10.036,
Exp Doctor 1.450, Deputy Leader 1.238. Kosong 21 baris.

`citizenship`
Kewarganegaraan. 212 nilai berbeda. Lima terbanyak: Nepal 16.135, USA 6.448,
Japan 6.432, UK 5.219, France 4.611. Kosong 10 baris.

`climbing_status`
Apakah puncak tersebut sudah pernah didaki. Dua nilai: Climbed dan Unclimbed.
Kosong 15 baris.

`first_ascent_country`
Negara asal anggota ekspedisi pendakian pertama. Bisa berisi lebih dari satu
negara. Nama negaranya sesuai zaman pendakian, misalnya "W Germany" untuk
pendakian sebelum 1990. 77 nilai berbeda, kosong 618 baris.

## Kolom yang disimpan tapi tidak jadi fitur

Kolom-kolom ini tetap ada di berkas keluaran supaya hasil prediksi bisa
ditelusuri balik ke sumbernya, tapi tidak masuk daftar `FITUR`.

`expedition_id`
Kode ekspedisi. Perlu diingat kode ini tidak benar-benar unik: `KANG10101`
dipakai untuk 1910 dan 2010.

`member_id`
Kode orang. Definisi resminya menegaskan kode ini TIDAK konsisten antar
ekspedisi, jadi Anda tidak bisa memakainya untuk melacak seseorang di beberapa
ekspedisi. Karena itu kami tidak membuat fitur pengalaman pribadi pendaki.

`expedition_key`
Turunan. `expedition_id` ditambah tahun. Inilah kunci pengelompokan yang benar
untuk validasi silang.

`peak_id`, `peak_name`
Kode dan nama puncak. 391 puncak berbeda muncul di data.

`year`
Tahun ekspedisi. Sengaja tidak dijadikan fitur, alasannya ada di
keputusan-praproses.md bagian 10.

`basecamp_date`, `members`, `hired_staff`, `trekking_agency`,
`first_ascent_year`
Kolom asal yang sudah diwakili fitur turunan, disimpan untuk penelusuran.
`season` tidak termasuk di sini, kolom itu dipakai langsung sebagai fitur.
