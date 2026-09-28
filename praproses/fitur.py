"""Pembuatan fitur turunan dan pembersihan nilai janggal.

Semua fungsi di sini hanya memakai informasi yang sudah tersedia SEBELUM
hasil pendakian diketahui. Satu-satunya pengecualian dijelaskan panjang di
`rekam_jejak_agen`.
"""

import numpy as np
import pandas as pd

from .gabung import TARGET

# Tahun pendakian pertama paling awal yang masuk akal. Tabel puncak memuat
# satu nilai 201 untuk Sharphu II, jelas salah ketik, dan itu membuat umur
# puncak melar sampai 1817 tahun. Nilai di bawah ambang ini dijadikan kosong.
TAHUN_PALING_AWAL = 1900


def bersihkan_nilai_janggal(df: pd.DataFrame) -> pd.DataFrame:
    """Ubah nilai yang mustahil jadi kosong, tanpa membuang barisnya.

    Yang diubah hanya `first_ascent_year` yang di bawah 1900. Umur pendaki
    yang ekstrem sengaja TIDAK disentuh, lihat catatan-praproses.md bagian
    "Umur ekstrem bukan pencilan".
    """
    hasil = df.copy()
    janggal = hasil["first_ascent_year"] < TAHUN_PALING_AWAL
    hasil.loc[janggal, "first_ascent_year"] = np.nan
    return hasil


def rekam_jejak_agen(df: pd.DataFrame) -> pd.DataFrame:
    """Hitung tingkat keberhasilan historis tiap agen trekking.

    Untuk baris bertahun Y dan agen A, fitur ini hanya memakai ekspedisi agen
    A pada tahun yang lebih kecil dari Y. Tahun berjalan sengaja dikeluarkan,
    kalau tidak fitur ini akan memuat hasil pendaki itu sendiri.

    Catatan kejujuran: untuk baris di periode uji, tahun-tahun sebelumnya bisa
    termasuk tahun uji lain. Itu dibiarkan karena pada saat memprediksi sebuah
    ekspedisi tahun 2016, hasil ekspedisi 2015 memang sudah diketahui orang.
    Yang dilarang adalah memakai masa depan, bukan masa lalu.

    Agen yang baru pertama kali muncul mendapat nilai kosong, dan pengisiannya
    diserahkan ke pipeline supaya nilai penggantinya dihitung dari data latih
    saja.
    """
    punya_agen = df["trekking_agency"].notna()
    ringkas = (
        df.loc[punya_agen]
        .groupby(["trekking_agency", "year"], as_index=False)[TARGET]
        .agg(sukses="sum", jumlah="size")
        .sort_values(["trekking_agency", "year"])
    )

    kelompok = ringkas.groupby("trekking_agency")
    # Kumulatif sampai tahun ini, dikurangi tahun ini, sama dengan
    # kumulatif sampai tahun sebelumnya.
    ringkas["agency_prior_climbers"] = (
        kelompok["jumlah"].cumsum() - ringkas["jumlah"]
    )
    ringkas["agency_prior_success"] = (
        kelompok["sukses"].cumsum() - ringkas["sukses"]
    )

    ada_riwayat = ringkas["agency_prior_climbers"] > 0
    ringkas["agency_prior_success_rate"] = np.where(
        ada_riwayat,
        ringkas["agency_prior_success"] / ringkas["agency_prior_climbers"],
        np.nan,
    )

    kolom = [
        "trekking_agency",
        "year",
        "agency_prior_climbers",
        "agency_prior_success_rate",
    ]
    return df.merge(ringkas[kolom], on=["trekking_agency", "year"], how="left")


def tambah_fitur(df: pd.DataFrame) -> pd.DataFrame:
    """Tambahkan seluruh fitur turunan ke tabel gabungan."""
    hasil = bersihkan_nilai_janggal(df)

    # Ukuran rombongan. `members` dan `hired_staff` berasal dari tabel
    # ekspedisi, jadi nilainya sama untuk semua anggota satu ekspedisi.
    hasil["team_size"] = hasil["members"]
    hasil["hired_staff_count"] = hasil["hired_staff"]

    total_rombongan = hasil["members"] + hasil["hired_staff"]
    hasil["hired_staff_ratio"] = np.where(
        total_rombongan > 0,
        hasil["hired_staff"] / total_rombongan,
        np.nan,
    )

    # Bulan tiba di basecamp. Musim sudah ada sebagai kolom terpisah, tapi
    # bulan lebih halus: dalam satu musim semi, berangkat Maret dan Mei itu
    # beda kondisi.
    tanggal_basecamp = pd.to_datetime(hasil["basecamp_date"], errors="coerce")
    hasil["basecamp_month"] = tanggal_basecamp.dt.month

    # Berapa lama puncak ini sudah pernah didaki orang saat ekspedisi berjalan.
    # Nilai negatif berarti ekspedisi berlangsung sebelum pendakian pertama
    # yang tercatat, jadi memang percobaan ke puncak yang belum tertaklukkan.
    # Itu informasi asli, bukan kesalahan, jadi dibiarkan negatif.
    hasil["peak_age_years"] = hasil["year"] - hasil["first_ascent_year"]

    # Ditulis sebagai 1/0 dengan nilai kosong dipertahankan, bukan sebagai
    # boolean. Perbandingan boolean biasa mengubah 15 baris yang tinggi
    # puncaknya kosong menjadi False, seolah-olah puncaknya pasti di bawah
    # 8000 meter, padahal tingginya memang tidak diketahui.
    tinggi = hasil["height_metres"]
    hasil["is_eight_thousander"] = tinggi.ge(8000).astype(float).where(tinggi.notna())

    return rekam_jejak_agen(hasil)
